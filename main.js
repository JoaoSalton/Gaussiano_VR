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


// posição dos olhos
camera.position.set(0, 0, 0);



const viewer = new GaussianSplats3D.Viewer({
    renderer,
    camera,
    scene,
    sharedMemoryForWorkers: false
});



await viewer.addSplatScene("./modelo.ksplat", {
    showLoadingUI:false
});


console.log("splat carregado");



// ==========================
// CONTROLE TECLADO
// ==========================

const keys = {};

window.addEventListener("keydown", e=>{
    keys[e.key.toLowerCase()] = true;
});


window.addEventListener("keyup", e=>{
    keys[e.key.toLowerCase()] = false;
});



function moveCamera(){

    const speed = 0.05;


    const forward = new THREE.Vector3();

    camera.getWorldDirection(forward);

    // não deixa andar para cima/baixo olhando
    forward.y = 0;

    forward.normalize();



    const right = new THREE.Vector3();

    right.crossVectors(
        forward,
        camera.up
    );

    right.normalize();



    if(keys["w"]){
        camera.position.add(
            forward.clone().multiplyScalar(speed)
        );
    }


    if(keys["s"]){
        camera.position.add(
            forward.clone().multiplyScalar(-speed)
        );
    }


    if(keys["a"]){
        camera.position.add(
            right.clone().multiplyScalar(-speed)
        );
    }


    if(keys["d"]){
        camera.position.add(
            right.clone().multiplyScalar(speed)
        );
    }


    if(keys["q"]){
        camera.position.y += speed;
    }


    if(keys["e"]){
        camera.position.y -= speed;
    }

}




// ==========================
// LOOP
// ==========================

renderer.setAnimationLoop(()=>{

    moveCamera();

    viewer.update();

});





window.addEventListener("resize",()=>{

    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});
