import {decrypt2} from '../common/js/crypto'
import axios from 'axios'

export const commonParams = {
  g_tk: 1928093487,
  inCharset: 'utf-8',
  outCharset: 'utf-8',
  notice: 0,
  format: 'jsonp'
}

export const options = {
  param: 'jsonpCallback'
}

export const ERR_OK = 0

export async function getLatestSubscriptionList() {
  var feed = 'http://www.jfox.info/rss/rsslist.php'

  return axios.get(feed, {}).then((res) => {
    let ret = []
    $($.parseXML(decrypt2(res.data.trim()))).find('item').each(function () {
      var el = $(this)
      ret.push({
        feedId: el.find('link').text(),
        iconUrl: '',
        type: el.find('type').text(),
        title: el.find('title').text(),
        alias: el.find('alias').text(),
        description: el.find('description').text()
      })
    })
    return ret
  })
}

axios.interceptors.request.use(
  config => {
    config.url = interceptUrl(config.url)
    return config
  },
  err => {
    return Promise.reject(err)
  })

axios.defaults.timeout =  6000;
//在main.js设置全局的请求次数，请求的间隙
axios.defaults.retry = 4;
axios.defaults.retryDelay = 1000;

axios.interceptors.response.use(undefined, function axiosRetryInterceptor(err) {
  var config = err.config;
  // If config does not exist or the retry option is not set, reject
  if(!config || !config.retry) return Promise.reject(err);

  // Set the variable for keeping track of the retry count
  config.__retryCount = config.__retryCount || 0;

  // Check if we've maxed out the total number of retries
  if(config.__retryCount >= config.retry) {
    // Reject with the error
    return Promise.reject(err);
  }

  // Increase the retry count
  config.__retryCount += 1;

  // Create new promise to handle exponential backoff
  var backoff = new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, config.retryDelay || 1);
  });

  // Return the promise in which recalls axios to retry the request
  return backoff.then(function() {
    return axios(config);
  });
});

export function interceptUrl(url) {

  if (window.device.platform === 'browser' && url.indexOf('http') === 0) {
    return location.protocol + '//' + location.host + `/api/url?url=${encodeURIComponent(url)}`
  }
  return url
}
