var fileList = [];
var selectedfile = {};
var selectedfolder = "";



$( document ).ready(function() {
	if(powerhandling != "yes") {
		$('#control_power').css("display", "none");
	}
	if(lighthandling != "yes") {
		$('#control_light').css("display", "none");
	}
	getSettings();
	getConnectionState();
	getLightState();
	getPowerState();
	getPrinterState();
	getFiles();

	printerstateTimer();
});

function printerstateTimer() {
	setTimeout(function(){
		if(printerState.state != "Closed" && printerState.state != null) {
			getPrinterState();
			printerstateTimer();
		}
	}, 5000);
}

async function getSettings() {
	var url = octo_ip+"/api/settings";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader("X-Api-Key", apikey);
	xhr.onload = function () {
	    var data = JSON.parse(xhr.responseText);
	    $("#printerCam").attr("src", data.webcam.streamUrl);
	};
	xhr.send();
}

function updateUI() {
	if(previewimages != "yes") {
		$(".image").css("display", "none");
	}

	if(powerState.state == 0) {
		$("#tag_printer_power").html('aus');
    	$("#tag_printer_power").attr('class', 'tag is-danger');
    }
    if(powerState.state == 1) {
    	$("#tag_printer_power").html('an');
    	$("#tag_printer_power").attr('class', 'tag is-success');
    }

	if(connectionState.state == "Closed" || connectionState.state == null) {
		$("#tag_btn_connect").html('aus');
    	$("#tag_btn_connect").attr('class', 'tag is-danger');
	} else {
		$("#tag_btn_connect").html('an');
    	$("#tag_btn_connect").attr('class', 'tag is-success');
	
	}
	$("#printername").html(connectionState.printerName);
	$("#connectionstatus").html(connectionState.state);
	if(printerState.state == "Closed" || printerState.state == null) {
		$("#cardprinterstatus").css("display", "none");
		$("#cardtools").css("display", "none");
	} else {
		$("#cardprinterstatus").css("display", "block");
		$("#cardtools").css("display", "block");
		$("#printerstatus").html(printerState.state.text);
		if(printerState.temperature != null) {
			$("#tool0tempactual").html(printerState.temperature.tool0.actual);
			$("#bedtempactual").html(printerState.temperature.bed.actual);
			$("#tool0temptarget").html(printerState.temperature.tool0.target);
			$("#bedtemptarget").html(printerState.temperature.bed.target);
			var temptool0_ist = (100/printerState.temperature.tool0.target)*printerState.temperature.tool0.actual;
			$("#temp_tool0_actual").css("height", temptool0_ist+"%");
			var tempbed_ist = (100/printerState.temperature.bed.target)*printerState.temperature.bed.actual;
			$("#temp_bed_actual").css("height", tempbed_ist+"%");
			$("#sliderExtruder").val(parseInt(printerState.temperature.tool0.target));
			$("#sliderextruderoutput").html(printerState.temperature.tool0.target);
			$("#sliderBed").val(parseInt(printerState.temperature.bed.target));
			$("#sliderbedoutput").html(printerState.temperature.bed.target);
		}
	}
	

	if(lightState.state == "OFF") {
		$("#tag_lightswitch").html('aus');
		$("#tag_lightswitch").attr('class', 'tag is-danger');
    }
    if(lightState.state == "ON") {
    	$("#tag_lightswitch").html('an');
    	$("#tag_lightswitch").attr('class', 'tag is-success');
    }
}

async function powerswitch() {
	var url = cors_proxy+"/"+tasmota_ip+"/cm?cmnd=Power%20TOGGLE";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function () {
	    getPowerState();
	};
	xhr.send();
}

async function lightswitch() {
	var url = cors_proxy+"/"+led_ip+"/light/3d_drucker_led/toggle";
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.onload = function () {
	    getLightState();
	};
	xhr.send();
}

async function printerConnection() {
	var url = octo_ip+"/api/connection";
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.setRequestHeader("X-Api-Key", apikey);
	var obj = {};
	if(connectionState.state == "Closed") {
		obj.command = "connect";
		obj.port = "/dev/ttyACM0";
		obj.baudrate = 115200;
		obj.printerProfile = "_default";
		obj.save = true;
		obj.autoconnect = false;
	} else {
		obj.command = "disconnect";
	}
	xhr.onload = function () {
		if(obj.command == "disconnect" && xhr.status == 204) {
			connectionState_proxy.state = "Closed";
			printerState_proxy.state = "Closed";
		} else {
			tryConnectionState(0, obj.command);
		}
	};
	xhr.send(JSON.stringify(obj));
}

async function tryConnectionState(tries, command) {
	if(command == "connect") {
		if(printerState.state == null || printerState.state == "Closed") {
			if(tries < 5) {
				setTimeout(function(){
					getConnectionState();
					tries++;
					setTimeout(function(){
						getPrinterState();
					}, 3000);
					tryConnectionState(tries, command);
				}, 3000);
			}
		} else {
			getConnectionState();
			getPrinterState();
		}
	} else {
		getConnectionState();
		getPrinterState();
	}
}
async function getFiles() {
	fileList = [];
	var url = octo_ip+"/api/files?recursive=true";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader("X-Api-Key", apikey);
	xhr.onload = function () {
	    var data = JSON.parse(xhr.responseText);
	    fileList.push(data);
		listFiles();
	};
	xhr.send();
}

async function listFiles() {
	$('#filestable > tbody').empty();
	var files = [];
	var folders = [];
	var path = selectedfolder.split("/");
	if(selectedfolder.length > 0 && path[0] != "") { // Subfolder
		for(var i = 0; i<fileList[0].files.length;i++) {
			if(fileList[0].files[i].path == path[0]) {
				pathobj = fileList[0].files[i];
			}
		}
		if(path.length > 1) {
			for(n=1;n<path.length;n++) {
				for(m=0;m<pathobj.children.length;m++) {
					if(pathobj.children[m].path == selectedfolder) {
						pathobj = pathobj.children[m];
					}
				}
			}
		}
		if(pathobj.children.length > 0) {
			jQuery.each(pathobj.children, function(index, value) {
			    if(value.type == "folder") {
			    	folders.push(value);
			    } else {
			    	files.push(value);
			    }
			});
			$('#filestable > tbody:last-child').append('<tr onclick=""><td colspan="3" onclick="folderup()">&#x2190; back</td></tr>');
			jQuery.each(folders, function(index, value) {
	            $('#filestable > tbody:last-child').append('<tr onclick="selectFolder(\''+value.path+'\')"><td><span class="icon">&#128193;</span></td><td>'+value.display+'</td><td></td></tr>');
	        });
			jQuery.each(files, function(index, value) {
				var img;
				if(value.refs.download != null) {
					if(value.refs.download.includes(".gcode")) {
						img = value.refs.download.replace(".gcode", ".png"); 
						imgid = value.display.replace(".", "");
					}
					var tstamp = new Date(value.date*1000);
					var day = "0"+tstamp.getDate();
					var month = "0"+tstamp.getMonth();
					var date = day.slice(-2)+"."+month.slice(-2)+"."+tstamp.getFullYear();
		            $('#filestable > tbody:last-child').append('<tr onclick="selectFile(this, { display: \''+value.display+'\', name: \''+value.name+'\', origin: \''+value.origin+'\', path: \''+value.path+'\', type: \''+value.type+'\', refs: { resource: \''+value.refs.resource+'\', download: \''+value.refs.download+'\' } })"><td><figure class="image is-128x128"><img src="'+img+'" id="thumb_'+imgid+'" class="thumb" onmousemove="zoomIn(\''+imgid+'\', event)" onmouseout="zoomOut(\''+imgid+'\')" onerror="this.src=\'img/placeholder.png\'"></figure><div class="overlay_wrapper"><div id="overlay_'+imgid+'" class="zoomoverlay" style="background-image: url(\'' +img+ '\')"></div></div></td><td>'+value.display+'</td><td>'+date+'<div class="file_buttons" id="fb_'+imgid+'"><span id="btn_load" class="button is-warning is-small" disabled onclick="loadprintFile(false)">load</span> <span id="btn_print" class="button is-success is-small" disabled onclick="loadprintFile(true)">print</span> <span id="btn_delete" class="button is-danger is-small" disabled onclick="deleteFile()">delete</span></div></td></tr>');
				}
	        });
		}
	} else { // Main folder
		jQuery.each(fileList[0].files, function(index, value) {
		    if(value.type == "folder") {
		    	folders.push(value);
		    } else {
		    	files.push(value);
		    }
		});
		if(folders.length > 0) {
			jQuery.each(folders, function(index, value) {
	            $('#filestable > tbody:last-child').append('<tr onclick="selectFolder(\''+value.path+'\')"><td><span class="icon">&#128193;</span></td><td>'+value.display+'</td><td></td></tr>');
	        });
		}
		if(files.length > 0) {
			jQuery.each(files, function(index, value) {
				var img;
				if(value.refs.download != null) {
					if(value.refs.download.includes(".gcode")) {
						img = value.refs.download.replace(".gcode", ".png"); 
						imgid = value.display.replace(".", "");
					}
					var tstamp = new Date(value.date*1000);
					var day = "0"+tstamp.getDate();
					var month = "0"+tstamp.getMonth();
					var date = day.slice(-2)+"."+month.slice(-2)+"."+tstamp.getFullYear();
		            $('#filestable > tbody:last-child').append('<tr onclick="selectFile(this, { display: \''+value.display+'\', name: \''+value.name+'\', origin: \''+value.origin+'\', path: \''+value.path+'\', type: \''+value.type+'\', refs: { resource: \''+value.refs.resource+'\', download: \''+value.refs.download+'\' } })"><td><figure class="image is-128x128"><img src="'+img+'" id="thumb_'+imgid+'" class="thumb" onmousemove="zoomIn(\''+imgid+'\', event)" onmouseout="zoomOut(\''+imgid+'\')" onerror="this.src=\'img/placeholder.png\'"></figure><div class="overlay_wrapper"><div id="overlay_'+imgid+'" class="zoomoverlay" style="background-image: url(\'' +img+ '\')"></div></div></td><td>'+value.display+'</td><td>'+date+'<div class="file_buttons" id="fb_'+imgid+'"><span id="btn_load" class="button is-warning is-small" disabled onclick="loadprintFile(false)">load</span> <span id="btn_print" class="button is-success is-small" disabled onclick="loadprintFile(true)">print</span> <span id="btn_delete" class="button is-danger is-small" disabled onclick="deleteFile()">delete</span></div></td></tr>');
				}
	        });
		}
	}
	
}
function zoomIn(id, event) {
	var element = document.getElementById("overlay_"+id);
	element.style.display = "inline-block";
	var img = document.getElementById("imgZoom");
	var posX = event.offsetX ? (event.offsetX) : event.pageX - img.offsetLeft;
	var posY = event.offsetY ? (event.offsetY) : event.pageY - img.offsetTop;
	element.style.backgroundPosition=(-posX*3.5)+"px "+(-posY*4)+"px";
}

function zoomOut(id) {
	var element = document.getElementById("overlay_"+id);
    element.style.display = "none";
}
function getSelectedFolder() {
	return selectedfolder;
}
function selectFolder(foldername) {
	selectedfolder = foldername;
	listFiles();
}
function folderup() {
	selectedfolder = selectedfolder.substring(0, selectedfolder.lastIndexOf('/'))
	listFiles();
}

function selectFile(selector, file) {
	$("#filestable tr").removeClass("is-selected");
	$(".file_buttons span").css("display", "none");
	$(selector).addClass("is-selected");
	selectedfile = file;
	if(file.type == "folder") {
		$("#fileoperations span").attr("disabled", true);
	} else {
		imgid = file.display.replace(".", "");
		$("#fb_"+imgid+" span").css("display", "block");
		$("#fb_"+imgid+" span").removeAttr("disabled");
		$("#fileoperations span").removeAttr("disabled");
		$('#btn_cancel').attr("disabled", true);
	}
}

async function loadprintFile(print) {
	var url = octo_ip+"/api/files/local/"+selectedfile.display;
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.setRequestHeader("X-Api-Key", apikey);
	var obj = {};
	obj.command = "select";
	obj.print = print;
	xhr.onload = function () {
		if(print) {
			$('#btn_cancel').attr("disabled", false);
		}
	};
	xhr.send(JSON.stringify(obj));
}

async function cancelJob() {
	var url = octo_ip+"/api/job";
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.setRequestHeader("X-Api-Key", apikey);
	var obj = {};
	obj.command = "cancel";
	xhr.onload = function () {
	};
	updateUI();
	xhr.send(JSON.stringify(obj));
}

async function deleteFile() {
	var url = "";
	if(selectedfolder == "") {
		url = octo_ip+"/api/files/local/"+selectedfile.display;
	} else {
		url = octo_ip+"/api/files/local/"+selectedfolder+"/"+selectedfile.display;
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open("DELETE", url, true);
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.setRequestHeader("X-Api-Key", apikey);
	xhr.onload = function () {
		selectedfile = null;
		$("#fileoperations span").attr("disabled", true);
		getFiles();
	};
	xhr.send();
}

async function setExtruderTemp(temp) {
	var url = octo_ip+"/api/printer/tool";
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.setRequestHeader("X-Api-Key", apikey);
	var obj = {};
	obj.command = "target";
	obj.targets = {"tool0": parseInt(temp)};
	xhr.onload = function () {
		getPrinterState();
	};
	xhr.send(JSON.stringify(obj));
}

async function setBedTemp(temp) {
	var url = octo_ip+"/api/printer/bed";
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.setRequestHeader("X-Api-Key", apikey);
	var obj = {};
	obj.command = "target";
	obj.target = parseInt(temp);
	xhr.onload = function () {
		getPrinterState();
	};
	xhr.send(JSON.stringify(obj));
}

function infomodal(action) {
	if(action == "close") {
		$("#infomodal").removeClass("is-active");
	} else {
		$("#infomodal").addClass("is-active");
	}
}

function pcmds(sender) {
	id = $(sender).data('id');
	switch ($(sender).data('id')) {
		case "chucknorris":
			printercommand("M112");
			break;
		case "stop":
			printercommand("M2");
			// Anweisungen werden ausgeführt,
			// falls expression mit value1 übereinstimmt
			break;
		case "fanon":
			printercommand("M106");
			break;
		case "fanoff":
			printercommand("M107");
			break;
		case "meshbedlevel":
			printercommand("G80");
			break;
		case "homeaxes":
			printercommand("G28 W");
			break;
		case "motorsoff":
			printercommand("M18");
			// Anweisungen werden ausgeführt,
			// falls expression mit value1 übereinstimmt
			break;
		case "unloadfilament":
			printercommand("M702");
			// Anweisungen werden ausgeführt,
			// falls expression mit value1 übereinstimmt
			break;
		case "loadfilament":
			printercommand("M702");
			// Anweisungen werden ausgeführt,
			// falls expression mit value1 übereinstimmt
			break;
		case "changefilament":
			printercommand("M600");
			// Anweisungen werden ausgeführt,
			// falls expression mit value1 übereinstimmt
			break;
		default:
			console.error("printer command not implemented");
			break;
	}
}
async function printercommand(cmd) {
	var url = octo_ip+"/api/printer/command";
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.setRequestHeader("X-Api-Key", apikey);
	var obj = {};
	obj.command = cmd;
	xhr.onload = function () {
		
	};
	xhr.send(JSON.stringify(obj));
}





