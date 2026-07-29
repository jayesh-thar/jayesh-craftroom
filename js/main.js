/* =====================================================================
   main.js — boots the loading bar, then runs the single main loop that
   drives the intro flythrough first, and free-roam play after.
   ===================================================================== */
(function(){
window.APP = window.APP || {};
const scene = APP.scene, camera = APP.camera, renderer = APP.renderer;

const clock = new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());

  if(APP.updateWorldAnimations) APP.updateWorldAnimations(dt);
  if(APP.updateDoorAnimation) APP.updateDoorAnimation(dt);
  if(APP.updateNpcs) APP.updateNpcs(dt);

  if(APP.introActive){
    APP.introUpdate(dt);
  } else if(APP.gameStarted){
    APP.updatePlayer(dt);
  }

  if(APP.ui && APP.ui.drawMinimap) APP.ui.drawMinimap();
  renderer.render(scene, camera);
}
animate();

/* ---------- loading bar, then hand off to intro.js ---------- */
const loadbar = document.getElementById('loadbar');
let pct = 0;
const loadTimer = setInterval(function(){
  pct += 8 + Math.random()*14;
  if(pct >= 100){
    pct = 100;
    clearInterval(loadTimer);
    APP.showNameEntry();
  }
  loadbar.style.width = pct + '%';
}, 90);

})();
