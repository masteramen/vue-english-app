var mp3Duration = require('mp3-duration');
const request = require('request');
const fs = require('fs')

const ID3 = require('id3-parser');

/*
const getVideoInfo = require('get-video-info')
 
getVideoInfo('http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4').then(info => {
  console.log(info.format.duration) // => 10.007000
})
*/
const r = request(
	{
	  url: 'http://downdb.51voa.com/201801/nasa-and-google-discover-new-planet.mp3',
	  headers: {
	    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
	    'Referer':'http://www.51voa.com/'
	  }
	}
	);
/*
 request({
	  url: 'http://downdb.51voa.com/201801/nasa-and-google-discover-new-planet.mp3',
	  headers: {
	    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
	    'Referer':'http://www.51voa.com/'
	  }
	}).pipe(fs.createWriteStream('test.mp3')).on('finish',function(){
		console.log('ok');
	})
	*/
	
r.on('response', response => {
    const contentLength = response.headers['content-length'];
    const contentType = response.headers['content-type'];
    console.log(response.headers);
    // ...
   r.abort();
});
/*
let sum=0
let buffers=[]
r.on('data', function(buf) {
  //console.log(buf);
  sum += buf.length;																																
  buffers.push(buf)
  maxLen=9000000
  //if(sum>maxLen){
  	//r.abort()
  	console.log('....')
  	let buffer=Buffer.concat(buffers)
  	//console.log(buffer.length);
  	//console.log(buffer);

  	mp3Duration(buffer, function (err, duration) {
  		console.log(duration);
  	})
  	ID3.parse(buffer).then(tag => {
  	    console.log(tag); // the parsed tag info
  	});
  	
 // }

})*/