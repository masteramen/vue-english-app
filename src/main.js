import 'babel-polyfill'
import Vue from 'vue'

import MintUI from 'mint-ui'
import 'mint-ui/lib/style.css'

import App from './App.vue'

Vue.use(MintUI)

import router from './router'
import store from './store'
import fastclick from 'fastclick'
import VueLazyLoad from 'vue-lazyload'
import 'common/stylus/index.styl'

import {downloadArtilePic} from 'common/js/service'
import * as touch from 'common/js/touch'  

import $ from 'jquery'
window.$=$
//import vConsole from 'vconsole'
//console.log('Hello world')
//new vConsole()
fastclick.attach(document.body)
let codovaSrc='cordova.js'
if (window.location.protocol !== 'file:' ) {
	codovaSrc='http://192.168.1.126:8000/'+codovaSrc

}

  var cordovaScript = document.createElement('script')
  cordovaScript.setAttribute('type', 'text/javascript')
  cordovaScript.setAttribute('src', codovaSrc)
  document.body.appendChild(cordovaScript)
  
document.addEventListener('deviceready', function(){


if(device.platform!='browser'){


  //StatusBar.backgroundColorByName("white");
  StatusBar.overlaysWebView(false);

  StatusBar.styleLightContent()

 // StatusBar.hide()
 StatusBar.backgroundColorByName("red");

}


Vue.use(VueLazyLoad, {
	loading:require('common/image/default.png')
})

/* eslint-disable no-new */
var vm=new Vue({
  el: '#app',
  render: h => h(App),
  store,
  router
})


//vm.$Lazyload.$off('loaded', handler)
//vm.$Lazyload.$off('loaded')

	  
  }, false);

