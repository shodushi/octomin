var powerState = {};
var powerState_proxy = new Proxy(powerState, {
  set: function(obj, prop, value) {
    obj[prop] = value;
    updateUI();
    return true;
  },
});

var lightState = {};
var lightState_proxy = new Proxy(lightState, {
  set: function(obj, prop, value) {
    obj[prop] = value;
    updateUI();
    return true;
  },
});
var connectionState = {};
var connectionState_proxy = new Proxy(connectionState, {
  set: function(obj, prop, value) {
    obj[prop] = value;
    updateUI();
    return true;
  },
});
var printerState = {};
var printerState_proxy = new Proxy(printerState, {
  set: function(obj, prop, value) {
    obj[prop] = value;
    updateUI();
    return true;
  },
});

var selectedfile = {};
//var printerState;
var files = [];
var folders = [];


$( document ).ready(function() {
	getConnectionState();
	getLightState();
	getPowerState();
	getPrinterState();
	getFiles();
})




function updateUI() {
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
	console.log(obj);
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
	var url = octo_ip+"/api/files?recursive=true";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader("X-Api-Key", apikey);
	xhr.onload = function () {
		folders = [];
		files = [];
	    var data = JSON.parse(xhr.responseText)
		jQuery.each(data.files, function(index, value) {
            if(value.type == "folder") {
            	folders.push(value);
            } else {
            	files.push(value);
            }
        });
		listFiles();
	};
	xhr.send();
}

async function listFiles() {
	$('#filestable > tbody').empty();
	if(folders.length > 0) {
		jQuery.each(folders, function(index, value) {
            $('#filestable > tbody:last-child').append('<tr onclick="selectFile(this,{ display: \''+value.display+'\', name: \''+value.name+'\', origin: \''+value.origin+'\', path: \''+value.path+'\', type: \''+value.type+'\', refs: { resource: \''+value.refs.resource+'\' } })"><td><span class="icon">&#128193;</span></td><td>'+value.display+'</td><td></td></tr>');
        });
	}
	if(files.length > 0) {
		jQuery.each(files, function(index, value) {
			var img;
			if(value.refs.download != null) {
				if(value.refs.download.includes(".gcode")) {
					img = value.refs.download.replace(".gcode", ".png"); 
				}
				var tstamp = new Date(value.date*1000);
				var date = tstamp.getDate()+"."+tstamp.getMonth()+"."+tstamp.getFullYear();
	            $('#filestable > tbody:last-child').append('<tr onclick="selectFile(this, { display: \''+value.display+'\', name: \''+value.name+'\', origin: \''+value.origin+'\', path: \''+value.path+'\', type: \''+value.type+'\', refs: { resource: \''+value.refs.resource+'\', download: \''+value.refs.download+'\' } })"><td><figure class="image is-128x128"><img src="'+img+'" onerror="this.src=\'img/placeholder.png\'"></figure></td><td>'+value.display+'</td><td>'+date+'</td></tr>');
			}
        });
	}
}

function selectFile(selector, file) {
	$("#filestable tr").removeClass("is-selected");
	$(selector).addClass("is-selected");
	selectedfile = file;
	if(file.type == "folder") {
		$("#fileoperations span").attr("disabled", true);
	} else {
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
	var url = octo_ip+"/api/files/local/"+selectedfile.display;
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
	obj.targets = {"tool0": temp};
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
	obj.target = temp;
	xhr.onload = function () {
		getPrinterState();
	};
	xhr.send(JSON.stringify(obj));
}

















