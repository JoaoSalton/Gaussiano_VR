import * as THREE from "./lib/three.module.js";
import * as GaussianSplats3D from "./lib/gaussian-splats-3d.module.js";
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/webxr/VRButton.js";
alert("main carregou");

const renderer = new THREE.WebGLRenderer({
    antialias:true
});

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

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth/window.innerHeight,
    0.01,
    1000
);


const viewer = new GaussianSplats3D.Viewer({
    renderer,
    camera,
    scene,
    sharedMemoryForWorkers: false
});

await viewer.addSplatScene("./modelo.ksplat");


await viewer.addSplatScene(
    "./modelo.ksplat"
);


renderer.setAnimationLoop(()=>{
    renderer.render(scene,camera);
});
