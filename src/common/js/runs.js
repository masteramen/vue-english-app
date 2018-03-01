
const load = require('little-loader')
const $ = require('jquery')
const urllib = require('url')
const dataManager = require('./data-manager')
import './data-provider/data'

let loadedRemote = false
module.exports.runAll = function runAll() {
  return new Promise((resolve, reject) => {
    if (false && !loadedRemote) {
      load('http://192.168.1.126:8000/www/js/data.js', function(data) {
        loadedRemote = true
        for (let job of window.configJobs) {
          job($, urllib, dataManager)
        }
        dataManager.runJobs().then(_ => { resolve() })
      }, {})
    } else {
      for (let job of window.configJobs) {
        job($, urllib, dataManager)
      }
      dataManager.runJobs().then(_ => { resolve() })
    }
  })
}

