import jsonp from 'common/js/jsonp'
import {commonParams, options} from './config'
import axios from 'axios'
export function getHotKey() {

  //return jsonp(url, data, options)
  return Promise.resolve({})
}

export function search(query, page, zhida, perpage) {

  const headers = {
   // 'referer': 'https://feedly.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
    'Connection': 'close',
 //   'Accept-Language': 'zh-CN'
  };

  const data = Object.assign({}, {}, {})
  console.log(data)
  return axios.get(`http://cloud.feedly.com/v3/search/feeds?q=${encodeURIComponent(query)}&n=100&fullTerm=false&organic=true&promoted=true&locale=en`, {
    params: data,
    headers: headers
  }).then(resp => {
    console.log(resp.data)
    return resp.data.results;
  }).catch(err=>{
      console.log(err)
  })
}
