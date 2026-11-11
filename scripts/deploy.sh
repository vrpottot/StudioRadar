#!/usr/bin/env bash
# Install dependencies before stopping the service; preserve runtime JSON and .env.
set -Eeuo pipefail
umask 077
release=$(realpath "$1")
app=${2:-/var/www/studioradar}
backup_dir=${3:-/var/backups/studioradar}
backup_ready=0
service_stopped=0
mkdir -p "$app" "$backup_dir"
backup="$backup_dir/$(date -u +%Y%m%dT%H%M%SZ)-$$.tar.gz"

finish() {
  status=$?
  trap - EXIT
  if [ "$status" -ne 0 ]; then
    if [ "$backup_ready" = 1 ]; then
      echo 'Deployment failed; restoring previous files.'
      tar -xzf "$backup" -C "$app"
    fi
    if [ "$service_stopped" = 1 ]; then systemctl restart studioradar || true; fi
  fi
  rm -rf "$release"
  exit "$status"
}
trap finish EXIT

(cd "$release/backend" && npm ci --omit=dev)
(cd "$release/ai" && npm ci --omit=dev)

systemctl stop studioradar
service_stopped=1
# Existing code, dependencies, keys and runtime data can all be restored together.
tar -czf "$backup" -C "$app" backend ai frontend
backup_ready=1

cp -a "$release/backend/." "$app/backend/"
cp -a "$release/ai/." "$app/ai/"
cp -a "$release/frontend/." "$app/frontend/"
for name in leads pipelines settings; do
  if [ ! -f "$app/backend/$name.json" ]; then
    cp "$release/bootstrap/$name.json" "$app/backend/$name.json"
  fi
done
# .env remains the server's configuration. Never write provider keys from source code.
nginx -t
systemctl restart studioradar
for attempt in $(seq 1 15); do
  if systemctl is-active --quiet studioradar && curl -fsS http://127.0.0.1:8001/ > /dev/null; then
    service_stopped=0
    echo 'StudioRadar deployment and API health check succeeded.'
    echo "Backup: $backup"
    exit 0
  fi
  sleep 2
done
echo 'Backend did not become healthy.' >&2
exit 1
