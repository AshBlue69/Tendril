let tendrils = [];
let knobsL2 = [];
let knobNamesL2 = ["Speed", "Sway", "Trail", "Noise", "Girth"];
let colors;
let attractionZones = [];
let fsButton;

// timing for adding black tendrils
let lastBlackTendrilTime = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';

  // initial soothing tendrils
  for (let i = 0; i < 50; i++) tendrils.push(new Tendril(random(width), random(height)));

  // knobs on right
  let startY = height / 2 - 150;
  for (let i = 0; i < knobNamesL2.length; i++) {
    let y = startY + i * 120;
    knobsL2.push(new Knob(width - 70, y, 35, knobNamesL2[i]));
  }

  // soothing color palette
  colors = [
    color(200, 20, 90, 50),
    color(250, 15, 95, 50),
    color(300, 15, 90, 50),
    color(160, 15, 90, 50),
    color(210, 10, 95, 50),
    color(30, 20, 95, 50)
  ];

  // moving cluster zones
  for (let i = 0; i < 6; i++) attractionZones.push(new MovingZone(random(width*0.2,width*0.8), random(height*0.2,height*0.8)));

  // fullscreen button (black square with slits)
  fsButton = createButton("");
  fsButton.position(width - 60, height - 60);
  fsButton.size(40, 40);
  fsButton.style("background-color", "transparent");
  fsButton.style("border", "none");
  fsButton.style("cursor", "pointer");
  fsButton.mousePressed(() => fullscreen(!fullscreen()));
}

function draw() {
  fill(60, 10, 95, 0.5);
  rect(0, 0, width, height);

  fill(0); textSize(32); textFont('Arial Narrow'); textAlign(LEFT, TOP);
  text("TENDRIL 1.0", 20, 20);
  textAlign(RIGHT, TOP); text("TANHA", width-20, 20);

  for (let k of knobsL2) { k.update(); k.show(); }
  for (let zone of attractionZones) zone.update();

  for (let t of tendrils) { 
    t.update(); 
    t.show(); 
    t.microInteract(); 
    t.attract(); 
  }

  // spawn 10% more black tendrils every 30 seconds
  if (millis() - lastBlackTendrilTime > 30000) {
    lastBlackTendrilTime = millis();
    for (let i = 0; i < floor(tendrils.length * 0.1); i++) {
      let t = new Tendril(random(width), random(height), color(0,0,0,70));
      t.vel.mult(0.5); // fade in effect
      tendrils.push(t);
    }
  }
}

// --- Tendril ---
class Tendril {
  constructor(x, y, c=null) {
    this.pos = createVector(x, y);
    this.prev = this.pos.copy();
    this.vel = p5.Vector.random2D().mult(random(1,2));
    this.color = c || random(colors);
    this.widthBase = random(1,2.5);
    this.noiseOffset = random(1000);
  }

  update() {
    let speedMod = getKnobValue("Speed")/50;
    let swayMod = getKnobValue("Sway")/50;
    let noiseAmt = getKnobValue("Noise")/50;

    let nX = (noise(this.pos.x*0.005, this.pos.y*0.005, frameCount*0.002 + this.noiseOffset)-0.5) * 2 * noiseAmt;
    let nY = (noise(this.pos.y*0.005, this.pos.x*0.005, frameCount*0.002 + this.noiseOffset+500)-0.5) * 2 * noiseAmt;
    this.vel.add(createVector(nX, nY));
    this.vel.limit(1.5 * speedMod);

    this.prev = this.pos.copy();
    this.pos.add(this.vel);

    if (this.pos.x < 0) this.pos.x += width;
    if (this.pos.x > width) this.pos.x -= width;
    if (this.pos.y < 0) this.pos.y += height;
    if (this.pos.y > height) this.pos.y -= height;
  }

  show() {
    stroke(this.color);
    strokeWeight(getKnobValue("Girth")/10 + 1);
    let d = p5.Vector.dist(this.prev, this.pos);
    if (d < 30) line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }

  microInteract() {
    if (random(1) < 0.005 && tendrils.length < 200) {
      let newT = new Tendril(this.pos.x, this.pos.y);
      newT.vel = this.vel.copy().mult(random(0.9,1.1));
      newT.color = this.color;
      tendrils.push(newT);
    }
  }

  attract() {
    for (let zone of attractionZones) {
      let dir = p5.Vector.sub(zone.pos, this.pos);
      let d = dir.mag();
      if (d < 200) {
        dir.setMag(0.05);
        this.vel.add(dir);
      }
    }
  }
}

// --- Moving Cluster Zone ---
class MovingZone {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.baseAngle = random(TWO_PI);
    this.radius = random(20, 80);
    this.speed = random(0.3, 0.7);
    this.oscOffset = random(1000);
    this.sizeOsc = random(50,80);
    this.waveOffset = random(1000);
  }

  update() {
    let t = frameCount*0.01;
    // slow wavy ocean-like movement
    this.pos.x += cos(this.baseAngle + t*0.5 + sin(t*0.2 + this.waveOffset)*0.5) * this.speed;
    this.pos.y += sin(this.baseAngle + t*0.5 + cos(t*0.2 + this.waveOffset)*0.5) * this.speed;

    for (let other of attractionZones) {
      if (other === this) continue;
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d < 80) {
        let repel = p5.Vector.sub(this.pos, other.pos).setMag(0.05);
        this.pos.add(repel);
      }
    }

    this.sizeOsc += sin(t*0.5 + this.oscOffset)*0.1;
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);
  }
}

// --- Mechanical Knob ---
class Knob {
  constructor(x, y, r, label) {
    this.x = x; this.y = y; this.r = r; this.label = label;
    this.value = 50; this.dragging = false;
  }
  update() { if (this.dragging) { let dy = pmouseY - mouseY; this.value = constrain(this.value - dy,0,100); } }
  show() {
    push();
    fill(200,20); ellipse(this.x,this.y,this.r*2); // knob base
    stroke(0); strokeWeight(6);
    let angle = map(this.value,0,100,-PI/2,PI*1.5);
    noFill(); arc(this.x,this.y,this.r*2.4,this.r*2.4,-PI/2,angle); // value circle
    line(this.x,this.y,this.x + cos(angle)*this.r, this.y + sin(angle)*this.r);
    noStroke(); fill(0); textAlign(CENTER); textSize(22); textFont('Arial Narrow');
    text(this.label,this.x,this.y+this.r+20); text(nf(this.value,1,0),this.x,this.y);
    pop();
  }
  pressed(){if(dist(mouseX,mouseY,this.x,this.y)<this.r)this.dragging=true;}
  released(){this.dragging=false;}
}

function mousePressed() {
  for(let k of knobsL2) k.pressed();
  tendrils.push(new Tendril(mouseX, mouseY));
}

function mouseReleased(){for(let k of knobsL2) k.released();}

function keyPressed() {
  if (key === ' ') {
    for(let i = 0; i < 3; i++) tendrils.push(new Tendril(random(width), random(height)));
  }
  if (key === 'F' || key === 'f') {
    fullscreen(!fullscreen());
  }
}

function getKnobValue(label){for(let k of knobsL2)if(k.label===label)return k.value; return 1;}
function windowResized(){
  resizeCanvas(windowWidth,windowHeight);
  if (fsButton) fsButton.position(windowWidth - 60, windowHeight - 60);
}
