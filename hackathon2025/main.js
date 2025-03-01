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

const tables = [
    new Table("double", 300, 100),
];

const interactables = [];
let readyCustomer;
const customerSpeed = 1;

const foodToBeDispensed = [];
const drinksToBeDispensed = [];
const iceCreamToBeDispensed = [];

const inventory = [];

let hasTray = false;
let finishedOrder = false;

const register = new Interactable(logoImgRef, 200, 200, 50, 50, 0, function(){
    if (currentOrder) {
        dialogBox.showDialog("You already have an order to prepare");
        return;
    }
    if (readyCustomer){
        dialogBox.showDialog("Hello! I would like to order some food.");
        let orderString = "I would like ";
        for (let i = 0; i < readyCustomer.order.length; i++) { 
            if(menu.findIndex(item => item === readyCustomer.order[i]) < 8){
                foodToBeDispensed.push(readyCustomer.order[i]);
            }
            else if(menu.findIndex(item => item === readyCustomer.order[i]) < 11){
                drinksToBeDispensed.push(readyCustomer.order[i]);
            }
            else {
                iceCreamToBeDispensed.push(readyCustomer.order[i]);
            }
            orderString += readyCustomer.order[i];
            if (i < readyCustomer.order.length - 1) {
                orderString += ", ";
            }
        }
        orderString += ".";
        dialogBox.showDialog(orderString);
        currentOrder = readyCustomer.order;
        readyCustomer.hasOrdered = true;
        
        for (const table of tables) {
            for (const chair of table.chairs) {
                if (!chair.customer) {
                    const distanceToChair = Math.sqrt((readyCustomer.img.x - chair.img.x)**2 + (readyCustomer.img.y - chair.img.y)**2);
                    chair.customer = readyCustomer;
                    readyCustomer.chair = chair;
                    readyCustomer.img.vY = ((chair.img.y - readyCustomer.img.y) / distanceToChair) * customerSpeed;
                    readyCustomer.img.vX = ((chair.img.x - readyCustomer.img.x) / distanceToChair) * customerSpeed;
                    
                    break;
                }
            }
        }
        readyCustomer = null;
        
    }
});
interactables.push(register);

const foodDispenser = new Interactable(logoImgRef, 300, 300, 50, 50, 0, function(){
    if(foodToBeDispensed.length > 0){
        dialogBox.showChoiceDialog(
            "Select Food",
            foodToBeDispensed,
            function(choice) {
                foodToBeDispensed.splice(foodToBeDispensed.findIndex(item => item === choice), 1);
                inventory.push(choice);

                if(foodToBeDispensed.length == 0 && drinksToBeDispensed.length === 0 && iceCreamToBeDispensed.length === 0){
                    finishedOrder = true;
                }
            }
        );
    }
});
interactables.push(foodDispenser);

const drinkDispenser = new Interactable(logoImgRef, 400, 300, 50, 50, 0, function(){
    if(drinksToBeDispensed.length > 0){
        dialogBox.showChoiceDialog(
            "Select Drink",
            drinksToBeDispensed,
            function(choice) {
                drinksToBeDispensed.splice(drinksToBeDispensed.findIndex(item => item === choice), 1);
                inventory.push(choice);

                if(foodToBeDispensed.length == 0 && drinksToBeDispensed.length === 0 && iceCreamToBeDispensed.length === 0){
                    finishedOrder = true;
                }
            }
        );
    }
});
interactables.push(drinkDispenser);

const iceCreamDispenser = new Interactable(logoImgRef, 500, 300, 50, 50, 0, function(){
    if(iceCreamToBeDispensed.length > 0){
        dialogBox.showChoiceDialog(
            "Select Ice Cream",
            iceCreamToBeDispensed,
            function(choice) {
                iceCreamToBeDispensed.splice(iceCreamToBeDispensed.findIndex(item => item === choice), 1);
                inventory.push(choice);

                if(foodToBeDispensed.length == 0 && drinksToBeDispensed.length === 0 && iceCreamToBeDispensed.length === 0){
                    finishedOrder = true;
                }
            }
        );
    }
});
interactables.push(iceCreamDispenser);

const trays = new Interactable(logoImgRef, 600, 300, 50, 50, 0, function(){
    if(finishedOrder){
        hasTray = true;
    }
});
interactables.push(trays);

const collisionBuffer = 5;

const playerSpeed = 5;
const customerMinSpawnTime = 1;
const customerMaxSpawnTime = 2;

const hourlyWage = 10;
const timeScale = 4;
let money = 0;
let time = 9*60; // start at 9:00 AM

let currentOrder;

const customers = [];

var nextSpawnTime = Math.floor(Math.random() * customerMaxSpawnTime) + customerMinSpawnTime;
var customerSpawnTimer = 0;

// Add variables to handle walking animation
let walkFrameCounter = 0;
let useWalkingFrame1 = true;

function render(){
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

    if(customers.length < 10 && (customerSpawnTimer * renderRate) === nextSpawnTime * 1000){
        const newCustomer = new Customer(customerImgRef, register.img.x + 25, 0, 50, 50);
        newCustomer.img.vY = customerSpeed;

        customers.push(newCustomer);
        customerSpawnTimer = 0;
        nextSpawnTime = Math.floor(Math.random() * customerMaxSpawnTime) + customerMinSpawnTime;
    }

    // Interaction Detection "e"
    if (input[69] ) {
        input[69] = false;
        nearestInteractable = null;
        for (const interactable of interactables) {
            const distance = Math.sqrt((logo.x - interactable.img.x)**2 + (logo.y - interactable.img.y)**2);
            if (distance < 50) {
                interactable.interact();
                break;
            }
        }
    }
    
    if(time < 17*60){
        time += (renderRate / 1000) * timeScale;
        money += hourlyWage / (60 / timeScale) * (renderRate / 1000);
    }
    
    ctx.font = "50px Arial";
    ctx.fillStyle = "red";
    let ampm = "AM";
    let hour = Math.floor(time / 60);
    if(hour >= 12){
        ampm = "PM";
        hour -= 12;
        if(hour == 0){
            hour = 12;
        }
    }
    let minute = Math.floor(time % 60);

    ctx.fillText(hour + ":" + (minute < 10 ? "0" + minute : minute) + ampm, 10, 80);
    ctx.fillText("$" + Math.round(money * 100) / 100, 10, 130);
    if(currentOrder){
        ctx.fillText("Order: ", 10, 400);
        for (let i = 0; i < currentOrder.length; i++) {
            if(inventory.findIndex(item => item === currentOrder[i]) > -1){
                ctx.fillStyle = "green";
            }
            ctx.fillText(currentOrder[i], 10, 450 + i * 50);
            ctx.fillStyle = "red";
        }
    }

    if(hasTray){
        ctx.fillText("Tray", 250, 400);
    }

    logo.update();
    for (const wall of mapWalls) {
        wall.update();
    }

    let hungryCustomers=0;
    for (const customer of customers) {
        if (customer.chair) {
            const distanceToChair = Math.sqrt((customer.img.x - customer.chair.img.x)**2 + (customer.img.y - customer.chair.img.y)**2);
            if (distanceToChair <= 10) {
                customer.img.vX = 0;
                customer.img.vY = 0;
                customer.hasOrdered=true;
            }
        }
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
    for (const table of tables) {
        for (const chair of table.chairs) {
            chair.update();
        }
        table.update();
    }

    customerSpawnTimer++;
    
    // New: Apply urban city lighting effect overlay
    drawUrbanLighting();
    
    // Draw the dialog box on top so that it always shows up
    dialogBox.update();
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
function Chair(img, x, y) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.w = 30;
    this.h = 30;
    this.customer = null;
    
    // Set the image position to match the chair position
    this.img.x = x;
    this.img.y = y;
    
    this.update = function(){
        this.img.update();
    }
}
function Table(type, x, y) {

    if (type === "double")
    {
        this.tableImg = new Image(document.getElementById("doubleTable"), x, y, 100, 50, 0);
        this.chairs = [
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 10, y -30),
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 60, y + -30),
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 10, y + 50),
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 60, y + 50)
        ]
    }
    else if (type==="booth")
    {
        this.tableImg = new Image(document.getElementById("boothTable"), x, y, 50, 50, 0);
        this.chairs = [
            new Chair(new Image(document.getElementById("boothChair"), x, y, 30, 30, 0), x + 10, y + 10),
            new Chair(new Image(document.getElementById("boothChair"), x, y, 30, 30, 0), x + 10, y + 30),
        ]
    }
    else { // "single"
        this.tableImg = new Image(document.getElementById("table"), x, y, 50, 50, 0);
        this.chairs = [
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 10, y + 10),
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 30, y + 10),
        ]
    }
    

    this.x = x;
    this.y = y;
    this.w = 50;
    this.h = 50;
    
    this.update = function(){
        this.tableImg.update();
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

function Customer(ref, x, y, w, h){
    this.img = new Image(ref, x, y, w, h, 0);
    this.hasOrdered = false;
    this.hasEaten = false;
    this.order = [];
    for (let i = 0; i <= Math.floor(Math.random() * 5); i++ ){
        this.order.push(menu[Math.floor(Math.random() * menu.length)]);
    }
    this.chair = null;

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
    
    this.isChoice = false;
    this.options = [];
    this.selectedOption = 0;
    this.choiceCallback = null;
    
    // New: Show a choice dialog with prompt text, array of options, and a callback
    this.showChoiceDialog = function(promptText, options, callback) {
        this.isActive = true;
        this.isChoice = true;
        this.fullText = promptText;
        this.text = "";
        this.charIndex = 0;
        this.options = options;
        this.selectedOption = 0;
        this.choiceCallback = callback;
    }
    
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

        // If it's a choice dialog, draw the options and handle arrow key input
        if (this.isChoice) {
            // Handle up/down arrow key input to update selectedOption
            if (input[38]) { // up arrow
                if (this.selectedOption > 0) { this.selectedOption--; }
                input[38] = false;
            }
            if (input[40]) { // down arrow
                if (this.selectedOption < this.options.length - 1) { this.selectedOption++; }
                input[40] = false;
            }
            
            // Render each option
            for (let i = 0; i < this.options.length; i++) {
                if (i === this.selectedOption) {
                    ctx.fillStyle = "yellow";
                } else {
                    ctx.fillStyle = "white";
                }
                ctx.fillText(this.options[i], this.margin + 20, lineY + i * lineHeight);
            }
        } else {
            // Show continue indicator when text is complete
            if (this.charIndex >= this.fullText.length) {
                ctx.fillText("▼", canvas.width - this.margin - 40, canvas.height - this.margin - 20);
            }
        }
    }

    this.advance = function() {
        //console.log("dialogBox.advance() called"); // debug log
        if (this.isChoice) {
            // When in choice mode, space selects the currently highlighted option
            if (this.choiceCallback) { 
                this.choiceCallback(this.options[this.selectedOption]);
            }
            this.isActive = false;
            this.isChoice = false;
            return;
        }
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
//dialogBox.showDialog("Hello! Press SPACE to advance or close dialog messages.");
//dialogBox.showDialog("This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!");

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

// New function to add super cool urban lighting effect
function drawUrbanLighting(){
    ctx.save();
    // Position gradient at player's center
    const centerX = logo.x + logo.w / 2;
    const centerY = logo.y + logo.h / 2;
    // Create a radial gradient with a hip urban night vibe
    const gradient = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 350);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");         // Clear center
    gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");       // Dim mid area
    gradient.addColorStop(1, "rgba(0, 0, 50, 0.95)");       // Deep blue, dark outer edge
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}