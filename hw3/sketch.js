let endIt;

function setup(){
    let canvas = createCanvas(400, 400, WEBGL);
    angleMode(DEGREES);
    turkeyBaster();
}

function draw(){
background(0);
    orbitControl();
     noStroke();
    lights();
    model(endIt);
}

function turkeyBaster(){
    beginGeometry();
    for (let i = 0; i < 2; i++) {
        specularMaterial(random(255), random(255), random(255));
        shininess(80);
        let r = random(255);
        let g = random(255);
        let b = random(255);
        fill(r, g, b);
        let x = random(-100, 100);
        let y = random(-100, 100);
        let z = random(-100, 100);
        let size = random(8, 18);
        let squeeze = size* 1.0;
        let handleR = size*0.45;
        let handleH = size*1.6;
        let tubeR = size * 0.22;
        let tubeH = size * 4.5;
        let ringR = tubeR + size * 0.07;
        let ringH = size * 0.15;
        let tipR = tubeR * 0.6;
        let tipH = size * 1.1;

        push();
         translate(x, y, z);
        sphere(squeeze);
        translate(0,squeeze+handleH*0.5,0);
        cylinder(handleR,handleH);
        translate(0,handleH*0.5+tubeH*0.5,0);
        cylinder(tubeR,tubeH);
        translate(0, -tubeH * 0.25, 0);
        cylinder(ringR, ringH);
        translate(0, 0, 0);
        cylinder(ringR, ringH);
        translate(0, tubeH * 0.25, 0);
        cylinder(ringR, ringH);
        translate(0, tubeH * 0.5 + tipH * 0.5, 0);
        cylinder(tipR, tipH);
        pop();
    }
    endIt = endGeometry();
}