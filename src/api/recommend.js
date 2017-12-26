import jsonp from 'common/js/jsonp'
import {commonParams, options,ERR_OK} from './config'
import axios from 'axios'

export function getRecommend() {
  const url = 'https://c.y.qq.com/musichall/fcgi-bin/fcg_yqqhomepagerecommend.fcg'

  const data = Object.assign({}, commonParams, {
    platform: 'h5',
    uin: 0,
    needNewCode: 1
  })

  return jsonp(url, data, options)
}

export function getDiscList2() {
  const url = '/api/getDiscList'

 //return new Promise(function(resolve,reject){});
 return  Promise.resolve({
	 code:ERR_OK,
	 data:{
		list:[{
			'imgurl':'http://p.qpic.cn/music_cover/PiajxSqBRaELMiaFiadPqlaJy3Jr1pbibnnPbfiasYW1pV8vKm4pkMJ9GiaA/600?n=1',
			title:'更新指定的数据id也可以是动态的',
			name:'',
			dissid:1,
			content:'kdkfdfksdfdksfkdk'
			}]
 }
 });
}
export function getDiscList() {
  const url = '/api/getDiscList'

  const data = Object.assign({}, commonParams, {
    platform: 'yqq',
    hostUin: 0,
    sin: 0,
    ein: 29,
    sortId: 5,
    needNewCode: 0,
    categoryId: 10000000,
    rnd: Math.random(),
    format: 'json'
  })

  return axios.get(url, {
    params: data
  }).then((res) => {
    return Promise.resolve(res.data)
  })
}

export function getSongList(disstid) {
  const url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg'

  const data = Object.assign({}, commonParams, {
    disstid,
    type: 1,
    json: 1,
    utf8: 1,
    onlysong: 0,
    platform: 'yqq',
    hostUin: 0,
    needNewCode: 0
  })

  return jsonp(url, data, options)
}