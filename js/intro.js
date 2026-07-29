/* =====================================================================
   intro.js — loading -> name entry -> scripted flythrough with a timed
   greeting -> hands control to the player.
   ===================================================================== */
(function(){
window.APP = window.APP || {};
const camera = APP.camera;

const loadStage = document.getElementById('loadStage');
const nameStage = document.getElementById('nameStage');
const nameInput = document.getElementById('nameInput');
const nameSubmit = document.getElementById('nameSubmit');
const boot = document.getElementById('boot');
const introOverlay = document.getElementById('introOverlay');
const introText = document.getElementById('introText');

let savedName = '';
try { savedName = localStorage.getItem('portfolio_visitor_name') || ''; } catch(e){}
if(savedName) nameInput.value = savedName;

APP.showNameEntry = function(){
  loadStage.style.display = 'none';
  nameStage.style.display = 'flex';
  nameInput.focus();
};

function ease(t){ return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }

/* Camera waypoints for the flythrough. yaw uses the same convention as
   player.js: yaw 0 = facing -Z (into the room from the entrance). */
function buildPath(){
  const HW = APP.HALF_W, HD = APP.HALF_D;
  return [
    { pos:{x:0, y:6.5, z:0.5}, yaw:0, pitch:-1.25 },
    { pos:{x:HW-3, y:3.2, z:HD-4}, yaw:2.1, pitch:-0.25, dur:1.7 },
    { pos:{x:-HW+3, y:2.6, z:-2}, yaw:-2.3, pitch:-0.1, dur:1.7 },
    { pos:{x:APP.SPAWN.x, y:APP.EYE_HEIGHT, z:APP.SPAWN.z}, yaw:0, pitch:0, dur:1.5 }
  ];
}

let path = null;
let segIndex = 0;
let segT = 0;
APP.introActive = false;

function startFlythrough(){
  path = buildPath();
  segIndex = 0; segT = 0;
  APP.introActive = true;
  const p0 = path[0].pos;
  camera.position.set(p0.x,p0.y,p0.z);
  camera.rotation.order='YXZ';
  camera.rotation.y = path[0].yaw;
  camera.rotation.x = path[0].pitch;
}

APP.introUpdate = function(dt){
  if(!APP.introActive || !path) return;
  if(segIndex >= path.length-1){ finishIntro(); return; }
  const from = path[segIndex], to = path[segIndex+1];
  const dur = to.dur || 1.5;
  segT += dt;
  let t = Math.min(1, segT/dur);
  const e = ease(t);
  camera.position.set(
    from.pos.x + (to.pos.x-from.pos.x)*e,
    from.pos.y + (to.pos.y-from.pos.y)*e,
    from.pos.z + (to.pos.z-from.pos.z)*e
  );
  camera.rotation.order='YXZ';
  camera.rotation.y = from.yaw + (to.yaw-from.yaw)*e;
  camera.rotation.x = from.pitch + (to.pitch-from.pitch)*e;
  if(t >= 1){ segIndex++; segT = 0; }
};

function showLine(text, delay, holdMs){
  setTimeout(function(){
    introText.style.opacity = '0';
    setTimeout(function(){
      introText.textContent = text;
      introText.style.opacity = '1';
    }, 220);
  }, delay);
}

function runGreeting(name){
  introOverlay.style.display = 'flex';
  introText.style.opacity = '0';
  const returning = !!savedName;
  showLine(returning ? ('Welcome back, ' + name + '.') : ('Welcome, ' + name + '.'), 150);
  showLine("This is Jayesh's portfolio room.", 1900);
  showLine('Walk around, interact with anything that glows a label.', 3400);
  setTimeout(function(){ introText.style.opacity = '0'; }, 4900);
  setTimeout(function(){ introOverlay.style.display = 'none'; }, 5300);
}

function finishIntro(){
  APP.introActive = false;
  APP.gameStarted = true;
  APP.setSpawn();
  document.getElementById('hud').style.display = 'block';
  if(!APP.isTouchDevice) APP.requestLock();
  if(APP.ui && APP.ui.maybeStartTutorial) APP.ui.maybeStartTutorial();
};

nameSubmit.addEventListener('click', submitName);
nameInput.addEventListener('keydown', function(e){ if(e.key==='Enter') submitName(); });

function submitName(){
  let name = (nameInput.value || '').trim();
  if(!name) name = 'Guest';
  name = name.slice(0, 24);
  try { localStorage.setItem('portfolio_visitor_name', name); } catch(e){}
  APP.visitorName = name;
  boot.style.display = 'none';
  runGreeting(name);
  startFlythrough();
}

})();
