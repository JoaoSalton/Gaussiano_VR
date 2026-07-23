import * as THREE from "./lib/three.module.js";
import * as GaussianSplats3D from "./lib/gaussian-splats-3d.module.js";
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/webxr/VRButton.js";

alert("main carregou");


const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);
document.body.appendChild(
    VRButton.createButton(renderer)
);


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);


const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
);

camera.position.set(0, 0, 0);



const viewer = new GaussianSplats3D.Viewer({
    renderer,
    camera,
    scene,
    sharedMemoryForWorkers: false
});


await viewer.addSplatScene("./modelo.ksplat", {
    showLoadingUI: false
});

viewer.start();

console.log("splat carregado");


renderer.setAnimationLoop(() => {
    viewer.update();
});


window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});
