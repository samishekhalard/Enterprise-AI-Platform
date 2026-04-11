# ISSUE-INF-005: No Network Policy Enforcement Between Tiers

| Field | Value |
|-------|-------|
| Severity | CRITICAL |
| Category | Security |
| Source | SEC-04 |
| Priority | P0 |
| Status | RESOLVED |
| Opened | 2026-03-02 |
| Blocked By | ISSUE-INF-001 |
| Fixes | docker-compose.dev.yml, docker-compose.staging.yml |
| Closes With | Phase 2 — Docker Tier Split (Docker networks); K8s — NetworkPolicies |

## Description

Docker Compose default bridge networking allows any container to connect to any other container on any port. There are no network policies restricting traffic flow between tiers. In Kubernetes production, NetworkPolicies will be needed to enforce the same segmentation.

## Evidence

- Docker Compose uses default bridge behavior — all containers on same network can communicate freely
- No `internal: true` flag on any network
- No iptables rules or Docker network restrictions configured

## Remediation

**Docker Compose:** Use Docker network segmentation with `internal: true` for data network.
**Kubernetes:** Define NetworkPolicies that restrict pod-to-pod traffic by namespace and label.

## Acceptance Criteria

- [ ] Data tier network is marked `internal: true` (no host access)
- [ ] Frontend containers cannot initiate connections to data tier containers
- [ ] Backend containers can reach data tier but not vice-versa (for new connections)

## Resolution

**Status:** RESOLVED
**Date:** 2026-03-03
**Changed Files:** `docker-compose.dev.yml`, `docker-compose.staging.yml`

### What Changed

Docker network segmentation is now enforced via three named networks per environment:

| Network | `internal` Flag | Effect |
|---------|----------------|--------|
| `ems-{env}-data` | `true` | Containers on this network cannot initiate connections to the Docker host or external networks. Data stores are isolated from outbound access. |
| `ems-{env}-backend` | `false` | Backend services can communicate with each other and with keycloak/mailhog. |
| `ems-{env}-frontend` | `false` | Frontend can only reach api-gateway. |

The `internal: true` flag on the data network is the key enforcement mechanism for Docker Compose. It prevents any container on that network from reaching the host or external networks, while still allowing inter-container communication within the network.

### Kubernetes Production Parity

For Kubernetes production deployment, equivalent enforcement will use `NetworkPolicy` resources:
- `deny-all` default policy per namespace
- `allow-ingress-from-backend` on data namespace
- `allow-ingress-from-frontend` on api-gateway only

This is tracked separately as a Kubernetes deployment task.
