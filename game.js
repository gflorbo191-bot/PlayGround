// ============================================================
//  SUVU KESÄ — Perajin Mobil Musim Panas (homage to My Summer Car)
//  First-person · rakit mobil · isi bensin · starter · nyambang ke kauppa
// ============================================================
import * as THREE from './vendor/three.module.js';

// ---------- dev params ----------
const Q = new URLSearchParams(location.search);
const DEV = Q.get('dev') === '1';
const DEV_DRIVE = Q.get('drive') === '1';

// ============================================================
// 0. RENDERER / SCENE / CAMERA
// ============================================================
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd6e2e6, 70, 420);

const camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, 0.08, 900);
camera.rotation.order = 'YXZ';
scene.add(camera);

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0xbdd3e0, 0x4a5238, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe6bd, 2.3);
sun.position.set(40, 62, -28);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;   sun.shadow.camera.bottom = -70;
sun.shadow.camera.near = 1;   sun.shadow.camera.far = 220;
sun.shadow.bias = -0.0004;
scene.add(sun); scene.add(sun.target);

// ============================================================
// 1. PROCEDURAL TEXTURES
// ============================================================
function tex(size, fn, repeat=[1,1]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); fn(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.repeat.set(repeat[0], repeat[1]);
  return t;
}
const R = (a,b) => a + Math.random()*(b-a);

function speckle(g, s, n, colors, min=1, max=2.4) {
  for (let i=0;i<n;i++){
    g.fillStyle = colors[(Math.random()*colors.length)|0];
    g.globalAlpha = R(.15,.55);
    g.beginPath(); g.arc(R(0,s), R(0,s), R(min,max), 0, 7); g.fill();
  }
  g.globalAlpha = 1;
}

const grassTex = tex(512, (g,s)=>{
  g.fillStyle = '#5a7c30'; g.fillRect(0,0,s,s);
  speckle(g,s,5200,['#4d6e26','#698b3a','#54742c','#77934a','#3f5e20']);
  g.lineWidth = 1.4;
  for (let i=0;i<900;i++){
    const x=R(0,s), y=R(0,s), l=R(4,11), a=R(-.5,.5)-Math.PI/2;
    g.strokeStyle = Math.random()<.5 ? 'rgba(38,66,18,.55)' : 'rgba(133,160,86,.5)';
    g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l, y+Math.sin(a)*l); g.stroke();
  }
  for (let i=0;i<26;i++){
    g.fillStyle='rgba(96,74,44,.4)'; g.beginPath();
    g.arc(R(0,s),R(0,s),R(4,14),0,7); g.fill();
  }
},[90,90]);

const dirtTex = tex(512, (g,s)=>{
  g.fillStyle = '#7a6544'; g.fillRect(0,0,s,s);
  speckle(g,s,4000,['#6b573a','#8a7452','#5e4c31','#967f5d','#7d6a47']);
  g.globalAlpha=.28; g.fillStyle='#4c3d26';
  g.fillRect(s*.18,0,s*.13,s); g.fillRect(s*.66,0,s*.14,s);
  g.globalAlpha=.18; g.fillStyle='#a08a63';
  g.fillRect(s*.36,0,s*.1,s); g.fillRect(s*.55,0,s*.06,s);
  g.globalAlpha=1;
  for (let i=0;i<40;i++){
    g.fillStyle='rgba(60,50,35,.6)'; g.beginPath(); g.arc(R(0,s),R(0,s),R(1,3),0,7); g.fill();
  }
  for (let i=0;i<120;i++){
    const x=R(0,s),y=R(0,s); g.strokeStyle='rgba(90,120,50,.5)';
    g.beginPath(); g.moveTo(x,y); g.lineTo(x+R(-2,2), y-R(3,7)); g.stroke();
  }
},[1,14]);

const concreteTex = tex(512,(g,s)=>{
  g.fillStyle='#96938c'; g.fillRect(0,0,s,s);
  speckle(g,s,3800,['#8a8781','#a3a09a','#7e7b75','#aba89f']);
  g.strokeStyle='rgba(70,68,62,.5)'; g.lineWidth=1.5;
  for (let i=0;i<7;i++){
    let x=R(0,s), y=R(0,s); g.beginPath(); g.moveTo(x,y);
    for (let j=0;j<6;j++){ x+=R(-40,40); y+=R(10,50); g.lineTo(x,y); } g.stroke();
  }
  g.strokeStyle='rgba(55,53,48,.35)';
  g.strokeRect(s*.02,s*.02,s*.96,s*.96);
},[3,3]);

const houseWoodTex = tex(512,(g,s)=>{
  const plank = s/8;
  for (let p=0;p<8;p++){
    g.fillStyle = p%2 ? '#8a4030' : '#84402f';
    g.fillRect(0,p*plank,s,plank);
    g.globalAlpha=.25; g.fillStyle='#6d3325'; g.fillRect(0,p*plank,s,3);
    g.globalAlpha=.18; g.fillStyle='#a05a42'; g.fillRect(0,p*plank+4,s,2);
    g.globalAlpha=1;
    g.strokeStyle='rgba(60,25,18,.7)'; g.lineWidth=2;
    g.strokeRect(-2,p*plank+1,s+4,plank-2);
    for (let i=0;i<26;i++){
      const y=p*plank+R(6,plank-6);
      g.strokeStyle='rgba(255,190,160,'+R(.03,.1).toFixed(2)+')'; g.lineWidth=1;
      g.beginPath(); g.moveTo(R(0,s*.6),y); g.lineTo(R(s*.5,s),y+R(-2,2)); g.stroke();
    }
  }
},[4,2]);

const grayWoodTex = tex(512,(g,s)=>{
  const plank = s/8;
  for (let p=0;p<8;p++){
    g.fillStyle = p%2 ? '#6d5c47' : '#66553f';
    g.fillRect(0,p*plank,s,plank);
    g.globalAlpha=.3; g.fillStyle='#4e4131'; g.fillRect(0,p*plank,s,3);
    g.globalAlpha=1;
    g.strokeStyle='rgba(40,32,22,.7)'; g.lineWidth=2;
    g.strokeRect(-2,p*plank+1,s+4,plank-2);
    for (let i=0;i<24;i++){
      const y=p*plank+R(6,plank-6);
      g.strokeStyle='rgba(190,170,140,'+R(.04,.12).toFixed(2)+')'; g.lineWidth=1;
      g.beginPath(); g.moveTo(R(0,s*.6),y); g.lineTo(R(s*.5,s),y+R(-2,2)); g.stroke();
    }
  }
},[3,2]);

const roofTex = tex(512,(g,s)=>{
  g.fillStyle='#3c444d'; g.fillRect(0,0,s,s);
  const step=40;
  for (let x=0;x<s;x+=step){
    const gr=g.createLinearGradient(x,0,x+step,0);
    gr.addColorStop(0,'#4d565f'); gr.addColorStop(.5,'#5c646d'); gr.addColorStop(1,'#31383f');
    g.fillStyle=gr; g.fillRect(x,0,step,s);
  }
  speckle(g,s,700,['#7a838c','#2c333a']);
  g.globalAlpha=.25; g.fillStyle='#20262b';
  for (let y=0;y<s;y+=s/6) g.fillRect(0,y,s,4);
  g.globalAlpha=1;
},[6,4]);

const brickTex = tex(512,(g,s)=>{
  g.fillStyle='#b3aa9c'; g.fillRect(0,0,s,s);
  const bh=s/16, bw=s/8;
  for (let r=0;r<16;r++){
    const off = (r%2)*bw/2;
    for (let c=-1;c<9;c++){
      const hue = 18+R(-6,6);
      g.fillStyle=`hsl(${hue},${R(28,40)|0}%,${R(32,44)|0}%)`;
      g.fillRect(c*bw+off+3, r*bh+3, bw-6, bh-6);
      g.fillStyle='rgba(255,255,255,.06)'; g.fillRect(c*bw+off+3, r*bh+3, bw-6, 3);
    }
  }
  speckle(g,s,900,['rgba(0,0,0,.15)','rgba(255,255,255,.1)']);
},[5,3]);

const barkTex = tex(256,(g,s)=>{
  g.fillStyle='#5b4632'; g.fillRect(0,0,s,s);
  for (let i=0;i<160;i++){
    g.strokeStyle=`rgba(${R(30,70)|0},${R(22,50)|0},${R(12,30)|0},${R(.2,.6).toFixed(2)})`;
    g.lineWidth=R(1,3);
    const x=R(0,s); g.beginPath(); g.moveTo(x,0);
    g.bezierCurveTo(x+R(-8,8),s*.33, x+R(-8,8),s*.66, x+R(-6,6),s); g.stroke();
  }
},[2,2]);

const rustTex = tex(256,(g,s)=>{
  g.fillStyle='#6e5340'; g.fillRect(0,0,s,s);
  for (let i=0;i<260;i++){
    g.fillStyle=`rgba(${R(140,200)|0},${R(60,100)|0},${R(20,45)|0},${R(.12,.5).toFixed(2)})`;
    g.beginPath(); g.arc(R(0,s),R(0,s),R(2,10),0,7); g.fill();
  }
  speckle(g,s,900,['#3d2e22','#8a5a35']);
},[1,1]);

const skyTex = tex(256,(g,s)=>{
  const gr=g.createLinearGradient(0,0,0,s);
  gr.addColorStop(0,'#3f7ec2'); gr.addColorStop(.45,'#7fb3dd');
  gr.addColorStop(.8,'#cfe3ea'); gr.addColorStop(1,'#e9e4cd');
  g.fillStyle=gr; g.fillRect(0,0,s,s);
});

function signTex(text, bg='#274e13', fg='#f3ead2') {
  return tex(512,(g,s)=>{
    g.fillStyle=bg; g.fillRect(0,0,s,s);
    g.strokeStyle=fg; g.lineWidth=14; g.strokeRect(18,18,s-36,s-36);
    g.fillStyle=fg; g.font='bold 88px Georgia'; g.textAlign='center'; g.textBaseline='middle';
    const lines=text.split('\n');
    lines.forEach((l,i)=> g.fillText(l, s/2, s/2 + (i-(lines.length-1)/2)*112));
  });
}

// ============================================================
// 2. MATERIALS & HELPERS
// ============================================================
const M = {
  grass:   new THREE.MeshStandardMaterial({ map:grassTex, roughness:1 }),
  dirt:    new THREE.MeshStandardMaterial({ map:dirtTex, roughness:1 }),
  concrete:new THREE.MeshStandardMaterial({ map:concreteTex, roughness:.95 }),
  houseWood:new THREE.MeshStandardMaterial({ map:houseWoodTex, roughness:.85 }),
  grayWood:new THREE.MeshStandardMaterial({ map:grayWoodTex, roughness:.9 }),
  roof:    new THREE.MeshStandardMaterial({ map:roofTex, roughness:.55, metalness:.35 }),
  brick:   new THREE.MeshStandardMaterial({ map:brickTex, roughness:.9 }),
  bark:    new THREE.MeshStandardMaterial({ map:barkTex, roughness:1 }),
  leaf:    new THREE.MeshStandardMaterial({ color:0x2e5b23, roughness:1 }),
  leaf2:   new THREE.MeshStandardMaterial({ color:0x3f7028, roughness:1 }),
  paint:   new THREE.MeshPhysicalMaterial({ color:0x7fa8c9, roughness:.32, metalness:.55, clearcoat:.9, clearcoatRoughness:.25 }),
  chrome:  new THREE.MeshStandardMaterial({ color:0xcfd4d8, roughness:.22, metalness:.95 }),
  glass:   new THREE.MeshPhysicalMaterial({ color:0x2a3d44, roughness:.06, metalness:.1, transparent:true, opacity:.2 }),
  rubber:  new THREE.MeshStandardMaterial({ color:0x191919, roughness:.95 }),
  rim:     new THREE.MeshStandardMaterial({ color:0xb8bcc0, roughness:.35, metalness:.85 }),
  rust:    new THREE.MeshStandardMaterial({ map:rustTex, roughness:.92, metalness:.25 }),
  dark:    new THREE.MeshStandardMaterial({ color:0x1c1e20, roughness:.8 }),
  red:     new THREE.MeshStandardMaterial({ color:0xa2261e, roughness:.6 }),
  yellow:  new THREE.MeshStandardMaterial({ color:0xd9a542, roughness:.7 }),
  water:   new THREE.MeshPhysicalMaterial({ color:0x2f6f8c, roughness:.12, metalness:.05, transparent:true, opacity:.94 }),
  sand:    new THREE.MeshStandardMaterial({ color:0xc9b487, roughness:1 }),
};

function box(w,h,d,mat,shadow=true){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}
function cyl(rt,rb,h,mat,seg=18){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ============================================================
// 3. WORLD
// ============================================================
const world = new THREE.Group(); scene.add(world);
const colliders = [];
const treeCols = [];
const LAKEX=-70, LAKEZ=70, LAKER=26;

const sky = new THREE.Mesh(new THREE.SphereGeometry(600,24,16),
  new THREE.MeshBasicMaterial({ map:skyTex, side:THREE.BackSide, fog:false }));
scene.add(sky);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(640,640,1,1), M.grass);
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true;
world.add(ground);

function road(x0,z0,x1,z1,w=7){
  const dx=x1-x0, dz=z1-z0, len=Math.hypot(dx,dz);
  const geo = new THREE.PlaneGeometry(w,len);
  geo.rotateX(-Math.PI/2);
  const r = new THREE.Mesh(geo, M.dirt);
  r.rotation.y = Math.atan2(-dx, -dz);
  r.position.set((x0+x1)/2, 0.02, (z0+z1)/2);
  r.receiveShadow = true;
  world.add(r);
}
road(0, 4, 0, 168);
road(0, 164, 116, 164);
road(0, 0, -22, -12, 4);
road(0, 0, -40, 44, 3.4);

const lake = new THREE.Mesh(new THREE.CircleGeometry(LAKER,40), M.water);
lake.rotation.x=-Math.PI/2; lake.position.set(LAKEX,0.05,LAKEZ); world.add(lake);
const sand = new THREE.Mesh(new THREE.RingGeometry(LAKER-.5, LAKER+4.5, 40), M.sand);
sand.rotation.x=-Math.PI/2; sand.position.set(LAKEX,0.03,LAKEZ); sand.receiveShadow=true; world.add(sand);

// ---------- pohon ----------
{
  const N = 190;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.24,2.4,7), M.bark, N);
  const c1 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.7,3.6,8), M.leaf, N);
  const c2 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.15,3.2,8), M.leaf2, N);
  const dummy = new THREE.Object3D();
  let placed = 0, guard = 0;
  while (placed < N && guard++ < 4000) {
    const x = R(-290,290), z = R(-290,290);
    if (Math.abs(z-164)<7 && x<130) continue;
    if (Math.abs(x)<6 && z>-6 && z<170) continue;
    if (Math.hypot(x-LAKEX,z-LAKEZ) < LAKER+6) continue;
    if (Math.hypot(x,z)<16) continue;
    if (x>-22&&x<-6 && z>-16&&z<2) continue;
    const s = R(.7,1.5), ry = R(0,6.28);
    dummy.rotation.set(0,ry,0); dummy.scale.setScalar(s);
    dummy.position.set(x, 1.1*s, z); dummy.updateMatrix(); trunk.setMatrixAt(placed, dummy.matrix);
    dummy.position.y = 3.0*s; dummy.updateMatrix(); c1.setMatrixAt(placed, dummy.matrix);
    dummy.position.y = 5.4*s; dummy.updateMatrix(); c2.setMatrixAt(placed, dummy.matrix);
    treeCols.push({x, z, r:.5*s});
    placed++;
  }
  [trunk,c1,c2].forEach(m=>{ m.castShadow=true; m.count=placed; world.add(m); });
}

// ---------- garasi ----------
const GAR = {x:0, z:0, w:11, d:9, h:3.4};
{
  const g = new THREE.Group(); world.add(g);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(GAR.w, GAR.d), M.concrete);
  floor.rotation.x=-Math.PI/2; floor.position.y=.015; floor.receiveShadow=true; g.add(floor);
  const wallH = GAR.h, t=.22, half=GAR.w/2, dep=GAR.d/2;
  const mkWall = (w,h,d,x,y,z,noCol)=>{ const b=box(w,h,d,M.grayWood); b.position.set(x,y,z); g.add(b);
    if (!noCol) colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2}); };
  mkWall(GAR.w, wallH, t, 0, wallH/2, -dep);
  mkWall(t, wallH, GAR.d, -half, wallH/2, 0);
  mkWall(t, wallH, GAR.d,  half, wallH/2, 0);
  mkWall(2.6, wallH, t, -(half-1.3), wallH/2, dep);
  mkWall(2.6, wallH, t,  (half-1.3), wallH/2, dep);
  mkWall(6, .8, t, 0, wallH-.4, dep, true); // palang atas: tidak menghalangi (di atas kepala)
  const roof = box(GAR.w+.6,.18,GAR.d+.8,M.roof); roof.position.y=wallH+.1; g.add(roof);
  const ridge = box(GAR.w+.7,.1,.5,M.dark); ridge.position.y=wallH+.25; g.add(ridge);
  const win = box(1.2,1,.08,M.glass); win.position.set(-3.2,2.2,-dep+.2); g.add(win);
  const lamp = new THREE.PointLight(0xffd9a0, 60, 22, 1.8); lamp.position.set(0,3,0); g.add(lamp);
  const bulb = box(.3,.12,.3,new THREE.MeshStandardMaterial({color:0xffe9c0, emissive:0xffc873, emissiveIntensity:2}));
  bulb.position.set(0,3.15,0); g.add(bulb);
}

// ---------- rumah ----------
{
  const g = new THREE.Group(); g.position.set(-14,0,-7); g.rotation.y = Math.PI/2; world.add(g);
  const w=9, d=7.5, h=3;
  const body = box(w,h,d,M.houseWood); body.position.y=h/2; g.add(body);
  colliders.push({x0:-14-w/2-.4, x1:-14+w/2+.4, z0:-7-d/2-.4, z1:-7+d/2+.4});
  const roof = box(w+1,.2,d+1.6,M.roof); roof.position.y=h+.55; roof.rotation.z=.14; g.add(roof);
  const door = box(1.1,2.2,.12,M.dark); door.position.set(-2.2,1.1,d/2+.05); g.add(door);
  [[-2.2,1.9],[1.6,1.9]].forEach(p=>{
    const fr=box(1.3,1.2,.06,M.dark); fr.position.set(p[0],p[1],d/2+.03); g.add(fr);
    const wn=box(1.1,1,.1,M.glass); wn.position.set(p[0],p[1],d/2+.08); g.add(wn);
  });
  for (let i=0;i<12;i++){
    const log = cyl(.09,.09,1.1,M.bark); log.rotation.z=Math.PI/2;
    log.position.set(3.4, .1+Math.floor(i/4)*.19, -2.6 + Math.floor(i/4)*.02 + (i%4)*.2);
    g.add(log);
  }
  const chim = box(.7,1.6,.7,M.brick); chim.position.set(2.5,h+1.1,-1); g.add(chim);
}

// ---------- KAUPPA ----------
const STORE = {x:116, z:160};
{
  const g = new THREE.Group(); g.position.set(STORE.x,0,STORE.z); g.rotation.y=-Math.PI/2; world.add(g);
  const w=12, d=9, h=3.6;
  const body = box(w,h,d,M.brick); body.position.y=h/2; g.add(body);
  colliders.push({x0:STORE.x-d/2-1, x1:STORE.x+d/2+1, z0:STORE.z-w/2-1, z1:STORE.z+w/2+1});
  const roof = box(w+.8,.25,d+1.2,M.roof); roof.position.y=h+.35; g.add(roof);
  const door = box(1.6,2.4,.14,M.dark); door.position.set(-2.6,1.2,d/2+.06); g.add(door);
  const win2 = box(3.4,1.4,.12,M.glass); win2.position.set(2.2,1.6,d/2+.06); g.add(win2);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.4,1.5,.2),
    new THREE.MeshStandardMaterial({ map:signTex('KAUPPA','#274e13') }));
  sign.position.set(0, h+1.4, d/2+.1); g.add(sign);
  const ad = new THREE.Mesh(new THREE.BoxGeometry(2.6,1.6,.12),
    new THREE.MeshStandardMaterial({ map:signTex('KAUPPA\n1 km →','#8a4030') }));
  ad.position.set(4, 2.2, 30); world.add(ad);
  const post = cyl(.07,.07,2.2,M.grayWood); post.position.set(4,1.1,30); world.add(post);
}

// ---------- sauna & dermaga ----------
{
  const g = new THREE.Group(); g.position.set(-42,0,52); g.rotation.y=-.6; world.add(g);
  const body = box(5,2.6,4,M.grayWood); body.position.y=1.3; g.add(body);
  colliders.push({x0:-45,x1:-39,z0:49.5,z1:54.5});
  const roof = box(5.6,.2,4.6,M.roof); roof.position.y=2.8; g.add(roof);
  const chim = box(.5,1,.5,M.grayWood); chim.position.set(1.6,3.1,-1); g.add(chim);
  const dock = new THREE.Group(); dock.position.set(-48,0,60); dock.rotation.y=.9; world.add(dock);
  for (let i=0;i<7;i++){
    const p = box(1.4,.1,2.4,M.grayWood); p.position.set(0,.35,i*2.3); dock.add(p);
  }
  for (const zz of [0, 12]) for (const xx of [-.6,.6]){
    const leg = cyl(.07,.07,1.4,M.bark); leg.position.set(xx,-.2,zz); dock.add(leg);
  }
}

// ============================================================
// 4. MOBIL "AMPVA 80"
// ============================================================
const CAR = { wheelR:.32 };
const carGroup = new THREE.Group();
carGroup.position.set(0, 0, 1.2);
world.add(carGroup);

// chassis berkarat
const chassis = new THREE.Group(); carGroup.add(chassis);
{
  const frame = box(1.35,.14,3.7,M.rust); frame.position.y=.42; chassis.add(frame);
  const floorPan = box(1.55,.06,3.3,M.rust); floorPan.position.y=.5; chassis.add(floorPan);
  for (const z of [1.25,-1.25]){
    const ax = cyl(.05,.05,1.66,M.rust); ax.rotation.z=Math.PI/2; ax.position.set(0,.32,z); chassis.add(ax);
  }
  const exh = cyl(.05,.05,2.2,M.rust); exh.rotation.x=Math.PI/2; exh.position.set(-.45,.28,-.6); chassis.add(exh);
}

// body shell
const shell = new THREE.Group(); carGroup.add(shell);
const interior = new THREE.Group(); carGroup.add(interior);
{
  const lower = box(1.66,.55,3.2,M.paint); lower.position.set(0,.82,-.475); shell.add(lower);
  // fender depan (membuka ruang mesin)
  for (const s of [-1,1]){
    const f = box(.3,.55,1.0,M.paint); f.position.set(s*.68,.82,1.6); shell.add(f);
  }
  const panelF = box(1.1,.4,.1,M.paint); panelF.position.set(0,.9,2.0); shell.add(panelF);
  const cabin = box(1.5,.62,2.1,M.paint); cabin.position.set(0,1.36,-.35); shell.add(cabin);
  const ws = box(1.34,.72,.05,M.glass); ws.position.set(0,1.37,.66); ws.rotation.x=-.42; shell.add(ws);
  const rw = box(1.34,.45,.05,M.glass); rw.position.set(0,1.38,-1.42); rw.rotation.x=.42; shell.add(rw);
  for (const s of [-1,1]){
    const sw = box(.04,.42,1.15,M.glass); sw.position.set(s*.73,1.42,-.32); shell.add(sw);
    const sw2 = box(.04,.3,.5,M.glass); sw2.position.set(s*.73,1.5,.3); shell.add(sw2);
    const p1 = box(.05,.62,.07,M.paint); p1.position.set(s*.755,1.36,.64); shell.add(p1);
    const p2 = box(.05,.62,.07,M.paint); p2.position.set(s*.755,1.36,-1.36); shell.add(p2);
  }
  const grille = box(1.15,.28,.08,M.dark); grille.position.set(0,.98,2.08); shell.add(grille);
  for (const s of [-1,1]){
    const hl = cyl(.13,.13,.07,new THREE.MeshStandardMaterial({color:0xd8e4ea, emissive:0xfff3cf, emissiveIntensity:.15}));
    hl.rotation.x=Math.PI/2; hl.position.set(s*.55,1.02,2.08); shell.add(hl);
    const tl = box(.28,.16,.06,new THREE.MeshStandardMaterial({color:0x7a1512, emissive:0xff2211, emissiveIntensity:.25}));
    tl.position.set(s*.58,1.02,-2.08); shell.add(tl);
    const bm = box(1.7,.13,.16,M.chrome); bm.position.set(0,.6,s*2.08); shell.add(bm);
  }
  for (const s of [-1,1]){
    const mir = box(.09,.26,.05,M.glass); mir.position.set(s*.92,1.5,.55); shell.add(mir);
    const arm = box(.16,.05,.05,M.paint); arm.position.set(s*.83,1.48,.55); shell.add(arm);
  }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(.62,.16,.03),
    new THREE.MeshStandardMaterial({ map:signTex('AMP-88','#f6f4ea','#222') }));
  plate.position.set(0,.72,2.13); shell.add(plate);
  // lantai ruang mesin (biar nggak bolong hitam saat kap belum terpasang)
  const bayFloor = box(1.1,.05,1.1,M.dark); bayFloor.position.set(0,.68,1.55); shell.add(bayFloor);
}
// interior
let steeringWheel;
{
  const dash = box(1.42,.24,.4,M.dark); dash.position.set(0,1.1,.45); interior.add(dash);
  const cowl = box(1.42,.3,.16,M.dark); cowl.position.set(0,1.03,.62); interior.add(cowl);
  const wheelGrp = new THREE.Group();
  const rimM = new THREE.Mesh(new THREE.TorusGeometry(.17,.024,8,20), M.dark);
  rimM.castShadow = true; wheelGrp.add(rimM);
  const spoke = box(.3,.03,.02,M.dark); spoke.position.z=.012; wheelGrp.add(spoke);
  wheelGrp.position.set(-.4,1.06,.14);
  wheelGrp.rotation.x = -.35;
  interior.add(wheelGrp);
  steeringWheel = wheelGrp;
  for (const s of [[-.4,-.55],[.42,-.55]]){
    const seat = box(.52,.14,.5,M.dark); seat.position.set(s[0],.95,s[1]); interior.add(seat);
    const back = box(.52,.56,.13,M.dark); back.position.set(s[0],1.25,s[1]-.28); interior.add(back);
  }
  // plafon & lantai interior
  const ceil = box(1.42,.04,1.95,M.dark); ceil.position.set(0,1.62,-.35); interior.add(ceil);
  const ifloor = box(1.45,.04,1.95,M.dark); ifloor.position.set(0,.93,-.35); interior.add(ifloor);
}

// ---------- bays ----------
const bays = {
  engine:   { pos:[0,.38,1.45],     rot:[0,0,0] },
  gearbox:  { pos:[0,.5,1.0],       rot:[0,0,0] },
  radiator: { pos:[0,.85,1.86],     rot:[0,0,0] },
  battery:  { pos:[-.5,.78,1.5],    rot:[0,0,0] },
  hood:     { pos:[0,1.13,1.35],    rot:[-.06,0,0] },
  wheels:   [ [ .8,.32, 1.25], [-.8,.32, 1.25], [ .8,.32,-1.25], [-.8,.32,-1.25] ],
};
const parts = [];
function makeWheel(){
  const g = new THREE.Group();
  const tire = cyl(CAR.wheelR, CAR.wheelR, .21, M.rubber, 22); tire.rotation.z=Math.PI/2; g.add(tire);
  const rim = cyl(CAR.wheelR*.62, CAR.wheelR*.62, .22, M.rim, 16); rim.rotation.z=Math.PI/2; g.add(rim);
  for (let i=0;i<5;i++){
    const lug = box(.05,.05,.24,M.dark);
    lug.position.set(Math.cos(i*2.51)*.14, Math.sin(i*2.51)*.14, 0);
    lug.rotation.z = Math.PI/2; g.add(lug);
  }
  return g;
}
function addPart(id, label, group, homePos, homeRot){
  group.position.set(...homePos); group.rotation.set(...homeRot);
  group.traverse(o=>{ o.userData.part = id; o.castShadow = true; });
  world.add(group);
  parts.push({ id, label, group, state:'loose', home:{pos:homePos, rot:homeRot} });
}
// blok mesin
{
  const g = new THREE.Group();
  const block = box(.62,.45,.55,M.rust); block.position.y=.225; g.add(block);
  const head = box(.62,.16,.55,new THREE.MeshStandardMaterial({color:0x9aa3a8, roughness:.4, metalness:.7}));
  head.position.y=.52; g.add(head);
  const cover = box(.58,.07,.5,M.dark); cover.position.y=.63; g.add(cover);
  const pulley = cyl(.11,.11,.08,M.chrome); pulley.rotation.x=Math.PI/2; pulley.position.set(.18,.26,.3); g.add(pulley);
  const carb = cyl(.1,.12,.12,M.chrome); carb.position.set(0,.71,0); g.add(carb);
  for (let i=0;i<4;i++){
    const wire = cyl(.012,.012,.2,M.red); wire.position.set(-.2+i*.13,.66,.12); wire.rotation.x=R(-.2,.2); g.add(wire);
  }
  addPart('engine','Blok Mesin', g, [3.4,0,-2.6], [0,.4,0]);
}
// gearbox
{
  const g = new THREE.Group();
  const bell = cyl(.24,.3,.3,M.rust); bell.rotation.x=Math.PI/2; bell.position.z=.12; g.add(bell);
  const gb = box(.3,.3,.55,new THREE.MeshStandardMaterial({color:0x8d9296, roughness:.5, metalness:.6}));
  gb.position.set(0,-.02,-.25); g.add(gb);
  const shaft = cyl(.05,.05,.35,M.chrome); shaft.rotation.x=Math.PI/2; shaft.position.z=-.6; g.add(shaft);
  addPart('gearbox','Kopling + Gearbox', g, [3.4,.24,-1.7], [0,.9,0]);
}
// radiator
{
  const g = new THREE.Group();
  const core = box(.6,.5,.09,new THREE.MeshStandardMaterial({color:0x2a2d30, roughness:.7})); g.add(core);
  for (let i=0;i<9;i++){
    const fin = box(.56,.02,.02,M.chrome); fin.position.set(0,-.2+i*.05,.05); g.add(fin);
  }
  const cap = cyl(.05,.05,.05,M.chrome); cap.position.set(0,.28,.03); g.add(cap);
  addPart('radiator','Radiator', g, [-3.4,.25,-2.4], [0,-.5,0]);
}
// aki
let batteryCharge = 0;
{
  const g = new THREE.Group();
  const body = box(.34,.22,.24,M.dark); g.add(body);
  const t1 = cyl(.035,.035,.05,M.chrome); t1.position.set(.1,.13,0); g.add(t1);
  const t2 = cyl(.035,.035,.05,M.chrome); t2.position.set(-.1,.13,0); g.add(t2);
  const label = new THREE.Mesh(new THREE.BoxGeometry(.2,.1,.01),
    new THREE.MeshStandardMaterial({ map:signTex('12V','#e8e4d8','#a2261e') }));
  label.position.set(0,0,.125); g.add(label);
  addPart('battery','Aki 12V (Kosong)', g, [-3.2,.11,-3.4], [0,0,0]);
}
// roda
for (let i=0;i<4;i++){
  const s = [[3.2,2.6],[3.7,2.6],[3.2,1.9],[3.7,1.9]][i];
  addPart('wheel'+i,'Roda', makeWheel(), [s[0], CAR.wheelR, s[1]], [0,R(-.5,.5),0]);
}
// kap mesin
{
  const g = new THREE.Group();
  const hood = box(1.45,.05,1.05,M.paint); g.add(hood);
  const lip = box(1.45,.06,.04,M.paint); lip.position.set(0,-.01,.52); g.add(lip);
  addPart('hood','Kap Mesin', g, [-3.1,1.28,-3.2], [0,.35,1.25]);
}
// jerigen
const jerrycan = { group:new THREE.Group(), state:'loose', label:'Jerigen Bensin', fuel:45,
  home:{pos:[-2.8,0,-3.2], rot:[0,.5,0]} };
{
  const g = jerrycan.group;
  const body = box(.3,.4,.16,M.red); body.position.y=.2; g.add(body);
  const handle = box(.16,.05,.05,M.red); handle.position.set(0,.42,.05); g.add(handle);
  const spout = cyl(.03,.04,.12,M.red); spout.position.set(.09,.44,0); spout.rotation.z=-.7; g.add(spout);
  g.position.set(...jerrycan.home.pos); g.rotation.set(...jerrycan.home.rot);
  g.traverse(o=>{ o.userData.part='jerrycan'; o.castShadow=true; });
  world.add(g);
}
// kunci
const keyItem = { group:new THREE.Group(), state:'loose', label:'Kunci Kontak',
  home:{pos:[4.2,1.6,-4.2], rot:[0,.4,0]} };
{
  const g = keyItem.group;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.05,.012,6,12), M.chrome); g.add(ring);
  const key = box(.025,.11,.012,M.chrome); key.position.y=-.08; g.add(key);
  const teeth = box(.05,.03,.012,M.chrome); teeth.position.set(.02,-.12,0); g.add(teeth);
  g.position.set(...keyItem.home.pos); g.rotation.set(...keyItem.home.rot);
  g.traverse(o=>{ o.userData.part='keys'; o.castShadow=true; });
  world.add(g);
}

// meja kerja + charger
const chargerSlot = new THREE.Group();
chargerSlot.position.set(-3.6,1.06,-1.2); world.add(chargerSlot);
{
  const bench = box(3.2,.9,1,M.grayWood); bench.position.set(-3.6,.45,-1.2); world.add(bench);
  colliders.push({x0:-5.2,x1:-2.0,z0:-1.7,z1:-.7});
  const top = box(3.3,.06,1.1,M.dark); top.position.set(-3.6,.93,-1.2); world.add(top);
  const ch = box(.42,.3,.2,M.yellow); ch.position.set(-3.6,1.13,-1.5); world.add(ch);
  const cl = box(.2,.08,.02,M.dark); cl.position.set(-3.6,1.13,-1.39); world.add(cl);
  const wr = box(.5,.14,.3,M.red); wr.position.set(-2.7,1.03,-1.2); world.add(wr);
  const tool = cyl(.02,.02,.4,M.chrome); tool.rotation.z=1.2; tool.position.set(-3.1,1.0,-1.1); world.add(tool);
}

// ============================================================
// 5. CAR STATE & ASSEMBLY
// ============================================================
const car = {
  installed: new Set(),
  fuel: 0, engineOn:false,
  x:0, z:1.2, rot:0, v:0, steer:0, rpm:0, gear:1, wheelSpin:0,
};
const PART_LABEL = { engine:'Blok Mesin', gearbox:'Kopling + Gearbox', radiator:'Radiator',
  battery:'Aki', hood:'Kap Mesin', wheel0:'Roda', wheel1:'Roda', wheel2:'Roda', wheel3:'Roda',
  jerrycan:'Jerigen Bensin', keys:'Kunci' };
let carrying = null;
let wheelMeshes = [null,null,null,null];
let chargerBattery = false;

function partById(id){ return parts.find(p=>p.id===id); }
function wheelCount(){ return [...car.installed].filter(i=>i.startsWith('wheel')).length; }

function installPart(id){
  if (id && id.startsWith('wheel')){
    const used = wheelCount();
    if (used>=4) return false;
    const p = partById(id); const bay = bays.wheels[used];
    carGroup.add(p.group);
    p.group.position.set(bay[0], bay[1], bay[2]); p.group.rotation.set(0,0,0);
    p.state='installed'; car.installed.add(id); wheelMeshes[used] = p.group;
    syncWheelTask();
    return true;
  }
  if (!bays[id]) return false;
  const p = partById(id); if (!p || p.state==='installed') return false;
  if (id==='battery' && batteryCharge < 100) return 'needcharge';
  const b = bays[id];
  carGroup.add(p.group);
  p.group.position.set(...b.pos); p.group.rotation.set(...b.rot);
  p.state='installed';
  car.installed.add(id);
  return true;
}
function pickupPart(id){
  const obj = id==='jerrycan' ? jerrycan : (id==='keys' ? keyItem : partById(id));
  if (!obj || obj.state!=='loose') return false;
  obj.state='carried';
  camera.add(obj.group);
  const t = carryTransform(id);
  obj.group.position.set(...t.pos); obj.group.rotation.set(...t.rot);
  obj.group.scale.setScalar(t.scale||1);
  obj.group.traverse(o=>{ o.userData.part = id; });
  carrying = id;
  return true;
}
function dropCarried(){
  if (!carrying) return;
  const obj = carrying==='jerrycan' ? jerrycan : (carrying==='keys' ? keyItem : partById(carrying));
  camera.remove(obj.group);
  obj.group.scale.setScalar(1);
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
  obj.group.position.set(player.x+fx*1.2, dropY(obj), player.z+fz*1.2);
  obj.group.rotation.set(...obj.home.rot);
  obj.state='loose';
  carrying = null;
  refreshHand();
}
function dropY(obj){
  if (obj.id==='engine') return 0;
  if (obj.id==='gearbox') return .24;
  if (obj.id==='radiator') return .25;
  if (obj.id==='battery') return .11;
  if (obj.id && obj.id.startsWith('wheel')) return CAR.wheelR;
  return .6;
}
function carryTransform(id){
  if (id==='engine')   return { pos:[.42,-.72,-1.5], rot:[0,-.4,0] };
  if (id==='gearbox')  return { pos:[.4,-.5,-1.1],  rot:[0,.4,0] };
  if (id==='radiator') return { pos:[.34,-.42,-1.0],rot:[0,-.3,0] };
  if (id==='battery')  return { pos:[.36,-.42,-.85],rot:[0,0,0] };
  if (id==='hood')     return { pos:[0,-.62,-1.35], rot:[-.25,0,0] };
  if (id && id.startsWith('wheel')) return { pos:[.4,-.5,-1.05], rot:[0,0,Math.PI/2] };
  if (id==='jerrycan') return { pos:[.38,-.44,-.85], rot:[0,0,0] };
  if (id==='keys')     return { pos:[.3,-.28,-.6],  rot:[.4,0,0], scale:1.4 };
  return { pos:[.35,-.4,-.9], rot:[0,0,0] };
}
function missingParts(){
  const need = ['engine','gearbox','radiator','battery','hood'];
  const miss = need.filter(n=>!car.installed.has(n));
  const w = wheelCount();
  if (w<4) miss.push((4-w)+' roda');
  return miss;
}

// ============================================================
// 6. PLAYER
// ============================================================
const player = { x:0, z:6.5, y:0, vy:0, yaw:0, pitch:0, onGround:true };
const keys = {};
addEventListener('keydown', e=>{
  keys[e.code]=true;
  if (e.code==='KeyE') tryInteract();
  if (e.code==='KeyQ') dropCarried();
  if (e.code==='KeyF') exitCar();
});
addEventListener('keyup', e=>{ keys[e.code]=false; });

// ---------- kontrol sentuh (mobile) ----------
const isTouch = (('ontouchstart' in window) || navigator.maxTouchPoints > 0)
  && matchMedia('(pointer:coarse)').matches;
const touch = { gas:false, brake:false, hb:false, run:false, steer:0 };
const joy = { active:false, fwd:0, strafe:0, id:null, ox:0, oy:0 };

if (isTouch) {
  document.body.classList.add('touch');
  const $ = id => document.getElementById(id);
  const bindTap = (el, fn) => {
    el.addEventListener('touchstart', e=>{ e.preventDefault(); e.stopPropagation(); fn(); }, {passive:false});
  };
  const bindHold = (el, on, off) => {
    el.addEventListener('touchstart', e=>{ e.preventDefault(); e.stopPropagation(); el.classList.add('on'); on(); }, {passive:false});
    const end = e=>{ e.preventDefault(); e.stopPropagation(); el.classList.remove('on'); off(); };
    el.addEventListener('touchend', end, {passive:false});
    el.addEventListener('touchcancel', end, {passive:false});
  };
  bindTap($('btnE'), ()=>tryInteract());
  bindTap($('btnQ'), ()=>dropCarried());
  bindTap($('btnRun'), ()=>{ touch.run=!touch.run; $('btnRun').classList.toggle('on', touch.run); });
  bindHold($('btnGas'),  ()=>touch.gas=true,   ()=>touch.gas=false);
  bindHold($('btnBrake'),()=>touch.brake=true, ()=>touch.brake=false);
  bindHold($('btnHB'),   ()=>touch.hb=true,    ()=>touch.hb=false);
  bindHold($('btnL'),    ()=>touch.steer=-1,   ()=>touch.steer=0);
  bindHold($('btnR'),    ()=>touch.steer=1,    ()=>touch.steer=0);

  // joystick bergerak
  const zone=$('joyZone'), base=$('joyBase'), knob=$('joyKnob');
  const JOY_R = 48;
  zone.addEventListener('touchstart', e=>{
    e.preventDefault(); e.stopPropagation();
    if (joy.active) return;
    const t = e.changedTouches[0];
    joy.id = t.identifier; joy.ox = t.clientX; joy.oy = t.clientY; joy.active = true;
    base.style.left = (t.clientX - 62) + 'px';
    base.style.bottom = 'auto'; base.style.top = (t.clientY - 62) + 'px';
    knob.style.left = '41px'; knob.style.top = '41px';
  }, {passive:false});
  zone.addEventListener('touchmove', e=>{
    e.preventDefault();
    for (const t of e.changedTouches){
      if (t.identifier !== joy.id) continue;
      let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy;
      const d = Math.hypot(dx,dy);
      if (d > JOY_R){ dx = dx/d*JOY_R; dy = dy/d*JOY_R; }
      joy.fwd = Math.max(-1, Math.min(1, -dy/JOY_R));
      joy.strafe = Math.max(-1, Math.min(1, dx/JOY_R));
      knob.style.left = (41+dx) + 'px'; knob.style.top = (41+dy) + 'px';
    }
  }, {passive:false});
  const joyEnd = e=>{
    for (const t of e.changedTouches){
      if (t.identifier !== joy.id) continue;
      joy.id=null; joy.active=false; joy.fwd=0; joy.strafe=0;
      base.style.left='26px'; base.style.top='auto';
      base.style.bottom='calc(26px + env(safe-area-inset-bottom))';
      knob.style.left='41px'; knob.style.top='41px';
    }
  };
  zone.addEventListener('touchend', joyEnd, {passive:false});
  zone.addEventListener('touchcancel', joyEnd, {passive:false});

  // geser layar (di luar area UI) = menoleh
  let lookId=null, lookX=0, lookY=0;
  renderer.domElement.addEventListener('touchstart', e=>{
    e.preventDefault();
    if (lookId!==null) return;
    const t = e.changedTouches[0];
    lookId = t.identifier; lookX = t.clientX; lookY = t.clientY;
  }, {passive:false});
  renderer.domElement.addEventListener('touchmove', e=>{
    e.preventDefault();
    for (const t of e.changedTouches){
      if (t.identifier !== lookId) continue;
      const dx = t.clientX-lookX, dy = t.clientY-lookY;
      lookX = t.clientX; lookY = t.clientY;
      if (driving){
        carLook.yaw = Math.max(-2.6, Math.min(2.6, carLook.yaw - dx*.004));
        carLook.pitch = Math.max(-.9, Math.min(.9, carLook.pitch - dy*.004));
      } else {
        player.yaw -= dx*.0045;
        player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch - dy*.0045));
      }
    }
  }, {passive:false});
  const lookEnd = e=>{ for (const t of e.changedTouches) if (t.identifier===lookId) lookId=null; };
  renderer.domElement.addEventListener('touchend', lookEnd, {passive:false});
  renderer.domElement.addEventListener('touchcancel', lookEnd, {passive:false});
}

let hadLock=false, started=false;
const pauseEl = document.getElementById('pause');
renderer.domElement.addEventListener('click', ()=>{
  if (!started || isTouch) return;
  tryLock();
});
function tryLock(){
  try{
    const p = renderer.domElement.requestPointerLock();
    if (p && p.catch) p.catch(()=>{});
  }catch(e){}
}
document.addEventListener('pointerlockchange', ()=>{
  const locked = document.pointerLockElement === renderer.domElement;
  if (locked) hadLock = true;
  pauseEl.classList.toggle('show', started && !isTouch && hadLock && !locked);
});
addEventListener('mousemove', e=>{
  if (document.pointerLockElement !== renderer.domElement) return;
  const s = .0022;
  if (driving) {
    carLook.yaw   = Math.max(-2.6, Math.min(2.6, carLook.yaw - e.movementX*s));
    carLook.pitch = Math.max(-.9, Math.min(.9, carLook.pitch - e.movementY*s));
  } else {
    player.yaw   -= e.movementX*s;
    player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch - e.movementY*s));
  }
});
pauseEl.addEventListener('click', tryLock);

let stepTimer = 0;
function collideCircle(p, r){
  for (const b of colliders){
    const cx = Math.max(b.x0, Math.min(p.x, b.x1));
    const cz = Math.max(b.z0, Math.min(p.z, b.z1));
    let dx = p.x-cx, dz = p.z-cz; const d2 = dx*dx+dz*dz;
    if (d2 > r*r) continue;
    if (d2 > 1e-9) { const d=Math.sqrt(d2); p.x = cx+dx/d*r; p.z = cz+dz/d*r; }
    else {
      const l=p.x-b.x0, ri=b.x1-p.x, t=p.z-b.z0, bt=b.z1-p.z, m=Math.min(l,ri,t,bt);
      if (m===l) p.x=b.x0-r; else if(m===ri) p.x=b.x1+r; else if(m===t) p.z=b.z0-r; else p.z=b.z1+r;
    }
  }
  for (const t of treeCols){
    const dx=p.x-t.x, dz=p.z-t.z, rr=r+t.r, d2=dx*dx+dz*dz;
    if (d2 < rr*rr && d2>1e-9){ const d=Math.sqrt(d2); p.x=t.x+dx/d*rr; p.z=t.z+dz/d*rr; }
  }
  if (!driving){ // mobil terparkir menghalangi
    const dx=p.x-car.x, dz=p.z-car.z, rr=r+1.9, d2=dx*dx+dz*dz;
    if (d2 < rr*rr && d2>1e-9){ const d=Math.sqrt(d2); p.x=car.x+dx/d*rr; p.z=car.z+dz/d*rr; }
  }
}
function updatePlayer(dt){
  const sp = (keys['ShiftLeft']||keys['ShiftRight']||touch.run) ? 7.2 : 4.4;
  const fw = Math.max(-1, Math.min(1, (keys['KeyW']?1:0) - (keys['KeyS']?1:0) + joy.fwd));
  const sd = Math.max(-1, Math.min(1, (keys['KeyD']?1:0) - (keys['KeyA']?1:0) + joy.strafe));
  const moving = fw||sd;
  if (moving){
    const sin=Math.sin(player.yaw), cos=Math.cos(player.yaw);
    const wx = fw*(-sin) + sd*cos;
    const wz = fw*(-cos) + sd*(-sin);
    const p = {x:player.x + wx*sp*dt, z:player.z + wz*sp*dt};
    collideCircle(p, .38);
    player.x = p.x; player.z = p.z;
    stepTimer += sp*dt;
    if (stepTimer > 2.3){ stepTimer = 0; playStep(); }
  }
  if (keys['Space'] && player.onGround){ player.vy = 4.6; player.onGround=false; }
  player.vy -= 13*dt; player.y += player.vy*dt;
  if (player.y <= 0){ player.y=0; player.vy=0; player.onGround=true; }
  player.x = Math.max(-310, Math.min(310, player.x));
  player.z = Math.max(-310, Math.min(310, player.z));
  const bob = moving ? Math.sin(stepTimer*2.7)*.035 : 0;
  camera.position.set(player.x, player.y + 1.62 + bob, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
}

// ============================================================
// 7. DRIVING
// ============================================================
let driving = false;
const carLook = { yaw:0, pitch:0 };
let winShown = false;

function enterCar(){
  if (carrying){ showToast('Tanganmu penuh', 'Taruh / pasang dulu (Q untuk menaruh)'); return; }
  const miss = missingParts();
  if (miss.length){ showToast('Mobil belum lengkap', 'Kurang: '+miss.join(', ')); return; }
  if (car.fuel < 5){ showToast('Bahan bakar habis', 'Isi pakai jerigen'); return; }
  driving = true; carLook.yaw=0; carLook.pitch=0; car.v=0;
  camera.position.set(-.4,1.42,-.62); camera.rotation.set(0,Math.PI,0);
  carGroup.add(camera);
  document.body.classList.add('play-drive');
  document.getElementById('dash').style.display='block';
}
function exitCar(){
  if (!driving) return;
  if (Math.abs(car.v) > 3){ showToast('Terlalu cepat untuk turun!', 'Rem dulu (S)'); return; }
  car.v = 0; driving=false; car.engineOn=false;
  carGroup.remove(camera);
  scene.add(camera);
  document.body.classList.remove('play-drive');
  const side = Math.PI/2;
  player.x = car.x + Math.sin(car.rot+side)*1.6;
  player.z = car.z + Math.cos(car.rot+side)*1.6;
  player.y = 0;
  camera.position.set(player.x, 1.62, player.z);
  document.getElementById('dash').style.display='none';
}
function toggleIgnition(){
  if (car.engineOn){ car.engineOn=false; showToast('Mesin dimatikan'); return; }
  if (keyItem.state==='loose'){ showToast('Butuh kunci kontak', 'Kunci tergantung di papan dinding garasi'); return; }
  const miss = missingParts();
  if (miss.length){ showToast('Tidak bisa dinyalakan', 'Kurang: '+miss.join(', ')); return; }
  if (car.fuel <= 0){ showToast('Bensin habis', 'Cari jerigen!'); return; }
  showToast('Dinyalakan...', 'Starter berputar');
  crank(1.4, ()=>{
    if (!driving) return;
    if (batteryCharge<=0){ showToast('Aki soak', 'Cas aki dulu di meja kerja'); return; }
    if (car.fuel<=0){ showToast('Bensin habis'); return; }
    car.engineOn = true; markTask('start');
    showToast('◉ Mesin hidup!', 'W/S gas · A/D setir · Spasi rem tangan · F keluar');
  });
}
function updateCar(dt){
  const thr = (keys['KeyW']||touch.gas)?1:0, brk = (keys['KeyS']||touch.brake)?1:0;
  const steerIn = (keys['KeyA']?1:0) - (keys['KeyD']?1:0)
    + (isTouch ? Math.abs(joy.strafe)>.15 ? joy.strafe : touch.steer : 0);
  if (car.engineOn){
    if (thr) car.v += 7.5*dt * (car.v<0?1.6:1);
    if (brk){
      if (car.v > .3) car.v -= 10*dt;
      else car.v -= 3.2*dt;
    }
    car.v = Math.max(-6, Math.min(36, car.v));
    car.fuel -= (0.02 + Math.abs(car.v)*0.004*(0.5+thr)) * dt;
    if (car.fuel <= 0){ car.fuel=0; car.engineOn=false; showToast('Bensin habis!','Hanya jalan kaki pulang...'); }
  }
  if (!thr && !brk) car.v *= (1 - 1.1*dt);
  if (keys['Space'] || touch.hb) car.v *= (1 - 3.5*dt);
  if (!car.engineOn && Math.abs(car.v)<.05) car.v = 0;
  const steerTarget = steerIn * .58 / (1 + Math.abs(car.v)*.06);
  car.steer += (steerTarget - car.steer) * Math.min(1, 8*dt);
  if (Math.abs(car.v) > .1){
    car.rot += (car.v/2.5) * Math.tan(car.steer) * dt;
  }
  const nx = car.x + Math.sin(car.rot)*car.v*dt;
  const nz = car.z + Math.cos(car.rot)*car.v*dt;
  for (const off of [1.35,-1.35]){
    const p = { x: nx + Math.sin(car.rot)*off, z: nz + Math.cos(car.rot)*off };
    const bx=p.x, bz=p.z;
    collideCircle(p, 1.0);
    if (Math.hypot(p.x-bx,p.z-bz) > .001){
      if (Math.abs(car.v) > 7){ damageFlash(); playClunk(60,.3,.7); }
      car.v *= -.25;
      car.x = p.x - Math.sin(car.rot)*off; car.z = p.z - Math.cos(car.rot)*off;
      updateCarTransform(); return;
    }
  }
  car.x = Math.max(-300,Math.min(300,nx)); car.z = Math.max(-300,Math.min(300,nz));
  car.wheelSpin += car.v/CAR.wheelR*dt;
  const kmh = Math.abs(car.v)*3.6;
  const gears = [0,14,32,55,999];
  let g2 = 1; for (let i=1;i<5;i++) if (kmh>=gears[i-1] && kmh<gears[i]) { g2=i; break; }
  car.gear = g2;
  const lo = gears[g2-1], hi = gears[g2]===999?95:gears[g2];
  const band = Math.max(0,(kmh-lo))/(Math.max(hi-lo,14));
  car.rpm = car.engineOn ? (900 + band*6100 + thr*300) : 0;
  updateCarTransform();
  for (let i=0;i<4;i++){
    const w = wheelMeshes[i]; if (!w) continue;
    if (w.children[0]) w.children[0].rotation.x = car.wheelSpin;
    if (i<2) w.rotation.y = car.steer;
  }
  if (steeringWheel) steeringWheel.rotation.z = -car.steer*4.2;
  if (Math.hypot(car.x-STORE.x, car.z-STORE.z) < 15 && !winShown){
    winShown = true; markTask('store');
    showToast('★ SAMPAI KAUPPA! ★', 'Musim panasmu terselamatkan. Jalan terbuka menanti.');
    playClunk(300,.4,.5); setTimeout(()=>playClunk(400,.4,.5),180); setTimeout(()=>playClunk(520,.5,.5),360);
  }
}
function updateCarTransform(){
  carGroup.position.set(car.x, 0, car.z);
  carGroup.rotation.y = car.rot;
  carGroup.rotation.z = -car.steer * Math.abs(car.v) * .006;
  const acc = (keys['KeyW']?1:0)-(keys['KeyS']?1:0);
  carGroup.rotation.x = Math.max(-.03, Math.min(.03, -acc*Math.abs(car.v)*.0022));
}

// ============================================================
// 8. INTERAKSI
// ============================================================
const interactRoots = [];
parts.forEach(p=> interactRoots.push(p.group));
interactRoots.push(jerrycan.group, keyItem.group, shell, interior, chargerSlot);

const raycaster = new THREE.Raycaster();
raycaster.far = 3.4;
let hoverIid = null;

function iidFrom(obj){
  while (obj){
    if (obj.userData && obj.userData.part){
      const id = obj.userData.part;
      if (id==='battery' && partById('battery').state==='charging') return 'charger';
      const st = id==='jerrycan' ? jerrycan.state
        : id==='keys' ? keyItem.state
        : (partById(id) ? partById(id).state : null);
      return st==='loose' ? id : 'car';
    }
    if (obj === chargerSlot) return 'charger';
    if (obj === shell || obj === interior) return 'car';
    obj = obj.parent;
  }
  return null;
}
function updateHover(){
  raycaster.setFromCamera({x:0,y:0}, camera);
  const hits = raycaster.intersectObjects(interactRoots, true);
  let iid = null;
  for (const h of hits){
    const id = iidFrom(h.object);
    if (!id) continue;
    iid = id; break;
  }
  hoverIid = iid;
  const ch = document.getElementById('crosshair');
  ch.classList.toggle('hit', !!iid);
  const hint = document.getElementById('hint');
  const txt = hintText(iid);
  if (txt){ hint.style.display='block'; hint.innerHTML = txt; }
  else hint.style.display='none';
}
function hintText(iid){
  if (!iid || driving) return null;
  if (iid==='keys' && keyItem.state==='loose') return '<b>[E]</b> Ambil kunci kontak';
  if (iid==='charger'){
    if (carrying==='battery') return '<b>[E]</b> Taruh aki di charger <span class="sub">cas sampai penuh (~6 dtk)</span>';
    if (!carrying && chargerBattery) return '<b>[E]</b> Ambil aki (penuh)';
    if (!carrying) return 'Aki sedang dicas... <span class="sub">'+Math.round(batteryCharge)+'%</span>';
    return null;
  }
  if (iid==='jerrycan' && jerrycan.state==='loose') return '<b>[E]</b> Ambil jerigen bensin';
  const p = partById(iid);
  if (p && p.state==='loose'){
    const extra = (iid==='battery' && batteryCharge<100) ? ' <span class="sub">masih kosong — cas dulu</span>' : '';
    return `<b>[E]</b> Ambil ${PART_LABEL[iid]||'bagian'}${extra}`;
  }
  if (iid==='car'){
    if (carrying==='jerrycan') return '<b>[E]</b> Isi bensin dari jerigen <span class="sub">'+jerrycan.fuel+' L</span>';
    if (carrying==='keys') return 'Kunci dipakai saat starter nanti';
    if (carrying && carrying.startsWith('wheel')) return `<b>[E]</b> Pasang roda (${wheelCount()}/4)`;
    if (carrying==='battery') return batteryCharge<100
      ? 'Aki masih kosong <span class="sub">cas di meja kerja (charger kuning)</span>'
      : '<b>[E]</b> Pasang aki';
    if (carrying) return '<b>[E]</b> Pasang '+PART_LABEL[carrying];
    const miss = missingParts();
    if (miss.length) return 'Amppa 80 — kurang: '+miss.join(', ');
    if (car.fuel<5) return 'Bahan bakar habis <span class="sub">cari jerigen</span>';
    return '<b>[E]</b> Masuk &amp; duduk <span class="sub">lalu [E] lagi untuk starter</span>';
  }
  return null;
}
let busy = 0;
function tryInteract(){
  if (!started || busy>0) return;
  if (driving){ toggleIgnition(); return; }
  const iid = hoverIid;
  if (!iid) return;
  if (iid==='keys'){
    if (pickupPart('keys')){
      const k = keyItem;
      camera.remove(k.group); k.group.scale.setScalar(1);
      carGroup.add(k.group);
      k.group.position.set(-.55,1.19,.3); k.group.rotation.set(.2,0,.5);
      k.state='installed';
      carrying=null;
      markTask('keys'); playClunk(180,.12,.3); refreshHand();
      showToast('Kunci tersimpan di dashboard', 'Sekarang rakit mobilmu!');
    }
    return;
  }
  if (iid==='jerrycan'){ if(pickupPart('jerrycan')){ playClunk(160,.12,.3); refreshHand(); } return; }
  if (iid==='charger'){
    if (carrying==='battery'){
      const b = partById('battery');
      camera.remove(b.group); b.group.scale.setScalar(1);
      chargerSlot.add(b.group); b.group.position.set(0,.05,.15); b.group.rotation.set(0,0,0);
      b.state='charging'; carrying=null; refreshHand();
      showToast('Aki dicas...', 'Tunggu sampai penuh');
    } else if (!carrying){
      const b = partById('battery');
      if (batteryCharge>=100 && b.state==='charging'){
        b.state='loose';
        chargerSlot.remove(b.group);
        pickupPart('battery');
        playClunk(200,.1,.3); refreshHand();
      } else if (!chargerBattery && b.state==='charging'){
        showToast('Aki baru '+Math.round(batteryCharge)+'%', 'Sabar...');
      }
    }
    return;
  }
  const p = partById(iid);
  if (p && p.state==='loose' && !carrying){
    if (pickupPart(iid)){ playClunk(140,.12,.3); refreshHand(); }
    return;
  }
  if (iid==='car'){
    if (carrying==='jerrycan'){
      if (Math.hypot(player.x-car.x, player.z-car.z) > 6){ showToast('Dekati mobil untuk mengisi'); return; }
      busy = 2.4;
      showToast('Menyemplung bensin...', 'gluk gluk gluk');
      playPour();
      setTimeout(()=>{
        busy = 0;
        if (carrying!=='jerrycan') return;
        const add = Math.min(jerrycan.fuel, 100-car.fuel);
        car.fuel += add; jerrycan.fuel -= add;
        markTask('fuel');
        showToast('Tangki: '+Math.round(car.fuel)+'%', add<=0 ? 'Jerigen kosong / tangki penuh' : null);
        if (jerrycan.fuel<=0){ dropCarried(); showToast('Jerigen kosong — ditambah'); }
        refreshHand();
      }, 2400);
      return;
    }
    if (carrying && carrying!=='keys'){
      const nearCar = Math.hypot(player.x-car.x, player.z-car.z) < 6;
      if (!nearCar){ showToast('Dekati mobil untuk memasang'); return; }
      const idNow = carrying;
      const res = installPart(idNow);
      if (res===true){
        const obj = partById(idNow);
        obj.state='installed';
        carrying=null; refreshHand();
        playClunk(110,.2,.5);
        if (idNow!=='wheel'+idNow.slice(5)) {} // noop
        if (idNow.startsWith('wheel')) syncWheelTask(); else markTask(idNow);
        showToast(PART_LABEL[idNow]+' terpasang!');
      } else if (res==='needcharge'){
        showToast('Aki masih kosong!', 'Cas dulu di meja kerja');
      }
      return;
    }
    if (!carrying){
      const miss = missingParts();
      if (!miss.length && car.fuel>=5) enterCar();
      else if (miss.length) showToast('Mobil belum lengkap', 'Kurang: '+miss.join(', '));
      else showToast('Bensin habis', 'Butuh jerigen');
    }
  }
}
function syncWheelTask(){
  if (wheelCount()>=4) markTask('wheels');
  else { taskState['wheels']=false; refreshTasks(); }
}
let charging = false;
function updateCharging(dt){
  const b = partById('battery');
  if (!charging){
    if (b && b.state==='charging' && batteryCharge<100){ charging = true; }
    else return;
  }
  if (!b || b.state!=='charging'){ charging=false; return; }
  batteryCharge = Math.min(100, batteryCharge + 100*dt/6);
  if (batteryCharge>=100){
    charging=false; chargerBattery=true;
    showToast('Aki penuh!', '[E] di meja kerja untuk mengambil');
    playClunk(500,.2,.4);
  }
}
function refreshHand(){
  const el = document.getElementById('handItem');
  if (carrying){
    el.style.display='block';
    let extra='';
    if (carrying==='jerrycan') extra = ' · '+Math.round(jerrycan.fuel)+' L';
    if (carrying==='battery') extra = ' · '+Math.round(batteryCharge)+'%';
    el.innerHTML = '🤲 <b>'+PART_LABEL[carrying]+'</b>'+extra+'<br><span style="font-size:11px;color:#8fa0aa">[E] pasang · [Q] taruh</span>';
  } else el.style.display='none';
}

// ============================================================
// 9. HUD
// ============================================================
const TASKS = [
  {id:'keys',    label:'Ambil kunci kontak'},
  {id:'engine',  label:'Pasang blok mesin'},
  {id:'gearbox', label:'Pasang kopling + gearbox'},
  {id:'radiator',label:'Pasang radiator'},
  {id:'battery', label:'Cas aki & pasang'},
  {id:'wheels',  label:'Pasang 4 roda'},
  {id:'hood',    label:'Pasang kap mesin'},
  {id:'fuel',    label:'Isi bensin (jerigen)'},
  {id:'start',   label:'Starter mesin'},
  {id:'store',   label:'Nyambang ke KAUPPA'},
];
const taskState = {};
function refreshTasks(){
  const el = document.getElementById('taskList');
  el.innerHTML = TASKS.map(t=>
    `<div class="task ${taskState[t.id]?'done':''}"><div class="box"></div>${t.label}</div>`).join('');
}
function markTask(id){
  if (!id || taskState[id]) return;
  taskState[id]=true; refreshTasks();
}
refreshTasks();

let toastTimer = 0;
function showToast(msg, sub){
  const t = document.getElementById('toast');
  t.innerHTML = msg + (sub?`<span class="small">${sub}</span>`:'');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 3000);
}
function damageFlash(){
  const d = document.getElementById('damageFlash');
  d.style.opacity = .8; setTimeout(()=>d.style.opacity=0, 240);
}

const gcv = document.getElementById('gaugeCanvas');
const gg = gcv.getContext('2d');
function roundRect(g,x,y,w,h,r){
  g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}
function drawGauges(){
  const W=480,H=300;
  gg.clearRect(0,0,W,H);
  gg.fillStyle='rgba(8,10,12,.72)'; gg.strokeStyle='rgba(255,255,255,.16)'; gg.lineWidth=2;
  roundRect(gg,4,4,W-8,H-8,14); gg.fill(); gg.stroke();
  const cx=170, cy=170, r=112;
  gg.beginPath(); gg.arc(cx,cy,r,0,7); gg.closePath();
  const grad = gg.createRadialGradient(cx,cy,30,cx,cy,r);
  grad.addColorStop(0,'#14181c'); grad.addColorStop(1,'#0c0f12');
  gg.fillStyle=grad; gg.fill();
  gg.strokeStyle='#3a444d'; gg.lineWidth=3; gg.stroke();
  gg.beginPath(); gg.arc(cx,cy,r-7,Math.PI*.75+Math.PI*1.5*(6800/8000),Math.PI*2.25+Math.PI*.75);
  gg.strokeStyle='#a2261e'; gg.lineWidth=10; gg.stroke();
  for (let i=0;i<=8;i++){
    const a = Math.PI*.75 + Math.PI*1.5*(i/8);
    gg.strokeStyle = i>=7?'#ff5544':'#cfd9de'; gg.lineWidth=i%2?2:3.5;
    gg.beginPath();
    gg.moveTo(cx+Math.cos(a)*(r-4), cy+Math.sin(a)*(r-4));
    gg.lineTo(cx+Math.cos(a)*(r-18), cy+Math.sin(a)*(r-18));
    gg.stroke();
    gg.fillStyle = i>=7?'#ff5544':'#e8eef2'; gg.font='bold 19px Verdana'; gg.textAlign='center';
    gg.fillText(i, cx+Math.cos(a)*(r-34), cy+Math.sin(a)*(r-30)+7);
  }
  const rpmA = Math.PI*.75 + Math.PI*1.5*Math.min(1, car.rpm/8000);
  gg.strokeStyle='#ff5544'; gg.lineWidth=5; gg.lineCap='round';
  gg.beginPath(); gg.moveTo(cx,cy); gg.lineTo(cx+Math.cos(rpmA)*(r-26), cy+Math.sin(rpmA)*(r-26)); gg.stroke();
  gg.fillStyle='#e8eef2'; gg.beginPath(); gg.arc(cx,cy,9,0,7); gg.fill();
  gg.fillStyle='#8fa0aa'; gg.font='11px Verdana'; gg.textAlign='center';
  gg.fillText('RPM ×1000', cx, cy+38);
  gg.fillStyle='#ffd873'; gg.font='bold 30px Verdana';
  gg.fillText(car.engineOn?String(car.gear):'—', cx, cy+76);
  gg.fillStyle='#8fa0aa'; gg.font='11px Verdana'; gg.fillText('GEAR', cx, cy+94);
  gg.fillStyle='#e8eef2'; gg.font='bold 44px Verdana'; gg.textAlign='right';
  gg.fillText(Math.round(Math.abs(car.v)*3.6), W-30, 76);
  gg.fillStyle='#8fa0aa'; gg.font='12px Verdana'; gg.fillText('km/h', W-30, 96);
  const fw=130, fx=W-160, fy=116;
  gg.fillStyle='#1a2026'; gg.fillRect(fx,fy,fw,14);
  gg.fillStyle = car.fuel<15?'#ff5544':'#7ec97e';
  gg.fillRect(fx,fy,fw*Math.max(0,car.fuel)/100,14);
  gg.strokeStyle='#4a555e'; gg.strokeRect(fx,fy,fw,14);
  gg.fillStyle='#8fa0aa'; gg.textAlign='right'; gg.font='11px Verdana';
  gg.fillText('BENSIN '+Math.round(car.fuel)+'%', fx+fw, fy+30);
  const lamp = (x,y,on,color)=>{
    gg.beginPath(); gg.arc(x,y,12,0,7);
    gg.fillStyle = on?color:'#22282d'; gg.fill();
    gg.strokeStyle='#4a555e'; gg.lineWidth=2; gg.stroke();
  };
  lamp(64,246, !car.engineOn, '#ffb020');
  lamp(108,246, batteryCharge<20, '#ff5544');
  gg.fillStyle='#8fa0aa'; gg.textAlign='center'; gg.font='10px Verdana';
  gg.fillText('IGN', 64, 272); gg.fillText('CHG', 108, 272);
  gg.fillStyle='#5f6d76'; gg.textAlign='left'; gg.font='11px Verdana';
  gg.fillText('[E] starter  ·  [F] keluar  ·  [Spasi] rem tangan', 26, 292);
}

// ============================================================
// 10. AUDIO
// ============================================================
let AC=null, eng=null, windG=null, pourG=null;
function initAudio(){
  try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  const master = AC.createGain(); master.gain.value=.55; master.connect(AC.destination);
  const eg=AC.createGain(); eg.gain.value=0;
  const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=800;
  const o1=AC.createOscillator(); o1.type='sawtooth'; o1.frequency.value=44;
  const o2=AC.createOscillator(); o2.type='square'; o2.frequency.value=22;
  const o2g=AC.createGain(); o2g.gain.value=.5;
  o1.connect(lp); o2.connect(o2g); o2g.connect(lp); lp.connect(eg); eg.connect(master);
  o1.start(); o2.start();
  eng = { eg, o1, o2, lp, master };
  const buf = AC.createBuffer(1, AC.sampleRate*2, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const ns=AC.createBufferSource(); ns.buffer=buf; ns.loop=true;
  const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=480; bp.Q.value=.4;
  windG=AC.createGain(); windG.gain.value=0;
  ns.connect(bp); bp.connect(windG); windG.connect(master); ns.start();
  const ps=AC.createBufferSource(); ps.buffer=buf; ps.loop=true;
  const pf=AC.createBiquadFilter(); pf.type='lowpass'; pf.frequency.value=600;
  pourG=AC.createGain(); pourG.gain.value=0;
  ps.connect(pf); pf.connect(pourG); pourG.connect(master); ps.start();
}
function playClunk(freq=120, dur=.15, vol=.4){
  if (!AC) return;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type='triangle'; o.frequency.value=freq;
  o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.5), AC.currentTime+dur);
  g.gain.value=vol; g.gain.exponentialRampToValueAtTime(.001, AC.currentTime+dur);
  o.connect(g); g.connect(eng?eng.master:AC.destination);
  o.start(); o.stop(AC.currentTime+dur);
}
function playStep(){
  if (!AC) return;
  const dur=.09;
  const buf=AC.createBuffer(1,AC.sampleRate*dur,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
  const s=AC.createBufferSource(); s.buffer=buf;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=900;
  const g=AC.createGain(); g.gain.value=.12;
  s.connect(f); f.connect(g); g.connect(eng?eng.master:AC.destination); s.start();
}
function playPour(){ if (pourG) { pourG.gain.value=.16; setTimeout(()=>pourG.gain.value=0, 2400); } }
function crank(sec, done){
  if (!AC){ done(); return; }
  let n=0;
  const iv=setInterval(()=>{
    playClunk(70,.12,.35); n++;
    if (n>=sec*6){ clearInterval(iv); setTimeout(done,150); }
  }, 1000/6);
}
function updateAudio(dt){
  if (!eng) return;
  const t=AC.currentTime;
  if (car.engineOn){
    const f = car.rpm/16;
    eng.o1.frequency.setTargetAtTime(Math.max(20,f), t, .03);
    eng.o2.frequency.setTargetAtTime(Math.max(10,f*.5), t, .03);
    eng.lp.frequency.setTargetAtTime(500+Math.abs(car.v)*40, t, .05);
    eng.eg.gain.setTargetAtTime(.09 + (keys['KeyW']?.06:0), t, .08);
  } else eng.eg.gain.setTargetAtTime(0, t, .1);
  const spd = driving ? Math.abs(car.v) : ((keys['KeyW']||keys['KeyA']||keys['KeyS']||keys['KeyD'])?1:0);
  if (windG) windG.gain.setTargetAtTime(Math.min(.12, spd*.006), t, .2);
}

// ============================================================
// 11. START & MAIN LOOP
// ============================================================
const startScreen = document.getElementById('startScreen');
document.getElementById('startBtn').addEventListener('click', startGame);
startScreen.addEventListener('click', e=>{ if (e.target.id==='startScreen') startGame(); });
document.getElementById('loadingFill').style.width='100%';

function startGame(){
  if (started) return;
  started = true;
  initAudio();
  startScreen.classList.add('hide');
  document.getElementById('hud').classList.add('show');
  if (!isTouch) tryLock();
  showToast(isTouch ? '📱 Mode sentuh aktif' : 'Selamat datang di Finlandia',
    isTouch ? 'Joystick kiri jalan · geser layar menoleh · tombol E untuk aksi'
            : 'Kunci ada di papan dinding garasi — mulai rakit!');
}

// dev auto-build
if (DEV || DEV_DRIVE){
  ['engine','gearbox','radiator','hood'].forEach(id=>{ installPart(id); markTask(id); });
  for (let i=0;i<4;i++) installPart('wheel'+i);
  batteryCharge = 100; chargerBattery = true;
  installPart('battery'); markTask('battery');
  car.fuel = 70; markTask('fuel');
  pickupPart('keys'); markTask('keys');
  player.x = 0; player.z = 5.5;
}
if (DEV_DRIVE){
  keyItem.state='installed'; carrying=null; camera.remove(keyItem.group); refreshHand();
  enterCar(); car.engineOn = true; markTask('start');
  car.x=1.2; car.z=10; updateCarTransform();
}
if (Q.get('tp')){
  const [tx,tz] = Q.get('tp').split(',').map(Number);
  if (Q.get('yaw')) player.yaw = parseFloat(Q.get('yaw'))||0;
  if (driving){ car.x = tx||0; car.z = tz||0; updateCarTransform(); }
  else { player.x = tx||0; player.z = tz||0; }
}

const clock = new THREE.Clock();
if (Q.has('dbg')) window.__dbg = () => {
  const rc = new THREE.Raycaster(); rc.setFromCamera({x:0,y:0}, camera); rc.far = 50;
  const hits = rc.intersectObjects(carGroup, true).slice(0,8).map(h=>({
    d:+h.distance.toFixed(2), name:h.object.name||'?',
    mat:h.object.material && h.object.material.color ? h.object.material.color.getHexString() : null,
    p:h.object.getWorldPosition(new THREE.Vector3()).toArray().map(n=>+n.toFixed(1)),
    sz:h.object.geometry && h.object.geometry.parameters ? JSON.stringify(h.object.geometry.parameters) : null,
  }));
  const boxHits = [];
  const bb = new THREE.Box3(), ray = rc.ray.clone();
  shell.children.forEach((c,i)=>{
    bb.setFromObject(c);
    const p = ray.intersectBox(bb, new THREE.Vector3());
    if (p) boxHits.push({i, d:+ray.origin.distanceTo(p).toFixed(2),
      geo:c.geometry && c.geometry.type, sz:c.geometry && c.geometry.parameters ? JSON.stringify(c.geometry.parameters) : null,
      wp:c.getWorldPosition(new THREE.Vector3()).toArray().map(n=>+n.toFixed(2))});
  });
  const rc2 = new THREE.Raycaster(); rc2.far = 200;
  const probes = [[0.75,0],[0.9,0.2],[0.8,-0.3],[0.65,0.35]];
  const all = probes.map(pr=>{
    rc2.setFromCamera({x:pr[0],y:pr[1]}, camera);
    const h = rc2.intersectObjects([scene], true)[0];
    return pr + ' -> ' + (h ? (+h.distance.toFixed(2)+'m mat='+(h.object.material&&h.object.material.color?h.object.material.color.getHexString():'?')
      +' wp='+h.object.getWorldPosition(new THREE.Vector3()).toArray().map(n=>+n.toFixed(0))
      +' sz='+(h.object.geometry&&h.object.geometry.parameters?JSON.stringify(h.object.geometry.parameters):'')) : 'none');
  });
  return { all,
    taskState: JSON.parse(JSON.stringify(taskState)),
    taskDOM: document.getElementById('taskList').innerHTML.slice(400, 1200),
    parent: camera.parent && camera.parent.type,
    cam: camera.getWorldPosition(new THREE.Vector3()).toArray().map(n=>+n.toFixed(2)),
    carPos: carGroup.position.toArray().map(n=>+n.toFixed(2)),
    fuel: +car.fuel.toFixed(1), engineOn: car.engineOn, driving, speed:+(Math.abs(car.v)*3.6).toFixed(1),
    toast: document.getElementById('toast').textContent,
    carrying, partStates: parts.map(p=>p.id+':'+p.state).join(','), keysState: keyItem.state,
    miss: missingParts() };
};
window.__t = {
  pick: id => { hoverIid = id; tryInteract(); },
  charge: s => { batteryCharge = Math.min(100, batteryCharge + s); },
  enter: enterCar, exit: exitCar, ign: toggleIgnition,
  place: (t) => { car.x=t[0]; car.z=t[1]; car.rot=t[2]||0; updateCarTransform(); },
  press: (code, down) => { keys[code] = down; },
  hover: id => { hoverIid = id; },
  walk: (x,z) => { player.x = x; player.z = z; },
};
function loop(){
  requestAnimationFrame(loop);
  const dt = Math.min(.05, clock.getDelta());
  if (started){
    if (driving){
      updateCar(dt);
      carLook.yaw *= (1-1.4*dt); carLook.pitch *= (1-1.4*dt);
      camera.rotation.set(carLook.pitch, Math.PI + carLook.yaw, 0);
      drawGauges();
      document.getElementById('hint').style.display='none';
      document.getElementById('crosshair').style.opacity=.3;
    } else {
      updatePlayer(dt);
      updateHover();
      document.getElementById('crosshair').style.opacity=1;
    }
    updateCharging(dt);
    updateAudio(dt);
    const fx = driving?car.x:player.x, fz = driving?car.z:player.z;
    sun.position.set(fx+40, 62, fz-30);
    sun.target.position.set(fx, 0, fz);
    sky.position.set(fx, 0, fz);
    if (car.engineOn && Math.abs(car.v)<.1){
      carGroup.position.y = Math.sin(performance.now()*.04)*.004;
    } else if (!driving) carGroup.position.y = 0;
  }
  renderer.render(scene, camera);
}
loop();
