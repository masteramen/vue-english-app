




  function makeLyric(mp3,title,content){
	var mp3Duration = require('mp3-duration');
	var $ = require('cheerio')

  	mp3Duration(mp3, function (err, duration) {
  	  if (err) return console.log(err.message);
  	  console.log('Your file is ' + duration + ' seconds long');
  	 let html=content.replace(/<\/p>/ig,'</p>\n')
  	 var text= $(html).text()
  	 var words=text.split(/\s+/).filter(x=>x)
  	 var wordTime=duration/words.length
  	 console.log(wordTime)

  	 console.log(words)

  	var lines=text.split(/\n+/)
  	console.log(lines)

  	/*
  	[ti:Expressions for the Road!]
  	[by:www.51voa.com]
  	[00:00.00]¸ü¶àÌýÁ¦Çë·ÃÎÊ51VOA.COM
  	[00:00.16]
  	*/
  	let timer=0
  	let str=`[ti:${title}]\n`
  	lines.forEach(line=>{

  	  let wc= line.split(/\s+/).filter(x=>x).length
  	  let takeTImes=wc*wordTime
  	  let m=parseInt(timer/60)
  	  let s= parseInt(timer%60)

  	  str+=`[0:${m}:${s}]${line}\n`
  	  timer+=takeTImes
  	})

  	console.log(str);
  	});
  }
 
let html='<p>hello</p><p>how are you?</p>'

makeLyric('/Users/alexwang/data/_articles_1_audio.mp3','test',html)

