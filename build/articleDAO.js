const axios = require('axios')
const $ = require('cheerio')
const url = require('url')

const sqlite3 = require('sqlite3').verbose();

function get51VoaDetail(theurl){
	return axios.get(theurl, {
		headers: {
			referer: theurl,
			host: url.parse(theurl).host
		},
		//  params: req.query
	}).then((response) => {

		let body = $('#content', response.data);
		let coverImageUrl = $('#content img', response.data).eq(0).attr('src');
		let title = $('#title', response.data).eq(0).text().trim();

		let audioUrl=$('a#mp3',response.data).eq(0).attr('href')
		let lrcUrl=$('a#lrc',response.data).eq(0).attr('href')
		let dateTime=Date.parse($('.datetime',response.data).eq(0).text())
		let by=$('.byline',response.data).eq(0).text()

		if(audioUrl)audioUrl=url.resolve(theurl,audioUrl)
		if(lrcUrl)lrcUrl=url.resolve(theurl,lrcUrl)

		$('div',body).remove()

		//console.log(body.html())

		//console.log(coverImageUrl)

		return Promise.resolve(
			{'url':theurl,
			'title':title,
			'content':body.html(),
			'coverImageUrl':coverImageUrl,
			'audioUrl':audioUrl,
			'dateTime':dateTime,
			'by':by,
			})
		


	})
}
function get51voaList(){

	let theurl = 'http://www.51voa.com/'
	
	console.log(theurl)
	axios.get(theurl, {
		headers: {
			referer: 'http://www.51voa.com/',
			host: 'www.51voa.com'
		},
		//  params: req.query
	}).then((response) => {
		console.log(response.data)
		let lies = $('#list li', response.data)
		let results=[]
		for (let i = 0; i < lies.length; i++) {
			let li = lies.get(i)
			let a = $('a', li).last()
			var text = a.text()
			var link = url.resolve(theurl, a.attr('href'))
			console.log(text + ' => ' + link)
			results.push({'link':link})

		}
		for(let x of results){
			console.log(x)

				db.each('select count(1) as total from t_article where org_source=?',x.link,(error,row)=>{
					if(error){

						console.log(error)

					}else if(row.total>0){
						console.log('row exists:'+x.link)
						console.log(row)
					}else {
						console.log('row  not exists:'+x.link)
						 get51VoaDetail(x.link).then(detail=>{

							if (detail.audioUrl) {
								console.log(detail)
								db.run('insert into t_article (title,content,audio_url,img_url,org_source,lrc_url,post_date,AUTHOR) values(?,?,?,?,?,?,?,?)',
									detail.title, detail.content, detail.audioUrl, detail.coverImageUrl, 
									detail.url,detail.lrcUrl,detail.dateTime,detail.by
									, err => {
										console.log(err)
									})
							}



						})


					}

				})


		}


	}).catch((e) => {
		console.log(e)
	})
	
}

get51voaList()

const db = new sqlite3.Database('db.db');

let createDBSQL=`
CREATE TABLE IF NOT EXISTS t_article(
   ID INTEGER PRIMARY KEY     AUTOINCREMENT,
   TITLE           TEXT NOT NULL,
   CONTENT         TEXT,
   CONTENT_URL     TEXT,
   CATEGORY        TEXT,
   IMG_URL        TEXT,
   AUDIO_URL        TEXT,
   VIDEO_URL        TEXT,
   LRC_URL        TEXT,
   DURATION        TEXT,
   ORG_SOURCE        TEXT UNIQUE NOT NULL,
   STATUS        TEXT ,
   AUTHOR        TEXT ,
   POST_DATE  TEXT
)
`
db.serialize(function() {
	db.run(createDBSQL)
});



process.on('SIGINT', () => {
    db.close();
});
//db.close();

function getList(theurl){
	console.log('getList....:'+theurl)
	axios.get(theurl, {
		headers: {
			referer: theurl,
			host: url.parse(theurl).host
		},
		//  params: req.query
	}).then((response) => {

		let results = []
		let aes = $('a', response.data)
		for (let i = 0; i < aes.length; i++) {
			let a = $(aes.get(i))
			var text = a.text().trim()
			var link = url.resolve(theurl, a.attr('href')).trim()
			if(text && link.match(/\/a\/.*?\/\d+\.html/)){
				console.log(text + ' => ' + link)
				results.push({'text':text,'link': link})
			}

		}

		results = results.sort((a,b)=>{

			return a.link.match(/\d+\.html/)[0]>a.link.match(/\d+\.html/)[0]

		})

		let uniqueLinks=[],uniqueResults=[]
		results.forEach(x=>{
			if(uniqueLinks.indexOf(x.link)==-1){
				uniqueLinks.push(x.link)
				uniqueResults.push(x)
			}
		})

		results = uniqueResults


		results.forEach(x=>{
			console.log(x)
			db.each('select count(1) as total from t_article where org_source=?',x.link,(error,row)=>{
				if(error){

					console.log(error)

				}else if(row.total>0){
					console.log('row exists:')
					console.log(row)
				}else {
					console.log('row not exist')
					getDetail(x.link).then(detail=>{

						if (detail.audioUrl) {
							console.log(detail)
							db.run('insert into t_article (title,content,audio_url,img_url,org_source) values(?,?,?,?,?)',
								detail.title, detail.content, detail.audioUrl, detail.coverImageUrl, detail.url, e => {})
						}



					})


				}

			})

		})

	}).catch((e) => {
		console.log(e)
	})
}

//getList('https://learningenglish.voanews.com/')


function getDetail(theurl){
	return axios.get(theurl, {
		headers: {
			referer: theurl,
			host: url.parse(theurl).host
		},
		//  params: req.query
	}).then((response) => {

		let body = $('.wsw', response.data);
		let coverImageUrl = $('[data-poster]', response.data).eq(0).attr('data-poster');
		let title = $('.pg-title', response.data).eq(0).text().trim();

		let audioUrl=$('.media-download a',response.data).eq(0).attr('href')

		if(audioUrl)audioUrl=url.resolve(theurl,audioUrl)

		$('div',body).remove()

		//console.log(body.html())

		//console.log(coverImageUrl)

		return Promise.resolve({'url':theurl,'title':title,'content':body.html(),'coverImageUrl':coverImageUrl,'audioUrl':audioUrl})


	})
}


 function getArticlesBasicInfo(lastTime){
 	console.log(lastTime);
 	let fromTime =lastTime || 1
 	console.log(`SELECT id,title,POST_DATE,AUTHOR FROM t_article where POST_DATE > ${fromTime} order by POST_DATE desc`);
 	return new Promise((resolve,reject)=>{
		db.all(`SELECT id,title,POST_DATE,AUTHOR FROM t_article where POST_DATE > ${fromTime} order by POST_DATE desc`, function(err, all) {
			if(err)console.log(err)
	        resolve(all)
	    });

 	})

}

function findById(id){

	 	return new Promise((resolve,reject)=>{
	 		console.log('select ...')
			db.each("SELECT *  FROM t_article where id=?",id, function(err, row) {
				console.log(err)
				//console.log(row)

		         return resolve(row)
		    });

	 	})

}

//getArticles()

module.exports={getArticlesBasicInfo,findById}
