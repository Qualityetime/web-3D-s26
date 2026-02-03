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
        let r = random(255);
        let g = random(255);
        let b = random(255);
        fill(r, g, b);
        let x = random(-100, 100);
        let y = random(-100, 100);
        let z = random(-100, 100);
        let size = random(5, 20);
        push();
         translate(x, y, z);
       cylinder(size*0.5);
        translate(0,size,0);
        cylinder(size*0.75);
        translate(0,-size*0.75,0);
        sphere(size*0.5);
        pop();
    
    }
    endIt = endGeometry();
}