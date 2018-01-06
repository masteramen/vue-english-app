var  FileSaver =require('file-saver')

require('./check-versions')()
const $ = require('cheerio')
const articleDAO = require('./articleDAO')
const URL = require('url')

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

apiRoutes.get('/url', function(req, res) {
	console.log(req.query)
  var url = req.query.url

  axios.get(url, {
    headers: {
      referer: url,
      //host: 'c.y.qq.com'
    },
	responseType:'stream'
    //params: req.query
  }).then((response) => {
    
	//console.log(response.data)
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

apiRoutes.get('/get-latest-articles.json', function (req, res) {
  var url = 'http://www.51voa.com/VOA_Special_English/'
  var list=[{'title':'testabcdefg 334343','mp3':'http://ct.51voa.com:88/201711/the-true-story-of-pocahontas.mp3'},
  {"title":"Blockchain to Fight Corruption in Southeast Asia","mp3":"http://ct.51voa.com:88/201711/blochchain-to-fight-financial-corruption-in-southeast-asia.mp3","lrc":"http://www.51voa.com/lrc/201711/blochchain-to-fight-financial-corruption-in-southeast-asia.lrc"},
  {"title":"College Admissions: Learning from the Process","mp3":"http://downdb.51voa.com/201711/college-admissions-advice-learning-from-the-process.mp3","lrc":null},{"title":"It's the Season to Squirrel Something Away!","mp3":"http://downdb.51voa.com/201711/words-and-their-stories-squirrel.mp3","lrc":null},{"title":"Laboratory in Netherlands to Help Find Missing People Worldwide","mp3":"http://downdb.51voa.com/201711/laboratory-help-find-missing-people.mp3","lrc":null},{"title":"'Experience' Tourism Brings New Travelers to Africa","mp3":"http://downdb.51voa.com/201711/experience-tourism-brings-new-travelers-to-africa.mp3","lrc":null},{"title":"Origami Space Technology Combines Art, Design, Science","mp3":"http://downdb.51voa.com/201711/origami-space-technology-combines-art-design-science.mp3","lrc":null},{"title":"Social Media Companies Criticized over Russian Interference","mp3":"http://downdb.51voa.com/201711/congress-criticizes-social-media-companies.mp3","lrc":"http://www.51voa.com/lrc/201711/congress-criticizes-social-media-companies.lrc"},{"title":"'Luck,' by Mark Twain","mp3":"http://downdb.51voa.com/201711/luck-mark-twain.mp3","lrc":null},{"title":"Working to Save Lives When a Tsunami Strikes","mp3":"http://downdb.51voa.com/201711/working-to-save-lives-when-a-tsunami-strikes.mp3","lrc":null},{"title":"The Harvey Weinstein Effect","mp3":"http://downdb.51voa.com/201711/harvey-weinstein-effect.mp3","lrc":null},{"title":"Trump Calls on US Congress to Change Immigration Policy","mp3":"http://downdb.51voa.com/201711/trump-calls-on-us-congress-to-change-immigration-policy.mp3","lrc":null},{"title":"Report: Asia Now Has More Billionaires than US","mp3":"http://downdb.51voa.com/201711/report-finds-asia-now-has-more-billionaires-than-us.mp3","lrc":"http://www.51voa.com/lrc/201711/report-finds-asia-now-has-more-billionaires-than-us.lrc"},{"title":"'Human Flow' Film Documents Refugees' Troubles","mp3":"http://downdb.51voa.com/201711/human-flow-film-documents-refugees-troubles.mp3","lrc":null},{"title":"Magazine Predicted Astros Would Win World Series","mp3":"http://downdb.51voa.com/201711/magazine-predicted-astros-would-win-world-series.mp3","lrc":null},{"title":"Verbs and Gerunds in Speech and Fiction Writing","mp3":"http://downdb.51voa.com/201711/everyday-grammar-verbs-and-gerunds.mp3","lrc":null},{"title":"A Face Can Unlock iPhone X, But Can It Be Fooled?","mp3":"http://downdb.51voa.com/201711/can-iphone-x-face-id-be-fooled-to-unlock-phone.mp3","lrc":null},{"title":"Artist Gives New Life to Unpopular Plants","mp3":"http://downdb.51voa.com/201711/artist-gives-new-life-to-unpopular-plants.mp3","lrc":null},{"title":"South Korean President Says No to Nuclear Weapons","mp3":"http://downdb.51voa.com/201711/south-korean-president-does-not-seek-nuclear-weapons.mp3","lrc":"http://www.51voa.com/lrc/201711/south-korean-president-does-not-seek-nuclear-weapons.lrc"},{"title":"Police: New York Attacker 'Did This in the Name of ISIS'","mp3":"http://downdb.51voa.com/201711/new-york-attacker-did-this-in-the-name-of-isis.mp3","lrc":null},{"title":"Conservative Movement in Brazil Challenges Art Shows","mp3":"http://downdb.51voa.com/201711/rising-conservative-movement-in-brazil.mp3","lrc":null},{"title":"Program Offers Job Experience, Pay for High Schoolers","mp3":"http://downdb.51voa.com/201710/program-offers-job-experience-pay-for-highschoolers.mp3","lrc":null},{"title":"Rescued Sailors' Report of Their Experience Questioned","mp3":"http://downdb.51voa.com/201710/rescued-sailors-report-questioned.mp3","lrc":null},{"title":"Kenya’s President Named Winner of Disputed Election","mp3":"http://downdb.51voa.com/201710/kenyas-president-named-winner-of-disputed-election.mp3","lrc":null},{"title":"India Sending Wheat through Iran to Afghanistan","mp3":"http://downdb.51voa.com/201710/india-sending-wheat-through-iran-to-afghanistan.mp3","lrc":null},{"title":"Saudi Arabia to Sell Shares of New Mega-City","mp3":"http://downdb.51voa.com/201710/saudi-arabia-to-sell-shares-of-new-mega-city-publically-crown-princes-says.mp3","lrc":null},{"title":"500 Years Since Martin Luther Launched Christian Reformation","mp3":"http://downdb.51voa.com/201710/five-hundred-years-since-martin-luther-christian-reformation.mp3","lrc":null},{"title":"Former Trump Campaign Aides Charged","mp3":"http://downdb.51voa.com/201710/former-trump-campaign-aides-charged.mp3","lrc":"http://www.51voa.com/lrc/201710/former-trump-campaign-aides-charged.lrc"},{"title":"Pollution Is the World’s Number One Killer","mp3":"http://downdb.51voa.com/201710/pollution-is-number-one-killer.mp3","lrc":"http://www.51voa.com/lrc/201710/pollution-is-number-one-killer.lrc"},{"title":"One Method for Controlling Emotions, Stress","mp3":"http://downdb.51voa.com/201710/health-lifestyle-controlling-emotions-stress.mp3","lrc":null},{"title":"'It Was a Dark and Stormy Night'","mp3":"http://downdb.51voa.com/201710/words-and-their-stories-it-was-a-dark-and-stormy-night.mp3","lrc":null},{"title":"Spain Seeks Charges Against Catalan Leaders","mp3":"http://downdb.51voa.com/201710/spain-seeks-charges-against-catalonia-leaders.mp3","lrc":"http://www.51voa.com/lrc/201710/spain-seeks-charges-against-catalonia-leaders.lrc"},{"title":"Kurdish President Offers to Step Down","mp3":"http://downdb.51voa.com/201710/kurdish-president-offers-to-step-down.mp3","lrc":null},{"title":"Women Land in Japan After 6 Months Lost at Sea","mp3":"http://downdb.51voa.com/201710/women-rescued-at-sea-arrive-in-japan.mp3","lrc":null},{"title":"US Agency: Climate Change Costs Americans Billions of Dollars","mp3":"http://downdb.51voa.com/201710/climate-change-costs-americans-billions-of-dollars.mp3","lrc":null},{"title":"US Military Seeking Technology to Better Prepare for War","mp3":"http://downdb.51voa.com/201710/us-military-seeking-technology-to-prepare-for-war.mp3","lrc":"http://www.51voa.com/lrc/201710/us-military-seeking-technology-to-prepare-for-war.lrc"},{"title":"Old Nuclear Bunker Has One of the Largest Film, TV Collections","mp3":"http://downdb.51voa.com/201710/old-nuclear-bunker-has-large-film-tv-collections.mp3","lrc":null},{"title":"Millions of Brazilians Fall Back into Poverty","mp3":"http://downdb.51voa.com/201710/millions-of-brazilians-fall-back-into-poverty.mp3","lrc":null},{"title":"John Kennedy: Young","mp3":"http://downdb.51voa.com/201710/americas-presidents-john-kennedy.mp3","lrc":null},{"title":"Wildlife Officials Find Evidence of Rare Australian Bird","mp3":"http://downdb.51voa.com/201710/australian-rangers-find-evidence-of-rare-bird.mp3","lrc":null},{"title":"Changing Colleges in the US Is Complex, Costly","mp3":"http://downdb.51voa.com/201710/us-college-transfer-process-complex-costly.mp3","lrc":null},{"title":"This House Is Haunted!","mp3":"http://downdb.51voa.com/201710/words-and-their-stories-this-place-is-haunted.mp3","lrc":null},{"title":"America's Uncivil War","mp3":"http://downdb.51voa.com/201710/civil-discourse-in-the-us.mp3","lrc":null},{"title":"Mogadishu Bombing Changes Somalis’ Ideas about Blood Donations","mp3":"http://downdb.51voa.com/201710/somalia-bombing-changes-ideas-about-blood-donations.mp3","lrc":"http://www.51voa.com/lrc/201710/somalia-bombing-changes-ideas-about-blood-donations.lrc"},{"title":"'The Florida Project' Explores the Lives of Poor Kids in Disney's Shadow","mp3":"http://downdb.51voa.com/201710/nwe-film-shows-poverty-struggle-shadow-of-disney-world.mp3","lrc":"http://www.51voa.com/lrc/201710/nwe-film-shows-poverty-struggle-shadow-of-disney-world.lrc"},{"title":"'The Furnished Room,' by O. Henry","mp3":"http://downdb.51voa.com/201710/the-furnished-room-o-henry.mp3","lrc":null},{"title":"Spain Dismisses Catalonia Government after Independence Declaration","mp3":"http://downdb.51voa.com/201710/spain-dismisses-catalonia-government-after-independence-declaration.mp3","lrc":null},{"title":"Non-Governmental Organizations Call for Action in Cambodia","mp3":"http://downdb.51voa.com/201710/ngos-cambodia.mp3","lrc":null},{"title":"Police, Protestors Clash in Kenya’s Election","mp3":"http://downdb.51voa.com/201710/police-protestors-clash-in-kenya-election.mp3","lrc":null}]
  var data={code:0,contents:list.slice(0,20)}
  res.json(data)
})


apiRoutes.get('/articles', function(req, res) {
  articleDAO.getArticlesBasicInfo(req.query.lastTime).then(rows => {

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

                //res.redirect(article.IMG_URL)
    }
}
apiRoutes.route('/articles/:id/img').get(function(req, res) {
  console.log(req.params)
  articleDAO.findById(req.params.id).then(article => {
    console.log(article.IMG_URL)
    console.log(req.url)
    var localFile = '/Users/alexwang/data/'+req.url.split('/').join('_')

    download(req,article.IMG_URL,res,'.jpg')
  
    //res.redirect(article.IMG_URL)

  }).catch(err => {
    console.log(err)
    res.send(err)
  })
})


apiRoutes.route('/articles/:id/content').get(function(req, res) {
  console.log(req.params)
  articleDAO.findById(req.params.id).then(article => {
    console.log(req.url)

    if(article.LRC_URL&&article.LRC_URL.indexOf('http')==0)
    {
      res.redirect('/api/articles/'+req.params.id+'/lrc')

      return
    }



     var lyric=require('./lyric')
     lyric.makeLyric('/Users/alexwang/data/_articles_'+article.ID+'_audio.mp3',article.TITLE,article.CONTENT,article.ORG_SOURCE)
     .then((lyc)=>{
      res.send(lyc)
     })

  
    //res.redirect(article.IMG_URL)

  }).catch(err => {
    console.log(err)
    res.send(err)
  })
})

apiRoutes.route('/articles/:id/lrc').get(function(req, res) {
  articleDAO.findById(req.params.id).then(article => {

    download(req,article.LRC_URL,res,'.lrc')

  }).catch(err => {
    res.send(err)
  })
})

apiRoutes.route('/articles/:id/audio').get(function(req, res) {
  articleDAO.findById(req.params.id).then(article => {
    //console.log(article)
    //res.redirect(article.AUDIO_URL)
    download(req,article.AUDIO_URL,res,'.mp3')

  }).catch(err => {
    console.log(err)
    res.send(err)
  })
})

apiRoutes.route('/articles/:id/lrc').get(function(req, res) {
  articleDAO.findById(req.params.id).then(article => {
    //res.redirect(article.CONTENT)
    //console.log(article)
    res.send(article.CONTENT)

  }).catch(err => {
    res.send(err)
  })
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

var server = app.listen(port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
