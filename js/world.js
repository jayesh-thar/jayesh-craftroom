/* =====================================================================
   world.js — the full map: a two-floor house (ground floor + loft
   reached by real stairs) sitting inside a bounded outdoor terrain
   with trees and a path. Building works anywhere walkable — indoors
   or outdoors — via a dynamic grid-based block system (no fixed zones).
   ===================================================================== */
(function(){
window.APP = window.APP || {};

const wrap = document.getElementById('canvas-wrap');
const scene = new THREE.Scene();
const SKY_DAY = 0x8fd6ff, SKY_NIGHT = 0x0b1030;
scene.background = new THREE.Color(SKY_DAY);
scene.fog = new THREE.Fog(SKY_DAY, 45, 145);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 240);

const renderer = new THREE.WebGLRenderer({ antialias:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
wrap.appendChild(renderer.domElement);

window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const ambient = new THREE.AmbientLight(0xffffff, 0.58);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff4d6, 0.95);
sun.position.set(20, 28, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-16; sun.shadow.camera.right=16; sun.shadow.camera.top=16; sun.shadow.camera.bottom=-16;
sun.shadow.camera.near = 5; sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0015;
sun.target.position.set(0,0,0);
scene.add(sun.target);
scene.add(sun);
const fillLight = new THREE.HemisphereLight(0xbfe3ff, 0x3d3222, 0.5);
scene.add(fillLight);

const lamps = [];
let isNight = false;
function setNight(on){
  isNight = on;
  const skyColor = isNight ? SKY_NIGHT : SKY_DAY;
  scene.background = new THREE.Color(skyColor);
  scene.fog.color = new THREE.Color(skyColor);
  sun.intensity = isNight ? 0.12 : 0.95;
  ambient.intensity = isNight ? 0.24 : 0.58;
  fillLight.intensity = isNight ? 0.18 : 0.5;
  lamps.forEach(function(l){ l.visible = isNight; });
  sunSprite.visible = !isNight;
  moonSprite.visible = isNight;
}

function glowSprite(coreColor, glowColor, size){
  const c = document.createElement('canvas'); c.width=c.height=128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64,64,10,64,64,64);
  grad.addColorStop(0, coreColor);
  grad.addColorStop(0.35, glowColor);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,128,128);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent:true, depthTest:false, depthWrite:false, fog:false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(size,size,1);
  sprite.renderOrder = -1;
  return sprite;
}
const sunSprite = glowSprite('rgba(255,250,220,1)', 'rgba(255,230,150,0.55)', 22);
sunSprite.position.set(-95, 110, -140);
scene.add(sunSprite);
const moonSprite = glowSprite('rgba(235,240,255,1)', 'rgba(190,200,255,0.5)', 14);
moonSprite.position.set(95, 100, 140);
moonSprite.visible = false;
scene.add(moonSprite);

/* ---------- procedural voxel textures ---------- */
function noiseTex(base, variants, size){
  size = size || 16;
  const c = document.createElement('canvas'); c.width=c.height=size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0,0,size,size);
  for(let i=0;i<size*size*0.35;i++){
    ctx.fillStyle = variants[Math.floor(Math.random()*variants.length)];
    ctx.fillRect(Math.floor(Math.random()*size), Math.floor(Math.random()*size), 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  return tex;
}
function plankTex(base, lineColor, size){
  size = size || 16;
  const c = document.createElement('canvas'); c.width=c.height=size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0,0,size,size);
  ctx.strokeStyle = lineColor; ctx.lineWidth = 1;
  for(let y=0;y<size;y+=4){ ctx.beginPath(); ctx.moveTo(0,y+.5); ctx.lineTo(size,y+.5); ctx.stroke(); }
  for(let x=0;x<size;x+=8){ for(let row=0; row<size; row+=8){
    ctx.beginPath(); ctx.moveTo(x+.5, row); ctx.lineTo(x+.5, row+4); ctx.stroke();
  }}
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  return tex;
}
function tiledNoiseTex(base, variants, repeatX, repeatY, size){
  const tex = noiseTex(base, variants, size||16);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

const MAT = {
  stone: new THREE.MeshLambertMaterial({ map: noiseTex('#8a8a8a', ['#7a7a7a','#9a9a9a','#6f6f6f']) }),
  stoneAccent: new THREE.MeshLambertMaterial({ map: noiseTex('#5f6f8a', ['#526080','#6f80a0']) }),
  stoneDark: new THREE.MeshLambertMaterial({ map: noiseTex('#6e6e6e', ['#5f5f5f','#7c7c7c']) }),
  plank: new THREE.MeshLambertMaterial({ map: plankTex('#a97a4a', '#8a5e34') }),
  plankDark: new THREE.MeshLambertMaterial({ map: plankTex('#6b4a2c', '#4f371f') }),
  grass: new THREE.MeshLambertMaterial({ map: noiseTex('#5fa93b', ['#549432','#6bb946']) }),
  grassGround: new THREE.MeshLambertMaterial({ map: tiledNoiseTex('#5fa93b', ['#549432','#6bb946','#4f8a2e'], 70, 70) }),
  path: new THREE.MeshLambertMaterial({ map: noiseTex('#b8a888', ['#a89878','#c8b898']) }),
  wool_green: new THREE.MeshLambertMaterial({ color: 0x3d7a3d }),
  wool_red: new THREE.MeshLambertMaterial({ color: 0x9a3b3b }),
  wool_blue: new THREE.MeshLambertMaterial({ color: 0x3b5f9a }),
  wool_yellow: new THREE.MeshLambertMaterial({ color: 0xd6b23b }),
  wool_dark: new THREE.MeshLambertMaterial({ color: 0x2a2a2a }),
  wool_orange: new THREE.MeshLambertMaterial({ color: 0xd67a2b }),
  wool_purple: new THREE.MeshLambertMaterial({ color: 0x7a3b9a }),
  wool_white: new THREE.MeshLambertMaterial({ color: 0xf0f0f0 }),
  oakDark: new THREE.MeshLambertMaterial({ map: plankTex('#4a3218', '#332012') }),
  sand: new THREE.MeshLambertMaterial({ map: noiseTex('#dfd0a0', ['#e8dcb0','#cfc090']) }),
  snowBlock: new THREE.MeshLambertMaterial({ map: noiseTex('#f2f6fa', ['#e8eef4','#ffffff']) }),
  obsidian: new THREE.MeshLambertMaterial({ color: 0x1c1626 }),
  sparkle: new THREE.MeshStandardMaterial({ color: 0x8ff0f0, emissive: 0x2fa0a0, emissiveIntensity: 0.4 }),
  glass: new THREE.MeshLambertMaterial({ color: 0xbfe8ff, transparent:true, opacity:0.35 }),
  screen: new THREE.MeshBasicMaterial({ color: 0x3ad6ff }),
  screenRetro: new THREE.MeshBasicMaterial({ color: 0x2bff6b }),
  bookA: new THREE.MeshLambertMaterial({ color: 0xb23b3b }),
  bookB: new THREE.MeshLambertMaterial({ color: 0x3b7ab2 }),
  bookC: new THREE.MeshLambertMaterial({ color: 0xd6b23b }),
  bookD: new THREE.MeshLambertMaterial({ color: 0x6bb946 }),
  chestWood: new THREE.MeshLambertMaterial({ map: plankTex('#8a5a2c', '#5f3c1a') }),
  chestGold: new THREE.MeshLambertMaterial({ color: 0xd6b23b }),
  frame: new THREE.MeshLambertMaterial({ color: 0x5f3c1a }),
  frameLight: new THREE.MeshLambertMaterial({ color: 0x8a6a3a }),
  crtBody: new THREE.MeshLambertMaterial({ color: 0xd8d2c0 }),
  crtDark: new THREE.MeshLambertMaterial({ color: 0x2a2a2a }),
  leafGreen: new THREE.MeshLambertMaterial({ color: 0x4a8a3a }),
  potBrown: new THREE.MeshLambertMaterial({ color: 0x7a4a2a }),
  trunkBrown: new THREE.MeshLambertMaterial({ map: plankTex('#6b4a2c','#4a3218') }),
  roofRed: new THREE.MeshLambertMaterial({ color: 0x8a3a2a }),
  lampGlow: new THREE.MeshBasicMaterial({ color: 0xffe8a0 }),
  glassBlock: new THREE.MeshLambertMaterial({ color: 0xbfe8ff, transparent:true, opacity:0.5 }),
  water: new THREE.MeshLambertMaterial({ color: 0x2f6fb0, transparent:true, opacity:0.72 }),
  fire: new THREE.MeshBasicMaterial({ color: 0xff8a2b }),
};

const texLoader = new THREE.TextureLoader();
function imageMat(path, fallbackColor){
  const mat = new THREE.MeshBasicMaterial({ color: fallbackColor });
  texLoader.load(path, function(tex){
    tex.magFilter = THREE.LinearFilter;
    mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
  }, undefined, function(){});
  return mat;
}
const bannerMat = imageMat('assets/banner.jpg', 0x4a6a9a);
const dpMat = imageMat('assets/dp.jpg', 0xc9a878);

function box(w,h,d, mat, x,y,z, castShadow){
  if(castShadow===undefined) castShadow=true;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  mesh.position.set(x,y,z);
  mesh.castShadow = castShadow; mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
function lbox(parent, w,h,d,mat,x,y,z,castShadow){
  if(castShadow===undefined) castShadow=true;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  mesh.position.set(x,y,z);
  mesh.castShadow = castShadow; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/* =====================================================================
   HOUSE — single story, open floor plan. Shell: 16 (x) by 13 (z).
   ===================================================================== */
const HALF_W = 8, HALF_D = 6.5;
const interactables = [];
const labelText = { about:'ABOUT (PC)', skills:'SKILLS', projects:'PROJECTS', certificates:'CERTIFICATES', contact:'CONTACT' };
const CEIL_H = 4.6;          // interior ceiling height
const DOOR_HALF = 1.1;       // half-width of the door gap, south wall

/* groundHeightAt(x,z): flat everywhere now that the house is single-story.
   Kept as a function (rather than a constant) so player.js and the build
   system don't need special-casing — same call signature as before. */
function groundHeightAt(x,z,currentY){
  return 0;
}

/* Floor (checkerboard plank look) */
const floorGroup = new THREE.Group();
for(let x=0; x<16; x++){
  for(let z=0; z<13; z++){
    const wx = -HALF_W+0.5+x, wz = -HALF_D+0.5+z;
    const m = ((x+z)%2===0) ? MAT.plank : MAT.plankDark;
    const b = new THREE.Mesh(new THREE.BoxGeometry(1,0.2,1), m);
    b.position.set(wx, -0.07, wz);
    b.receiveShadow = true;
    floorGroup.add(b);
  }
}
scene.add(floorGroup);

/* Exterior walls, thickness 0.3, with a door gap centered on the south wall.
   Two-tone modern look: stone base band + dark wood upper band. */
function wallSeg(x,z,w,d,h,y,mat){ box(w,h,d,mat, x, y, z); }
const WALL_TOP = CEIL_H, WALL_Y = WALL_TOP/2;
const BASE_H = WALL_TOP*0.42, UPPER_H = WALL_TOP - BASE_H;
function twoToneWall(x,z,w,isVertical){
  box(isVertical?0.3:w, BASE_H, isVertical?w:0.3, MAT.stone, x, BASE_H/2, z);
  box(isVertical?0.32:w, UPPER_H, isVertical?w:0.32, MAT.oakDark, x, BASE_H+UPPER_H/2, z);
}
twoToneWall(0, -HALF_D, 16, false);                                          // north
box(HALF_W-DOOR_HALF, WALL_TOP, 0.3, MAT.stone, -(HALF_W+DOOR_HALF)/2, WALL_Y, HALF_D); // south-left
box(HALF_W-DOOR_HALF, WALL_TOP, 0.3, MAT.stone,  (HALF_W+DOOR_HALF)/2, WALL_Y, HALF_D); // south-right
twoToneWall(-HALF_W, 0, HALF_D*2, true);                                     // west
twoToneWall(HALF_W, 0, HALF_D*2, true);                                      // east
box(16, 0.15, 0.06, MAT.frame, 0, BASE_H, -HALF_D+0.16, false);              // trim line, north

/* Modern flat roof cap with a dark fascia edge, slight overhang */
box(17.0, 0.3, 14.0, MAT.stoneDark, 0, WALL_TOP+0.2, 0, false);
box(17.4, 0.35, 0.35, MAT.oakDark, 0, WALL_TOP+0.05, -HALF_D-0.15, false);
box(17.4, 0.35, 0.35, MAT.oakDark, 0, WALL_TOP+0.05, HALF_D+0.15, false);
box(0.35, 0.35, 14.4, MAT.oakDark, -HALF_W-0.15, WALL_TOP+0.05, 0, false);
box(0.35, 0.35, 14.4, MAT.oakDark, HALF_W+0.15, WALL_TOP+0.05, 0, false);

/* Front door — hinged and interactive: press E to open/close */
MAT.doorGreen = new THREE.MeshLambertMaterial({ color: 0x5fb84a });
box(0.18, WALL_TOP, 0.4, MAT.oakDark, -DOOR_HALF-0.12, WALL_Y, HALF_D, false);
box(0.18, WALL_TOP, 0.4, MAT.oakDark,  DOOR_HALF+0.12, WALL_Y, HALF_D, false);
box(DOOR_HALF*2+0.5, 0.2, 0.4, MAT.oakDark, 0, WALL_TOP-0.1, HALF_D, false);
box(DOOR_HALF*0.9, WALL_TOP-0.5, 0.1, MAT.glass, DOOR_HALF*1.2, WALL_Y-0.1, HALF_D+0.02, false);

const DOOR_W = DOOR_HALF*1.5, DOOR_HINGE_X = -DOOR_HALF-0.06;
const doorGroup = new THREE.Group();
doorGroup.position.set(DOOR_HINGE_X, 1.3, HALF_D);
const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, 2.5, 0.12), MAT.doorGreen);
doorPanel.position.set(DOOR_W/2, 0, 0);
doorPanel.castShadow = true; doorPanel.receiveShadow = true;
const doorKnob = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.06), MAT.chestGold);
doorKnob.position.set(DOOR_W-0.2, 0, 0.08);
doorGroup.add(doorPanel, doorKnob);
scene.add(doorGroup);
let doorOpen = false;
function toggleDoor(){ doorOpen = !doorOpen; }
function updateDoorAnimation(dt){
  const target = doorOpen ? -1.3 : 0;
  doorGroup.rotation.y += (target - doorGroup.rotation.y) * Math.min(1, dt*6);
}
{
  const c = document.createElement('canvas'); c.width=220; c.height=64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(20,15,10,0.75)'; ctx.fillRect(0,0,220,64);
  ctx.strokeStyle = '#000'; ctx.lineWidth=4; ctx.strokeRect(2,2,216,60);
  ctx.fillStyle = '#7ee36b'; ctx.font = 'bold 22px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('DOOR', 110, 34);
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest:false }));
  sprite.scale.set(1.4, 0.4, 1);
  sprite.position.set(0, 3.6, HALF_D);
  scene.add(sprite);
}
interactables.push({ key:'door', x:0, y:0, z:HALF_D, radius:2.0 });
labelText.door = 'DOOR';

/* Porch overhang above the entrance, held up by two posts */
box(DOOR_HALF*2+1.6, 0.2, 1.6, MAT.oakDark, 0, 2.9, HALF_D+0.8, false);
box(0.18, 2.9, 0.18, MAT.oakDark, -DOOR_HALF-0.6, 1.45, HALF_D+1.4, false);
box(0.18, 2.9, 0.18, MAT.oakDark,  DOOR_HALF+0.6, 1.45, HALF_D+1.4, false);

/* Flower boxes under the north windows */
[-4.5, 4.5].forEach(function(wx){
  box(2.4, 0.3, 0.4, MAT.oakDark, wx, 2.1, -HALF_D+0.5, false);
  [-0.7,-0.2,0.3,0.8].forEach(function(off){
    box(0.18,0.22,0.18, [MAT.wool_red,MAT.wool_yellow,MAT.wool_purple][Math.floor(Math.random()*3)], wx+off, 2.32, -HALF_D+0.5);
  });
});

/* Chimney */
box(0.7, 3.2, 0.7, MAT.stoneDark, -HALF_W+2, WALL_TOP+1.4, -HALF_D+2, false);
box(0.9, 0.25, 0.9, MAT.stoneDark, -HALF_W+2, WALL_TOP+3.05, -HALF_D+2, false);

/* Entry rug just inside the door */
box(2.6, 0.05, 1.6, MAT.wool_red, 0, 0.02, HALF_D-1.6, false);
box(2.2, 0.06, 1.2, MAT.wool_dark, 0, 0.03, HALF_D-1.6, false);

/* Large glass windows on the north wall, dark-wood framed */
[-4.5, 4.5].forEach(function(wx){
  box(3.2, 1.9, 0.14, MAT.oakDark, wx, 2.75, -HALF_D+0.28);
  box(2.8, 1.55, 0.07, MAT.glass, wx, 2.75, -HALF_D+0.32);
  box(2.8, 0.06, 0.08, MAT.oakDark, wx, 2.75, -HALF_D+0.33, false);
  box(0.06, 1.55, 0.08, MAT.oakDark, wx, 2.75, -HALF_D+0.33, false);
});

/* East wall windows too, so the whole shell reads consistently glassy */
[-3, 3].forEach(function(wz){
  box(0.14, 1.9, 3.0, MAT.oakDark, HALF_W-0.28, 2.75, wz);
  box(0.07, 1.55, 2.6, MAT.glass, HALF_W-0.32, 2.75, wz);
});

/* Banner + profile photo frames flanking the entrance (south wall, interior face) */
box(3.4, 1.8, 0.08, MAT.frame, -4.6, 2.6, HALF_D-0.22);
box(3.0, 1.4, 0.05, bannerMat, -4.6, 2.6, HALF_D-0.26);
box(1.4, 1.8, 0.1, MAT.frameLight, 4.6, 2.2, HALF_D-0.22);
box(1.05, 1.4, 0.06, dpMat, 4.6, 2.2, HALF_D-0.26);

/* Ceiling lamps */
[[-4,-3],[4,-3],[-4,3],[4,3]].forEach(function(p){
  const l = box(0.45,0.3,0.45, MAT.lampGlow, p[0], CEIL_H-0.15, p[1], false);
  l.visible = false; lamps.push(l);
});

/* Entry-corner plant */
box(0.5,0.4,0.5, MAT.potBrown, -HALF_W+1.0, 0.2, HALF_D-1.0);
box(0.55,0.55,0.55, MAT.leafGreen, -HALF_W+1.0, 0.62, HALF_D-1.0);
box(0.35,0.35,0.35, MAT.leafGreen, -HALF_W+1.2, 0.95, HALF_D-1.1);

/* =====================================================================
   OUTDOOR TERRAIN — bounded park around the house
   ===================================================================== */
const WORLD_HALF = 70;
const groundPlane = new THREE.Mesh(
  new THREE.BoxGeometry(WORLD_HALF*2, 0.2, WORLD_HALF*2),
  MAT.grassGround
);
groundPlane.position.set(0, -0.1, 0);
groundPlane.receiveShadow = true;
groundPlane.userData.isGroundCollider = true;
scene.add(groundPlane);

/* Path from the front door out into the park */
for(let i=0;i<10;i++){
  const z = HALF_D + 0.6 + i*1.0;
  const b = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.08,0.95), MAT.path);
  b.position.set(0, -0.02, z);
  b.receiveShadow = true;
  scene.add(b);
}

/* Simple voxel trees scattered around the park, kept clear of the house */
const blossomMat = new THREE.MeshLambertMaterial({ color: 0xf0a8c8 });
const pineMat = new THREE.MeshLambertMaterial({ color: 0x2f6b3a });
function treeNormal(g,h){
  lbox(g, 0.4,h,0.4, MAT.trunkBrown, 0,h/2,0);
  lbox(g, 1.4,1.1,1.4, MAT.leafGreen, 0,h+0.35,0);
  lbox(g, 0.9,0.8,0.9, MAT.leafGreen, 0.3,h+0.95,0.2);
}
function treeBlossom(g,h){
  lbox(g, 0.35,h,0.35, MAT.trunkBrown, 0,h/2,0);
  [[0,0,0,1.3],[0.6,0.15,0.3,0.9],[-0.6,0.1,-0.3,0.9],[0.2,0.3,-0.5,0.8]].forEach(function(p){
    lbox(g, p[3],p[3]*0.75,p[3], blossomMat, p[0],h+0.3+p[1],p[2]);
  });
}
function treeBanyan(g,h){
  lbox(g, 0.6,h*0.7,0.6, MAT.trunkBrown, 0,h*0.35,0);
  [[0.5,0.3],[-0.5,-0.2],[0.1,0.6]].forEach(function(p){
    lbox(g, 0.28,h*0.6,0.28, MAT.trunkBrown, p[0],h*0.3,p[1]);
  });
  lbox(g, 2.4,1.0,2.4, MAT.leafGreen, 0,h*0.7+0.5,0);
  lbox(g, 1.6,0.7,1.6, MAT.leafGreen, 0.5,h*0.7+1.05,0.3);
}
function treeChristmas(g,h){
  lbox(g, 0.32,h*0.4,0.32, MAT.trunkBrown, 0,h*0.2,0);
  [0,0.55,1.05,1.5].forEach(function(y,i){
    const w = 1.5 - i*0.32;
    lbox(g, w,0.55,w, pineMat, 0, h*0.4+y, 0);
  });
  lbox(g, 0.18,0.22,0.18, MAT.wool_yellow, 0, h*0.4+1.85, 0);
}
function tree(x,z,type){
  const g = new THREE.Group(); g.position.set(x,0,z);
  const h = 1.6 + Math.random()*0.8;
  const t = type || 'normal';
  if(t==='blossom') treeBlossom(g,h);
  else if(t==='banyan') treeBanyan(g,h*1.3);
  else if(t==='christmas') treeChristmas(g,h);
  else treeNormal(g,h);
  scene.add(g);
  return { x:x, z:z, r: t==='banyan' ? 1.8 : 1.0 };
}
const treeKeepOut = [];
(function scatterTrees(){
  let placed = 0, attempts = 0;
  while(placed < 55 && attempts < 1200){
    attempts++;
    const x = (Math.random()*2-1) * (WORLD_HALF-3);
    const z = (Math.random()*2-1) * (WORLD_HALF-3);
    const insideHouseZone = Math.abs(x) < HALF_W+3 && Math.abs(z) < HALF_D+4;
    if(insideHouseZone) continue;
    const types = ['normal','normal','normal','blossom','banyan','christmas'];
    treeKeepOut.push(tree(x,z, types[Math.floor(Math.random()*types.length)]));
    placed++;
  }
})();

/* Low boundary wall so the park feels enclosed rather than an infinite void */
(function boundaryFence(){
  const span = WORLD_HALF*2, pillarGap = 6;
  function fenceLine(fixedAxis, fixedVal){
    for(let p=-WORLD_HALF; p<=WORLD_HALF; p+=pillarGap){
      const isX = fixedAxis==='z';
      const px = isX ? p : fixedVal, pz = isX ? fixedVal : p;
      box(0.5, 1.4, 0.5, MAT.stoneDark, px, 0.7, pz, false);
      box(0.6, 0.2, 0.6, MAT.stoneDark, px, 1.45, pz, false);
      for(let s=0.8; s<pillarGap-0.8; s+=0.8){
        const gx = isX ? p+s : fixedVal, gz = isX ? fixedVal : p+s;
        if(Math.abs((isX?gx:gz)) > WORLD_HALF) continue;
        box(isX?0.12:0.9, 0.9, isX?0.9:0.12, MAT.oakDark, gx, 0.55, gz, false);
        box(isX?0.12:0.9, 0.14, isX?0.9:0.12, MAT.oakDark, gx, 0.95, gz, false);
      }
    }
  }
  fenceLine('x', -WORLD_HALF); fenceLine('x', WORLD_HALF);
  fenceLine('z', -WORLD_HALF); fenceLine('z', WORLD_HALF);
})();

/* Scattered flower patches + butterflies fluttering above a few of them */
const butterflies = [];
function flowerPatch(x,z){
  const colors = [MAT.wool_red, MAT.wool_yellow, MAT.wool_purple, MAT.wool_white];
  for(let i=0;i<5;i++){
    const fx = x + (Math.random()*2-1)*1.2, fz = z + (Math.random()*2-1)*1.2;
    box(0.1,0.35,0.1, MAT.leafGreen, fx, 0.17, fz, false);
    box(0.16,0.16,0.16, colors[Math.floor(Math.random()*colors.length)], fx, 0.4, fz, false);
  }
}
function butterfly(x,z){
  const wingMat = new THREE.MeshBasicMaterial({ color: [0xff8a2b,0xd6b23b,0xbfe8ff,0xf07ab0][Math.floor(Math.random()*4)], side: THREE.DoubleSide });
  const g = new THREE.Group();
  const w1 = new THREE.Mesh(new THREE.PlaneGeometry(0.18,0.14), wingMat); w1.position.x=-0.09;
  const w2 = new THREE.Mesh(new THREE.PlaneGeometry(0.18,0.14), wingMat); w2.position.x=0.09;
  g.add(w1,w2);
  g.position.set(x, 0.5+Math.random()*0.4, z);
  g.userData.center = { x:x, z:z };
  g.userData.phase = Math.random()*Math.PI*2;
  scene.add(g);
  butterflies.push(g);
}
for(let i=0;i<14;i++){
  const fx = (Math.random()*2-1)*(WORLD_HALF-4);
  const fz = (Math.random()*2-1)*(WORLD_HALF-4);
  if(Math.abs(fx)<HALF_W+4 && Math.abs(fz)<HALF_D+5) continue;
  flowerPatch(fx,fz);
  if(Math.random()<0.5) butterfly(fx+0.3, fz+0.3);
}

/* =====================================================================
   PARK STRUCTURES — a few hand-built landmarks scattered in the bigger
   outdoor area, so exploring it has something to find.
   ===================================================================== */
(function buildWell(){
  const g = new THREE.Group(); g.position.set(-14, 0, 10); scene.add(g);
  const ring = 8, r = 1.1;
  for(let i=0;i<ring;i++){
    const a = (i/ring)*Math.PI*2;
    lbox(g, 0.5,0.9,0.5, MAT.stoneDark, Math.cos(a)*r, 0.45, Math.sin(a)*r);
  }
  lbox(g, 2.6,0.15,2.6, MAT.water, 0, 0.3, 0);
  lbox(g, 0.15,1.6,0.15, MAT.oakDark, -r,1.6,0);
  lbox(g, 0.15,1.6,0.15, MAT.oakDark,  r,1.6,0);
  lbox(g, r*2+0.3,0.15,0.3, MAT.oakDark, 0,2.35,0);
  lbox(g, 0.5,0.4,1.4, MAT.oakDark, 0,2.0,0);
})();

(function buildPergola(){
  const g = new THREE.Group(); g.position.set(14, 0, -10); scene.add(g);
  const w=3.4, d=3.4, h=2.4;
  [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]].forEach(function(p){
    lbox(g, 0.2,h,0.2, MAT.oakDark, p[0],h/2,p[1]);
  });
  for(let i=-2;i<=2;i++){
    lbox(g, 0.12,0.12,d+0.4, MAT.oakDark, i*(w/4), h+0.1, 0);
  }
  lbox(g, w+0.4,0.12,0.12, MAT.oakDark, 0, h+0.16, -d/2);
  lbox(g, w+0.4,0.12,0.12, MAT.oakDark, 0, h+0.16,  d/2);
  lbox(g, 1.0,0.5,1.0, MAT.wool_dark, 0,0.25,0);
  [-0.7,0.7].forEach(function(off){ lbox(g, 0.5,0.4,0.5, MAT.wool_green, off,0.2,off*0.6); });
})();

(function buildRuins(){
  const g = new THREE.Group(); g.position.set(-16, 0, -18); scene.add(g);
  const heights = [2.4, 1.6, 3.0, 0.9, 2.0];
  heights.forEach(function(h, i){
    const a = (i/heights.length)*Math.PI*2;
    const rr = 3.2;
    lbox(g, 0.9, h, 0.9, MAT.stoneDark, Math.cos(a)*rr, h/2, Math.sin(a)*rr);
  });
  lbox(g, 5,0.1,5, MAT.stone, 0,0.05,0);
})();

/* =====================================================================
   INTERACTIVE STATIONS — ground floor (west wing) + loft (upstairs)
   ===================================================================== */

function addStation(key, x,y,z, radius, labelY, buildFn){
  const g = new THREE.Group();
  g.position.set(x, y, z);
  buildFn(g);
  scene.add(g);
  interactables.push({ key, x, y, z, radius });

  const c = document.createElement('canvas'); c.width=280; c.height=64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(20,15,10,0.75)'; ctx.fillRect(0,0,280,64);
  ctx.strokeStyle = '#000'; ctx.lineWidth=4; ctx.strokeRect(2,2,276,60);
  ctx.fillStyle = '#7ee36b'; ctx.font = 'bold 24px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(labelText[key], 140, 34);
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest:false }));
  sprite.scale.set(1.7, 0.39, 1);
  sprite.position.set(0, labelY, 0);
  g.add(sprite);
  return g;
}

addStation('about', -5, 0, 3.5, 1.8, 2.6, function(g){
  lbox(g, 1.5,0.15,0.85, MAT.plankDark, 0,0.75,0);
  lbox(g, 0.12,0.75,0.12, MAT.plankDark, -0.65,0.375,-0.32);
  lbox(g, 0.12,0.75,0.12, MAT.plankDark,  0.65,0.375,-0.32);
  lbox(g, 0.12,0.75,0.12, MAT.plankDark, -0.65,0.375, 0.32);
  lbox(g, 0.12,0.75,0.12, MAT.plankDark,  0.65,0.375, 0.32);
  lbox(g, 0.5,0.45,0.5, MAT.crtBody, -0.3,1.02,-0.14);
  lbox(g, 0.36,0.32,0.06, MAT.crtDark, -0.3,1.06,0.12);
  lbox(g, 0.28,0.24,0.03, MAT.screenRetro, -0.3,1.06,0.16);
  lbox(g, 0.28,0.05,0.36, MAT.crtDark, -0.3,0.83,0.22);
  lbox(g, 0.32,0.4,0.06, MAT.crtBody, -0.3,0.58,-0.38, false);
  lbox(g, 0.5,0.32,0.46, MAT.wool_dark, 0.5,0.32,0.32);
  lbox(g, 0.46,0.46,0.08, MAT.wool_dark, 0.5,0.6,0.54);
});

addStation('skills', -6.5, 0, -1, 1.8, 2.7, function(g){
  lbox(g, 0.4,2.3,2.3, MAT.plankDark, 0,1.15,0);
  const books = [MAT.bookA,MAT.bookB,MAT.bookC,MAT.bookD];
  for(let row=0; row<3; row++){
    let cursor=-1.0;
    for(let i=0;i<8;i++){
      const w = 0.16 + Math.random()*0.05;
      if(cursor > 0.95) break;
      lbox(g, 0.26, 0.48, w, books[Math.floor(Math.random()*books.length)], 0.05, 0.48+row*0.72, cursor+w/2);
      cursor += w+0.02;
    }
  }
});

addStation('projects', -3, 0, -4.7, 1.8, 1.95, function(g){
  lbox(g, 1.8,0.15,0.8, MAT.plankDark, 0,0.75,0);
  lbox(g, 0.12,0.75,0.12, MAT.plankDark, -0.8,0.375,-0.3);
  lbox(g, 0.12,0.75,0.12, MAT.plankDark,  0.8,0.375,-0.3);
  lbox(g, 0.12,0.75,0.12, MAT.plankDark, -0.8,0.375, 0.3);
  lbox(g, 0.12,0.75,0.12, MAT.plankDark,  0.8,0.375, 0.3);
  lbox(g, 0.5,0.38,0.06, MAT.stoneDark, -0.38,1.08,-0.26);
  lbox(g, 0.38,0.25,0.03, MAT.screen, -0.38,1.08,-0.23);
  lbox(g, 0.5,0.38,0.06, MAT.stoneDark, 0.38,1.08,-0.26);
  lbox(g, 0.38,0.25,0.03, MAT.screen, 0.38,1.08,-0.23);
  lbox(g, 0.5,0.28,0.5, MAT.wool_blue, 0,0.38,0.46);
});

addStation('certificates', 5, 0, -1, 1.8, 2.6, function(g){
  [[-0.9,0],[-0.3,0],[0.3,0],[0.9,0]].forEach(function(p, i){
    lbox(g, 0.06,0.65,0.5, MAT.frame, 0.05, 1.85, p[0]);
    lbox(g, 0.03,0.46,0.34, [MAT.wool_blue,MAT.wool_red,MAT.wool_yellow,MAT.wool_green][i%4], 0.09, 1.85, p[0]);
  });
});

addStation('contact', 5, 0, 3.2, 1.6, 1.45, function(g){
  lbox(g, 0.95,0.55,0.65, MAT.chestWood, 0,0.32,0);
  lbox(g, 0.97,0.11,0.67, MAT.chestGold, 0,0.62,0);
  lbox(g, 0.1,0.1,0.1, MAT.chestGold, 0,0.42,0.34);
});

/* =====================================================================
   BUILD SYSTEM — place/break works anywhere: indoors, in the loft, or
   across the whole outdoor terrain. No fixed zones; a dynamic grid map
   keyed by cell coordinates tracks stacked blocks (up to 4 high).
   ===================================================================== */
const CELL = 0.86, MAX_HEIGHT = 4, HALF_BLOCK = CELL/2;
const EYE_HEIGHT_REF = 1.6;

const indoorGroundCollider = new THREE.Mesh(
  new THREE.BoxGeometry(16, 0.1, 13),
  new THREE.MeshBasicMaterial({ visible:false })
);
indoorGroundCollider.position.set(0, -0.05, 0);
scene.add(indoorGroundCollider);

const groundColliders = [indoorGroundCollider, groundPlane];
const dynamicBlocks = [];
const dynamicBlockMeshes = [];

function blockMatFor(itemId){
  if(itemId==='grass') return MAT.grass;
  if(itemId==='stone') return MAT.stone;
  if(itemId==='stonedark') return MAT.stoneDark;
  if(itemId==='plank') return MAT.plank;
  if(itemId==='oakdark') return MAT.oakDark;
  if(itemId==='sand') return MAT.sand;
  if(itemId==='snow') return MAT.snowBlock;
  if(itemId==='obsidian') return MAT.obsidian;
  if(itemId==='sparkle') return MAT.sparkle;
  if(itemId==='glass') return MAT.glassBlock;
  if(itemId==='water') return MAT.water;
  if(itemId==='fire') return MAT.fire;
  if(itemId==='wool_red') return MAT.wool_red;
  if(itemId==='wool_blue') return MAT.wool_blue;
  if(itemId==='wool_yellow') return MAT.wool_yellow;
  if(itemId==='wool_orange') return MAT.wool_orange;
  if(itemId==='wool_purple') return MAT.wool_purple;
  if(itemId==='wool_white') return MAT.wool_white;
  return MAT.stone;
}
function findStack(gx,gz){
  for(let i=0;i<dynamicBlocks.length;i++){ if(dynamicBlocks[i].gx===gx && dynamicBlocks[i].gz===gz) return dynamicBlocks[i]; }
  return null;
}
let animT = 0;
function updateWorldAnimations(dt){
  animT += dt;
  MAT.water.opacity = 0.66 + Math.sin(animT*1.6)*0.08;
  const flicker = 0.5 + Math.sin(animT*14) * 0.5 * (0.6 + Math.random()*0.4);
  MAT.fire.color.setHSL(0.08 - flicker*0.02, 1, 0.5 + flicker*0.12);
  fireMeshes.forEach(function(g){
    const f = 0.5 + Math.sin(animT*16 + g.id) * 0.5 * (0.6 + Math.random()*0.4);
    g.children.forEach(function(p){ p.material.color.setHSL(0.08 - f*0.02, 1, 0.5 + f*0.15); });
    const s = 0.92 + f*0.16;
    g.scale.set(s, 0.9+f*0.2, s);
  });
  if(typeof updateSkyAnimations === 'function') updateSkyAnimations(dt);
}

function tagRecursive(obj, gx, gz){
  obj.userData.isDynamicBlock = true;
  obj.userData.gx = gx; obj.userData.gz = gz;
  obj.traverse(function(child){
    child.userData.isDynamicBlock = true;
    child.userData.gx = gx; child.userData.gz = gz;
    child.castShadow = true; child.receiveShadow = true;
  });
}
const fireMeshes = [];
function buildPlacedShape(itemId){
  if(itemId==='slab'){
    return new THREE.Mesh(new THREE.BoxGeometry(CELL*0.96, CELL*0.46, CELL*0.96), blockMatFor('plank'));
  }
  if(itemId==='stair'){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(CELL*0.96, CELL*0.46, CELL*0.96), blockMatFor('stonedark'));
    base.position.set(0, -CELL*0.25, 0);
    const step = new THREE.Mesh(new THREE.BoxGeometry(CELL*0.96, CELL*0.46, CELL*0.46), blockMatFor('stonedark'));
    step.position.set(0, CELL*0.23, -CELL*0.23);
    g.add(base, step);
    return g;
  }
  if(itemId==='fence'){
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(CELL*0.18, CELL*0.96, CELL*0.18), blockMatFor('oakdark'));
    g.add(post);
    [0.16, -0.1].forEach(function(yOff){
      const railX = new THREE.Mesh(new THREE.BoxGeometry(CELL*0.5, CELL*0.1, CELL*0.1), blockMatFor('oakdark'));
      railX.position.set(CELL*0.22, CELL*yOff, 0);
      const railX2 = railX.clone(); railX2.position.x = -CELL*0.22;
      const railZ = new THREE.Mesh(new THREE.BoxGeometry(CELL*0.1, CELL*0.1, CELL*0.5), blockMatFor('oakdark'));
      railZ.position.set(0, CELL*yOff, CELL*0.22);
      const railZ2 = railZ.clone(); railZ2.position.z = -CELL*0.22;
      g.add(railX, railX2, railZ, railZ2);
    });
    return g;
  }
  if(itemId==='water'){
    return new THREE.Mesh(new THREE.BoxGeometry(CELL*0.98, CELL*0.5, CELL*0.98), MAT.water);
  }
  if(itemId==='fire'){
    const g = new THREE.Group();
    const geo = new THREE.PlaneGeometry(CELL*0.9, CELL*0.9);
    const p1 = new THREE.Mesh(geo, MAT.fire); p1.material = MAT.fire.clone(); p1.rotation.y = Math.PI/4;
    const p2 = new THREE.Mesh(geo, MAT.fire); p2.material = MAT.fire.clone(); p2.rotation.y = -Math.PI/4;
    p1.material.side = THREE.DoubleSide; p2.material.side = THREE.DoubleSide;
    g.add(p1, p2);
    g.userData.isFire = true;
    fireMeshes.push(g);
    return g;
  }
  return new THREE.Mesh(new THREE.BoxGeometry(CELL*0.96,CELL*0.96,CELL*0.96), blockMatFor(itemId));
}

const build = {
  groundColliders: groundColliders,
  dynamicBlockMeshes: dynamicBlockMeshes,
  cellSize: CELL,
  heightAt: function(x,z){
    const cell = build.cellFromWorld(x,z);
    const stack = findStack(cell.gx, cell.gz);
    if(!stack || stack.layers.length===0) return null;
    const base = groundHeightAt(cell.gx*CELL, cell.gz*CELL);
    return base + stack.layers.length*CELL;
  },
  isSolidAt: function(x,z,currentEyeY){
    const h = build.heightAt(x,z);
    if(h===null) return false;
    // Standable on top once already up there (same trick used for the old
    // loft) — otherwise it's a solid obstacle you walk into, not through.
    if(currentEyeY !== undefined && currentEyeY >= h + EYE_HEIGHT_REF - 0.9) return false;
    return true;
  },
  placeAt: function(gx, gz, itemId, referenceY){
    let stack = findStack(gx,gz);
    if(!stack){ stack = { gx:gx, gz:gz, layers:[], meshes:[] }; dynamicBlocks.push(stack); }
    if(stack.layers.length >= MAX_HEIGHT) return;
    const worldX = gx*CELL, worldZ = gz*CELL;
    const base = groundHeightAt(worldX, worldZ, referenceY);
    const h = stack.layers.length;
    const mesh = buildPlacedShape(itemId);
    mesh.position.set(worldX, base + HALF_BLOCK + h*CELL, worldZ);
    tagRecursive(mesh, gx, gz);
    scene.add(mesh);
    stack.layers.push(itemId);
    stack.meshes.push(mesh);
    dynamicBlockMeshes.push(mesh);
  },
  breakTop: function(gx, gz){
    const stack = findStack(gx,gz);
    if(!stack || stack.layers.length===0) return;
    const mesh = stack.meshes.pop();
    stack.layers.pop();
    scene.remove(mesh);
    const idx = dynamicBlockMeshes.indexOf(mesh);
    if(idx>=0) dynamicBlockMeshes.splice(idx,1);
    const fIdx = fireMeshes.indexOf(mesh);
    if(fIdx>=0) fireMeshes.splice(fIdx,1);
  },
  cellFromWorld: function(x,z){ return { gx: Math.round(x/CELL), gz: Math.round(z/CELL) }; }
};

/* =====================================================================
   WALL COLLIDERS — axis-aligned rectangles player.js slides against
   ===================================================================== */
const wallColliders = [
  { minX:-HALF_W-0.2, maxX:HALF_W+0.2, minZ:-HALF_D-0.2, maxZ:-HALF_D+0.2 },              // north
  { minX:-HALF_W-0.2, maxX:-DOOR_HALF, minZ:HALF_D-0.2, maxZ:HALF_D+0.2 },                 // south-left
  { minX:DOOR_HALF, maxX:HALF_W+0.2, minZ:HALF_D-0.2, maxZ:HALF_D+0.2 },                   // south-right
  { minX:-HALF_W-0.2, maxX:-HALF_W+0.2, minZ:-HALF_D-0.2, maxZ:HALF_D+0.2 },               // west
  { minX:HALF_W-0.2, maxX:HALF_W+0.2, minZ:-HALF_D-0.2, maxZ:HALF_D+0.2 },                 // east
  // (Loft-edge walls intentionally removed: with 2D collision, a wall at the
  // loft's footprint blocks the ground floor underneath too. Falling off the
  // loft if you walk off its edge — instead of using the stairs — is real
  // Minecraft physics, not a bug. The groundHeightAt() hysteresis check
  // already stops the false "snap upward" when just walking underneath it.
  { minX:-WORLD_HALF-0.5, maxX:WORLD_HALF+0.5, minZ:-WORLD_HALF-0.5, maxZ:-WORLD_HALF+0.3 },// park north boundary
  { minX:-WORLD_HALF-0.5, maxX:WORLD_HALF+0.5, minZ:WORLD_HALF-0.3, maxZ:WORLD_HALF+0.5 },  // park south boundary
  { minX:-WORLD_HALF-0.5, maxX:-WORLD_HALF+0.3, minZ:-WORLD_HALF-0.5, maxZ:WORLD_HALF+0.5 },// park west boundary
  { minX:WORLD_HALF-0.3, maxX:WORLD_HALF+0.5, minZ:-WORLD_HALF-0.5, maxZ:WORLD_HALF+0.5 }   // park east boundary
];
/* Cut a doorway-sized gap through the north/south/west/east house walls is
   already handled by the two south segments above; the other three walls
   are solid (no interior doors between rooms in this version). */

/* =====================================================================
   SKY — drifting clouds + birds that cross at intervals
   ===================================================================== */
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent:true, opacity:0.9 });
const clouds = [];
function makeCloud(x,y,z,scale){
  const g = new THREE.Group();
  g.position.set(x,y,z);
  const puffs = [[0,0,0,1],[0.7,0.1,0.2,0.8],[-0.7,0.05,-0.1,0.75],[0.2,-0.05,0.5,0.7]];
  puffs.forEach(function(p){
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.6*scale,0.5*scale,1.2*scale), cloudMat);
    m.position.set(p[0]*scale*2, p[1]*scale, p[2]*scale*2);
    g.add(m);
  });
  scene.add(g);
  return g;
}
for(let i=0;i<9;i++){
  const cx = (Math.random()*2-1) * WORLD_HALF*1.3;
  const cz = (Math.random()*2-1) * WORLD_HALF*1.3;
  const cy = 16 + Math.random()*6;
  const c = makeCloud(cx,cy,cz, 1.2+Math.random()*1.2);
  c.userData.speed = 0.25 + Math.random()*0.35;
  clouds.push(c);
}

const birdWingMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
function makeBird(){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.1,0.3), birdWingMat);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.04,0.16), birdWingMat);
  const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.04,0.16), birdWingMat);
  wingL.position.set(-0.32,0,0); wingR.position.set(0.32,0,0);
  g.add(body, wingL, wingR);
  g.userData.wingL = wingL; g.userData.wingR = wingR;
  return g;
}
let activeBird = null, birdTimer = 6;
function spawnBird(){
  const startX = -WORLD_HALF-4, endX = WORLD_HALF+4;
  const z = (Math.random()*2-1)*WORLD_HALF*0.7;
  const y = 9 + Math.random()*5;
  const b = makeBird();
  b.position.set(startX, y, z);
  scene.add(b);
  activeBird = { group:b, startX:startX, endX:endX, y:y, z:z, t:0, dur: 14+Math.random()*6 };
}

/* =====================================================================
   DISTANT SCENERY — mountains ringing the horizon + an animated waterfall
   (purely visual, sits beyond the boundary fence, not walkable)
   ===================================================================== */
const mountainMat = new THREE.MeshLambertMaterial({ color: 0x7a8a7a });
const snowCapMat = new THREE.MeshLambertMaterial({ color: 0xf0f4f8 });
const rockMidMat = new THREE.MeshLambertMaterial({ color: 0x8a9a86 });
(function buildMountains(){
  const ring = WORLD_HALF + 8;
  const count = 26;
  for(let i=0;i<count;i++){
    const angle = (i/count)*Math.PI*2 + Math.random()*0.15;
    const dist = ring + Math.random()*14;
    const x = Math.cos(angle)*dist, z = Math.sin(angle)*dist;
    const h = 14 + Math.random()*18;
    const w = 8 + Math.random()*9;
    box(w, h*0.55, w, mountainMat, x, h*0.275, z, false);
    box(w*0.72, h*0.35, w*0.72, rockMidMat, x, h*0.55+h*0.175, z, false);
    box(w*0.5, h*0.28, w*0.5, snowCapMat, x, h*0.88, z, false);
  }
})();

const waterfallTex = tiledNoiseTex('#bfe3ff', ['#d8f0ff','#9fd0f0'], 1, 4, 16);
const waterfallMat = new THREE.MeshLambertMaterial({ map: waterfallTex, transparent:true, opacity:0.85 });
const waterfallX = WORLD_HALF*0.55, waterfallZ = -(WORLD_HALF+6);
box(9, 20, 9, mountainMat, waterfallX, 10, waterfallZ, false);
const waterfallPlane = box(2.2, 14, 0.4, waterfallMat, waterfallX, 8, waterfallZ+4.6, false);
box(3.5, 0.6, 3.5, MAT.water, waterfallX, 0.3, waterfallZ+5.6, false);

function updateSkyAnimations(dt){
  clouds.forEach(function(c){
    c.position.x += c.userData.speed*dt;
    if(c.position.x > WORLD_HALF*1.3+5) c.position.x = -WORLD_HALF*1.3-5;
  });
  birdTimer -= dt;
  if(!activeBird && birdTimer<=0){ spawnBird(); birdTimer = 18+Math.random()*12; }
  if(activeBird){
    activeBird.t += dt;
    const p = Math.min(1, activeBird.t/activeBird.dur);
    activeBird.group.position.x = activeBird.startX + (activeBird.endX-activeBird.startX)*p;
    activeBird.group.position.y = activeBird.y + Math.sin(p*Math.PI*6)*0.4;
    const flap = Math.sin(activeBird.t*10)*0.6;
    activeBird.group.userData.wingL.rotation.z = flap;
    activeBird.group.userData.wingR.rotation.z = -flap;
    if(p>=1){ scene.remove(activeBird.group); activeBird = null; }
  }
  waterfallTex.offset.y -= dt*1.4;
  butterflies.forEach(function(b){
    b.userData.phase += dt*2.2;
    const p = b.userData.phase, c = b.userData.center;
    b.position.x = c.x + Math.sin(p)*0.6;
    b.position.z = c.z + Math.sin(p*2)*0.35;
    b.position.y = 0.5 + Math.sin(p*3)*0.15;
    b.rotation.y = p;
    const flap = Math.sin(p*10);
    b.children[0].rotation.y = flap*0.8;
    b.children[1].rotation.y = -flap*0.8;
  });
}

/* =====================================================================
   (Expanded block palette materials now live in the main MAT object above,
   defined early so house construction can use them safely.)
   ===================================================================== */


APP.scene = scene;
APP.camera = camera;
APP.renderer = renderer;
APP.dom = renderer.domElement;
APP.HALF_W = HALF_W; APP.HALF_D = HALF_D;
APP.WORLD_HALF = WORLD_HALF;
APP.MAT = MAT;
APP.box = box;
APP.lbox = lbox;
APP.interactables = interactables;
APP.labelText = labelText;
APP.setNight = setNight;
APP.isNight = function(){ return isNight; };
APP.build = build;
APP.SPAWN = { x: 0, z: HALF_D-1.5 };
APP.wallColliders = wallColliders;
/* =====================================================================
   NPCs — a handful of characters wandering the park, each with their own
   outfit colors and a simple pick-a-spot-and-walk behavior.
   ===================================================================== */
const npcs = [];
function buildNpc(shirtColor, pantsColor, isFemale){
  const skinMat = new THREE.MeshLambertMaterial({ color: 0xe0ac69 });
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
  const hairMat = new THREE.MeshLambertMaterial({ color: [0x2a1a10,0x4a3018,0x1a1a1a,0x6b4a2c][Math.floor(Math.random()*4)] });
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.4,0.4), skinMat);
  head.position.y = 1.55; head.castShadow = true;
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.42,0.14,0.42), hairMat);
  hair.position.y = 1.76; hair.castShadow = true;
  const bodyW = isFemale ? 0.42 : 0.52;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW,0.6,0.26), shirtMat);
  body.position.y = 1.04; body.castShadow = true;
  function limb(w,h,d,mat,pos,offY){
    const pivot = new THREE.Group(); pivot.position.copy(pos);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    m.position.y = offY; m.castShadow = true;
    pivot.add(m);
    return pivot;
  }
  const armW = isFemale ? 0.15 : 0.17;
  const leftArm  = limb(armW,0.54,armW, skinMat, new THREE.Vector3(-bodyW/2-0.09,1.32,0), -0.27);
  const rightArm = limb(armW,0.54,armW, skinMat, new THREE.Vector3( bodyW/2+0.09,1.32,0), -0.27);
  const leftLeg  = limb(0.18,0.58,0.18, pantsMat, new THREE.Vector3(-0.12,0.74,0), -0.29);
  const rightLeg = limb(0.18,0.58,0.18, pantsMat, new THREE.Vector3( 0.12,0.74,0), -0.29);
  g.add(head, hair, body, leftArm, rightArm, leftLeg, rightLeg);
  scene.add(g);
  return { group:g, leftArm, rightArm, leftLeg, rightLeg, walkT: Math.random()*10 };
}

const NPC_OUTFITS = [
  { shirt:0x3b5f9a, pants:0x2a2a2a, female:false },
  { shirt:0xd6699a, pants:0x3a2a4a, female:true },
  { shirt:0x6bb946, pants:0x2a2a2a, female:false },
  { shirt:0xe89a3b, pants:0x4a3a5a, female:true },
  { shirt:0x9a3b6b, pants:0x2a2a2a, female:false }
];
NPC_OUTFITS.forEach(function(outfit){
  const npcObj = buildNpc(outfit.shirt, outfit.pants, outfit.female);
  const startX = (Math.random()*2-1)*(WORLD_HALF-10);
  const startZ = (Math.random()*2-1)*(WORLD_HALF-10);
  npcObj.group.position.set(startX, 0, startZ);
  npcObj.pos = { x:startX, z:startZ };
  npcObj.target = { x:startX, z:startZ };
  npcObj.waitT = Math.random()*3;
  npcs.push(npcObj);
});

function pickNewTarget(npc){
  let tx, tz, tries=0;
  do {
    tx = (Math.random()*2-1)*(WORLD_HALF-8);
    tz = (Math.random()*2-1)*(WORLD_HALF-8);
    tries++;
  } while(Math.abs(tx)<HALF_W+2 && Math.abs(tz)<HALF_D+2 && tries<8);
  npc.target = { x:tx, z:tz };
}
function updateNpcs(dt){
  npcs.forEach(function(npc){
    const dx = npc.target.x-npc.pos.x, dz = npc.target.z-npc.pos.z;
    const dist = Math.hypot(dx,dz);
    if(dist < 0.4){
      npc.waitT -= dt;
      if(npc.waitT <= 0){ pickNewTarget(npc); npc.waitT = 2+Math.random()*4; }
    } else {
      const speed = 1.1;
      npc.pos.x += (dx/dist)*speed*dt;
      npc.pos.z += (dz/dist)*speed*dt;
      npc.group.rotation.y = Math.atan2(dx,dz);
      npc.walkT += dt*7;
      const s = Math.sin(npc.walkT)*0.7;
      npc.leftArm.rotation.x = s; npc.rightArm.rotation.x = -s;
      npc.leftLeg.rotation.x = -s; npc.rightLeg.rotation.x = s;
    }
    npc.group.position.set(npc.pos.x, 0, npc.pos.z);
  });
}


APP.updateWorldAnimations = updateWorldAnimations;
APP.groundHeightAt = groundHeightAt;
APP.updateNpcs = updateNpcs;
APP.toggleDoor = toggleDoor;
APP.updateDoorAnimation = updateDoorAnimation;
/* =====================================================================
   WELCOME BANNER — movie-poster style board near the entrance path
   ===================================================================== */
(function buildBanner(){
  const bx = 0, bz = HALF_D+9;
  box(0.3,4.6,0.3, MAT.oakDark, bx-2.6, 2.3, bz, false);
  box(0.3,4.6,0.3, MAT.oakDark, bx+2.6, 2.3, bz, false);
  box(5.6,3.4,0.15, MAT.frame, bx, 3.2, bz, false);
  const c = document.createElement('canvas'); c.width=512; c.height=300;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0,0,0,300);
  grad.addColorStop(0,'#1d3a6b'); grad.addColorStop(1,'#0d1a30');
  ctx.fillStyle = grad; ctx.fillRect(0,0,512,300);
  ctx.strokeStyle = '#7ee36b'; ctx.lineWidth = 8; ctx.strokeRect(10,10,492,280);
  ctx.fillStyle = '#7ee36b'; ctx.font = 'bold 46px monospace'; ctx.textAlign = 'center';
  ctx.shadowColor = '#7ee36b'; ctx.shadowBlur = 18;
  ctx.fillText('WELCOME TO', 256, 90);
  ctx.font = 'bold 52px monospace'; ctx.fillStyle = '#ffe873'; ctx.shadowColor = '#ffe873';
  ctx.fillText('JAYESH THAR', 256, 155);
  ctx.font = 'bold 30px monospace'; ctx.fillStyle = '#fff'; ctx.shadowBlur = 6; ctx.shadowColor='#000';
  ctx.fillText('PORTFOLIO', 256, 195);
  ctx.font = '16px monospace'; ctx.fillStyle = '#cfe8cf'; ctx.shadowBlur = 0;
  ctx.fillText('build your own thing — and share it with me', 256, 245);
  const tex = new THREE.CanvasTexture(c);
  const panel = box(5.0, 2.9, 0.06, new THREE.MeshBasicMaterial({ map: tex }), bx, 3.2, bz+0.11, false);
  [-2.3,2.3].forEach(function(gx){
    const l = box(0.3,0.3,0.3, MAT.lampGlow, bx+gx, 5.0, bz+0.4, false);
    l.visible = true; // banner lights stay on regardless of day/night for the glow effect
  });
})();

/* =====================================================================
   PARK BENCH — press E to sit; movement locks, look is free (a calm
   360° view of the park instead of walking controls).
   ===================================================================== */
function buildBench(x,z,rotY){
  const g = new THREE.Group(); g.position.set(x,0,z); g.rotation.y = rotY||0; scene.add(g);
  lbox(g, 1.6,0.12,0.5, MAT.plankDark, 0,0.5,0);
  lbox(g, 1.6,0.5,0.1, MAT.plankDark, 0,0.75,-0.22);
  [[-0.65,-0.15],[0.65,-0.15],[-0.65,0.15],[0.65,0.15]].forEach(function(p){
    lbox(g, 0.1,0.5,0.1, MAT.plankDark, p[0],0.25,p[1]);
  });
  return g;
}
const benchSpots = [
  { x: -18, z: 8, rot: 0.4 },
  { x: 16, z: 12, rot: -0.6 }
];
benchSpots.forEach(function(spot, i){
  buildBench(spot.x, spot.z, spot.rot);
  interactables.push({ key:'bench'+i, x:spot.x, y:0, z:spot.z, radius:1.6, sitYaw: spot.rot+Math.PI });
  labelText['bench'+i] = 'BENCH';
});



})();
