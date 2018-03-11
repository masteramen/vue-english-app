import tld from 'tldjs'
const $ = require('jquery')
import axios from 'axios'
import {commonParams} from "../../../api/config";
const rssFeedId = 'rss:'
function unescape(str) {
  var elem = document.createElement('div')
  elem.innerHTML = str
  return elem.innerText || elem.textContent
}
export const rss = {
  getItems: function(feedId, response) {
    let results = []

    $($.parseXML(response.data)).find('item').each(function () {
      var el = $(this)

      var text = el.find('title').text()
      var absUrl = el.find('link').text()
      var pubDate = new Date(el.find('pubDate').text())
      var thumbnail = el.find('media\\:thumbnail').attr('url')
      var domain = tld.getDomain(feedId)
      var link = {
        'REFERER': absUrl,
        'ORG_SITE': domain,
        'TITLE': unescape(text),
        'FEED_ID': rssFeedId + feedId,
        'POST_TIME': pubDate.getTime(),
        'IMG_URL': thumbnail
      }
      results.push(link)
    })

    return results
  },

  getDetail: function (response, detail) {
    let result = Object.assign(detail, {
      'response': response
    })

    result.CONTENT = $('div[property=articleBody] > p', response.data).toArray()/* .filter(x=>$(x).find('a').length===0) */.map(x => $(x).text()).join('\n').replace(/\n+/g, '\n')

    return result
  },
  url2io2: function (detailObj) {

    return new Promise((resolve, reject) => {
      $.ajax({
        'type': 'get',
        'url': 'http://api.url2io.com/article',
        'dataType': 'jsonp',
        'data': {
          'token': 'U18Qg0IaTdmx1BvD0sIuXQ',     // 开发者 token, 注册后可得
          'url': detailObj.REFERER,
          'fields': 'next'    // 可选字段
        },
        'success': function(data) {
          detailObj.CONTENT = $(data.content).find('p').toArray().map(e => $(e).text()).join('\n')
          resolve(detailObj)
        }
      })
    })
  },
  url2io:function(detailObj){
    var feed = `https://www.freefullrss.com/feed.php?url=${encodeURIComponent(`http://www.jfox.info/rss.php?title=test&link=${encodeURIComponent(detailObj.REFERER)}`)}&max=1&links=preserve&exc=&submit=Create+Full+Text+RSS`;

    return axios.get(feed, {}).then((res) => {
        $($.parseXML(res.data)).find('item').each(function () {
          var el = $(this);
          console.log("------------------------");
          console.log("title      : " + el.find("title").text());
          console.log("link       : " + el.find("link").text());
          console.log("description: " + el.find("description").text());
          detailObj.CONTENT = $(el.find("description").text()).text()
          return detailObj
        })
    })
  },
  feedId:rssFeedId
}

