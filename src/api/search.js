import jsonp from 'common/js/jsonp'
import {getRConfig, headers} from './config'
import axios from 'axios'
export function getHotKey() {
  // return jsonp(url, data, options)
  return getRConfig().then((config) => { return config.hotkey })
  // return Promise.resolve({})
}

export function search(query, page, zhida, perpage) {
  const data = Object.assign({}, {}, {})
  console.log(data)
  return getRConfig().then(config => {
    return axios.get(`${config.searchRssUrl}&q=${encodeURIComponent(query)}`, {
      headers: headers
    }).then(resp => {
      console.log(resp.data)
      return resp.data.results
    }).catch(err => {
      console.log(err)
    })
  })
}
