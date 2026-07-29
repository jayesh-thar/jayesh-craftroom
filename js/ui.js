/* =====================================================================
   ui.js — everything the player sees and clicks that isn't the 3D scene:
   modal, minimap, settings panel, profile/skin picker, hotbar, tutorial.
   ===================================================================== */
(function(){
window.APP = window.APP || {};
APP.ui = {};

/* ---------- hint + resume-lock overlay ---------- */
const hintEl = document.getElementById('hint');
const resumeClickEl = document.getElementById('resumeClick');

APP.ui.updateResumeVisibility = function(){
  const blocking = APP.ui.isBlockingInput();
  const locked = APP.isPointerLocked ? APP.isPointerLocked() : false;
  resumeClickEl.style.display = (!locked && APP.gameStarted && !blocking && !APP.isTouchDevice) ? 'flex' : 'none';
};
resumeClickEl.addEventListener('click', function(){ if(APP.requestLock) APP.requestLock(); });

APP.ui.onTargetChange = function(target){
  if(target){
    hintEl.style.display = 'block';
    hintEl.textContent = APP.isTouchDevice
      ? ('Tap INTERACT to open ' + APP.labelText[target.key])
      : ('Press E to open ' + APP.labelText[target.key]);
    document.getElementById('interact-btn').textContent = 'OPEN';
  } else {
    hintEl.style.display = 'none';
    document.getElementById('interact-btn').textContent = 'INTERACT';
  }
};

/* ---------- break/place: no proximity gating needed anymore — building
   works everywhere, so these are just standard always-on mobile controls
   (visibility handled by the CSS media query, same as jump/interact). ---------- */

const modalOverlay = document.getElementById('modal-overlay');
APP.ui.isBlockingInput = function(){
  return modalOverlay.style.display === 'flex' || APP.inventoryOpen === true || APP.guideOpen === true;
};

/* ---------- fly status ---------- */
const flyBadge = document.getElementById('flyBadge');
const flyToggleBtn = document.getElementById('flyToggleBtn');
APP.ui.onFlyChange = function(flying){
  flyBadge.style.display = flying ? 'block' : 'none';
  flyToggleBtn.textContent = flying ? 'Land (stop flying)' : 'Toggle Fly Mode';
  document.getElementById('fly-down-btn').style.display = (flying && APP.isTouchDevice) ? 'flex' : 'none';
};
flyToggleBtn.addEventListener('click', function(){ if(APP.toggleFly) APP.toggleFly(); });
const sitBadge = document.getElementById('sitBadge');
APP.ui.onSitChange = function(sitting){ sitBadge.style.display = sitting ? 'block' : 'none'; };

/* ---------- inventory dialog ---------- */
const inventoryOverlay = document.getElementById('inventoryOverlay');
const inventoryGrid = document.getElementById('inventoryGrid');
APP.inventoryOpen = false;
function buildInventoryGrid(){
  inventoryGrid.innerHTML = '';
  APP.BLOCK_PALETTE.forEach(function(entry){
    const cell = document.createElement('div');
    cell.className = 'inv-cell';
    cell.title = entry.label;
    const color = APP.BLOCK_COLORS[entry.id];
    const canvas = document.createElement('canvas');
    canvas.width = 44; canvas.height = 44;
    canvas.className = 'inv-swatch';
    drawItemIcon(canvas, entry.id, color);
    const lbl = document.createElement('div');
    lbl.className = 'inv-label'; lbl.textContent = entry.label;
    cell.appendChild(canvas); cell.appendChild(lbl);
    cell.addEventListener('click', function(){
      const target = APP.HOTBAR[APP.selectedHotbar];
      if(!target || target.type !== 'block') return; // don't overwrite the resume book slot
      target.id = entry.id;
      target.label = entry.label;
      target.color = color;
      if(APP.selectHotbar) APP.selectHotbar(APP.selectedHotbar);
    });
    inventoryGrid.appendChild(cell);
  });
}
buildInventoryGrid();
APP.ui.toggleInventory = function(){
  APP.inventoryOpen = !APP.inventoryOpen;
  inventoryOverlay.style.display = APP.inventoryOpen ? 'flex' : 'none';
  if(APP.inventoryOpen && APP.isPointerLocked && APP.isPointerLocked()) document.exitPointerLock();
  APP.ui.updateResumeVisibility();
};
document.getElementById('inventoryClose').addEventListener('click', APP.ui.toggleInventory);

/* ---------- build guide ---------- */
const guideOverlay = document.getElementById('guideOverlay');
const guideList = document.getElementById('guideList');
function renderGuide(){
  guideList.innerHTML = '';
  const ul = document.createElement('ul');
  APP.BUILD_GUIDE.forEach(function(line){
    const li = document.createElement('li');
    li.textContent = line;
    ul.appendChild(li);
  });
  guideList.appendChild(ul);
}
renderGuide();
document.getElementById('buildGuideBtn').addEventListener('click', function(){
  settingsPanel.style.display = 'none';
  APP.guideOpen = true;
  guideOverlay.style.display = 'flex';
  if(APP.isPointerLocked && APP.isPointerLocked()) document.exitPointerLock();
  APP.ui.updateResumeVisibility();
});
document.getElementById('guideClose').addEventListener('click', function(){
  APP.guideOpen = false;
  guideOverlay.style.display = 'none';
  APP.ui.updateResumeVisibility();
});

/* ---------- modal ---------- */
const modalBoxEl = document.getElementById('modal-box');
const modalTitle = document.getElementById('modal-title');
const modalIcon = document.getElementById('modal-icon');
const modalBody = document.getElementById('modal-body');

APP.ui.openModal = function(key){
  const c = APP.CONTENT[key];
  if(!c) return;
  modalTitle.textContent = c.title;
  modalIcon.textContent = c.icon;
  modalBody.innerHTML = c.html;
  modalBoxEl.className = c.retro ? 'retro' : '';
  modalOverlay.style.display = 'flex';
  if(APP.isPointerLocked && APP.isPointerLocked()) document.exitPointerLock();
  APP.ui.updateResumeVisibility();
};
APP.ui.closeModal = function(){
  modalOverlay.style.display = 'none';
  APP.ui.updateResumeVisibility();
};
document.getElementById('modal-close').addEventListener('click', APP.ui.closeModal);
modalOverlay.addEventListener('click', function(e){ if(e.target===modalOverlay) APP.ui.closeModal(); });

/* ---------- minimap (top-left) ---------- */
const miniCanvas = document.getElementById('minimap');
const miniCtx = miniCanvas.getContext('2d');
APP.ui.drawMinimap = function(){
  const W=120,H=120;
  miniCtx.clearRect(0,0,W,H);
  miniCtx.fillStyle = 'rgba(45,70,35,0.55)';
  miniCtx.fillRect(4,4,W-8,H-8);
  const worldSize = APP.WORLD_HALF*2;
  const scale = (W-16)/worldSize;
  function toMap(x,z){ return [8+(x+APP.WORLD_HALF)*scale, 8+(z+APP.WORLD_HALF)*scale]; }
  const houseTL = toMap(-APP.HALF_W, -APP.HALF_D);
  const houseBR = toMap(APP.HALF_W, APP.HALF_D);
  miniCtx.fillStyle = 'rgba(90,70,50,0.6)';
  miniCtx.fillRect(houseTL[0], houseTL[1], houseBR[0]-houseTL[0], houseBR[1]-houseTL[1]);
  miniCtx.fillStyle = '#7ee36b';
  APP.interactables.forEach(function(s){
    const p = toMap(s.x,s.z);
    miniCtx.beginPath(); miniCtx.arc(p[0],p[1],2.5,0,Math.PI*2); miniCtx.fill();
  });
  const player = APP.player;
  const pp = toMap(player.pos.x, player.pos.z);
  miniCtx.fillStyle = '#fff';
  miniCtx.beginPath(); miniCtx.arc(pp[0],pp[1],4,0,Math.PI*2); miniCtx.fill();
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
  miniCtx.strokeStyle = '#fff'; miniCtx.lineWidth = 2;
  miniCtx.beginPath(); miniCtx.moveTo(pp[0],pp[1]); miniCtx.lineTo(pp[0]+fx*9, pp[1]+fz*9); miniCtx.stroke();
};

/* ---------- hotbar ---------- */
const hotbarEl = document.getElementById('hotbar');
function drawItemIcon(canvas, itemId, colorHex){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const col = '#'+(colorHex||0x888888).toString(16).padStart(6,'0');
  if(itemId==='fire'){
    const grad = ctx.createLinearGradient(0,H,0,0);
    grad.addColorStop(0,'#ff8a2b'); grad.addColorStop(0.6,'#ffcf5c'); grad.addColorStop(1,'#fff2b0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(W*0.5,H*0.08);
    ctx.quadraticCurveTo(W*0.9,H*0.45,W*0.62,H*0.6);
    ctx.quadraticCurveTo(W*0.8,H*0.7,W*0.58,H*0.95);
    ctx.quadraticCurveTo(W*0.2,H*0.85,W*0.22,H*0.55);
    ctx.quadraticCurveTo(W*0.1,H*0.4,W*0.35,H*0.3);
    ctx.quadraticCurveTo(W*0.3,H*0.15,W*0.5,H*0.08);
    ctx.fill();
  } else if(itemId==='water'){
    ctx.fillStyle = '#2f6fb0'; ctx.fillRect(4,H*0.35,W-8,H*0.55);
    ctx.strokeStyle = '#bfe3ff'; ctx.lineWidth = 2.5;
    [0.45,0.62,0.79].forEach(function(fy){
      ctx.beginPath();
      for(let x=4;x<=W-4;x+=6){ const y=H*fy+Math.sin(x*0.6)*2.5; if(x===4) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
      ctx.stroke();
    });
  } else if(itemId==='fence'){
    ctx.fillStyle = '#4a3218';
    ctx.fillRect(W*0.44,H*0.1,W*0.12,H*0.85);
    ctx.fillRect(W*0.15,H*0.35,W*0.7,H*0.12);
    ctx.fillRect(W*0.15,H*0.6,W*0.7,H*0.12);
  } else if(itemId==='stair'){
    ctx.fillStyle = '#6e6e6e';
    ctx.fillRect(W*0.12,H*0.62,W*0.76,H*0.28);
    ctx.fillRect(W*0.44,H*0.32,W*0.44,H*0.3);
  } else if(itemId==='slab'){
    ctx.fillStyle = col;
    ctx.fillRect(W*0.12,H*0.55,W*0.76,H*0.32);
    ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.strokeRect(W*0.12,H*0.55,W*0.76,H*0.32);
  } else if(itemId==='glass' || itemId==='water'){
    ctx.fillStyle = col; ctx.globalAlpha=0.55; ctx.fillRect(4,4,W-8,H-8); ctx.globalAlpha=1;
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(W*0.2,H*0.15); ctx.lineTo(W*0.35,H*0.85); ctx.stroke();
  } else if(itemId==='sparkle'){
    ctx.fillStyle = col; ctx.fillRect(4,4,W-8,H-8);
    ctx.fillStyle='rgba(255,255,255,.85)';
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.15); ctx.lineTo(W*0.62,H*0.5); ctx.lineTo(W*0.5,H*0.85); ctx.lineTo(W*0.38,H*0.5); ctx.closePath(); ctx.fill();
  } else if(itemId==='book'){
    ctx.fillStyle = '#9a3b3b'; ctx.fillRect(4,4,W-8,H-8);
    ctx.fillStyle = '#f0e6c8'; ctx.fillRect(W*0.5,8,W*0.42,H-16);
  } else {
    ctx.fillStyle = col; ctx.fillRect(3,3,W-6,H-6);
    ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1; ctx.strokeRect(3,3,W-6,H-6);
  }
}

function buildHotbar(){
  hotbarEl.innerHTML = '';
  APP.HOTBAR.forEach(function(item, i){
    const slot = document.createElement('div');
    slot.className = 'hb-slot';
    slot.dataset.index = i;
    slot.title = item.label;
    const canvas = document.createElement('canvas');
    canvas.width = 36; canvas.height = 36;
    canvas.className = 'hb-swatch';
    drawItemIcon(canvas, item.type==='book' ? 'book' : item.id, item.color);
    const key = document.createElement('div');
    key.className = 'hb-key'; key.textContent = (i+1);
    slot.appendChild(canvas); slot.appendChild(key);
    slot.addEventListener('pointerdown', function(){ if(APP.selectHotbar) APP.selectHotbar(i); });
    hotbarEl.appendChild(slot);
  });
}
APP.ui.renderHotbar = function(){
  buildHotbar();
  const slots = hotbarEl.querySelectorAll('.hb-slot');
  slots.forEach(function(s){
    s.classList.toggle('active', parseInt(s.dataset.index,10) === APP.selectedHotbar);
  });
};
buildHotbar();

/* ---------- settings panel ---------- */
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const viewToggleBtn = document.getElementById('viewToggleBtn');
const nightToggleBtn = document.getElementById('nightToggleBtn');
const replayTutorialBtn = document.getElementById('replayTutorialBtn');

settingsBtn.addEventListener('click', function(){
  const open = settingsPanel.style.display === 'block';
  settingsPanel.style.display = open ? 'none' : 'block';
});
document.getElementById('settingsCloseBtn').addEventListener('click', function(){ settingsPanel.style.display='none'; });

viewToggleBtn.addEventListener('click', function(){ if(APP.toggleView) APP.toggleView(); });
APP.ui.onViewChange = function(view){
  viewToggleBtn.textContent = (view==='first') ? 'Switch to Third-Person (F)' : 'Switch to First-Person (F)';
};
APP.ui.onViewChange('first');

nightToggleBtn.addEventListener('click', function(){
  const on = !APP.isNight();
  APP.setNight(on);
  nightToggleBtn.textContent = on ? 'Switch to Day' : 'Switch to Night';
});

replayTutorialBtn.addEventListener('click', function(){
  settingsPanel.style.display = 'none';
  startTutorial();
});

/* ---------- profile / skin picker (inside settings panel) ---------- */
const profileNameEl = document.getElementById('profileName');
const skinRow = document.getElementById('skinRow');
function renderProfile(){
  profileNameEl.textContent = APP.visitorName || 'Guest';
  skinRow.innerHTML = '';
  APP.SKINS.forEach(function(s, i){
    const sw = document.createElement('div');
    sw.className = 'skin-swatch' + (i===APP.selectedSkin ? ' active' : '');
    sw.style.background = '#'+s.shirt.toString(16).padStart(6,'0');
    sw.title = s.name;
    sw.addEventListener('click', function(){
      APP.setSkin(i);
      renderProfile();
    });
    skinRow.appendChild(sw);
  });
}
/* renderProfile() runs once game starts, called from main.js after avatar exists */
APP.ui.renderProfile = renderProfile;

/* ---------- tutorial ---------- */
const tutorialOverlay = document.getElementById('tutorialOverlay');
const tutorialText = document.getElementById('tutorialText');
const tutorialStep = document.getElementById('tutorialStep');
let tIndex = 0;
function startTutorial(){
  tIndex = 0;
  tutorialOverlay.style.display = 'flex';
  renderTutorialStep();
}
function renderTutorialStep(){
  const steps = APP.TUTORIAL_STEPS;
  tutorialText.textContent = steps[tIndex].text;
  tutorialStep.textContent = (tIndex+1) + ' / ' + steps.length;
  document.getElementById('tutorialNextBtn').textContent = (tIndex === steps.length-1) ? 'Done' : 'Next';
}
document.getElementById('tutorialNextBtn').addEventListener('click', function(){
  const steps = APP.TUTORIAL_STEPS;
  if(tIndex < steps.length-1){ tIndex++; renderTutorialStep(); }
  else { endTutorial(); }
});
document.getElementById('tutorialSkipBtn').addEventListener('click', endTutorial);
function endTutorial(){
  tutorialOverlay.style.display = 'none';
  try { localStorage.setItem('portfolio_tutorial_seen', '1'); } catch(e){}
}
APP.ui.maybeStartTutorial = function(){
  renderProfile();
  let seen = false;
  try { seen = localStorage.getItem('portfolio_tutorial_seen') === '1'; } catch(e){}
  if(!seen) setTimeout(startTutorial, 400);
};

})();
