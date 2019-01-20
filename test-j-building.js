// 12 INCHES = 12 UNITS = 16 PX

const CLASSROOM_HEIGHT = 8 * 12;
const PLAYER_HEIGHT = 5 * 12 + 10;
const PIXEL_SIZE = 12 / 16;
const PLAYER_RADIUS = 0.5 * 12;
const PLAYER_SPEED = 2;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdce0e1);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';
camera.position.set(5, PLAYER_HEIGHT, 0);
camera.rotation.set(-0.08, -3.24, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', e => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function wall(image, x1, z1, x2, z2, y = 0, height = CLASSROOM_HEIGHT, side = THREE.FrontSide) {
  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
    x1, y, z1,
    x1, y + height, z1,
    x2, y + height, z2,
    x2, y, z2
  ]), 3));
  const length = Math.hypot(x1 - x2, z1 - z2);
  return finishRectOff(geometry, image, length, height, side);
}
function flatRect(image, x, z, width, height, y = 0, side = THREE.FrontSide) {
  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
    x, y, z,
    x, y, z + height,
    x + width, y, z + height,
    x + width, y, z
  ]), 3));
  return finishRectOff(geometry, image, width, height, side);
}
function finishRectOff(geometry, image, width, height, side) {
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([
    0, 1, 2, 0, 2, 3
  ]), 1));
  if (image.isColour) {
    return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: image.colour, side, opacity: image.opacity, transparent: image.opacity !== 1}));
  } else {
    const {repeatX, repeatY, textureWidth, textureHeight} = doTextureRepeatMath(width, height, image);
    geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array([
      0.0, 0.0,
      0.0, height / textureHeight,
      width / textureWidth, height / textureHeight,
      width / textureWidth, 0.0
    ]), 2));
    return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map: texture(image, repeatX, repeatY), side}));
  }
}
function flatPath(image, points, y = 0, side = THREE.BackSide) {
  const shape = new THREE.Shape();
  shape.moveTo(...points[0]);
  points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  const geometry = new THREE.ShapeBufferGeometry(shape);
  const attribute = geometry.getAttribute('position');
  const uv = new Float32Array(attribute.array.length / 3 * 2);
  const x = Math.min(...points.map(pt => pt[0]));
  const z = Math.min(...points.map(pt => pt[1]));
  const width = Math.max(...points.map(pt => pt[0])) - x;
  const height = Math.max(...points.map(pt => pt[1])) - z;
  const {repeatX, repeatY, textureWidth, textureHeight} = doTextureRepeatMath(width, height, image);
  for (let i = 0, stop = attribute.array.length / 3; i < stop; i++) {
    uv[i * 2] = (attribute.array[i * 3] - x) / textureWidth;
    uv[i * 2 + 1] = (attribute.array[i * 3 + 1] - z) / textureHeight;
    attribute.array[i * 3 + 2] = attribute.array[i * 3 + 1];
    attribute.array[i * 3 + 1] = y;
  }
  geometry.addAttribute('position', attribute);
  if (typeof image === 'number') {
    return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: image, side}));
  } else {
    geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map: texture(image, repeatX, repeatY), side}));
  }
}

const loader = new THREE.ImageLoader();
const loadingPromises = [];
function texture(image, repeatX, repeatY) {
  const texture = new THREE.Texture(image, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.NearestFilter, THREE.NearestFilter);
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return texture;
}
function doTextureRepeatMath(width, height, image) {
  const repeatX = Math.ceil(width / image.width / PIXEL_SIZE);
  const repeatY = Math.ceil(height / image.height / PIXEL_SIZE);
  return {
    repeatX, repeatY,
    textureWidth: repeatX * image.width * PIXEL_SIZE,
    textureHeight: repeatY * image.height * PIXEL_SIZE
  };
}
function colour(colour, opacity = 1) {
  return {
    colour: new THREE.Color(colour),
    opacity,
    isColour: true
  };
}
function image(url) {
  let image;
  loadingPromises.push(new Promise(res => {
    image = loader.load(url, res);
  }));
  return image;
}
async function loadImages(imgObject) {
  await Promise.all(loadingPromises);
  return imgObject;
}

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

const raycaster = new THREE.Raycaster();
const collideables = [];
function abstractedPlayerCollision(xCorner, zCorner, direction) {
  const start = camera.position.clone().add(new THREE.Vector3(xCorner * PLAYER_RADIUS,
    0, zCorner * PLAYER_RADIUS));
  raycaster.set(start, direction.normalize());
  const [intersection] = raycaster.intersectObjects(collideables);
  return intersection || null;
}
function collideAxis(velocity, isX) {
  if (velocity !== 0) {
    const sign = Math.sign(velocity);
    const leftIntersection = abstractedPlayerCollision(isX ? 0 : -1,
      isX ? -1 : 0, new THREE.Vector3(isX ? velocity : 0, 0, isX ? 0 : velocity));
    const rightIntersection = abstractedPlayerCollision(isX ? 0 : 1,
      isX ? 1 : 0, new THREE.Vector3(isX ? velocity : 0, 0, isX ? 0 : velocity));
    const intersection = leftIntersection && rightIntersection
      ? (leftIntersection.distance < rightIntersection.distance
        ? leftIntersection : rightIntersection) : leftIntersection
          || rightIntersection;
    if (intersection && intersection.distance <= Math.abs(velocity) + PLAYER_RADIUS) {
      const axisName = isX ? 'x' : 'z';
      return intersection.point[axisName] - camera.position[axisName] - sign * PLAYER_RADIUS;
    }
  }
  return velocity;
}

function animate() {
  requestAnimationFrame(animate);

  const dx = Math.sin(camera.rotation.y);
  const dz = Math.cos(camera.rotation.y);
  let xv = 0, zv = 0;
  if (keys.up) {
    xv -= dx * PLAYER_SPEED;
    zv -= dz * PLAYER_SPEED;
  }
  if (keys.down) {
    xv += dx * PLAYER_SPEED;
    zv += dz * PLAYER_SPEED;
  }
  if (keys.left) {
    xv -= dz * PLAYER_SPEED;
    zv += dx * PLAYER_SPEED;
  }
  if (keys.right) {
    xv += dz * PLAYER_SPEED;
    zv -= dx * PLAYER_SPEED;
  }
  camera.position.x += collideAxis(xv, true);
  camera.position.z += collideAxis(zv, false);

  renderer.render(scene, camera);
}
animate();
