# LAB Review — bundle structure (row 24)

Run from the bundle root after `ent bundle init` (step 0) and step 1.

## Folder responsibilities

| Path | Owner | Contents |
|---|---|---|
| `entando.json` | CLI + developer | Single bundle descriptor: name, version, components, services |
| `microservices/` | `ent bundle ms add` | One folder per microservice (one Docker image each) |
| `microfrontends/` | `ent bundle mfe add` | One folder per micro frontend (packed into the bundle image) |
| `svc/` | `ent bundle svc enable` | Docker Compose files for local auxiliary services |
| `platform/` | developer | Optional platform components (pages, fragments, static resources) |
| `.entando/` | CLI | Working directory and build output; git-ignored |
| `thumbnail.(png\|jpg)` | developer | Optional Hub thumbnail, ≤ 100 KB |

## Checklist

- [ ] `ent bundle info` prints name `training26`, version and description
- [ ] Bundle name uses only lowercase letters, digits, `.` and `-`
- [ ] `ent bundle pack --skip-docker-build --org <org>` completes and writes
      `.entando/output/descriptors/descriptor.yaml` and `.entando/output/Dockerfile`
- [ ] `.entando/`, `**/node_modules`, `**/target`, `**/build`, `**/dist` are git-ignored
- [ ] `git status` is clean after the pack
