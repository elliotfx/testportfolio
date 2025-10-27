import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

const container = document.querySelector('main');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b111a);

const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);

const yawObject = new THREE.Object3D();
yawObject.position.set(0, 1.6, 5);
const pitchObject = new THREE.Object3D();
pitchObject.add(camera);
yawObject.add(pitchObject);
scene.add(yawObject);

const ambientLight = new THREE.AmbientLight(0x8899aa, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xe8f1ff, 0.9);
dirLight.position.set(10, 12, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

const platformTexture = new THREE.CanvasTexture(createStoneTexture());
platformTexture.wrapS = platformTexture.wrapT = THREE.RepeatWrapping;
platformTexture.repeat.set(6, 6);
platformTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const platform = new THREE.Mesh(
  new THREE.BoxGeometry(40, 1, 40),
  new THREE.MeshStandardMaterial({
    map: platformTexture,
    color: 0xb7bec9,
    roughness: 0.85,
    metalness: 0.05,
  })
);
platform.position.y = -0.5;
platform.receiveShadow = true;
scene.add(platform);

const edgeMaterial = new THREE.MeshStandardMaterial({
  color: 0x303744,
  roughness: 0.6,
  metalness: 0.05,
});

const borderHeight = 0.6;
const borderThickness = 0.5;
const borderLength = 41;

const borders = new THREE.Group();

const createBorder = (length, xRot = 0, yRot = 0, position = new THREE.Vector3()) => {
  const border = new THREE.Mesh(
    new THREE.BoxGeometry(length, borderHeight, borderThickness),
    edgeMaterial
  );
  border.castShadow = true;
  border.receiveShadow = true;
  border.rotation.set(xRot, yRot, 0);
  border.position.copy(position);
  borders.add(border);
};

createBorder(borderLength, 0, 0, new THREE.Vector3(0, borderHeight / 2 - 0.5, -20));
createBorder(borderLength, 0, 0, new THREE.Vector3(0, borderHeight / 2 - 0.5, 20));
createBorder(borderLength, 0, Math.PI / 2, new THREE.Vector3(-20, borderHeight / 2 - 0.5, 0));
createBorder(borderLength, 0, Math.PI / 2, new THREE.Vector3(20, borderHeight / 2 - 0.5, 0));

scene.add(borders);

const columnMaterial = new THREE.MeshStandardMaterial({
  color: 0x6d7a8c,
  roughness: 0.7,
  metalness: 0.1,
});

for (let i = 0; i < 12; i += 1) {
  const angle = (i / 12) * Math.PI * 2;
  const radius = 12 + Math.sin(i * 0.8) * 1.5;
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 3, 12),
    columnMaterial
  );
  column.castShadow = true;
  column.receiveShadow = true;
  column.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);
  scene.add(column);
}

const clock = new THREE.Clock();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

const pointerSensitivity = 0.0022;

function onPointerMove(event) {
  if (!pointerLocked) return;
  const movementX = event.movementX || 0;
  const movementY = event.movementY || 0;

  yawObject.rotation.y -= movementX * pointerSensitivity;
  pitchObject.rotation.x -= movementY * pointerSensitivity;
  pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitchObject.rotation.x));
}

function createStoneTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const baseColor = '#8f9aa7';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2500; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 3 + 1;
    const opacity = Math.random() * 0.25 + 0.05;
    ctx.fillStyle = `rgba(60, 70, 82, ${opacity.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 20; i += 1) {
    const startX = Math.random() * size;
    const startY = Math.random() * size;
    const length = Math.random() * 150 + 40;
    const thickness = Math.random() * 3 + 1;
    const angle = Math.random() * Math.PI * 2;
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, 'rgba(170, 180, 190, 0.05)');
    gradient.addColorStop(0.5, 'rgba(60, 70, 82, 0.25)');
    gradient.addColorStop(1, 'rgba(200, 210, 220, 0.08)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  return canvas;
}

let pointerLocked = false;

function lockPointer() {
  renderer.domElement.requestPointerLock();
}

function onPointerLockChange() {
  pointerLocked = document.pointerLockElement === renderer.domElement;
}

function onPointerLockError() {
  console.warn('Pointer lock refusé');
}

renderer.domElement.addEventListener('click', () => {
  if (!pointerLocked) {
    lockPointer();
  }
});

renderer.domElement.addEventListener('mousemove', onPointerMove);
document.addEventListener('pointerlockchange', onPointerLockChange);
document.addEventListener('pointerlockerror', onPointerLockError);

function handleKey(keyCode, isPressed) {
  switch (keyCode) {
    case 'KeyZ':
    case 'ArrowUp':
      moveState.forward = isPressed;
      break;
    case 'KeyS':
    case 'ArrowDown':
      moveState.backward = isPressed;
      break;
    case 'KeyQ':
    case 'ArrowLeft':
      moveState.left = isPressed;
      break;
    case 'KeyD':
    case 'ArrowRight':
      moveState.right = isPressed;
      break;
    default:
      break;
  }
}

document.addEventListener('keydown', (event) => {
  handleKey(event.code, true);
});

document.addEventListener('keyup', (event) => {
  handleKey(event.code, false);
});

function updateMovement(delta) {
  const acceleration = 25.0;
  const damping = Math.exp(-5 * delta);

  velocity.x *= damping;
  velocity.z *= damping;

  direction.z = Number(moveState.forward) - Number(moveState.backward);
  direction.x = Number(moveState.right) - Number(moveState.left);

  if (direction.lengthSq() > 0) {
    direction.normalize();
  }

  if (moveState.forward || moveState.backward) {
    velocity.z -= direction.z * acceleration * delta;
  }

  if (moveState.left || moveState.right) {
    velocity.x -= direction.x * acceleration * delta;
  }

  const sin = Math.sin(yawObject.rotation.y);
  const cos = Math.cos(yawObject.rotation.y);

  yawObject.position.x += velocity.x * cos - velocity.z * sin;
  yawObject.position.z += velocity.x * sin + velocity.z * cos;

  const limit = 18.5;
  yawObject.position.x = Math.max(-limit, Math.min(limit, yawObject.position.x));
  yawObject.position.z = Math.max(-limit, Math.min(limit, yawObject.position.z));
}

function onWindowResize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', onWindowResize);

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (pointerLocked) {
    updateMovement(delta);
  }

  dirLight.position.x = Math.sin(Date.now() * 0.0002) * 10;
  dirLight.position.z = Math.cos(Date.now() * 0.0002) * 10;

  renderer.render(scene, camera);
}

animate();
