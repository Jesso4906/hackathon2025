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
const logo = new Image(logoImgRef,50,50,100,100,0)

function render(){
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
    
    // Add space bar check (key code 32)
    if(input[32] && dialogBox.isActive){
        //logo.x++;
        dialogBox.advance();
        input[32] = false; // Reset to prevent multiple advances
    }

    logo.update();
    dialogBox.update();
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

        // Draw dialog box
        const boxHeight = 150;
        const boxY = canvas.height - boxHeight - this.margin;
        
        // Draw box background
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(this.margin, boxY, canvas.width - (this.margin * 2), boxHeight);
        
        // Draw border
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.margin, boxY, canvas.width - (this.margin * 2), boxHeight);
        
        // Draw text
        ctx.fillStyle = "white";
        ctx.font = "24px monospace";
        ctx.fillText(this.text, this.margin + 20, boxY + 40);

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
dialogBox.showDialog("This will show up after the first one!");

// Remove the separate space bar event listener since we're using the input array now
