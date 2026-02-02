function setup() {
    let canvas = createCanvas(400,400, WEBGL);
    angleMode(DEGREES);
    
}

function draw(){
    background('#C8EFEE');
    orbitControl();
    //Bottom Circle
    fill('white');
    noStroke();
    sphere(70);
    translate(0,-70,0);
    //Middle Circle
    fill('white');
    sphere(50);
    //Top Circle
    fill('white');
     translate(0,-60,0);
    //Left Eye
    sphere(35);
     translate(0,-10,0);
    scale(0.5);
    fill('black');
     translate(-20,-5,60);
    sphere(10);
    //Right Eye
    translate(0,-10,0);
    fill('black');
     translate(40,10,-1);
    sphere(10);
    //Nose
    translate(0,-60,0);
    fill('orange');
    translate(-20,75,20);
    rotateX(90);
    cone(15, 65); 
}