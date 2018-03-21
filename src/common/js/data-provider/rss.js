import tld from 'tldjs'
const $ = require('jquery')
import axios from 'axios'
import {encrypt2,decrypt2} from "../crypto";

const rssFeedId = 'rss:'
function unescape(str) {
  var elem = document.createElement('div')
  elem.innerHTML = str
  return elem.innerText || elem.textContent
}

String.prototype.endWith = function(str) {
  if (str == null || str == '' || this.length == 0 || str.length > this.length) { return false }
  if (this.substring(this.length - str.length) == str) { return true } else { return false }
  return true
}

function extracted(text, el) {
  var texts = text.split('|')
  var title = text
  var audio = ''
  var pubDate = new Date(el.find('pubDate').text())
  if (texts.length > 1) {
    title = texts.shift()
    texts.forEach(t => {
      if (t.toLowerCase().endsWith('.mp3')) {
        audio = t
      } else if (t.toLowerCase().endsWith('.lrc')) {

      }

      var dateM = t.match(/(\d{4})(\d{2})(\d{2})/)
      if (dateM) pubDate = new Date(`${dateM[1]}-${dateM[2]}-${dateM[3]}`)
      else {
        dateM = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
        if (dateM) pubDate = new Date(`${dateM[1]}-${dateM[2]}-${dateM[3]}`)
      }
    })
  }
  return {title, audio, pubDate}
}

export const rss = {
  getItems: function(feedItem, response) {
    let results = []

    $($.parseXML(response.data)).find('item').each(function () {
      let feedId = feedItem.feedId
      var el = $(this)

      var text = el.find('title').text()
      var {title, audio, pubDate} = extracted(text, el)

      var absUrl = el.find('link').text()
      var thumbnail = el.find('media\\:thumbnail').attr('url')
      var domain = tld.getDomain(feedId)
      var link = {
        'REFERER': absUrl,
        'ORG_SITE': feedItem.alias || domain,
        'TITLE': unescape(title),
        'FEED_ID': rssFeedId + feedId,
        'FEED_TYPE': feedItem.type,
        'POST_TIME': pubDate.getTime(),
        'AUDIO_URL': audio,
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
  url2io: function(detailObj) {
    // var feed = `https://www.freefullrss.com/feed.php?url=${encodeURIComponent(`http://www.jfox.info/rss.php?title=test&link=${encodeURIComponent(detailObj.REFERER)}`)}&max=1&links=preserve&exc=&submit=Create+Full+Text+RSS`;

    //let feed = `http://www.jfox.info/rss/?feed=${detailObj.FEED_ID.substring(rssFeedId.length)}&link=${detailObj.REFERER}&title=${detailObj.TITLE}`


    let encryptStr = encrypt2(JSON.stringify({feed:detailObj.FEED_ID,link:detailObj.REFERER,title:detailObj.TITLE}))
    let feed=`http://192.168.1.111/rss/?_e=${encodeURIComponent(encryptStr)}`
    return axios.get(feed, {}).then((res) => {

      let content = res.data.trim();
      if(content.indexOf('<item>')===-1){
        content=decrypt2(content)
      }

      $($.parseXML(content)).find('item').each(function () {

        var el = $(this)
        let $content = $('<div/>').append(
            el.find('description').text()
        )
        var {title, audio, pubDate} = extracted(el.find('title').text(), el)
        if (!detailObj.TITLE && title)detailObj.TITLE = title
        if (!detailObj.AUDIO_URL && audio)detailObj.AUDIO_URL = audio
        if (!detailObj.POST_TIME && pubDate)detailObj.POST_TIME = pubDate
        var thumbnail = el.find('media\\:thumbnail').attr('url')
        if (!detailObj.IMG_URL && thumbnail)detailObj.IMG_URL = thumbnail

        $content.find('*').filter(function() {
          return $(this).css('display') === 'none'
        }).remove()

        $content.find('p,h1,h2,h3,h4,div').prepend('<br />\n')
        detailObj.CONTENT = $content.text().trim()
        return detailObj
      })
    })
  },
  feedId: rssFeedId
}

