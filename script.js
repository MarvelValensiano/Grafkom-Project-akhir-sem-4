const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const modeLabel = document.getElementById("modeLabel");
const objectCountLabel = document.getElementById("objectCount");
const animationStatusLabel = document.getElementById("animationStatus");
const animateBtn = document.getElementById("animateBtn");

const modeButtons = {
    line: document.getElementById("lineBtn"),
    bresenham: document.getElementById("bresenhamBtn"),
    circle: document.getElementById("circleBtn"),
    ellipse: document.getElementById("ellipseBtn"),
    square: document.getElementById("squareBtn"),
    triangle: document.getElementById("triangleBtn"),
    brush: document.getElementById("brushBtn"),
    translate: document.getElementById("translateBtn"),
    scale: document.getElementById("scaleBtn"),
    rotate: document.getElementById("rotateBtn"),
    shear: document.getElementById("shearBtn")
};

const modeLabels = {
    line: "Garis DDA",
    bresenham: "Garis Bresenham",
    circle: "Lingkaran",
    ellipse: "Elips",
    square: "Persegi",
    triangle: "Segitiga",
    brush: "Brush",
    translate: "Translasi",
    scale: "Scaling",
    rotate: "Rotasi",
    shear: "Shear"
};

const selectionColor = "#1f7a8c";

let mode = "line";

let startX, startY;
let mouseX = 0, mouseY = 0;
let isBuilding = false;
let buildPoints = [];

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

    if(isBuilding){

        isBuilding = false;
        buildPoints = [];
        buildPreviewObject = null;
        previewObject = null;
        redrawCanvas();
    }

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
let selectedObjects = [];
let isDragging = false;

function isPolygonLike(obj){
    return obj.type === "polyline" || obj.type === "square" || obj.type === "triangle";
}

function isSelected(obj){
    return selectedObjects.includes(obj);
}

function getPrimary(){
    return selectedObjects.length > 0 ? selectedObjects[selectedObjects.length - 1] : null;
}

function selectOnly(obj){

    selectedObjects = [obj];
}

function toggleSelect(obj){

    let idx = selectedObjects.indexOf(obj);

    if(idx !== -1){

        selectedObjects.splice(idx, 1);

    }else{

        selectedObjects.push(obj);
    }
}

let lastMouseX = 0;
let lastMouseY = 0;
let currentColor = "#000000";
let undoStack = [];
let redoStack = [];
let animationRunning = false;
let previewObject = null;
let buildPreviewObject = null;

let lineWidth = 1;
let fillCurrentColor = "#cccccc";
let fillOnDraw = false;
let intersectionEnabled = true;
let intersectionColor = "#ff6666";

let lastAngle = 0;

const SNAP_DISTANCE = 15;
let snapPoint = null;

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

document.getElementById("bresenhamBtn").onclick = () => {
    setMode("bresenham");
};

document.getElementById("circleBtn").onclick = () => {
    setMode("circle");
};

document.getElementById("ellipseBtn").onclick = () => {
    setMode("ellipse");
};

document.getElementById("clearBtn").onclick = () => {

    objects = [];

    redrawCanvas();
    updateStatus();
};

document.getElementById("squareBtn").onclick = () => {
    setMode("square");
};

document.getElementById("triangleBtn").onclick = () => {
    setMode("triangle");
};

document.getElementById("brushBtn").onclick = () => {
    setMode("brush");
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

document.getElementById("shearBtn").onclick = () => {
    setMode("shear");
};

document.getElementById("deleteBtn").onclick = () => {

    if(selectedObjects.length === 0) return;

    saveState();

    for(let obj of selectedObjects){

        let idx = objects.indexOf(obj);

        if(idx !== -1) objects.splice(idx, 1);
    }

    selectedObjects = [];

    redrawCanvas();
    updateStatus();
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

    let primary = getPrimary();

    if(primary){

        saveState();

        primary.color = currentColor;

        redrawCanvas();
    }
});

const fillBtn = document.getElementById("fillBtn");
fillBtn.onclick = () => {

    let primary = getPrimary();

    if(primary && (primary.type === "circle" || primary.type === "ellipse" || primary.type === "polyline" || primary.type === "square" || primary.type === "triangle")){

        saveState();

        for(let obj of selectedObjects){
            if(obj.type === "circle" || obj.type === "ellipse" || obj.type === "polyline" || obj.type === "square" || obj.type === "triangle"){
                if(obj.fillColor){
                    obj.fillColor = null;
                }else{
                    obj.fillColor = fillCurrentColor;
                }
            }
        }

        redrawCanvas();

    }else{

        fillOnDraw = !fillOnDraw;
        fillBtn.classList.toggle("is-active", fillOnDraw);
        fillBtn.setAttribute("aria-pressed", fillOnDraw ? "true" : "false");
    }
};

const intersectBtn = document.getElementById("intersectBtn");

if(intersectBtn){
    intersectBtn.classList.toggle("is-active", intersectionEnabled);
    intersectBtn.setAttribute("aria-pressed", intersectionEnabled ? "true" : "false");
}

intersectBtn.onclick = () => {
    intersectionEnabled = !intersectionEnabled;
    intersectBtn.classList.toggle("is-active", intersectionEnabled);
    intersectBtn.setAttribute("aria-pressed", intersectionEnabled ? "true" : "false");
    redrawCanvas();
};

document.getElementById("lineWidthRange")
.addEventListener("input", function(e){
    lineWidth = parseInt(e.target.value);
    document.getElementById("lineWidthValue").textContent = lineWidth;

    let primary = getPrimary();

    if(primary){
        saveState();
        for(let obj of selectedObjects) obj.lineWidth = lineWidth;
        redrawCanvas();
    }
});

document.getElementById("fillColorPicker")
.addEventListener("input", function(e){
    fillCurrentColor = e.target.value;

    let primary = getPrimary();

    if(primary && primary.fillColor){
        saveState();
        for(let obj of selectedObjects) obj.fillColor = fillCurrentColor;
        redrawCanvas();
    }
});

document.getElementById("intersectColorPicker")
.addEventListener("input", function(e){
    intersectionColor = e.target.value;
    redrawCanvas();
});

document.getElementById("undoBtn").onclick = () => {

    undo();
};

document.getElementById("redoBtn").onclick = () => {

    redo();
};
function findSnapPoint(x, y){

    let best = null;
    let bestDist = SNAP_DISTANCE;

    for(let obj of objects){

        if(isPolygonLike(obj)){

            for(let p of obj.points){

                let d = Math.sqrt(
                    Math.pow(p.x - x, 2) +
                    Math.pow(p.y - y, 2)
                );

                if(d < bestDist){
                    bestDist = d;
                    best = {x: p.x, y: p.y};
                }
            }

        }else if(obj.type === "circle" || obj.type === "ellipse"){

            let d = Math.sqrt(
                Math.pow(obj.xc - x, 2) +
                Math.pow(obj.yc - y, 2)
            );

            if(d < bestDist){
                bestDist = d;
                best = {x: obj.xc, y: obj.yc};
            }

        }else if(obj.type === "line"){

            for(let p of [{x: obj.x1, y: obj.y1}, {x: obj.x2, y: obj.y2}]){

                let d = Math.sqrt(
                    Math.pow(p.x - x, 2) +
                    Math.pow(p.y - y, 2)
                );

                if(d < bestDist){
                    bestDist = d;
                    best = {x: p.x, y: p.y};
                }
            }
        }
    }

    return best;
}

/*
========================
CANVAS MOUSE — CLICK-BASED + POLYLINE
========================
*/

canvas.addEventListener("mousedown", function(e){

    const { x, y } = getCanvasPoint(e);

    if(
        mode === "translate" ||
        mode === "scale" ||
        mode === "rotate" ||
        mode === "shear"
    ){

        if(e.shiftKey){

            selectObject(x, y, true);

        }else{

            selectObject(x, y, false);
        }

        if(selectedObjects.length === 0) return;

        if(mode !== "translate") return;

        saveState();
        isDragging = true;
        lastMouseX = x;
        lastMouseY = y;

        return;
    }

    if(mode === "brush"){

        isBuilding = true;
        buildPoints = [{x, y}];
        buildPreviewObject = null;
        previewObject = null;

        return;
    }
});

canvas.addEventListener("mousemove", function(e){

    const { x, y } = getCanvasPoint(e);

    mouseX = x;
    mouseY = y;

    if(isDragging && selectedObjects.length > 0 && mode === "translate"){

        const dx = x - lastMouseX;
        const dy = y - lastMouseY;

        for(let obj of selectedObjects) translateObject(obj, dx, dy);

        lastMouseX = x;
        lastMouseY = y;

        redrawCanvas();

        return;
    }

    if(mode === "brush" && isBuilding){

        let last = buildPoints[buildPoints.length - 1];

        let dist = Math.sqrt(
            Math.pow(x - last.x, 2) +
            Math.pow(y - last.y, 2)
        );

        if(dist >= 3){

            buildPoints.push({x, y});
            redrawCanvas();
        }

        return;
    }

    if(!isBuilding) return;

    if(mode === "circle"){

        let radius = Math.sqrt(
            Math.pow(x - startX, 2) +
            Math.pow(y - startY, 2)
        );

        previewObject = {
            type: "circle",
            xc: startX,
            yc: startY,
            r: Math.round(radius),
            lineWidth: lineWidth,
            fillColor: fillOnDraw ? fillCurrentColor : null
        };

    }else if(mode === "ellipse"){

        previewObject = {
            type: "ellipse",
            xc: startX,
            yc: startY,
            rx: Math.abs(x - startX),
            ry: Math.abs(y - startY),
            lineWidth: lineWidth,
            fillColor: fillOnDraw ? fillCurrentColor : null
        };

    }else if(mode === "square"){

        previewObject = {
            type: "square",
            points: createSquarePoints(startX, startY, x, y),
            lineWidth: lineWidth,
            fillColor: fillOnDraw ? fillCurrentColor : null
        };

    }else if(mode === "triangle"){

        previewObject = {
            type: "triangle",
            points: createTrianglePoints(startX, startY, x, y),
            lineWidth: lineWidth,
            fillColor: fillOnDraw ? fillCurrentColor : null
        };

    }else if(mode === "line" || mode === "bresenham"){

        if(buildPoints.length > 0){

            snapPoint = findSnapPoint(x, y);

            let rx = snapPoint ? snapPoint.x : x;
            let ry = snapPoint ? snapPoint.y : y;

            buildPreviewObject = {
                points: buildPoints.map(p => ({x: p.x, y: p.y})),
                lineType: mode === "bresenham" ? "bresenham" : "dda",
                rubberX: rx,
                rubberY: ry,
                lineWidth: lineWidth,
                snapX: snapPoint ? snapPoint.x : null,
                snapY: snapPoint ? snapPoint.y : null
            };
        }
    }

    redrawCanvas();
});

canvas.addEventListener("click", function(e){

    const { x, y } = getCanvasPoint(e);

    if(
        mode === "translate" ||
        mode === "scale" ||
        mode === "rotate" ||
        mode === "shear" ||
        mode === "brush"
    ){
        return;
    }

    if(mode === "circle" || mode === "ellipse" || mode === "square" || mode === "triangle"){

        if(!isBuilding){

            startX = x;
            startY = y;
            isBuilding = true;

        }else{

            saveState();

            if(mode === "circle"){

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
                    color: currentColor,
                    lineWidth: lineWidth,
                    fillColor: fillOnDraw ? fillCurrentColor : null
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
                    color: currentColor,
                    lineWidth: lineWidth,
                    fillColor: fillOnDraw ? fillCurrentColor : null
                });

            }else if(mode === "square"){

                let pts = createSquarePoints(startX, startY, x, y);

                objects.push({
                    type: "square",
                    points: pts,
                    color: currentColor,
                    lineWidth: lineWidth,
                    vx: 2,
                    vy: 2,
                    fillColor: fillOnDraw ? fillCurrentColor : null
                });

            }else if(mode === "triangle"){

                let pts = createTrianglePoints(startX, startY, x, y);

                objects.push({
                    type: "triangle",
                    points: pts,
                    color: currentColor,
                    lineWidth: lineWidth,
                    vx: 2,
                    vy: 2,
                    fillColor: fillOnDraw ? fillCurrentColor : null
                });
            }

            previewObject = null;
            isBuilding = false;
            buildPoints = [];

            redrawCanvas();
            updateStatus();
        }

        return;
    }

    if(mode === "line" || mode === "bresenham"){

        let sp = findSnapPoint(x, y);

        let px = sp ? sp.x : x;
        let py = sp ? sp.y : y;

        if(!isBuilding){

            isBuilding = true;
            buildPoints = [{x: px, y: py}];

        }else{

            buildPoints.push({x: px, y: py});
        }

        snapPoint = null;
        redrawCanvas();

        return;
    }
});

canvas.addEventListener("dblclick", function(e){

    if(mode === "brush") return;

    if(isBuilding && (mode === "line" || mode === "bresenham")){

        if(buildPoints.length >= 2){

            saveState();

            objects.push({
                type: "polyline",
                points: buildPoints.map(p => ({x: p.x, y: p.y})),
                lineType: mode === "bresenham" ? "bresenham" : "dda",
                color: currentColor,
                lineWidth: lineWidth,
                vx: 2,
                vy: 2,
                fillColor: fillOnDraw ? fillCurrentColor : null
            });
        }

        isBuilding = false;
        buildPoints = [];
        buildPreviewObject = null;

        redrawCanvas();
        updateStatus();
    }
});

canvas.addEventListener("wheel", function(e){

    if(mode !== "scale" || selectedObjects.length === 0) return;

    e.preventDefault();

    let factor = e.deltaY < 0 ? 1.1 : 0.9;

    saveState();
    for(let obj of selectedObjects) scaleObject(obj, factor);
    redrawCanvas();
});

canvas.addEventListener("mouseup", function(){

    if(mode === "brush" && isBuilding && buildPoints.length >= 2){

        saveState();

        objects.push({
            type: "polyline",
            points: buildPoints.map(p => ({x: p.x, y: p.y})),
            lineType: "dda",
            color: currentColor,
            lineWidth: lineWidth || 1,
            vx: 2,
            vy: 2,
            fillColor: fillOnDraw ? fillCurrentColor : null
        });

        isBuilding = false;
        buildPoints = [];
        buildPreviewObject = null;

        redrawCanvas();
        updateStatus();
    }

    isDragging = false;
});

canvas.addEventListener("mouseleave", function(){

    if(mode === "brush" && isBuilding){

        if(buildPoints.length >= 2){

            saveState();

            objects.push({
                type: "polyline",
                points: buildPoints.map(p => ({x: p.x, y: p.y})),
                lineType: "dda",
                color: currentColor,
                lineWidth: lineWidth || 1,
                vx: 2,
                vy: 2,
                fillColor: fillOnDraw ? fillCurrentColor : null
            });
        }

        isBuilding = false;
        buildPoints = [];
        buildPreviewObject = null;

        redrawCanvas();
        updateStatus();
    }

    isDragging = false;
});
/*
========================
REDRAW CANVAS
========================
*/

function drawSelectionBoxFor(selObj){

    if(!selObj) return;

    let minX, minY, maxX, maxY;

    if(selObj.type === "line"){

        minX = Math.min(selObj.x1, selObj.x2) - 6;
        maxX = Math.max(selObj.x1, selObj.x2) + 6;
        minY = Math.min(selObj.y1, selObj.y2) - 6;
        maxY = Math.max(selObj.y1, selObj.y2) + 6;

    }else if(selObj.type === "circle"){

        minX = selObj.xc - selObj.r - 6;
        maxX = selObj.xc + selObj.r + 6;
        minY = selObj.yc - selObj.r - 6;
        maxY = selObj.yc + selObj.r + 6;

    }else if(selObj.type === "ellipse"){

        minX = selObj.xc - selObj.rx - 6;
        maxX = selObj.xc + selObj.rx + 6;
        minY = selObj.yc - selObj.ry - 6;
        maxY = selObj.yc + selObj.ry + 6;

    }else if(isPolygonLike(selObj)){

        let pts = selObj.points;

        minX = Infinity;
        maxX = -Infinity;
        minY = Infinity;
        maxY = -Infinity;

        for(let p of pts){
            if(p.x < minX) minX = p.x;
            if(p.x > maxX) maxX = p.x;
            if(p.y < minY) minY = p.y;
            if(p.y > maxY) maxY = p.y;
        }

        minX -= 6;
        maxX += 6;
        minY -= 6;
        maxY += 6;
    }

    ctx.save();

    ctx.strokeStyle = "#1f7a8c";
    ctx.lineWidth = 1.5;

    ctx.setLineDash([4, 4]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    ctx.setLineDash([]);

    let handleSize = 5;
    let corners = [
        [minX, minY], [maxX, minY],
        [minX, maxY], [maxX, maxY]
    ];

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#1f7a8c";
    ctx.lineWidth = 1.5;

    for(let [hx, hy] of corners){

        ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    }

    ctx.restore();
}

function redrawCanvas(){

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /*
    ========================
    PASS 1: FILLS
    ========================
    */

    for(let obj of objects){

        drawObjectFill(obj);
    }

    /*
    ========================
    PASS 2: INTERSECTIONS
    ========================
    */

    drawIntersections();

    /*
    ========================
    PASS 3: OUTLINES
    ========================
    */

    for(let obj of objects){

        if(isSelected(obj)){
    
            drawObject(obj, selectionColor);
    
        }else{
    
            drawObject(obj, obj.color);
        }
    }

    /*
    ========================
    PASS 4: SELECTION BOX
    ========================
    */

    for(let selObj of selectedObjects) drawSelectionBoxFor(selObj);

    /*
    ========================
    DRAW PREVIEW
    ========================
    */

    if(previewObject){

        drawObjectFill(previewObject);
        drawObject(previewObject, currentColor);
    }

    /*
    ========================
    DRAW POLYLINE BUILD PREVIEW
    ========================
    */

    if(buildPreviewObject){

        let bp = buildPreviewObject;

        let algo = bp.lineType || "dda";
        let sz = bp.lineWidth || 1;
        let pts = bp.points;

        for(let i = 0; i < pts.length - 1; i++){

            let p1 = pts[i];
            let p2 = pts[i + 1];

            if(algo === "bresenham"){

                drawLineBresenham(p1.x, p1.y, p2.x, p2.y, currentColor, sz);

            }else{

                drawLineDDA(p1.x, p1.y, p2.x, p2.y, currentColor, sz);
            }
        }

        if(pts.length > 0){

            let last = pts[pts.length - 1];

            if(algo === "bresenham"){

                drawLineBresenham(last.x, last.y, bp.rubberX, bp.rubberY, currentColor, sz);

            }else{

                drawLineDDA(last.x, last.y, bp.rubberX, bp.rubberY, currentColor, sz);
            }
        }
    }

    /*
    ========================
    DRAW BRUSH PREVIEW
    ========================
    */

    if(mode === "brush" && isBuilding && buildPoints.length > 0){

        let pts = buildPoints;
        let sz = lineWidth || 1;

        for(let i = 0; i < pts.length - 1; i++){

            let p1 = pts[i];
            let p2 = pts[i + 1];

            drawLineDDA(p1.x, p1.y, p2.x, p2.y, currentColor, sz);
        }
    }

    /*
    ========================
    DRAW SNAP INDICATOR
    ========================
    */

    if(snapPoint){

        ctx.save();

        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = "rgba(255, 102, 0, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(snapPoint.x, snapPoint.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = "#ff6600";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(snapPoint.x, snapPoint.y, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(snapPoint.x - 5, snapPoint.y);
        ctx.lineTo(snapPoint.x + 5, snapPoint.y);
        ctx.moveTo(snapPoint.x, snapPoint.y - 5);
        ctx.lineTo(snapPoint.x, snapPoint.y + 5);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(snapPoint.x, snapPoint.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ff6600";
        ctx.fill();

        ctx.restore();
    }
}


function isInside(obj, x, y){

    if(obj.type === "circle"){

        let px = x;
        let py = y;

        if(obj.shearX){

            px = x - (y - obj.yc) * obj.shearX;
            py = y;
        }

        let dist = Math.sqrt(
            Math.pow(px - obj.xc, 2) +
            Math.pow(py - obj.yc, 2)
        );

        return dist <= obj.r;

    }else if(obj.type === "ellipse"){

        let px = x;
        let py = y;

        if(obj.shearX){

            px = x - (y - obj.yc) * obj.shearX;
            py = y;
        }

        let cos = Math.cos((obj.angle || 0) * Math.PI / 180);
        let sin = Math.sin((obj.angle || 0) * Math.PI / 180);

        let dx = px - obj.xc;
        let dy = py - obj.yc;

        let rxCos = dx * cos + dy * sin;
        let rySin = -dx * sin + dy * cos;

        return (
            (rxCos * rxCos) / (obj.rx * obj.rx) +
            (rySin * rySin) / (obj.ry * obj.ry)
        ) <= 1;

    }else if(isPolygonLike(obj) && obj.fillColor){

        let pts = obj.points;

        if(!pts || pts.length < 3) return false;

        let inside = false;

        for(let i = 0, j = pts.length - 1; i < pts.length; j = i++){

            let xi = pts[i].x, yi = pts[i].y;
            let xj = pts[j].x, yj = pts[j].y;

            if(
                (yi > y) !== (yj > y) &&
                x < (xj - xi) * (y - yi) / (yj - yi) + xi
            ){
                inside = !inside;
            }
        }

        return inside;
    }

    return false;
}

function drawIntersections(){

    if(!intersectionEnabled) return;

    let filledObjects;

    let isFillable = o => o.fillColor && (o.type === "circle" || o.type === "ellipse" || isPolygonLike(o));

    if(selectedObjects.length >= 2){

        filledObjects = selectedObjects.filter(isFillable);

    }else{

        filledObjects = objects.filter(isFillable);
    }

    for(let i = 0; i < filledObjects.length; i++){

        for(let j = i + 1; j < filledObjects.length; j++){

            let a = filledObjects[i];
            let b = filledObjects[j];

            function getBounds(o){

                if(isPolygonLike(o)){

                    let minX = Infinity, maxX = -Infinity;
                    let minY = Infinity, maxY = -Infinity;

                    for(let p of o.points){
                        if(p.x < minX) minX = p.x;
                        if(p.x > maxX) maxX = p.x;
                        if(p.y < minY) minY = p.y;
                        if(p.y > maxY) maxY = p.y;
                    }

                    return {minX, maxX, minY, maxY};

                }else{

                    return {
                        minX: o.xc - (o.type === "circle" ? o.r : o.rx),
                        maxX: o.xc + (o.type === "circle" ? o.r : o.rx),
                        minY: o.yc - (o.type === "circle" ? o.r : o.ry),
                        maxY: o.yc + (o.type === "circle" ? o.r : o.ry)
                    };
                }
            }

            let ba = getBounds(a);
            let bb = getBounds(b);

            let minX = Math.max(ba.minX, bb.minX);
            let maxX = Math.min(ba.maxX, bb.maxX);
            let minY = Math.max(ba.minY, bb.minY);
            let maxY = Math.min(ba.maxY, bb.maxY);

            minX = Math.max(0, Math.floor(minX));
            maxX = Math.min(canvas.width - 1, Math.ceil(maxX));
            minY = Math.max(0, Math.floor(minY));
            maxY = Math.min(canvas.height - 1, Math.ceil(maxY));

            for(let py = minY; py <= maxY; py++){

                for(let px = minX; px <= maxX; px++){

                    if(isInside(a, px, py) && isInside(b, px, py)){

                        drawPixel(px, py, intersectionColor);
                    }
                }
            }
        }
    }
}

function drawPolyline(obj, color){

    let pts = obj.points;

    if(!pts || pts.length < 2) return;

    let algo = obj.lineType || "dda";
    let sz = obj.lineWidth || 1;

    for(let i = 0; i < pts.length - 1; i++){

        let p1 = pts[i];
        let p2 = pts[i + 1];

        if(algo === "bresenham"){

            drawLineBresenham(p1.x, p1.y, p2.x, p2.y, color, sz);

        }else{

            drawLineDDA(p1.x, p1.y, p2.x, p2.y, color, sz);
        }
    }
}

function drawClosedPolygon(obj, color){

    let pts = obj.points;

    if(!pts || pts.length < 3) return;

    let sz = obj.lineWidth || 1;

    for(let i = 0; i < pts.length; i++){

        let p1 = pts[i];
        let p2 = pts[(i + 1) % pts.length];

        drawLineDDA(p1.x, p1.y, p2.x, p2.y, color, sz);
    }
}

function getObjectCenter(obj){

    if(obj.type === "square" || obj.type === "triangle"){

        let pts = obj.points;
        let cx = 0, cy = 0;

        for(let p of pts){
            cx += p.x;
            cy += p.y;
        }

        return {x: cx / pts.length, y: cy / pts.length};
    }

    if(isPolygonLike(obj)){

        let pts = obj.points;
        let cx = 0, cy = 0;

        for(let p of pts){
            cx += p.x;
            cy += p.y;
        }

        return {x: cx / pts.length, y: cy / pts.length};
    }

    return null;
}

function createSquarePoints(x1, y1, x2, y2){

    let dx = x2 - x1;
    let dy = y2 - y1;

    let side = Math.max(Math.abs(dx), Math.abs(dy));
    let sx = dx >= 0 ? 1 : -1;
    let sy = dy >= 0 ? 1 : -1;

    let xEnd = x1 + (sx * side);
    let yEnd = y1 + (sy * side);

    return [
        { x: x1, y: y1 },
        { x: xEnd, y: y1 },
        { x: xEnd, y: yEnd },
        { x: x1, y: yEnd }
    ];
}

function createTrianglePoints(x1, y1, x2, y2){

    let minX = Math.min(x1, x2);
    let maxX = Math.max(x1, x2);
    let minY = Math.min(y1, y2);
    let maxY = Math.max(y1, y2);
    let midX = (minX + maxX) / 2;

    return [
        { x: midX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY }
    ];
}

function drawObjectFill(obj){

    if(obj.type === "circle" && obj.fillColor){

        let cx = obj.xc;
        let cy = obj.yc;

        if(obj.shearX){

            ctx.save();

            ctx.translate(cx, cy);
            ctx.transform(1, 0, obj.shearX, 1, 0, 0);
            ctx.translate(-cx, -cy);
        }

        fillCircle(cx, cy, obj.r, obj.fillColor);

        if(obj.shearX) ctx.restore();

    }else if(obj.type === "ellipse" && obj.fillColor){

        let cx = obj.xc;
        let cy = obj.yc;

        if(obj.shearX){

            ctx.save();

            ctx.translate(cx, cy);
            ctx.transform(1, 0, obj.shearX, 1, 0, 0);
            ctx.translate(-cx, -cy);
        }

        fillEllipse(
            cx, cy,
            obj.rx, obj.ry,
            obj.fillColor,
            obj.angle || 0
        );

        if(obj.shearX) ctx.restore();

    }else if(isPolygonLike(obj) && obj.fillColor){

        let pts = obj.points;

        if(!pts || pts.length < 3) return;

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);

        for(let i = 1; i < pts.length; i++){
            ctx.lineTo(pts[i].x, pts[i].y);
        }

        ctx.closePath();
        ctx.fillStyle = obj.fillColor;
        ctx.fill();

        ctx.restore();
    }
}

function drawObject(obj, color){

    let sz = obj.lineWidth || 1;

    if(obj.type === "line"){

        if(obj.shearX){

            let cx = (obj.x1 + obj.x2) / 2;
            let cy = (obj.y1 + obj.y2) / 2;

            let x1 = obj.x1 + (obj.y1 - cy) * obj.shearX;
            let y1 = obj.y1;
            let x2 = obj.x2 + (obj.y2 - cy) * obj.shearX;
            let y2 = obj.y2;

            drawLineDDA(x1, y1, x2, y2, color, sz);

        }else{

            drawLineDDA(obj.x1, obj.y1, obj.x2, obj.y2, color, sz);
        }

    }else if(obj.type === "circle"){

        let cx = obj.xc;
        let cy = obj.yc;

        if(obj.shearX){

            ctx.save();

            ctx.translate(cx, cy);
            ctx.transform(1, 0, obj.shearX, 1, 0, 0);
            ctx.translate(-cx, -cy);
        }

        drawCircle(cx, cy, obj.r, color, sz);

        if(obj.shearX) ctx.restore();

    }else if(obj.type === "ellipse"){

        let cx = obj.xc;
        let cy = obj.yc;

        if(obj.shearX){

            ctx.save();

            ctx.translate(cx, cy);
            ctx.transform(1, 0, obj.shearX, 1, 0, 0);
            ctx.translate(-cx, -cy);
        }

        drawEllipse(
            cx, cy,
            obj.rx, obj.ry,
            color,
            obj.angle || 0,
            sz
        );

        if(obj.shearX) ctx.restore();

    }else if(obj.type === "square" || obj.type === "triangle"){

        drawClosedPolygon(obj, color);

    }else if(isPolygonLike(obj)){

        drawPolyline(obj, color);
    }
}


function selectObject(x, y, toggle){

    let hit = null;

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
                hit = obj;
            }

        }else if(obj.type === "circle"){

            let distance = Math.sqrt(
                Math.pow(x - obj.xc, 2) +
                Math.pow(y - obj.yc, 2)
            );

            if(distance <= obj.r){

                hit = obj;
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

                hit = obj;
            }

        }else if(isPolygonLike(obj)){

            let pts = obj.points;

            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            for(let p of pts){
                if(p.x < minX) minX = p.x;
                if(p.x > maxX) maxX = p.x;
                if(p.y < minY) minY = p.y;
                if(p.y > maxY) maxY = p.y;
            }

            minX -= 5; maxX += 5;
            minY -= 5; maxY += 5;

            if(
                x >= minX &&
                x <= maxX &&
                y >= minY &&
                y <= maxY
            ){
                hit = obj;
            }
        }
    }

    if(toggle && hit){

        toggleSelect(hit);

    }else if(hit){

        selectOnly(hit);

    }else if(!toggle){

        selectedObjects = [];
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

    }else if(isPolygonLike(obj)){

        for(let p of obj.points){
            p.x += tx;
            p.y += ty;
        }
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

    }else if(isPolygonLike(obj)){

        let pts = obj.points;

        let cx = 0, cy = 0;

        for(let p of pts){
            cx += p.x;
            cy += p.y;
        }

        cx /= pts.length;
        cy /= pts.length;

        for(let p of pts){
            p.x = cx + (p.x - cx) * scaleFactor;
            p.y = cy + (p.y - cy) * scaleFactor;
        }
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
    
    /*
    ========================
    POLYLINE
    ========================
    */

    }else if(isPolygonLike(obj)){

        let pts = obj.points;

        let cx = 0, cy = 0;

        for(let p of pts){
            cx += p.x;
            cy += p.y;
        }

        cx /= pts.length;
        cy /= pts.length;

        for(let p of pts){

            let rp = rotatePoint(p.x, p.y, cx, cy, radian);

            p.x = rp.x;
            p.y = rp.y;
        }
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

    /*
    ========================
    POLYLINE
    ========================
    */

    }else if(isPolygonLike(obj)){

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for(let p of obj.points){
            if(p.x < minX) minX = p.x;
            if(p.x > maxX) maxX = p.x;
            if(p.y < minY) minY = p.y;
            if(p.y > maxY) maxY = p.y;
        }

        if(minX <= 0 || maxX >= canvas.width){
            obj.vx *= -1;
        }

        if(minY <= 0 || maxY >= canvas.height){
            obj.vy *= -1;
        }
    }
}

/*
========================
DRAW PIXEL
========================
*/

function drawPixel(x, y, color = "black", size = 1){

    ctx.fillStyle = color;

    let s = Math.max(1, Math.round(size));

    ctx.fillRect(
        Math.floor(x - (s - 1) / 2),
        Math.floor(y - (s - 1) / 2),
        s,
        s
    );
}

/*
========================
DDA LINE
========================
*/

function drawLineDDA(x1, y1, x2, y2, color = "black", size = 1){

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
            color,
            size
        );

        x += xIncrement;
        y += yIncrement;
    }
}

/*
========================
BRESENHAM LINE
========================
*/

function drawLineBresenham(x1, y1, x2, y2, color = "black", size = 1){

    let dx = Math.abs(x2 - x1);
    let dy = -Math.abs(y2 - y1);

    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;

    let err = dx + dy;

    let x = x1;
    let y = y1;

    while(true){

        drawPixel(x, y, color, size);

        if(x === x2 && y === y2) break;

        let e2 = 2 * err;

        if(e2 >= dy){
            err += dy;
            x += sx;
        }

        if(e2 <= dx){
            err += dx;
            y += sy;
        }
    }
}

/*
========================
CIRCLE
========================
*/

function drawCircle(xc, yc, r, color = "black", size = 1){

    let x = 0;
    let y = r;

    let p = 1 - r;

    drawCirclePoints(xc, yc, x, y, color, size);

    while(x < y){

        x++;

        if(p < 0){

            p += 2 * x + 1;

        }else{

            y--;

            p += 2 * (x - y) + 1;
        }

        drawCirclePoints(xc, yc, x, y, color, size);
    }
}

function fillCircle(xc, yc, r, color){

    for(let y = -r; y <= r; y++){

        let lineX = Math.round(Math.sqrt(r * r - y * y));

        for(let x = -lineX; x <= lineX; x++){

            drawPixel(xc + x, yc + y, color);
        }
    }
}

function drawCirclePoints(xc, yc, x, y, color, size = 1){

    drawPixel(xc + x, yc + y, color, size);
    drawPixel(xc - x, yc + y, color, size);

    drawPixel(xc + x, yc - y, color, size);
    drawPixel(xc - x, yc - y, color, size);

    drawPixel(xc + y, yc + x, color, size);
    drawPixel(xc - y, yc + x, color, size);

    drawPixel(xc + y, yc - x, color, size);
    drawPixel(xc - y, yc - x, color, size);
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
    angle = 0,
    size = 1
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

        drawEllipsePoints(xc, yc, x, y, color, size);

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

        drawEllipsePoints(xc, yc, x, y, color, size);

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

function drawEllipsePoints(xc, yc, x, y, color, size = 1){

    drawPixel(xc + x, yc + y, color, size);
    drawPixel(xc - x, yc + y, color, size);

    drawPixel(xc + x, yc - y, color, size);
    drawPixel(xc - x, yc - y, color, size);
}

function fillEllipse(
    xc,
    yc,
    rx,
    ry,
    color,
    angle = 0
){

    ctx.save();

    ctx.translate(xc, yc);

    if(angle){
        ctx.rotate(angle * Math.PI / 180);
    }

    ctx.translate(-xc, -yc);

    let rySq = ry * ry;

    for(let dy = -ry; dy <= ry; dy++){

        let lineX = Math.round(rx * Math.sqrt(1 - (dy * dy) / rySq));

        for(let dx = -lineX; dx <= lineX; dx++){

            drawPixel(xc + dx, yc + dy, color);
        }
    }

    ctx.restore();
}


document.addEventListener("keydown", function(e){

    if(e.key === "Escape"){

        if(isBuilding || previewObject || buildPreviewObject){

            isBuilding = false;
            buildPoints = [];
            buildPreviewObject = null;
            previewObject = null;

            redrawCanvas();
        }

        return;
    }

    if(selectedObjects.length === 0) return;

    if(e.key === "Delete" || e.key === "Backspace"){

        saveState();

        for(let obj of selectedObjects){

            let idx = objects.indexOf(obj);

            if(idx !== -1) objects.splice(idx, 1);
        }

        selectedObjects = [];

        redrawCanvas();
        updateStatus();

        return;
    }

    /*
    ========================
    TRANSLATE
    ========================
    */

    if(mode === "translate"){

        const step = 10;

        if(e.key === "ArrowLeft"){
            saveState();
            for(let obj of selectedObjects) translateObject(obj, -step, 0);

        }else if(e.key === "ArrowRight"){
            saveState();
            for(let obj of selectedObjects) translateObject(obj, step, 0);

        }else if(e.key === "ArrowUp"){
            saveState();
            for(let obj of selectedObjects) translateObject(obj, 0, -step);

        }else if(e.key === "ArrowDown"){
            saveState();
            for(let obj of selectedObjects) translateObject(obj, 0, step);
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
            for(let obj of selectedObjects) scaleObject(obj, 1.1);

        }else if(e.key === "-"){
            saveState();
            for(let obj of selectedObjects) scaleObject(obj, 0.9);
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
            for(let obj of selectedObjects) rotateObject(obj, -angle);

        }else if(e.key === "e" || e.key === "E"){
            saveState();
            for(let obj of selectedObjects) rotateObject(obj, angle);
        }
    }

    /*
    ========================
    SHEAR
    ========================
    */

    if(mode === "shear"){

        const shearStep = 0.1;

        if(e.key === "z" || e.key === "Z"){
            saveState();
            for(let obj of selectedObjects){
                if(!obj.shearX) obj.shearX = 0;
                obj.shearX -= shearStep;
            }

        }else if(e.key === "x" || e.key === "X"){
            saveState();
            for(let obj of selectedObjects){
                if(!obj.shearX) obj.shearX = 0;
                obj.shearX += shearStep;
            }
        }
    }

    let primary = getPrimary();

    if(primary){

        currentColor = primary.color;
    
        document.getElementById("colorPicker").value =
            primary.color;
    }
    
    redrawCanvas();
});