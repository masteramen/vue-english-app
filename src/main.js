import FastClick from 'fastclick'

FastClick.attach(document.body)

let codovaSrc = 'cordova.js'
if (window.location.protocol !== 'file:') {
  codovaSrc = location.protocol + '//' + location.hostname + ':8000/' + codovaSrc
}

var cordovaScript = document.createElement('script')
cordovaScript.setAttribute('type', 'text/javascript')
cordovaScript.setAttribute('src', codovaSrc)
document.body.appendChild(cordovaScript)

document.addEventListener('deviceready', function() {
  document.addEventListener("offline", function () {
    window.online=false
  }, false);

  require.ensure([], function(require) {
    var main = require('./vue-main')
  }, 'main')
}, false)

