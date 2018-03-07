const urllib = require('url')
const Queue = require('promise-queue')
var queue = new Queue(1, Infinity)
const axios = require('axios')
const dbDDL = require('./db-ddl')
const $ = require('jquery')
const db = require('./env-api')

db.run(dbDDL.ddl)
db.run(dbDDL.dictDDL)
function update(detail) {
  db.run('UPDATE T_ARTICLE SET TITLE=?,TITLE_CN=?,CONTENT=?,AUDIO_URL=?,IMG_URL=?,LRC_URL=?,AUTHOR=?,TOTAL=?,DURATION=? WHERE REFERER=?',
      detail.TITLE || '', detail.TITLE_CN || '', detail.CONTENT || '', detail.AUDIO_URL || '', detail.IMG_URL || '',
       detail.LRC_URL || '', detail.BY || '', detail.TOTAL || '', detail.DURATION || '', detail.REFERER || ''
      , err => {
        console.log(err)
      })
}

function insert(DETAIL) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO T_ARTICLE (TITLE,CONTENT,AUDIO_URL,IMG_URL,ORG_SITE,REFERER,LRC_URL,POST_DATE,AUTHOR,TOTAL,FEED_ID) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      DETAIL.TITLE || '', DETAIL.CONTENT || '', DETAIL.AUDIO_URL || '', DETAIL.IMG_URL || '', DETAIL.ORG_SITE || '',
      DETAIL.REFERER || '', DETAIL.LRC_URL || '', DETAIL.POST_TIME || '', DETAIL.BY || '', DETAIL.TOTAL || '', DETAIL.FEED_ID
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

function getList(theurl, extractLinks) {
  return queue.add(() => getResponse(theurl).then((response) => {
    let results = extractLinks(response)
    for (let detailObj of results) {
      queue.add(function () {
        return isExist(detailObj).then(row => {
          if (row && row.ID) {
            return row
          } else {
            insert(detailObj).then(detailObj => {
              return detailObj
            })
          }
        })
      })
    }
    queue.add(function () {
      return Promise.resolve()
    })
  }).catch((e) => {
    console.log(e)
  }))
}

function isExist(DETAIL) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM T_ARTICLE WHERE REFERER='${DETAIL.REFERER}'`

    db.all(sql, (error, rows) => {
      if (error || rows.length === 0) {
        console.log(error)
        return reject(error)
      }
      return resolve(rows[0])
    })
  }).catch(err => {
    console.log(err)
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
      /*
      let r = request({
        url: detail.audioUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
          'Referer': detail.url
        }
      })

      r.on('response', response => {
        const contentLength = response.headers['content-length'];
        const contentType = response.headers['content-type'];

        r.abort();
        resolve(contentLength)
      });
      */
    resolve(0)
  }).catch(err => {
    console.log(err)
  })
}

async function getDetailPage(detailObj, item) {
  try {
    if (item.url2io) {
      await item.url2io(detailObj)
    } else {
      let response = await getResponse(detailObj.REFERER)
      item.getDetail(response, detailObj)
      if (!detailObj || !detailObj.URL) return detailObj
      let totalBytes = await getContentLen(detailObj)
      detailObj.TOTAL = totalBytes
    }
  } catch (e) {
    console.log(e)
  }
  if (!detailObj.CONTENT || !detailObj.CONTENT.trim()) {
    let response = await getResponse(detailObj.REFERER)
    let maxP = null
    $(response.data).find('p').parent().toArray().forEach(pp => {
      if (!maxP)maxP = pp
      else if ($(maxP).find('p').length < $(pp).find('p').length)maxP = pp
    })

    if (maxP && $(maxP).find('p').length > 0) detailObj.CONTENT = $(maxP).find('p').toArray().map(p => $(p).text()).join('\n')
  }
  return detailObj
}

function getArticlesBasicInfo(lastTime) {
  console.log(lastTime)
  let fromTime = lastTime || 1
  console.log(`SELECT ID,TITLE,TITLE_CN,POST_DATE,AUTHOR,referer,TOTAL FROM t_article where POST_DATE > ${fromTime} order by POST_DATE desc`)
  return new Promise((resolve, reject) => {
    db.all(`SELECT id,org_site,title,POST_DATE,AUTHOR,referer ,IMG_URL,AUDIO_URL,TOTAL FROM t_article where POST_DATE > ${fromTime} order by POST_DATE desc`, function(err, all) {
      if (err)console.log(err)
      resolve(all)
    })
  })
}

function findById(id) {
  return new Promise((resolve, reject) => {
    console.log('select ...')
    db.each('SELECT *  FROM t_article where id=?', id, function(err, row) {
      console.log(err)
        // console.log(row)

      return resolve(row)
    })
  })
}

const jobConfigs = []

async function runJobs() {
  for (let item of jobConfigs) {
    await getList(item.feedId, response => {
      return item.getItems(item.feedId, response)
    })
  }
}
function getDetail(detailObj) {
  for (let item of jobConfigs) {
    if (detailObj.FEED_ID === item.feedId) {
      return queue.add(function () {
        return getDetailPage(detailObj, item).then(detailObj => {
          update(detailObj)
          return detailObj
        })
      })
    }
  }
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
    db.all(`select * from t_dict`, function(err, rows) {
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

function saveDict({qtext, result, detail, audio}) {
  db.run('INSERT INTO T_dict (qtext,result,detail,audio) VALUES(?,?,?,?)', qtext, result, detail, audio
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
module.exports = {getArticlesBasicInfo, findById, getList, queue, getDetail, addConfig, runJobs, update, getDict, saveDict, getDictList, getConfigProvider}

