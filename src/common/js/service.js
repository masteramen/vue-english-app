//import {getLyric} from 'api/song'
import {ERR_OK} from 'api/config'
import {Base64} from 'js-base64'
import jsonp from 'common/js/jsonp'
import axios from 'axios'
import Queue from 'common/js/promise-queue'
import {readFile,saveFile} from 'common/js/FileUtils'
import * as db from 'common/db'
import Bus from 'common/js/bus'
import CordovaPromiseFS from 'common/js/promise-fs'




const fs = CordovaPromiseFS({
  persistent: true, // or false 
  storageSize: 600*1024*1024, // storage size in bytes, default 20MB 
  concurrency: 3, // how many concurrent uploads/downloads? 
  Promise: Promise // Your favorite Promise/A+ library! 
});

const host='http://192.168.1.126:8080'

export function getMusicList(topid) {

  const ret ={
	  code:0,
	  songlist:[{data:{}}]
	  }
	  
  return new Promise((resolve, reject) => {
	  resolve(ret)
  })
  
}

export function downloadFile(url,filePath,headers={}){
	console.log('downloadfile...'+url)
	return new Promise((resolve, reject)=>{

		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {  

			console.log(url+'=>'+filePath)
		
			fs.root.getFile(filePath, { create: true }, function (fileEntry) {  
								
				fileEntry.file(f=>{
					
					if(f.size>0){
						console.log(`file ${filePath} exists, size:${f.size}`)
						console.log(fileEntry.toURL())
						console.log(f.localURL)

						resolve(f.localURL)
					}
					else{
						
						var ft = new FileTransfer();  
						var fileURL = fileEntry.toURL();  
						//监听下载进度  
						ft.onprogress = function (e) {  
							//console.info(e);  
							if (e.lengthComputable) {  
								//console.log('当前进度：' + e.loaded / e.total);  
							}  
						}  
						ft.download(url, fileURL, function (entry) {  
							console.log('download success');  
							console.info(entry);  
							console.log('location:' + entry.toURL()); 

						fileEntry.file(f=>{
							
							if(f.size>0){
								//console.log('file exists, size:'+f.size)
								console.log(f)
								console.log(fileEntry.toURL())
								console.log(f.localURL)
								resolve(f.localURL)
							}
						})
							//resolve(entry.toURL())
							
						}, function (err) {  
							console.log("download！");  
							console.info(err);  
							//reject(url)
						}, null, // or, pass false  
						{  
							headers:headers
							//headers: {  
							//    "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="  
							//}  
						}
						); 
						

						console.log('download file')
						
					}
					
				})
				
				

		}, (e)=>{
			console.log('getFile error:'+e)
			reject(url)
		});
		
		
	}, (e)=>{
		console.log('requestFileSystem:'+e)
		reject(url)}) 
	
	})
}


function requestFS(filename,callback,options={create: true, exclusive: false }){
	var requestedBytes = 1024*1024*1000; 

	//navigator.webkitPersistentStorage.requestQuota (
	  //  requestedBytes, function(grantedBytes) { 

	    	window.requestFileSystem(LocalFileSystem.PERSISTENT, requestedBytes, function (fs) {
	    		    fs.root.getFile(filename, options, function (fileEntry) {
	    		        console.log('fileEntry is file? ' + fileEntry.isFile.toString());
	    		        fileEntry.file(f=>{
	    		        	console.log(`check file ${filename}:`)
	    		        	if(f.size>0){
	    		        		console.log('file exists, file size:'+f.size)
	    		        	}else{
	    		        		console.log('file not exists, file size:'+f.size)
	    		        	}
	    		        	callback(fs,fileEntry,f)
	    		        })

	    		    }, function (err) { 

	    		    	console.error('error getting file! ' ); 
	    		    	console.log(err)
	    		    	throw err
	    		})
	    		}, function (err) {
	    		 console.error('error getting persistent fs! ' + err); 
	    		 throw err

	    	})


	// })


}


function download(url,filename,onProgress,handleContent,responseType='arraybuffer'){

	console.log('download url:'+url)
	if(!url)return Promise.reject(url)
	if(!url.match(/^http[s]*/)) return Promise.reject(url)


		if(device.platform=='browser'&&url.indexOf('http')==0&&url.indexOf(host)===-1){
				url=host+'/api/url?url='+url
		}


	return new Promise((resolve,reject)=>{

		requestFS(filename,(fs,fileEntry,file)=>{
			if(file.size>0){
				return resolve(file.localURL||fileEntry.toURL())
			}

			var CancelToken = axios.CancelToken;
			var source = CancelToken.source();

			const data = Object.assign({},{},{})
			axios.get(url,{
				params:data,
		  		responseType:responseType,
		  		onDownloadProgress:onProgress,
		  		headers: {
		  		 }
			})
			.then(response=>{

				writeFile(fileEntry,handleContent&&handleContent(response.data)||response.data,0).then(url=>{
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
         fileEntry.createWriter(function(fileWriter) {

           //文件写入成功
           fileWriter.onwriteend = function() {
             console.log("Successful file read...");

             fileEntry.file(f => {

               if (f.size > 0) {
                 //console.log('file exists, size:'+f.size)
                 console.log(f)
                 console.log(fileEntry.toURL())
                 console.log(f.localURL)
                 resolve(f.localURL || fileEntry.toURL())

               }
             })


           };

           //文件写入失败
           fileWriter.onerror = function(err) {
             console.log(err);
             reject()
           };

           //写入文件
           fileWriter.write(dataObj, seekTo);
         });

       })

     }

function caculateLyric(html,article){

	let content=$(html).find('#content').text().split('_______________________________________________________________')
	
	
	let duration = article.total/2733529*170

	let  text=content[0]


	let timer=0
	let str=`[ti:${article.title}]\r\n`
	str+=`[by:${article.referer}]\n`
	let fixnum=n=>{return (Array(2).join('0') + n).slice(-2) }
	var lines=text.replace(/\n+/g,'\n').split(/\n/).filter(x=>x)

	let timeLines=lines.filter(x=>x.trim().match(/^[[]*\d+:\d+/))
	if(timeLines.lenght>3){
	  str=+text.replace(/(\d+(:\d+)+)/g,'[$1]')

	}else{

	   var words=text.split(/\s+/).filter(x=>x)
	   var wordTime=duration/words.length
	   console.log(wordTime)

	   console.log(words)
	  console.log('lines:');
	  console.log(lines)

	  lines.forEach(line=>{

	    let wc= line.split(/\s+/).filter(x=>x).length
	    let takeTImes=wc*wordTime
	    let m= fixnum(parseInt(timer/60))
	    let s= fixnum(parseInt(timer%60))
	    let ms= fixnum(0)

	    str+=`[${m}:${s}.${ms}]${line}\r\n`
	    timer+=takeTImes
	  })

	}
	if(content.length>1)
	    str+='\n'+content[1]
	 str = str.split(/\n/).map(x=>  x.match(/^\[\d+/)?x.replace(/([a-z]+)/gi,"<span>$1</span>"):x).join('\n')

	return str
}

export function downloadArtilePic(article, onProgress) {
  let localFile = `${article.id}.jpg`
  return fs.exists(localFile).then(exists => {

    if (exists) {
      let url = fs.toURLSync(localFile)
      console.log(url)
      return url;
    } else {
      return Promise.reject()
    }
  }).catch(err => {
    let nativeUrl = fs.toURLSync(localFile)
    return fs.download(article.picUrl, nativeUrl, {}, onProgress).then(ret => {
    	db.update(article.id,'IMG_URL',nativeUrl)

      return nativeUrl;
    }).catch(err => {
      //console.log(err);
      console.log('err');
    })
  })

}

/*export function downloadArtilePic(article){
	let tasks=[
	(article)=>{
			download(article.picUrl,`${article.id}.jpg`).then(localurl=>{	
				console.log(`localurl:${localurl}`);						
				db.update(article.id,'IMG_URL',localurl)
		})			
	}				

	]

	let promise = Promise.resolve();
	for (let i = 0; i < tasks.length; i++) {
	    let task = tasks[i];
	    promise = promise.then(task(article)).then(()=>{

	    });
	}
	return promise
}*/

function downloadLyric(article,onProgress) {

	let localUrl = `${article.id}.lrc`

	return  fs.exists(localUrl)
	.then(exists=>{
		console.log(exists);
		if(exists){
			return fs.read(`${article.id}.lrc`)
		}else{

			return Promise.reject()
		}
	}).catch(err=>{

		let nativeUrl = fs.toURLSync(`${article.id}.lrc`)
		console.log(nativeUrl);
		return fs.download(article.lrc, nativeUrl).then(ret => {

		  return fs.read(`${article.id}.lrc`).then(html => {
		    let lyric = caculateLyric(html, article)
		    fs.write(`${article.id}.lrc`, lyric)
		    db.update(article.id, 'CONTENT_URL', nativeUrl)
		    console.log(lyric);
		    return lyric;
		  })

		}).catch(err => {
		  console.log(err);
		  console.log('err');
		})
	})

}
function downloadAudio(article, onProgress) {
  let localFile = `${article.id}.mp3`
  return fs.exists(localFile).then(exists => {

    if (exists) {
      let url = fs.toURLSync(localFile)
      console.log(url)
      return url;
    } else {
      return Promise.reject()
    }
  }).catch(err => {
    let nativeUrl = fs.toURLSync(localFile)
    return fs.download(article.url, nativeUrl, {}, onProgress).then(ret => {
      return nativeUrl;
    }).catch(err => {
      //console.log(err);
      console.log('err');
    })
  })

}


export function downloadArtile(article,onDoneLRC,onDoneAudio,notupdateArticleProgeress){

				console.log('downloadArticle...')

				let tasks=[(article)=>{

						return download(article.lrc,`${article.id}.lrc`,null,html=>{
							return caculateLyric(html,article)
						},'text').then(lrc=>{
							db.update(article.id,'CONTENT_URL',lrc)
							//article.lrc=lrc
							onDoneLRC&&onDoneLRC(lrc)
						})
			

				},
				(article)=>{
						return download(article.url,`${article.id}.mp3`,(evt)=>{
						  	
						  	if (evt.lengthComputable) {
						  		if(!notupdateArticleProgeress){
						  			article.total=evt.total
						  			article.downloaded=evt.loaded
						  		}

						  	  } else {
						  	  	console.log(evt)
						  	  }  

				}).then(url=>{
							db.update(article.id,'AUDIO_URL',url)
							db.update(article.id,'AUDIO_BYTES',article.total)
							db.update(article.id,'AUDIO_LOADED',article.total)
							article.url=url
							onDoneAudio&&onDoneAudio()
					})			
				},
				(article)=>{
						return download(article.picUrl,`${article.id}.jpg`).then(url=>{							
							db.update(article.id,'IMG_URL',url)
					})			
				}				

				]

				let promise = Promise.resolve();
				for (let i = 0; i < tasks.length; i++) {
				    let task = tasks[i];
				    promise = promise.then(()=>task(article)).then(()=>{

				    	console.log('task done')
				    });
				}
				return promise

}


let downLoadQueue = new Queue(1);

export function downloadAllArticles(articles){


articles.forEach(article=>{

	downLoadQueue.add(function () {
		console.log('download .........'+article.id);
        return downloadArtile(article);
    },article).then(()=>{
    	console.log(`download artile ${article.id}  ok`);
    }).catch(err=>{console.log(`dowload article ${article.id} fail.`)})
})

}



export function getLatestArticles() {

	return db.getLatestArticles();

}

export function fetchLatest(lastTime) {

    console.log(`lastTime:${lastTime}`);
    return axios.get(`${host}/api/articles`, {
      params: Object.assign({}, { 'lastTime': lastTime }, {})
    }).then((res) => {
    	return res.data.contents
    })

}



export  class Article {
  constructor(data) {
  	this.data=data
  	for(let k in data){
  		this[k]=data[k]

  	}
  }

  getLyric() {

    console.log('get lyric')

    if (this.lyric) {
      return Promise.resolve(this.data.lyric)
    }

    if (!this.lrc) {
    	return Promise.reject('lrc empty')
    }
    
    return downloadLyric(this);
   
  }
  getAudio(onProgress){
  	console.log(this.url);
  	if (!this.url) {
  		return Promise.reject('url empty')
  	}

  	return downloadAudio(this,onProgress)

  }

}

function localOrRemote(id,type,	...urls){

	let base=host+'/api/articles/'+id
	let url=''
	for(let i in urls){
		if(urls[i]){
			url=urls[i]
			break
		}
	}

	if(device.platform=='browser'&&url.indexOf('http')==0&&url.indexOf(host)===-1){
			url=host+'/api/url?url='+url
	}

	let realUrl= !url?`${base}/${type}`:url

	return realUrl
}

const getOrUpdateConfig =db.getOrUpdateConfig

const saveArticles = db.saveArticles
export  {saveFile,getOrUpdateConfig,saveArticles};


export function createArticle(row) {
	console.log(row);
  return new Article({
	id:row.ID,
    orgSite:row.ORG_SITE,
    title: row.TITLE,
    url: localOrRemote(row.ID,'audio',row.AUDIO_URL),
    lrc: localOrRemote(row.ID,'referer',row.CONTENT_URL,row.REFERER),
    picUrl: localOrRemote(row.ID,'img',row.IMG_URL),
    total:row.AUDIO_BYTES,
    downloaded:row.AUDIO_LOADED,
    postDate:row.POST_DATE,
  })

}
  
