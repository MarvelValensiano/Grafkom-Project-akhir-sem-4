const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const modeLabel = document.getElementById("modeLabel");
const objectCountLabel = document.getElementById("objectCount");
const animationStatusLabel = document.getElementById("animationStatus");
const animateBtn = document.getElementById("animateBtn");

const modeButtons = {
    line: document.getElementById("lineBtn"),
    circle: document.getElementById("circleBtn"),
    ellipse: document.getElementById("ellipseBtn"),
    square: document.getElementById("squareBtn"),
    triangle: document.getElementById("triangleBtn"),
    translate: document.getElementById("translateBtn"),
    scale: document.getElementById("scaleBtn"),
    rotate: document.getElementById("rotateBtn")
};

const modeLabels = {
    line: "Garis DDA",
    circle: "Lingkaran",
    ellipse: "Elips",
    square: "Persegi",
    triangle: "Segitiga",
    translate: "Translasi",
    scale: "Scaling",
    rotate: "Rotasi"
};

const selectionColor = "#1f7a8c";

let mode = "line";

let startX, startY;
let isDrawing = false;

function updateStatus(){

    if(modeLabel){
        modeLabel.textContent = modeLabels[mode] || mode;
    }

    if(objectCountLabel){
        objectCountLabel.textContent = objects.length;
    }

    if(animationStatusLabel){
        animationStatusLabel.textContent = animationRunning ? "ON" : "OFF";
    }
}

function setMode(nextMode){

    mode = nextMode;

    Object.keys(modeButtons).forEach((key) => {

        const button = modeButtons[key];

        if(!button) return;

        const isActive = key === mode;

        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    updateStatus();
}

function updateAnimationButton(){

    if(!animateBtn) return;

    animateBtn.classList.toggle("is-active", animationRunning);
    animateBtn.setAttribute("aria-pressed", animationRunning ? "true" : "false");

    updateStatus();
}

function getCanvasPoint(event){

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: Math.floor((event.clientX - rect.left) * scaleX),
        y: Math.floor((event.clientY - rect.top) * scaleY)
    };
}

function saveState(){

    undoStack.push(
        JSON.parse(JSON.stringify(objects))
    );

    redoStack = [];
}

function undo(){

    if(undoStack.length === 0) return;

    redoStack.push(
        JSON.parse(JSON.stringify(objects))
    );

    objects = undoStack.pop();

    redrawCanvas();
    updateStatus();
}

function redo(){

    if(redoStack.length === 0) return;

    undoStack.push(
        JSON.parse(JSON.stringify(objects))
    );

    objects = redoStack.pop();

    redrawCanvas();
    updateStatus();
}

/*
========================
ARRAY OBJECT
========================
*/

let objects = [];
let selectedObject = null;
let isDragging = false;

let lastMouseX = 0;
let lastMouseY = 0;
let currentColor = "#000000";
let undoStack = [];
let redoStack = [];
let animationRunning = false;
let previewObject = null;

setMode("line");
updateAnimationButton();

/*
========================
BUTTON
========================
*/

document.getElementById("lineBtn").onclick = () => {
    setMode("line");
};

document.getElementById("circleBtn").onclick = () => {
    setMode("circle");
};

document.getElementById("ellipseBtn").onclick = () => {
    setMode("ellipse");
};

document.getElementById("squareBtn").onclick = () => {
    setMode("square");
};

document.getElementById("triangleBtn").onclick = () => {
    setMode("triangle");
};

document.getElementById("clearBtn").onclick = () => {

    objects = [];

    redrawCanvas();
    updateStatus();
};

document.getElementById("translateBtn").onclick = () => {
    setMode("translate");
};

document.getElementById("scaleBtn").onclick = () => {
    setMode("scale");
};

document.getElementById("rotateBtn").onclick = () => {
    setMode("rotate");
};

document.getElementById("animateBtn").onclick = () => {

    toggleAnimation();
};

document.getElementById("colorPicker")
.addEventListener("input", function(e){

    currentColor = e.target.value;

    /*
    ========================
    CHANGE SELECTED OBJECT COLOR
    ========================
    */

    if(selectedObject){

        saveState();

        selectedObject.color = currentColor;

        redrawCanvas();
    }
});

document.getElementById("undoBtn").onclick = () => {

    undo();
};

document.getElementById("redoBtn").onclick = () => {

    redo();
};
/*
========================
CANVAS CLICK
========================
*/

canvas.addEventListener("click", function(e){

    const { x, y } = getCanvasPoint(e);

    if(
        mode === "translate" ||
        mode === "scale" ||
        mode === "rotate"
    ){
        selectObject(x, y);
        return;
    }

    if(!isDrawing){

        startX = x;
        startY = y;

        isDrawing = true;

    }else{
        saveState();
        if(mode === "line"){

            objects.push({
                type: "line",
                x1: startX,
                y1: startY,
                x2: x,
                y2: y,
                vx: 2,
                vy: 2,
                color: currentColor,
            });

        }else if(mode === "circle"){

            let radius = Math.sqrt(
                Math.pow(x - startX, 2) +
                Math.pow(y - startY, 2)
            );

            objects.push({
                type: "circle",
                xc: startX,
                yc: startY,
                r: Math.round(radius),
                vx: 2,
                vy: 2,
                color: currentColor
            });

        }else if(mode === "ellipse"){

            let rx = Math.abs(x - startX);
            let ry = Math.abs(y - startY);

            objects.push({
                type: "ellipse",
                xc: startX,
                yc: startY,
                rx: rx,
                ry: ry,
                vx: 2,
                vy: 2,
                color: currentColor
            });

        }else if(mode === "square"){

            const points = createSquarePoints(startX, startY, x, y);
            const center = getPointsCenter(points);

            objects.push({
                type: "square",
                points: points,
                centerX: center.x,
                centerY: center.y,
                vx: 2,
                vy: 2,
                color: currentColor
            });

        }else if(mode === "triangle"){

            const points = createTrianglePoints(startX, startY, x, y);
            const center = getPointsCenter(points);

            objects.push({
                type: "triangle",
                points: points,
                centerX: center.x,
                centerY: center.y,
                vx: 2,
                vy: 2,
                color: currentColor
            });
        }

        redrawCanvas();
        updateStatus();

        previewObject = null;

        isDrawing = false;
    }
});


canvas.addEventListener("mousemove", function(e){

    if(isDragging && selectedObject){

        const { x, y } = getCanvasPoint(e);
    
        const dx = x - lastMouseX;
        const dy = y - lastMouseY;

        translateObject(selectedObject, dx, dy);
    
        lastMouseX = x;
        lastMouseY = y;
    
        redrawCanvas();
    
        return;
    }

    if(!isDrawing) return;

    const { x, y } = getCanvasPoint(e);

    if(mode === "line"){

        previewObject = {
            type: "line",
            x1: startX,
            y1: startY,
            x2: x,
            y2: y
        };

    }else if(mode === "circle"){

        let radius = Math.sqrt(
            Math.pow(x - startX, 2) +
            Math.pow(y - startY, 2)
        );

        previewObject = {
            type: "circle",
            xc: startX,
            yc: startY,
            r: Math.round(radius)
        };

    }else if(mode === "ellipse"){

        previewObject = {
            type: "ellipse",
            xc: startX,
            yc: startY,
            rx: Math.abs(x - startX),
            ry: Math.abs(y - startY)
        };

    }else if(mode === "square"){

        previewObject = {
            type: "square",
            points: createSquarePoints(startX, startY, x, y)
        };

    }else if(mode === "triangle"){

        previewObject = {
            type: "triangle",
            points: createTrianglePoints(startX, startY, x, y)
        };
    }

    redrawCanvas();
});

canvas.addEventListener("mousedown", function(e){

    if(mode !== "translate") return;

    const { x, y } = getCanvasPoint(e);

    selectObject(x, y);

    if(selectedObject){
        saveState();
        isDragging = true;

        lastMouseX = x;
        lastMouseY = y;
    }
});

canvas.addEventListener("mouseup", function(){

    isDragging = false;
});

canvas.addEventListener("mouseleave", function(){

    isDragging = false;
});
/*
========================
REDRAW CANVAS
========================
*/

function redrawCanvas(){

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /*
    ========================
    DRAW SAVED OBJECTS
    ========================
    */

    for(let obj of objects){

        if(obj === selectedObject){
    
            drawObject(obj, selectionColor);
    
        }else{
    
            drawObject(obj, obj.color);
        }
    }

    /*
    ========================
    DRAW PREVIEW
    ========================
    */

    if(previewObject){

        drawObject(previewObject, currentColor);
    }
}


function drawObject(obj, color){

    if(obj.type === "line"){

        drawLineDDA(
            obj.x1,
            obj.y1,
            obj.x2,
            obj.y2,
            color
        );

    }else if(obj.type === "circle"){

        drawCircle(
            obj.xc,
            obj.yc,
            obj.r,
            color
        );

    }else if(obj.type === "ellipse"){

        drawEllipse(
            obj.xc,
            obj.yc,
            obj.rx,
            obj.ry,
            color,
            obj.angle || 0
        );

    }else if(obj.points && Array.isArray(obj.points)){

        drawPolygon(obj.points, color);
    }
}



function createSquarePoints(x1, y1, x2, y2){

    const dx = x2 - x1;
    const dy = y2 - y1;

    const side = Math.max(Math.abs(dx), Math.abs(dy));
    const sx = dx >= 0 ? 1 : -1;
    const sy = dy >= 0 ? 1 : -1;

    const xEnd = x1 + (sx * side);
    const yEnd = y1 + (sy * side);

    return [
        { x: x1, y: y1 },
        { x: xEnd, y: y1 },
        { x: xEnd, y: yEnd },
        { x: x1, y: yEnd }
    ];
}

function createTrianglePoints(x1, y1, x2, y2){

    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const midX = (minX + maxX) / 2;

    return [
        { x: midX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY }
    ];
}

function createPolygonPointsFromRegularShape(cx, cy, radius, sides, rotationOffset = -Math.PI / 2){

    const points = [];

    for(let i = 0; i < sides; i++){

        const theta = rotationOffset + (2 * Math.PI * i / sides);

        points.push({
            x: cx + radius * Math.cos(theta),
            y: cy + radius * Math.sin(theta)
        });
    }

    return points;
}

function getObjectPoints(obj){

    if(obj.points && Array.isArray(obj.points)){
        return obj.points;
    }

    return null;
}

function getObjectBounds(obj){

    const points = getObjectPoints(obj);

    if(!points || points.length === 0){
        return null;
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);

    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys)
    };
}

function getObjectCenter(obj){

    if(obj.type === "line"){

        return {
            x: (obj.x1 + obj.x2) / 2,
            y: (obj.y1 + obj.y2) / 2
        };
    }

    if(obj.type === "circle"){

        return {
            x: obj.xc,
            y: obj.yc
        };
    }

    if(obj.type === "ellipse"){

        return {
            x: obj.xc,
            y: obj.yc
        };
    }

    const points = getObjectPoints(obj);

    if(points && points.length > 0){

        const sum = points.reduce((acc, point) => {
            acc.x += point.x;
            acc.y += point.y;
            return acc;
        }, { x: 0, y: 0 });

        return {
            x: sum.x / points.length,
            y: sum.y / points.length
        };
    }

    return { x: 0, y: 0 };
}


function getPointsCenter(points){

    if(!points || points.length === 0){
        return { x: 0, y: 0 };
    }

    const sum = points.reduce((acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
    }), { x: 0, y: 0 });

    return {
        x: sum.x / points.length,
        y: sum.y / points.length
    };
}

function pointInPolygon(x, y, points){

    let inside = false;

    for(let i = 0, j = points.length - 1; i < points.length; j = i++){

        const xi = points[i].x;
        const yi = points[i].y;
        const xj = points[j].x;
        const yj = points[j].y;

        const intersect =
            ((yi > y) !== (yj > y)) &&
            (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi);

        if(intersect){
            inside = !inside;
        }
    }

    return inside;
}

function drawPolygon(points, color = "black"){

    if(!points || points.length < 2) return;

    for(let i = 0; i < points.length; i++){

        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];

        drawLineDDA(
            Math.round(p1.x),
            Math.round(p1.y),
            Math.round(p2.x),
            Math.round(p2.y),
            color
        );
    }
}

function selectObject(x, y){

    selectedObject = null;

    for(let obj of objects){

        if(obj.type === "line"){

            let minX = Math.min(obj.x1, obj.x2) - 5;
            let maxX = Math.max(obj.x1, obj.x2) + 5;

            let minY = Math.min(obj.y1, obj.y2) - 5;
            let maxY = Math.max(obj.y1, obj.y2) + 5;

            if(
                x >= minX &&
                x <= maxX &&
                y >= minY &&
                y <= maxY
            ){
                selectedObject = obj;
            }

        }else if(obj.type === "circle"){

            let distance = Math.sqrt(
                Math.pow(x - obj.xc, 2) +
                Math.pow(y - obj.yc, 2)
            );

            if(distance <= obj.r){

                selectedObject = obj;
            }

        }else if(obj.type === "ellipse"){

            let value =
                (
                    Math.pow(x - obj.xc, 2) /
                    Math.pow(obj.rx, 2)
                ) +
                (
                    Math.pow(y - obj.yc, 2) /
                    Math.pow(obj.ry, 2)
                );

            if(value <= 1){

                selectedObject = obj;
            }

        }else if(obj.points && Array.isArray(obj.points)){

            if(pointInPolygon(x, y, obj.points)){

                selectedObject = obj;
            }
        }
    }

    if(selectedObject){

        currentColor = selectedObject.color;

        document.getElementById("colorPicker").value =
            selectedObject.color;
    }

    redrawCanvas();
}

function translateObject(obj, tx, ty){

    if(obj.type === "line"){

        obj.x1 += tx;
        obj.y1 += ty;

        obj.x2 += tx;
        obj.y2 += ty;

    }else if(obj.type === "circle"){

        obj.xc += tx;
        obj.yc += ty;

    }else if(obj.type === "ellipse"){

        obj.xc += tx;
        obj.yc += ty;

    }else if(obj.points && Array.isArray(obj.points)){

        obj.points.forEach((point) => {

            point.x += tx;
            point.y += ty;
        });
    }
}

function scaleObject(obj, scaleFactor){

    if(obj.type === "line"){

        let centerX = (obj.x1 + obj.x2) / 2;
        let centerY = (obj.y1 + obj.y2) / 2;

        obj.x1 =
            centerX +
            (obj.x1 - centerX) * scaleFactor;

        obj.y1 =
            centerY +
            (obj.y1 - centerY) * scaleFactor;

        obj.x2 =
            centerX +
            (obj.x2 - centerX) * scaleFactor;

        obj.y2 =
            centerY +
            (obj.y2 - centerY) * scaleFactor;

    }else if(obj.type === "circle"){

        obj.r *= scaleFactor;

    }else if(obj.type === "ellipse"){

        obj.rx *= scaleFactor;
        obj.ry *= scaleFactor;

    }else if(obj.points && Array.isArray(obj.points)){

        const center = getObjectCenter(obj);

        obj.points.forEach((point) => {

            point.x = center.x + (point.x - center.x) * scaleFactor;
            point.y = center.y + (point.y - center.y) * scaleFactor;
        });
    }
}

function rotateObject(obj, angle){

    let radian = angle * Math.PI / 180;

    /*
    ========================
    LINE
    ========================
    */

    if(obj.type === "line"){

        let centerX = (obj.x1 + obj.x2) / 2;
        let centerY = (obj.y1 + obj.y2) / 2;

        let p1 = rotatePoint(
            obj.x1,
            obj.y1,
            centerX,
            centerY,
            radian
        );

        let p2 = rotatePoint(
            obj.x2,
            obj.y2,
            centerX,
            centerY,
            radian
        );

        obj.x1 = p1.x;
        obj.y1 = p1.y;

        obj.x2 = p2.x;
        obj.y2 = p2.y;
    }

    /*
    ========================
    ELLIPSE
    ========================
    */

    else if(obj.type === "ellipse"){

        if(!obj.angle){

            obj.angle = 0;
        }

        obj.angle += angle;
    }

    /*
    ========================
    CIRCLE
    ========================
    */

    else if(obj.type === "circle"){

        /*
        Circle tidak terlihat berubah
        karena simetris.
        */

    }else if(obj.points && Array.isArray(obj.points)){

        const center = getObjectCenter(obj);

        obj.points.forEach((point) => {

            const rotated = rotatePoint(
                point.x,
                point.y,
                center.x,
                center.y,
                radian
            );

            point.x = rotated.x;
            point.y = rotated.y;
        });
    }
}

function rotatePoint(x, y, cx, cy, radian){

    let newX =
        cx +
        (x - cx) * Math.cos(radian) -
        (y - cy) * Math.sin(radian);

    let newY =
        cy +
        (x - cx) * Math.sin(radian) +
        (y - cy) * Math.cos(radian);

    return {
        x: newX,
        y: newY
    };
}

function toggleAnimation(){

    animationRunning = !animationRunning;

    updateAnimationButton();

    if(animationRunning){

        animate();
    }
}

function animate(){

    if(!animationRunning) return;

    for(let obj of objects){

        moveObject(obj);

        checkCollision(obj);
    }

    redrawCanvas();

    requestAnimationFrame(animate);
}

function moveObject(obj){

    translateObject(obj, obj.vx, obj.vy);
}

function checkCollision(obj){

    /*
    ========================
    LINE
    ========================
    */

    if(obj.type === "line"){

        let minX = Math.min(obj.x1, obj.x2);
        let maxX = Math.max(obj.x1, obj.x2);

        let minY = Math.min(obj.y1, obj.y2);
        let maxY = Math.max(obj.y1, obj.y2);

        if(minX <= 0 || maxX >= canvas.width){

            obj.vx *= -1;
        }

        if(minY <= 0 || maxY >= canvas.height){

            obj.vy *= -1;
        }
    }

    /*
    ========================
    CIRCLE
    ========================
    */

    else if(obj.type === "circle"){

        if(
            obj.xc - obj.r <= 0 ||
            obj.xc + obj.r >= canvas.width
        ){
            obj.vx *= -1;
        }

        if(
            obj.yc - obj.r <= 0 ||
            obj.yc + obj.r >= canvas.height
        ){
            obj.vy *= -1;
        }
    }

    /*
    ========================
    ELLIPSE
    ========================
    */

    else if(obj.type === "ellipse"){

        if(
            obj.xc - obj.rx <= 0 ||
            obj.xc + obj.rx >= canvas.width
        ){
            obj.vx *= -1;
        }

        if(
            obj.yc - obj.ry <= 0 ||
            obj.yc + obj.ry >= canvas.height
        ){
            obj.vy *= -1;
        }
    }

    else if(obj.points && Array.isArray(obj.points)){

        const bounds = getObjectBounds(obj);

        if(!bounds) return;

        if(bounds.minX <= 0 || bounds.maxX >= canvas.width){
            obj.vx *= -1;
        }

        if(bounds.minY <= 0 || bounds.maxY >= canvas.height){
            obj.vy *= -1;
        }
    }
}

/*
========================
DRAW PIXEL
========================
*/

function drawPixel(x, y, color = "black"){

    ctx.fillStyle = color;

    ctx.fillRect(x, y, 1, 1);
}

/*
========================
DDA LINE
========================
*/

function drawLineDDA(x1, y1, x2, y2, color = "black"){

    let dx = x2 - x1;
    let dy = y2 - y1;

    let steps = Math.max(
        Math.abs(dx),
        Math.abs(dy)
    );

    let xIncrement = dx / steps;
    let yIncrement = dy / steps;

    let x = x1;
    let y = y1;

    for(let i = 0; i <= steps; i++){

        drawPixel(
            Math.round(x),
            Math.round(y),
            color
        );

        x += xIncrement;
        y += yIncrement;
    }
}

/*
========================
CIRCLE
========================
*/

function drawCircle(xc, yc, r, color = "black"){

    let x = 0;
    let y = r;

    let p = 1 - r;

    drawCirclePoints(xc, yc, x, y, color);

    while(x < y){

        x++;

        if(p < 0){

            p += 2 * x + 1;

        }else{

            y--;

            p += 2 * (x - y) + 1;
        }

        drawCirclePoints(xc, yc, x, y, color);
    }
}

function drawCirclePoints(xc, yc, x, y, color){

    drawPixel(xc + x, yc + y, color);
    drawPixel(xc - x, yc + y, color);

    drawPixel(xc + x, yc - y, color);
    drawPixel(xc - x, yc - y, color);

    drawPixel(xc + y, yc + x, color);
    drawPixel(xc - y, yc + x, color);

    drawPixel(xc + y, yc - x, color);
    drawPixel(xc - y, yc - x, color);
}

/*
========================
ELLIPSE
========================
*/

function drawEllipse(
    xc,
    yc,
    rx,
    ry,
    color = "black",
    angle = 0
){

    ctx.save();

    ctx.translate(xc, yc);

    if(angle){
        ctx.rotate(angle * Math.PI / 180);
    }

    ctx.translate(-xc, -yc);
    let x = 0;
    let y = ry;

    let rxSq = rx * rx;
    let rySq = ry * ry;

    let dx = 2 * rySq * x;
    let dy = 2 * rxSq * y;

    let p1 =
        rySq -
        (rxSq * ry) +
        (0.25 * rxSq);

    while(dx < dy){

        drawEllipsePoints(xc, yc, x, y, color);

        x++;

        dx += 2 * rySq;

        if(p1 < 0){

            p1 += dx + rySq;

        }else{

            y--;

            dy -= 2 * rxSq;

            p1 += dx - dy + rySq;
        }
    }

    let p2 =
        (rySq * (x + 0.5) * (x + 0.5)) +
        (rxSq * (y - 1) * (y - 1)) -
        (rxSq * rySq);

    while(y >= 0){

        drawEllipsePoints(xc, yc, x, y, color);

        y--;

        dy -= 2 * rxSq;

        if(p2 > 0){

            p2 += rxSq - dy;

        }else{

            x++;

            dx += 2 * rySq;

            p2 += dx - dy + rxSq;
        }
    }

    ctx.restore();
}

function drawEllipsePoints(xc, yc, x, y, color){

    drawPixel(xc + x, yc + y, color);
    drawPixel(xc - x, yc + y, color);

    drawPixel(xc + x, yc - y, color);
    drawPixel(xc - x, yc - y, color);
}


document.addEventListener("keydown", function(e){

    if(!selectedObject) return;

    /*
    ========================
    TRANSLATE
    ========================
    */

    if(mode === "translate"){

        const step = 10;

        if(e.key === "ArrowLeft"){
            saveState();
            translateObject(selectedObject, -step, 0);

        }else if(e.key === "ArrowRight"){
            saveState();
            translateObject(selectedObject, step, 0);

        }else if(e.key === "ArrowUp"){
            saveState();
            translateObject(selectedObject, 0, -step);

        }else if(e.key === "ArrowDown"){
            saveState();
            translateObject(selectedObject, 0, step);
        }
    }

    /*
    ========================
    SCALE
    ========================
    */

    if(mode === "scale"){

        if(e.key === "+"){
            saveState();
            scaleObject(selectedObject, 1.1);

        }else if(e.key === "-"){
            saveState();
            scaleObject(selectedObject, 0.9);
        }
    }

    /*
    ========================
    ROTATE
    ========================
    */

    if(mode === "rotate"){

        const angle = 10;

        if(e.key === "q" || e.key === "Q"){
            saveState();
            rotateObject(selectedObject, -angle);

        }else if(e.key === "e" || e.key === "E"){
            saveState();
            rotateObject(selectedObject, angle);
        }
    }

    if(selectedObject){

        currentColor = selectedObject.color;
    
        document.getElementById("colorPicker").value =
            selectedObject.color;
    }
    
    redrawCanvas();
});