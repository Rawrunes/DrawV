let app;
let graphics;

const SERVER = "http://amelia.crabdance.com/drawv";

let currentColor = '0x000000';
let currentSize = 3;
var x = 0;
var y = 0;
var oldx = 0;
var oldy = 0;

let currentSketchesLoaded = 0;
let totalSketchesLoaded = 0;
let prevSketchesLoaded = 0;
let sketchesPerPage = 0;

let appWidth = window.innerWidth;
let appHeight = window.innerHeight;
let appPadding = 50 * 2;
let gutterSpace = 50;
let thumbScale = 3;
let thumbWidth = 600 / thumbScale;
let thumbHeight = 500 / thumbScale;

let thumbs = [];

let replayCanvas;
let replayGraphics;

let response_id;

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
}

function getGallery(index = 0)
{
	const http = new XMLHttpRequest();
	const url = `${SERVER}/db/getGallery/${index}`;

	http.onreadystatechange = function() 
	{
		if (http.readyState === 4) 
		{
			//callback(http.response);
            //playJsonString(JSON.parse(http.response).drawstring);
            let galleryData = JSON.parse(http.response);
            drawGallery(galleryData)
		}
	}

	http.open("GET", url);
	http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	http.send();    
}

function drawGallery(galleryData)
{
    let cursor = {x : 1, y: 0 };
	currentSketchesLoaded = 0;

	for (let index = 0; index < galleryData.length; index++) {
		let sketch = galleryData[index];
		if (cursor.y + thumbHeight + gutterSpace + appPadding < appHeight)
		{
			currentSketchesLoaded = index+1;
			if (sketch.drawstring != undefined)
			{
				let lines = JSON.parse(sketch.drawstring);
				
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
						responseId : sketch.respose_id,
						timestamp : sketch.timestamp
					}
				)
	
				for(line in lines){
					graphics.lineStyle(1, lines[line].color,1,0.5,false);
					graphics.line.cap = PIXI.LINE_CAP.ROUND;
					
					let newPoints = cropOutOfBoundsLine(cursor, thumbWidth, thumbHeight, thumbScale, lines[line].points, index);
	
					drawLine(newPoints[0], newPoints[1], newPoints[2], newPoints[3]);
				}
				cursor.x += thumbWidth + gutterSpace;
	
				if (cursor.x + appPadding + thumbWidth + gutterSpace > appWidth)
				{
					cursor.y += thumbHeight + gutterSpace;
					cursor.x = 1;
				}
			}
		}
		else
		{
			sketchesPerPage = index;
			break;
		}
	}
	totalSketchesLoaded += currentSketchesLoaded;
}

function next()
{
	let pageLeap = totalSketchesLoaded;
	if (currentSketchesLoaded < sketchesPerPage) 
	{
		pageLeap = totalSketchesLoaded - currentSketchesLoaded;
		totalSketchesLoaded = totalSketchesLoaded - currentSketchesLoaded;
	}
	if(sketchesPerPage == 0)
	{
		pageLeap = 0;
	}
	graphics.clear();
	getGallery(pageLeap);
}

function prev()
{
	let pageLeap = sketchesPerPage * 2;
	if (currentSketchesLoaded < sketchesPerPage)
	{
		pageLeap = currentSketchesLoaded + sketchesPerPage;
	}
	totalSketchesLoaded = totalSketchesLoaded - pageLeap;
	if (totalSketchesLoaded < 0)
	{
		totalSketchesLoaded = 0;
	}
	graphics.clear();
	getGallery(totalSketchesLoaded);
}

function cropOutOfBoundsLine(cursor, thumbWidth, thumbHeight, thumbScale, points, thumbindex)
{
	let leftBound = cursor.x;
	let rightBound = cursor.x + thumbWidth;
	let topBound = cursor.y;
	let bottomBound = cursor.y + thumbHeight;

	let bounds = [leftBound, rightBound, topBound, bottomBound];

	let xPoints = [points[0]/thumbScale + cursor.x, points[2]/thumbScale + cursor.x];
	let yPoints = [points[1]/thumbScale + cursor.y, points[3]/thumbScale + cursor.y];

	xPoints.forEach((point, index) => 
	{
		if (point < leftBound)
		{
			xPoints[index] = leftBound;
		}
		if (point > rightBound)
		{
			xPoints[index] = rightBound;
		}
	})
	yPoints.forEach((point, index) => 
	{
		if (point < topBound)
		{
			yPoints[index] = topBound;
		}
		if (point > bottomBound)
		{
			yPoints[index] = bottomBound;
		}
	})

	let newPoints = [xPoints[0], yPoints[0], xPoints[1], yPoints[1]];

	return newPoints;
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

function loadSketchFromDatabase(sketchId)
{
	const http = new XMLHttpRequest();
	const url = SERVER + "/db/getSketch/" + sketchId;

	http.onreadystatechange = function() 
	{
		if (http.readyState === 4) 
		{
			//playJsonString(JSON.parse(http.response).drawstring);
			let response = JSON.parse(http.response);
			loadOverlay({
				drawstring: response.drawstring,
				sketchId: sketchId,
				timestamp: response.timestamp,
				responseId: response.respose_id
			});
		}
	}

	http.open("GET", url);
	http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	http.send();
}

function loadResponses(sketchId)
{
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
				list.innerHTML += "<li data-id='" + r._id + "' onclick='navigateToResponse(event)'>" + "Response from " + date.toLocaleDateString() + " at " + date.toLocaleTimeString() + "</li>";
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
		response_id = "";
	}
}

function loadOverlay(thumb)
{
	document.getElementById("overlay").style.display = "block";
	if(thumb.responseId){
		document.getElementById("areaHeaderTitle").style.display = "none";
		document.getElementById("areaHeaderLink").style.display = "block";
		document.getElementById("areaHeaderLink").dataset.id = thumb.responseId;
		document.getElementById("replayLink").dataset.id = thumb.responseId;
		let date = new Date(thumb.timestamp);
		document.getElementById("replayLink").innerHTML = "Response from " + date.toLocaleDateString() + " at " + date.toLocaleTimeString();
	}
	else{
		document.getElementById("areaHeaderTitle").style.display = "block";
		document.getElementById("areaHeaderLink").style.display = "none";
		let date = new Date(thumb.timestamp);
		document.getElementById("replayTitle").innerHTML = "Sketch from " + date.toLocaleDateString() + " at " + date.toLocaleTimeString();
	}
	response_id = thumb.sketchId;
	clearCanvas();
	playJsonString(thumb.drawstring);
	loadResponses(thumb.sketchId);
	
}

function navigateToCanvas()
{
	window.location.href = SERVER + ((response_id)? '?response_id=' + response_id : '');
}

function navigateToResponse(event)
{
	loadSketchFromDatabase(event.target.dataset.id);
}