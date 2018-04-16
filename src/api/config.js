import {decrypt2} from '../common/js/crypto'
import axios from 'axios'
import jsonp from 'common/js/jsonp'
import $ from 'jquery'
import parseFeedString from 'common/js/rss-parser'

export const ERR_OK = 200
export const FEED_STATUS = {
  ok: 'ok',
  fail: 'fail',
  unknow: '',
  checking: 'check'
}
let rConfig = false
let configPromise = jsonp('http://www.jfox.info/rss/config.php', {}, {})
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
export async function checkFeed(feedUrl) {
  let defaultRet = {status: FEED_STATUS.fail}

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
  }
  const data = Object.assign({}, {}, {})

  try {
    try {
      return await axios.get(`http://www.jfox.info/rss/check.php?feed=${encodeURIComponent(feedUrl)}`, {
        params: data,
        headers: headers,
        retry: 0
      })
    } catch (e) {
      let resp = await axios.get(feedUrl, {
        params: data,
        headers: headers,
        retry: 0
      })

      let feedObj = parseFeedString(resp.data)
      let url = ''
      for (let i = 0; i < feedObj.item.length; i++) {
        url = feedObj.item[i].link
        if (url) break
      }
      if (url) {
        let resp = await axios.get(url, {
          params: data,
          headers: headers,
          retry: 0
        })
        Object.assign(defaultRet, {feedType: resp.data.match(/\b.*?\.mp3\b/i) ? 'audio' : '', status: FEED_STATUS.ok})
      }
    }
  } catch (e) {
    console.log(e)
  }
  console.log(defaultRet)
  return defaultRet
}

export function interceptUrl(url) {
  if (window.device.platform === 'browser' && url.indexOf('api/url') === -1) {
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
  AdMob.admobid = {admobid: {}}
  let rConfig = await getRConfig()
  for (let admob in rConfig.admob) {
    if (new RegExp(admob, 'i').test(navigator.userAgent)) {
      AdMob.admobid = rConfig.admob[admob]
      break
    }
  }

  if (AdMob && AdMob.admobid.interstitial) AdMob.prepareInterstitial({adId: AdMob.admobid.interstitial, autoShow: false})
  if (AdMob && AdMob.admobid.reward) AdMob.prepareRewardVideoAd({adId: AdMob.admobid.reward, autoShow: false})
})()

