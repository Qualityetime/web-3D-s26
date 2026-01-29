function setup() {
    let canvas = createCanvas(400,400, WEBGL);
    angleMode(DEGREES);
    
}

function draw(){
    background('tan');
    orbitControl();
    fill('blue');
    box(100);
    translate(0,0,100);
    fill('green');
    box(50);
    translate(0,0,50);
    rotateY(45);
    rotateX(45);
    fill('red');
    box(25);
    translate(100,0,0);
    scale(0.5);
    fill('black');
    box(25);
}