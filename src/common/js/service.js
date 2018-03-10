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

async function downloadLyric(article, onProgress) {
  if (article.CONTENT) return article
  return await dataManager.getDetail(article)
}

export async function getSilent() {
  return require('./../../../static/silent.mp3')
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
            dataManager.update(article)
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
      return article.getLyric(true).then(() => {
        return article.getAudio()
      })
    }, article).then(() => {
      console.log(`download artile ${article.ID}  ok`)
    }).catch(err => {
      console.log(err)
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

function formate2Lyric(detailObj) {
  let duration = 0
  let content = detailObj.CONTENT
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
  let lines = text.replace(/(;)/g, '$1\n').replace(/([.?!])[\s\n]+(?=[A-Z])/g, '$1|').split(/[|\n]+/).filter(n=>n.trim())

  return (async () => {
    let timeLines = lines.filter(x => x.trim().match(/^[[]*\d+:\d+/))
    if (timeLines.lenght > 3) {
      str = +text.replace(/(\d+(:\d+)+)/g, '[$1]')
    } else {
      var words = text.split(/\s+/).filter(x => x)
      var wordTime = duration / words.length
      lines.forEach((line, index) => {
        let wc = line.split(/\s+/).filter(x => x).length
        let takeTImes = wc * wordTime
        let m = fixnum(parseInt(timer / 60))
        let s = fixnum(parseInt(timer % 60))
        let ms = fixnum(0)
        str += `[${m}:${s}.${ms}]${line}\n`
        timer += takeTImes
      })
    }
      // if (content.length > 1) { str += '\n' + content[1] }
    str = str.split(/\n/).map(x => x.match(/^\[\d+/) ? x.replace(/([a-z]+)/gi, '<span>$1</span>') : x).join('\n')
    let dict = await ts.translateWithAudio(detailObj.TITLE)
    detailObj.TITLE_CN = dict.result[0]
    return [lines, str]
  })()
}

export class Article {
  constructor(data) {
    this.data = data
    for (let k in data) {
      this[k] = data[k]
    }
  }

  async getLyric(translate) {
    let lyric = ''
    let lines = []

    if (!this.CONTENT) {
      await downloadLyric(this);
      [lines, lyric] = await formate2Lyric(this)
      this.CONTENT = true
      await fs.write(`${this.ID}.json`, JSON.stringify([lines, lyric]))
      await dataManager.update(this)
    } else {
      [lines, lyric] = JSON.parse(await fs.read(`${this.ID}.json`))
    }
    if (translate) {
      for (let index = 0; index < lines.length; index++) {
        await this.tr(lines, index)
      }
    }

    return {lines, lyric}
  }

  async tr(lines, index) {
    let seq = `${this.ID}-${index}-tr.txt`
    try {
      if (await fs.exists(seq)) {
        return await fs.read(seq)
      }
    } catch (e) {
      console.log(e)
    }

    let dict = await ts.translateWithAudio(lines[index])
    await fs.write(seq, dict.result[0])

    return dict.result[0]
  }

  getAudio(onProgress) {
    if (!this.AUDIO_URL) {
      return Promise.reject({code: 1, desc: '找不到音频文件！'})
    }
    if (navigator.connection.type === Connection.CELL && configProvider.getConfig().checklistValues.indexOf('download-cell-net-work') === -1) {
      return Promise.reject({code: 0, desc: '请先设置开启手机网络下载音频选项！'})
    }
    return downloadAudio(this, onProgress)
  }

}

export function createArticle(row) {
  row.percent = 0
  return new Article(row)
}

export const configProvider = dataManager.getConfigProvider()

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

