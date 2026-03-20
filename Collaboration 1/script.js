import * as THREE from "three";
import { OrbitControls } from "./src/OrbitControls.js";
import { PointerLockControls } from "./src/PointerLockControls.js";

let camera, canvas, controls, scene, renderer;

let raycaster;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

init();

function init() {
    canvas = document.getElementById("3-holder");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa9c6d8);
    scene.fog = new THREE.FogExp2(0xa9c6d8, 0.0035);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setAnimationLoop(animate);
    canvas.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.set(0, 10, 0);

    controls = new PointerLockControls(camera, document.body);

    const blocker = document.getElementById("blocker");
    const instructions = document.getElementById("instructions");

    instructions.addEventListener("click", function () {
        controls.lock();
    });

    controls.addEventListener("lock", function () {
        instructions.style.display = "none";
        blocker.style.display = "none";
    });

    controls.addEventListener("unlock", function () {
        blocker.style.display = "block";
        instructions.style.display = "";
    });

    scene.add(controls.object);

    const onKeyDown = function (event) {
        switch (event.code) {
            case "ArrowUp":
            case "KeyW":
                moveForward = true;
                break;
            case "ArrowLeft":
            case "KeyA":
                moveLeft = true;
                break;
            case "ArrowDown":
            case "KeyS":
                moveBackward = true;
                break;
            case "ArrowRight":
            case "KeyD":
                moveRight = true;
                break;
            case "Space":
                if (canJump === true) velocity.y += 350;
                canJump = false;
                break;
        }
    };

    const onKeyUp = function (event) {
        switch (event.code) {
            case "ArrowUp":
            case "KeyW":
                moveForward = false;
                break;
            case "ArrowLeft":
            case "KeyA":
                moveLeft = false;
                break;
            case "ArrowDown":
            case "KeyS":
                moveBackward = false;
                break;
            case "ArrowRight":
            case "KeyD":
                moveRight = false;
                break;
        }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

    // ground
    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x4b4b4b });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // glaciers
    for (let i = 0; i < 12; i++) {
        let glacier;
        let r = Math.floor(Math.random() * 3);

        if (r === 0) glacier = makeGlacier1();
        if (r === 1) glacier = makeGlacier2();
        if (r === 2) glacier = makeGlacier3();

        glacier.position.set(Math.random() * 1200 - 600, 0, Math.random() * 1200 - 600);

        glacier.rotation.y = Math.random() * Math.PI * 2;

        let s = 1 + Math.random() * 1.5;
        glacier.scale.set(s, s, s);

        scene.add(glacier);
    }

    // dead trees
    for (let i = 0; i < 30; i++) {
        let tree;
        let r = Math.floor(Math.random() * 3);

        if (r === 0) tree = makeTree1();
        if (r === 1) tree = makeTree2();
        if (r === 2) tree = makeTree3();

        tree.position.set(Math.random() * 1000 - 500, 0, Math.random() * 1000 - 500);

        tree.rotation.y = Math.random() * Math.PI * 2;

        let s = 0.8 + Math.random() * 1.2;
        tree.scale.set(s, s, s);

        scene.add(tree);
    }

    // lights
    const dirLight1 = new THREE.DirectionalLight(0xe8f6ff, 2.5);
    dirLight1.position.set(1, 2, 1);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xbdd7e6, 1.5);
    dirLight2.position.set(-1, 1, -1);
    scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0x506070, 1.2);
    scene.add(ambientLight);

    window.addEventListener("resize", onWindowResize);
}

function makeGlacier1() {
    const group = new THREE.Group();

    const mat1 = new THREE.MeshPhongMaterial({
        color: 0xcfe8ff,
        transparent: true,
        opacity: 0.9
    });

    const mat2 = new THREE.MeshPhongMaterial({
        color: 0x9fc6e8,
        transparent: true,
        opacity: 0.8
    });

    const base = new THREE.Mesh(new THREE.ConeGeometry(25, 90, 5), mat1);
    base.position.y = 45;
    group.add(base);

    const side = new THREE.Mesh(new THREE.BoxGeometry(18, 45, 18), mat2);
    side.position.set(-10, 20, 8);
    side.rotation.z = -0.3;
    group.add(side);

    return group;
}

function makeGlacier2() {
    const group = new THREE.Group();

    const mat1 = new THREE.MeshPhongMaterial({
        color: 0xd8efff,
        transparent: true,
        opacity: 0.9
    });

    const mat2 = new THREE.MeshPhongMaterial({
        color: 0x8bb7db,
        transparent: true,
        opacity: 0.75
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(80, 45, 50), mat1);
    base.position.y = 22.5;
    group.add(base);

    const top = new THREE.Mesh(new THREE.ConeGeometry(22, 45, 5), mat2);
    top.position.set(10, 68, 0);
    group.add(top);

    return group;
}

function makeGlacier3() {
    const group = new THREE.Group();

    const mat1 = new THREE.MeshPhongMaterial({
        color: 0xc5e0ff,
        transparent: true,
        opacity: 0.9
    });

    const mat2 = new THREE.MeshPhongMaterial({
        color: 0x7fa8cf,
        transparent: true,
        opacity: 0.8
    });

    const base = new THREE.Mesh(new THREE.ConeGeometry(22, 75, 6), mat1);
    base.position.y = 37;
    group.add(base);

    const shard = new THREE.Mesh(new THREE.BoxGeometry(14, 40, 14), mat2);
    shard.position.set(12, 25, -6);
    shard.rotation.z = 0.4;
    group.add(shard);

    return group;
}

function makeBranch(length, width, x, y, z, rotZ, rotX) {
    const mat = new THREE.MeshPhongMaterial({ color: 0x5a4338 });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(width, width, length, 6), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rotZ;
    mesh.rotation.x = rotX;
    return mesh;
}

function makeTree1() {
    const group = new THREE.Group();

    const trunk = makeBranch(70, 3.5, 0, 35, 0, 0, 0);
    group.add(trunk);

    group.add(makeBranch(30, 2, -12, 60, 0, 0.8, 0));
    group.add(makeBranch(30, 2, 12, 60, 0, -0.8, 0));
    group.add(makeBranch(22, 1.5, -18, 78, 0, 1.1, 0));
    group.add(makeBranch(22, 1.5, 18, 78, 0, -1.1, 0));

    return group;
}

function makeTree2() {
    const group = new THREE.Group();

    const trunk = makeBranch(75, 3.5, 0, 37, 0, -0.2, 0);
    group.add(trunk);

    group.add(makeBranch(35, 2, -15, 55, 0, 1.0, 0));
    group.add(makeBranch(26, 1.8, 15, 65, 0, -0.6, 0));
    group.add(makeBranch(18, 1.2, -28, 72, 0, 1.2, 0));

    return group;
}

function makeTree3() {
    const group = new THREE.Group();

    const trunk = makeBranch(85, 3, 0, 42, 0, 0, 0);
    group.add(trunk);

    group.add(makeBranch(25, 1.8, -10, 68, 0, 0.7, 0));
    group.add(makeBranch(25, 1.8, 10, 68, 0, -0.7, 0));
    group.add(makeBranch(18, 1.2, -18, 83, 0, 1.0, 0));
    group.add(makeBranch(18, 1.2, 18, 83, 0, -1.0, 0));

    return group;
}

function animate() {
    const time = performance.now();

    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.object.position.y += velocity.y * delta;

        if (controls.object.position.y < 10) {
            velocity.y = 0;
            controls.object.position.y = 10;
            canJump = true;
        }
    }

    prevTime = time;
    render();
}

function render() {
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
