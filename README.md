# homebridge-esp8266leds
An homebridge plugin that create an HomeKit Lightbulb that will work together with https://github.com/rvt/esp8266leds

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-esp8266leds) and should be installed "globally" by typing:

    npm install -g homebridge-esp8266leds

# Release notes
Version 0.0.1
+ Initial public draft

# Configuration
Remember to configure the plugin in config.json in your home directory inside the .homebridge directory. Configuration parameters:
```javascript
{
  "accessory": "esp8266leds",
  "name": "Bed Light",
  "url": "http://localhost:1883",
  "username": "<USERNAME>",
  "password": "<PASSWORD>",
  "caption": "Bed Light",
  "baseTopic": "RGBW/00AD4715"
}
```
