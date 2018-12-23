const axios = require('axios')
let url=''
url='http://newsrss.bbc.co.uk/rss/newsonline_world_edition/front_page/rss.xml'
//url='http://feeds.bbci.co.uk/news/rss.xml?edition=int'


axios.get(url, {
  headers:{
    'Upgrade-Insecure-Requests':1,
    'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1'
  },
  //{
  // referer: 'https://translate.google.cn',
  //host: 'c.y.qq.com'
  //}

  //responseType:'xml',
  maxRedirects: 5,

}).then((response) => {

  console.log(response.data)



}).catch((e) => {
  console.log(e)
})
/*
const request = require('request')
var options = {
  url: url,
  headers: {
    //referer: url,
   // host: require('url').parse(url).host,
    'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1'


  }
}
console.log(options)
var r= request(options,function (error, response, body) {
  console.log('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  console.log('body:', body); // Print the HTML for the Google homepage.
}).on('error', function(err) {
      console.log(err)
    })
;
*/
