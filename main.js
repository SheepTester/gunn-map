/**
 * === TABLE OF CONTENTS ===
 * 1. CONSTANTS
 * 2. RENDERING SETUP
 * 3. MAP GENERATION
 * 4. USER INPUT
 * 5. PLAYER COLLISIONS
 * 6. MOVEMENT
 */

// 1. CONSTANTS
const CLASSROOM_HEIGHT = 10;
const PLAYER_HEIGHT = 5;
const TILE_REPEAT = 100;
const TILE_SIZE = 16;
const VISUAL_TILE_SIZE = 8;

// 2. RENDERING SETUP
// where things go
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9c9c9);

// the Eye(tm) - FOV, aspect ratio, near plane, far plane
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';
camera.position.y = PLAYER_HEIGHT;

// he who makes the pixels
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight); // can halve to reduce quality
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', e => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 3. MAP GENERATION
function tileTexture(url, repeat = TILE_REPEAT) {
  const texture = new THREE.TextureLoader().load(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

const textureSize = TILE_REPEAT * TILE_SIZE;
const classRoomHeightFraction = CLASSROOM_HEIGHT * VISUAL_TILE_SIZE / textureSize;

const floor = new THREE.BufferGeometry();
floor.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
  -textureSize / VISUAL_TILE_SIZE / 2, 0, -textureSize / VISUAL_TILE_SIZE / 2,
  -textureSize / VISUAL_TILE_SIZE / 2, 0, textureSize / VISUAL_TILE_SIZE / 2,
  textureSize / VISUAL_TILE_SIZE / 2, 0, textureSize / VISUAL_TILE_SIZE / 2,
  textureSize / VISUAL_TILE_SIZE / 2, 0, -textureSize / VISUAL_TILE_SIZE / 2
]), 3));
floor.addAttribute('uv', new THREE.BufferAttribute(new Float32Array([
  0.0, 0.0,
  0.0, 1.0,
  1.0, 1.0,
  1.0, 0.0
]), 2));
floor.setIndex(new THREE.BufferAttribute(new Uint16Array([
  0, 1, 2, 0, 2, 3
]), 1));
scene.add(addTexture(floor, tileTexture('./textures/cement.png')));

function planeBetween(x1, z1, x2, z2, raiseY = 0) {
  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
    x1, raiseY, z1,
    x1, raiseY + CLASSROOM_HEIGHT, z1,
    x2, raiseY + CLASSROOM_HEIGHT, z2,
    x2, raiseY, z2
  ]), 3));
  const length = Math.hypot(x1 - x2, z1 - z2);
  geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array([
    0.0, 0.0,
    0.0, classRoomHeightFraction,
    length * VISUAL_TILE_SIZE / textureSize, classRoomHeightFraction,
    length * VISUAL_TILE_SIZE / textureSize, 0.0
  ]), 2));
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([
    0, 1, 2, 0, 2, 3
  ]), 1));
  return geometry;
}
function addTexture(geometry, texture) {
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map: texture}));
}

const textures = {
  n_building: tileTexture('./textures/n-building.png'),
  old_buildings: tileTexture('./textures/old-buildings.png'),
  portables: tileTexture('./textures/portables.png')
};
const collideables = [];
fetch('./map-making/walls.json').then(r => r.json()).then(paths => {
  paths.forEach(([texture, ...coords]) => {
    const wall = addTexture(planeBetween(...coords), textures[texture]);
    collideables.push(wall);
    scene.add(wall);
  });
});

// 4. USER INPUT
document.addEventListener('click', e => {
  document.body.requestPointerLock();
});
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement) {
    camera.rotation.y -= e.movementX / 700;
    camera.rotation.x -= e.movementY / 700;
    if (camera.rotation.x > Math.PI / 2) camera.rotation.x = Math.PI / 2;
    else if (camera.rotation.x < -Math.PI / 2) camera.rotation.x = -Math.PI / 2;
  }
});

// detect keys
const keys = {};
document.addEventListener('keydown', e => {
  switch (e.keyCode) {
    case 65: case 37: keys.left = true; break;
    case 87: case 38: keys.up = true; break;
    case 68: case 39: keys.right = true; break;
    case 83: case 40: keys.down = true; break;
    case 16: keys.shift = true; break;
  }
});
document.addEventListener('keyup', e => {
  switch (e.keyCode) {
    case 65: case 37: keys.left = false; break;
    case 87: case 38: keys.up = false; break;
    case 68: case 39: keys.right = false; break;
    case 83: case 40: keys.down = false; break;
    case 16: keys.shift = false; break;
  }
});

// 5. PLAYER COLLISIONS
const raycaster = new THREE.Raycaster();
function abstractedPlayerCollision(xCorner, zCorner, direction) {
  const start = camera.position.clone().add(new THREE.Vector3(xCorner * PLAYER_RADIUS,
    0, zCorner * PLAYER_RADIUS));
  raycaster.set(start, direction);
  const [intersection] = raycaster.intersectObjects(collideables);
  return intersection || null;
}
function collideAxis(velocity, isX) {
  if (velocity !== 0) {
    const sign = Math.sign(velocity);
    const leftIntersection = abstractedPlayerCollision(isX ? sign : -1,
      isX ? -1 : sign, new THREE.Vector3(isX ? velocity : 0, 0, isX ? 0 : velocity));
    const rightIntersection = abstractedPlayerCollision(isX ? sign : 1,
      isX ? 1 : sign, new THREE.Vector3(isX ? velocity : 0, 0, isX ? 0 : velocity));
    const intersection = leftIntersection && rightIntersection
      ? (leftIntersection.distance < rightIntersection.distance
        ? leftIntersection : rightIntersection) : leftIntersection
          || rightIntersection;
    if (intersection && intersection.distance <= Math.abs(velocity)) {
      const axisName = isX ? 'x' : 'z';
      return intersection.point[axisName] - camera.position[axisName] - sign * PLAYER_RADIUS;
    }
  }
  return velocity;
}

const PLAYER_RADIUS = 1;
const PLAYER_SPEED = 0.2;
let speedBoost = 1;
function animate() {
  requestAnimationFrame(animate);

  // 6. MOVEMENT
  const dx = Math.sin(camera.rotation.y);
  const dz = Math.cos(camera.rotation.y);
  speedBoost += ((keys.shift ? 20 : 1) - speedBoost) / 50;
  let xv = 0, zv = 0;
  if (keys.up) {
    xv -= dx * PLAYER_SPEED * speedBoost;
    zv -= dz * PLAYER_SPEED * speedBoost;
  }
  if (keys.down) {
    xv += dx * PLAYER_SPEED * speedBoost;
    zv += dz * PLAYER_SPEED * speedBoost;
  }
  if (keys.left) {
    xv -= dz * PLAYER_SPEED * speedBoost;
    zv += dx * PLAYER_SPEED * speedBoost;
  }
  if (keys.right) {
    xv += dz * PLAYER_SPEED * speedBoost;
    zv -= dx * PLAYER_SPEED * speedBoost;
  }
  camera.position.x += collideAxis(xv, true);
  camera.position.z += collideAxis(zv, false);

  renderer.render(scene, camera);
}
animate();
