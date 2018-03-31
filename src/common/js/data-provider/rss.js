import tld from 'tldjs'
const $ = require('jquery')
import axios from 'axios'
import {encrypt2, decrypt2} from '../crypto'

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

function PrefixInteger(num, length) {
  return (Array(length).join('0') + num).slice(-length)
}
function entityToString(entity) {
  var div = document.createElement('div')
  div.innerHTML = entity
  var res = div.innerText || div.textContent
  console.log(entity, '->', res)
  return res
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
      console.log(JSON.stringify(dateM))
      if (dateM) pubDate = new Date(`${dateM[1]}-${dateM[2]}-${dateM[3]}`)
      else {
        dateM = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
        console.log(JSON.stringify(dateM))

        if (dateM) pubDate = new Date(`${dateM[1]}-${PrefixInteger(dateM[2], 2)}-${PrefixInteger(dateM[3], 2)}`)
      }
    })
  }
  return {title, audio, pubDate}
}
function getInfoFromItem(el) {
  let itemLink = decodeURIComponent(el.find('link').text())
  let link = itemLink
  let title = entityToString(el.find('title').text())
  let audio = ''
  let pubDate = new Date(el.find('pubDate').text())

  if (itemLink.lastIndexOf('__=') > 0) {
    link = itemLink.substring(0, itemLink.lastIndexOf('__='))
    let linkInfo = itemLink.substring(itemLink.lastIndexOf('__=') + 3)
    var texts = linkInfo.split('|')
    if (texts.length > 0) {
      texts.forEach(t => {
        if (t.toLowerCase().endsWith('.mp3')) {
          audio = t
        } else if (t.toLowerCase().endsWith('.lrc')) {

        }

        var dateM = t.match(/(\d{4})(\d{2})(\d{2})/)
        console.log(JSON.stringify(dateM))
        if (dateM) pubDate = new Date(`${dateM[1]}-${dateM[2]}-${dateM[3]}`)
        else {
          dateM = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
          console.log(JSON.stringify(dateM))

          if (dateM) pubDate = new Date(`${dateM[1]}-${PrefixInteger(dateM[2], 2)}-${PrefixInteger(dateM[3], 2)}`)
        }
      })
    }
  }


  return {title, audio, pubDate, link}
}
export const rss = {
  getItems: function(feedItem, response) {
    let results = []

    $($.parseXML(response.data)).find('item').each(function () {
      let feedId = feedItem.feedId
      var el = $(this)
      var {title, audio, pubDate, link} = getInfoFromItem(el)

      var thumbnail = el.find('media\\:thumbnail').attr('url')
      var domain = tld.getDomain(feedId)
      var item = {
        'REFERER': link,
        'ORG_SITE': feedItem.alias || domain,
        'TITLE': unescape(title),
        'FEED_ID': rssFeedId + feedId,
        'FEED_TYPE': feedItem.type,
        'POST_TIME': pubDate.getTime(),
        'AUDIO_URL': audio,
        'IMG_URL': thumbnail
      }
      results.push(item)
    })

    return results
  },

  url2io: function(detailObj) {
    // var feed = `https://www.freefullrss.com/feed.php?url=${encodeURIComponent(`http://www.jfox.info/rss.php?title=test&link=${encodeURIComponent(detailObj.REFERER)}`)}&max=1&links=preserve&exc=&submit=Create+Full+Text+RSS`;

    // let feed = `http://www.jfox.info/rss/?feed=${detailObj.FEED_ID.substring(rssFeedId.length)}&link=${detailObj.REFERER}&title=${detailObj.TITLE}`

    let encryptStr = encrypt2(JSON.stringify({feed: detailObj.FEED_ID, link: detailObj.REFERER, title: detailObj.TITLE}))
    let feed = `http://www.jfox.info/rss/?_e=${encodeURIComponent(encryptStr)}`
    return axios.get(feed, {}).then((res) => {
      let content = res.data.trim()
      if (content.indexOf('<item>') === -1) {
        content = decrypt2(content)
      }
      console.log(content)

      $($.parseXML(content)).find('item').each(function () {
        var el = $(this)
        let $content = $('<div/>').append(
          entityToString(el.find('description').text())
        )
        var {title, audio, pubDate} = getInfoFromItem(el)
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
        console.log(detailObj)
        return detailObj
      })
    })
  },
  feedId: rssFeedId
}

