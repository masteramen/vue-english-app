var axios = require('axios')
const data = Object.assign({}, {
  link: 'test',
  content:  'test',
  audio:  'test',
  title:  'test'
}, {})
/*

var str = Object.keys(data).map(function(key){
  return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
}).join('&');
console.log(axios.post('http://192.168.1.111/rss/post.php', str).then(response=>{
  console.log(response.data)
}))*/

axios({
  method: 'post',
  url: 'http://192.168.1.111/rss/post.php',
  params:data,
  data: {
    firstName: 'Fred',
    lastName: 'Flintstone'
  }
  //params: req.query
}).then(response=>{
  console.log(response.data)
});
