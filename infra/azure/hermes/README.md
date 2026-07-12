# Hermes on Azure

This deployment runs the Hermes API server on a small Azure VM for Cerno's
server-to-server research runtime.

## Why a server is required

The current Cerno repository contains a Hermes architecture plan, not a Hermes
runtime. The planned Runs API (`/v1/runs`) and native `delegate_task` execution
happen in a long-lived Hermes gateway process, so static frontend hosting alone
is insufficient.

## Topology

- **Azure VM:** one `Standard_D2als_v7` Ubuntu host (2 vCPU / 4 GiB)
- **Local managed disk:** durable Hermes `/opt/data` for SQLite and sessions
- **Docker:** official `nousresearch/hermes-agent` image, pinned to the tested digest
- **Caddy:** automatic TLS and reverse proxy to the private container port
- **Azure AI Services:** isolated `gpt-5.4-mini` deployment
- **Managed identity:** keyless Hermes-to-Azure-AI authentication
- **NSG:** public 80/443 only; administrative commands use Azure VM Run Command

Hermes currently needs a normal POSIX filesystem. Azure Files uses SMB and is
not appropriate for Hermes' SQLite WAL databases or s6 log permission changes.
That rules out a straightforward Container Apps + Azure Files deployment.

## Deploy

```bash
./infra/azure/hermes/deploy.sh
```

Common overrides:

```bash
LOCATION=eastus \
RESOURCE_GROUP=cerno-hermes-rg \
VM_SIZE=Standard_D2als_v7 \
MODEL_CAPACITY=50 \
./infra/azure/hermes/deploy.sh
```

The script refuses to replace an existing VM implicitly. The API bearer key is
written only to `/opt/cerno-hermes/hermes.env` on the VM (mode `0600`).

## Verify

```bash
URL=https://cerno-hermes-74d2dc62.eastus.cloudapp.azure.com
KEY="$(./infra/azure/hermes/get-api-key.sh)"

curl "$URL/health"
curl -H "Authorization: Bearer $KEY" "$URL/v1/capabilities"
curl -H "Authorization: Bearer $KEY" "$URL/v1/toolsets"
```

Start an asynchronous smoke run:

```bash
curl -X POST "$URL/v1/runs" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: cerno-smoke-1" \
  -d '{
    "input": "Reply with a one-sentence readiness confirmation.",
    "session_id": "cerno-smoke-1",
    "instructions": "Do not use tools. Be concise."
  }'
```

## Operations

```bash
# Container state and recent logs
az vm run-command invoke -g cerno-hermes-rg -n cerno-hermes-vm \
  --command-id RunShellScript \
  --scripts 'docker ps; docker logs --tail 100 hermes'

# Restart Hermes
az vm run-command invoke -g cerno-hermes-rg -n cerno-hermes-vm \
  --command-id RunShellScript \
  --scripts 'docker restart hermes'

# Stop compute charges when the spike is not needed (the disk still incurs cost)
az vm deallocate -g cerno-hermes-rg -n cerno-hermes-vm
# Bring it back
az vm start -g cerno-hermes-rg -n cerno-hermes-vm
```

Inbound SSH is intentionally closed. Add a narrowly scoped NSG rule only if an
interactive maintenance session is actually needed.

## Security posture

The runtime config exposes only `delegation` and `todo` to API runs. Terminal,
file mutation, browser automation, code execution, cron, generic messaging,
session search, and built-in memory are disabled. The dashboard is not enabled.

The HTTPS endpoint is internet-routable so hosted server-side code can call it.
Its bearer key grants agent execution and must only be held by a trusted backend
such as a Convex action. For production, add network-layer access control or a
private relay in addition to bearer authentication.

## Not implemented yet

This deploys and secures the Hermes runtime, but does not create the planned
Cerno plugin. The following remain before the UI can run a real briefing:

- `.hermes/plugins/cerno/` deterministic tool handlers
- Cerno Director skill and role-specific output contracts
- Convex action that submits/polls Runs API requests
- Convex telemetry sink and Hermes observer hooks
- evidence validation, persistence, and briefing publication services
