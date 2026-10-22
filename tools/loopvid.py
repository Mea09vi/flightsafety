"""ทำวิดีโอปกวนซ้ำ: (ถ้ามี --blur) ติดตามห้องนักบินแล้วเบลอ, เล่นไป-กลับ, 1280x720 H.264 ไม่มีเสียง"""
import subprocess, sys, numpy as np
from PIL import Image, ImageFilter, ImageDraw
src, dst = sys.argv[1], sys.argv[2]
blur = '--blur' in sys.argv
p = subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',src],capture_output=True,text=True)
W,H = map(int,p.stdout.strip().split(','))
raw = subprocess.run(['ffmpeg','-v','error','-i',src,'-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
F = np.frombuffer(raw,np.uint8).reshape(-1,H,W,3)
n = len(F); print(src, F.shape)
if blur:
    g = F[:, ::2, ::2].mean(axis=3).astype(np.float32)
    ty0,ty1,tx0,tx1 = 200,270,450,600  # จมูก+ห้องนักบิน (พิกัดครึ่ง)
    T = g[0,ty0:ty1,tx0:tx1]; T = T - T.mean()
    pos=[(0,0)]; dx0=dy0=0
    for i in range(1,n):
        best=None
        for dy in range(dy0-6,dy0+7):
            for dx in range(dx0-6,dx0+7):
                R = g[i,ty0+dy:ty1+dy,tx0+dx:tx1+dx]; R = R - R.mean()
                s = ((R-T)**2).mean()
                if best is None or s<best[0]: best=(s,dx,dy)
        dx0,dy0 = best[1],best[2]; pos.append((dx0,dy0))
    pos = np.array(pos,float)*2
    # ทำให้เรียบ
    k = np.ones(9)/9; pad = np.pad(pos,((4,4),(0,0)),mode='edge')
    pos = np.stack([np.convolve(pad[:,j],k,'valid') for j in range(2)],1)
    print('track dx', pos[::20,0].round(1).tolist(), 'dy', pos[::20,1].round(1).tolist())
    cx,cy,rx,ry = 1065,437,95,55
    out=[]
    for i in range(n):
        im = Image.fromarray(F[i]); x=cx+pos[i,0]; y=cy+pos[i,1]
        box=(int(x-rx-30),int(y-ry-30),int(x+rx+30),int(y+ry+30))
        reg = im.crop(box); bl = reg.filter(ImageFilter.GaussianBlur(14))
        m = Image.new('L',reg.size,0); ImageDraw.Draw(m).ellipse((30,30,30+2*rx,30+2*ry),fill=255)
        m = m.filter(ImageFilter.GaussianBlur(12))
        im.paste(bl,box[:2],m); out.append(np.asarray(im))
    F = np.stack(out)
# เดินหน้าแล้วถอยหลัง (ping-pong) กล้องดันเข้าแล้วถอยออก ไม่มีภาพซ้อน; ไม่ซ้ำเฟรมปลายทั้งสองข้าง
O = np.concatenate([F, F[-2:0:-1]])
L = len(O)
Image.fromarray(O[0]).save(dst.replace('.mp4','_f0.png'))
enc = subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','24','-i','-',
  '-vf','scale=1280:-2:flags=lanczos,crop=1280:720','-c:v','libx264','-preset','slow','-crf',sys.argv[3] if len(sys.argv)>3 and sys.argv[3].isdigit() else '25',
  '-pix_fmt','yuv420p','-profile:v','high','-an','-movflags','+faststart',dst],stdin=subprocess.PIPE)
for fr in O: enc.stdin.write(fr.tobytes())
enc.stdin.close(); enc.wait()
print('frames', L, 'secs', L/24)
