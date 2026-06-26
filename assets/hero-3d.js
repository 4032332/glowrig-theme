import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const wrap = document.getElementById('hero-3d-wrap');
const canvas = document.getElementById('hero-3d-canvas');
if (!wrap || !canvas) throw new Error('hero-3d: canvas not found');

// ── Renderer ────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ── Scene + Camera ──────────────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 2.4, 6.5);
camera.lookAt(0, 0.4, 0);

// ── Materials ───────────────────────────────────────────────────────────────
const darkMat  = new THREE.MeshStandardMaterial({ color: 0x0d0d18, roughness: 0.6, metalness: 0.3 });
const deskMat  = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.4, metalness: 0.5 });
const screenMat= new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 0.1, metalness: 0.8, emissive: 0x0022ff, emissiveIntensity: 0.08 });
const purpleMat= new THREE.MeshStandardMaterial({ color: 0xb44fff, emissive: 0xb44fff, emissiveIntensity: 1.5, roughness: 0.2 });
const cyanMat  = new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x00f5ff, emissiveIntensity: 1.5, roughness: 0.2 });
const matMat   = new THREE.MeshStandardMaterial({ color: 0x1a0a2e, roughness: 0.9, metalness: 0.0 });

// ── Desk surface ────────────────────────────────────────────────────────────
const desk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 2.8), deskMat);
desk.position.set(0, -0.06, 0);
scene.add(desk);

// ── Desk mat ────────────────────────────────────────────────────────────────
const deskMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.02, 2.2), matMat);
deskMesh.position.set(0, 0.02, 0.2);
scene.add(deskMesh);

// ── Monitor stand ───────────────────────────────────────────────────────────
const stand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), darkMat);
stand.position.set(0, 0.31, -0.7);
scene.add(stand);

const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.36), darkMat);
standBase.position.set(0, 0.08, -0.7);
scene.add(standBase);

// ── Monitor body ────────────────────────────────────────────────────────────
const monitorBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.52, 0.1), darkMat);
monitorBody.position.set(0, 1.38, -0.72);
scene.add(monitorBody);

const screen = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.36, 0.02), screenMat);
screen.position.set(0, 1.38, -0.66);
scene.add(screen);

// ── Monitor light bar (emissive strip on top) ────────────────────────────────
const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.07), purpleMat);
lightBar.position.set(0, 2.16, -0.72);
scene.add(lightBar);

// ── Keyboard ────────────────────────────────────────────────────────────────
const keyboard = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.54), darkMat);
keyboard.position.set(-0.1, 0.09, 0.5);
scene.add(keyboard);

// Keyboard RGB strip (purple underglow)
const kbGlow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.04), purpleMat);
kbGlow.position.set(-0.1, 0.06, 0.76);
scene.add(kbGlow);

// ── Mouse ────────────────────────────────────────────────────────────────────
const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.44), darkMat);
mouse.position.set(1.1, 0.11, 0.5);
scene.add(mouse);

// ── Headphone stand ─────────────────────────────────────────────────────────
const hpBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.36), darkMat);
hpBase.position.set(-1.7, 0.08, -0.3);
scene.add(hpBase);

const hpPole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), darkMat);
hpPole.position.set(-1.7, 0.55, -0.3);
scene.add(hpPole);

const hpArch = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 20, Math.PI), darkMat);
hpArch.position.set(-1.7, 1.02, -0.3);
hpArch.rotation.z = Math.PI;
scene.add(hpArch);

// ── AtmoBar (ambient light strip on back wall) ───────────────────────────────
const atmoBar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.04), cyanMat);
atmoBar.position.set(0, 1.9, -1.1);
scene.add(atmoBar);

// ── Neon point lights ────────────────────────────────────────────────────────
const purpleLight = new THREE.PointLight(0xb44fff, 4, 6);
purpleLight.position.set(-1.2, 1.5, 1.0);
scene.add(purpleLight);

const cyanLight = new THREE.PointLight(0x00f5ff, 3, 6);
cyanLight.position.set(1.4, 0.8, 0.5);
scene.add(cyanLight);

const backLight = new THREE.PointLight(0x00f5ff, 2, 5);
backLight.position.set(0, 2.0, -1.5);
scene.add(backLight);

const fillLight = new THREE.AmbientLight(0x111133, 1.2);
scene.add(fillLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 0.4);
keyLight.position.set(2, 4, 3);
scene.add(keyLight);

// ── Group for rotation ───────────────────────────────────────────────────────
const rig = new THREE.Group();
scene.children.slice().forEach(obj => {
  if (obj !== fillLight && obj !== keyLight) {
    scene.remove(obj);
    rig.add(obj);
  }
});
scene.add(rig);
rig.position.y = -0.6;

// ── Post-processing (Bloom) ──────────────────────────────────────────────────
let composer;
function buildComposer(W, H) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.9, 0.5, 0.75);
  composer.addPass(bloom);
}

// ── Resize ───────────────────────────────────────────────────────────────────
function resize() {
  const W = wrap.clientWidth;
  const H = wrap.clientHeight || 480;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  buildComposer(W, H);
}
resize();
window.addEventListener('resize', resize, { passive: true });

// ── Mouse parallax ───────────────────────────────────────────────────────────
let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
document.addEventListener('mousemove', e => {
  targetX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetY = (e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

// ── Animate ──────────────────────────────────────────────────────────────────
let autoRotate = 0;
function animate() {
  requestAnimationFrame(animate);

  autoRotate += 0.004;
  currentX += (targetX - currentX) * 0.04;
  currentY += (targetY - currentY) * 0.04;

  rig.rotation.y = autoRotate + currentX * 0.25;
  rig.rotation.x = currentY * -0.08;

  // Pulse neon lights
  const t = performance.now() * 0.001;
  purpleLight.intensity = 4 + Math.sin(t * 1.3) * 0.6;
  cyanLight.intensity   = 3 + Math.sin(t * 0.9 + 1) * 0.5;

  composer ? composer.render() : renderer.render(scene, camera);
}
animate();
