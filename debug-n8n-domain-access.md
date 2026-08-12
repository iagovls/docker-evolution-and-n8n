[OPEN] Debug session: n8n-domain-access

# Symptom
- Cannot access `https://n8n.vilisystem.com.br`

# Expected
- Public hostname resolves and serves the local `n8n` instance through Cloudflare Tunnel.

# Hypotheses
- H1: The `cloudflared` container is not running or is failing to authenticate with the tunnel token.
- H2: The public hostname is not mapped to the tunnel correctly in Cloudflare.
- H3: The local upstream target for the tunnel is wrong or unreachable from `cloudflared`.
- H4: The `n8n` container is unhealthy or not listening on the expected port.
- H5: DNS or Cloudflare propagation is incomplete, so the hostname is not yet routable.

# Evidence Plan
- Inspect `docker compose ps`
- Inspect `cloudflared` logs
- Inspect `n8n` logs
- Test local reachability on `localhost:5678`
- Test public DNS and HTTPS reachability for `n8n.vilisystem.com.br`

# Status
- Session opened; collecting runtime evidence.

# Evidence Collected
- `docker compose ps`: `cloudflared`, `n8n`, and dependencies are all up.
- `docker compose logs cloudflared`: tunnel authenticated and connected successfully.
- `docker compose logs cloudflared`: ingress version `1` used `http://n8n:5678`, but version `2` was updated to `http://localhost:5678`.
- `docker compose logs n8n`: editor advertises `https://n8n.vilisystem.com.br` and app is listening on port `5678`.
- Local HTTP test to `http://localhost:5678/` returned `200`.
- Public DNS lookup for `n8n.vilisystem.com.br` returned `NXDOMAIN` via local resolver, `1.1.1.1`, and `8.8.8.8`.
- `NS` for `vilisystem.com.br` points to Cloudflare (`ben.ns.cloudflare.com`, `simone.ns.cloudflare.com`).
- Direct query to Cloudflare authoritative nameservers confirms `n8n.vilisystem.com.br` is `NXDOMAIN` (record missing in Cloudflare DNS).
- Cloudflare Tunnel configuration (remote_config) shows ingress for `n8n.vilisystem.com.br` -> `http://n8n:5678` (correct).

# Hypothesis Status
- H1 rejected: tunnel process is running and connected to Cloudflare.
- H2 confirmed: public hostname is not currently published in public DNS.
- H3 confirmed: latest tunnel ingress target was changed to `http://localhost:5678`, which is incorrect for the `cloudflared` container.
- H4 rejected: `n8n` is healthy and reachable locally.
- H5 confirmed: DNS is not propagated because the hostname does not exist publicly yet.

# Current Root Cause
- The hostname `n8n.vilisystem.com.br` is not resolving publicly at all.
- Even after DNS is fixed, the current tunnel target `http://localhost:5678` will still fail from inside `cloudflared`; it should target `http://n8n:5678`.
