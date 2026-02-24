function setup(){
    let canvas = createCanvas(400, 400, WEBGL);
    angleMode(DEGREES);
    let button = createButton("Customize Color");
    button.parent("button-holder");
    button.mousePressed(customizeColor);
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
    push();
    fill(100, 100, 100, 100);
    translate(0,-260, 95);
    sphere(15);
    pop();
    push();
    translate(0,-260, 99);
    fill('black');
    sphere(13);
    pop();
     push();
    translate(0,-260, 100.5);
    fill(100, 100, 100, 100);
    sphere(12);
    pop();
     push();
    translate(0,-260, 105);
    fill('gray');
    sphere(8);
    pop();
}

function customizeColor() {
fill(color(random(40, 255), random(40, 255), random(40, 255)));   
}