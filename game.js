import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ASSETS } from "./assets.js";

const CONFIG = Object.freeze({
  lanes: [-3, 0, 3],
  roadWidth: 11,
  roadLength: 160,
  playerZ: 5,
  initialSpeed: 18,
  maxSpeed: 37,
  fixedStep: 1 / 60,
  levelLength: 750,
  checkpoint: 375,
  levelTime: 90,
  colors: {
    asphalt: 0x252729, lane: 0xe8d6a6, curb: 0xb04d2a, night: 0x11151c,
    fernet: 0x5c2b16, label: 0xbd3924, gold: 0xf2a43a
  }
});

const ui = {
  score: document.querySelector("#score"), distance: document.querySelector("#distance"),
  cans: document.querySelector("#cans"), lives: document.querySelector("#lives"),
  overlay: document.querySelector("#overlay"), overlayTitle: document.querySelector("#overlay-title"),
  overlayMessage: document.querySelector("#overlay-message"), shout: document.querySelector("#shout"),
  stage: document.querySelector("#stage"), progress: document.querySelector("#progress"),
  health: document.querySelector("#health"), timer: document.querySelector("#timer")
};

const LEVELS = [
  { name: "CENTRO HISTÓRICO", sky: 0x11151c, fog: 0x11151c, ground: 0x273426 },
  { name: "NUEVA CÓRDOBA", sky: 0x182336, fog: 0x182336, ground: 0x273426 },
  { name: "GÜEMES Y LA CAÑADA", sky: 0x2a1718, fog: 0x2a1718, ground: 0x303326 }
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.colors.night);
scene.fog = new THREE.Fog(0x11151c, 35, 125);
const camera = new THREE.PerspectiveCamera(58, 1, .1, 180);
camera.position.set(0, 7.2, 14);
camera.lookAt(0, 2, -35);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.querySelector("#game-shell").prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xa7bad2, 0x201510, 2.2));
const moon = new THREE.DirectionalLight(0xffddad, 2.4);
moon.position.set(-15, 26, 9);
moon.castShadow = true;
scene.add(moon);
const runnerFill = new THREE.PointLight(0xffc27a, 28, 22, 1.8);
runnerFill.position.set(0, 5.5, 11);
scene.add(runnerFill);

const materials = {
  road: new THREE.MeshStandardMaterial({ color: CONFIG.colors.asphalt, roughness: .9 }),
  lane: new THREE.MeshStandardMaterial({ color: CONFIG.colors.lane, roughness: .8 }),
  curb: new THREE.MeshStandardMaterial({ color: CONFIG.colors.curb }),
  grass: new THREE.MeshStandardMaterial({ color: 0x273426 }),
  building: new THREE.MeshStandardMaterial({ color: 0x75605b, roughness: .95 }),
  brick: new THREE.MeshStandardMaterial({ color: 0x983e2d, roughness: .9 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xd5b58b }),
  glass: new THREE.MeshStandardMaterial({ color: 0x4c91a7, transparent: true, opacity: .8 }),
  brown: new THREE.MeshStandardMaterial({ color: CONFIG.colors.fernet }),
  red: new THREE.MeshStandardMaterial({ color: CONFIG.colors.label }),
  silver: new THREE.MeshStandardMaterial({ color: 0xadb4b8, metalness: .7, roughness: .3 }),
  black: new THREE.MeshStandardMaterial({ color: 0x16181a }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xe6a52f }),
  white: new THREE.MeshStandardMaterial({ color: 0xe8e2d7 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x3c79a7 }),
  pink: new THREE.MeshStandardMaterial({ color: 0xd2606d }),
  wood: new THREE.MeshStandardMaterial({ color: 0x9a5a2f }),
  hole: new THREE.MeshStandardMaterial({ color: 0x08090b })
};

const box = (w, h, d, material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};
const cylinder = (r, h, material, x = 0, y = 0, z = 0, segments = 10) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  return mesh;
};

const world = new THREE.Group();
scene.add(world);
const road = box(CONFIG.roadWidth, .18, CONFIG.roadLength, materials.road, 0, -.18, -38);
world.add(road);
world.add(box(1, .25, CONFIG.roadLength, materials.curb, -6, -.2, -38));
world.add(box(1, .25, CONFIG.roadLength, materials.curb, 6, -.2, -38));
world.add(box(34, .2, CONFIG.roadLength, materials.grass, -23, -.3, -38));
world.add(box(34, .2, CONFIG.roadLength, materials.grass, 23, -.3, -38));

const movingWorld = { stripes: [], scenery: [], obstacles: [], pickups: [], landmarks: [] };
const pools = { obstacles: new Map(), pickups: new Map() };
for (let i = 0; i < 16; i++) {
  const z = -i * 10 - 3;
  for (const x of [-1.5, 1.5]) {
    const stripe = ASSETS.makeRoadSegment();
    stripe.position.set(x, .02, z);
    movingWorld.stripes.push(stripe);
    world.add(stripe);
  }
}

function createTree(x, z) {
  const group = new THREE.Group();
  group.add(cylinder(.22, 2.4, materials.wood, 0, 0, 0, 7));
  group.add(cylinder(1.15, 1.8, materials.grass, 0, 2.0, 0, 7));
  group.add(cylinder(.8, 1.3, materials.grass, -.7, 2.5, .15, 7));
  group.position.set(x, 0, z);
  return group;
}
function createCabildo(x, z) {
  const group = new THREE.Group();
  group.add(box(8, 5, 7, materials.cream));
  group.add(box(8.8, .4, 7.8, materials.brick, 0, 5, 0));
  for (let i = -3; i <= 3; i += 1.5) {
    group.add(box(.55, 2.6, .25, materials.dark ?? materials.brown, i, .7, -3.6));
    group.add(box(.55, 2.6, .25, materials.dark ?? materials.brown, i, .7, 3.6));
  }
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.4, 2, 8), materials.brick);
  roof.position.set(0, 6, 0);
  roof.scale.z = .8;
  group.add(roof);
  group.position.set(x, 0, z);
  return group;
}
function createChurch(x, z) {
  const group = new THREE.Group();
  group.add(box(8, 6, 7, materials.brick));
  group.add(box(2.3, 10, 2.7, materials.cream, -2.7, 0, 0));
  group.add(box(1.7, 7.5, 2.3, materials.cream, 2.7, 0, 0));
  const tallRoof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3, 4), materials.brick);
  tallRoof.position.set(-2.7, 11.5, 0);
  const shortRoof = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 4), materials.brick);
  shortRoof.position.set(2.7, 9, 0);
  group.add(tallRoof, shortRoof);
  group.position.set(x, 0, z);
  return group;
}
function createApartment(x, z) {
  const group = new THREE.Group();
  const h = 7 + Math.random() * 9;
  group.add(box(7, h, 8, [materials.building, materials.cream, materials.brick][Math.floor(Math.random() * 3)]));
  for (let y = 1.8; y < h - 1; y += 2.1) for (let i = -2.2; i <= 2.2; i += 2.2)
    group.add(box(.75, .75, .08, materials.glass, i, y, -4.05));
  group.position.set(x, 0, z);
  return group;
}
function addScenery() {
  const z = -25 - Math.random() * 90;
  const left = ASSETS.makeStreetCluster(Math.floor(Math.random() * 3));
  const right = ASSETS.makeStreetCluster(Math.floor(Math.random() * 3));
  const leftTree = ASSETS.makeTree();
  const rightTree = ASSETS.makeTree();
  left.position.set(-13, 0, z);
  right.position.set(13, 0, z - 4);
  left.rotation.y = Math.PI / 2;
  right.rotation.y = -Math.PI / 2;
  leftTree.position.set(-7.3, 0, z + 4);
  rightTree.position.set(7.3, 0, z + 1);
  world.add(left, right, leftTree, rightTree);
  movingWorld.scenery.push(left, right, leftTree, rightTree);
}
for (let i = 0; i < 9; i++) addScenery();

// La Cañada: a blue canal and tipa trees run alongside Córdoba's road.
const canal = box(2.5, .05, CONFIG.roadLength, materials.glass, -8.2, -.24, -38);
world.add(canal);
for (let i = 0; i < 8; i++) {
  const bridge = box(4, .3, 2.3, materials.cream, -7.2, 0, -8 - i * 18);
  world.add(bridge);
}

const player = new THREE.Group();
player.position.set(0, 0, CONFIG.playerZ);
world.add(player);
const playerParts = {};
playerParts.body = cylinder(.62, 1.55, materials.brown, 0, .92, 0, 10);
playerParts.shoulders = new THREE.Mesh(new THREE.ConeGeometry(.72, .62, 10), materials.brown);
playerParts.shoulders.position.set(0, 2.55, 0);
playerParts.shoulders.rotation.z = Math.PI;
playerParts.neck = cylinder(.24, .45, materials.brown, 0, 2.62, 0, 10);
playerParts.head = cylinder(.5, .82, materials.silver, 0, 3.02, 0, 10);
playerParts.label = cylinder(.65, .38, materials.red, 0, 1.52, 0, 10);
playerParts.badge = box(.28, .28, .05, materials.yellow, 0, 1.58, -.64);
playerParts.armL = box(.3, 1.35, .34, materials.silver, -.76, 1.15, 0);
playerParts.armR = box(.3, 1.35, .34, materials.silver, .76, 1.15, 0);
playerParts.legL = box(.34, 1.2, .38, materials.black, -.32, 0, 0);
playerParts.legR = box(.34, 1.2, .38, materials.black, .32, 0, 0);
playerParts.shoeL = box(.46, .25, .78, materials.white, -.32, 0, -.18);
playerParts.shoeR = box(.46, .25, .78, materials.white, .32, 0, -.18);
for (const part of Object.values(playerParts)) player.add(part);
playerParts.shoulders.castShadow = true;
playerParts.shoulders.receiveShadow = true;

const runnerAnim = { mixer: null, actions: {}, current: null, ready: false };
function playAnim(name, { loop = true, fade = .18, timeScale = 1 } = {}) {
  if (!runnerAnim.ready) return;
  const next = runnerAnim.actions[name];
  if (!next) return;
  if (runnerAnim.current === name && (loop || next.isRunning())) return;
  next.reset();
  next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
  next.clampWhenFinished = !loop;
  next.timeScale = timeScale;
  if (runnerAnim.current && runnerAnim.actions[runnerAnim.current])
    runnerAnim.actions[runnerAnim.current].crossFadeTo(next, fade, false);
  next.play();
  runnerAnim.current = name;
}
new GLTFLoader().load("models/fernet-man.glb", (gltf) => {
  const model = gltf.scene;
  model.traverse((node) => {
    if (node.isMesh || node.isSkinnedMesh) {
      node.castShadow = true;
      node.frustumCulled = false;
    }
    if (/handslot/i.test(node.name)) node.visible = false;
  });
  const measure = new THREE.Box3().setFromObject(model);
  model.scale.setScalar(1.75 / (measure.max.y - measure.min.y));
  model.updateMatrixWorld(true);
  model.position.y = -new THREE.Box3().setFromObject(model).min.y;
  model.rotation.y = Math.PI;
  player.add(model);
  for (const part of Object.values(playerParts)) part.visible = false;
  runnerAnim.mixer = new THREE.AnimationMixer(model);
  for (const clip of gltf.animations) runnerAnim.actions[clip.name] = runnerAnim.mixer.clipAction(clip);
  runnerAnim.ready = true;
});

const state = {
  mode: "title", score: 0, distance: 0, totalDistance: 0, cans: 0, lives: 3, health: 3, speed: CONFIG.initialSpeed,
  lane: 1, targetLane: 1, jumpY: 0, jumpVelocity: 0, slide: 0, dash: 0, invulnerable: 0,
  spawnTimer: 1.1, canTimer: .8, sceneryTimer: 4, runTime: 0, shoutTimer: 8,
  lastTime: performance.now(), accumulator: 0, level: 0, nextExtraLife: 25, stumble: 0,
  timeLeft: CONFIG.levelTime, checkpointReached: false, conferenceSpawned: false
};

const highScoreKey = "fernet-man-high-score";
let highScore = Number(localStorage.getItem(highScoreKey) || 0);
const shoutLines = ["¡FERNEEEET!", "¡A LA KIOSQUITO!", "¡QUÉ CALOR, PAPA!", "¡SALUD!", "¡VAMO' CÓRDOBA!"];

function updateHud() {
  ui.score.textContent = Math.floor(state.score);
  ui.distance.textContent = `${Math.floor(state.distance)} m`;
  ui.cans.textContent = state.cans;
  ui.health.textContent = "♥".repeat(Math.max(0, state.health)) + "♡".repeat(Math.max(0, 3 - state.health));
  ui.lives.textContent = state.lives;
  ui.timer.textContent = Math.max(0, Math.ceil(state.timeLeft));
  ui.stage.textContent = `NIVEL ${state.level + 1} — ${LEVELS[state.level].name}`;
  ui.progress.style.width = `${Math.min(100, state.distance / CONFIG.levelLength * 100)}%`;
}
function showOverlay(title, message) {
  ui.overlayTitle.textContent = title;
  ui.overlayMessage.textContent = message;
  ui.overlay.classList.add("visible");
}
function hideOverlay() { ui.overlay.classList.remove("visible"); }
function shout(message) {
  ui.shout.textContent = message || shoutLines[Math.floor(Math.random() * shoutLines.length)];
  ui.shout.classList.remove("show");
  void ui.shout.offsetWidth;
  ui.shout.classList.add("show");
}

function clearActiveObjects() {
  for (const item of [...movingWorld.obstacles, ...movingWorld.pickups]) item.visible = false;
  movingWorld.obstacles.length = 0;
  movingWorld.pickups.length = 0;
  for (const landmark of movingWorld.landmarks) world.remove(landmark);
  movingWorld.landmarks.length = 0;
}

function resetGame() {
  for (const bucket of [...pools.obstacles.values(), ...pools.pickups.values()])
    for (const item of bucket) item.visible = false;
  movingWorld.obstacles.length = 0; movingWorld.pickups.length = 0;
  for (const landmark of movingWorld.landmarks) {
    landmark.visible = false;
    world.remove(landmark);
  }
  movingWorld.landmarks.length = 0;
  Object.assign(state, { mode: "running", score: 0, distance: 0, totalDistance: 0, cans: 0, lives: 3, health: 3, speed: CONFIG.initialSpeed,
    lane: 1, targetLane: 1, jumpY: 0, jumpVelocity: 0, slide: 0, dash: 0, invulnerable: 0,
    spawnTimer: 1.1, canTimer: .8, sceneryTimer: 4, runTime: 0, shoutTimer: 8,
    level: 0, nextExtraLife: 25, stumble: 0, timeLeft: CONFIG.levelTime,
    checkpointReached: false, conferenceSpawned: false });
  runnerAnim.current = null;
  playAnim("Running_A");
  applyLevel(0);
  player.position.x = 0;
  hideOverlay();
  updateHud();
}

function startOrRestart() {
  if (state.mode === "levelcomplete") startNextLevel();
  else if (state.mode !== "running") resetGame();
}
function startNextLevel() {
  clearActiveObjects();
  Object.assign(state, {
    mode: "running", distance: 0, health: 3, timeLeft: CONFIG.levelTime,
    checkpointReached: false, conferenceSpawned: false, invulnerable: 1.2,
    targetLane: 1, lane: 1, jumpY: 0, jumpVelocity: 0, slide: 0, stumble: 0
  });
  state.level++;
  player.position.set(0, 0, CONFIG.playerZ);
  applyLevel(state.level);
  hideOverlay();
}
function moveLane(direction) {
  if (state.mode !== "running") return;
  state.targetLane = THREE.MathUtils.clamp(state.targetLane + direction, 0, 2);
}
function jump() {
  if (state.mode === "running" && state.jumpY < .03 && state.slide <= 0) state.jumpVelocity = 10.5;
}
function slide() {
  if (state.mode === "running" && state.jumpY < .1) state.slide = .72;
}
function dash() {
  if (state.mode === "running") state.dash = .35;
}
window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) event.preventDefault();
  if (event.key === "Enter") { startOrRestart(); return; }
  if (event.key.toLowerCase() === "p") {
    if (state.mode === "running") { state.mode = "paused"; showOverlay("PAUSA", "Presioná P para continuar"); }
    else if (state.mode === "paused") { state.mode = "running"; hideOverlay(); }
    return;
  }
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") moveLane(-1);
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") moveLane(1);
  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w" || event.key === " ") jump();
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") slide();
  if (event.key === "Shift") dash();
});

let pointerStart = null;
renderer.domElement.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch" && event.isPrimary === false) return;
  renderer.domElement.setPointerCapture?.(event.pointerId);
  pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
});
renderer.domElement.addEventListener("pointerup", (event) => {
  if (!pointerStart || pointerStart.id !== event.pointerId) return;
  const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return jump();
  if (Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1);
  else if (dy < 0) jump();
  else slide();
});
renderer.domElement.addEventListener("pointercancel", () => { pointerStart = null; });
ui.overlay.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  startOrRestart();
});

function acquireFromPool(pool, key, factory) {
  const bucket = pool.get(key) || [];
  pool.set(key, bucket);
  let group = bucket.find(item => !item.visible);
  if (!group) {
    group = factory();
    group.visible = false;
    world.add(group);
    bucket.push(group);
  }
  return group;
}
function createObstacle(type, lane, z) {
  const group = acquireFromPool(pools.obstacles, type, () => ASSETS.makeObstacle(type));
  group.userData = { type, lane, hit: false };
  group.position.set(CONFIG.lanes[lane], 0, z);
  group.scale.setScalar(1);
  group.visible = true;
  movingWorld.obstacles.push(group);
}
function createCan(lane, z, glass = false) {
  const key = glass ? "glass" : "can";
  const group = acquireFromPool(pools.pickups, key, () => ASSETS.makeCollectible(glass));
  group.userData = { lane, glass, collected: false };
  group.position.set(CONFIG.lanes[lane], 0, z);
  group.rotation.set(0, 0, 0);
  group.scale.setScalar(1);
  group.visible = true;
  movingWorld.pickups.push(group);
}
function prewarmPools() {
  for (const type of ["car", "crossTruck", "person", "crate", "low", "high", "hole"]) {
    for (let i = 0; i < 6; i++) acquireFromPool(pools.obstacles, type, () => ASSETS.makeObstacle(type));
  }
  for (const glass of [false, true]) {
    for (let i = 0; i < 18; i++) acquireFromPool(pools.pickups, glass ? "glass" : "can", () => ASSETS.makeCollectible(glass));
  }
}

function spawnObstacle() {
  const types = ["car", "car", "person", "crate", "low", "high", "hole", "crossTruck"];
  const type = types[Math.floor(Math.random() * types.length)];
  createObstacle(type, Math.floor(Math.random() * 3), type === "crossTruck" ? -48 : -105);
  if (type === "crossTruck") {
    const truck = movingWorld.obstacles.at(-1);
    truck.position.x = Math.random() < .5 ? -9 : 9;
    truck.userData.crossDirection = truck.position.x < 0 ? 1 : -1;
  }
  if (Math.random() < .22) createObstacle("crate", Math.floor(Math.random() * 3), -111);
}
function spawnPickup() {
  const glass = Math.random() < .12;
  createCan(Math.floor(Math.random() * 3), -105, glass);
}
function laneNear(group) {
  return Math.abs(group.userData.lane - state.targetLane) < .1;
}
function hitPlayer(obstacle) {
  if (state.invulnerable > 0 || obstacle.userData.hit) return;
  const { type } = obstacle.userData;
  const airborne = state.jumpY > .75;
  const sliding = state.slide > 0;
  const avoided = (type === "low" || type === "hole") && airborne
    || (type === "high" || type === "crossTruck") && sliding;
  if (avoided || (type === "crate" && state.dash > 0)) {
    if (type === "crate" && state.dash > 0) { obstacle.userData.hit = true; obstacle.visible = false; }
    return;
  }
  obstacle.userData.hit = true;
  state.health--;
  state.invulnerable = 1.25;
  state.stumble = .62;
  state.speed = Math.max(CONFIG.initialSpeed * .65, state.speed * .62);
  if (state.health <= 0) {
    state.lives--;
    if (state.lives > 0) {
      respawnAtCheckpoint();
      return;
    }
    state.mode = "gameover";
    highScore = Math.max(highScore, Math.floor(state.score));
    localStorage.setItem(highScoreKey, String(highScore));
    showOverlay("FIN DEL VIAJE", `Puntaje ${Math.floor(state.score)} · Récord ${highScore}. Presioná Enter para volver a correr`);
  }
}
function respawnAtCheckpoint() {
  state.health = 3;
  state.distance = state.checkpointReached ? CONFIG.checkpoint : 0;
  state.timeLeft = Math.max(state.timeLeft, 35);
  clearActiveObjects();
  state.conferenceSpawned = false;
  state.invulnerable = 1.8;
  state.stumble = 0;
  state.targetLane = 1;
  state.lane = 1;
  player.position.set(0, 0, CONFIG.playerZ);
}
function collectPickup(pickup) {
  if (pickup.userData.collected) return;
  pickup.userData.collected = true;
  state.cans += pickup.userData.glass ? 2 : 1;
  if (state.cans % 10 === 0) state.health = Math.min(3, state.health + 1);
  if (state.cans >= state.nextExtraLife) {
    state.lives++;
    state.nextExtraLife += 25;
    shout();
  }
  if (Math.random() < .1) shout();
  pickup.visible = false;
}
function update(dt) {
  state.runTime += dt;
  const cruisingSpeed = Math.min(CONFIG.maxSpeed, CONFIG.initialSpeed + state.distance * .035);
  state.speed = cruisingSpeed * (state.stumble > 0 ? .58 : 1);
  const covered = state.speed * dt * .45;
  state.distance += covered;
  state.totalDistance += covered;
  state.timeLeft -= dt;
  state.score = Math.floor(state.totalDistance) + state.cans * 10;
  if (!state.checkpointReached && state.distance >= CONFIG.checkpoint) {
    state.checkpointReached = true;
    shout("CHECKPOINT");
  }
  if (state.level === 0 && !state.conferenceSpawned && state.distance >= 675) spawnConference();
  if (state.timeLeft <= 0) {
    state.health = 0;
    state.lives--;
    if (state.lives > 0) respawnAtCheckpoint();
    else finishGame(false);
  }
  if (state.distance >= CONFIG.levelLength) finishLevel();
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  state.stumble = Math.max(0, state.stumble - dt);
  state.slide = Math.max(0, state.slide - dt);
  state.dash = Math.max(0, state.dash - dt);
  state.jumpVelocity -= 28 * dt;
  state.jumpY += state.jumpVelocity * dt;
  if (state.jumpY < 0) { state.jumpY = 0; state.jumpVelocity = 0; }
  const runBob = state.jumpY === 0 && state.stumble <= 0 ? Math.abs(Math.sin(state.runTime * 14)) * .08 : 0;
  player.position.y = state.jumpY + runBob;
  player.position.z += ((state.stumble > 0 ? CONFIG.playerZ + 2.2 : CONFIG.playerZ) - player.position.z) * Math.min(1, dt * 14);
  state.lane += (state.targetLane - state.lane) * Math.min(1, dt * 13);
  player.position.x = CONFIG.lanes[Math.round(state.lane)] + (state.lane - Math.round(state.lane)) * 3;
  player.rotation.z = (state.targetLane - state.lane) * -.08;
  player.rotation.x = state.stumble > 0 ? Math.sin(state.stumble * 24) * .2 : 0;
  if (!runnerAnim.ready) {
    const stride = Math.sin(state.runTime * 14) * .42;
    const slideBlend = state.slide > 0
      ? Math.min(1, (.72 - state.slide) / .12, state.slide / .12)
      : 0;
    playerParts.legL.rotation.x = THREE.MathUtils.lerp(stride, -1.2, slideBlend);
    playerParts.legR.rotation.x = THREE.MathUtils.lerp(-stride, -1.2, slideBlend);
    playerParts.armL.rotation.x = THREE.MathUtils.lerp(-stride, 1.1, slideBlend);
    playerParts.armR.rotation.x = THREE.MathUtils.lerp(stride, 1.1, slideBlend);
    playerParts.body.scale.y = THREE.MathUtils.lerp(1, .55, slideBlend);
    playerParts.body.rotation.x = slideBlend * .72;
    playerParts.shoulders.position.y = THREE.MathUtils.lerp(2.55, 2.05, slideBlend);
    playerParts.neck.position.y = THREE.MathUtils.lerp(2.84, 2.24, slideBlend);
    playerParts.head.position.y = THREE.MathUtils.lerp(3.43, 2.55, slideBlend);
    playerParts.label.position.y = THREE.MathUtils.lerp(1.71, 1.36, slideBlend);
    playerParts.badge.position.y = THREE.MathUtils.lerp(1.72, 1.38, slideBlend);
  } else if (state.stumble > 0) {
    playAnim("Hit_A", { loop: false });
  } else if (state.slide > 0) {
    playAnim("Dodge_Forward", { loop: false });
  } else if (state.jumpY > .05 || state.jumpVelocity > 0) {
    playAnim("Jump_Full_Long", { loop: false });
  } else {
    playAnim("Running_A");
  }
  player.visible = state.invulnerable <= 0 || Math.floor(state.invulnerable * 14) % 2 === 0;

  for (const stripe of movingWorld.stripes) { stripe.position.z += state.speed * dt; if (stripe.position.z > 8) stripe.position.z -= 160; }
  for (const scenery of movingWorld.scenery) { scenery.position.z += state.speed * dt; if (scenery.position.z > 15) scenery.position.z -= 150; }
  for (const landmark of movingWorld.landmarks) {
    landmark.position.z += state.speed * dt;
    const open = THREE.MathUtils.clamp((landmark.position.z + 45) / 35, 0, 1);
    const [leftDoor, rightDoor] = landmark.userData.doors;
    leftDoor.position.x = -1.42 - open * 2.1;
    rightDoor.position.x = 1.42 + open * 2.1;
  }
  for (const bridge of world.children.filter(item => item !== road && item.position.x === -7.2)) { bridge.position.z += state.speed * dt; if (bridge.position.z > 15) bridge.position.z -= 144; }

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) { spawnObstacle(); state.spawnTimer = Math.max(.38, 1.25 - state.distance / 800); }
  state.canTimer -= dt;
  if (state.canTimer <= 0) { spawnPickup(); state.canTimer = .55 + Math.random() * .45; }
  state.shoutTimer -= dt;
  if (state.shoutTimer <= 0) { if (Math.random() < .5) shout(); state.shoutTimer = 12 + Math.random() * 12; }

  for (let i = movingWorld.obstacles.length - 1; i >= 0; i--) {
    const obstacle = movingWorld.obstacles[i];
    obstacle.position.z += state.speed * dt;
    if (obstacle.userData.type === "crossTruck") {
      obstacle.position.x += obstacle.userData.crossDirection * state.speed * dt * .2;
      obstacle.userData.lane = THREE.MathUtils.clamp(
        Math.round((obstacle.position.x - CONFIG.lanes[0]) / 3), 0, 2
      );
    }
    obstacle.scale.setScalar(THREE.MathUtils.clamp(1 + (obstacle.position.z + 100) / 240, .85, 1.35));
    const aligned = obstacle.userData.type === "crossTruck"
      ? Math.abs(obstacle.position.x - player.position.x) < 3.5
      : laneNear(obstacle);
    if (obstacle.position.z > 4 && obstacle.position.z < 7 && aligned) hitPlayer(obstacle);
    if (obstacle.position.z > 15) { obstacle.visible = false; movingWorld.obstacles.splice(i, 1); }
  }
  for (let i = movingWorld.pickups.length - 1; i >= 0; i--) {
    const pickup = movingWorld.pickups[i];
    pickup.position.z += state.speed * dt;
    pickup.rotation.y += dt * 4;
    if (pickup.position.z > 3.5 && pickup.position.z < 7 && laneNear(pickup)) collectPickup(pickup);
    if (pickup.position.z > 15) { pickup.visible = false; movingWorld.pickups.splice(i, 1); }
  }
  updateHud();
}

function spawnConference() {
  const conference = ASSETS.makeConference();
  conference.position.set(0, 0, -105);
  conference.userData.doors = conference.children.slice(-2);
  world.add(conference);
  movingWorld.landmarks.push(conference);
  state.conferenceSpawned = true;
}

function finishLevel() {
  if (state.mode !== "running") return;
  if (state.level >= LEVELS.length - 1) {
    finishGame(true);
    return;
  }
  state.mode = "levelcomplete";
  showOverlay(
    state.level === 0 ? "¡GANASTE!" : `NIVEL ${state.level + 1} COMPLETO`,
    state.level === 0
      ? `Llegaste a DEVIN CONF con ${state.cans} botellas · Tocá para seguir`
      : `${state.cans} botellas · Tocá para correr el siguiente nivel`
  );
}

function finishGame(won) {
  if (state.mode !== "running") return;
  state.mode = won ? "won" : "gameover";
  highScore = Math.max(highScore, Math.floor(state.score));
  localStorage.setItem(highScoreKey, String(highScore));
  showOverlay(
    won ? "¡GANASTE!" : "FIN DEL VIAJE",
    won
      ? `Completaste Córdoba con ${state.cans} botellas · Puntaje ${Math.floor(state.score)}`
      : `Se acabó el tiempo · Puntaje ${Math.floor(state.score)}`
  );
}

function render() {
  camera.position.x += (player.position.x * .14 - camera.position.x) * .06;
  camera.lookAt(player.position.x * .1, 2.2 + state.jumpY * .1, -35);
  renderer.render(scene, camera);
}
function resize() {
  const { clientWidth: width, clientHeight: height } = document.querySelector("#game-shell");
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width / height < .72 ? 70 : 58;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
prewarmPools();
resize();
updateHud();
showOverlay("FERNET MAN", "Tocá para correr");
if (new URLSearchParams(location.search).has("auto")) resetGame();

function applyLevel(index) {
  const level = LEVELS[index];
  scene.background.setHex(level.sky);
  scene.fog.color.setHex(level.fog);
  materials.grass.color.setHex(level.ground);
  ui.stage.textContent = `NIVEL ${index + 1} — ${level.name}`;
}

function loop(now) {
  requestAnimationFrame(loop);
  const elapsed = Math.min(.1, (now - state.lastTime) / 1000);
  state.lastTime = now;
  if (state.mode === "running") {
    state.accumulator += elapsed;
    while (state.accumulator >= CONFIG.fixedStep) { update(CONFIG.fixedStep); state.accumulator -= CONFIG.fixedStep; }
  } else {
    if (state.mode === "title") playAnim("Idle");
    else if (state.mode === "won" || state.mode === "levelcomplete") playAnim("Cheer");
    else if (state.mode === "gameover") playAnim("Death_A", { loop: false });
  }
  if (runnerAnim.mixer) runnerAnim.mixer.update(elapsed);
  render();
}
requestAnimationFrame(loop);
