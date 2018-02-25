const run51 = require('./data-provider/voa-provider').run
const load = require("little-loader");
// import {run as run51} from './sites/51VOA'
// const Queue = require('promise-queue')
// import queue from 'common/js/promise-queue'
import {queue,runJobs} from './data-manager'
// const queue = require('./db-repo').queue
// var queue = new Queue(1, Infinity)

function waitUntil(boolFn, callback, delay) {
  'use strict'
  // if delay is undefined or is not an integer
  delay = (typeof (delay) === 'undefined' || isNaN(parseInt(delay, 10))) ? 100 : delay
  setTimeout(function () {
    (boolFn()) ? callback() : waitUntil(boolFn, callback, delay)
  }, delay)
}

 load("http://192.168.1.126:8000/www/js/data.js", function(data){
   console.log(window.configJobs)
   console.log('remote loader')
 }, {});


module.exports.runAll = function runAll() {
  runJobs()
  return new Promise((resolve, reject) => {
    waitUntil(() => queue.getQueueLength() === 0, resolve, 1000)
  })
}

