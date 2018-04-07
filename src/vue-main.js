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
  error: 'https://fakeimg.pl/100x100/282828/eae0d0/?retina=1&text=?', // require('common/image/default.png')
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

//navigator.splashscreen.hide()

new Vue({
  el: '#app',
  render: h => h(App),
  store,
  router,
  template: '<app/>' // app is registered in vue-swipe-router which is used in router.js
})


// show the interstitial later, e.g. at end of game level
// setTimeout(_=>{if(AdMob) AdMob.showInterstitial();},5000)


