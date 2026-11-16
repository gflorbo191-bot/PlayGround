#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:?OPENCODE_WEB_DIR must point to the worker metadata directory}"
export PORT

timed() {
  /usr/bin/time -p "$@"
}

timed test -f "$PROJECT_DIR/index.html"
timed mkdir -p "$PROJECT_DIR/dist" "$OPENCODE_WEB_DIR"
timed cp "$PROJECT_DIR/index.html" "$PROJECT_DIR/dist/index.html"
timed python3 -c 'import json, os, sys; data={"project":os.path.realpath(sys.argv[1]),"directory":os.path.realpath(sys.argv[2])}; path=sys.argv[3]; tmp=path+".tmp"; open(tmp,"w").write(json.dumps(data)+"\n"); os.replace(tmp,path)' \
  "$PROJECT_DIR" "$PROJECT_DIR/dist" "$OPENCODE_WEB_DIR/deployment-output.json"

# This is a dependency-free static app; its Three.js module is loaded from the page's CDN import.
echo "Serving $PROJECT_DIR/dist on 0.0.0.0:$PORT"
timed python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$PROJECT_DIR/dist"
