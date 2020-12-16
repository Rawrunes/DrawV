let app;
let graphics;

const SERVER = "http://amelia.crabdance.com/drawv";

let currentColor = '0x000000';
let currentSize = 3;
var x = 0;
var y = 0;
var oldx = 0;
var oldy = 0;

let appWidth = window.innerWidth;
let appHeight = window.innerHeight;
let appPadding = 50 * 2;
let gutterSpace = 50;
let thumbScale = 3;
let thumbWidth = 600 / thumbScale;
let thumbHeight = 500 / thumbScale;

let galleryData = {};

let thumbs = [];

let hovering = false;
let lastHover = "";

let replayCanvas;
let replayGraphics;

window.onload = function(){

	var canvasContainer = document.getElementById("areaCanvasContainer");

	app = new PIXI.Application({ 
		width: window.innerWidth - appPadding,
		height: window.innerHeight - appPadding,
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
	
	/* ----------- Replay Canvas ---------- */
	replayCanvas = new PIXI.Application({ 
		width: 600,
		height: 500,
		antialias: false,
		transparent: false,
		resolution: 1,
		forceCanvas: false,
		backgroundColor: 0xFFFFFF
	});

	canvasContainer = document.getElementById("areaReplayCanvas");
	canvasContainer.appendChild(replayCanvas.view);

	replayGraphics = new PIXI.Graphics();
	replayGraphics.clear();
	replayGraphics.moveTo(0,0);
	replayGraphics.lineStyle(3, 0x000000,1,0.5,false);
	replayGraphics.line.cap = PIXI.LINE_CAP.ROUND;
	
	replayCanvas.stage.addChild(replayGraphics);

    getGallery();

	// Bind interactions
	app.renderer.plugins.interaction.on("pointerdown", (event) =>
	{
		pickDrawing(event);
	})
	app.renderer.plugins.interaction.on("pointermove", (event) =>
	{
		hoverDrawing(event);
	})	
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
            galleryData = JSON.parse(http.response);
            drawGallery()
		}
	}

	http.open("GET", url);
	http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	http.send();    
}

function drawGallery(selectedThumb = 0)
{
	let cursor = {x : 1, y: 0 };
	
	// Keep track of where in the graphics 
	//   array the current drawing's lines are
	let graphicsIndexStart = 0;
	let graphicsIndexEnd = 0;
	let oldScale = thumbScale;

    galleryData.forEach((sketch, index) => {
        if (sketch.drawstring != undefined)
        {
			thumbScale = oldScale;
			if (index == selectedThumb)
			{
				thumbScale = thumbScale*.8;
			}
			let lines = JSON.parse(sketch.drawstring);

			for(line in lines){
				let p = lines[line].points;
				graphics.lineStyle(1, lines[line].color,1,0.5,false);
				graphics.line.cap = PIXI.LINE_CAP.ROUND;
				
				drawLine(
					p[0]/thumbScale + cursor.x, 
					p[1]/thumbScale + cursor.y, 
					p[2]/thumbScale + cursor.x, 
					p[3]/thumbScale + cursor.y
				);

				graphicsIndexEnd += 1;
			}

			graphics.lineStyle(1, "#FFFFFF",1,0.5,false);
			graphics.drawRect(cursor.x, cursor.y, thumbWidth, thumbHeight);
			thumbs.push(
				{
					x1 : cursor.x,
					y1 : cursor.y,
					x2 : cursor.x + thumbWidth,
					y2 : cursor.y + thumbHeight,
					sketchId : sketch._id,
					drawstring : sketch.drawstring,
					start : graphicsIndexStart,
					end : graphicsIndexEnd
				}
			)

			graphicsIndexStart = graphicsIndexEnd;

			cursor.x += thumbWidth + gutterSpace;

            if (cursor.x + appPadding + thumbWidth + gutterSpace > appWidth)
            {
                cursor.y += thumbHeight + gutterSpace;
                cursor.x = 1;
            }
            
        }

    });
}

function pickDrawing(event)
{
	let coords = event.data.global;
	thumbs.forEach((thumb) => 
	{
		if (coords.x > thumb.x1 && coords.x < thumb.x2)
		{
			if (coords.y > thumb.y1 && coords.y < thumb.y2)
			{
				loadOverlay(thumb);
			}
		}
	})
}

function hoverDrawing(event)
{
	let coords = event.data.global;
	thumbs.forEach((thumb, index) => 
	{
		if (coords.x > thumb.x1 && coords.x < thumb.x2)
		{
			if (coords.y > thumb.y1 && coords.y < thumb.y2)
			{
				if (lastHover != thumb.sketchId){
					graphics.clear();
					drawGallery(index);
				}
				lastHover = thumb.sketchId;
			}		
		}
	})	
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

function drawLineReplay(x1, y1, x2, y2) 
{
	replayGraphics.moveTo(x1, y1);
	replayGraphics.lineTo(x2, y2);
}

function downloadImageAsPng() 
{
	var renderer = replayCanvas.renderer,
		sprite = replayCanvas.stage,
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

function playJsonString(jsonString)
{
	var drawingJson = JSON.parse(jsonString);
	for(line in drawingJson){
		let p = drawingJson[line].points;
		replayGraphics.lineStyle(drawingJson[line].width, drawingJson[line].color,1,0.5,false);
		replayGraphics.line.cap = PIXI.LINE_CAP.ROUND;
		drawLineReplay(p[0], p[1], p[2], p[3]);
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

function loadResponses(sketchId)
{
	//let sketchId = "5fd534c36a8c7e2315b80024";
	const http = new XMLHttpRequest();
	const url = SERVER + "/db/getResponses/" + sketchId;

	http.onreadystatechange = function() 
	{
		if (http.readyState === 4) 
		{
			let response = JSON.parse(http.response);
			let list = document.getElementById("responseList");
			list.innerHTML = "";
			response.forEach(r => {
				let date = new Date(r.timestamp);
				list.innerHTML += "<li>" + "Response from " + date.toLocaleDateString() + " at " + date.toLocaleTimeString() + "</li>";
			});
		}
	}

	http.open("GET", url);
	http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	http.send();

}

function clearCanvas()
{
	replayGraphics.geometry.clear();
}

function toggleOverlay(event)
{
	if(document.getElementById("overlay").style.display === "block" && event.target.id === "overlay"){
		document.getElementById("overlay").style.display = "none";
	}
	else{
		document.getElementById("overlay").style.display = "block";
		clearCanvas();
		loadSketchFromDatabase();
		loadResponses();
	}
}

function loadOverlay(thumb)
{
	document.getElementById("overlay").style.display = "block";
	clearCanvas();
	playJsonString(thumb.drawstring);
	loadResponses(thumb.sketchId);
}

function navigateToCanvas(response_id)
{
	window.location.href = SERVER + ((response_id)? '?response_id=' + response_id : '');
}