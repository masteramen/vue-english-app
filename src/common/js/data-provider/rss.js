import tld from 'tldjs'
const $ = require('jquery')
import axios from 'axios'
import {encrypt2, decrypt2} from '../crypto'
import parseFeedString from 'common/js/rss-parser'
import {host} from 'api/config'

const rssFeedId = ''
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
function getInfoFromItem(el) {
  let itemLink = decodeURIComponent(el.link)
  let link = itemLink
  let title = el.title
  let audio = ''
  let pubDate = new Date(el.pubDate)
  console.log(`itemLink:${itemLink}`)

  if (itemLink.lastIndexOf('__=') > 0) {
    link = itemLink.substring(0, itemLink.lastIndexOf('__='))
    let linkInfo = itemLink.substring(itemLink.lastIndexOf('__=') + 3)
    console.log(`linkInfo:${linkInfo}`)
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
    let feed = parseFeedString(response.data)
    for (let i = 0; i < feed.item.length; i++) {
      let item = feed.item[i]
      let feedId = feedItem.feedId
      var {title, audio, pubDate, link} = getInfoFromItem(item)

      var domain = tld.getDomain(feedId)
      results.push({
        'REFERER': link,
        'ORG_SITE': feedItem.alias || domain,
        'TITLE': title,
        'FEED_ID': rssFeedId + feedId,
        'FEED_TYPE': feedItem.feedType,
        'POST_TIME': pubDate.getTime(),
        'AUDIO_URL': audio
      })
    }
    return results
  },

  url2io: function(detailObj) {
    // var feed = `https://www.freefullrss.com/feed.php?url=${encodeURIComponent(`http://www.jfox.info/rss.php?title=test&link=${encodeURIComponent(detailObj.REFERER)}`)}&max=1&links=preserve&exc=&submit=Create+Full+Text+RSS`;

    // let feed = `http://www.jfox.info/rss/?feed=${detailObj.FEED_ID.substring(rssFeedId.length)}&link=${detailObj.REFERER}&title=${detailObj.TITLE}`

    let encryptStr = encrypt2(JSON.stringify({feed: detailObj.FEED_ID, link: detailObj.REFERER, title: detailObj.TITLE, lyric: detailObj.CONTENT ? 1 : 0}))
    let feed = `${host}/rss/?_e=${encodeURIComponent(encryptStr)}`
    return axios.get(feed, {}).then((res) => {
      let content = res.data.trim()
      if (content.indexOf('<item>') === -1) {
        content = decrypt2(content)
      }
      console.log(content)
      let feed = parseFeedString(content)
      for (let i = 0; i < feed.item.length; i++) {
        let feedItem = feed.item[i]
        let $content = $('<div/>').append(
          entityToString(feedItem.description)
        )
        var {title, audio, pubDate} = getInfoFromItem(feedItem)
        if (!detailObj.TITLE && title)detailObj.TITLE = title
        if (!detailObj.AUDIO_URL && audio)detailObj.AUDIO_URL = audio
        if (!detailObj.POST_TIME && pubDate)detailObj.POST_TIME = pubDate

        $content.find('*').filter(function() {
          return $(this).css('display') === 'none'
        }).remove()

        $content.find('p,h1,h2,h3,h4,div').prepend('<br />\n')
        content = $content.text().trim()
        if (content)detailObj.CONTENT = content
        console.log(detailObj)
        return detailObj
      }
    })
  },
  feedId: rssFeedId
}

