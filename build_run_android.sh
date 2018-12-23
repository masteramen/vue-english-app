#!/bin/sh
cnpm run build && cd ../cordova-app && (cordova emulate android --target="Nexus_5_API_26" || cordova run android)
