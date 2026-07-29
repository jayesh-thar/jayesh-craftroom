/* =====================================================================
   content.js — all editable portfolio text lives here.
   Change project descriptions, skills, contact info, etc. in this file only.
   ===================================================================== */
window.APP = window.APP || {};

APP.RESUME_PATH = 'public/jayesh_thar_resume.pdf';

APP.CONTENT = {
  about: {
    icon: 'PC', title: 'ABOUT.EXE', retro: true,
    html:
      '<p>&gt; BOOTING PROFILE...</p>' +
      '<p>&gt; NAME: <b>JAYESH THAR</b></p>' +
      '<p>&gt; ROLE: Final-year B.Tech Computer Engineering student</p>' +
      '<p>&gt; FOCUS: Full-stack across MERN/PERN, frontend-leaning (React.js, Next.js), ' +
      'with strong backend chops in Node.js/Express and secure, production-grade systems.</p>' +
      '<h3>&gt; CURRENTLY BUILDING</h3>' +
      '<ul><li>VaultX &mdash; zero-knowledge encrypted identity vault (completed)</li>' +
      '<li>HookBin &mdash; real-time webhook inspection &amp; debugging platform (in progress)</li></ul>' +
      '<h3>&gt; EDUCATION</h3>' +
      '<p>B.Tech, Computer Engineering &mdash; Marwadi University (2023&ndash;2027)<br>Current CGPA: 8.37 &middot; No Backlog</p>' +
      '<h3>&gt; CERTIFICATIONS ON FILE</h3>' +
      '<ul><li>AWS Academy Graduate &mdash; Cloud Foundations</li><li>Machine Learning using Python</li>' +
      '<li>Automate Software Testing in Software Engineering</li><li>CNN &mdash; Introduction to Networks</li><li>Linux Essentials</li></ul>' +
      '<p style="margin-top:14px;">&gt; STATUS: OPEN TO INTERNSHIPS_</p>'
  },
  skills: {
    icon: 'BK', title: 'SKILLS SHELF',
    html:
      '<h3>Tech stack</h3><div class="tag-row"><span class="tag">MERN</span><span class="tag">PERN</span></div>' +
      '<h3>Frontend</h3><div class="tag-row"><span class="tag">React.js</span><span class="tag">Next.js</span>' +
      '<span class="tag">Redux / Context API</span><span class="tag">Tailwind CSS</span><span class="tag">HTML5</span><span class="tag">CSS3</span></div>' +
      '<h3>Backend</h3><div class="tag-row"><span class="tag">Node.js</span><span class="tag">Express.js</span></div>' +
      '<h3>Languages</h3><div class="tag-row"><span class="tag">JavaScript</span><span class="tag">TypeScript</span><span class="tag">Java</span><span class="tag">C</span></div>' +
      '<h3>Databases</h3><div class="tag-row"><span class="tag">MongoDB</span><span class="tag">PostgreSQL</span><span class="tag">Redis</span></div>' +
      '<h3>DevOps &amp; tools</h3><div class="tag-row"><span class="tag">Docker</span><span class="tag">CI/CD</span><span class="tag">Git / GitHub</span></div>' +
      '<h3>AI-assisted dev</h3><div class="tag-row"><span class="tag">Claude</span><span class="tag">GitHub Copilot</span><span class="tag">Cursor</span><span class="tag">ChatGPT</span><span class="tag">Gemini Pro</span></div>' +
      '<h3>Concepts</h3><div class="tag-row"><span class="tag">Responsive Design</span><span class="tag">State Management</span>' +
      '<span class="tag">System Design</span><span class="tag">Secure Auth Flows</span><span class="tag">DB Modelling</span>' +
      '<span class="tag">RESTful API Design</span><span class="tag">Webhook Systems</span></div>'
  },
  projects: {
    icon: 'PJ', title: 'PROJECTS',
    html:
      '<div class="proj-block"><span class="status done">COMPLETED</span>' +
      '<h3 style="margin-top:0;">VaultX &mdash; zero-knowledge encrypted identity vault</h3>' +
      '<p>Cross-platform identity vault with a fully custom React frontend and secure client-side architecture &mdash; ' +
      'client-side AES-256-GCM encryption, Argon2id key derivation, zero plaintext data ever reaching the server.</p>' +
      '<p>Secure UX flows: browser autofill, password health analysis, data import/export, session-based access control.</p>' +
      '<div class="tag-row"><span class="tag">React</span><span class="tag">AES-256-GCM</span><span class="tag">Argon2id</span></div>' +
      '<a class="modal-link" href="https://vault-x.xyz" target="_blank" rel="noopener">Live: vault-x.xyz</a>' +
      '<a class="modal-link secondary" href="https://github.com/jayesh-thar/vault-x" target="_blank" rel="noopener">Repo</a></div>' +
      '<div class="proj-block"><span class="status wip">IN PROGRESS</span>' +
      '<h3 style="margin-top:0;">HookBin &mdash; webhook inspection &amp; debugging platform</h3>' +
      '<p>Live request streaming, searchable request history, one-click replay on the frontend, backed by an ' +
      'AI-assisted payload explanation and code generation engine to cut integration time.</p>' +
      '<div class="tag-row"><span class="tag">React</span><span class="tag">Node.js</span><span class="tag">Real-time streaming</span></div></div>' +
      '<div class="proj-block"><span class="status done">COMPLETED</span>' +
      '<h3 style="margin-top:0;">Authentication API &mdash; secure, reusable auth service</h3>' +
      '<p>Full auth service: JWT access tokens (15-min expiry), httpOnly refresh token rotation, bcrypt password ' +
      'hashing, rate-limited login endpoints, session management, role-based access control for multi-user APIs.</p>' +
      '<p>Consistent error schemas, input validation middleware, environment-variable-driven config &mdash; zero hardcoded secrets.</p>' +
      '<div class="tag-row"><span class="tag">JWT</span><span class="tag">bcrypt</span><span class="tag">RBAC</span></div>' +
      '<a class="modal-link secondary" href="https://github.com/jayesh-thar/auth-api" target="_blank" rel="noopener">Repo</a></div>'
  },
  certificates: {
    icon: 'CT', title: 'CERTIFICATES',
    html:
      '<p>Drop your certificate images into <b>assets/</b> as cert1.jpg through cert5.jpg to fill these in.</p>' +
      '<div class="cert-grid">' +
      '<div class="cert-card"><img src="assets/cert1.jpg" onerror="this.outerHTML=\'<div class=ph>Add assets/cert1.jpg</div>\'"><div>AWS Academy Graduate &mdash; Cloud Foundations</div></div>' +
      '<div class="cert-card"><img src="assets/cert2.jpg" onerror="this.outerHTML=\'<div class=ph>Add assets/cert2.jpg</div>\'"><div>Machine Learning using Python</div></div>' +
      '<div class="cert-card"><img src="assets/cert3.jpg" onerror="this.outerHTML=\'<div class=ph>Add assets/cert3.jpg</div>\'"><div>Automate Software Testing in SE</div></div>' +
      '<div class="cert-card"><img src="assets/cert4.jpg" onerror="this.outerHTML=\'<div class=ph>Add assets/cert4.jpg</div>\'"><div>CNN &mdash; Intro to Networks</div></div>' +
      '<div class="cert-card"><img src="assets/cert5.jpg" onerror="this.outerHTML=\'<div class=ph>Add assets/cert5.jpg</div>\'"><div>Linux Essentials</div></div>' +
      '</div>'
  },
  contact: {
    icon: 'AT', title: 'CONTACT & RESUME',
    html:
      '<p>Let\'s talk &mdash; reach out through any of these:</p>' +
      '<ul class="social-row">' +
      '<li>Email: <a href="mailto:jayeshthar1409@gmail.com">jayeshthar1409@gmail.com</a></li>' +
      '<li>Phone: +91 7202005106</li>' +
      '<li>Website: <a href="https://jayeshthar.me" target="_blank" rel="noopener">jayeshthar.me</a></li>' +
      '<li>GitHub: <a href="https://github.com/jayesh-thar" target="_blank" rel="noopener">github.com/jayesh-thar</a></li>' +
      '<li>LinkedIn: <a href="https://linkedin.com/in/jayesh-thar" target="_blank" rel="noopener">linkedin/jayesh-thar</a></li>' +
      '</ul>' +
      '<h3>Resume</h3>' +
      '<a class="modal-link" href="' + APP.RESUME_PATH + '" target="_blank" rel="noopener">Download Resume (PDF)</a>'
  }
};

/* Character skin presets (shirt/pants colors) — click to pick in the Profile panel */
APP.SKINS = [
  { name:'Forest',  shirt:0x3d7a3d, pants:0x2a2a2a },
  { name:'Ocean',   shirt:0x3b5f9a, pants:0x2a2a2a },
  { name:'Ember',   shirt:0x9a3b3b, pants:0x2a2a2a },
  { name:'Gold',    shirt:0xd6b23b, pants:0x3a2a1a }
];
APP.SKIN_TONE = 0xe0ac69;

APP.BLOCK_COLORS = {
  grass:0x5fa93b, stone:0x8a8a8a, stonedark:0x6e6e6e, plank:0xa97a4a, oakdark:0x4a3218,
  sand:0xdfd0a0, snow:0xf2f6fa, obsidian:0x1c1626, sparkle:0x8ff0f0,
  glass:0xbfe8ff, water:0x3d7ec2, fire:0xff8a2b,
  wool_red:0x9a3b3b, wool_blue:0x3b5f9a, wool_yellow:0xd6b23b, wool_orange:0xd67a2b,
  wool_purple:0x7a3b9a, wool_white:0xf0f0f0,
  stair:0x6e6e6e, slab:0xa97a4a, fence:0x4a3218
};

/* Full palette available in the inventory dialog (press I, or tap the INV button).
   Click a palette item to drop it into the currently-selected hotbar slot. */
APP.BLOCK_PALETTE = [
  { id:'grass', label:'Grass' },
  { id:'stone', label:'Stone' },
  { id:'stonedark', label:'Cobblestone' },
  { id:'plank', label:'Plank' },
  { id:'oakdark', label:'Dark Oak' },
  { id:'sand', label:'Sand' },
  { id:'snow', label:'Snow' },
  { id:'obsidian', label:'Obsidian' },
  { id:'sparkle', label:'Crystal' },
  { id:'glass', label:'Glass' },
  { id:'water', label:'Water' },
  { id:'fire', label:'Fire' },
  { id:'stair', label:'Stone Stair' },
  { id:'slab', label:'Wood Slab' },
  { id:'fence', label:'Fence' },
  { id:'wool_red', label:'Red Wool' },
  { id:'wool_blue', label:'Blue Wool' },
  { id:'wool_yellow', label:'Yellow Wool' },
  { id:'wool_orange', label:'Orange Wool' },
  { id:'wool_purple', label:'Purple Wool' },
  { id:'wool_white', label:'White Wool' }
];

/* Shown in Settings → Build Guide, so visitors know what's possible. */
APP.BUILD_GUIDE = [
  'Blocks: Grass, Stone, Cobblestone, Plank, Dark Oak, Sand, Snow, Obsidian, Crystal, Glass, Water, Fire, 6 wool colors, plus shaped pieces: Stone Stair, Wood Slab, and Fence.',
  'Shaped pieces aren\'t just colored cubes — Stairs are a real step shape, Slabs are half-height, and Fences have posts and rails, so builds can look like an actual structure, not just blocks.',
  'Place: point at ground or an existing block, right-click (or PLACE on mobile).',
  'Break: point at a placed block, left-click (or BREAK on mobile). You can\'t break the terrain itself, only things you placed.',
  'Stack up to 4 pieces high per spot — try a small wall with a Fence on top, a Stair leading up to a platform, or a Slab roof.',
  'Building works anywhere you can walk: the house floor, the loft upstairs, or anywhere across the outdoor park — now much bigger, with a well, a garden pergola, and old ruins to find.',
  'Swap what\'s in your hotbar any time from the inventory (I) — pick a slot (1-6) first, then click a block.'
];

/* Hotbar items: slots 1-5 place blocks in the build area (stack up to 4 high),
   slot 6 is a fun held item that opens your resume when "used". Swap any
   block slot's contents from the inventory dialog (I). */
APP.HOTBAR = [
  { id:'grass', label:'Grass', type:'block', color:0x5fa93b },
  { id:'stone', label:'Stone', type:'block', color:0x8a8a8a },
  { id:'plank', label:'Plank', type:'block', color:0xa97a4a },
  { id:'wool_red', label:'Red Wool', type:'block', color:0x9a3b3b },
  { id:'wool_blue', label:'Blue Wool', type:'block', color:0x3b5f9a },
  { id:'resume', label:'Resume Book', type:'book' }
];

APP.TUTORIAL_STEPS = [
  { text:'Use WASD (or the joystick on mobile) to walk around, and your mouse (or drag on mobile) to look.' },
  { text:'Walk up to any object — desk, bookshelf, chest — and press E (or tap INTERACT) to open it.' },
  { text:'Walk up the stairs on the east side of the house to reach the loft — Certificates and Contact are up there.' },
  { text:'Go through the front door to step outside into the park — press F, or use Settings, to switch to third-person and see yourself.' },
  { text:'Pick a block with keys 1-5 (or the hotbar), left-click to place, right-click to remove — this works anywhere: indoors, upstairs, or across the whole outdoor terrain. Stack up to 4 high.' },
  { text:'Press I (or tap INV) to open the full block inventory — water, fire, glass and more — and swap them into your hotbar.' },
  { text:'Double-tap Space (or the Fly button in Settings) to toggle Fly mode — Space to rise, Shift to descend, and you can fly straight through walls.' },
  { text:'Your progress and preferences are saved in this browser — Settings (top-right) has day/night, controls, and a tutorial replay.' }
];
