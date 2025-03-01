const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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

const rect = new Rect(0,0,100,100,"yellow");
rect.update();

function render(){
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if(input[87]){ // w
        rect.y--;
    }
    if(input[65]){ // a
        rect.x--;
    }
    if(input[83]){ // s
        rect.y++;
    }
    if(input[68]){ // d
        rect.x++;
    }

    rect.update();
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
