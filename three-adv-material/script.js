// Advanced Material Example Three.js Example
// Chelsea Thompto - Spring 2026

// Three.js uses an import map to add features.
// The "import * as THREE from 'three';" will be
// in all sketches. Add-ons will be added after.

// The main library script
import * as THREE from "three";

// The plug-ins
import { PointerLockControls } from "../src/PointerLockControls.js";
import { Font } from "../src/FontLoader.js";
import { TTFLoader } from "../src/TTFLoader.js";
import { TextGeometry } from "../src/TextGeometry.js";
import { GLTFLoader } from "../src/GLTFLoader.js";

// Declaring global variables.
let camera, canvas, controls, scene, renderer;

// Variables for First Person Controls
let raycaster;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Variables for scene objects
let font;
let text = "Advanced Material Demo";
let textGeo;
let materials;
let mesh;
let textMesh1;
let textMesh2;
let group;
let video;
let vidTexture;

// Geometeries

const spatialObject = new THREE.TorusKnotGeometry(5, 1.5, 100, 16);
const flatObject = new THREE.BoxGeometry(10, 20, 1);

// variables for moving parts
var knotBubble;
var knotWire;
var knotToon;
var knotBlue;
var knotMirror;

// Run the "init" function which is like "setup" in p5.
init();

// Define initial scene
function init() {
    // scene setup
    canvas = document.getElementById("3-holder");
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setAnimationLoop(animate);
    canvas.appendChild(renderer.domElement);

    // Setup camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 10, 0);

    // Setup First Person Controls
    // DO NOT TOUCH

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

    // End First Person Controls

    // environment map for reflections and refractions

    const cubeloader = new THREE.CubeTextureLoader().setPath("../assets/SwedishRoyalCastle/");
    const cubeTexture = cubeloader.load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);
    const reflectCube = cubeloader.load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);
    const refractCube = cubeloader.load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);
    refractCube.mapping = THREE.CubeRefractionMapping;
    reflectCube.mapping = THREE.CubeReflectionMapping;
    scene.background = cubeTexture;

    // Sample Materials

    const mirrorMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        emissive: 0x000000,
        roughness: 0,
        metalness: 1,
        transmission: 0,
        envMap: reflectCube
    });

    const bubbleMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        emissive: 0x000000,
        roughness: 0,
        metalness: 0,
        transmission: 1,
        ior: 1.25,
        thickness: 2,
        envMap: refractCube
    });

    const blueMat = new THREE.MeshPhysicalMaterial({
        color: 0x057182,
        emissive: 0x000000,
        roughness: 0.5,
        metalness: 0
    });

    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x7a02fd,
        wireframe: true
    });

    // maps for cell shading
    
    const textureLoader = new THREE.TextureLoader();
    const threeTone = textureLoader.load("../assets/gradientMaps/threeTone.jpg");
    threeTone.minFilter = THREE.NearestFilter;
    threeTone.magFilter = THREE.NearestFilter;
    const fiveTone = textureLoader.load("../assets/gradientMaps/fiveTone.jpg");
    fiveTone.minFilter = THREE.NearestFilter;
    fiveTone.magFilter = THREE.NearestFilter;

    const toonMat = new THREE.MeshToonMaterial({
        color: 0xe2049a,
        gradientMap: threeTone
    });

    // Center Standard Objects
    const flatBlue = new THREE.Mesh(flatObject, blueMat);
    flatBlue.position.set(0, 20, -50);
    scene.add(flatBlue);

    knotBlue = new THREE.Mesh(spatialObject, blueMat);
    knotBlue.position.set(0, -10, -50);
    scene.add(knotBlue);

    // Load GLTF model, add material, and add it to the scene
    const loader2 = new GLTFLoader().load(
        "../assets/phone.glb",
        function (gltf) {
            // Scan loaded model for mesh and apply defined material if mesh is present
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    //child.material = newMat;
                }
            });
            // set position and scale
            mesh = gltf.scene;
            mesh.position.set(0, 0, -50);
            mesh.scale.set(0.5, 0.5, 0.5);
            // Add model to scene
            scene.add(mesh);
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );

    // mirror objects
    const flatMirror = new THREE.Mesh(flatObject, mirrorMat);
    flatMirror.position.set(-30, 20, -50);
    scene.add(flatMirror);

    knotMirror = new THREE.Mesh(spatialObject, mirrorMat);
    knotMirror.position.set(-30, -10, -50);
    scene.add(knotMirror);

    const loader3 = new GLTFLoader().load(
        "../assets/phone.glb",
        function (gltf) {
            // Scan loaded model for mesh and apply defined material if mesh is present
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material = mirrorMat;
                }
            });
            // set position and scale
            mesh = gltf.scene;
            mesh.position.set(-30, 0, -50);
            mesh.scale.set(0.5, 0.5, 0.5);
            // Add model to scene
            scene.add(mesh);
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );

    // bubble objects

    const flatBubble = new THREE.Mesh(flatObject, bubbleMat);
    flatBubble.position.set(30, 20, -50);
    scene.add(flatBubble);

    knotBubble = new THREE.Mesh(spatialObject, bubbleMat);
    knotBubble.position.set(30, -10, -50);
    scene.add(knotBubble);

    const loader4 = new GLTFLoader().load(
        "../assets/phone.glb",
        function (gltf) {
            // Scan loaded model for mesh and apply defined material if mesh is present
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material = bubbleMat;
                }
            });
            // set position and scale
            mesh = gltf.scene;
            mesh.position.set(30, 0, -50);
            mesh.scale.set(0.5, 0.5, 0.5);
            // Add model to scene
            scene.add(mesh);
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );

    // wire objects

    const flatWire = new THREE.Mesh(flatObject, wireMat);
    flatWire.position.set(60, 20, -50);
    scene.add(flatWire);

    knotWire = new THREE.Mesh(spatialObject, wireMat);
    knotWire.position.set(60, -10, -50);
    scene.add(knotWire);

    const loader5 = new GLTFLoader().load(
        "../assets/phone.glb",
        function (gltf) {
            // Scan loaded model for mesh and apply defined material if mesh is present
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material = wireMat;
                }
            });
            // set position and scale
            mesh = gltf.scene;
            mesh.position.set(60, 0, -50);
            mesh.scale.set(0.5, 0.5, 0.5);
            // Add model to scene
            scene.add(mesh);
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );

    // toon 0bjects
    const flatToon = new THREE.Mesh(flatObject, toonMat);
    flatToon.position.set(-60, 20, -50);
    scene.add(flatToon);

    knotToon = new THREE.Mesh(spatialObject, toonMat);
    knotToon.position.set(-60, -10, -50);
    scene.add(knotToon);

    const loader6 = new GLTFLoader().load(
        "../assets/phone.glb",
        function (gltf) {
            // Scan loaded model for mesh and apply defined material if mesh is present
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material = toonMat;
                }
            });
            // set position and scale
            mesh = gltf.scene;
            mesh.position.set(-60, 0, -50);
            mesh.scale.set(0.5, 0.5, 0.5);
            // Add model to scene
            scene.add(mesh);
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );

    // text

    // materials for the text
    materials = [
        new THREE.MeshPhongMaterial({ color: 0x10b10c, flatShading: true }), // front
        new THREE.MeshPhongMaterial({ color: 0x0c9909 }) // side
    ];

    // establish font loader
    const loader = new TTFLoader();

    // use loader with desired ttf font
    loader.load("../assets/CourierPrime-Bold.ttf", function (json) {
        font = new Font(json);
        // see create text function below
        createText();
    });

    // add resulting shapes to scene
    group = new THREE.Group();
    group.position.y = 100;

    scene.add(group);

    // lights
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 3);
    dirLight1.position.set(1, 1, 1);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 2);
    dirLight2.position.set(-1, -1, -1);
    scene.add(dirLight2);

    const light = new THREE.AmbientLight(0xffffff); // soft white light
    scene.add(light);
}

// Function to update moving objects, in this case the camera.
// The render function is trigger at the end to update the canvas.
function animate() {
    // Start First Person Control Animations
    const time = performance.now();
    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // jump fix
        controls.object.position.y += velocity.y * delta;
        if (controls.object.position.y < 10) {
            velocity.y = 0;
            controls.object.position.y = 10;

            canJump = true;
        }
    }

    prevTime = time;
    // End First Person Control Animations

    // animate know geometry
    knotMove();
    
    render();
}

function knotMove() {
    knotToon.rotation.x += 0.005;
    knotToon.rotation.y += 0.005;
    knotMirror.rotation.x -= 0.005;
    knotMirror.rotation.y -= 0.005;
    knotBlue.rotation.x += 0.005;
    knotBlue.rotation.y += 0.005;
    knotBubble.rotation.x -= 0.005;
    knotBubble.rotation.y -= 0.005;
    knotWire.rotation.x += 0.005;
    knotWire.rotation.y += 0.005;
}

// Function to render the scene using the camera.
function render() {
    renderer.render(scene, camera);
}

// Function to generate text shapes
function createText() {
    // create geomtery with parameters, change parameters to test modifications
    // "text" on next line is the message to be written
    textGeo = new TextGeometry(text, {
        font: font,
        size: 20,
        depth: 2,
        curveSegments: 4,
        bevelThickness: 2,
        bevelSize: 1.5,
        bevelEnabled: true
    });

    // finish making geometry
    textGeo.computeBoundingBox();
    const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

    // apply material to geometry
    textMesh1 = new THREE.Mesh(textGeo, materials);

    // set position and rotation
    textMesh1.position.x = centerOffset;
    textMesh1.position.z = -150;
    textMesh1.position.y = -75;
    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;

    // add to group to be added to scene
    group.add(textMesh1);
}
