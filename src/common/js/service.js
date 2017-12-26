//import {getLyric} from 'api/song'
import {ERR_OK} from 'api/config'
import {Base64} from 'js-base64'
import jsonp from 'common/js/jsonp'
import axios from 'axios'
import Queue from 'common/js/promise-queue'
import {readFile,saveFile} from 'common/js/FileUtils'
import * as db from 'common/db'



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


function download(url,filename,onProgress){

	console.log('download url:'+url)
	if(!url)return Promise.reject(url)
	if(!url.match(/^http[s]*/)) return Promise.reject(url)



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
		  		responseType:'arraybuffer',
		  		onDownloadProgress:onProgress,
		  		headers: {
		  		 }
			})
			.then(response=>{

				writeFile(fileEntry,response.data,0).then(url=>{
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

export function downloadArtilePic(article){
	let tasks=[
	(article)=>{
			download(article.picUrl,`${article.id}.jpg`).then(localurl=>{							
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
}
export function downloadArtile(article,onDoneLRC,onDoneAudio){

				console.log('downloadArticle...')

				let tasks=[(article)=>{
					
						download(article.lrc,`${article.id}.lrc`).then(lrc=>{
							db.update(article.id,'CONTENT_URL',lrc)
							//article.lrc=lrc
							onDoneLRC&&onDoneLRC(lrc)
						})
			

				},
				(article)=>{
						download(article.url,`${article.id}.mp3`,(evt)=>{
						  	
						  	if (evt.lengthComputable) {
						  	    article.total=evt.total
						  	    article.downloaded=evt.loaded
						  	  } else {
						  	  	console.log(evt)
						  	  }  

				}).then(url=>{
							db.update(article.id,'AUDIO_URL',url)
							db.update(article.id,'AUDIO_SIZE',article.total)
							db.update(article.id,'AUDIO_LOADED',article.downloaded)
							onDoneAudio&&onDoneAudio()
					})			
				},
				(article)=>{
						download(article.picUrl,`${article.id}.jpg`).then(url=>{							
							db.update(article.id,'IMG_URL',url)
					})			
				}				

				]

				let promise = Promise.resolve();
				for (let i = 0; i < tasks.length; i++) {
				    let task = tasks[i];
				    promise = promise.then(task(article)).then(()=>{

				    	console.log('task done')
				    });
				}
				return promise

}

export function downloadAllArticles(articles){

	/*let i=0
	var d=()=>{
	if(articles.length>i){
		let article=articles[i]
		downloadArtile(articles[i])
		.then(()=>{
			console.log('download article ok') })
		.catch((err)=>{
		console.log('download article fail')
			console.log(err)
		}).then(()=>{
			i++
			d()
		})

	}

	}
	d()*/

let downLoadQueue = new Queue(2, Infinity);
articles.forEach(article=>{

	downLoadQueue.add(article.id,function () {
        return downloadArtile(article);
    }).then(()=>{
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
  constructor({id,title,lrc, url,picUrl,total,downloaded,postDate}) {
	this.id=id
    this.title = title
    this.lrc = lrc
    this.url = url
    this.picUrl = picUrl
    this.total=total
    this.downloaded=downloaded
    this.postDate=postDate
  }

  getLyric() {

    console.log('get lyric')

    if (this.lyric) {
      return Promise.resolve(this.lyric)
    }

    if (!this.lrc) {
      return new Promise((resolve, reject) => {
        reject('no lyric')
      })
    }
    let that = this
    return new Promise((resolve, reject) => {

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
          console.log('file system open: ' + fs.name);
          let filename = that.id + '.lrc'
          fs.root.getFile(filename, { create: false, exclusive: false }, function(fileEntry) {

            console.log('fileEntry is file? ' + fileEntry.isFile.toString());

            fileEntry.file(f => {

              if (f.size > 0) {
                //console.log('file exists, size:'+f.size)
                console.log(f)
                console.log(fileEntry.toURL())
                console.log(f.localURL)
                let lurl = f.localURL || fileEntry.toURL()
                console.log('lurl:' + lurl);
                axios.get(lurl)
                .then((res) => {
                  return res.data
                	})
                .catch((err) => {

                  console.log(err);

                  return axios.get(that.lrc).then((res) => {
                  	return res.data
                  }).catch(err => {
                    console.log(err);
                    reject()
                  })
                }).then(lyric=>{

                  	resolve(lyric)
                  })

              }
            })
          }, function(err) {

            console.error('error getting file! ');
            console.log(err)
            reject(err)

          })
        }, function(err) {
          console.error('error getting persistent fs! ' + err);
          reject(err)

        })

      }).catch(err => {
        console.log(err)
        return err
      })
      .then((err) => {
        //console.log(err);
        //console.log(that.lrc);
        return axios.get(that.lrc).then((res) => {
          that.lyric = res.data.split(/\n/).map(x=>  x.match(/^\[\d+/)?x.replace(/([a-z]+)/gi,"<span>$1</span>"):x).join('\n')

          return that.lyric
        })
      })

  }
  }



function localOrRemote(id,url,type){

	let base=host+'/api/articles/'+id
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
    title: row.TITLE,
    url: localOrRemote(row.ID,row.AUDIO_URL,'audio'),
    lrc: localOrRemote(row.ID,row.CONTENT_URL,'content'),
    picUrl: localOrRemote(row.ID,row.IMG_URL,'img'),
    total:row.AUDIO_SIZE,
    downloaded:row.AUDIO_LOADED,
    postDate:row.POST_DATE,
  })

}
  
