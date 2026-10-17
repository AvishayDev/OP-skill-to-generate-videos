#!/bin/bash
# Installs tools the pipeline needs in Claude Code on the web containers.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

command -v ffmpeg >/dev/null 2>&1 || echo "warning: ffmpeg not found" >&2

# faster-whisper: exact word timing of the voiceover (captions, cuts, overlays).
if ! python3 -c 'import faster_whisper, numpy' >/dev/null 2>&1; then
  pip install --quiet --break-system-packages faster-whisper >/dev/null 2>&1 \
    || pip install --quiet faster-whisper >/dev/null 2>&1 \
    || echo "warning: faster-whisper install failed — captions will use estimated timing" >&2
fi

# yt-dlp (+ its YouTube challenge solver): the watch-video skill downloads links the user sends.
if ! python3 -c 'import yt_dlp, yt_dlp_ejs' >/dev/null 2>&1; then
  pip install --quiet --break-system-packages "yt-dlp[default]" >/dev/null 2>&1 \
    || pip install --quiet "yt-dlp[default]" >/dev/null 2>&1 \
    || echo "warning: yt-dlp install failed — watch-video installs it on demand" >&2
fi

# reelkit-cli: renders the code-drawn shots, captions and sound locally (and ships puppeteer-core for the
# canvas shots). Pinned to config/video.json → reelkit.version.
REELKIT_VERSION=$(node -e 'const v=require(process.argv[1]);process.stdout.write((v.reelkit&&v.reelkit.version)||"0.19.1")' "$CLAUDE_PROJECT_DIR/config/video.json" 2>/dev/null || echo 0.19.1)
if [ "$(reelkit --version 2>/dev/null)" != "$REELKIT_VERSION" ]; then
  REELKIT_NO_AUTO_INSTALL=1 npm install -g --silent "reelkit-cli@$REELKIT_VERSION" >/dev/null 2>&1 \
    || echo "warning: reelkit-cli install failed — the pipeline installs it on demand" >&2
fi
