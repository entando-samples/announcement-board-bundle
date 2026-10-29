# Runbook — build, publish, deploy and install (row 25)

Reference: https://developer.entando.com/v7.5/docs/getting-started/ent-bundle.html

## 0. Prerequisites

- `ent` activated for 7.5 and attached to the target instance
  (for example `ent attach-kubeconfig <file>` or `ent attach-vm <name>`).
  `ent bundle api` and `ent bundle deploy/install` need the attachment.
- Logged in to the container registry (`docker login <registry>`).
- Microservices listen on port **8081** in the cluster.

## 1. Build

| Command | Effect |
|---|---|
| `ent bundle build --all` | Builds every MS and MFE (`mvn clean package -DskipTests`, `npm install && npm run build`) |
| `ent bundle build announcement-ms` | Builds one component |
| `--stdout` | Logs to the console instead of `.entando/logs` |

## 2. Pack

`ent bundle pack --org <docker-org>` builds the bundle image plus one image per
microservice. `--skip-docker-build` stops after writing the descriptors and the
Dockerfile to `.entando/output` — use it as a fast descriptor validation.
`ent bundle images` lists the resulting image names and tags.

## 3. Publish

`ent bundle publish --org <docker-org> [--registry <registry>]` pushes the
images. The tag is the bundle `version` from `entando.json`; bump it for every
publish that should be installed as an update.

## 4. Deploy to the Local Hub

`ent bundle deploy` registers the published bundle in the Local Hub (ECR) of
the attached instance. In App Builder: *Hub → Local Hub* shows it as deployed.

## 5. Install

`ent bundle install` installs it. When the bundle is already installed, add
`--conflict-strategy=CREATE|SKIP|OVERRIDE`. Installation creates:

- one Kubernetes deployment, service and ingress path per microservice;
- one Keycloak client per microservice (plus declared `roles`);
- the widgets in App Builder (*Components → MFE & Widgets*).

## 6. Verify

- `ent kubectl get pods` — MS pod `Running` and `Ready` (health check passes)
- `ent kubectl describe ingress` — host and path of the MS
- `curl <host>/<ms-path>/api/health` → `{"status":"UP"}`
- Widgets appear in App Builder and render on a published page

## 7. Uninstall / redeploy

`ent ecr uninstall` (or App Builder *Uninstall*), then deploy and install a new version.

## Note on the row-25 demo

An empty bundle validates (`pack --skip-docker-build`) but installing it shows
nothing. Use a reference bundle for the demo, or wait until step 13 for the
first real deployment.
