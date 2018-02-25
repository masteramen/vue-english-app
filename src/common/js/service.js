import Queue from 'common/js/promise-queue'
import CordovaPromiseFS from 'common/js/promise-fs'
import * as envApi from './env-api'
import {runAll} from 'common/js/runs'
const dataManager = require('./data-manager')

const fs = CordovaPromiseFS({
  persistent: true, // or false
  storageSize: 600 * 1024 * 1024, // storage size in bytes, default 20MB
  concurrency: 3, // how many concurrent uploads/downloads?
  Promise: Promise // Your favorite Promise/A+ library!
})

export function downloadArtilePic(article, onProgress) {
  let localFile = `${article.ID}.jpg`
  return fs.exists(localFile).then(exists => {
    if (exists) {
      let url = fs.toURLSync(localFile)
      console.log(url)
      return url
    } else {
      return Promise.reject()
    }
  }).catch(err => {
    let nativeUrl = fs.toURLSync(localFile)
    return fs.download(envApi.interceptUrl(article.IMG_URL), nativeUrl, {}, onProgress).then(ret => {
      article.IMG_URL = nativeUrl
      return nativeUrl
    }).catch(err => {
      // console.log(err);
      console.log('err')
    })
  })
}

function downloadLyric(article, onProgress) {
  if (article.CONTENT) return Promise.resolve(article)
  return dataManager.getDetail(article).then(detailObj => {
    console.log(article)
    return detailObj
  })
}

export function getSilent() {
  return Promise.resolve(require('./../../../static/silent.mp3'))
}

function downloadAudio(article, onProgress) {
  let localFile = `${article.ID}.mp3`
  if (!article.AUDIO_URL) return article

  return fs.exists(localFile).then(exists => {
    if (exists) {
      let url = fs.toURLSync(localFile)
      console.log(url)
      return url
    } else {
      return Promise.reject()
    }
  }).catch(err => {
    let nativeUrl = fs.toURLSync(localFile)
    return fs.download(envApi.interceptUrl(article.AUDIO_URL), nativeUrl, {}, progressEvt => {
      if (progressEvt.lengthComputable) {
        article.percent = Math.round((progressEvt.loaded / progressEvt.total) * 100)
      }
      onProgress && onProgress(progressEvt)
    }).then(ret => {
      fs.fs.then(fs => {
        fs.root.getFile(localFile, {create: false}, function (fileEntry) {
          fileEntry.file(f => {
            article.TOTAL = f.size
          })
        })
      })

      return nativeUrl
    }).catch(err => {
      // console.log(err);
      console.log('err')
    })
  })
}

let downLoadQueue = new Queue(1)

export function downloadAllArticles(articles) {
  articles.forEach(article => {
    downLoadQueue.add(function () {
      console.log('download .........' + article.ID)
      return article.getLyric().then(() => {
        return article.getAudio()
      })
    }, article).then(() => {
      console.log(`download artile ${article.ID}  ok`)
    }).catch(err => {
      console.log(`dowload article ${article.ID} fail.`)
    })
  })
}

export function getLatestArticles() {
  return envApi.getLatestArticles()
}

export function fetchLatest() {
  return runAll()
}

function getLyricContent(detailObj) {
  let content = detailObj.CONTENT

  let duration = 0
  if (detailObj.DURATION) {
    duration = detailObj.DURATION
  } else if (detailObj.TOTAL) {
    duration = detailObj.TOTAL / 2733529 * 170
  } else {
    duration = content.split(/[\n\s]+/).length * 0.7
  }

  let text = content

  let timer = 0
  let str = `[ti:${detailObj.TITLE}]\r\n`
  str += `[by:${detailObj.REFERER}]\n`
  let fixnum = n => {
    return (Array(2).join('0') + n).slice(-2)
  }
  var lines = text.replace(/([.?!])[\s\n]+(?=[A-Z])/g, '$1|').split(/[|\n]+/)
    // text.replace(/([.?!])/g, '\n$1\n').replace(/\n+/g, '\n').replace(/\n([.?!])/g, '$1').split(/\n/).map(x => x.trim()).filter(x => x)
  // .split(/\n/)

  let timeLines = lines.filter(x => x.trim().match(/^[[]*\d+:\d+/))
  if (timeLines.lenght > 3) {
    str = +text.replace(/(\d+(:\d+)+)/g, '[$1]')
  } else {
    var words = text.split(/\s+/).filter(x => x)
    var wordTime = duration / words.length
    lines.forEach(line => {
      let wc = line.split(/\s+/).filter(x => x).length
      let takeTImes = wc * wordTime
      let m = fixnum(parseInt(timer / 60))
      let s = fixnum(parseInt(timer % 60))
      let ms = fixnum(0)
      str += `[${m}:${s}.${ms}]${line}\r\n`
      timer += takeTImes
    })
  }
  if (content.length > 1) { str += '\n' + content[1] }
  str = str.split(/\n/).map(x => x.match(/^\[\d+/) ? x.replace(/([a-z]+)/gi, '<span>$1</span>') : x).join('\n')

  return str
}

export class Article {
  constructor(data) {
    this.data = data
    for (let k in data) {
      this[k] = data[k]
    }
  }

  getLyric(updateSong) {
    if (this.lyric) {
      return Promise.resolve(this.lyric)
    }
    if (!this.CONTENT || this.CONTENT.split(/\n/).some(line => !line.match(/\[.*?\]/))) {
      return downloadLyric(this).then(detailObj => {
        let lyricContent = getLyricContent(detailObj)
        console.log(lyricContent)
        return lyricContent
      })
    }
    return Promise.resolve(this.CONTENT)
  }

  getAudio(onProgress) {
    if (!this.AUDIO_URL) {
      return Promise.reject({code: 1, desc: '找不到音频文件！'})
    }
    if (navigator.connection.type === Connection.CELL && configProvider.getConfig().checklistValues.indexOf('download-cell-net-work')===-1) {
      return Promise.reject({code: 0, desc: '请先设置开启手机网络下载音频选项！'})
    }
    return downloadAudio(this, onProgress)
  }

}

export function createArticle(row) {
  console.log(row)
  row.percent = 0
  return new Article(row)
}

export function getClassfyList() {
  return envApi.getClassfyList()
}
function getConfigProvider() {
  let STORAGE_KEY = 'settings.config'
  let storage = {

    getConfig: function () {
      let config = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return Object.assign({
        checklistValues: ['disp-new-word-ts','disp-p-ts'],
        isDebug:0,
        nDay: '3'
      }, config)
    },
    save: function (config) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    }
  }
  return storage
}
export const configProvider = getConfigProvider()

import * as ts from 'common/js/translation'
export function getDict(text) {
  return dataManager.getDict(text).then(dicts => {
    if (dicts && dicts.length > 0) {
      return {text: dicts[0].QTEXT, result: dicts[0].RESULT, detail: dicts[0].DETAIL, audio: dicts[0].AUDIO}
    } else {
      return Promise.reject({'text': text})
    }
  }).catch(dict => {

    return ts.translateWithAudio(text).then(dict => {
      return fs.ensure('dict').then(_ => {
          let nativeUrl = fs.toURLSync(`dict/${dict.text}.mp3`)
          return fs.download(envApi.interceptUrl(dict.audio), nativeUrl, {
            trustAllHosts: true,
            headers: {
              'referer': dict.audio,
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
              'Connection': 'close',
              'Accept-Language': 'zh-CN'
            }
          }, progressEvt => {}).then(ret => {
            dict.audio = nativeUrl
            return dict
          })
      }).then(dict => {
        let dictObj = {qtext: dict.text, result: dict.result[0], detail: dict.dict && dict.dict[0] || '', audio: dict.audio}
        console.log(dictObj)
        dataManager.saveDict(dictObj)
        return dict
      })
    })
  })
}
export function getDictList() {
  return dataManager.getDictList()
}

