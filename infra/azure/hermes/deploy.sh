#!/usr/bin/env bash
set -euo pipefail

# Deploy Hermes to a small Azure VM. Hermes uses SQLite WAL and s6 POSIX log
# permissions, so its writable state must live on a normal local filesystem
# rather than an Azure Files SMB mount.

LOCATION="${LOCATION:-eastus}"
RESOURCE_GROUP="${RESOURCE_GROUP:-cerno-hermes-rg}"
VM_NAME="${VM_NAME:-cerno-hermes-vm}"
VM_SIZE="${VM_SIZE:-Standard_D2als_v7}"
ADMIN_USER="${ADMIN_USER:-azureuser}"
VNET_NAME="${VNET_NAME:-cerno-hermes-vnet}"
SUBNET_NAME="${SUBNET_NAME:-default}"
NSG_NAME="${NSG_NAME:-cerno-hermes-nsg}"
PUBLIC_IP_NAME="${PUBLIC_IP_NAME:-cerno-hermes-ip}"
NIC_NAME="${NIC_NAME:-cerno-hermes-nic}"
MODEL_DEPLOYMENT="${MODEL_DEPLOYMENT:-gpt-5.4-mini}"
MODEL_VERSION="${MODEL_VERSION:-2026-03-17}"
MODEL_CAPACITY="${MODEL_CAPACITY:-50}"
# Pin the exact multi-arch image validated by the deployment smoke tests.
HERMES_IMAGE="${HERMES_IMAGE:-docker.io/nousresearch/hermes-agent@sha256:6ead019e9d57160935bebb5800ed5e481ddaa8340c582be84f42951c6ec26ee7}"
CADDY_IMAGE="${CADDY_IMAGE:-docker.io/library/caddy:2.10-alpine}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUBSCRIPTION_ID="$(az account show --query id -o tsv)"
SUFFIX="$(printf '%s' "${SUBSCRIPTION_ID}:${RESOURCE_GROUP}" | shasum -a 256 | cut -c1-8)"
AI_ACCOUNT="${AI_ACCOUNT:-cerno-hermes-ai-${SUFFIX}}"
DNS_LABEL="${DNS_LABEL:-cerno-hermes-${SUFFIX}}"
HOSTNAME="${DNS_LABEL}.${LOCATION}.cloudapp.azure.com"
API_SERVER_KEY="${API_SERVER_KEY:-$(openssl rand -hex 32)}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
log() { printf '\n==> %s\n' "$*"; }

if az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --output none 2>/dev/null; then
  echo "VM $RESOURCE_GROUP/$VM_NAME already exists; refusing to replace it implicitly." >&2
  echo "Delete it first or set VM_NAME to deploy another instance." >&2
  exit 1
fi

log "Using subscription ${SUBSCRIPTION_ID}"
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --tags app=cerno component=hermes managed-by=azure-cli \
  --output none

log "Creating an isolated Azure AI resource and model deployment"
if ! az cognitiveservices account show \
  --name "$AI_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --output none 2>/dev/null; then
  az cognitiveservices account create \
    --name "$AI_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --kind AIServices \
    --sku S0 \
    --custom-domain "$AI_ACCOUNT" \
    --yes \
    --output none
fi
az cognitiveservices account deployment create \
  --name "$AI_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --deployment-name "$MODEL_DEPLOYMENT" \
  --model-format OpenAI \
  --model-name gpt-5.4-mini \
  --model-version "$MODEL_VERSION" \
  --sku-name GlobalStandard \
  --sku-capacity "$MODEL_CAPACITY" \
  --output none

log "Creating network resources"
az network vnet create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VNET_NAME" \
  --location "$LOCATION" \
  --address-prefixes 10.42.0.0/16 \
  --subnet-name "$SUBNET_NAME" \
  --subnet-prefixes 10.42.0.0/24 \
  --output none
az network nsg create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$NSG_NAME" \
  --location "$LOCATION" \
  --output none
for spec in "110:AllowHttp:80" "120:AllowHttps:443"; do
  priority="${spec%%:*}"
  rest="${spec#*:}"
  rule="${rest%%:*}"
  port="${rest##*:}"
  az network nsg rule create \
    --resource-group "$RESOURCE_GROUP" \
    --nsg-name "$NSG_NAME" \
    --name "$rule" \
    --priority "$priority" \
    --access Allow \
    --protocol Tcp \
    --direction Inbound \
    --source-address-prefixes Internet \
    --source-port-ranges '*' \
    --destination-address-prefixes '*' \
    --destination-port-ranges "$port" \
    --output none
done
az network public-ip create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$PUBLIC_IP_NAME" \
  --location "$LOCATION" \
  --sku Standard \
  --allocation-method Static \
  --dns-name "$DNS_LABEL" \
  --output none
az network nic create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$NIC_NAME" \
  --location "$LOCATION" \
  --vnet-name "$VNET_NAME" \
  --subnet "$SUBNET_NAME" \
  --network-security-group "$NSG_NAME" \
  --public-ip-address "$PUBLIC_IP_NAME" \
  --output none

sed "s/__AZURE_AI_ACCOUNT__/${AI_ACCOUNT}/g" \
  "$SCRIPT_DIR/config.yaml" > "$TMP_DIR/config.yaml"
cat > "$TMP_DIR/hermes.env" <<ENV
API_SERVER_ENABLED=true
API_SERVER_HOST=0.0.0.0
API_SERVER_PORT=8642
API_SERVER_MODEL_NAME=cerno-director
API_SERVER_KEY=${API_SERVER_KEY}
HERMES_ENABLE_PROJECT_PLUGINS=false
ENV
cat > "$TMP_DIR/Caddyfile" <<CADDY
${HOSTNAME} {
  reverse_proxy hermes:8642
}
CADDY

b64() { base64 < "$1" | tr -d '\n'; }
cat > "$TMP_DIR/cloud-init.yaml" <<CLOUD
#cloud-config
package_update: true
package_upgrade: false
packages:
  - docker.io
write_files:
  - path: /opt/cerno-hermes/data/config.yaml
    permissions: '0644'
    encoding: b64
    content: $(b64 "$TMP_DIR/config.yaml")
  - path: /opt/cerno-hermes/data/SOUL.md
    permissions: '0644'
    encoding: b64
    content: $(b64 "$SCRIPT_DIR/SOUL.md")
  - path: /opt/cerno-hermes/hermes.env
    permissions: '0600'
    encoding: b64
    content: $(b64 "$TMP_DIR/hermes.env")
  - path: /opt/cerno-hermes/Caddyfile
    permissions: '0644'
    encoding: b64
    content: $(b64 "$TMP_DIR/Caddyfile")
runcmd:
  - [systemctl, enable, --now, docker]
  - [docker, network, create, cerno]
  - [docker, pull, "${HERMES_IMAGE}"]
  - [docker, run, -d, --name, hermes, --network, cerno, --restart, unless-stopped, --env-file, /opt/cerno-hermes/hermes.env, -v, /opt/cerno-hermes/data:/opt/data, "${HERMES_IMAGE}", gateway, run]
  - [docker, pull, "${CADDY_IMAGE}"]
  - [docker, run, -d, --name, caddy, --network, cerno, --restart, unless-stopped, -p, "80:80", -p, "443:443", -v, /opt/cerno-hermes/Caddyfile:/etc/caddy/Caddyfile:ro, -v, /opt/cerno-hermes/caddy-data:/data, -v, /opt/cerno-hermes/caddy-config:/config, "${CADDY_IMAGE}"]
CLOUD

log "Creating ${VM_SIZE} VM with local durable state"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --location "$LOCATION" \
  --nics "$NIC_NAME" \
  --image Ubuntu2404 \
  --size "$VM_SIZE" \
  --admin-username "$ADMIN_USER" \
  --generate-ssh-keys \
  --assign-identity \
  --os-disk-size-gb 64 \
  --storage-sku StandardSSD_LRS \
  --custom-data "$TMP_DIR/cloud-init.yaml" \
  --output none

PRINCIPAL_ID="$(az vm show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --query identity.principalId -o tsv)"
AI_RESOURCE_ID="$(az cognitiveservices account show \
  --name "$AI_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --query id -o tsv)"
az role assignment create \
  --assignee-object-id "$PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Cognitive Services OpenAI User" \
  --scope "$AI_RESOURCE_ID" \
  --output none

BASE_URL="https://${HOSTNAME}"
log "Waiting for cloud-init, Hermes, and automatic HTTPS"
healthy=false
for _ in $(seq 1 180); do
  if curl --fail --silent --show-error --max-time 10 "$BASE_URL/health" > "$TMP_DIR/health.json" 2>/dev/null; then
    healthy=true
    break
  fi
  sleep 5
done
if [[ "$healthy" != true ]]; then
  echo "Hermes did not become healthy. Inspect with Azure VM Run Command:" >&2
  echo "  az vm run-command invoke -g ${RESOURCE_GROUP} -n ${VM_NAME} --command-id RunShellScript --scripts 'cloud-init status --long; docker ps -a; docker logs hermes; docker logs caddy'" >&2
  exit 1
fi

curl --fail --silent --show-error \
  -H "Authorization: Bearer ${API_SERVER_KEY}" \
  "$BASE_URL/v1/capabilities" > "$TMP_DIR/capabilities.json"

cat <<EOF

Deployment complete.
  URL:              ${BASE_URL}
  Health:           $(cat "$TMP_DIR/health.json")
  VM:               ${RESOURCE_GROUP}/${VM_NAME} (${VM_SIZE})
  Azure AI account: ${AI_ACCOUNT}
  Model deployment: ${MODEL_DEPLOYMENT}

The bearer key is stored only in the VM's root-readable env file.
Retrieve it through Azure VM Run Command when wiring a server-side caller:
  ./infra/azure/hermes/get-api-key.sh

Do not expose that key in browser code or enable CORS.
EOF
