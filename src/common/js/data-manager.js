const urllib = require('url')
// const request = require('request')
const Queue = require('promise-queue')
var queue = new Queue(1, Infinity)
const axios = require('axios')
const dbDDL = require('./db-ddl')

const db = require('./env-api')

db.run(dbDDL.ddl)
db.run(dbDDL.dictDDL)
function update(detail) {
  console.log('update....')
  db.run('UPDATE T_ARTICLE SET TITLE=?,CONTENT=?,AUDIO_URL=?,IMG_URL=?,LRC_URL=?,AUTHOR=?,TOTAL=?,DURATION=? WHERE REFERER=?',
      detail.TITLE || '', detail.CONTENT || '', detail.AUDIO_URL || '', detail.IMG_URL || '',
       detail.LRC_URL || '', detail.BY || '', detail.TOTAL || '', detail.DURATION ||'', detail.REFERER || ''
      , err => {
        console.log(err)
      })
}

function insert(DETAIL) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO T_ARTICLE (TITLE,CONTENT,AUDIO_URL,IMG_URL,ORG_SITE,REFERER,LRC_URL,POST_DATE,AUTHOR,TOTAL) VALUES(?,?,?,?,?,?,?,?,?,?)',
      DETAIL.TITLE || '', DETAIL.CONTENT || '', DETAIL.AUDIO_URL || '', DETAIL.IMG_URL || '', DETAIL.ORG_SITE || '',
      DETAIL.REFERER || '', DETAIL.LRC_URL || '', DETAIL.POST_TIME || '', DETAIL.BY || '', DETAIL.TOTAL || ''
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
  return queue.add(function() {
    return getResponse(theurl).then((response) => {
      let results = extractLinks(response)
      for (let detailObj of results) {
        queue.add(function () {
          return isExist(detailObj).then(row => {
            if (row && row.ID) {
              console.log(row)
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
        console.log(`done list:${theurl}`)
       // db.uppostTime(theurl, new Date())
        return Promise.resolve()
      })
    }).catch((e) => {
      console.log(e)
    })
  })
}

function isExist(DETAIL) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM T_ARTICLE WHERE REFERER='${DETAIL.REFERER}'`
    console.log(sql)

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

function getDetailPage(detailObj, extractDetail) {
  return getResponse(detailObj.REFERER).then(response => {
    detailObj = extractDetail(response,detailObj)
    if (!detailObj || !detailObj.URL) return detailObj
    return getContentLen(detailObj).then(totalBytes => {
      detailObj.TOTAL = totalBytes
      return detailObj
    })
  })
}

function getArticlesBasicInfo(lastTime) {
  console.log(lastTime)
  let fromTime = lastTime || 1
  console.log(`SELECT id,title,POST_DATE,AUTHOR,referer,TOTAL FROM t_article where POST_DATE > ${fromTime} order by POST_DATE desc`)
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

function runJobs() {
  for (let item of jobConfigs) {
    getList(item.listUrl, response => {
      return item.getItems(item.listUrl, response)
    })
  }
}
function getDetail(detailObj) {
  for (let item of jobConfigs) {
    if (detailObj.REFERER.match(item.regex)) {
      return queue.add(function () {
        return getDetailPage(detailObj, item.getDetail).then(detailObj => {
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
    db.all(`select * from t_dict where QTEXT ='${text}'`, function(err, all) {
      if (err)console.log(err)
      resolve(all)
    })
  })
}

function getDictList() {

  return new Promise((resolve, reject) => {
    db.all(`select * from t_dict`, function(err, all) {
      if (err)console.log(err)
      resolve(all)
    })
  })
}

function saveDict({qtext,result,detail}) {

  db.run('INSERT INTO T_dict (qtext,result,detail) VALUES(?,?,?)',qtext,result,detail
    , err => {
      console.log(err)
      if (err) {
        reject()
      } else {

      }
    })
}
module.exports = {getArticlesBasicInfo, findById, getList, queue, getDetail, addConfig, runJobs,update,getDict,saveDict,getDictList}

