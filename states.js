async function getLightState() {
	var url = cors_proxy+"/"+led_ip+"/light/3d_drucker_led/state";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function () {
	    lightState = JSON.parse(xhr.responseText);
	    updateUI();
	};
	xhr.send();
}
async function getPowerState() {
	var url = cors_proxy+"/"+tasmota_ip+"/cm?cmnd=Status";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function () {
	    powerState = JSON.parse(xhr.responseText);
	    updateUI();
	};
	xhr.send();
}

async function getConnectionState() {
	var url = octo_ip+"/api/connection";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader("X-Api-Key", apikey);
	xhr.onload = function () {
	    var data = JSON.parse(xhr.responseText)
		connectionState = data;
		console.log(data);
		updateUI();
	};
	xhr.send();
}

async function getPrinterState() {
	var url = octo_ip+"/api/printer?history=true&limit=2";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader("X-Api-Key", apikey);
	xhr.onload = function () {
	    var data = JSON.parse(xhr.responseText)
		printerState = data;
		console.log(data);
		updateUI();
	};
	xhr.send();
}
