// const url = require('url')
// const Queue =require('promise-queue')
const axios = require('axios')
// var queue = new Queue(1, Infinity)
import dbDdl from 'common/js/db-ddl'

export function interceptUrl(url) {
  //console.log(url)
  //if(true)return `http://192.168.1.126:8080/api/url?url=${encodeURIComponent(url)}`;
  if (window.device.platform === 'browser' && url.indexOf('http') === 0) {
    return location.protocol + '//' + location.host + `/api/url?url=${encodeURIComponent(url)}`
  }
  return url
}
axios.interceptors.request.use(
  config => {
    config.url = interceptUrl(config.url)
    return config
  },
  err => {
    return Promise.reject(err)
  })

let db = {}

let webdb = window.openDatabase('db.db', '1', 'db', 0)
webdb.transaction(function (tx) {
  tx.executeSql(dbDdl.ddl, [], function (tx, result) {
    console.log(result)
  }, function (error) {
    console.log(error)
  })
})

export function run(sql, ...params) {
  console.log(sql)
  let errorHaneler = err => {
    console.log(err)
  }
  if (params && typeof (params[params.length - 1]) === 'function') {
    errorHaneler = params.pop()
  }
  console.log(params)
  webdb.transaction(function (tx) {
    tx.executeSql(sql, params, function (tx, result) {
      console.log(result)
    }, function (tx, error) {
      errorHaneler(error)
    })
  })
}

export function each(sql, ...params) {
  let errorHaneler = err => {
  }
  if (params && typeof (params[params.length - 1]) === 'function') {
    errorHaneler = params.pop()
  }
  console.log(params)
  webdb.transaction(function (tx) {
    tx.executeSql(sql, params, function (tx, result) {
      if (result.rows.length === 0) return errorHaneler(null, {})
      for (let i = 0; result.rows.length > i; i++) {
        errorHaneler(null, result.rows.item(0))
      }
    }, function (tx, error) {
      errorHaneler(error, null)
    })
  })
}

export function all(sql, ...params) {
  let errorHaneler = err => {
  }
  if (params && typeof (params[params.length - 1]) === 'function') {
    errorHaneler = params.pop()
  }
  console.log(sql)
  console.log(params)
  webdb.transaction(function (tx) {
    tx.executeSql(sql, params, function (tx, result) {
      errorHaneler(null, result.rows)
    }, function (tx, error) {
      errorHaneler(error, null)
    })
  })
}

function tranformName(str) {
  var strArr = str.toLowerCase().split('_')
  for (var i = 1; i < strArr.length; i++) {
    strArr[i] = strArr[i].charAt(0).toUpperCase() + strArr[i].substring(1)
  }
  return strArr.join('')
}

export function getLatestArticles() {
  return new Promise((resolve, reject) => {
    webdb.transaction(function (tx) {
      let sql = `SELECT * FROM  T_ARTICLE ORDER BY POST_DATE DESC`
      console.log(sql)

      tx.executeSql(sql, [], function (tx, results) {
        console.log(results)
        var contents = []

        for (let i = 0; i < results.rows.length; i++) {
          contents.push(results.rows.item(i))
        }
        console.log(contents)
        resolve({'code': 0, 'contents': contents})
      }, function (tx, error) {
        console.log(error)
        reject(error)
      })
    })
  })
}

export function update(id, name, value) {
  if (value) {
    webdb.transaction(function (tx) {
      let sql = `update t_article set ${name}=? where id=?`
      console.log(sql)
      let params = [value, id]
      console.log(params)

      tx.executeSql(sql, params, function (tx, result) {
        console.log(result)
      }, function (tx, error) {
        console.log(error)
      })
    })
  }
}

export function saveArticles(articles) {
  return new Promise((resolve, reject) => {
    webdb.transaction(function (tx) {
      let sql = `insert into t_article(id,org_site,title,post_date,author,REFERER,AUDIO_URL,IMG_URL,AUDIO_BYTES) values(?,?,?,?,?,?,?,?,?)`
      // console.log(articles)
      // console.log(articles.length)
      for (let i = 0; i < articles.length; i++) {
        let article = articles[i]
        // console.log(article)

        tx.executeSql(sql, [article.ID, article.ORG_SITE, article.TITLE, article.POST_DATE, article.AUTHOR, article.REFERER, article.AUDIO_URL, article.IMG_URL, article.AUDIO_BYTES], function (tx, result) {
          console.log(result)
        }, function (tx, error) {
          console.log(error)
          reject(error)
        })

        resolve()
      }
    })
  })
}

export function getOrUpdateConfig(name, value) {
  return new Promise((resolve, reject) => {
    let ret
    webdb.transaction(function (tx) {
      let select = 'select * from t_config where name=?'
      tx.executeSql(select, [name], function (tx, result) {
        console.log(result)
        if (result.rows.length > 0) {
          ret = result.rows.item(0).value
        }

        if (value) {
          let sql = `update t_config set value=? where name=?`
          if (!ret) sql = `insert into t_config(value,name) values(?,?)`
          console.log(sql)
          let params = [value, name]
          console.log(params)

          tx.executeSql(sql, params, function (tx, result) {
            console.log(result)
          }, function (tx, error) {
            console.log(error)
          })
        }
        if (value) return resolve(value)
        return resolve(ret)
      }, function (tx, error) {
        console.log(error)
      })
    })
  })
}
