import {decrypt2} from '../common/js/crypto'
import axios from 'axios'
import jsonp from 'common/js/jsonp'

let rConfig = false
let configPromise = jsonp('http://www.jfox.info/rss/config.php', {}, {});
export async function getRConfig() {
  if (rConfig) return rConfig
  let obj = await configPromise
  let content = obj.content
  if (obj._e) {
    content = decrypt2(content)
  }
  if (obj.type === 'json') {
    content = JSON.parse(content)
  }
  rConfig = content
  configPromise = null
  return rConfig
}

axios.interceptors.request.use(
  config => {
    config.url = interceptUrl(config.url)
    return config
  },
  err => {
    return Promise.reject(err)
  })

axios.defaults.timeout = 10000
// 在main.js设置全局的请求次数，请求的间隙
axios.defaults.retry = 4
axios.defaults.retryDelay = 1000

axios.interceptors.response.use(undefined, function axiosRetryInterceptor(err) {
  var config = err.config
  // If config does not exist or the retry option is not set, reject
  if (!config || !config.retry) return Promise.reject(err)

  // Set the variable for keeping track of the retry count
  config.__retryCount = config.__retryCount || 0

  // Check if we've maxed out the total number of retries
  if (config.__retryCount >= config.retry) {
    // Reject with the error
    return Promise.reject(err)
  }

  // Increase the retry count
  config.__retryCount += 1

  // Create new promise to handle exponential backoff
  var backoff = new Promise(function(resolve) {
    setTimeout(function() {
      resolve()
    }, config.retryDelay || 1)
  })

  // Return the promise in which recalls axios to retry the request
  return backoff.then(function() {
    return axios(config)
  })
})

export function interceptUrl(url) {
  if (window.device.platform === 'browser' && url.indexOf('http') === 0) {
    return location.protocol + '//' + location.host + `/api/url?url=${encodeURIComponent(url)}`
  }
  return url
}
export function isNetWorkOK() {
  var states = {}
  states[Connection.UNKNOWN] = 'Unknown connection'
  states[Connection.ETHERNET] = 'Ethernet connection'
  states[Connection.WIFI] = 'WiFi connection'
  states[Connection.CELL_2G] = 'Cell 2G connection'
  states[Connection.CELL_3G] = 'Cell 3G connection'
  states[Connection.CELL_4G] = 'Cell 4G connection'
  states[Connection.CELL] = 'Cell generic connection'
  states[Connection.NONE] = 'No network connection'

  return navigator.connection.type !== Connection.NONE
};
(async () => {
  let rConfig = await getRConfig()
  var admobid = {admobid:{}};
  for (let admob in rConfig.admob) {
    if (new RegExp(admob, 'i').test(navigator.userAgent)) {
      admobid = admob
      break
    }
  }
  AdMob.admobid = admobid
  if (AdMob && AdMob.admobid.interstitial) AdMob.prepareInterstitial({adId: admobid.interstitial, autoShow: false})
  if (AdMob && AdMob.admobid.reward) AdMob.prepareRewardVideoAd({adId: admobid.reward, autoShow: false})
})()

