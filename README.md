# homebridge-esp8266leds
An homebridge plugin that create an HomeKit Lightbulb that will work together with https://github.com/rvt/esp8266leds

# why yet another esp8266 led controller
A lot of EPS8266 let example I found use on/or or use 256 level RGB model. I wanted something more accurate when it came to color reproduction and better control over dimming.
esp8266 leds uses floating point math (floating point math on esp8266 is extreemly fast), uses cie1931 curve for dimming and uses a RGB map for color reproduction so that yellows are more yellow, and oranges, look more natural.
Dimming can be done in 2047 level instead of 256 as much other libraries use.

So for example when implementing a wake up light we get very gradual light incresements from very orange to light yellows.


# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-esp8266leds) and should be installed "globally" by typing:

    npm install -g homebridge-esp8266leds

# Release notes
Version 0.0.1
+ Initial public draft

Version 1.0.0
+ Prevent the light´s from jumping back and forth between settings see also https://github.com/nfarina/homebridge/issues/807 for people with similar issues.

# Configuration
Remember to configure the plugin in config.json in your home directory inside the .homebridge directory. Configuration parameters:
the URL, username and password is for your MQTT login.
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
