
import $ from 'jquery'
import axios from 'axios'


let db


function createDb(){

	 //db = sqlitePlugin.openDatabase({name: 'mydb.db'});
	 db = window.openDatabase('db.db', '1', 'db', 0)
	 db.transaction(function (tx) {

	 	let sqls=[
	 	`CREATE TABLE IF NOT EXISTS t_article(
	 		 		   ID INTEGER PRIMARY KEY     AUTOINCREMENT,
	 		 		   ORG_SITE TEXT,
	 		 		   TITLE           TEXT NOT NULL,
	 		 		   CONTENT_URL     TEXT,
	 		 		   REFERER     TEXT,
	 		 		   CATEGORY        TEXT,
	 		 		   IMG_URL        TEXT,
	 		 		   AUDIO_URL        TEXT,
	 		 		   VIDEO_URL        TEXT,
	 		 		   DURATION        TEXT,
	 		 		   STATUS        TEXT ,
	 		 		   AUDIO_BYTES        TEXT ,
	 		 		   AUDIO_LOADED        TEXT ,
	 		 		   AUTHOR        TEXT ,
	 		 		   POST_DATE  NUMERIC
	 		 		)
	 		 		`,`CREATE TABLE IF NOT EXISTS t_config(
	 		 			    	   ID INTEGER PRIMARY KEY     AUTOINCREMENT,
	 		 			    	   name     TEXT UNIQUE,
	 		 			    	   value    TEXT
	 		 			    	)
	 		 			    	`
	 	]
	
	 	sqls.forEach(sql=>{
	 		tx.executeSql(sql, [], function (tx, result) {
	 		    console.log(result);
	 		}, function (error) {
	 		    console.log(error);
	 		});

	 	})

	 });

}

export function getLatestArticles(){
	return new Promise((resolve,reject)=>{

	 db.transaction(function (tx) {

			let sql=`select * from  t_article order by POST_DATE desc`
			console.log(sql)

		    tx.executeSql(sql, [], function (tx, results) {
		        console.log(results);
		        var contents = [];

		        for (let i = 0; i < results.rows.length; i++){
		            contents.push(results.rows.item(i));
		        }
		        console.log(contents);
		        resolve({'code':0,'contents':contents})
		    }, function (tx,error) {
		        console.log(error);
		        reject(error)
		    });
		})
		});


}
export function update(id,name,value){
	if(value)
	 db.transaction(function (tx) {

			let sql=`update t_article set ${name}=? where id=?`
			console.log(sql)
			let params=[value,id]
			console.log(params)

			tx.executeSql(sql, params, function (tx, result) {
			    console.log(result);
			}, function (tx,error) {
			    console.log(error);
			});	



		})

}


export function downloaded(url){

	return Promise((resolve,reject)=>{
	 db.transaction(function (tx) {

			let sql=`select * from  t_downloaded where org_url=?`
			console.log(sql)

			tx.executeSql(sql, [url], function (tx, result) {
			    console.log(result);
			    if(result.rows.length>0){
			    	resolve(result.rows.item(0).LOCAL_URL)
			    }else reject()
			}, function (tx,error) {
			    console.log(error);
			});	



		})
	 
	})
}

export function saveDownloaded(orgUrl,localUrl){

	return new Promise((resolve,reject)=>{

	 db.transaction(function (tx) {

			let sql=`insert into t_downloaded(ORG_URL,LOCAL_URL) values(?,?)`

			tx.executeSql(sql, [prgUrl,localUrl], function (tx, result) {
			    console.log(result);
			    resolve()
			}, function (tx,error) {
			    console.log(error);
			    reject(error)
			});	


		})
	})
}


export function  saveArticles(articles){

	return new Promise((resolve,reject)=>{

	 db.transaction(function (tx) {

			let sql=`insert into t_article(id,org_site,title,post_date,author,REFERER,AUDIO_URL,IMG_URL,AUDIO_BYTES) values(?,?,?,?,?,?,?,?,?)`
			//console.log(articles)
			//console.log(articles.length)
			for(let i=0;i<articles.length;i++){
				let article=articles[i]
				//console.log(article)

			tx.executeSql(sql, [article.ID,article.ORG_SITE,article.TITLE,article.POST_DATE,article.AUTHOR,article.REFERER,article.AUDIO_URL,article.IMG_URL,article.AUDIO_BYTES], function (tx, result) {
			    console.log(result);
			}, function (tx,error) {
			    console.log(error);
			    reject(error)
			});	

			resolve()

			}

		})
		});


}
export function initialize(){

	if(!db)createDb()
}

export function getOrUpdateConfig(name,value){

	return new Promise((resolve,reject)=>{
		let ret;
		 db.transaction(function(tx) {

		   let select = 'select * from t_config where name=?'
		   tx.executeSql(select, [name], function(tx, result) {
		     console.log(result);
		     if(result.rows.length>0){
		     	ret=result.rows.item(0).value
		     }

		     if (value) {
		       let sql = `update t_config set value=? where name=?`
		       if(!ret) sql=`insert into t_config(value,name) values(?,?)`
		       console.log(sql)
		       let params = [value,name]
		       console.log(params)

		       tx.executeSql(sql, params, function(tx, result) {
		         console.log(result);
		       }, function(tx, error) {
		         console.log(error);
		       });
		     }
		     if(value)return resolve(value)
		     return  resolve(ret)

		   }, function(tx, error) {
		     console.log(error);
		   });

		 })

	})

}
