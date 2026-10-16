#!/bin/zsh
# composite.sh · lay the transparent doodle frames over a real clip and mix the sound.
#   1) node ../render.mjs video_overlay.html --keep-frames   -> out/video_overlay-frames/*.png (RGBA) + out/video_overlay.wav
#   2) ./composite.sh my_clip.mp4                             -> out/video_overlay_final.mp4
# The clip is cover-cropped to 1080x1920 @ 24 fps. If it has speech, the speech stays on top:
# the doodle score is ducked under it (sidechain) and mixed below, then limited.
set -e
cd "${0:A:h}"
SRC=${1:?usage: ./composite.sh my_clip.mp4}
FR=out/video_overlay-frames
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$SRC" | grep -q .; then
  AUD="[0:a]aresample=48000,asplit=2[sp][key];[2:a]volume=0.8[fx0];[fx0][key]sidechaincompress=threshold=0.04:ratio=5:attack=8:release=250:makeup=1[fx];[sp][fx]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.93[a]"
else
  AUD="[2:a]anull[a]"
fi
ffmpeg -v error -y -i "$SRC" -framerate 24 -i $FR/%05d.png -i out/video_overlay.wav -filter_complex "\
[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=24[bg];\
[bg][1:v]overlay=0:0:format=auto:shortest=1,format=yuv420p[v];$AUD" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out/video_overlay_final.mp4
ffprobe -v error -show_entries stream=codec_type,width,height,duration -of csv=p=0 out/video_overlay_final.mp4
