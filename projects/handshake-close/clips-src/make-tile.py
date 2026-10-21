# icon.png → tile.png: the icon with the hands and lines painted out (diffusion inpaint), so the
# tile can grow in behind the drawn hands before they dissolve into the icon.
from PIL import Image, ImageFilter
import numpy as np
im = Image.open('icon.png').convert('RGBA'); a = np.asarray(im).astype(float)
rgb, al = a[..., :3], a[..., 3]
fg = (rgb.mean(-1) > 205) & (al > 250)
mask = np.asarray(Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(21))) > 0
cur = rgb.copy(); cur[mask] = rgb[(~mask) & (al > 250)].mean(0)
opaque = al > 250
for rad in [40] * 30 + [16] * 30 + [6] * 30:
    b = np.asarray(Image.fromarray(np.uint8(np.clip(cur, 0, 255))).filter(ImageFilter.GaussianBlur(rad))).astype(float)
    cur[mask] = b[mask]
Image.fromarray(np.dstack([np.clip(cur, 0, 255), al]).astype(np.uint8), 'RGBA').save('tile.png')
