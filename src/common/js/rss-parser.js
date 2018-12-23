import $ from 'jquery'
import emojiStrip from 'emoji-strip'

function unescape(str) {
  var elem = document.createElement('div')
  elem.innerHTML = str
  return elem.innerText || elem.textContent
}
export default function parseFeedString(xml) {
  let feed = {item: []}
  let $xml = $($.parseXML(xml))
  console.log('parseFeedString');
  if ($xml.find('item').length > 0) {
    $xml.find('item').each(function () {
      var el = $(this)
      feed.item.push({
        title: emojiStrip(el.find('title').text()),
        link: el.find('link').text(),
        description: unescape(el.find('description').text()),
        pubDate: new Date(el.find('pubDate').text())
      })
    })
  } else if ($xml.find('entry').length > 0) {
    $xml.find('entry').each(function () {
      var el = $(this)
      console.log(el)
      feed.item.push({
        title: emojiStrip(el.find('title').text()),
        link: el.find('link').attr('href'),
        description: unescape(el.find('content').text()),
        pubDate: new Date(el.find('published').text())
      })
    })
  }

  return feed
}
