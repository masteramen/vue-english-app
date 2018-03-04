import jsonp from 'common/js/jsonp'
import {commonParams, options} from './config'
import axios from 'axios'
export function getHotKey() {
  const url = 'https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg'

  const data = Object.assign({}, commonParams, {
    uin: 0,
    needNewCode: 1,
    platform: 'h5'
  })

  return jsonp(url, data, options)
}

/*export function search(query, page, zhida, perpage) {
  const url = 'https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp'
  console.log(url)
  const data = Object.assign({}, commonParams, {
    w: query,
    p: page,
    perpage,
    n: perpage,
    catZhida: zhida ? 1 : 0,
    zhidaqu: 1,
    t: 0,
    flag: 1,
    ie: 'utf-8',
    sem: 1,
    aggr: 0,
    remoteplace: 'txt.mqq.all',
    uin: 0,
    needNewCode: 1,
    platform: 'h5'
  })

  return jsonp(url, data, options)
}*/
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
