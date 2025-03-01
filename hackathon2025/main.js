const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const logoImgRef = document.getElementById("logo");

const renderRate = 20;

canvas.width = "1000";
canvas.height = "1000";

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
const logo = new Image(logoImgRef,50,50,100,100,0)

const mapWalls = [
    new Rect(0,0,canvas.width,10,"red"),
    new Rect(0,0,10,canvas.height,"red"),
    new Rect(0,canvas.height-10,canvas.width,10,"red"),
    new Rect(canvas.width-10,0,10,canvas.height,"red")
];


function getCollision(rect1, rect2){ 
    //                          UP      DOWN  LEFT  RIGHT
    let collisionDetections = [false, false, false, false];
    
    // First check if there's any collision at all using AABB
    if (rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y) {
        
        // There is a collision, now determine which sides
        
        // UP collision - top edge of rect1 is inside rect2
        if (rect1.y >= rect2.y && 
            rect1.y <= rect2.y + rect2.h &&
            rect1.x + rect1.w > rect2.x && 
            rect1.x < rect2.x + rect2.w) {
            collisionDetections[0] = true;
        }
        
        // DOWN collision - bottom edge of rect1 is inside rect2
        if (rect1.y + rect1.h >= rect2.y && 
            rect1.y + rect1.h <= rect2.y + rect2.h &&
            rect1.x + rect1.w > rect2.x && 
            rect1.x < rect2.x + rect2.w) {
            collisionDetections[1] = true;
        }
        
        // LEFT collision - left edge of rect1 is inside rect2
        if (rect1.x >= rect2.x && 
            rect1.x <= rect2.x + rect2.w &&
            rect1.y + rect1.h > rect2.y && 
            rect1.y < rect2.y + rect2.h) {
            collisionDetections[2] = true;
        }
        
        // RIGHT collision - right edge of rect1 is inside rect2
        if (rect1.x + rect1.w >= rect2.x && 
            rect1.x + rect1.w <= rect2.x + rect2.w &&
            rect1.y + rect1.h > rect2.y && 
            rect1.y < rect2.y + rect2.h) {
            collisionDetections[3] = true;
        }
    }

    return collisionDetections;
}


function render(){
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let leftBlocked = false;
    let rightBlocked = false;
    let upBlocked = false;
    let downBlocked = false;

    for (const wall of mapWalls) {
        const collisionData = getCollision(logo, wall);
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
        logo.y--;
    }
    if(input[65] && !leftBlocked){ // a
        logo.x--;
    }
    if(input[83]  && !downBlocked){ // s
        logo.y++;
    }
    if(input[68]  && !rightBlocked){ // d
        logo.x++;
    }

    logo.update();
    for (const wall of mapWalls) {
        wall.update();
    }
}
var updateLoop = window.setInterval(render, renderRate);

function Rect(x, y, w, h, color)
{
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;

    this.vX = 0; // Velocity
    this.vY = 0;

    this.update = function()
    {
        this.x += this.vX;
        this.y += this.vY;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

function Image(ref, x, y, w, h, angle)
{
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.angle = angle;
    this.ref = ref;

    this.vX = 0; // Velocity
    this.vY = 0;

    this.update = function update()
    {
        this.x += this.vX;
        this.y += this.vY;
        
        ctx.translate(this.x, this.y);

        ctx.rotate(this.angle);

        ctx.drawImage(this.ref, 0, 0, this.w, this.h);

        ctx.rotate(-this.angle);

        ctx.translate(-this.x, -this.y);
    }

    this.copy = function() { return new Image(ref, x, y, w, h, angle) }
}
