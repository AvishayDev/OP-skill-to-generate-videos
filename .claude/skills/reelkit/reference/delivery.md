---
name: delivery
description: Use when a render is to be sent to someone or opened on a phone - which export preset to use, what makes a file phone-safe, and the checks that must pass before saying it is delivered.
---

# Delivering a film

`out/video.mp4` from this CLI is a master, not a file to send. HyperFrames already writes it as H.264 `yuv420p` in TV range, tagged BT.709: the encoder converts Chrome's full-range capture once, inside its own filter. It is still the wrong file to hand someone. The profile and level are not pinned, so a 1080p master can come out at level 5.0, which older phones refuse, and the size is not a copy that fits in a chat.

`reelkit export` makes the copy. It scales the short side, pins the profile and level 4.0, puts the index at the front, and converts full range to TV range only when the source is full range. A second conversion of a file that is already TV range lifts the blacks, so a master from this CLI is re-encoded without that step. The same command is what fixes an older or foreign file that really is full-range `yuvj420p` with no tags: that is the failure the presets exist for.

```
reelkit export --preset iphone      # 1080p, High profile level 4.0, CRF 18: the full-quality copy
reelkit export --preset phone-720   # 720p, High level 4.0, CRF 20 capped at 4 Mb/s: a lighter phone copy
reelkit export --preset chat        # 720p, Main level 4.0, about 900 kb/s, AAC 128k: small enough for a chat (about 8 MB a minute)
reelkit export --preset chat --out ../film_v14.mp4
reelkit export other.mp4 --verify-only --preset chat   # check a file someone else encoded
```

`reelkit export --preset iphone`, `reelkit export --preset phone-720` and `reelkit export --preset chat` each encode and then verify. `reelkit export other.mp4 --verify-only --preset chat` only checks. The export is good only when every row passes:

| check | why |
|---|---|
| h264, the preset's profile, level at most 4.0 | a level left to the encoder comes out 5.0 at 1080p with many reference frames, which older phones refuse |
| yuv420p, range tv | full range is what plays washed out |
| matrix, transfer, primaries all bt709 | untagged transfer and primaries are guessed by the player |
| frame count equals the source | a dropped or added frame moves every caption after it |
| full decode with zero error lines | the file is whole, not cut off by a crash |
| moov before mdat | the file starts playing before it has fully downloaded |
| aac at 48000 Hz | what every phone plays, when the source has sound |

## If you encode by hand
- Convert the range exactly once. `in_range=full:out_range=tv` applied per segment and again at the join lifts black from #101010 to #1d1d1d. Skip it when the source is already TV range.
- `-color_trc` and `-color_primaries` on the command line are dropped when a `-vf` chain is present. Put `setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709` at the end of the chain, and `-x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709` as well.
- Pin `-profile:v` and `-level:v`; add `-movflags +faststart`; always `-nostdin -y` (an overwrite question hangs a scripted run).
- "Encode exactly like the last version" means reading the last file's settings (ffprobe, and the x264 options string stored in the file), not remembering them.

## Before you say "sent"
The file exists, its size is what you expect, the table passed, and you have looked at one frame from it. Never report a delivery from a command's exit code alone. What to look at in the picture and the sound is in `reference/delivery-review.md`.
