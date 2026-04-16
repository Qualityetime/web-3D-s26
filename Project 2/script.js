import * as THREE from "three";

// The plug-ins
import { PointerLockControls } from "../src/PointerLockControls.js";
import { Font } from "../src/FontLoader.js";
import { TTFLoader } from "../src/TTFLoader.js";
import { TextGeometry } from "../src/TextGeometry.js";

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

// Variables for Room
let font;
let text = "Cabinet of Curiosities";
let textGeo;
let materials;
let textMesh1;
let group;

// Run the "init" function
init();

function init() {
    // scene setup
    canvas = document.getElementById("3-holder");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1b18);
    scene.fog = new THREE.FogExp2(0x1e1b18, 0.003);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setAnimationLoop(animate);
    canvas.appendChild(renderer.domElement);

    // camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 10, 0);

    // controls
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

    // materials
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
    const trimMat = new THREE.MeshPhongMaterial({ color: 0x24170f });
    const ceilingMat = new THREE.MeshPhongMaterial({ color: 0x3a2618 });
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x5a3c28 });
    const displayMat = new THREE.MeshPhongMaterial({
        color: 0xcbb89d,
        side: THREE.DoubleSide
    });

    //walls
    const shortWall = new THREE.BoxGeometry(300, 200, 10);
    const longWall = new THREE.BoxGeometry(10, 200, 510);

    const backWall = new THREE.Mesh(shortWall, wallMat);
    backWall.position.set(0, 0, -250);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(longWall, wallMat);
    leftWall.position.set(-150, 0, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(longWall, wallMat);
    rightWall.position.set(150, 0, 0);
    scene.add(rightWall);

    const frontSide = new THREE.BoxGeometry(100, 125, 10);
    const frontLeft = new THREE.Mesh(frontSide, wallMat);
    frontLeft.position.set(-100, -20, 250);
    scene.add(frontLeft);

    const frontRight = new THREE.Mesh(frontSide, wallMat);
    frontRight.position.set(100, -20, 250);
    scene.add(frontRight);

    const frontTop = new THREE.BoxGeometry(300, 57.5, 10);
    const frontMiddle = new THREE.Mesh(frontTop, wallMat);
    frontMiddle.position.set(0, 70, 250);
    scene.add(frontMiddle);

    //ceiling
    const ceilingShape = new THREE.BoxGeometry(350, 10, 550);
    const ceilingMain = new THREE.Mesh(ceilingShape, ceilingMat);
    ceilingMain.position.set(0, 100, 0);
    scene.add(ceilingMain);

    //floor
    const floorGeo = new THREE.BoxGeometry(350, 10, 550);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -85, 0);
    scene.add(floor);

    // support beams
    const beamGeo = new THREE.BoxGeometry(12, 200, 12);

    const beam1 = new THREE.Mesh(beamGeo, trimMat);
    beam1.position.set(-110, 0, -180);
    scene.add(beam1);

    const beam2 = new THREE.Mesh(beamGeo, trimMat);
    beam2.position.set(110, 0, -180);
    scene.add(beam2);

    const beam3 = new THREE.Mesh(beamGeo, trimMat);
    beam3.position.set(-110, 0, 0);
    scene.add(beam3);

    const beam4 = new THREE.Mesh(beamGeo, trimMat);
    beam4.position.set(110, 0, 0);
    scene.add(beam4);

    const beam5 = new THREE.Mesh(beamGeo, trimMat);
    beam5.position.set(-110, 0, 180);
    scene.add(beam5);

    const beam6 = new THREE.Mesh(beamGeo, trimMat);
    beam6.position.set(110, 0, 180);
    scene.add(beam6);

    // top cross beams
    const crossGeo = new THREE.BoxGeometry(240, 10, 12);

    const cross1 = new THREE.Mesh(crossGeo, trimMat);
    cross1.position.set(0, 70, -180);
    scene.add(cross1);

    const cross2 = new THREE.Mesh(crossGeo, trimMat);
    cross2.position.set(0, 70, 0);
    scene.add(cross2);

    const cross3 = new THREE.Mesh(crossGeo, trimMat);
    cross3.position.set(0, 70, 180);
    scene.add(cross3);

    // archways
    // left side arch
    const leftArchTopGeo = new THREE.BoxGeometry(10, 25, 80);
    const leftArchTop = new THREE.Mesh(leftArchTopGeo, trimMat);
    leftArchTop.position.set(-145, 30, -100);
    scene.add(leftArchTop);

    const leftArchSideGeo = new THREE.BoxGeometry(10, 110, 12);

    const leftArchSide1 = new THREE.Mesh(leftArchSideGeo, trimMat);
    leftArchSide1.position.set(-145, -28, -135);
    scene.add(leftArchSide1);

    const leftArchSide2 = new THREE.Mesh(leftArchSideGeo, trimMat);
    leftArchSide2.position.set(-145, -28, -65);
    scene.add(leftArchSide2);

    // Posters
    // back wall big display
    const displayGeo1 = new THREE.PlaneGeometry(90, 120);
    const display1 = new THREE.Mesh(displayGeo1, displayMat);
    display1.position.set(0, 5, -244.5);
    scene.add(display1);

    const godzillaTexture = new THREE.TextureLoader().load("./assets/godzilla.png");
    const godzillaMat = new THREE.MeshBasicMaterial({
        map: godzillaTexture,
        transparent: true,
        side: THREE.DoubleSide
    });

    const godzillaPoster = new THREE.Mesh(displayGeo1, godzillaMat);
    godzillaPoster.position.set(0, 5, -244.0);
    scene.add(godzillaPoster);

    // back wall side displays
    const displayGeo2 = new THREE.PlaneGeometry(45, 60);

    const pulpTexture = new THREE.TextureLoader().load("./assets/pulpfiction.png");
    const pulpMat = new THREE.MeshBasicMaterial({
        map: pulpTexture,
        transparent: true,
        side: THREE.DoubleSide
    });

    const pulpPoster = new THREE.Mesh(displayGeo2, pulpMat);
    pulpPoster.position.set(-100, 0, 244.0);
    pulpPoster.rotation.y = Math.PI;
    scene.add(pulpPoster);

    const display2 = new THREE.Mesh(displayGeo2, displayMat);
    display2.position.set(-95, 10, -244.5);
    scene.add(display2);

    const oldPosterTexture = new THREE.TextureLoader().load("./assets/old poster.jpg");
    const oldPosterMat = new THREE.MeshBasicMaterial({
        map: oldPosterTexture,
        transparent: true,
        side: THREE.DoubleSide
    });

    const oldPoster = new THREE.Mesh(displayGeo2, oldPosterMat);
    oldPoster.position.set(-95, 10, -244.0);
    scene.add(oldPoster);

    const display3 = new THREE.Mesh(displayGeo2, displayMat);
    display3.position.set(95, 10, -244.5);
    scene.add(display3);

    const conanTexture = new THREE.TextureLoader().load("./assets/conan.png");
    const conanMat = new THREE.MeshBasicMaterial({
        map: conanTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const conanPoster = new THREE.Mesh(displayGeo2, conanMat);
    conanPoster.position.set(95, 10, -244.0);
    scene.add(conanPoster);

    // left wall displays
    const sideDisplayGeo = new THREE.PlaneGeometry(50, 70);

    const hemanTexture = new THREE.TextureLoader().load("./assets/heman.png");
    const hemanMat = new THREE.MeshBasicMaterial({
        map: hemanTexture,
        transparent: true,
        side: THREE.DoubleSide
    });

    const hemanPoster = new THREE.Mesh(sideDisplayGeo, hemanMat);
    hemanPoster.position.set(-144.0, 5, -10);
    hemanPoster.rotation.y = Math.PI / 2;
    scene.add(hemanPoster);

    const display4 = new THREE.Mesh(sideDisplayGeo, displayMat);
    display4.position.set(-144.5, 5, -10);
    display4.rotation.y = Math.PI / 2;
    scene.add(display4);

    const display5 = new THREE.Mesh(sideDisplayGeo, displayMat);
    display5.position.set(-144.5, 5, 110);
    display5.rotation.y = Math.PI / 2;
    scene.add(display5);

    const pressureTexture = new THREE.TextureLoader().load("./assets/pressure.png");
    const pressureMat = new THREE.MeshBasicMaterial({
        map: pressureTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const pressurePoster = new THREE.Mesh(sideDisplayGeo, pressureMat);
    pressurePoster.position.set(-144.0, 5, 110);
    pressurePoster.rotation.y = Math.PI / 2;
    scene.add(pressurePoster);

    // right wall displays
    const display6 = new THREE.Mesh(sideDisplayGeo, displayMat);
    display6.position.set(144.5, 5, -110);
    display6.rotation.y = -Math.PI / 2;
    scene.add(display6);

    const monstermaskTexture = new THREE.TextureLoader().load("./assets/monstermask.png");
    const monstermaskMat = new THREE.MeshBasicMaterial({
        map: monstermaskTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const monstermaskPoster = new THREE.Mesh(sideDisplayGeo, monstermaskMat);
    monstermaskPoster.position.set(144.0, 5, -110);
    monstermaskPoster.rotation.y = -Math.PI / 2;
    scene.add(monstermaskPoster);

    const display7 = new THREE.Mesh(sideDisplayGeo, displayMat);
    display7.position.set(144.5, 5, 10);
    display7.rotation.y = -Math.PI / 2;
    scene.add(display7);

    const img1Texture = new THREE.TextureLoader().load("./assets/img1.png");
    const img1Mat = new THREE.MeshBasicMaterial({
        map: img1Texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const img1Poster = new THREE.Mesh(sideDisplayGeo, img1Mat);
    img1Poster.position.set(144.0, 5, 10);
    img1Poster.rotation.y = -Math.PI / 2;
    scene.add(img1Poster);

    const display8 = new THREE.Mesh(displayGeo2, displayMat);
    display8.position.set(-100, 0, 244.5);
    display8.rotation.y = Math.PI;
    scene.add(display8);

    const display9 = new THREE.Mesh(displayGeo2, displayMat);
    display9.position.set(100, 0, 244.5);
    display9.rotation.y = Math.PI;
    scene.add(display9);

    const ticketStubTexture = new THREE.TextureLoader().load("./assets/ticketStub.jpg");
    const ticketStubMat = new THREE.MeshBasicMaterial({
        map: ticketStubTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const ticketStubPoster = new THREE.Mesh(displayGeo2, ticketStubMat);
    ticketStubPoster.position.set(100, 0, 244.0);
    ticketStubPoster.rotation.y = Math.PI;
    scene.add(ticketStubPoster);

    const display10 = new THREE.Mesh(sideDisplayGeo, displayMat);
    display10.position.set(144.5, 5, 90);
    display10.rotation.y = -Math.PI / 2;
    scene.add(display10);

    const lagoonTexture = new THREE.TextureLoader().load("./assets/lagoon.png");
    const lagoonMat = new THREE.MeshBasicMaterial({
        map: lagoonTexture,
        transparent: true,
        side: THREE.DoubleSide
    });

    const lagoonPoster = new THREE.Mesh(sideDisplayGeo, lagoonMat);
    lagoonPoster.position.set(144.0, 5, 90);
    lagoonPoster.rotation.y = -Math.PI / 2;
    scene.add(lagoonPoster);

    // lighting
    const dirLight1 = new THREE.DirectionalLight(0xffe6b8, 2.2);
    dirLight1.position.set(1, 2, 1);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8a6a4a, 1.2);
    dirLight2.position.set(-1, 1, -1);
    scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0x3a2d22, 1.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffcc88, 20, 250);
    pointLight1.position.set(0, 55, -120);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffcc88, 15, 220);
    pointLight2.position.set(0, 55, 120);
    scene.add(pointLight2);
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

        if (moveForward || moveBackward) velocity.z -= direction.z * 1000.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 1000.0 * delta;

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

function createText() {
    textGeo = new TextGeometry(text, {
        font: font,
        size: 14,
        depth: 6,
        curveSegments: 4,
        bevelThickness: 1,
        bevelSize: 0.8,
        bevelEnabled: true
    });

    textGeo.computeBoundingBox();
    const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

    textMesh1 = new THREE.Mesh(textGeo, materials);
    textMesh1.position.x = centerOffset;
    textMesh1.position.z = -170;
    textMesh1.position.y = -95;
    textMesh1.rotation.y = 0;

    group.add(textMesh1);
}
