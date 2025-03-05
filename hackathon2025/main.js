const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const logoImgRef = document.getElementById("logo");
const walking1ImgRef = document.getElementById("walking1"); // added walking image reference
const walking2ImgRef = document.getElementById("walking2"); // added walking image reference
const lobbyFloor = document.getElementById("floor");

// Add new customer image references
const customerStandImgRef = document.getElementById("customerStand");
const customerWalk1ImgRef = document.getElementById("customerWalk1");
const customerWalk2ImgRef = document.getElementById("customerWalk2");
const KcustomerStandImgRef = document.getElementById("KcustomerStand");
const KcustomerWalk1ImgRef = document.getElementById("KcustomerWalk1");
const KcustomerWalk2ImgRef = document.getElementById("KcustomerWalk2");

// Add new dead customer image reference
const customerDeadImgRef = document.getElementById("customerDead");

const bloodSplatImgRef = document.getElementById("bloodSplat");

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
    // Exterior walls
    new Rect(0,0,canvas.width,10,"red"),
    new Rect(0,0,10,canvas.height,"red"),
    new Rect(0,canvas.height-10,canvas.width,10,"red"),
    new Rect(canvas.width-10,0,10,canvas.height,"red"),
    // Barrier Walls
    // bathroom wall
    new Image(document.getElementById("wall"), 200, 450, 550, 50, 0),
    // Counter
    new Image(document.getElementById("counter"), 200, 10, 50, 380 , 0),
    // kitchen-lobby wall
    new Image(document.getElementById("wall"), 200, 450, 50, 1000, 0),
    
];

const tables = [
    new Table("double", 300, 100),
    new Table("double", 300, 300),
    new Table("double", 600, 100),
    new Table("double", 600, 300),

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
const registerImgRef = document.getElementById("register");
const meatMachineImgRef = document.getElementById("meatMachine");
let kills = 0;
const meatMachine = new Interactable(meatMachineImgRef, 100, 450, 50, 50, 0, function(){
    const dragged = customers.find(c => c.dragging && c.dead);
    if(dragged){
        dragged.dragging = false; 
        kills++;
        dialogBox.showDialog("Body processed! Total kills: " + kills);
        customers.splice(customers.indexOf(dragged), 1);
    }
});
interactables.push(meatMachine);

let openDialog = false;

const register = new Interactable(registerImgRef, 200, 150, 25, 25, 0, function(){
    if (currentOrder) {
        dialogBox.showDialog("You already have an order to prepare");
        return;
    }
    if (readyCustomer){
        // Adjust threshold check to account for new customer positioning
        const threshold = 75;
        const customerAtRegister = 
            Math.abs((readyCustomer.img.x + readyCustomer.img.w/2) - (register.img.x + register.img.w + 30)) < threshold &&
            Math.abs(readyCustomer.img.y - register.img.y) < threshold;
            
        if (!customerAtRegister) {
            return;
        }
        
        // Clear any leftover state from previous orders
        hasTray = false;
        finishedOrder = false;
        inventory.length = 0;
        foodToBeDispensed.length = 0;
        drinksToBeDispensed.length = 0;
        iceCreamToBeDispensed.length = 0;
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
        
        // Find the nearest available chair
        let nearestChair = null;
        let shortestDistance = Infinity;
        
        for (const table of tables) {
            for (const chair of table.chairs) {
                if (!chair.customer) {
                    const dist = Math.sqrt(
                        (readyCustomer.img.x - chair.img.x)**2 + 
                        (readyCustomer.img.y - chair.img.y)**2
                    );
                    if (dist < shortestDistance) {
                        shortestDistance = dist;
                        nearestChair = chair;
                    }
                }
            }
        }

        if (nearestChair) {
            // Calculate angle towards table center
            const tableCenter = {
                x: nearestChair.tableX + nearestChair.tableWidth/2,
                y: nearestChair.tableY + nearestChair.tableHeight/2
            };
            
            const angleToTable = Math.atan2(
                tableCenter.y - nearestChair.img.y,
                tableCenter.x - nearestChair.img.x
            );

            nearestChair.customer = readyCustomer;
            readyCustomer.chair = nearestChair;
            readyCustomer.targetAngle = angleToTable;
            // Rest of the existing chair assignment code...
        }
        
        currentCustomer = readyCustomer;
        readyCustomer = null;
    }
});
interactables.push(register);

const foodDispenserImg = document.getElementById("foodDispenser");
const foodDispenser = new Interactable(foodDispenserImg, 0, 150, 50, 50, Math.PI / 2, function(){
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

const drinkDispenserImg = document.getElementById("drinkDispenser");
const drinkDispenser = new Interactable(drinkDispenserImg, 0, 200, 50, 50, Math.PI / 2, function(){
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

const iceCreamDispenserImg = document.getElementById("icecreamMachine");
const iceCreamDispenser = new Interactable(iceCreamDispenserImg, 0, 250, 50, 50, Math.PI / 2, function(){
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

const traysImg = document.getElementById("trays");
const filledTrayImgRef = document.getElementById("filledTray"); // NEW: Reference to filled tray image

const trays = new Interactable(traysImg, 200, 250, 25, 25, 0, function(){
    if(!currentOrder) {
        dialogBox.showDialog("I need an order first!");
        return;
    }
    if(!finishedOrder) {
        dialogBox.showDialog("I need to finish preparing the order first!");
        return;
    }
    if(hasTray) { // Already holding a tray
        dialogBox.showDialog("You already have a tray!");
        return;
    }
    if(customers.some(c => c.dragging)){
         dialogBox.showDialog("Cannot pick up tray while dragging a body!");
         return;
    }
    hasTray = true;
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
let currentCustomer;

const customers = [];

var nextSpawnTime = Math.floor(Math.random() * customerMaxSpawnTime) + customerMinSpawnTime;
var customerSpawnTimer = 0;
var fadeAlpha = 0; // added for kill fade animation

var orderTimer = 0;

// Add variables to handle walking animation
let walkFrameCounter = 0;
let useWalkingFrame1 = true;

var failScreenActive = false;
var failScreenAlpha = 0;

function failGame() {
    failScreenActive = true;
}

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
    
    // Add collisions for machine interactables (foodDispenser, drinkDispenser, iceCreamDispenser, meatMachine)
    const machines = [foodDispenser, drinkDispenser, iceCreamDispenser, meatMachine];
    for (const machine of machines) {
        const collData = getCollision(logo, machine.img, collisionBuffer);
        if(collData[0]) { upBlocked = true; }
        if(collData[1]) { downBlocked = true; }
        if(collData[2]) { leftBlocked = true; }
        if(collData[3]) { rightBlocked = true; }
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

    // Before movement updates, determine current speed:
    let currentPlayerSpeed = playerSpeed;
    if(customers.some(c => c.dragging)){
        currentPlayerSpeed = playerSpeed / 3;  // move even more slowly while dragging a body
    }

    // Update movement using currentPlayerSpeed:
    if(input[87] && !upBlocked){ // w
        logo.angle = 0;
        logo.y -= currentPlayerSpeed;
    }
    if(input[65] && !leftBlocked){ // a
        logo.angle = 3*Math.PI/2;
        logo.x -= currentPlayerSpeed;
    }
    if(input[83]  && !downBlocked){ // s
        logo.angle = Math.PI;
        logo.y += currentPlayerSpeed;
    }
    if(input[68]  && !rightBlocked){ // d
        logo.angle = Math.PI/2;
        logo.x += currentPlayerSpeed;
    }
    
    // Add space bar check (key code 32)
    if(input[32] && dialogBox.isActive){
        //logo.x++;
        dialogBox.advance();
        input[32] = false; // Reset to prevent multiple advances
    }

    if(customers.length < 10 && (customerSpawnTimer * renderRate) >= nextSpawnTime * 1000){
        const newCustomer = new Customer(register.img.x + 50, 0, 50, 50);
        newCustomer.img.vY = customerSpeed;
        customers.push(newCustomer);
        customerSpawnTimer = 0;
        nextSpawnTime = Math.floor(Math.random() * customerMaxSpawnTime) + customerMinSpawnTime;
    }

    // Interaction Detection "e"
    if(input[69]) {
        input[69] = false;
        nearestInteractable = null;
        for (const interactable of interactables) {
            const distance = Math.sqrt( (logo.x - interactable.img.x)**2 + (logo.y - interactable.img.y)**2 );
            if (distance < 75) {
                interactable.interact();
                break;
            }
        }
        
        // If near a customer holding a tray, complete the service
        if(currentCustomer && hasTray) {
            const distance = Math.sqrt((logo.x - currentCustomer.img.x)**2 + (logo.y - currentCustomer.img.y)**2);
            if (distance < 75) {
                dialogBox.queue = [];
                dialogBox.showDialog("Yum Yum!");


                
                currentCustomer.hasEaten = true;
                // Release the customer's chair so new customers can take it
                if(currentCustomer.chair) { 
                    currentCustomer.chair.customer = null; 
                }
                currentCustomer.img.vY = -customerSpeed;
                // Reset order state for new customers
                currentOrder = null;
                hasTray = false;
                finishedOrder = false;
                inventory.length = 0;
                foodToBeDispensed.length = 0;
                drinksToBeDispensed.length = 0;
                iceCreamToBeDispensed.length = 0;
                currentCustomer = null;
                readyCustomer = null;
            }
        }
    }

    if(time < 17*60){
        time += (renderRate / 1000) * timeScale;
        money += hourlyWage / (60 / timeScale) * (renderRate / 1000);
    }

    for (const wall of mapWalls) {
        wall.update();
    }

    // Draw the filled tray image if the player is holding a tray
    if(hasTray){
        let trayX = logo.x;
        let trayY = logo.y;
        
        // Adjust tray position based on player rotation
        if(logo.angle === 0) { // facing up: reduce offset
            trayY = logo.y;
            trayX = logo.x + 12;
        } else if(logo.angle === Math.PI) { // facing down (unchanged)
            trayY = logo.y + 25;
            trayX = logo.x + 12;
        } else if(logo.angle === Math.PI/2) { // facing right (unchanged)
            trayX = logo.x + 25;
            trayY = logo.y + 12;
        } else if(logo.angle === 3*Math.PI/2) { // facing left: reduce offset
            trayX = logo.x;
            trayY = logo.y + 12;
        }
        
        ctx.drawImage(filledTrayImgRef, trayX, trayY, 25, 25);
    }

    logo.update();
    

    let hungryCustomers = 0;
    // Update customers but don't draw them yet
    for (const customer of customers) {
        if (customer.chair) {
            const distanceToChair = Math.sqrt((customer.img.x - customer.chair.img.x)**2 + (customer.img.y - customer.chair.img.y)**2);
            if (distanceToChair <= 10) {
                customer.img.vX = 0;
                customer.img.vY = 0;
                customer.hasOrdered = true;
            }
        }
        // Only non-dead customers join the order line
        if (!customer.dead && !customer.hasOrdered && !customer.hasEaten) {
            const queuePosition = customers.filter(c => !c.dead && !c.hasOrdered && !c.hasEaten)
                                     .indexOf(customer);
            const targetY = register.img.y - queuePosition * (customer.img.h + 10);
            
            // If this is the first customer and they're at the register
            if (queuePosition === 0 && Math.abs(customer.img.y - register.img.y) < 5) {
                customer.img.vY = 0;
                readyCustomer = customer;
            } else {
                // If customer is too far down, move them up
                if (customer.img.y > targetY + 5) {
                    customer.img.vY = -customerSpeed;
                } 
                // If customer is too far up, move them down
                else if (customer.img.y < targetY - 5) {
                    customer.img.vY = customerSpeed;
                } 
                // If customer is at the right height, stop vertical movement
                else {
                    customer.img.vY = 0;
                }
            }
            hungryCustomers++;
        }

        // Update position without drawing
        customer.img.x += customer.img.vX;
        customer.img.y += customer.img.vY;
    }

    // Draw tables and chairs first
    for (const table of tables) {
        for (const chair of table.chairs) {
            chair.update();
        }
        table.update();
    }

    // Now draw all customers on top
    for (const customer of customers) {
        customer.update();
    }

    // Ensure readyCustomer is always set if available,
    // and if the current readyCustomer is dead, reassign to the next candidate.
    if (readyCustomer && readyCustomer.dead) {
        readyCustomer = customers.find(c => !c.dead && !c.hasOrdered && !c.hasEaten);
    }
    if (!readyCustomer) {
        readyCustomer = customers.find(c => !c.dead && !c.hasOrdered && !c.hasEaten);
    }

    for (const interactable of interactables) {
        interactable.update();
    }
    
    // NEW: Killing mechanic - outline nearest customer in red when nearby and kill on F key press
    // Modified kill mechanic section to skip dead customers
    // Modify kill prompt section: only show prompt if no body is being dragged.
    // Modify kill menu condition to add !hasTray:
    if(input[16] && !hasTray && !customers.some(c => c.dragging)) { 
        let nearestDistance = 60;
        let nearestCustomer = null;
        for (const customer of customers) {
            if(customer.dead) continue; // skip dead customers
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
        // If a valid customer is found, outline it
        if(nearestCustomer){
            nearestCustomer.targeted = true;
            ctx.save();
            ctx.font = "30px serif";
            ctx.fillStyle = "red";
            ctx.fillText("KILL?", nearestCustomer.img.x, nearestCustomer.img.y - 10);
            ctx.restore();
        }
    } else {
        // Reset targeting if Shift is not held, holding a tray, or if dragging a body
        customers.forEach(customer => customer.targeted = false);
    }
    // Modify F key handler:
    if(input[70]){
        if(hasTray){
            dialogBox.showDialog("Dropped tray, order progress reset.");

            finishedOrder = false;
            inventory.length = 0;
            // Recalculate pending ingredients from currentOrder so you can interact with machines again.
            foodToBeDispensed.length = 0;
            drinksToBeDispensed.length = 0;
            iceCreamToBeDispensed.length = 0;
            for (let i = 0; i < currentOrder.length; i++) {
                if (menu.findIndex(item => item === currentOrder[i]) < 8) {
                    foodToBeDispensed.push(currentOrder[i]);
                } else if (menu.findIndex(item => item === currentOrder[i]) < 11) {
                    drinksToBeDispensed.push(currentOrder[i]);
                } else {
                    iceCreamToBeDispensed.push(currentOrder[i]);
                }
            }
            hasTray = false;
            input[70] = false;
        } else {
            let dragged = customers.find(c => c.dragging);
            if(dragged){
                dragged.dragging = false;
                console.debug("Dropped dead body");
            } else {
                let executed = false;
                // First, try to kill a living customer as before
                for (let i = 0; i < customers.length; i++){
                    if(customers[i].targeted && !customers[i].dead){
                        customers[i].dead = true;
                        // Check if this customer's order is the current order
                        if(customers[i].order === currentOrder) {
                            currentOrder = null;
                            foodToBeDispensed.length = 0;
                            drinksToBeDispensed.length = 0;
                            iceCreamToBeDispensed.length = 0;
                            finishedOrder = false;
                        }
                        executed = true;
                        // Fix: update readyCustomer so that the next available customer is selected
                        readyCustomer = customers.find(c => !c.dead && !c.hasOrdered && !c.hasEaten);
                        break;
                    }
                }
                // If no kill was executed, check for a nearby dead customer to start dragging
                if(!executed){
                     for (let i = 0; i < customers.length; i++){
                         if(customers[i].dead && !customers[i].dragging){
                             let dx = (logo.x + logo.w/2) - (customers[i].img.x + customers[i].img.w/2);
                             let dy = (logo.y + customers[i].img.h/2) - (customers[i].img.y + customers[i].img.h/2);
                             let distance = Math.sqrt(dx*dx+dy*dy);
                             if(distance < 60){ // threshold for dragging
                                 customers[i].dragging = true;
                                 // Save the offset from player's position to the dead body position
                                 customers[i].dragOffsetX = customers[i].img.x - logo.x;
                                 customers[i].dragOffsetY = customers[i].img.y - logo.y;
                                 console.debug("Started dragging dead body, offset:", customers[i].dragOffsetX, customers[i].dragOffsetY);
                                 executed = true;
                                 break;
                             }
                         }
                     }
                }
            }
            input[70] = false;
        }
    }
    
    // Update fadeAlpha for slower fade in when kill is in range
    if (customers.some(c => c.targeted)) {
        fadeAlpha = Math.min(fadeAlpha + 0.15, 1); // slower fade in increment
    } else {
        fadeAlpha = 0;
    }
    
    customerSpawnTimer++;
    
    // New: Apply urban city lighting effect overlay
    drawUrbanLighting();

    // Draw stylized HUD
    const margin = 20;
    const rightAlign = canvas.width - margin;
    ctx.save();
    
    // Set up the general text style
    ctx.textAlign = "right";
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;
    
    // Time display with glowing effect
    let ampm = "AM";
    let hour = Math.floor(time / 60);
    if(hour >= 12){
        ampm = "PM";
        hour -= 12;
        if(hour == 0) hour = 12;
    }
    let minute = Math.floor(time % 60);
    
    // Draw time with red glow
    ctx.font = "bold 38px monospace";
    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillStyle = "#FF3333";
    const timeText = hour + ":" + (minute < 10 ? "0" + minute : minute) + ampm;
    ctx.strokeText(timeText, rightAlign, margin + 35);
    ctx.fillText(timeText, rightAlign, margin + 35);
    
    // Money display with green matrix-style glow
    ctx.font = "bold 32px monospace";
    ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fillStyle = "#33FF33";
    const moneyText = "$" + Math.round(money * 100) / 100;
    ctx.strokeText(moneyText, rightAlign, margin + 75);
    ctx.fillText(moneyText, rightAlign, margin + 75);
    
    // Kill counter with blood-red glow effect
    ctx.font = "bold 35px monospace";
    ctx.shadowColor = 'rgba(255, 0, 0, 0.9)';
    ctx.strokeStyle = 'rgba(180, 0, 0, 0.8)';
    ctx.fillStyle = "#FF0000";
    const killText = "☠ " + kills;
    ctx.strokeText(killText, rightAlign, margin + 115);
    ctx.fillText(killText, rightAlign, margin + 115);
    
    // Add subtle scanline effect over the HUD area
    const scanlineHeight = 2;
    const hudWidth = 200;
    const hudHeight = 120;
    ctx.globalAlpha = 0.1;
    for(let y = margin; y < margin + hudHeight; y += scanlineHeight * 2) {
        ctx.fillStyle = "#000";
        ctx.fillRect(canvas.width - hudWidth - margin, y, hudWidth, scanlineHeight);
    }
    
    ctx.restore();

    // Draw the dialog box on top so that it always shows up
    dialogBox.update();
    
    // Restore global transformation from shake
    ctx.restore();
    
    // Draw cones for each alive customer and check for dead bodies in their range
    customers.forEach(customer => {
        if (!customer.dead) { // alive only
            let cx = customer.img.x + customer.img.w / 2;
            let cy = customer.img.y + customer.img.h / 2;
            let coneDir = Math.PI / 2;  // downward beam
            let halfAngle = Math.PI / 6;
            let coneRange = 150;
            let innerRadius = 20;
            // Show the flashlight beam only for the first customer in the order line (readyCustomer)
            // when the player is holding a dead body OR has already ordered.
            if (customer === readyCustomer && (customers.some(c => c.dragging) || customer.hasOrdered)) {
                ctx.save();
                let playerCenterX = logo.x + logo.w / 2;
                let playerCenterY = logo.y + logo.h / 2;
                let lightRadius = 350;
                ctx.beginPath();
                ctx.arc(playerCenterX, playerCenterY, lightRadius, 0, 2 * Math.PI);
                ctx.clip();
                
                ctx.beginPath();
                ctx.moveTo(cx, cy + innerRadius);
                let leftX = cx + coneRange * Math.cos(coneDir - halfAngle);
                let leftY = cy + coneRange * Math.sin(coneDir - halfAngle);
                let rightX = cx + coneRange * Math.cos(coneDir + halfAngle);
                let rightY = cy + coneRange * Math.sin(coneDir + halfAngle);
                
                let leftCtrlX = cx + (leftX - cx) * 0.5;
                let leftCtrlY = cy + innerRadius; 
                ctx.bezierCurveTo(leftCtrlX, leftCtrlY, leftCtrlX, leftY, leftX, leftY);
                ctx.quadraticCurveTo(cx, cy + coneRange + 20, rightX, rightY);
                let rightCtrlX = cx + (rightX - cx) * 0.5;
                ctx.bezierCurveTo(rightCtrlX, rightY, rightCtrlX, cy + innerRadius, cx, cy + innerRadius);
                ctx.closePath();
                
                let beamGradient = ctx.createLinearGradient(cx, cy, cx, cy + coneRange);
                beamGradient.addColorStop(0, "rgba(255,255,255,0.2)");
                beamGradient.addColorStop(1, "rgba(255,255,255,0)");
                ctx.fillStyle = beamGradient;
                ctx.fill();
                ctx.restore();
            }
            
            // Always perform dead body detection:
            customers.forEach(other => {
                if(other.dead) {
                    let ocx = other.img.x + other.img.w / 2;
                    let ocy = other.img.y + other.img.h / 2;
                    let dx = ocx - cx;
                    let dy = ocy - cy;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if(dist <= coneRange) {
                        let angleToDead = Math.atan2(dy, dx);
                        if(Math.abs(angleDifference(coneDir, angleToDead)) <= halfAngle) {
                            console.debug("Dead body detected near alive customer at", cx, cy);
                        }
                    }
                }
            });
        }
    });

    // Draw fail screen overlay if active
    if (failScreenActive) {
        // Fade in
        if (failScreenAlpha < 1) {
            failScreenAlpha += 0.01;
        }
        ctx.save();
        ctx.globalAlpha = failScreenAlpha;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "black";
        ctx.font = "50px Arial";
        ctx.fillText("You Failed", canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = "24px Arial";
        ctx.fillText("Press R to Restart", canvas.width / 2 - 110, canvas.height / 2 + 50);
        ctx.restore();
    }

    // Listen for R to restart
    if (failScreenActive && input[82]) {
        location.reload();
    }

    // Remove customers that have eaten and left through the top area
    for (let i = customers.length - 1; i >= 0; i--){
        if(customers[i].hasEaten && (customers[i].img.y + customers[i].img.h < 0)){
            customers.splice(i, 1);
        }
    }

    // Replace the order drawing section (around where it checks if(currentOrder)) with:
    
    // Draw order display with cyberpunk/urban style
    if(currentOrder){
        ctx.save();
        
        const orderX = 10;
        const orderY = 200;
        const itemSpacing = 40;
        
        // Draw order header
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = "#FF0000";
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
        
        const orderTitle = "CURRENT ORDER:";
        ctx.strokeText(orderTitle, orderX, orderY);
        ctx.fillText(orderTitle, orderX, orderY);
        
        // Create maps to track counts
        const itemCounts = {};
        const collectedCounts = {};
        currentOrder.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
            collectedCounts[item] = 0;
        });
        inventory.forEach(item => {
            if(itemCounts[item] && collectedCounts[item] < itemCounts[item]){
                collectedCounts[item]++;
            }
        });
        
        // Iterate over unique items
        const uniqueItems = Object.keys(itemCounts);
        uniqueItems.forEach((item, idx) => {
             const y = orderY + ((idx + 1) * itemSpacing);
             const isCollected = collectedCounts[item] >= itemCounts[item];
             if(!isCollected){
                  ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
             }
             if(isCollected){
                  ctx.fillStyle = "#00FF00";
                  ctx.shadowColor = "rgba(0, 255, 0, 0.8)";
             } else {
                  ctx.fillStyle = "#FF3333";
                  ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
             }
             const countText = itemCounts[item] > 1 ? ` (${collectedCounts[item]}/${itemCounts[item]})` : '';
             ctx.strokeText("- " + item + countText, orderX, y);
             ctx.fillText("- " + item + countText, orderX, y);
             ctx.globalAlpha = 1;
        });
        
        if(hasTray) {
            ctx.fillStyle = "#00FF00";
            ctx.shadowColor = "rgba(0, 255, 0, 0.8)";
            ctx.fillText("TRAY READY", orderX, orderY + ((uniqueItems.length + 1) * itemSpacing));
        }
        
        // ...existing code for scanline effect...
        ctx.restore();
    }

    // After drawing customers, draw a rope between the player and any dragged body
    customers.forEach(customer => {
        if(customer.dragging) {
            const playerCenter = { x: logo.x + logo.w/2, y: logo.y + logo.h/2 };
            const bodyCenter = { x: customer.img.x + customer.img.w/2, y: customer.img.y + customer.img.h/2 };
            const dx = bodyCenter.x - playerCenter.x;
            const dy = bodyCenter.y - playerCenter.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            if(distance > 40) { // only draw if sufficiently apart
                // Calculate midpoint and then a control point offset perpendicular to the rope direction
                const midX = (playerCenter.x + bodyCenter.x) / 2;
                const midY = (playerCenter.y + bodyCenter.y) / 2;
                // Sag increases with distance (limit sag max to 50 pixels)
                const sagFactor = Math.min(distance / 3, 50);
                // Perpendicular unit vector components
                const perpX = -dy / distance;
                const perpY = dx / distance;
                const controlX = midX + perpX * sagFactor;
                const controlY = midY + perpY * sagFactor;
                ctx.save();
                ctx.strokeStyle = "#8B4513"; // brown rope color
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(playerCenter.x, playerCenter.y);
                ctx.quadraticCurveTo(controlX, controlY, bodyCenter.x, bodyCenter.y);
                ctx.stroke();
                ctx.restore();
            }
        }
    });
    
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

function Chair(img, x, y, tableX, tableY, tableWidth, tableHeight) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.w = 30;
    this.h = 30;
    this.customer = null;
    this.tableX = tableX;
    this.tableY = tableY;
    this.tableWidth = tableWidth;
    this.tableHeight = tableHeight;
    
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
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 10, y -30, x, y, 100, 50),
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 60, y + -30, x, y, 100, 50),
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 10, y + 50, x, y, 100, 50),
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 60, y + 50, x, y, 100, 50)
        ]
    }
    else if (type==="booth")
    {
        this.tableImg = new Image(document.getElementById("boothTable"), x, y, 50, 50, 0);
        this.chairs = [
            new Chair(new Image(document.getElementById("boothChair"), x, y, 30, 30, 0), x + 10, y + 10, x, y, 50, 50),
            new Chair(new Image(document.getElementById("boothChair"), x, y, 30, 30, 0), x + 10, y + 30, x, y, 50, 50),
        ]
    }
    else { // "single"
        this.tableImg = new Image(document.getElementById("table"), x, y, 50, 50, 0);
        this.chairs = [
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 10, y + 10, x, y, 50, 50),
            new Chair(new Image(document.getElementById("chair"), x, y, 30, 30, 0), x + 30, y + 10, x, y, 50, 50),
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

    this.chair = null;

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
]

// Update Customer constructor to implement walking animation, kill images, and dead state
function Customer(x, y, w, h){
    this.images = {
        stand: customerStandImgRef,
        walk1: customerWalk1ImgRef,
        walk2: customerWalk2ImgRef,
        killStand: KcustomerStandImgRef,
        killWalk1: KcustomerWalk1ImgRef,
        killWalk2: KcustomerWalk2ImgRef
    };
    this.img = new Image(this.images.stand, x, y, w, h, Math.PI);
    this.hasOrdered = false;
    this.hasEaten = false;
    this.order = [];
    for (let i = 0; i <= Math.floor(Math.random() * 5); i++ ){
        this.order.push(menu[Math.floor(Math.random() * menu.length)]);
    }
    this.walkFrameCounter = 0;
    this.useWalkingFrame1 = true;
    this.dead = false;
    this.dragging = false; // flag for dragging
    // Keep dragOffset for initial offset (set on pickup)
    this.dragOffset = { x: 0, y: 0 };
    // Add physics properties for rotation
    this.rotation = 0;
    this.angularVelocity = 0;
    this.lastDx = 0;
    this.lastDy = 0;
    
    this.movementState = 'vertical'; // 'vertical' or 'horizontal'
    this.blocked = false;
    this.pathfindDelay = 0;
    this.avoidanceDirection = 1; // 1 or -1 for trying alternate paths
    
    this.targetAngle = null;  // Add this property
    
    this.update = function update(){
        if(this.dead){
            if(this.dragging){
                let desiredX = logo.x + this.dragOffset.x;
                let desiredY = logo.y + this.dragOffset.y;
                
                const dx = desiredX - this.img.x;
                const dy = desiredY - this.img.y;
                
                // Reduced rotation response
                if(Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                    const deltaChange = Math.abs((dx - this.lastDx) + (dy - this.lastDy));
                    // Reduced multiplier from 0.01 to 0.003
                    this.angularVelocity += deltaChange * 0.003;
                    // Add maximum angular velocity cap
                    this.angularVelocity = Math.min(Math.max(this.angularVelocity, -0.1), 0.1);
                }
                
                this.img.x += dx * 0.15;
                this.img.y += dy * 0.15;
                
                this.rotation += this.angularVelocity;
                // Increased damping from 0.95 to 0.9 for quicker stabilization
                this.angularVelocity *= 0.9;
                
                this.lastDx = dx;
                this.lastDy = dy;
                
                this.img.angle = this.rotation;
            } else {
                // Reset physics when dropped
                this.angularVelocity = 0;
                // Don't reset rotation to 0 when dropped, let it stay at current angle
                this.img.angle = this.rotation;
            }
            
            // Rest of dead body rendering...
            if(this.bloodAlpha === undefined) {
                this.bloodAlpha = 1;
            }
            if(this.bloodX === undefined) {
                this.bloodX = this.img.x;
                this.bloodY = this.img.y;
                this.bloodW = this.img.w;
                this.bloodH = this.img.h;
            }
            // Draw the blood splat first (it stays on the floor)
            ctx.save();
            ctx.globalAlpha = this.bloodAlpha;
            ctx.drawImage(bloodSplatImgRef, this.bloodX, this.bloodY, this.bloodW, this.bloodH);
            ctx.restore();
            // Then draw the dead body on top
            this.img.ref = customerDeadImgRef;
            this.img.vX = 0;
            this.img.vY = 0;
            this.img.update();
            // Fade away over 600 frames (~30 sec at 20 fps)
            this.bloodAlpha = Math.max(this.bloodAlpha - (1/600), 0);
            return;
        }

        // Check for collisions before moving
        for (const wall of mapWalls) {
            if (this.willCollide(wall, this.img.vX, this.img.vY)) {
                this.blocked = true;
                break;
            }
        }

        // Basic pathfinding logic
        if (!this.hasOrdered && !this.hasEaten) {
            // Adjust target position to be in front of register, not inside it
            let targetX = register.img.x + register.img.w + 30; // Stand 30px away from register
            
            if (this.blocked || this.pathfindDelay <= 0) {
                this.movementState = this.movementState === 'vertical' ? 'horizontal' : 'vertical';
                this.blocked = false;
                this.pathfindDelay = 20;
                this.avoidanceDirection *= -1;
            }

            // When in horizontal movement state, move towards the register
            if (this.movementState === 'horizontal') {
                if (Math.abs(this.img.x - targetX) > 5) {
                    this.img.vX = this.img.x > targetX ? -customerSpeed : customerSpeed;
                } else {
                    this.img.vX = 0;
                }
            } else {
                this.img.vX = 0;
            }

            // Note: vertical movement is now handled by the render function
        }
        
        // ...rest of the update function (chair movement, animations, etc.)...
        if (this.chair && !this.hasEaten) {
            // Move to chair one direction at a time
            let targetX = this.chair.img.x;
            let targetY = this.chair.img.y;

            if (this.movementState === 'vertical') {
                if (Math.abs(this.img.y - targetY) > 5) {
                    this.img.vY = this.img.y > targetY ? -customerSpeed : customerSpeed;
                    this.img.vX = 0;
                } else {
                    this.movementState = 'horizontal';
                }
            } else {
                if (Math.abs(this.img.x - targetX) > 5) {
                    this.img.vX = this.img.x > targetX ? -customerSpeed : customerSpeed;
                    this.img.vY = 0;
                } else {
                    this.movementState = 'vertical';
                }
            }
        } else if (this.hasEaten) {
            // Move straight up to exit
            this.img.vX = 0;
            this.img.vY = -customerSpeed;
        }

        this.pathfindDelay--;

        // Apply movement
        this.img.x += this.img.vX;
        this.img.y += this.img.vY;

        // Animation updates
        if(this.img.vX !== 0 || this.img.vY !== 0){
            this.walkFrameCounter++;
            if(this.walkFrameCounter >= 10){
                this.useWalkingFrame1 = !this.useWalkingFrame1;
                this.walkFrameCounter = 0;
            }
            this.img.ref = this.targeted
                ? (this.useWalkingFrame1 ? this.images.killWalk1 : this.images.killWalk2)
                : (this.useWalkingFrame1 ? this.images.walk1 : this.images.walk2);
        } else {
            this.img.ref = this.targeted ? this.images.killStand : this.images.stand;
        }
        
        // Update image angle based on movement direction
        if (this.img.vX > 0) this.img.angle = Math.PI/2;
        else if (this.img.vX < 0) this.img.angle = 3*Math.PI/2;
        else if (this.img.vY > 0) this.img.angle = Math.PI;
        else if (this.img.vY < 0) this.img.angle = 0;

        // When sitting at a chair, orient towards the table (only facing up or down)
        if (this.chair && !this.hasEaten && 
            Math.abs(this.img.x - this.chair.x) < 10 && 
            Math.abs(this.img.y - this.chair.y) < 10) {
            let tableCenterY = this.chair.tableY + this.chair.tableHeight / 2;
            // If customer is above table center, face down (Math.PI); otherwise, face up (0)
            this.img.angle = this.img.y < tableCenterY ? Math.PI : 0;
            this.img.vX = 0;
            this.img.vY = 0;
        }

        this.img.update();
    }

    this.willCollide = function(obstacle, vX, vY) {
        let nextX = this.img.x + vX;
        let nextY = this.img.y + vY;
        return (nextX < obstacle.x + obstacle.w &&
                nextX + this.img.w > obstacle.x &&
                nextY < obstacle.y + obstacle.h &&
                nextY + this.img.h > obstacle.y);
    }
}

function DialogBox() {
    this.isActive = false;
    this.text = "";
    this.fullText = "";
    this.charIndex = 0;
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
        this.options = null;
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
        } else {
            // Close dialog
            this.isActive = false;
        }
    }
}

const dialogBox = new DialogBox();

// Update test dialog messages with instructions
//dialogBox.showDialog("Hello! Press SPACE to advance or close dialog messages.");
//dialogBox.showDialog("This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!This will show up after the first one!");

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
// // HERE IS AN EXAMPLE OF ADDING A CHOICE DIALONG Test: Show a choice dialog at the start
// window.addEventListener("load", function() {
//     dialogBox.showChoiceDialog(
//         "Start the game?",
//         ["Yes", "No", "Maybe"],
//         function(choice) {
//             console.log("User selected:", choice);
//             // Add the event you want to do with the choice
//         }
//     );
// });

// New helper function to calculate minimal angle difference
function angleDifference(a, b) {
    let diff = a - b;
    while(diff < -Math.PI) diff += 2*Math.PI;
    while(diff > Math.PI) diff -= 2*Math.PI;
    return diff;
}

//failGame();
