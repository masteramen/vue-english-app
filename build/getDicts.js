var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const axios = require('axios')
var jquery = require('jquery')

var request = require('request');
let url = 'https://www.shanbay.com/wordlist/2/62740/';
(async () =>{
  let response = await axios.get(url)
  const dom = new JSDOM(response.data);
  var $ = jquery(dom.window);
  var rows=$('table:eq(0)').find('td strong').toArray().map(x=>$(x).text());
  console.log(rows);

})()

