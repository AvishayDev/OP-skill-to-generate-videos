#!/usr/bin/env bash
# Installs the pinned Blender LTS (config/video.json → blender.version) into /opt, plus the Mesa EGL libraries that
# let EEVEE render headless on the CPU (llvmpipe). Idempotent; ~380 MB download, a few seconds in the cloud container.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
VER="$(node -e "console.log(require('$ROOT/config/video.json').blender?.version ?? '4.5.14')")"
MAJ="${VER%.*}"
DIR="/opt/blender-$VER-linux-x64"
if [ ! -x "$DIR/blender" ]; then
  echo "Installing Blender $VER…"
  TMP="$(mktemp -d)"
  curl -fsSL -o "$TMP/b.tar.xz" "https://download.blender.org/release/Blender$MAJ/blender-$VER-linux-x64.tar.xz"
  tar -xf "$TMP/b.tar.xz" -C /opt
  rm -rf "$TMP"
fi
if ! ldconfig -p | grep -q libEGL.so.1; then
  (apt-get install -y -q libegl1 libgl1-mesa-dri libegl-mesa0 libgles2 libxkbcommon0 >/dev/null 2>&1 \
    || (apt-get update -q >/dev/null 2>&1 && apt-get install -y -q libegl1 libgl1-mesa-dri libegl-mesa0 libgles2 libxkbcommon0 >/dev/null 2>&1)) \
    || echo "⚠ Mesa EGL not installed — EEVEE is unavailable, Cycles still works"
fi
"$DIR/blender" --version | head -1
