import sys,glob,os,numpy as np,onnxruntime as ort
from PIL import Image
S=sys.argv[1]
sess=ort.InferenceSession(S+'/models/modnet.onnx',providers=['CPUExecutionProvider'])
fs=sorted(glob.glob(S+'/fr/*.jpg'))
prev=None
for f in fs:
    im=np.asarray(Image.open(f).convert('RGB'),np.float32)/127.5-1
    x=im.transpose(2,0,1)[None]
    m=sess.run(None,{'input':x})[0][0,0]
    if prev is not None: m=0.6*m+0.4*prev
    prev=m
    Image.fromarray((np.clip(m,0,1)*255).astype(np.uint8)).resize((1080,1920),Image.BILINEAR).save(S+'/matte/'+os.path.basename(f).replace('.jpg','.png'))
print('done',len(fs))
