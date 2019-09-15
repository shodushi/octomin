async function getLightState() {
	var url = cors_proxy+"/"+led_ip+"/light/3d_drucker_led/state";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function () {
	    var json = JSON.parse(xhr.responseText);
	    lightState_proxy.state = json.state;
	};
	xhr.send();
}
async function getPowerState() {
	var url = cors_proxy+"/"+tasmota_ip+"/cm?cmnd=Status";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function () {
	    var json = JSON.parse(xhr.responseText);
	    powerState_proxy.state = json.Status.Power;
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
		connectionState_proxy.state = data.current.state;
		connectionState_proxy.printerName = data.options.printerProfiles[0].name;
	};
	xhr.send();
}

async function getPrinterState() {
	var url = octo_ip+"/api/printer?history=true&limit=2";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader("X-Api-Key", apikey);
	xhr.onload = function () {
		try {
			data = JSON.parse(xhr.responseText);
		    printerState_proxy.state = data.state.text;
		    printerState_proxy.temperature = {"bed": {"actual": data.temperature.bed.actual, "offset": data.temperature.bed.offset, "target": data.temperature.bed.target}, "tool0": {"actual": data.temperature.tool0.actual, "offset": data.temperature.tool0.offset, "target": data.temperature.tool0.target} };
		} catch (e) {
			console.log("Oh well, but whatever...");
		}
	};
	xhr.send();
}
