import Queue from 'common/js/promise-queue'
import CordovaPromiseFS from 'common/js/promise-fs'
import * as envApi from './env-api'
import {runAll} from 'common/js/runs'
import * as ts from 'common/js/translation'
import {formate2Lyric} from './util'
import {interceptUrl, getAudioUrl, host} from '../../api/config'
import axios from 'axios'

const dataManager = require('./data-manager')

const fs = CordovaPromiseFS({
  persistent: true, // or false
  storageSize: 600 * 1024 * 1024, // storage size in bytes, default 20MB
  concurrency: 3, // how many concurrent uploads/downloads?
  Promise: Promise // Your favorite Promise/A+ library!
})

export async function downloadArtilePic(article, onProgress) {
  let localFile = `${article.ID}.jpg`
  if (!article.thumb) return
  try {
    let exists = await fs.exists(localFile)
    if (exists) {
      let url = fs.toURLSync(localFile)
      console.log(url)
      return url
    }
  } catch (e) {

  }
  let nativeUrl = fs.toURLSync(localFile)
  await fs.download(interceptUrl(article.thumb), nativeUrl, {}, onProgress)
  article.thumb = nativeUrl
  return nativeUrl
}

async function downloadLyric(article) {
  return await dataManager.getDetail(article)
}

async function fileExist(file) {
  try {
    let exists = await fs.exists(file)
    if (exists) {
      return true
    }
  } catch (e) {

  }
  return false
}

let loadingList = []
let subscriberList = []
function waitFinish(id) {
  return new Promise((resolve, reject) => {
    if (!subscriberList[id])subscriberList[id] = []
    subscriberList[id].push([resolve, reject])
  })
}
function notify(id, success, fail) {
  if (subscriberList[id]) {
    for (let i = 0; i < subscriberList[id].length; i++) {
      if (success)subscriberList[id][i][0](success)
      else subscriberList[id][i][1](fail)
    }

    subscriberList[id] = null
  }
}
var path = require('path')
async function downloadAudio(article, onProgress, downLoadQueue) {
  if (!article.audio) return null
  let localFile = `vimedia/${md5(article.audio)}${path.extname(article.audio)}`
  if (await fileExist(localFile)) {
    console.log(localFile)
    return fs.toURLSync(localFile)
  }

  let nativeUrl = fs.toURLSync(localFile)
  console.log(nativeUrl)

  if (false && loadingList.indexOf(article.audio) > -1) {
    console.log('waiting finish:' + article.audio)
    return await waitFinish(article.audio)
  }
  async function downloadTask() {
    return (async _ => {
      if (await fileExist(localFile)) return article.audio

      loadingList.push(article.audio)

      return fs.download('__VIMediaCache___:' + interceptUrl(article.audio), nativeUrl, {}, progressEvt => {
        if (progressEvt.lengthComputable) {
          article.percent = Math.round((progressEvt.loaded / progressEvt.total) * 100)
          console.log('percent: ' + article.percent)
        }
        onProgress && onProgress(progressEvt)
      })
    })()
  }

  try {
    if (downLoadQueue) {
      await downLoadQueue.add(_ => {
        return downloadTask()
      })
    } else await downloadTask()

    let fileEntry = await fs.file(localFile, {create: false})

    fileEntry.file(f => {
      article.TOTAL = f.size
      dataManager.update(article)
    })
    loadingList.splice(loadingList.indexOf(article.ID), 1)
    notify(article.ID, nativeUrl)
  } catch (e) {
    notify(article.ID, null, e)
  }
  loadingList.splice(loadingList.indexOf(article.audio), 1)
  return nativeUrl
}

let downLoadQueue = new Queue(3, Infinity, true)
let downLoadLyricQueue = new Queue(2)
let downloadTranslateQ = new Queue(2)
export async function downloadAllArticles(articles, cancel) {
  for (let article of articles) {
    try {
      console.log('downlaod ....' + article.audio)
      if (cancel && cancel()) break
      await article.getLyric(true)
      await article.tsTitle()
      await article.getAudio(null, downLoadQueue)
      let mediaUrl = await article.getFinalAudioUrl()
      console.log(`mediaUrl:${mediaUrl}`)
      if (mediaUrl && mediaUrl.match(/^.*?\.mp4$/i)) {
        let srt = await article.getSrt()
        console.log(`srt:${srt}`)
      }
    } catch (e) {
      console.log('download error for  ' + article.audio)
      console.log(e)
    }
  }
}

export function getLatestArticles() {
  return envApi.getLatestArticles()
  // return Promise.reject()
}
import {getOrSetSetting} from './cache'
import {decrypt2, encrypt2, md5} from './crypto'

export async function fetchLatest() {
  console.log('fetchLatest')
  let time = new Date().getTime() - 86400000 * getOrSetSetting().nDay
  let oldArticles = await envApi.getOldArticlesAndMarkDelete(time)
  for (let o of oldArticles.contents) {
    try {
      await fs.removeDir(`${o.ID}`)
    } catch (e) {
      console.log(e)
    }
  }
  await envApi.deleteAllOldArticles()

  await runAll()
}

export class Article {
  constructor(data) {
    this.data = data
    for (let k in data) {
      this[k] = data[k]
    }
  }
  isAudio() {
    return this.audio || this.feedType === 'audio'
  }
  async getFinalAudioUrl() {
    // if/(this.audio)return this.audio
    if (!this.audio) {
      if (this.audio !== false) {
        this.audio = await getAudioUrl(this.link)
      }
    }
    /*
    if (this.audio) {
      let match = this.audio.match(/(\.mp[\d])[&?]?.*?$/i)
      let postFix = match ? match[1] : 'mp3'
      let localFile = `${this.ID}/${this.ID}${postFix}`
      if (await fileExist(localFile)) {
        return fs.toURLSync(localFile)
      }
    } */

    return this.audio
  }
  async getSrt() {
    await fs.ensure(`${this.ID}`)

    let path = `${this.ID}/${this.ID}.srt`
    let srtExist = await fs.exists(path)
    if (!srtExist) {
      let encryptStr = encrypt2(JSON.stringify({link: this.link, subtitle: 'srt'}))
      let feed = `${host}/rss/subtitle.php?_e=${encodeURIComponent(encryptStr)}`
      console.log('====');
      console.log(feed);
      console.log('====');
      let content = await axios.get(feed, {}).then((res) => {
        let content = res.data
        //content = decrypt2(content)
        console.log(content)
        return content
      })
      await fs.write(path, content)
    }

    return fs.toURLSync(path)
  }
  async tsTitle() {
    if (this.title_CN || this.title.match(/[\u4e00-\u9fa5]/)) return
    let dict = await ts.translateWithAudio(this.title)
    this.title_CN = dict.result[0]
    await dataManager.update(this)
  }
  async getLyric(translate) {
    await fs.ensure(`${this.ID}`)

    let path = `${this.ID}/${this.ID}.json`
    let jsonExist = await fs.exists(path)
    if (this.LRC_OK !== '1') {
      if (!jsonExist || new Date().getTime() - this.LAST_DOWNLOAD_DATE > 3600000) {
        try {
          await downLoadLyricQueue.add(_ => { return downloadLyric(this) })
          this.LAST_DOWNLOAD_DATE = new Date().getTime()
        } catch (e) {
          console.log(e)
        }
      }
      let lyric = ''
      let lines = []
      let needSave = false
      if (this.CONTENT && this.CONTENT.substring(0, 4) === '[ti:') {
        let split = this.CONTENT.split(/\n/)
        split.shift()
        this.title_CN = split.shift()
        let transArr = split.filter((s, i) => i % 2 === 1)
        lyric = split.filter((s, i) => i % 2 === 0).map(x => x.match(/^\[\d+/) ? x.replace(/([a-z]+)/gi, '<span>$1</span>') : x).join('\n')

        lines = split.filter((s, i) => i % 2 === 0).map(x => x.replace(/\[.*?\]/))

        for (let i = 0; i < transArr.length; i++) {
          let seq = `${this.ID}/${i}-tr.txt`
          await fs.remove(seq, false)
          await fs.write(seq, transArr[i])
        }
        this.LRC_OK = '1'
        needSave = true
      } else if (this.LRC_OK !== '2') {
        [lines, lyric] = await formate2Lyric(this)
        if (translate) {
          for (let index = 0; index < lines.length; index++) {
            await this.translate(lines, index)
          }
        }
        if (this.DURATION) this.LRC_OK = '2'
        else { this.LRC_OK = '3' }
        needSave = true
      }
      if (needSave) {
        await fs.remove(path, false)
        await fs.write(path, JSON.stringify([lines, lyric, this.DURATION]))
        await dataManager.update(this)
      }
    }
    let fileContent = await fs.read(path)
    let [lines, lyric, duration] = JSON.parse(fileContent)
    return {lines, lyric}
  }

  async translate(lines, index) {
    let seq = `${this.ID}/${index}-tr.txt`
    try {
      if (await fs.exists(seq)) {
        return await fs.read(seq)
      }
    } catch (e) {
      console.log(e)
    }

    let dict = await downloadTranslateQ.add(_ => { return ts.translateWithAudio(lines[index]) })
    await fs.write(seq, dict.result[0])

    return dict.result[0]
  }

  async getAudio(onProgress, downLoadQueue) {
    if (!this.audio) {
      if (this.audio !== false) {
        this.audio = await getAudioUrl(this.link)
      }
    }
    if (!this.audio) throw new Error({code: 1, desc: '找不到音频文件！'})

    if (navigator.connection.type === Connection.CELL && getOrSetSetting().checklistValues.indexOf('download-cell-net-work') === -1) {
      throw new Error({code: 0, desc: '请先设置开启手机网络下载音频选项！'})
    }
    return downloadAudio(this, onProgress, downLoadQueue)
  }
  save() {
    dataManager.update(this)
  }

}

export function createArticle(row) {
  row.percent = 0
  return new Article(row)
}

export function getDict(text) {
  return dataManager.getDict(text).then(dicts => {
    if (dicts && dicts.length > 0) {
      return {text: dicts[0].QTEXT, result: dicts[0].RESULT, detail: dicts[0].DETAIL, audio: dicts[0].AUDIO, ADD_DATE: dicts[0].ADD_DATE}
    } else {
      return Promise.reject({'text': text})
    }
  }).catch(dict => {
    return ts.translateWithAudio(text).then(dict => {
      return fs.ensure('dict').then(_ => {
        let nativeUrl = fs.toURLSync(`dict/${dict.text}.mp3`)
        return fs.download(interceptUrl(dict.audio), nativeUrl, {
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
        let dictObj = {
          qtext: dict.text,
          result: dict.result[0],
          detail: dict.dict && dict.dict[0] || '',
          audio: dict.audio,
          ADD_DATE: dict.ADD_DATE
        }
        console.log(dictObj)
        dataManager.saveDict(dictObj)
        return dict
      })
    })
  })
}
export function removeDict(item) {
  return dataManager.removeDict(item)
}
export function getDictList() {
  return dataManager.getDictList()
}
export function getDictListBy(list) {
  return dataManager.getDictListBy(list)
}
export function getRecentDictList(list) {
  return dataManager.getRecentDictList()
}

