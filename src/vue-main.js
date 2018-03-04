import 'babel-polyfill'
import Vue from 'vue'

import MintUI from 'mint-ui'
import 'mint-ui/lib/style.css'

import App from './App.vue'

Vue.use(MintUI)

import router from './router'
import store from './store'
import VueLazyLoad from 'vue-lazyload'
import 'common/stylus/index.styl'

import $ from 'jquery'
window.$ = $

if (device.platform != 'browser') {
  // StatusBar.backgroundColorByName("white");
  // StatusBar.overlaysWebView(true)
  // StatusBar.backgroundColorByHexString('#ffffff');
  // StatusBar.styleDefault();
 // StatusBar.styleLightContent()

  // StatusBar.hide()
  // StatusBar.backgroundColorByName('red')
}

Vue.use(VueLazyLoad, {
  loading: 'https://fakeimg.pl/100x100/282828/eae0d0/?retina=1&text=Loading...', // require('https://fakeimg.pl/100x100/282828/eae0d0/?retina=1&text=Loading...'),
  error: 'https://fakeimg.pl/100x100/282828/eae0d0/?retina=1&text=?',// require('common/image/default.png')
  lazyComponent: true
})

/* eslint-disable no-new */
/*
var vm=new Vue({
  el: '#app',
  render: h => h(App),
  store,
  router
}) */
/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App),
  store,
  router,
  template: '<app/>' // app is registered in vue-swipe-router which is used in router.js
})

var admobid = {}
// select the right Ad Id according to platform
if (/(android)/i.test(navigator.userAgent)) {
  admobid = { // for Android
    banner: 'ca-app-pub-9477174171188196/3994804736',
    interstitial: 'ca-app-pub-6869992474017983/1657046752'
  }
} else if (/(ipod|iphone|ipad)/i.test(navigator.userAgent)) {
  admobid = { // for iOS
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    reward: 'ca-app-pub-3940256099942544/5224354917'
  }
} else {
  admobid = { // for Windows Phone
    banner: 'ca-app-pub-9477174171188196/3994804736',
    interstitial: 'ca-app-pub-6869992474017983/1355127956'
  }
}

if (AdMob) {
  AdMob.setOptions({isTesting: true}, _ => {
    AdMob.prepareInterstitial({adId: admobid.interstitial, autoShow: false})

    AdMob.prepareRewardVideoAd({adId: 'ca-app-pub-3940256099942544/1712485313', autoShow: true}, _ => {


    }, _ => {
      alert('reward fail')
    })

    // alert('ready1')
  })
}

// show the interstitial later, e.g. at end of game level
// setTimeout(_=>{if(AdMob) AdMob.showInterstitial();},5000)
navigator.splashscreen.hide()

