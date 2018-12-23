import tld from 'tldjs'
import {formatDate} from 'common/js/formatDate'
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
  let map = {}
  el.pubDate && (map['pubDate'] = formatDate(el.pubDate, 'yyyy-MM-dd'))
  map['title'] = el.title

  if (itemLink.split('__=').length > 1) {
    link = itemLink.substring(0, itemLink.lastIndexOf('__='))
    let linkInfo = itemLink.substring(itemLink.lastIndexOf('__=') + 3)
    var texts = linkInfo.split('|')
    if (texts.length > 1) {
      for (var i = 0; i < texts.length; i += 2) {
        map[texts[i]] = texts[i + 1]
      }
    }
    map['link'] = link
  }
  return map
}
export const rss = {
  getItems: function(feedItem, response) {
    let results = []
    let feed = parseFeedString(response.data)
    for (let i = 0; i < feed.item.length; i++) {
      let item = feed.item[i]
      let feedId = feedItem.feedId
      let map = getInfoFromItem(item)
      map['feedId'] = rssFeedId + feedId
      map['feedType'] = feedItem.feedType
      let domain = tld.getDomain(feedId)
      map['ORG_SITE'] = feedItem.alias || domain

      results.push(map)
    }
    console.log('results:')
    return results
  },

  url2io: function(detailObj) {
    // var feed = `https://www.freefullrss.com/feed.php?url=${encodeURIComponent(`http://www.jfox.info/rss.php?title=test&link=${encodeURIComponent(detailObj.link)}`)}&max=1&links=preserve&exc=&submit=Create+Full+Text+RSS`;

    // let feed = `http://www.jfox.info/rss/?feed=${detailObj.feedId.substring(rssFeedId.length)}&link=${detailObj.link}&title=${detailObj.title}`

    let encryptStr = encrypt2(JSON.stringify({feed: detailObj.feedId, link: detailObj.link, title: detailObj.title, lyric: detailObj.CONTENT ? 1 : 0}))
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
        let map = getInfoFromItem(feedItem)
        for (let k in map) {
          if (!detailObj[k] && map[k])detailObj[k] = map[k]
        }

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

