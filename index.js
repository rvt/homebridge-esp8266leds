'use strict';

var Service, Characteristic;
var mqtt = require("mqtt");


function esp8266ledsAccessory(log, config) {
	var that = this;
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
			qos: 2,
			retain: true
		},
		username: config["username"],
		password: config["password"],
		rejectUnauthorized: false
	};
	this.caption = config["caption"];
	this.baseTopic = config["baseTopic"];
	
	// Local state of current values
	this.currentHsb = {
		on:false,
		brightness:0,
		hue:0,
		saturation:0
	}

	this.mqttTimeout = setTimeout( () => {}, 1);

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
	this.client.on('error', function (err) {
		that.log('Error event on MQTT:', err);
	});

	this.client.on('message', function (topic, message) {
		var strMessage = message.toString();

		if (topic === that.baseTopic + "/color/state") {
			var isOn = strMessage.includes("ON");
			var isOff = strMessage.includes("OFF");
			that.log(topic, "Received from MQTT:" + strMessage);

			// Handle on/off
			if (isOn || isOff) {
				that.currentHsb.on = isOn === true?true: (isOff === true?false:true);
				that.service.getCharacteristic(Characteristic.On).setValue(that.currentHsb.on, undefined, 'fromSetValue');
				//that.log(topic, "power:"+that.currentHsb.on);
			}

			// handle hsb
			var regex = /(hsb=)([,.\d]+)/;
			var hsbString;
			if ((hsbString = regex.exec(strMessage)) !== null) {

					var hsbw1w2 = hsbString[2].split(',');
					var hsb=hsbw1w2.slice(0,3);
					that.currentHsb.hue = hsb[0];		
					that.currentHsb.brightness = hsb[2];		
					that.currentHsb.saturation = hsb[1];
					that.service.getCharacteristic(Characteristic.Hue).setValue(that.currentHsb.hue, undefined, 'fromSetValue');
					that.service.getCharacteristic(Characteristic.Saturation).setValue(that.currentHsb.saturation, undefined, 'fromSetValue');		
					that.service.getCharacteristic(Characteristic.Brightness).setValue(that.currentHsb.brightness, undefined, 'fromSetValue');
					//that.log(topic, "Color h:" + that.currentHsb.hue + " s:" + that.currentHsb.saturation + " b:"+that.currentHsb.brightness);
			}
		}

	});

	this.publishToMqtt = function() {
		clearInterval(that.mqttTimeout);
		setTimeout( () => {
			var mqttMessage = "hsb=" + that.currentHsb.hue+","+that.currentHsb.saturation+","+that.currentHsb.brightness+" "+ (that.currentHsb.on?"ON":"OFF");
			if (mqttMessage !== that.lastMqttMessage) {
				that.log("Sending:",that.baseTopic+"/color " + mqttMessage);
				that.client.publish(that.baseTopic+"/color", mqttMessage);
				that.lastMqttMessage = mqttMessage;
			}
		}, 25);
	}

	this.client.subscribe(this.baseTopic + "/color/state");
}

module.exports = function(homebridge) {
  	Service = homebridge.hap.Service;
  	Characteristic = homebridge.hap.Characteristic;

  	homebridge.registerAccessory("homebridge-esp8266leds", "esp8266leds", esp8266ledsAccessory);
}

esp8266ledsAccessory.prototype.getStatus = function(callback) {
    callback(null, this.currentHsb.on);
}

esp8266ledsAccessory.prototype.setStatus = function(status, callback, context) {
	if(context !== 'fromSetValue') {
		this.currentHsb.on = status;
		this.publishToMqtt();
	}
	callback();
}

esp8266ledsAccessory.prototype.getBrightness = function(callback) {
    callback(null, this.currentHsb.brightness);
}

esp8266ledsAccessory.prototype.setBrightness = function(brightness, callback, context) {
	if(context !== 'fromSetValue') {
		this.currentHsb.brightness = brightness;
		this.publishToMqtt();
}
	callback();
}

esp8266ledsAccessory.prototype.getHue = function(callback) {
    callback(null, this.currentHsb.hue);
}

esp8266ledsAccessory.prototype.setHue = function(hue, callback, context) {
	if(context !== 'fromSetValue') {
		this.currentHsb.hue = hue;
		this.publishToMqtt();
	}
	callback();
}

esp8266ledsAccessory.prototype.getSaturation = function(callback) {
    callback(null, this.currentHsb.saturation);
}

esp8266ledsAccessory.prototype.setSaturation = function(saturation, callback, context) {
	if(context !== 'fromSetValue') {
		this.currentHsb.saturation = saturation;
		this.publishToMqtt();
	}
	callback();
}

esp8266ledsAccessory.prototype.getServices = function() {
  return [this.service];
}
