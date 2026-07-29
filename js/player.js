/* =====================================================================
   player.js — everything about controlling and rendering the player:
   movement, camera (1st/3rd person), avatar model, held item, hotbar,
   and the sandbox break/place interaction.
   ===================================================================== */
(function(){
window.APP = window.APP || {};
const THREE_ = window.THREE;
const scene = APP.scene, camera = APP.camera, dom = APP.dom;

const EYE_HEIGHT = 1.6;
APP.EYE_HEIGHT = EYE_HEIGHT;

const player = {
  pos: new THREE.Vector3(APP.SPAWN.x, 0, APP.SPAWN.z),
  yaw: 0, pitch: 0,
  velY: 0, onGround: true,
  footY: EYE_HEIGHT,
  view: 'first',
  walkT: 0,
  flying: false,
  sitting: false
};
APP.player = player;
camera.position.set(player.pos.x, EYE_HEIGHT, player.pos.z);

APP.isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints>0;
APP.gameStarted = false;

/* =====================================================================
   AVATAR (third-person voxel character)
   ===================================================================== */
function buildAvatar(skinIndex){
  const skin = APP.SKINS[skinIndex] || APP.SKINS[0];
  const skinToneMat = new THREE.MeshLambertMaterial({ color: APP.SKIN_TONE });
  const shirtMat = new THREE.MeshLambertMaterial({ color: skin.shirt });
  const pantsMat = new THREE.MeshLambertMaterial({ color: skin.pants });

  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42,0.42,0.42), skinToneMat);
  head.position.set(0,1.56,0); head.castShadow = true;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.6,0.28), shirtMat);
  body.position.set(0,1.05,0); body.castShadow = true;

  function limb(w,h,d, mat, pivotPos, meshOffsetY){
    const pivot = new THREE.Group();
    pivot.position.copy(pivotPos);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    mesh.position.set(0, meshOffsetY, 0);
    mesh.castShadow = true;
    pivot.add(mesh);
    return pivot;
  }
  const leftArm  = limb(0.18,0.55,0.18, skinToneMat, new THREE.Vector3(-0.34,1.33,0), -0.275);
  const rightArm = limb(0.18,0.55,0.18, skinToneMat, new THREE.Vector3( 0.34,1.33,0), -0.275);
  const leftLeg  = limb(0.2,0.6,0.2, pantsMat, new THREE.Vector3(-0.13,0.75,0), -0.3);
  const rightLeg = limb(0.2,0.6,0.2, pantsMat, new THREE.Vector3( 0.13,0.75,0), -0.3);

  g.add(head, body, leftArm, rightArm, leftLeg, rightLeg);
  scene.add(g);

  return {
    group: g, head, body, leftArm, rightArm, leftLeg, rightLeg,
    setSkin: function(idx){
      const s = APP.SKINS[idx] || APP.SKINS[0];
      shirtMat.color.set(s.shirt);
      pantsMat.color.set(s.pants);
    }
  };
}

let savedSkinIndex = 0;
try {
  const raw = localStorage.getItem('portfolio_skin');
  if(raw !== null) savedSkinIndex = parseInt(raw, 10) || 0;
} catch(e){}
const avatar = buildAvatar(savedSkinIndex);
avatar.group.visible = false;
APP.avatar = avatar;
APP.selectedSkin = savedSkinIndex;

APP.setSkin = function(idx){
  APP.selectedSkin = idx;
  avatar.setSkin(idx);
  try { localStorage.setItem('portfolio_skin', String(idx)); } catch(e){}
};

/* =====================================================================
   HELD ITEM (first-person view model, bottom-right of screen)
   ===================================================================== */
const viewmodelGroup = new THREE.Group();
viewmodelGroup.position.set(0.42, -0.32, -0.7);
camera.add(viewmodelGroup);
scene.add(camera);

let heldMesh = null;
APP.selectedHotbar = 0;
function rebuildHeldItem(){
  if(heldMesh){ viewmodelGroup.remove(heldMesh); heldMesh = null; }
  const item = APP.HOTBAR[APP.selectedHotbar];
  if(!item) return;
  if(item.type === 'block'){
    heldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.22,0.22), new THREE.MeshLambertMaterial({ color: item.color }));
  } else {
    const g = new THREE.Group();
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.24,0.3,0.05), new THREE.MeshLambertMaterial({ color:0x9a3b3b }));
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.26,0.04), new THREE.MeshLambertMaterial({ color:0xf0e6c8 }));
    pages.position.z = 0.01;
    g.add(cover, pages);
    heldMesh = g;
  }
  viewmodelGroup.add(heldMesh);
}
APP.selectHotbar = function(idx){
  if(idx<0 || idx>=APP.HOTBAR.length) return;
  APP.selectedHotbar = idx;
  rebuildHeldItem();
  if(APP.ui && APP.ui.renderHotbar) APP.ui.renderHotbar();
};
rebuildHeldItem();

/* =====================================================================
   VIEW MODE (first / third person)
   ===================================================================== */
APP.toggleView = function(){
  player.view = (player.view === 'first') ? 'third' : 'first';
  avatar.group.visible = (player.view === 'third');
  viewmodelGroup.visible = (player.view === 'first');
  if(APP.ui && APP.ui.onViewChange) APP.ui.onViewChange(player.view);
};
viewmodelGroup.visible = true;

APP.toggleFly = function(){
  player.flying = !player.flying;
  if(player.flying) player.velY = 0;
  if(APP.ui && APP.ui.onFlyChange) APP.ui.onFlyChange(player.flying);
};
APP.toggleInventory = function(){
  if(APP.ui && APP.ui.toggleInventory) APP.ui.toggleInventory();
};

/* =====================================================================
   INPUT — keyboard
   ===================================================================== */
const keys = {};
let lastSpaceTap = 0;
window.addEventListener('keydown', function(e){
  keys[e.code]=true;
  if(!APP.gameStarted) return;
  if(e.repeat) return;

  if(e.code==='KeyI'){ APP.toggleInventory(); return; }
  if(e.code==='Escape'){
    if(APP.inventoryOpen) APP.toggleInventory();
    else if(APP.guideOpen) document.getElementById('guideClose').click();
    else if(document.getElementById('modal-overlay').style.display==='flex' && APP.ui && APP.ui.closeModal) APP.ui.closeModal();
    return;
  }
  if(APP.ui && APP.ui.isBlockingInput && APP.ui.isBlockingInput()) return;

  if(e.code==='KeyE') tryInteract();
  if(e.code==='KeyF') APP.toggleView();
  if(e.code==='Digit1') APP.selectHotbar(0);
  if(e.code==='Digit2') APP.selectHotbar(1);
  if(e.code==='Digit3') APP.selectHotbar(2);
  if(e.code==='Digit4') APP.selectHotbar(3);
  if(e.code==='Digit5') APP.selectHotbar(4);
  if(e.code==='Digit6') APP.selectHotbar(5);
  if(e.code==='Space'){
    const now = performance.now();
    if(now - lastSpaceTap < 320){ APP.toggleFly(); }
    else if(!player.flying){ tryJump(); }
    lastSpaceTap = now;
  }
});
window.addEventListener('keyup', function(e){ keys[e.code]=false; });

/* ---------- pointer lock (desktop mouse look) ---------- */
let pointerLocked = false;
APP.isPointerLocked = function(){ return pointerLocked; };
APP.requestLock = function(){
  if(APP.isTouchDevice) return;
  const p = dom.requestPointerLock();
  if(p && p.catch) p.catch(function(){ /* cooldown right after unlock — user can click again */ });
};
dom.addEventListener('mousedown', function(e){
  if(APP.isTouchDevice || !APP.gameStarted) return;
  if(APP.ui && APP.ui.isBlockingInput && APP.ui.isBlockingInput()) return;
  if(!pointerLocked){
    if(e.button === 0) APP.requestLock();
    return;
  }
  if(e.button === 0) onPrimaryAction();
  else if(e.button === 2) onSecondaryAction();
});
dom.addEventListener('contextmenu', function(e){ e.preventDefault(); });
document.addEventListener('pointerlockchange', function(){
  pointerLocked = document.pointerLockElement === dom;
  if(APP.ui && APP.ui.updateResumeVisibility) APP.ui.updateResumeVisibility();
});
document.addEventListener('mousemove', function(e){
  if(!pointerLocked) return;
  player.yaw -= e.movementX * 0.0022;
  player.pitch -= e.movementY * 0.0022;
  player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch));
});

/* ---------- mobile joystick + look (pointer events) ---------- */
let moveVec = {x:0,y:0};
(function setupJoystick(){
  const zone = document.getElementById('joystick-zone');
  const handle = document.getElementById('joystick-handle');
  const R = 45;
  let activeId = null;
  function move(clientX, clientY){
    const rect = zone.getBoundingClientRect();
    const cx = rect.left+rect.width/2, cy = rect.top+rect.height/2;
    let dx = clientX-cx, dy = clientY-cy;
    const dist = Math.min(R, Math.hypot(dx,dy));
    const ang = Math.atan2(dy,dx);
    const hx = Math.cos(ang)*dist, hy = Math.sin(ang)*dist;
    handle.style.transform = 'translate('+(hx-26)+'px,'+(hy-26)+'px)';
    moveVec.x = Math.max(-1, Math.min(1, dx/R));
    moveVec.y = Math.max(-1, Math.min(1, dy/R));
  }
  function reset(){ moveVec.x=0; moveVec.y=0; handle.style.transform='translate(-50%,-50%)'; }
  zone.addEventListener('pointerdown', function(e){ if(!APP.gameStarted) return; activeId=e.pointerId; zone.setPointerCapture(e.pointerId); move(e.clientX,e.clientY); });
  zone.addEventListener('pointermove', function(e){ if(activeId===e.pointerId) move(e.clientX,e.clientY); });
  function end(e){ if(activeId===e.pointerId){ activeId=null; reset(); } }
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
})();
(function setupLookZone(){
  const zone = document.getElementById('look-zone');
  let activeId=null, lastX=0, lastY=0;
  zone.addEventListener('pointerdown', function(e){ if(!APP.gameStarted) return; activeId=e.pointerId; lastX=e.clientX; lastY=e.clientY; zone.setPointerCapture(e.pointerId); });
  zone.addEventListener('pointermove', function(e){
    if(activeId!==e.pointerId) return;
    const dx = e.clientX-lastX, dy = e.clientY-lastY;
    lastX=e.clientX; lastY=e.clientY;
    player.yaw -= dx*0.0032;
    player.pitch -= dy*0.0032;
    player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch));
  });
  function end(e){ if(activeId===e.pointerId) activeId=null; }
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
})();
document.getElementById('interact-btn').addEventListener('pointerdown', function(e){ if(APP.gameStarted) tryInteract(); e.preventDefault(); });
document.getElementById('jump-btn').addEventListener('pointerdown', function(e){ flyUpHeld = true; if(APP.gameStarted && !player.flying) tryJump(); e.preventDefault(); });
document.getElementById('jump-btn').addEventListener('pointerup', function(){ flyUpHeld = false; });
document.getElementById('jump-btn').addEventListener('pointercancel', function(){ flyUpHeld = false; });
document.getElementById('fly-down-btn').addEventListener('pointerdown', function(e){ flyDownHeld = true; e.preventDefault(); });
document.getElementById('fly-down-btn').addEventListener('pointerup', function(){ flyDownHeld = false; });
document.getElementById('fly-down-btn').addEventListener('pointercancel', function(){ flyDownHeld = false; });
document.getElementById('break-btn').addEventListener('pointerdown', function(e){ if(APP.gameStarted) onPrimaryAction(true); e.preventDefault(); });
document.getElementById('place-btn').addEventListener('pointerdown', function(e){ if(APP.gameStarted) onSecondaryAction(); e.preventDefault(); });
document.getElementById('inv-btn').addEventListener('pointerdown', function(e){ if(APP.gameStarted) APP.toggleInventory(); e.preventDefault(); });

let flyUpHeld = false, flyDownHeld = false;
function tryJump(){ if(player.onGround){ player.velY = 4.2; player.onGround=false; } }

/* =====================================================================
   BUILD RAYCAST + ACTIONS — works anywhere: house floor, loft, or the
   whole outdoor terrain. No fixed zones.
   ===================================================================== */
const raycaster = new THREE.Raycaster();
function raycastBuild(){
  raycaster.setFromCamera({x:0,y:0}, camera);
  const targets = APP.build.groundColliders.concat(APP.build.dynamicBlockMeshes);
  const hits = raycaster.intersectObjects(targets, true);
  if(hits.length === 0) return null;
  const hit = hits[0];
  if(hit.distance > 5.5) return null;
  if(hit.object.userData.isDynamicBlock){
    const gx = hit.object.userData.gx, gz = hit.object.userData.gz;
    let placeGx = gx, placeGz = gz;
    if(hit.face){
      const n = hit.face.normal.clone();
      n.transformDirection(hit.object.matrixWorld);
      if(Math.abs(n.x) > Math.abs(n.z)) placeGx = gx + (n.x>0?1:-1);
      else if(Math.abs(n.z) > 0.1) placeGz = gz + (n.z>0?1:-1);
    }
    return { type:'block', gx:gx, gz:gz, placeGx:placeGx, placeGz:placeGz };
  }
  const cell = APP.build.cellFromWorld(hit.point.x, hit.point.z);
  return { type:'ground', gx:cell.gx, gz:cell.gz, placeGx:cell.gx, placeGz:cell.gz };
}
function onPrimaryAction(fromMobileBreakBtn){
  const hit = raycastBuild();
  if(hit && hit.type === 'block'){ APP.build.breakTop(hit.gx, hit.gz); return; }
  const item = APP.HOTBAR[APP.selectedHotbar];
  if(item && item.type === 'book'){ window.open(APP.RESUME_PATH, '_blank'); return; }
  if(!fromMobileBreakBtn) tryInteract();
}
function onSecondaryAction(){
  const hit = raycastBuild();
  if(!hit) return;
  const item = APP.HOTBAR[APP.selectedHotbar];
  if(item && item.type === 'block'){ APP.build.placeAt(hit.placeGx, hit.placeGz, item.id, player.footY); }
}

/* =====================================================================
   STATION PROXIMITY
   ===================================================================== */
APP.currentTarget = null;
function updateNearestStation(){
  let nearest=null, nearestDist=Infinity;
  const myFloor = APP.groundHeightAt(player.pos.x, player.pos.z, player.footY);
  APP.interactables.forEach(function(s){
    if(Math.abs(myFloor - s.y) > 0.6) return; // different floor — not reachable
    const flat = Math.hypot(player.pos.x-s.x, player.pos.z-s.z);
    if(flat < s.radius && flat < nearestDist){ nearest=s; nearestDist=flat; }
  });
  if(nearest !== APP.currentTarget){
    APP.currentTarget = nearest;
    if(APP.ui && APP.ui.onTargetChange) APP.ui.onTargetChange(nearest);
  }
}
function tryInteract(){
  if(!APP.currentTarget) return;
  if(APP.currentTarget.key === 'door'){ if(APP.toggleDoor) APP.toggleDoor(); return; }
  if(APP.currentTarget.key.indexOf('bench') === 0){ toggleSit(APP.currentTarget); return; }
  if(APP.ui && APP.ui.openModal) APP.ui.openModal(APP.currentTarget.key);
}
APP.tryInteract = tryInteract;
function toggleSit(bench){
  if(player.sitting){
    player.sitting = false;
  } else {
    player.sitting = true;
    player.pos.x = bench.x; player.pos.z = bench.z;
    player.yaw = bench.sitYaw !== undefined ? bench.sitYaw : player.yaw;
    player.footY = 0.85;
    player.velY = 0; player.onGround = true;
  }
  if(APP.ui && APP.ui.onSitChange) APP.ui.onSitChange(player.sitting);
}

/* =====================================================================
   COLLISION — axis-separated sliding against wall rectangles, plus a
   generous outer world boundary so the player can't wander into the void.
   ===================================================================== */
const PLAYER_RADIUS = 0.35;
function collidesWall(x,z){
  for(let i=0;i<APP.wallColliders.length;i++){
    const w = APP.wallColliders[i];
    if(x+PLAYER_RADIUS>w.minX && x-PLAYER_RADIUS<w.maxX && z+PLAYER_RADIUS>w.minZ && z-PLAYER_RADIUS<w.maxZ) return true;
  }
  if(APP.build && APP.build.isSolidAt && APP.build.isSolidAt(x,z,player.footY)) return true;
  return false;
}
function resolveMove(desiredX, desiredZ){
  let nx = player.pos.x, nz = player.pos.z;
  if(!collidesWall(desiredX, player.pos.z)) nx = desiredX;
  if(!collidesWall(nx, desiredZ)) nz = desiredZ;
  return [nx, nz];
}
function clampToWorld(x,z){
  const m = 0.6, b = APP.WORLD_HALF;
  return [Math.max(-b+m, Math.min(b-m, x)), Math.max(-b+m, Math.min(b-m, z))];
}
function resolveCameraDistance(px, pz, forward, maxDist){
  const steps = 12;
  let bestX = px, bestZ = pz;
  for(let i=1;i<=steps;i++){
    const d = (i/steps)*maxDist;
    const cx = px - forward.x*d, cz = pz - forward.z*d;
    if(collidesWall(cx,cz)) break;
    bestX = cx; bestZ = cz;
  }
  return [bestX, bestZ];
}

function animateLimbs(dt, moving){
  const swing = 0.9;
  if(moving && player.onGround){
    player.walkT += dt*8;
    const s = Math.sin(player.walkT)*swing;
    avatar.leftArm.rotation.x = s; avatar.rightArm.rotation.x = -s;
    avatar.leftLeg.rotation.x = -s; avatar.rightLeg.rotation.x = s;
  } else {
    avatar.leftArm.rotation.x *= 0.8; avatar.rightArm.rotation.x *= 0.8;
    avatar.leftLeg.rotation.x *= 0.8; avatar.rightLeg.rotation.x *= 0.8;
  }
}

/* =====================================================================
   MOVEMENT + CAMERA UPDATE (called every frame from main.js)
   ===================================================================== */
APP.updatePlayer = function(dt){
  if(!APP.gameStarted) return;
  if(APP.ui && APP.ui.isBlockingInput && APP.ui.isBlockingInput()) return;

  if(player.sitting){
    avatar.group.position.set(player.pos.x, -0.3, player.pos.z);
    avatar.group.rotation.y = player.yaw;
    camera.position.set(player.pos.x, player.footY, player.pos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    updateNearestStation();
    return;
  }

  let mForward = 0, mStrafe = 0;
  if(keys['KeyW']) mForward += 1;
  if(keys['KeyS']) mForward -= 1;
  if(keys['KeyD']) mStrafe += 1;
  if(keys['KeyA']) mStrafe -= 1;
  mForward += -moveVec.y;
  mStrafe  +=  moveVec.x;

  const inputLen = Math.hypot(mForward, mStrafe);
  if(inputLen > 1){ mForward/=inputLen; mStrafe/=inputLen; }
  const moving = inputLen > 0.05;
  const speed = player.flying ? 4.6 : ((keys['ShiftLeft']||keys['ShiftRight']) ? 4.6 : 2.8);

  const forward = { x: -Math.sin(player.yaw), z: -Math.cos(player.yaw) };
  const right   = { x:  Math.cos(player.yaw), z: -Math.sin(player.yaw) };

  const dx = (forward.x*mForward + right.x*mStrafe) * speed * dt;
  const dz = (forward.z*mForward + right.z*mStrafe) * speed * dt;

  const desired = clampToWorld(player.pos.x+dx, player.pos.z+dz);
  const resolved = player.flying ? desired : resolveMove(desired[0], desired[1]);
  player.pos.x = resolved[0]; player.pos.z = resolved[1];

  // physics state lives on player.footY only — never read back from camera,
  // so the visual bob below can never leak into next frame's ground check
  let localGround = APP.groundHeightAt(player.pos.x, player.pos.z, player.footY);
  const placedH = APP.build.heightAt(player.pos.x, player.pos.z);
  if(placedH !== null && player.footY >= placedH + EYE_HEIGHT - 0.9){
    localGround = Math.max(localGround, placedH);
  }
  if(player.flying){
    const flySpeed = 3.6;
    let vertical = 0;
    if(keys['Space'] || flyUpHeld) vertical += 1;
    if(keys['ShiftLeft'] || keys['ShiftRight'] || flyDownHeld) vertical -= 1;
    player.footY += vertical * flySpeed * dt;
    player.footY = Math.max(localGround+0.3, Math.min(40, player.footY));
    player.velY = 0;
    player.onGround = false;
  } else {
    const groundY = localGround + EYE_HEIGHT;
    player.velY -= 9.8*dt;
    player.footY += player.velY*dt;
    if(player.footY <= groundY){ player.footY = groundY; player.velY = 0; player.onGround = true; }
    else { player.onGround = false; }
  }

  const bob = (moving && player.onGround) ? Math.sin(player.walkT)*0.03 : 0;
  const jumpHeight = player.footY - EYE_HEIGHT;

  avatar.group.position.set(player.pos.x, jumpHeight, player.pos.z);
  avatar.group.rotation.y = player.yaw;
  animateLimbs(dt, moving);

  if(player.view === 'first'){
    camera.position.set(player.pos.x, player.footY + bob, player.pos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
  } else {
    const dist = 3.6, height = 1.7;
    const camResolved = resolveCameraDistance(player.pos.x, player.pos.z, forward, dist);
    const camClamped = clampToWorld(camResolved[0], camResolved[1]);
    camera.position.set(camClamped[0], player.footY + height, camClamped[1]);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch * 0.6;
  }

  updateNearestStation();
};

APP.setSpawn = function(){
  player.pos.set(APP.SPAWN.x, 0, APP.SPAWN.z);
  player.yaw = 0;
  player.pitch = 0;
  player.footY = APP.groundHeightAt(APP.SPAWN.x, APP.SPAWN.z) + EYE_HEIGHT;
  player.velY = 0;
  player.onGround = true;
  player.flying = false;
  camera.position.set(player.pos.x, player.footY, player.pos.z);
  camera.rotation.set(0, player.yaw, 0);
};

})();
