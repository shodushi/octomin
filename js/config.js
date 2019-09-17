// power handling
// here used sonoff with tasmota for power switching the printer
// set powerhandling = "no" if not used
var powerhandling = "yes";
var tasmota_ip = "192.168.120.81";

// light handling
// here used nodemcu with esphome for controlling the enclosure leds
// set lighthandling = "no" if not used
var lighthandling = "yes";
var led_ip = "http://192.168.120.45";

// octoprint api
var octo_ip = "http://192.168.120.244:5000";
var apikey = "86DA1D669334418CB773A50A142A4E72";

// only used if using external devices like tasmota or esphome devices
// see https://www.npmjs.com/package/cors-anywhere for more info
var cors_proxy = "http://192.168.120.244:8090"

// enable/disable preview image of gcode files
var previewimages = "no";