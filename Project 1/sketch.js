function setup(){
    let canvas = createCanvas(400, 400, WEBGL);
    angleMode(DEGREES);
}

function draw(){
background(200);
    orbitControl();
     noStroke();
    lights();
    wristPic();
}

function wristPic() {
    translate(-10, 140);
  box(100, 20, 200);
    push();
    rotate(45);
    translate(-90, 35);
    box(100, 20, 200);
    pop();
    push();
     rotate(-45);
    translate(90, 35);
     box(100, 20, 200);
    pop();
    push();
    rotate(90);
    translate(-130, -125);
     box(100, 20, 200);
    pop();
    push();
    rotate(90);
    translate(-130, 125);
     box(100, 20, 200);
    pop();
    push();
    rotate(-45);
    translate(90, -215);
     box(100, 20, 200);
    pop();
    push();
    rotate(45);
    translate(-90, -215);
     box(100, 20, 200);
    pop();
    push();
    translate(0,-250);
      box(100, 20, 200);
    pop();
    push();
    rotateX(90);
    translate(0, 90 - 10, 260);
    cylinder(20, 40);
    pop();
    push();
    fill('black');
    translate(0,-260, -15);
      box(80, 10, 140);
    pop();
    push();
    fill('blue');
    translate(0,-260.1, -15);
      box(70, 10, 120);
    pop();
    
    
}