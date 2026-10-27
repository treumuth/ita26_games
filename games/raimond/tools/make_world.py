"""Builds assets/world.js from the reference island map (tools/world_reference.png)."""
import os, json, numpy as np
from PIL import Image
from matplotlib.colors import rgb_to_hsv
from scipy import ndimage as ndi
from scipy.spatial import cKDTree
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ref=os.path.join(ROOT,'tools','world_reference.png')
im=Image.open(ref).convert('RGB'); a=np.array(im).astype(float)/255
hsv=rgb_to_hsv(a); h=hsv[:,:,0]*360; s=hsv[:,:,1]; lum=a.mean(axis=2)
land_px=(lum>.42)&~((h>195)&(h<250)&(s>.35)&(lum<.62))
glow_px=((h>195)&(h<250)&(s>.35))&~land_px
T=3; H0,W0=land_px.shape; TH,TW=H0//T,W0//T
blk=lambda m: m[:TH*T,:TW*T].reshape(TH,T,TW,T).mean(axis=(1,3))
land=blk(land_px)>.5
land=ndi.binary_closing(land,np.ones((3,3)),iterations=1)
# lakes = enclosed holes; tiny holes get filled
filled=ndi.binary_fill_holes(land); holes=filled&~land
lab,n=ndi.label(holes); lake=np.zeros_like(land)
for i in range(1,n+1):
    m=lab==i
    if m.sum()>=24: lake|=m
land=filled&~lake
lab,n=ndi.label(land)
for i in range(1,n+1):
    if (lab==i).sum()<7: land[lab==i]=False
# ---- biomes (nearest anchor, image px -> tiles)
A={'F':(255,120),'S':(100,100),'D':(480,95),'B':(570,235),'b':(520,390),'C':(105,360),'L':(300,400),'H':(355,235)}
names=list(A); pts=np.array([(A[k][0]/T,A[k][1]/T) for k in names])
ys,xs=np.mgrid[0:TH,0:TW]
d=np.stack([np.hypot(xs-p[0],ys-p[1])*(0.72 if names[i]=='F' else 1.0) for i,p in enumerate(pts)])
bio=np.array(names)[d.argmin(0)]
hub_r=np.hypot(xs-A['H'][0]/T,ys-A['H'][1]/T)
bio[(hub_r<14)]='H'
bio[bio=='b']='B'
# bridges
lab,n=ndi.label(land)
def comp_of(k):
    x,y=int(A[k][0]/T),int(A[k][1]/T)
    best=None
    for dy in range(-12,13):
        for dx in range(-12,13):
            yy,xx=y+dy,x+dx
            if 0<=yy<TH and 0<=xx<TW and lab[yy,xx]: 
                dd=dx*dx+dy*dy
                if best is None or dd<best[0]: best=(dd,lab[yy,xx])
    return best[1]
bridge=np.zeros_like(land); gates={}
def link(k1,k2,gate=None):
    c1,c2=comp_of(k1),comp_of(k2)
    if c1==c2: return
    p1=np.argwhere(lab==c1);p2=np.argwhere(lab==c2)
    tr=cKDTree(p2);dd,ix=tr.query(p1);i=dd.argmin();a_=p1[i];b_=p2[ix[i]]
    n_=int(max(abs(a_[0]-b_[0]),abs(a_[1]-b_[1])))+1; path=[]
    for t in range(n_+1):
        y=int(round(a_[0]+(b_[0]-a_[0])*t/n_));x=int(round(a_[1]+(b_[1]-a_[1])*t/n_))
        for oy in (0,1):
            for ox in (0,1):
                yy,xx=y+oy,x+ox
                if 0<=yy<TH and 0<=xx<TW and not land[yy,xx]: bridge[yy,xx]=True;path.append((xx,yy))
    if gate and path: 
        mid=path[len(path)//2]; gates.setdefault(gate,[]).extend([[x,y] for (x,y) in path if abs(x-mid[0])<=0 and abs(y-mid[1])<=1 or (abs(x-mid[0])<=1 and abs(y-mid[1])<=0)])
    # merge labels
    lab[lab==c2]=c1
link('F','H'); link('H','D','dark'); link('H','B','beach'); link('H','L'); link('L','C','city'); link('B','b' if False else 'B'); link('F','S')
# second beach island (bottom right): connect to lake island
A['b2']=(520,390); 
link('L','b2'); link('F','D')  # extra shortcut paths also locked
# ---- zones
def region_mask(b): return land&(bio==b)&~lake
zones=[]; rect_fit=lambda m,w,hh: ndi.binary_erosion(m,np.ones((hh,w)))
def place(b,w,hh,avoid,mind):
    m=region_mask(b); e=rect_fit(m,w,hh); c=np.argwhere(e)
    if len(c)==0: return None
    cen=np.array([A[b if b in A else 'F'][1]/T,A[b if b in A else 'F'][0]/T])
    best=None
    for (y,x) in c[::3]:
        cx,cy=x,y
        if any(np.hypot(cx-q[0],cy-q[1])<mind for q in avoid): continue
        score=-np.hypot(cy-cen[0],cx-cen[1])*0.0+ (min([np.hypot(cx-q[0],cy-q[1]) for q in avoid]) if avoid else 0)
        if best is None or score>best[0]: best=(score,x,y)
    if best is None: return None
    return best[1]-w//2+w//2 - w//2 + w//2, best[2]
def zone_set(b,spec):
    avoid=[]; out=[]
    m=region_mask(b)
    if m.sum()<60: return out
    dt=ndi.distance_transform_edt(m)
    for (zid,k,w,hh,mind) in spec:
        c=[]
        for shrink in (0,2,4,6):       # shrink the zone until it fits somewhere free
            w2,h2=max(6,w-shrink),max(5,hh-shrink); e=rect_fit(m,w2,h2)
            for r_ in out:
                e[max(0,r_['y']-h2//2-2):r_['y']+r_['h']-h2//2+2+h2, max(0,r_['x']-w2//2-2):r_['x']+r_['w']-w2//2+2+w2]=False
            c=np.argwhere(e)
            if len(c): w,hh=w2,h2; break
        if len(c)==0:
            continue
        if zid.endswith('hub'):
            # centre-most spot: highest distance-transform value
            vals=dt[c[:,0],c[:,1]]; i=vals.argmax(); y,x=c[i]
        else:
            cand=[(y,x) for (y,x) in c if all(np.hypot(x-q[0],y-q[1])>=mind for q in avoid)] or [tuple(q) for q in c]
            cand=np.array(cand); 
            sc=[min(np.hypot(x-q[0],y-q[1]) for q in avoid) if avoid else 0 for (y,x) in cand]
            y,x=cand[int(np.argmax(sc))] if zid.endswith('story') else cand[int(np.argsort(sc)[len(sc)//2])] 
        out.append(dict(id=f'{b}.{zid}',b=b,k=k,x=int(x-w//2),y=int(y-hh//2),w=w,h=hh)); avoid.append((x,y))
    return out
K=1.3
def sc(spec): return [(zid,k,int(w*K),int(hh*K),int(mind*K)) for (zid,k,w,hh,mind) in spec]
SPEC={'F':sc([('hub','safe',16,12,0),('story','story',10,8,14),('mob1','mob',12,12,14),('mob2','mob',12,10,12),('mob3','mob',12,10,12),('item','item',10,8,10),('spot1','spot',8,6,8),('spot2','spot',8,6,8)]),
 'D':sc([('hub','safe',12,9,0),('story','story',14,10,22),('mob1','mob',14,14,20),('mob2','mob',14,12,16),('mob3','mob',12,10,14),('item','item',12,9,14),('spot1','spot',8,6,8),('spot2','spot',8,6,8)]),
 'B':sc([('hub','safe',16,12,0),('story','story',10,9,24),('mob1','mob',14,12,20),('mob2','mob',12,10,14),('item','item',12,9,14),('spot1','spot',8,6,8),('spot2','spot',8,6,8)]),
 'C':sc([('hub','safe',12,9,0),('story','story',10,9,20),('mob1','mob',14,14,18),('mob2','mob',12,10,14),('mob3','mob',12,10,12),('item','item',12,9,12),('spot1','spot',8,6,8)]),
 'S':sc([('hub','safe',12,9,0),('story','story',10,8,18),('mob1','mob',14,12,20),('mob2','mob',12,10,14),('item','item',10,8,12),('spot1','spot',8,6,8)]),
 'L':sc([('hub','safe',12,9,0),('story','story',10,8,16),('mob1','mob',14,12,18),('mob2','mob',12,10,14),('item','item',10,8,12),('spot1','spot',8,6,8)]),
 'H':sc([('hub','safe',10,8,0)])}
for b,spec in SPEC.items(): zones+=zone_set(b,spec)
bd=ndi.binary_dilation(bio=='D',np.ones((3,3)))&(bio=='B')&land
gates['beach']=[[int(x),int(y)] for y,x in np.argwhere(bd)]
# ---- void glow classes
dist=ndi.distance_transform_edt(~(land|bridge|lake))
rows=[]
for y in range(TH):
    r=''
    for x in range(TW):
        if bridge[y,x] and not land[y,x]: r+='='
        elif lake[y,x]: r+='~'
        elif land[y,x]: r+=bio[y,x]
        else: r+=':' if dist[y,x]<=2 else ('.' if dist[y,x]<=5 else ' ')
    rows.append(r)
world=dict(w=TW,h=TH,rows=rows,zones=zones,gates=gates)
open(os.path.join(ROOT,'assets','world.js'),'w').write('const WORLD = '+json.dumps(world,separators=(',',':'))+';\n')
print(TW,TH,'zones',len(zones),'gates',{k:len(v) for k,v in gates.items()})
# preview
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
col={'F':(.3,.8,.6),'S':(.9,.9,1),'D':(.45,.3,.7),'B':(.95,.8,.5),'C':(.9,.4,.7),'L':(.3,.6,.8),'H':(.9,.6,.8)}
img=np.zeros((TH,TW,3))
for y in range(TH):
    for x in range(TW):
        c=rows[y][x]
        if c in col: img[y,x]=col[c]
        elif c=='=': img[y,x]=(.7,.5,.3)
        elif c=='~': img[y,x]=(.1,.2,.6)
        else: img[y,x]=(.03,.03,.08)
fig=plt.figure(figsize=(12,9));plt.imshow(img)
for z in zones:
    plt.gca().add_patch(plt.Rectangle((z['x']-.5,z['y']-.5),z['w'],z['h'],fill=False,ec={'safe':'white','mob':'red','item':'yellow','story':'cyan','spot':'lime'}[z['k']],lw=1.5))
for k,v in gates.items():
    for (x,y) in v: plt.plot(x,y,'k.',ms=3)
plt.savefig('/tmp/world_prev.png',dpi=70,bbox_inches='tight')
