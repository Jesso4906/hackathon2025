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
const walking1ImgRef = document.getElementById("walking1"); // added walking image reference
const walking2ImgRef = document.getElementById("walking2"); // added walking image reference
const customerImgRef = document.getElementById("coin");
const lobbyFloor = document.getElementById("floor");

// Add new customer image references
const customerStandImgRef = document.getElementById("customerStand");
const customerWalk1ImgRef = document.getElementById("customerWalk1");
const customerWalk2ImgRef = document.getElementById("customerWalk2");
const KcustomerStandImgRef = document.getElementById("KcustomerStand");
const KcustomerWalk1ImgRef = document.getElementById("KcustomerWalk1");
const KcustomerWalk2ImgRef = document.getElementById("KcustomerWalk2");

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

const interactables = [];
let readyCustomer;
const register = new Interactable(logoImgRef, 200, 200, 50, 50, 0, function(){
    if (currentOrder) {
        dialogBox.showDialog("You already have an order to prepare");
        return;
    }
    if (readyCustomer){
        dialogBox.showDialog("Hello! I would like to order some food.");
        let orderString = "I would like ";
        for (let i = 0; i < readyCustomer.order.length; i++) { 
            orderString += readyCustomer.order[i];
            if (i < readyCustomer.order.length - 1) {
                orderString += ", ";
            }
        }
        orderString += ".";
        dialogBox.showDialog(orderString);
        readyCustomer.hasOrdered = true;
        currentOrder = readyCustomer.order;
        readyCustomer = null;
    }
});
interactables.push(register);

const collisionBuffer = 5;

const playerSpeed = 5;
const customerSpeed = 1;
const customerMinSpawnTime = 1;
const customerMaxSpawnTime = 2;

const inventory = [];
let currentOrder;

const customers = [];


var nextSpawnTime = Math.floor(Math.random() * customerMaxSpawnTime) + customerMinSpawnTime;
var timer = 0;
var fadeAlpha = 0; // added for kill fade animation

// Add variables to handle walking animation
let walkFrameCounter = 0;
let useWalkingFrame1 = true;

function render(){
    // --- Begin Screen Shake Effect ---
    ctx.save();
    if(input[16] && customers.some(c => c.targeted)){
        const shakeX = (Math.random() - 0.5) * 10;
        const shakeY = (Math.random() - 0.5) * 10;
        ctx.translate(shakeX, shakeY);
    }
    // --- End Screen Shake Effect ---

    // Tiled background drawing (using tile size equal to player's size, 50x50)
    const tileSize = 50;
    for (let y = 0; y < canvas.height; y += tileSize) {
        for (let x = 0; x < canvas.width; x += tileSize) {
            ctx.drawImage(lobbyFloor, x, y, tileSize, tileSize);
        }
    }

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
    
    // Determine if the player (logo) is moving based on WASD keys
    const isMoving = input[87] || input[65] || input[83] || input[68];
    
    // Update animation frame only when moving, else use standing image
    if(isMoving){
        walkFrameCounter++;
        if(walkFrameCounter >= 10){
            useWalkingFrame1 = !useWalkingFrame1;
            walkFrameCounter = 0;
        }
        logo.ref = useWalkingFrame1 ? walking1ImgRef : walking2ImgRef;
    } else {
        logo.ref = logoImgRef;
    }

    if(input[87] && !upBlocked){ // w
        logo.angle = 0;
        logo.y -= playerSpeed;
    }
    if(input[65] && !leftBlocked){ // a
        logo.angle = 3*Math.PI/2;
        logo.x -= playerSpeed;
    }
    if(input[83]  && !downBlocked){ // s
        logo.angle = Math.PI;
        logo.y += playerSpeed;
    }
    if(input[68]  && !rightBlocked){ // d
        logo.angle = Math.PI/2;
        logo.x += playerSpeed;
    }
    
    // Add space bar check (key code 32)
    if(input[32] && dialogBox.isActive){
        //logo.x++;
        dialogBox.advance();
        input[32] = false; // Reset to prevent multiple advances
    }

    if(customers.length < 10 && (timer * renderRate) === nextSpawnTime * 1000){
        // Instantiate Customer with new parameters and set vertical velocity
        const newCustomer = new Customer(register.img.x + 25, 0, 50, 50);
        newCustomer.img.vY = customerSpeed;
        customers.push(newCustomer);
        timer = 0;
        nextSpawnTime = Math.floor(Math.random() * customerMaxSpawnTime) + customerMinSpawnTime;
    }

    // Interaction Detection "e"
    if (input[69] ) {
        input[69] = false;
        nearestInteractable = null;
        for (interactable of interactables) {
            const distance = Math.sqrt((logo.x - interactable.img.x)**2 + (logo.y - interactable.img.y)**2);
            if (distance < 50) {
                interactable.interact();
                break;
            }
        }
    }
    

    logo.update();
    for (const wall of mapWalls) {
        wall.update();
    }

    let hungryCustomers=0;
    for (const customer of customers) {
        if (!customer.hasOrdered && !customer.hasEaten) {
            if (customer.img.y >= register.img.y - hungryCustomers * (customer.img.h + 10)) {
                customer.img.vY = 0;
                readyCustomer = readyCustomer == null ? customer : readyCustomer;
            } else {
                customer.img.vY = customerSpeed;
            }
            hungryCustomers++;
        }
        customer.update();
    }
    for (const interactable of interactables) {
        interactable.update();
    }
    
    // NEW: Killing mechanic - outline nearest customer in red when nearby and kill on F key press
    if(input[16]) { // when Shift is held
        let nearestDistance = 60;
        let nearestCustomer = null;
        for (const customer of customers) {
            const dx = (logo.x + logo.w/2) - (customer.img.x + customer.img.w/2);
            const dy = (logo.y + logo.h/2) - (customer.img.y + customer.img.h/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if(distance < nearestDistance){
                nearestDistance = distance;
                nearestCustomer = customer;
            }
        }
        // Reset targeting for all customers
        customers.forEach(customer => customer.targeted = false);
        // If a customer is found, outline it
        if(nearestCustomer){
            nearestCustomer.targeted = true;
            ctx.save();
            //ctx.strokeStyle = "red";
            //ctx.lineWidth = 3;
            //ctx.strokeRect(nearestCustomer.img.x, nearestCustomer.img.y, nearestCustomer.img.w, nearestCustomer.img.h);
            ctx.font = "30px serif";
            ctx.fillStyle = "red";
            ctx.fillText("KILL?", nearestCustomer.img.x, nearestCustomer.img.y - 10);
            ctx.restore();
        }
    } else {
        // Reset targeting if Shift is not held
        customers.forEach(customer => customer.targeted = false);
    }
    if(input[70]){
        for (let i = 0; i < customers.length; i++){
            if(customers[i].targeted){
                customers.splice(i, 1);
                break;
            }
        }
        input[70] = false;
    }
    
    // Update fadeAlpha for slower fade in when kill is in range
    if (customers.some(c => c.targeted)) {
        fadeAlpha = Math.min(fadeAlpha + 0.15, 1); // slower fade in increment
    } else {
        fadeAlpha = 0;
    }
    
    timer++;
    
    // New: Apply urban city lighting effect overlay
    drawUrbanLighting();
    
    // Draw the dialog box on top so that it always shows up
    dialogBox.update();
    
    // Restore global transformation from shake
    ctx.restore();
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

function Interactable(img, x, y, w, h, angle, interact){
    this.img = new Image(img, x, y, w, h, angle);
    this.interact = interact;
    this.update = function(){
        this.img.update();
    }
}
const menu = [
    "Cheeseburger",
    "Hamburger",
    "Double Cheeseburger",
    "Double Hamburger",
    "Chicken Sandwich",
    "Fish Sandwich",
    "Fries",
    "Nuggets",
    "Soda",
    "Diet Soda",
    "Milkshake",
    "Vanilla Ice cream",
    "Chocolate Ice cream",
    "Strawberry Ice cream",

]

// Update Customer constructor to implement walking animation and kill images
function Customer(x, y, w, h){
    this.images = {
        stand: customerStandImgRef,
        walk1: customerWalk1ImgRef,
        walk2: customerWalk2ImgRef,
        killStand: KcustomerStandImgRef,
        killWalk1: KcustomerWalk1ImgRef,
        killWalk2: KcustomerWalk2ImgRef
    };
    // Update: Set angle so that customer faces downward instead of backwards
    this.img = new Image(this.images.stand, x, y, w, h, Math.PI);
    this.hasOrdered = false;
    this.hasEaten = false;
    this.order = [];
    for (let i = 0; i <= Math.floor(Math.random() * 5); i++ ){
        this.order.push(menu[Math.floor(Math.random() * menu.length)]);
    }
    this.walkFrameCounter = 0;
    this.useWalkingFrame1 = true;
    
    this.update = function update(){
        if(this.img.vY !== 0){ // moving => animate walking
            this.walkFrameCounter++;
            if(this.walkFrameCounter >= 10){
                this.useWalkingFrame1 = !this.useWalkingFrame1;
                this.walkFrameCounter = 0;
            }
            this.img.ref = this.targeted
                ? (this.useWalkingFrame1 ? this.images.killWalk1 : this.images.killWalk2)
                : (this.useWalkingFrame1 ? this.images.walk1 : this.images.walk2);
        } else { // standing
            this.img.ref = this.targeted ? this.images.killStand : this.images.stand;
        }
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
        const boxX = this.margin;
        const boxY = canvas.height - boxHeight - this.margin;
        const boxWidth = canvas.width - (this.margin * 2);
        
        // Draw box background and border
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
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

// Modified drawUrbanLighting function for quick fade in animation
function drawUrbanLighting(){
    ctx.save();
    let playerCenterX = logo.x + logo.w/2;
    let playerCenterY = logo.y + logo.h/2;
    let playerGradient = ctx.createRadialGradient(playerCenterX, playerCenterY, 30, playerCenterX, playerCenterY, 350);
    playerGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    playerGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
    playerGradient.addColorStop(1, "rgba(0, 0, 50, 0.95)");
    ctx.fillStyle = playerGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if(customers.find(c => c.targeted)){
        const targetedCustomer = customers.find(c => c.targeted);
        let customerCenterX = targetedCustomer.img.x + targetedCustomer.img.w/2;
        let customerCenterY = targetedCustomer.img.y + targetedCustomer.img.h/2;
        ctx.globalAlpha = fadeAlpha;
        let customerGradient = ctx.createRadialGradient(customerCenterX, customerCenterY, 10, customerCenterX, customerCenterY, 120);
        customerGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        customerGradient.addColorStop(0.7, "rgba(0, 0, 0, 0.8)");
        customerGradient.addColorStop(1, "rgba(0, 0, 30, 0.95)");
        ctx.fillStyle = customerGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}
