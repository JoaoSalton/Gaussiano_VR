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
    90,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
);

const dolly = new THREE.Group();
dolly.add(camera);
scene.add(dolly);

dolly.position.set(4, -10, 4);
camera.position.set(0, 0, 0);
camera.rotation.set(0, 0, 0); // garante que não veio nenhuma rotação residual

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

console.log("scene rotation:", scene.rotation);

const orbitControls = new OrbitControls(camera, renderer.domElement);

// target local em relação ao dolly (camera é filha do dolly)
orbitControls.target.set(5, 45, -8);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.1;
orbitControls.rotateSpeed = 0.1;
orbitControls.enableZoom = false;
orbitControls.enablePan = false;
orbitControls.update();

// força orientação inicial explicitamente, sem depender do update automático
camera.lookAt(new THREE.Vector3(0, camera.position.y, -1000));

console.log("cam rotation após setup:", camera.rotation);

// ---------- MOVIMENTAÇÃO POR TECLADO (DESKTOP) ----------
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));
// evita que perder o foco da janela "trave" uma tecla pressionada
window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
});

const BASE_SPEED = 1.0;      // m/s andando
const SPRINT_SPEED = 1.5;    // m/s correndo (Shift)
const VERTICAL_SPEED = 1.0;  // m/s subindo/descendo (Q/E ou Space/Ctrl)
const ACCEL = 15;            // quão rápido atinge a velocidade alvo
const DAMPING = 3;          // quão rápido freia ao soltar a tecla

const velocity = new THREE.Vector3();      // velocidade atual (world space)
const desiredVelocity = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);

function updateDesktopMovement(delta) {
    if (renderer.xr.isPresenting) return;

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, camera.up).normalize();

    const currentSpeed = keys["ShiftLeft"] || keys["ShiftRight"] ? SPRINT_SPEED : BASE_SPEED;

    desiredVelocity.set(0, 0, 0);
    if (keys["KeyW"] || keys["ArrowUp"]) desiredVelocity.add(forward);
    if (keys["KeyS"] || keys["ArrowDown"]) desiredVelocity.sub(forward);
    if (keys["KeyD"] || keys["ArrowRight"]) desiredVelocity.add(right);
    if (keys["KeyA"] || keys["ArrowLeft"]) desiredVelocity.sub(right);

    if (desiredVelocity.lengthSq() > 0) {
        desiredVelocity.normalize().multiplyScalar(currentSpeed);
    }

    // sobe/desce — eixo mundial, independente da rotação da câmera
    let verticalInput = 0;
    if (keys["KeyE"] || keys["Space"]) verticalInput += 1;
    if (keys["KeyQ"] || keys["ControlLeft"]) verticalInput -= 1;
    desiredVelocity.addScaledVector(worldUp, verticalInput * VERTICAL_SPEED);

    // suaviza a transição de velocidade (aceleração/frenagem)
    const rate = desiredVelocity.lengthSq() > 0 ? ACCEL : DAMPING;
    velocity.lerp(desiredVelocity, 1 - Math.exp(-rate * delta));

    if (velocity.lengthSq() > 0.0001) {
        const move = velocity.clone().multiplyScalar(delta);
        camera.position.add(move);
        orbitControls.target.add(move);
    } else {
        velocity.set(0, 0, 0);
    }
}

// ---------- MOVIMENTAÇÃO EM VR (THUMBSTICK) ----------
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
