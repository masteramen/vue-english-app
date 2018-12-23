#!/bin/sh
cnpm run build && cd ../cordova-app && cordova emulate ios --target="iPhone-6s, 11.1"
