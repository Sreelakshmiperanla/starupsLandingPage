import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Setup renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Create scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 5, 20);

// Add controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 30;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Remove the ground plane
// Create star field
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 10000; // Decrease star count for less dense background
const positions = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount; i++) {
  positions[i * 3] = Math.random() * 2000 - 1000; // X position
  positions[i * 3 + 1] = Math.random() * 2000 - 1000; // Y position
  positions[i * 3 + 2] = Math.random() * 2000 - 1000; // Z position
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1,
  sizeAttenuation: true
});
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Load GLTF model
const loader = new GLTFLoader().setPath('solar_system_animation/');
let mixer;
loader.load('scene.gltf', (gltf) => {
  console.log('loading model');
  const model = gltf.scene;

  // Scale down the model
  model.scale.set(0.5, 0.5, 0.5);

  // Ensure planets and animations are included
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      // Ensure the material is properly set up
      child.material = new THREE.MeshStandardMaterial({
        map: child.material.map,
        normalMap: child.material.normalMap,
        roughnessMap: child.material.roughnessMap,
        metalnessMap: child.material.metalnessMap,
      });
    }
  });

  model.position.set(0, 0, 0);
  scene.add(model);

  // Setup animation mixer
  mixer = new THREE.AnimationMixer(model);
  gltf.animations.forEach((clip) => {
    mixer.clipAction(clip).play();
  });

  document.getElementById('progress-container').style.display = 'none';
}, (xhr) => {
  console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
}, (error) => {
  console.error(error);
});

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate stars
function animateStars() {
  const positions = stars.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] -= 0.05; // Move stars in x direction
    if (positions[i] < -1000) positions[i] = 1000; // Reset position when out of bounds
  }
  stars.geometry.attributes.position.needsUpdate = true;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  animateStars();
  if (mixer) mixer.update(0.01);
  renderer.render(scene, camera);
}

animate();
