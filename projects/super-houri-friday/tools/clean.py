import sys,numpy as np
from collections import deque
from PIL import Image, ImageFilter
S=sys.argv[1]
def largest(b):
    H,W=b.shape; lab=np.zeros_like(b,np.int32); best=(0,0); k=0
    for y in range(H):
        for x in range(W):
            if b[y,x] and not lab[y,x]:
                k+=1; q=deque([(y,x)]); lab[y,x]=k; c=0
                while q:
                    cy,cx=q.popleft(); c+=1
                    for ny,nx in ((cy+1,cx),(cy-1,cx),(cy,cx+1),(cy,cx-1)):
                        if 0<=ny<H and 0<=nx<W and b[ny,nx] and not lab[ny,nx]: lab[ny,nx]=k; q.append((ny,nx))
                if c>best[0]: best=(c,k)
    return lab==best[1]
for a,b in [(1,64),(838,897)]:
  for n in range(a,b+1):
    p=f'{S}/matte/{n:04d}.png'; im=Image.open(p).convert('L'); m=np.asarray(im,np.float32)/255
    small=np.asarray(im.resize((135,240)),np.float32)/255>0.5
    keep=Image.fromarray((largest(small)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).resize((1080,1920),Image.BILINEAR).filter(ImageFilter.GaussianBlur(4))
    m=m*(np.asarray(keep,np.float32)/255)
    Image.fromarray((np.clip(m,0,1)*255).astype(np.uint8)).save(p)
print('ok')
