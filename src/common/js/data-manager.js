import {loadSubscriptionList} from 'common/js/cache'
import {rss} from './data-provider/rss'
const urllib = require('url')
const Queue = require('promise-queue')
var queue = new Queue(1, Infinity)
const axios = require('axios')
const dbDDL = require('./db-ddl')
const $ = require('jquery')
const db = require('./env-api')
const jobConfigs = []
db.run(dbDDL.ddl)
db.run(dbDDL.dictDDL)
function update(detail) {
  console.log(detail)
  return new Promise((resolve, reject) => {
    db.run('UPDATE T_ARTICLE SET TITLE=?,TITLE_CN=?,CONTENT=?,AUDIO_URL=?,IMG_URL=?,AUTHOR=?,TOTAL=?,DURATION=?,LRC_OK=? WHERE REFERER=?',
      detail.TITLE || '', detail.TITLE_CN || '', detail.CONTENT || '', detail.AUDIO_URL || '', detail.IMG_URL || '', detail.BY || '', detail.TOTAL || '', detail.DURATION || '', detail.LRC_OK || '', detail.REFERER || ''
      , err => {
        console.log(err)
        resolve()
      })
  })
}

function insert(DETAIL) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO T_ARTICLE (TITLE,CONTENT,AUDIO_URL,IMG_URL,ORG_SITE,REFERER,POST_DATE,AUTHOR,TOTAL,FEED_ID,FEED_TYPE) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      DETAIL.TITLE || '', DETAIL.CONTENT || '', DETAIL.AUDIO_URL || '', DETAIL.IMG_URL || '', DETAIL.ORG_SITE || '',
      DETAIL.REFERER || '', DETAIL.POST_TIME || '', DETAIL.BY || '', DETAIL.TOTAL || '', DETAIL.FEED_ID, DETAIL.FEED_TYPE
      , err => {
        console.log(err)
        if (err) {
          reject()
        } else {
          resolve(DETAIL)
        }
      })
  })
}

async function getList(theurl, results) {
  let time = new Date().getTime() - 86400000 * getConfigProvider().getConfig().nDay
  for (let detailObj of results) {
    try {
      let row = await isExist(detailObj)
      if (row && row.ID) continue
      console.log(detailObj.POST_TIME)
      console.log(time)
      console.log(JSON.stringify(detailObj))
      if (detailObj.POST_TIME > time) await insert(detailObj)
    } catch (e) {
      console.log(e)
    }
  }
}

function isExist(DETAIL) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT *,count(1) as c FROM T_ARTICLE WHERE REFERER='${DETAIL.REFERER} group by REFERER'`
    console.log(sql)
    db.all(sql, (error, rows) => {
      console.log('error:' + error)
      console.log('rows:' + rows)
      if (error || rows.length === 0) {
        console.log(error)
        return reject(error)
      }
      console.log('rows:' + JSON.stringify(rows))

      return resolve(rows[0])
    })
  })
}

function getResponse(url) {
  return axios.get(url, {
    headers: {
      referer: url,
      host: urllib.parse(url).host
    }
  })
}

function getContentLen(detail) {
  return new Promise((resolve, reject) => {
    resolve(0)
  }).catch(err => {
    console.log(err)
  })
}

async function getDetailPage(detailObj, item) {
  if (item.url2io) {
    await item.url2io(detailObj)
  } else {
    let response = await getResponse(detailObj.REFERER)
    item.getDetail(response, detailObj)
    if (!detailObj || !detailObj.URL) return detailObj
    let totalBytes = await getContentLen(detailObj)
    detailObj.TOTAL = totalBytes
  }
}

function getArticlesBasicInfo(lastTime) {
  console.log(lastTime)
  let fromTime = lastTime || 1
  console.log(`SELECT ID,TITLE,TITLE_CN,POST_DATE,AUTHOR,referer,TOTAL,LRC_OK FROM t_article where POST_DATE > ${fromTime} order by POST_DATE desc`)
  return new Promise((resolve, reject) => {
    db.all(`SELECT id,org_site,title,POST_DATE,AUTHOR,referer ,IMG_URL,AUDIO_URL,TOTAL FROM t_article where POST_DATE > ${fromTime} order by POST_DATE desc`, function(err, all) {
      if (err)console.log(err)
      resolve(all)
    })
  })
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.each('SELECT *  FROM t_article where id=?', id, function(err, row) {
      return resolve(row)
    })
  })
}
async function runJobs() {
  let subscriptList = loadSubscriptionList().filter(e => e.enable)

  for (let item of subscriptList) {
    let response = await getResponse(item.feedId)
    // let response = await getResponse('https://feed43.com/6302168535022045.xml')

    let results = rss.getItems(item, response)
    await getList(item.feedId, results)
  }
}
async function getDetail(detailObj) {
  let feedEngineer = null
  if (detailObj.FEED_ID.indexOf(rss.feedId) === 0) {
    feedEngineer = rss
  } else {
    for (let item of jobConfigs) {
      if (detailObj.FEED_ID === item.feedId) {
        feedEngineer = item
        break
      }
    }
  }
  if (feedEngineer) {
    await getDetailPage(detailObj, feedEngineer)
    console.log(detailObj)
    await update(detailObj)
  }
  return detailObj
}
function addConfig(config) {
  jobConfigs.push(config)
}
function getDict(text) {
  return new Promise((resolve, reject) => {
    db.all(`select * from t_dict where QTEXT ='${text}'`, function(err, rows) {
      if (err)console.log(err)
      console.log(rows)
      var contents = []

      for (let i = 0; i < rows.length; i++) {
        contents.push(rows.item(i))
      }
      console.log(contents)
      resolve(contents)
    })
  })
}

function getDictList() {
  return new Promise((resolve, reject) => {
    db.all(`select * from t_dict order by qtext`, function(err, rows) {
      if (err)console.log(err)
      console.log(rows)
      var contents = []

      for (let i = 0; i < rows.length; i++) {
        contents.push(rows.item(i))
      }
      console.log(contents)
      resolve(contents)
    })
  })
}
function getRecentDictList() {
  return new Promise((resolve, reject) => {
    db.all(`select * from t_dict order by ADD_DATE desc limit 5`, function(err, rows) {
      if (err)console.log(err)
      console.log(rows)
      var contents = []

      for (let i = 0; i < rows.length; i++) {
        contents.push(rows.item(i))
      }
      console.log(contents)
      resolve(contents)
    })
  })
}
export  async function removeDict(item){
  return new Promise((resolve, reject) => {
    db.all(`delete from t_dict where qtext='${item.QTEXT}'`, function(err, rows) {
      if (err)console.log(err)
      resolve()
    })
  })
}
export async function getDictListBy(list) {
  return new Promise((resolve, reject) => {
    let incause = list.map(k => `'${k}'`).join(',')
    db.all(`select * from t_dict where qtext in(${incause})`, function(err, rows) {
      if (err)console.log(err)
      console.log(rows)
      var contents = []

      for (let i = 0; i < rows.length; i++) {
        contents.push(rows.item(i))
      }
      console.log(contents)
      resolve(contents)
    })
  })
}
function saveDict({qtext, result, detail, audio,ADD_DATE}) {
  db.run('INSERT INTO T_dict (qtext,result,detail,audio,ADD_DATE) VALUES(?,?,?,?,?)', qtext, result, detail, audio,ADD_DATE
    , err => {
      console.log(err)
      if (err) {
        reject()
      } else {

      }
    })
}
function getConfigProvider() {
  let STORAGE_KEY = 'settings.config'
  let storage = {

    getConfig: function () {
      let config = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return Object.assign({
        checklistValues: ['disp-new-word-ts', 'disp-p-ts'],
        isDebug: 0,
        nDay: '3'
      }, config)
    },
    save: function (config) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    }
  }
  return storage
}
module.exports = {
  getArticlesBasicInfo,
  findById,
  getList,
  queue,
  getDetail,
  addConfig,
  runJobs,
  update,
  getDict,
  saveDict,
  getDictList,
  getConfigProvider,
  getDictListBy,
  getRecentDictList,
  removeDict
}

