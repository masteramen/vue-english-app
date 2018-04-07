import Queue from 'common/js/promise-queue'
import CordovaPromiseFS from 'common/js/promise-fs'
import * as envApi from './env-api'
import {runAll} from 'common/js/runs'
import * as ts from 'common/js/translation'
import {formate2Lyric} from './util'
import {interceptUrl} from '../../api/config'

const dataManager = require('./data-manager')

const fs = CordovaPromiseFS({
  persistent: true, // or false
  storageSize: 600 * 1024 * 1024, // storage size in bytes, default 20MB
  concurrency: 3, // how many concurrent uploads/downloads?
  Promise: Promise // Your favorite Promise/A+ library!
})

export async function downloadArtilePic(article, onProgress) {
  let localFile = `${article.ID}.jpg`
  if (!article.IMG_URL) return
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
  await fs.download(interceptUrl(article.IMG_URL), nativeUrl, {}, onProgress)
  article.IMG_URL = nativeUrl
  return nativeUrl
}

async function downloadLyric(article) {
  return await dataManager.getDetail(article)
}
/*
export async function getSilent() {
  return require('./../../../static/silent.mp3')
} */

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

async function downloadAudio(article, onProgress, downLoadQueue) {
  fs.ensure(`${article.ID}`)
  let localFile = `${article.ID}/${article.ID}.mp3`

  if (!article.AUDIO_URL) return null
  if (await fileExist(localFile)) {
    console.log(localFile)
    return fs.toURLSync(localFile)
  }

  let nativeUrl = fs.toURLSync(localFile)
  console.log(nativeUrl)

  if (loadingList.indexOf(article.ID) > -1) {
    return await waitFinish(article.ID)
  }
  async function downloadTask() {
    return (async _ => {
      if (await fileExist(localFile)) return fs.toURLSync(localFile)

      loadingList.push(article.ID)
      return fs.download(interceptUrl(article.AUDIO_URL), nativeUrl, {}, progressEvt => {
        if (progressEvt.lengthComputable) {
          article.percent = Math.round((progressEvt.loaded / progressEvt.total) * 100)
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

  return nativeUrl
}

let downLoadQueue = new Queue(3, Infinity, true)
let downLoadLyricQueue = new Queue(2)
let downloadTranslateQ = new Queue(2)
export async function downloadAllArticles(articles, cancel) {
  for (let article of articles) {
    try {
      console.log('downlaod ....')
      if (cancel && cancel()) break
      await article.getLyric(true)
      await article.tsTitle()
      await article.getAudio(null, downLoadQueue)
    } catch (e) {
      console.log(e)
    }
  }
}

export function getLatestArticles() {
  return envApi.getLatestArticles()
  // return Promise.reject()
}

export async function fetchLatest() {
  let time = new Date().getTime() - 86400000 * configProvider.getConfig().nDay
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
    return this.AUDIO_URL || this.FEED_TYPE === 'audio'
  }
  async tsTitle() {
    if (this.TITLE_CN) return
    let dict = await ts.translateWithAudio(this.TITLE)
    this.TITLE_CN = dict.result[0]
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
      console.log(this.CONTENT)
      let lyric = ''
      let lines = []
      let needSave = false
      if (this.CONTENT && this.CONTENT.substring(0, 4) === '[ti:') {
        let split = this.CONTENT.split(/\n/)
        split.shift()
        this.TITLE_CN = split.shift()
        let transArr = split.filter((s, i) => i % 2 === 1)
        lyric = split.filter((s, i) => i % 2 === 0).join('\n')
        lines = split.filter((s, i) => i % 2 === 0).map(x => x.replace(/\[.*?\]/))

        for (let i = 0; i < transArr.length; i++) {
          let seq = `${this.ID}/${i}-tr.txt`
          await fs.remove(seq, false)
          await fs.write(seq, transArr[i])
        }
        console.log(transArr)
        console.log(lyric)
        console.log(lines)
        this.LRC_OK = '1'
        needSave = true
      } else if (this.LRC_OK !== '2') {
        [lines, lyric] = await formate2Lyric(this)
        console.log(lines)
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
        console.log(this)
        await dataManager.update(this)
      }
    }
    let fileContent = await fs.read(path)
    console.log(fileContent)
    let [lines, lyric, duration] = JSON.parse(fileContent)
    console.log(lines)
    console.log(lyric)
    console.log(duration)
    return {lines, lyric}

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

  getAudio(onProgress, downLoadQueue) {
    if (!this.AUDIO_URL) {
      return Promise.reject({code: 1, desc: '找不到音频文件！'})
    }
    if (navigator.connection.type === Connection.CELL && configProvider.getConfig().checklistValues.indexOf('download-cell-net-work') === -1) {
      return Promise.reject({code: 0, desc: '请先设置开启手机网络下载音频选项！'})
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

export const configProvider = dataManager.getConfigProvider()

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

