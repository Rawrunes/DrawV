let app;
let graphics;

const SERVER = "http://127.0.0.1:3000";

let currentColor = '0x000000';
let currentSize = 3;
var x = 0;
var y = 0;
var oldx = 0;
var oldy = 0;

window.onload = function(){

	var canvasContainer = document.getElementById("areaCanvasContainer");

	app = new PIXI.Application({ 
		width: window.screen.width,
		height: window.screen.height,
		antialias: false,
		transparent: false,
		resolution: 1,
		forceCanvas: false,
		backgroundColor: 0xFFFFFF
	});
	canvasContainer.appendChild(app.view);
	
	graphics = new PIXI.Graphics();
	graphics.interactive = true;
	graphics.buttonMode = true;
	graphics.clear();
	graphics.moveTo(0,0);
	graphics.lineStyle(3, 0x000000,1,0.5,false);
	graphics.line.cap = PIXI.LINE_CAP.ROUND;

	app.stage.addChild(graphics);

    getGallery();

}

function getGallery()
{
	const http = new XMLHttpRequest();
	const url = `${SERVER}/db/getGallery`;

	http.onreadystatechange = function() 
	{
		if (http.readyState === 4) 
		{
			//callback(http.response);
            //playJsonString(JSON.parse(http.response).drawstring);
            let galleryData = JSON.parse(http.response);
            console.log(galleryData);
            drawGallery(galleryData)
		}
	}

	http.open("GET", url);
	http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	http.send();    
}

function drawGallery(galleryData)
{
    let c = {x : 0, y: 0 };
    let s = 5;
    galleryData.forEach(sketch => {
        if (sketch.drawstring != undefined)
        {
            let lines = JSON.parse(sketch.drawstring);
            
            for(line in lines){
                let p = lines[line].points;
                graphics.lineStyle(1, lines[line].color,1,0.5,false);
                graphics.line.cap = PIXI.LINE_CAP.ROUND;
                drawLine(p[0]/s + c.x, p[1]/s + c.y, p[2]/s + c.x, p[3]/s + c.y);
            }
            c.x += 200;
            if (c.x > 500)
            {
                c.y += 200;
                c.x = 0;
            }
            
        }

    });
}

function addHexColor(c1, c2) 
{
	var hexStr = (parseInt(c1, 16) + parseInt(c2, 16)).toString(16);
	while (hexStr.length < 6) { hexStr = '0' + hexStr; } // Zero pad.
	return hexStr;
}

function drawLine(x1, y1, x2, y2) 
{
	graphics.moveTo(x1, y1);
	graphics.lineTo(x2, y2);
}

function downloadImageAsPng() 
{
	var renderer = app.renderer,
		sprite = app.stage,
		fileName = "image";

	renderer.extract.canvas(sprite).toBlob(function(b)
	{
		var a = document.createElement('a');
		document.body.append(a);
		a.download = fileName;
		a.href = URL.createObjectURL(b);
		a.click();
		a.remove();
	}, 'image/png');

}

function generateJSONString()
{
	var lines = [],
		jsonString;
	graphics.geometry.graphicsData.forEach(function(g)
	{
		lines.push({
			points: g.points,
			color: g.lineStyle.color,
			width: g.lineStyle.width
		});
	});
	if(drawnSinceUndo)
	{
		lines.push(lines.shift());
	}
	return JSON.stringify(lines);
}

function playJsonString(jsonString){
	var drawingJson = JSON.parse(jsonString);
	for(line in drawingJson){
		let p = drawingJson[line].points;
		graphics.lineStyle(drawingJson[line].width, drawingJson[line].color,1,0.5,false);
		graphics.line.cap = PIXI.LINE_CAP.ROUND;
		drawLine(p[0], p[1], p[2], p[3]);
	}
}

function saveSketchToDatabase()
{
	const http = new XMLHttpRequest();
	const url = `${SERVER}/db/saveSketch`;

	http.open("POST", url);
	http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	http.send(generateJSONString());
}

function loadSketchFromDatabase()
{
	const http = new XMLHttpRequest();
	const url = `${SERVER}/db/getSketch`;

	http.onreadystatechange = function() 
	{
		if (http.readyState === 4) 
		{
			//callback(http.response);
			playJsonString(JSON.parse(http.response).drawstring);
		}
	}

	http.open("GET", url);
	http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	http.send();
}

function toggleOverlay(){
	if(document.getElementById("overlay").style.display === "block"){
		document.getElementById("overlay").style.display = "none"
	}
	else{
		document.getElementById("overlay").style.display = "block"
	}
}