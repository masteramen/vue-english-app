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

if(device.platform!='browser'){


  //StatusBar.backgroundColorByName("white");
  StatusBar.overlaysWebView(false);

  StatusBar.styleLightContent()

  // StatusBar.hide()
  StatusBar.backgroundColorByName("red");

}


Vue.use(VueLazyLoad, {
  loading:require('common/image/default.png'),
  error:require('common/image/default.png')
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

var admobid = {};
// select the right Ad Id according to platform
if( /(android)/i.test(navigator.userAgent) ) {
  admobid = { // for Android
    banner: 'ca-app-pub-9477174171188196/3994804736',
    interstitial: 'ca-app-pub-6869992474017983/1657046752'
  };
} else if(/(ipod|iphone|ipad)/i.test(navigator.userAgent)) {
  admobid = { // for iOS
    banner: 'ca-app-pub-9477174171188196/3994804736',
    interstitial: 'ca-app-pub-6869992474017983/7563979554'
  };
} else {
  admobid = { // for Windows Phone
    banner: 'ca-app-pub-9477174171188196/3994804736',
    interstitial: 'ca-app-pub-6869992474017983/1355127956'
  };
}

// it will display smart banner at top center, using the default options

if(AdMob) {
  //AdMob.createBanner( admobid.banner );

}
