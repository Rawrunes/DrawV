let app;
let graphics;

let strokes = [];
let strokeCount = 0;
let lastNumLines = 0;

const SERVER = "http://127.0.0.1:3000/drawv";

var isDrawing = false;
var eraserOn = false;
var isUndone = false;
let undoing = false;
let drawnSinceUndo = false;
let flip = false;

let currentColor = '0x000000';
let currentSize = 3;
var x = 0;
var y = 0;
var oldx = 0;
var oldy = 0;

const rectangle = PIXI.Sprite.from(PIXI.Texture.WHITE);
rectangle.width = 600;
rectangle.height = 500;
rectangle.tint = 0xFFFFFF;

window.onload = function(){

	var canvasContainer = document.getElementById("areaCanvasContainer");

	app = new PIXI.Application({ 
		width: 600,
		height: 500,
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

	
	app.renderer.plugins.interaction.on("pointerdown", mousedown);
	app.renderer.plugins.interaction.on("pointermove", mousemove);
	app.renderer.plugins.interaction.on("pointerup", mouseup);
	app.renderer.plugins.interaction.on("pointerupoutside", mouseup);

	app.stage.addChild(graphics);
	app.stage.addChildAt(rectangle,0);

	let tick = 0;
	let tock = 0;
	app.ticker.add((delta) => 
	{
		tick += delta;
		tock += delta;
		if (tick > 1)
		{
			if(graphics.geometry.graphicsData.length >= 4000){
				isDrawing = false;
			}
			graphics.lineStyle(currentSize, currentColor,1,0.5,false);
			graphics.line.cap = PIXI.LINE_CAP.ROUND;
			drawUpdate();
			graphics.closePath();
			tick = 0;
		}
		// if (tock > 10)
		// {
		// 	currentColor = addHexColor(currentColor, 000010);
		// 	tock = 0;
		// }
	})
}

function addHexColor(c1, c2) 
{
	var hexStr = (parseInt(c1, 16) + parseInt(c2, 16)).toString(16);
	while (hexStr.length < 6) { hexStr = '0' + hexStr; } // Zero pad.
	return hexStr;
}

function mousedown(e)
{
	x = e.data.global.x;
	y = e.data.global.y;
	oldx = x;
	oldy = y;
	isDrawing = true;
}

function mousemove(e)
{
	if (isDrawing === true)
	{
		if(Math.abs(x - e.data.global.x) > 2 || Math.abs(y - e.data.global.y ) > 2 )
		{
			x = e.data.global.x;
			y = e.data.global.y;
		}
	}
}

function mouseup(e)
{
	if (isDrawing === true)
	{
		isDrawing = false;
	}
	if (strokeCount > 0)
	{
		strokes.push(strokeCount);
		if(strokes.length === 1 && isUndone){
			//strokes[0]--;
		}
		strokeCount = 0;
	}
}

function drawLine(x1, y1, x2, y2) 
{
	graphics.moveTo(x1, y1);
	graphics.lineTo(x2, y2);
}

function drawUpdate()
{
	if(isDrawing)
	{
		if(!(x === oldx && y === oldy))
		{
			graphics.moveTo(oldx, oldy);
			graphics.lineTo(x, y);
			oldx = x;
			oldy = y;
			drawnSinceUndo = true;
			redraw();
			strokeCount ++;
		}
	}
}

function redraw()
{
	let lines = [];
	graphics.geometry.graphicsData.forEach(element => {
		lines.push(element);
	});

	// Move most recent line from start of array to end
	if (lines.length > 0 && !undoing && lines.length !== lastNumLines)
	{
		let line = lines.shift();
		lines.push(line);			
	}
	if (undoing)
	{
		undoing = false;
	}
	lastNumLines = lines.length;

	graphics.geometry.clear();

	lines.forEach(line => 
	{
		/*if (line.points.length == 4)
		{*/
			let p = line.points;
			graphics.lineStyle(3, line.lineStyle.color,1,0.5,false);
			graphics.line.cap = PIXI.LINE_CAP.ROUND;
			drawLine(p[0], p[1], p[2], p[3]);
		//}
	});
	//graphics.moveTo(0,0);
}

function undo()
{
	//console.log(strokes);
	//console.log(graphics.geometry.graphicsData);
	
	isUndone = true;
	if(drawnSinceUndo){
		graphics.geometry.graphicsData.push(graphics.geometry.graphicsData.shift());
	}

	let gl = graphics.geometry.graphicsData.length;
	let trimmed = graphics.geometry.graphicsData.slice(0, gl - strokes.pop());
	//console.log(trimmed);				
	lastNumLines = trimmed.length;
	if(trimmed.length){
		graphics.geometry.graphicsData = trimmed;
	}
	else
	{
		graphics.geometry.clear();
	}
	
	undoing = true;
	drawnSinceUndo = false;
	redraw();
}

function drawTest() 
{
	let px = 0;
	let py = 0;
	for (let x = 5; x < app.renderer.screen.width; x = x + 50) 
	{
		graphics.moveTo(x, y);
		for (let y = 5; y < app.renderer.screen.height; y = y + 10)
		{
			let ty = y + (Math.random() * 40);
			let tx = x + (Math.random() * 40);
			drawLine(px, py, tx, ty);
			py = ty;
			px = tx;
		}
	}
	
}

function clearCanvas()
{
	graphics.geometry.clear();
	strokes = [];
}

function toggleEraser(e)
{
	if(eraserOn)
	{
		currentColor = '0x000000';
		eraserOn = false;
		document.querySelector("#btnEraser").textContent = "Eraser";
	}
	else
	{
		currentColor = '0xFFFFFF';
		eraserOn = true;
		document.querySelector("#btnEraser").textContent = "Pen";
	}
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

function generateJSONString(responseId)
{
	var lines = [],
		jsonString;
	graphics.geometry.graphicsData.forEach(function(g)
	{
		lines.push({
			points: [
				Math.round((g.points[0] + Number.EPSILON) * 100) / 100,
				Math.round((g.points[1] + Number.EPSILON) * 100) / 100,
				Math.round((g.points[2] + Number.EPSILON) * 100) / 100,
				Math.round((g.points[3] + Number.EPSILON) * 100) / 100],
			color: g.lineStyle.color,
			width: g.lineStyle.width
		});
	});
	if(drawnSinceUndo)
	{
		lines.push(lines.shift());
	}
	return JSON.stringify({
		drawstring : lines,
		responseid : responseId
	});
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
	var r = confirm("Are you sure you want to submit your drawing?");
	if (r === true) {
		if(graphics.geometry.graphicsData.length){
			const http = new XMLHttpRequest();
			const url = SERVER + "/db/saveSketch";
			let responseId = "";

			http.onreadystatechange = function() 
			{
				if (http.readyState === 4) 
				{
					navigateToGallery();
				}
			}
			http.open("POST", url);
			http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			http.send(generateJSONString(responseId));
		}
	} 
}

function loadSketchFromDatabase()
{
	let sketchId = "";
	const http = new XMLHttpRequest();
	const url = SERVER + "/db/getSketch/" + sketchId;

	http.onreadystatechange = function() 
	{
		if (http.readyState === 4) 
		{
			playJsonString(JSON.parse(http.response).drawstring);
		}
	}

	http.open("GET", url);
	http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	http.send();
}

function navigateToGallery()
{
	window.location.href = SERVER + "/gallery";		
}