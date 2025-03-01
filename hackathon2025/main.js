const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Update canvas dimensions to viewport dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Add listener to update canvas size on window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const logoImgRef = document.getElementById("logo");
const customerImgRef = document.getElementById("coin");

const renderRate = 20;

var input = []; // the index corresponds to the keycode
var handleInput = (event) => { input[event.keyCode] = event.type == 'keydown'; }
document.addEventListener('keydown', handleInput);
document.addEventListener('keyup', handleInput);

var mousePos = { x: 0, y: 0 }
document.addEventListener('mousemove', (event) => 
{
    mousePos.x = event.x;
    mousePos.y = event.y;
});

//const rect = new Rect(0,0,100,100,"yellow");
const logo = new Image(logoImgRef,50,50,50,50,0)

const mapWalls = [
    new Rect(0,0,canvas.width,10,"red"),
    new Rect(0,0,10,canvas.height,"red"),
    new Rect(0,canvas.height-10,canvas.width,10,"red"),
    new Rect(canvas.width-10,0,10,canvas.height,"red")
];

const collisionBuffer = 5;
const playerSpeed = 5;

const customers = [];
var nextSpawnTime = Math.floor(Math.random() * 20) + 5;
var timer = 0;

function render(){
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let leftBlocked = false;
    let rightBlocked = false;
    let upBlocked = false;
    let downBlocked = false;

    for (const wall of mapWalls) {
        const collisionData = getCollision(logo, wall, collisionBuffer);
        if (collisionData[0]) {
            upBlocked = true;
        }
        if (collisionData[1]) {
            downBlocked = true;
        }
        if (collisionData[2]) {
            leftBlocked = true;
        }
        if (collisionData[3]) {
            rightBlocked = true;
        }
    }
    
    if(input[87] && !upBlocked){ // w
        logo.angle = 0;
        logo.y -= playerSpeed;
    }
    if(input[65] && !leftBlocked){ // a
        logo.angle = Math.PI/2;
        logo.x -= playerSpeed;
    }
    if(input[83]  && !downBlocked){ // s
        logo.angle = Math.PI;
        logo.y += playerSpeed;
    }
    if(input[68]  && !rightBlocked){ // d
        logo.angle = 3*Math.PI/2;
        logo.x += playerSpeed;
    }
    
    // Add space bar check (key code 32)
    if(input[32] && dialogBox.isActive){
        //logo.x++;
        dialogBox.advance();
        input[32] = false; // Reset to prevent multiple advances
    }

    if(customers.length < 10 && (timer * renderRate) === nextSpawnTime * 1000){
        const newCustomer = new Customer(customerImgRef, 200, 500, 50, 50);
        newCustomer.img.vY = -1;
        customers.push(newCustomer);
        timer = 0;
        nextSpawnTime = Math.floor(Math.random() * 20) + 5;
    }

    logo.update();
    dialogBox.update();
    for (const wall of mapWalls) {
        wall.update();
    }

    for (const customer of customers) {
        customer.update();
    }

    timer++;
}
var updateLoop = window.setInterval(render, renderRate);

function Rect(x, y, w, h, color){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;

    this.vX = 0; // Velocity
    this.vY = 0;

    this.update = function(){
        this.x += this.vX;
        this.y += this.vY;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

function Image(ref, x, y, w, h, angle){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.angle = angle;
    this.ref = ref;

    this.vX = 0; // Velocity
    this.vY = 0;

    this.update = function update(){
        this.x += this.vX;
        this.y += this.vY;
        
        ctx.translate(this.x + this.w/2, this.y + this.h/2);

        ctx.rotate(this.angle);

        ctx.drawImage(this.ref, -this.w/2, -this.h/2, this.w, this.h);

        ctx.rotate(-this.angle);

        ctx.translate(-(this.x + this.w/2), -(this.y + this.h/2));
    }

    this.copy = function() { return new Image(ref, x, y, w, h, angle) }
}

function Customer(ref, x, y, w, h){
    this.img = new Image(ref, x, y, w, h, 0);
    this.hasOrdered = false;
    this.hasEaten = false;

    this.update = function update(){
        this.img.update();
    }
}

function DialogBox() {
    this.isActive = false;
    this.text = "";
    this.fullText = "";
    this.charIndex = 0;
    this.queue = [];
    this.typeSpeed = 2; // characters per frame
    this.margin = 20;
    
    this.showDialog = function(text) {
        if (this.isActive) {
            this.queue.push(text);
            return;
        }
        this.isActive = true;
        this.fullText = text;
        this.text = "";
        this.charIndex = 0;
    }

    this.update = function() {
        if (!this.isActive) return;

        // Type text effect
        if (this.charIndex < this.fullText.length) {
            this.charIndex += this.typeSpeed;
            this.text = this.fullText.substring(0, this.charIndex);
        }

        const boxHeight = 150;
        const boxY = canvas.height - boxHeight - this.margin;
        
        // Draw box background and border
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(this.margin, boxY, canvas.width - (this.margin * 2), boxHeight);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.margin, boxY, canvas.width - (this.margin * 2), boxHeight);
        
        // Prepare for wrapped text
        ctx.fillStyle = "white";
        ctx.font = "24px monospace";
        const maxWidth = canvas.width - (this.margin * 2) - 20; // inner text margin
        let words = this.text.split(" ");
        let line = "";
        let lines = [];
        for (let i = 0; i < words.length; i++) {
            let testLine = line + words[i] + " ";
            if (ctx.measureText(testLine).width > maxWidth && i > 0) {
                lines.push(line);
                line = words[i] + " ";
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        
        // Draw each line
        let lineY = boxY + 40;
        const lineHeight = 30;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], this.margin + 20, lineY);
            lineY += lineHeight;
        }

        // Show continue indicator when text is complete
        if (this.charIndex >= this.fullText.length) {
            ctx.fillText("▼", canvas.width - this.margin - 40, canvas.height - this.margin - 20);
        }
    }

    this.advance = function() {
        //console.log("dialogBox.advance() called"); // debug log
        if (this.charIndex < this.fullText.length) {
            // If still typing, complete the current text
            this.charIndex = this.fullText.length;
            this.text = this.fullText;
        } else if (this.queue.length > 0) {
            // Instead of calling showDialog, directly replace with next dialog
            this.fullText = this.queue.shift();
            this.text = "";
            this.charIndex = 0;
        } else {
            // Close dialog
            this.isActive = false;
        }
    }
}

const dialogBox = new DialogBox();

// Update test dialog messages with instructions
dialogBox.showDialog("Hello! Press SPACE to advance or close dialog messages.");
dialogBox.showDialog("This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!");

// Remove the separate space bar event listener since we're using the input array now

function getCollision(rect1, rect2, buffer){ 
    //                          UP      DOWN  LEFT  RIGHT
    let collisionDetections = [false, false, false, false];
    
    // First check if there's any collision at all using AABB
    if (rect1.x < rect2.x + rect2.w + buffer &&
        rect1.x + rect1.w > rect2.x - buffer &&
        rect1.y < rect2.y + rect2.h + buffer &&
        rect1.y + rect1.h > rect2.y - buffer) {
        
        // There is a collision, now determine which sides
        
        // UP collision - top edge of rect1 is inside rect2
        if (rect1.y > rect2.y - buffer && 
            rect1.y < rect2.y + rect2.h + buffer &&
            rect1.x + rect1.w > rect2.x && 
            rect1.x < rect2.x + rect2.w) {
            collisionDetections[0] = true;
        }
        
        // DOWN collision - bottom edge of rect1 is inside rect2
        if (rect1.y + rect1.h > rect2.y - buffer && 
            rect1.y + rect1.h < rect2.y + rect2.h + buffer &&
            rect1.x + rect1.w > rect2.x && 
            rect1.x < rect2.x + rect2.w) {
            collisionDetections[1] = true;
        }
        
        // LEFT collision - left edge of rect1 is inside rect2
        if (rect1.x > rect2.x - buffer && 
            rect1.x < rect2.x + rect2.w + buffer &&
            rect1.y + rect1.h > rect2.y && 
            rect1.y < rect2.y + rect2.h) {
            collisionDetections[2] = true;
        }
        
        // RIGHT collision - right edge of rect1 is inside rect2
        if (rect1.x + rect1.w > rect2.x - buffer && 
            rect1.x + rect1.w < rect2.x + rect2.w + buffer &&
            rect1.y + rect1.h > rect2.y && 
            rect1.y < rect2.y + rect2.h) {
            collisionDetections[3] = true;
        }
    }

    return collisionDetections;
}
