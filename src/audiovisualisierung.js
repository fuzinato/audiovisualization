/*
 * Audiovisualization using the html canvas element.
 * ©2017, Dominik Hofacker
 * https://www.behance.net/dominikhofacker
 * Please consider supporting this project on behance:
 * https://www.behance.net/gallery/49260123/Web-Audio-Visualization
 */

var rafID = null;
var analyser = null;
var c = null;
var cDraw = null;
var ctx = null;
var microphone = null;
var ctxDraw = null;

var loader;
var filename;
var fileChosen = false;
var hasSetupUserMedia = false;

//handle different prefix of the audio context
var AudioContext = AudioContext || webkitAudioContext;
//create the context.
var context = new AudioContext();

//using requestAnimationFrame instead of timeout...
if (!window.requestAnimationFrame)
	window.requestAnimationFrame = window.webkitRequestAnimationFrame;

$(function () {
		"use strict";
	    loader = new BufferLoader();
	    initBinCanvas();	
});

function handleFiles(files) {
    if(files.length === 0){
        return;
    }
	fileChosen = true;
    setupAudioNodes();
	var fileReader  = new FileReader();
    fileReader.onload = function(){
         var arrayBuffer = this.result;
		
		 filename = files[0].name.toString();
		filename = filename.slice(0, -4);

		var url = files[0].urn || files[0].name;

//                    console.log(tags.title.toString().length);
//                    if (tags.title.length > 14) {
//                        var newTitle = tags.title.substring(0,14);
//                        newTitle += "...";
//                        $("#title").html(newTitle);
//                    }
//                    else {
//                        $("#title").html(tags.title);
//                    }

			
			onWindowResize();

			
		
     };
     fileReader.readAsArrayBuffer(files[0]);
     var url = URL.createObjectURL(files[0]); 
	
	var request = new XMLHttpRequest();
	
	request.addEventListener("progress", updateProgress);
	request.addEventListener("load", transferComplete);
	request.addEventListener("error", transferFailed);
	request.addEventListener("abort", transferCanceled);
	
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

 	// When loaded decode the data
	request.onload = function() {
		// decode the data
		context.decodeAudioData(request.response, function(buffer) {
		// when the audio is decoded play the sound
		sourceNode.buffer = buffer;
		sourceNode.start(0);
		$("#freq, body").addClass("animateHue");
		//on error
		}, function(e) {
			console.log(e);
		});
	};
	request.send();
	
	$("button, input").prop("disabled",true);
}

function playSample() {
	
	fileChosen = true;
    setupAudioNodes();
	
	var request = new XMLHttpRequest();
	
	request.addEventListener("progress", updateProgress);
	request.addEventListener("load", transferComplete);
	request.addEventListener("error", transferFailed);
	request.addEventListener("abort", transferCanceled);
	
	request.open('GET', 'src/Infinite.mp3', true);
	request.responseType = 'arraybuffer';

 	// When loaded decode the data
	request.onload = function() {
		
	
		onWindowResize();
		
		// decode the data
		context.decodeAudioData(request.response, function(buffer) {
		// when the audio is decoded play the sound
		sourceNode.buffer = buffer;
		sourceNode.start(0);
		//on error
		}, function(e) {
			console.log(e);
		});
	};
	request.send();
	
	$("button, input").prop("disabled",true);
}

// progress on transfers from the server to the client (downloads)
function updateProgress (oEvent) {
  if (oEvent.lengthComputable) {
	$("button, input").prop("disabled",true);
    var percentComplete = oEvent.loaded / oEvent.total;
	console.log("Loading music file... " + Math.floor(percentComplete * 100) + "%");
	$("#loading").html("Loading... " + Math.floor(percentComplete * 100) + "%");
  } else {
    // Unable to compute progress information since the total size is unknown
	  console.log("Unable to compute progress info.");
  }
}

function transferComplete(evt) {
  	console.log("The transfer is complete.");
	$("#loading").html("");
	//$("button, input").prop("disabled",false);
}

function transferFailed(evt) {
  	console.log("An error occurred while transferring the file.");
	$("#loading").html("Loading failed.");
	$("button, input").prop("disabled", false);
}

function transferCanceled(evt) {
  	console.log("The transfer has been canceled by the user.");
	$("#loading").html("Loading canceled.");
}

function initBinCanvas () {

	//add new canvas
	"use strict";
	c = document.getElementById("freq");
	c.width = window.innerWidth;
  c.height = window.innerHeight;
	//get context from canvas for drawing
	ctx = c.getContext("2d");
	
	ctx.canvas.width  = window.innerWidth;
  	ctx.canvas.height = window.innerHeight;
	
	window.addEventListener( 'resize', onWindowResize, false );
	
	
	ctx.fillStyle = "#9c0001";
}

function onWindowResize()
{
	ctx.canvas.width  = window.innerWidth;
	ctx.canvas.height = window.innerHeight;

}

var audioBuffer;
var sourceNode;
function setupAudioNodes() {
	// setup a analyser
	analyser = context.createAnalyser();
	// analyser.fftSize = 512;
	// create a buffer source node
	sourceNode = context.createBufferSource();	
	//connect source to analyser as link
	sourceNode.connect(analyser);
	// and connect source to destination
	sourceNode.connect(context.destination);
	//start updating
	rafID = window.requestAnimationFrame(updateVisualization);
}


function reset () {
	if (typeof sourceNode !== "undefined") {
		sourceNode.stop(0);		
	}
	if (typeof microphone !== "undefined") {
		microphone = null;
	}
}


function updateVisualization () {
        
	// get the average, bincount is fftsize / 2
	if (fileChosen || hasSetupUserMedia) {
		var array = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(array);

		drawBars(array);
	}
       // setTextAnimation(array);
    

	rafID = window.requestAnimationFrame(updateVisualization);
}

function drawBars (array) {

	//just show bins with a value over the treshold
	var threshold = 0;
	// clear the current state
	ctx.clearRect(0, 0, c.width, c.height);
	//the max count of bins for the visualization
	var maxBinCount = array.length;
	//space between bins
	var space = 3;
        
	ctx.save();


	// ctx.globalCompositeOperation='source-over';

	//console.log(maxBinCount); //--> 1024
	// ctx.scale(0.5, 0.5);
	ctx.translate(window.innerWidth/2, window.innerHeight/2);
	ctx.fillStyle = "#fff";

	var bass = Math.floor(array[1]); //1Hz Frequenz 
	var radius = -100;//0.45 * $(window).width() <= 450 ? -(bass * 0.25 + 0.45 * $(window).width()) : -(bass * 0.25 + 450);
	var bar_length_factor = 1;
	// if ($(window).width() >= 785) {
	// }
	// else if ($(window).width() < 785) {
	// 	bar_length_factor = 1.5;
	// }
	// else if ($(window).width() < 500) {
	// 	bar_length_factor = 20.0;
	// }
	//go over each bin


	// for ( var i = 0; i < maxBinCount; i++ ){
		
	// 	var value = array[i];
	// 	if (value >= threshold) {			
			//draw bin
			//ctx.fillRect(0 + i * space, c.height - value, 2 , c.height);
                        //ctx.fillRect(i * space, c.height, 2, -value);
                        // ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);
                        // ctx.rotate((180 / 128) * Math.PI/180);   
	// 	}
	// }  

	
	for ( var i = 0; i < maxBinCount; i++ ){

		var value = array[i];
		const refAngle = 360 / 456;
		if (value >= threshold) {				
			const refVal = array[201]
			if (i < 200) {
				value *= i*0.5/200 + 0.5
      }
			
			//   ctx.rotate(-(180 / 456) * Math.PI / 180);
			// ctx.fillRect(0, radius, 2, -value / bar_length_factor);

			const x = Math.sin(refAngle * i) * value;
			const y = Math.cos(refAngle * i) * value;
			ctx.fillRect(x, y, 2, 2);
		}

	} 
    
	ctx.restore();
}

//function setTextAnimation(array)
//{
//    var bass = Math.floor(array[1]); //4Hz Frequenz 
//    
//    
//    var fontSize = bass * 0.25 + 50;
//    
//    ctx.save();
//    ctx.globalCompositeOperation='destination-over';
//    ctx.fillStyle = "#fff";
//    ctx.filter = "blur(16px)";
//    
//    var neueFontsize = 70;
//    if (fontSize > neueFontsize) {
//        neueFontsize = fontSize;
//    }
//    
//    //ctx.font = neueFontsize.toString() + "px Arial";
//    if (navigator.userAgent.indexOf("Chrome/53.0.2764.0") > -1) { //besserer Look in Chrome Canary
//        console.log("Chrome Canary User Agent detected");
//        ctx.font="normal normal 300 350px Roboto";
//        if (filename !== undefined) {
//            ctx.fillText(filename, 0, c.height - 200);
//        }
//    }
//    ctx.filter = "blur(0px)";
//    //ctx.font="normal normal 100 " + neueFontsize.toString() + "px Roboto";
//    ctx.font="normal normal 100 70px Roboto";
//    if (filename !== undefined) {
//        ctx.fillText(filename, window.innerWidth / 2 - 125, c.height / 2);
//    }
//    ctx.restore();
//}


