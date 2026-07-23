import * as THREE from "three";
import * as GaussianSplats3D from "./lib/gaussian-splats-3d.module.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ---------- SETUP BÁSICO ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
);

const dolly = new THREE.Group();
dolly.add(camera);
scene.add(dolly);


dolly.position.set(0, 1.6, 5);
camera.position.set(0, 0, 0);

// ---------- CARREGAR O SPLAT ----------
const viewer = new GaussianSplats3D.Viewer({
    renderer,
    camera,
    scene,
    useBuiltInControls: false, 
    sharedMemoryForWorkers: false
});

await viewer.addSplatScene("./modelo.ksplat");
console.log("splat carregado");


const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.target.set(0, 0, -1).add(camera.position);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.08;
orbitControls.rotateSpeed = 0.5;
orbitControls.enableZoom = false; 
orbitControls.enablePan = false;

const keys = {};
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

const moveSpeed = 2.5; // 
const forward = new THREE.Vector3();
const right = new THREE.Vector3();

function updateDesktopMovement(delta) {
    if (renderer.xr.isPresenting) return; 

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();
    if (keys["KeyW"]) move.add(forward);
    if (keys["KeyS"]) move.sub(forward);
    if (keys["KeyD"]) move.add(right);
    if (keys["KeyA"]) move.sub(right);

    if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(moveSpeed * delta);
        camera.position.add(move);
        orbitControls.target.add(move);
    }
}

const vrMoveSpeed = 1.5;
const tmpDir = new THREE.Vector3();
const tmpRight = new THREE.Vector3();

function updateVRMovement(delta) {
    const session = renderer.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
        if (!source.gamepad) continue;
        const axes = source.gamepad.axes;
 
        const x = axes.length >= 4 ? axes[2] : axes[0];
        const y = axes.length >= 4 ? axes[3] : axes[1];
        if (Math.abs(x) < 0.15 && Math.abs(y) < 0.15) continue;

        camera.getWorldDirection(tmpDir);
        tmpDir.y = 0;
        tmpDir.normalize();
        tmpRight.crossVectors(tmpDir, camera.up).normalize();

        dolly.position.addScaledVector(tmpDir, -y * vrMoveSpeed * delta);
        dolly.position.addScaledVector(tmpRight, x * vrMoveSpeed * delta);
    }
}


renderer.xr.addEventListener("sessionstart", () => (orbitControls.enabled = false));
renderer.xr.addEventListener("sessionend", () => (orbitControls.enabled = true));

// ---------- LOOP PRINCIPAL ----------
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    updateDesktopMovement(delta);
    updateVRMovement(delta);
    orbitControls.update();
    viewer.update();
    viewer.render();
});

// ---------- RESIZE ----------
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
