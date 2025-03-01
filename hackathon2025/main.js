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

function render(){
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if(input[87]){ // w
        logo.y--;
    }
    if(input[65]){ // a
        logo.x--;
    }
    if(input[83]){ // s
        logo.y++;
    }
    if(input[68]){ // d
        logo.x++;
    }

    logo.update();
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
