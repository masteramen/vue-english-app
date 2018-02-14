import axios from 'axios'
import Queue from 'common/js/promise-queue'
import {readFile, saveFile} from 'common/js/FileUtils'
import CordovaPromiseFS from 'common/js/promise-fs'
import * as db from './db-browser'
import {runAll} from 'common/js/runs'
const fs = CordovaPromiseFS({
  persistent: true, // or false
  storageSize: 600 * 1024 * 1024, // storage size in bytes, default 20MB
  concurrency: 3, // how many concurrent uploads/downloads?
  Promise: Promise // Your favorite Promise/A+ library!
})
const host = location.protocol + '//' + location.host
export function downloadFile(url, filePath, headers = {}) {
  console.log('downloadfile...' + url)
  return new Promise((resolve, reject) => {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
      console.log(url + '=>' + filePath)

      fs.root.getFile(filePath, {create: true}, function (fileEntry) {
        fileEntry.file(f => {
          if (f.size > 0) {
            console.log(`file ${filePath} exists, size:${f.size}`)
            console.log(fileEntry.toURL())
            console.log(f.localURL)

            resolve(f.localURL)
          } else {
            var ft = new FileTransfer()
            var fileURL = fileEntry.toURL()
            // 监听下载进度
            ft.onprogress = function (e) {
              // console.info(e);
              if (e.lengthComputable) {
                // console.log('当前进度：' + e.loaded / e.total);
              }
            }
            ft.download(url, fileURL, function (entry) {
              console.log('download success')
              console.info(entry)
              console.log('location:' + entry.toURL())

              fileEntry.file(f => {
                if (f.size > 0) {
                    // console.log('file exists, size:'+f.size)
                  console.log(f)
                  console.log(fileEntry.toURL())
                  console.log(f.localURL)
                  resolve(f.localURL)
                }
              })
                // resolve(entry.toURL())
            }, function (err) {
              console.log('download！')
              console.info(err)
                // reject(url)
            }, null, // or, pass false
              {
                headers: headers
                // headers: {
                //    "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
                // }
              }
            )

            console.log('download file')
          }
        })
      }, (e) => {
        console.log('getFile error:' + e)
        reject(url)
      })
    }, (e) => {
      console.log('requestFileSystem:' + e)
      reject(url)
    })
  })
}

function requestFS(filename, callback, options = {create: true, exclusive: false}) {
  var requestedBytes = 1024 * 1024 * 1000

  // navigator.webkitPersistentStorage.requestQuota (
  //  requestedBytes, function(grantedBytes) {

  window.requestFileSystem(LocalFileSystem.PERSISTENT, requestedBytes, function (fs) {
    fs.root.getFile(filename, options, function (fileEntry) {
      console.log('fileEntry is file? ' + fileEntry.isFile.toString())
      fileEntry.file(f => {
        console.log(`check file ${filename}:`)
        if (f.size > 0) {
          console.log('file exists, file size:' + f.size)
        } else {
          console.log('file not exists, file size:' + f.size)
        }
        callback(fs, fileEntry, f)
      })
    }, function (err) {
      console.error('error getting file! ')
      console.log(err)
      throw err
    })
  }, function (err) {
    console.error('error getting persistent fs! ' + err)
    throw err
  })

  // })
}

function download(url, filename, onProgress, handleContent, responseType = 'arraybuffer') {
  console.log('download url:' + url)
  if (!url) return Promise.reject(url)
  if (!url.match(/^http[s]*/)) return Promise.reject(url)

  return new Promise((resolve, reject) => {
    requestFS(filename, (fs, fileEntry, file) => {
      if (file.size > 0) {
        return resolve(file.localURL || fileEntry.toURL())
      }

      var CancelToken = axios.CancelToken
      var source = CancelToken.source()

      const data = Object.assign({}, {}, {})
      axios.get(url, {
        params: data,
        responseType: responseType,
        onDownloadProgress: onProgress,
        headers: {}
      })
        .then(response => {
          writeFile(fileEntry, handleContent && handleContent(response.data) || response.data, 0).then(url => {
            resolve(url)
          })
        })
    })
  })
}

function writeFile(fileEntry, dataObj, seekTo) {
  console.log('write file')
  console.log(dataObj)
  return new Promise((resolve, reject) => {
    fileEntry.createWriter(function (fileWriter) {
      // 文件写入成功
      fileWriter.onwriteend = function () {
        console.log('Successful file read...')

        fileEntry.file(f => {
          if (f.size > 0) {
            // console.log('file exists, size:'+f.size)
            console.log(f)
            console.log(fileEntry.toURL())
            console.log(f.localURL)
            resolve(f.localURL || fileEntry.toURL())
          }
        })
      }

      // 文件写入失败
      fileWriter.onerror = function (err) {
        console.log(err)
        reject()
      }

      // 写入文件
      fileWriter.write(dataObj, seekTo)
    })
  })
}

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
    return fs.download(db.interceptUrl(article.IMG_URL), nativeUrl, {}, onProgress).then(ret => {
      article.IMG_URL = nativeUrl
      return nativeUrl
    }).catch(err => {
      // console.log(err);
      console.log('err')
    })
  })
}

function downloadLyric(article, onProgress) {
  const db = require('./db-repo')
  if (article.CONTENT) return Promise.resolve(article)
  return db.getDetail(article).then(detailObj => {
    console.log(article)
    return detailObj
  })
}

export function getSilent() {
  return require('./../../../static/silent.mp3')
  // require('../static/silent.mp3')

/*
  let localFile = 'silent.mp3'
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
    let wwwfile=cordova.file.applicationDirectory + 'www/silent.mp3'

    return fs.download(wwwfile, nativeUrl, {}).then(ret => {
      return nativeUrl
    }).catch(err => {
      // console.log(err);
      console.log('err')
    })
  })
  */
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
    return fs.download(db.interceptUrl(article.AUDIO_URL), nativeUrl, {}, progressEvt => {
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
  return db.getLatestArticles()
}

export function fetchLatest() {
  console.log('getOrUpdateConfig')
  return runAll()
  /*
  getOrUpdateConfig('last_fetch_time').then(lastTime => {
    return axios.get(`${host}/api/articles`, {
      params: Object.assign({}, {'lastTime': lastTime}, {})
    }).then((res) => {
      saveArticles(res.data.contents)
      return res.data.contents
    })
  }) */
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
    console.log(this.AUDIO_URL)
    if (!this.AUDIO_URL) {
      return Promise.reject('url empty')
    }

    return downloadAudio(this, onProgress)
  }

}

const getOrUpdateConfig = db.getOrUpdateConfig

const saveArticles = db.saveArticles
export {saveFile, getOrUpdateConfig, saveArticles}

export function createArticle(row) {
  console.log(row)
  row.percent = 0
  return new Article(row)
}

export function getClassfyList() {
  return db.getClassfyList()
}

