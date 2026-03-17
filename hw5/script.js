// The main library script
import * as THREE from "three";

// The plug-in for orbit controls
import { OrbitControls } from "./src/OrbitControls.js";

// Declaring global variables.
let camera, canvas, controls, scene, renderer;

// Run the "init" function which is like "setup" in p5.
init();

// Define initial scene
function init() {
    // scene setup
    canvas = document.getElementById("3-holder");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfeff5);
    scene.fog = new THREE.FogExp2(0xbfeff5, 0.0015);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    //renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(400, 400);
    renderer.setAnimationLoop(animate);
    canvas.appendChild(renderer.domElement);

    // Setup camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(400, 200, 0);

    // Setup controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 500;
    controls.cursorStyle = "grab";
    controls.maxPolarAngle = Math.PI / 2;

    // Add world geometry

    // Grouping of trees
    const geometry = new THREE.ConeGeometry(10, 200, 8, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x14405e, flatShading: true });
    const mesh = new THREE.InstancedMesh(geometry, material, 1000);
    const tree = new THREE.Object3D();
    for (let i = 0; i < 200; i++) {
        tree.position.x = Math.random() * 250 - 125;
        tree.position.y = 0;
        tree.position.z = Math.random() * 250 - 125;
        tree.updateMatrix();
        mesh.setMatrixAt(i, tree.matrix);
    }
    scene.add(mesh);
    
    //Toxic chunk
    const boxGeometry = new THREE.BoxGeometry(50, 50, 50);
    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x402555 });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    boxMesh.position.set(0, 0, 0);
    scene.add(boxMesh);

    // Ground
    const earth = new THREE.PlaneGeometry(2000, 2000);
    const ground = new THREE.MeshPhongMaterial({ color: 0x402555, flatShading: true });
    const mesh2 = new THREE.InstancedMesh(earth, ground, 500);
    mesh2.translateY(-35);
    mesh2.rotateX(-1.5708);
    scene.add(mesh2);

    // lights
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 3);
    dirLight1.position.set(1, 1, 1);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 2);
    dirLight2.position.set(-1, -1, -1);
    scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0x555555);
    scene.add(ambientLight);
}

// Function to update moving objects, in this case the camera.
// The render function is trigger at the end to update the canvas.
function animate() {
    controls.update();
    render();
}

// Function to render the scene using the camera.
function render() {
    renderer.render(scene, camera);
}
