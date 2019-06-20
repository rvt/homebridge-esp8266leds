'use strict';

var Service, Characteristic;
var mqtt = require("mqtt");


function esp8266ledsAccessory(log, config) {
  	this.log          	= log;
  	this.name 			= config["name"];
  	this.url 			= config["url"];
	this.client_Id 		= 'mqttjs_' + Math.random().toString(16).substr(2, 8);
	this.options = {
	    keepalive: 10,
    	clientId: this.client_Id,
	    protocolId: 'MQTT',
    	protocolVersion: 4,
    	clean: true,
    	reconnectPeriod: 1000,
    	connectTimeout: 30 * 1000,
		will: {
			topic: 'WillMsg',
			payload: 'Connection Closed abnormally..!',
			qos: 0,
			retain: false
		},
	    username: config["username"],
	    password: config["password"],
    	rejectUnauthorized: false
	};
	this.caption		= config["caption"];
  this.topics = config["topics"];
  this.baseTopic = config["baseTopic"];
	this.on = false;
  this.brightness = 0;
  this.hue = 0;
  this.saturation = 0;

	this.service = new Service.Lightbulb(this.name);
  	this.service
      .getCharacteristic(Characteristic.On)
    	.on('get', this.getStatus.bind(this))
    	.on('set', this.setStatus.bind(this));
    this.service
      .getCharacteristic(Characteristic.Brightness)
    	.on('get', this.getBrightness.bind(this))
    	.on('set', this.setBrightness.bind(this));
    this.service
      .getCharacteristic(Characteristic.Hue)
    	.on('get', this.getHue.bind(this))
    	.on('set', this.setHue.bind(this));
    this.service
      .getCharacteristic(Characteristic.Saturation)
    	.on('get', this.getSaturation.bind(this))
    	.on('set', this.setSaturation.bind(this));

	// connect to MQTT broker
	this.client = mqtt.connect(this.url, this.options);
	var that = this;
	this.client.on('error', function (err) {
		that.log('Error event on MQTT:', err);
	});

	this.client.on('message', function (topic, message) {
    // console.log(message.toString(), topic);

		if (topic == that.baseTopic + "/state") {
			var status = message.toString();
			var isOn = status.includes("ON");
			var isOff = status.includes("OFF");

			// Handle on/off
			if (isOn || isOff) {
				that.on = isOn === true?true: (isOff === true?false:true);
				that.service.getCharacteristic(Characteristic.On).setValue(that.on, undefined, 'fromSetValue');
			}

			// handle hsb
			var regex = /(hsb=)([,.\d]+)/;
			if (hsbString = regex.exec(message.toLowerCase()) !== null) {
					hsbw1w2 = hsbString[2].split(',');
					hsb=hsbw1w2.slice(0,3);
					that.hue = hsb[0];		
					that.brightness = hsb[2];		
					that.saturation = hsb[1];
					that.service.getCharacteristic(Characteristic.Hue).setValue(that.hue, undefined, 'fromSetValue');
					that.service.getCharacteristic(Characteristic.Saturation).setValue(that.saturation, undefined, 'fromSetValue');		
					that.service.getCharacteristic(Characteristic.Brightness).setValue(that.brightness, undefined, 'fromSetValue');
			}
		}

	});
  this.client.subscribe(this.baseTopic + "/state");
}

module.exports = function(homebridge) {
  	Service = homebridge.hap.Service;
  	Characteristic = homebridge.hap.Characteristic;

  	homebridge.registerAccessory("homebridge-esp8266leds", "esp8266leds", esp8266ledsAccessory);
}

esp8266ledsAccessory.prototype.getStatus = function(callback) {
    callback(null, this.on);
}

esp8266ledsAccessory.prototype.setStatus = function(status, callback, context) {
	if(context !== 'fromSetValue') {
		this.on = status;
	  this.client.publish(this.baseTopic+"/color", status ? "ON" : "OFF");
	}
	callback();
}

esp8266ledsAccessory.prototype.getBrightness = function(callback) {
    callback(null, this.brightness);
}

esp8266ledsAccessory.prototype.setBrightness = function(brightness, callback, context) {
	if(context !== 'fromSetValue') {
		this.brightness = brightness;
    // console.log("Brightness:",this.brightness);
		this.client.publish(this.baseTopic+"/color", "b=" + this.brightness.toString());
	}
	callback();
}

esp8266ledsAccessory.prototype.getHue = function(callback) {
    callback(null, this.hue);
}

esp8266ledsAccessory.prototype.setHue = function(hue, callback, context) {
	if(context !== 'fromSetValue') {
		this.hue = hue;
    // console.log("Hue:",this.hue);
		this.client.publish(this.baseTopic+"/color", "h=" + this.hue.toString());
	}
	callback();
}

esp8266ledsAccessory.prototype.getSaturation = function(callback) {
    callback(null, this.saturation);
}

esp8266ledsAccessory.prototype.setSaturation = function(saturation, callback, context) {
	if(context !== 'fromSetValue') {
		this.saturation = saturation;
    // console.log("Saturation:",this.saturation);
		this.client.publish(this.baseTopic+"/color", "s=" + this.saturation.toString());
	}
	callback();
}

esp8266ledsAccessory.prototype.getServices = function() {
  return [this.service];
}
