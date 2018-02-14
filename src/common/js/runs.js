 const run51 = require('./sites/51VOA').run
// import {run as run51} from './sites/51VOA'
// const Queue = require('promise-queue')
// import queue from 'common/js/promise-queue'
import {queue,runJobs} from './db-repo'
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

module.exports.runAll = function runAll() {
  runJobs()
  return new Promise((resolve, reject) => {
    waitUntil(() => queue.getQueueLength() === 0, resolve, 1000)
  })
}

