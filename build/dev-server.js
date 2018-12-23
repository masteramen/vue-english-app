var  FileSaver =require('file-saver')

require('./check-versions')()
const $ = require('cheerio')
//const db = require('../src/common/js/data-manager')
const URL = require('url')

// require('./spider-index')

var config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

var opn = require('opn')
var path = require('path')
var express = require('express')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig = require('./webpack.dev.conf')
var axios = require('axios')
var fs = require('fs')
var request = require('request')

// default port where dev server listens for incoming traffic
var port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
var autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config.dev.proxyTable

var app = express()

var apiRoutes = express.Router()

var https = require('http');
var _ = require('underscore');

const getFile = url => {
    return new Promise((resolve, reject) => {
        axios({
            method:'get',
            url,
            responseType: 'arraybuffer'
        }).then(data => {
            resolve(data.data)
        }).catch(error => {
            reject(error.toString())
        })
    })
}

function readRangeHeader(range, totalLength) {
    /*
     * Example of the method 'split' with regular expression.
     *
     * Input: bytes=100-200
     * Output: [null, 100, 200, null]
     *
     * Input: bytes=-200
     * Output: [null, null, 200, null]
     */

  if (range == null || range.length == 0)
    return null;

  var array = range.split(/bytes=([0-9]*)-([0-9]*)/);
  var start = parseInt(array[1]);
  var end = parseInt(array[2]);
  var result = {
    Start: isNaN(start) ? 0 : start,
    End: isNaN(end) ? (totalLength - 1) : end
  };

  if (!isNaN(start) && isNaN(end)) {
    result.Start = start;
    result.End = totalLength - 1;
  }

  if (isNaN(start) && !isNaN(end)) {
    result.Start = totalLength - end;
    result.End = totalLength - 1;
  }

  return result;
}
var mimeNames = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "application/javascript",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".ogg": "application/ogg",
  ".ogv": "video/ogg",
  ".oga": "audio/ogg",
  ".txt": "text/plain",
  ".wav": "audio/x-wav",
  ".webm": "video/webm",
};

function getMimeNameFromExt(ext) {
  var result = mimeNames[ext.toLowerCase()];

  // 最好给一个默认值
  if (result == null)
    result = "application/octet-stream";

  return result;
}
function sendResponse(response, responseStatus, responseHeaders, readable) {
  response.writeHead(responseStatus, responseHeaders);
  
  if (readable == null)
    response.end();
  else
    readable.on("open", function () {
      readable.pipe(response);
    });
  
  return null;
}
function httpListener(request, response,filename) {
  // We will only accept 'GET' method. Otherwise will return 405 'Method Not Allowed'.
  if (request.method != 'GET') {
    sendResponse(response, 405, { 'Allow': 'GET' }, null);
    return null;
  }
  
  //var filename = initFolder + url.parse(request.url, true, true).pathname.split('/').join(path.sep);
  
  // Check if file exists. If not, will return the 404 'Not Found'.
  if (!fs.existsSync(filename)) {
    sendResponse(response, 404, null, null);
    return null;
  }
  
  var responseHeaders = {};
  var stat = fs.statSync(filename);
  var rangeRequest = readRangeHeader(request.headers['range'], stat.size);
  
  // If 'Range' header exists, we will parse it with Regular Expression.
  if (rangeRequest == null) {
    responseHeaders['Content-Type'] = getMimeNameFromExt(path.extname(filename));
    responseHeaders['Content-Length'] = stat.size; // File size.
    responseHeaders['Accept-Ranges'] = 'bytes';
  
    // If not, will return file directly.
    sendResponse(response, 200, responseHeaders, fs.createReadStream(filename));
    return null;
  }
  
  var start = rangeRequest.Start;
  var end = rangeRequest.End;
  
  // If the range can't be fulfilled.
  if (start >= stat.size || end >= stat.size) {
    // Indicate the acceptable range.
    responseHeaders['Content-Range'] = 'bytes */' + stat.size; // File size.
  
    // Return the 416 'Requested Range Not Satisfiable'.
    sendResponse(response, 416, responseHeaders, null);
    return null;
  }
  
  // Indicate the current range.
  responseHeaders['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
  responseHeaders['Content-Length'] = start == end ? 0 : (end - start + 1);
  responseHeaders['Content-Type'] = getMimeNameFromExt(path.extname(filename));
  responseHeaders['Accept-Ranges'] = 'bytes';
  responseHeaders['Cache-Control'] = 'no-cache';
  
  // Return the 206 'Partial Content'.
  sendResponse(response, 206,
    responseHeaders, fs.createReadStream(filename, { start: start, end: end }));
}

apiRoutes.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    //res.header("X-Powered-By",' 3.2.1')
    //res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
var querystring = require('querystring');
apiRoutes.post('/url', function(req, res) {
  req.on('data',function(data){
    var postData = JSON.parse(data.toString());
    console.log(postData);

    var url = req.query.url
    const headers = {
      //'referer': url,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
      //'Connection': 'close',
      // 'Accept-Language': 'zh-CN'
    };

     var params = Object.keys(postData).map(function(key){
      return encodeURIComponent(key) + '=' + encodeURIComponent(postData[key]);
    }).join('&');
    console.log(postData)

    axios.post(url, params).then(response=>{
      console.log(response.data)
      res.write(response.data);
      res.end();
    })

  });



})

apiRoutes.get('/url', function(req, res) {
	console.log(req.query)
  var url = req.query.url
  const headers = {
    //'referer': url,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
    //'Connection': 'close',
   // 'Accept-Language': 'zh-CN'
  };
	console.log(url)

  axios.get(url, {
    headers:headers
      //{
     // referer: 'https://translate.google.cn',
      //host: 'c.y.qq.com'
    //}
    ,
	responseType:'stream',
  maxRedirects: 5,
    //params: req.query
  }).then((response) => {

	console.log(response.data)
	console.log(response.status)
	console.log(response.headers)
	for(var h in response.headers){
		console.log(h)
		res.setHeader(h,response.headers[h])
	}
	res.header("Access-Control-Allow-Origin", "*");
	res.header('content-disposition','inline')

	//res.setHeaders(response.headers)

	//res.write(response.data);
	console.log('pip...')
	response.data.pipe(res)

  }).catch((e) => {
    console.log(e)
  })

})

apiRoutes.get('/articles', function(req, res) {
  db.getArticlesBasicInfo(req.query.lastTime).then(rows => {

    var data = {
      code: 0,
      contents: rows
    }
    res.json(data)

  }).catch((e) => {
    console.log(e)
  })
})
function waitUntil(boolFn, callback, delay) {
    "use strict";
    // if delay is undefined or is not an integer
    delay = (typeof (delay) === 'undefined' || isNaN(parseInt(delay, 10))) ? 100 : delay;
    setTimeout(function () {
        (boolFn()) ? callback() : waitUntil(boolFn, callback, delay);
    }, delay);
}

function download(req,url,res,type){

    var localFile = '/Users/alexwang/data/'+req.url.split(/\?/)[0].split('/').join('_')+type
    let tmp=localFile+'.tmp'

    if(fs.existsSync(tmp) && ((+new Date()-fs.statSync(tmp).mtimeMs)/1000/60<10))
    {
      waitUntil(()=>fs.existsSync(localFile),()=>httpListener(req,res,localFile), 1000);

      return
    }

  if (fs.existsSync(localFile)) {

      return httpListener(req,res,localFile)
      /*
      console.log('file exists')

      var stats = fs.statSync(localFile);

      res.setHeader('Content-Length', stats.size);
      console.log('size:'+stats.size)


      var readStream = fs.createReadStream(localFile);
      readStream.pipe(res);*/

  }else{
              console.log('file not exists')
              console.log(url)
              var options = {
                url: url,
                headers: {
                  referer: url,
                  host: URL.parse(url).host

                }
              }
              console.log(options)
               var r= request(options)
               // .get(url)
                .on('error', function(err) {
                  console.log(err)
                })
                ;
                r.pipe(fs.createWriteStream(tmp)).on('finish', function () {
                  console.log('done....')
                  fs.renameSync(tmp, localFile)
                  return httpListener(req,res,localFile)

                  /*
                  var readStream = fs.createReadStream(localFile);
                  var stats = fs.statSync(localFile);

                  res.setHeader('Content-Length', stats.size);
                  console.log('size:'+stats.size)
                  readStream.pipe(res);*/

                });
                //r.pipe(res)
                r.end()

                //res.redirect(article.thumb)
    }
}
apiRoutes.route('/articles/:id/img').get(function(req, res) {
  console.log(req.params)
  db.findById(req.params.id).then(article => {
    console.log(article.thumb)
    console.log(req.url)
    var localFile = '/Users/alexwang/data/'+req.url.split('/').join('_')

    download(req,article.thumb,res,'.jpg')

    //res.redirect(article.thumb)

  }).catch(err => {
    console.log(err)
    res.send(err)
  })
})


apiRoutes.route('/articles/:id/content').get(function(req, res) {
  console.log(req.params)
  db.findById(req.params.id).then(article => {
    console.log(req.url)

    if(article.LRC_URL&&article.LRC_URL.indexOf('http')==0)
    {
      res.redirect('/api/articles/'+req.params.id+'/lrc')

      return
    }



     var lyric=require('./lyric')
     lyric.makeLyric('/Users/alexwang/data/_articles_'+article.ID+'_audio.mp3',article.title,article.CONTENT,article.ORG_SOURCE)
     .then((lyc)=>{
      res.send(lyc)
     })


    //res.redirect(article.thumb)

  }).catch(err => {
    console.log(err)
    res.send(err)
  })
})

apiRoutes.route('/articles/:id/lrc').get(function(req, res) {
  db.findById(req.params.id).then(article => {

    download(req,article.LRC_URL,res,'.lrc')

  }).catch(err => {
    res.send(err)
  })
})

apiRoutes.route('/articles/:id/audio').get(function(req, res) {
  db.findById(req.params.id).then(article => {
    //console.log(article)
    //res.redirect(article.audio)
    download(req,article.audio,res,'.mp3')

  }).catch(err => {
    console.log(err)
    res.send(err)
  })
})

apiRoutes.route('/articles/:id/lrc').get(function(req, res) {
  db.findById(req.params.id).then(article => {
    //res.redirect(article.CONTENT)
    //console.log(article)
    res.send(article.CONTENT)

  }).catch(err => {
    res.send(err)
  })
})


//
//let appurl='http://osxapps.itunes.apple.com'
///private/var/folders/3c/7kl4y0ms2tndpbw0wf505mwr0000gn/C/com.apple.appstore
let appurl='/apple-assets-us-std-000001/Purple128/v4/aa/57/67/aa576734-89b3-8fb2-6104-d85635b3396b/dvt6557228029991066681.pkg'
app.get(appurl, function (req, res) {

  let localFile='/Users/alexwang/Downloads/dvt6557228029991066681.pkg'
  var readStream = fs.createReadStream(localFile);
  var stats = fs.statSync(localFile);

  res.setHeader('Content-Length', stats.size);
  console.log('size:'+stats.size)
  readStream.pipe(res);

})

apiRoutes.get('/getDiscList', function (req, res) {
  var url = 'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg'
  axios.get(url, {
    headers: {
      referer: 'https://c.y.qq.com/',
      host: 'c.y.qq.com'
    },
    params: req.query
  }).then((response) => {
    res.json(response.data)
  }).catch((e) => {
    console.log(e)
  })
})

apiRoutes.get('/lyric', function (req, res) {
  var url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'

  axios.get(url, {
    headers: {
      referer: 'https://c.y.qq.com/',
      host: 'c.y.qq.com'
    },
    params: req.query
  }).then((response) => {
    var ret = response.data
    if (typeof ret === 'string') {
      var reg = /^\w+\(({[^()]+})\)$/
      var matches = ret.match(reg)
      if (matches) {
        ret = JSON.parse(matches[1])
      }
    }
    res.json(ret)
  }).catch((e) => {
    console.log(e)
  })
})

app.use('/api', apiRoutes)

var compiler = webpack(webpackConfig)

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {}
})
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))
app.use('/', express.static('./'))

app.use(function (req, res, next) {
    var url = req.originalUrl;
	console.log(`url:${url}`)
  if(url.indexOf('test')>-1)console.log(req);
    next();
});



app.use('/www', express.static('../cordova-app/www'))

//var uri = 'http://localhost:' + port
var uri = 'http://localhost:' + port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  // when env is testing, don't need open it
  if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
    //opn(uri)
  }
  _resolve()
})
//port ="80"
var server = app.listen(port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
