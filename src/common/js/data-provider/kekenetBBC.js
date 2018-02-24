const $ = require('cheerio')
const db = require('../data-manager')
const url = require('url')

let listUrl = 'http://www.kekenet.com/broadcast/BBC/'
db.getList(listUrl, response => {
  let lies = $('#menu-list h2', response.data)
  let results = []
  for (let i = 0; i < lies.length; i++) {
    let li = lies.get(i)
    let a = $('a', li).last()
    var text = a.text().split(':')[1]
    var link = url.resolve(listUrl, a.attr('href'))
    let linkObj = { 'url': link, 'title': text }
    results.push(linkObj)
    console.log(linkObj)
  }
  return results
}, (detail, response) => {
  let body = $('#contentText #article', response.data)
 // console.log('-----------')
  $('*[style]', body).remove()

  body = body.text().trim().replace(/[\u4e00-\u9fa5]/g, '')

  let audioUrl = 'http://k6.kekenet.com/' + response.data.match(/".*?\.mp3"/)[0].replace(/"/g, '')

  let dateTime = Date.parse($('time', response.data).eq(0).text())

  if (audioUrl) audioUrl = url.resolve(listUrl, audioUrl)

  $('div', body).remove()
  let coverImageUrl = ''
  let by = ''

  let detailObj = Object.assign(detail, {
    'content': body,
    'coverImageUrl': coverImageUrl,
    'orgSite': 'BBC News',
    'audioUrl': audioUrl,
    'dateTime': dateTime,
    'by': by
  })
  console.log(detailObj)
  return detailObj
})
