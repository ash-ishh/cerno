#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-cerno-hermes-rg}"
VM_NAME="${VM_NAME:-cerno-hermes-vm}"

message="$(az vm run-command invoke \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --command-id RunShellScript \
  --scripts "sed -n 's/^API_SERVER_KEY=/HERMES_API_KEY=/p' /opt/cerno-hermes/hermes.env" \
  --query 'value[0].message' \
  --output tsv)"

key="$(printf '%s\n' "$message" | awk -F= '/^HERMES_API_KEY=/{print $2; exit}')"
if [[ -z "$key" ]]; then
  echo "Could not retrieve API_SERVER_KEY from $RESOURCE_GROUP/$VM_NAME" >&2
  exit 1
fi
printf '%s\n' "$key"
