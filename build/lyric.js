




  function makeLyric(mp3,title,htmlcontent,source){

    return new Promise((resolve,reject)=>{
        var mp3Duration = require('mp3-duration');
        var $ = require('cheerio')

          mp3Duration(mp3, function (err, duration) {
            if (err) return console.log(err.message);
            console.log('Your file is ' + duration + ' seconds long');
           let html=htmlcontent.replace(/<\/p>/ig,'</p>\n')
           var text= $(html).text()
           var content=text.split('_______________________________________________________________')
           text=content[0]

          
          /*
          [ti:Expressions for the Road!]
          [by:www.51voa.com]
          [00:00.00]¸ü¶àÌýÁ¦Çë·ÃÎÊ51VOA.COM
          [00:00.16]
          */
          let timer=0
          let str=`[ti:${title}]\r\n`
          str+=`[by:${source}]\n`
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

          console.log(str);
          return resolve(str)
          });
    })
	
  }
 
let html='<p></p><p></p><p>hello</p><p>how are you?</p>'
console.log(+new Date())
//console.log((+new Date()-require('fs').statSync('/Users/alexwang/data/_articles_1_audio.mp3').mtimeMs)/1000/60)
makeLyric('/Users/alexwang/data/_articles_1_audio.mp3','test',html,'test.com').then((res)=>{
  console.log(res)





})
module.exports={makeLyric}

