var obj = {};
const handler = {
  set(target, key, value) {
    console.log(`Setting value ${key} as ${value}`)
    target[key] = value;
    updateUI();
  },
};

var connection;
//var printerState;
var files = [];
var folders = [];
var selectedfile = {};
var lightState = new Proxy(obj, handler);
var powerState = new Proxy(obj, handler);
var connectionState = new Proxy(obj, handler);
var printerState = new Proxy(obj, handler);

$( document ).ready(function() {
	$("<div id='rightMenu' class='accordion span4'></div>'").insertAfter( ".span8" );
	$("#temp").detach().appendTo('#rightMenu');
	//$("#control_link").attr("class", " ");
	//$("#tab_plugin_filemanager_link").attr('class', 'active');
	//$("#tab_plugin_filemanager_link").attr('data-bind', 'visible:visible');
	//$("#tab_plugin_filemanager_link").insertBefore("#temp_link");
	//$( "li" ).remove( "#temp_link" );

	$('<button class="btn btn-block" id="printer_power" data-bind="click: powerswitch, enable: loginState.isUser()">Strom an</button>').insertBefore("#printer_connect");
	$('<button class="btn btn-block" id="lightswitch" data-bind="click: lightswitch, enable: loginState.isUser()">Licht an</button>').insertBefore("#printer_connect");
	
	getConnectionState();
	getLightState();
	getPowerState();
	getPrinterState();
	getFiles();
	
})




function updateUI() {
	if(connection != null) {
		if(connection.current.state == "Closed") {
			$("#btn_connect").html("verbinden");
			$("#btn_connect").css("background-color", "#abd03f");
			$("#tag_btn_connect").html('aus');
	    	$("#tag_btn_connect").attr('class', 'tag is-danger');
		} else {
			$("#btn_connect").html("trennen");
			$("#btn_connect").css("background-color", "#bd3630");
			$("#tag_btn_connect").html('an');
	    	$("#tag_btn_connect").attr('class', 'tag is-success');
		}
		$("#printername").html(connection.options.printerProfiles[0].name);
		$("#connectionstatus").html(connection.current.state);

		if(printerState.state != "Closed") {
			$("#cardprinterstatus").css("display", "block");
			$("#cardtools").css("display", "block");
			$("#printerstatus").html(printerState.state.text);
			$("#tool0tempactual").html(printerState.temperature.tool0.actual);
			$("#bedtempactual").html(printerState.temperature.bed.actual);
			$("#tool0temptarget").html(printerState.temperature.tool0.target);
			$("#bedtemptarget").html(printerState.temperature.bed.target);
		} else {
			$("#cardprinterstatus").css("display", "none");
			$("#cardtools").css("display", "none");
		}
	}
	if(powerState != null) {
		if(powerState.state == 0) {
			$("#printer_power").css("background-color", "#abd03f");
			$("#printer_power").html('Strom an');
			$("#tag_printer_power").html('aus');
	    	$("#tag_printer_power").attr('class', 'tag is-danger');
	    }
	    if(powerState.state == 1) {
	    	$("#printer_power").css("background-color", "#bd3630");
	    	$("#printer_power").html('Strom aus');
	    	$("#tag_printer_power").html('an');
	    	$("#tag_printer_power").attr('class', 'tag is-success');
	    }
	}
	if(lightState != null) {
	    if(lightState.state == "OFF") {
			$("#lightswitch").css("background-color", "#abd03f");
			$("#lightswitch").html('Licht an');
			$("#tag_lightswitch").html('aus');
			$("#tag_lightswitch").attr('class', 'tag is-danger');
	    }
	    if(lightState.state == "ON") {
	    	$("#lightswitch").css("background-color", "#bd3630");
	    	$("#lightswitch").html('Licht aus');
	    	$("#tag_lightswitch").html('an');
	    	$("#tag_lightswitch").attr('class', 'tag is-success');
	    }
	}
}

async function powerswitch() {
	var url = cors_proxy+"/"+tasmota_ip+"/cm?cmnd=Power%20TOGGLE";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function () {
	    if(xhr.responseText == '{"POWER":"ON"}') {
	    	$("#printer_power").css("background-color", "#bd3630");
	    	$("#printer_power").html('Strom aus');
	    } else {
	    	$("#printer_power").css("background-color", "#abd03f");
			$("#printer_power").html('Strom an');
			getPrinterState();
	    }
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
	if(connection.current.state == "Closed" || connection == null) {
		obj.command = "connect";
		obj.port = "/dev/ttyACM0";
		obj.baudrate = 115200;
		obj.printerProfile = "_default";
		obj.save = true;
		obj.autoconnect = false;
	} else {
		obj.command = "disconnect";
	}
	console.log(obj.toString());
	xhr.onload = function () {
		getConnectionState();
		getPrinterState();
	};
	xhr.send(JSON.stringify(obj));
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
		console.log(data);
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
	console.log(obj.toString());
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

















