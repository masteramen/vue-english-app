const $ = require('jquery')
const urllib = require('url')
const dataManager = require('./data-manager')
import './data-provider/rss'
import './data-provider/data'
module.exports.runAll = function runAll() {

  return (async () => {
    for (let job of window.configJobs) {
      job($, urllib, dataManager)
    }
    return await dataManager.runJobs()
  })()
}

