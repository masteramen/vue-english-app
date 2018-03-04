/* const headers = {
  'referer': 'https://www.google.com/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
  'Connection': 'close'
};

return (async ()=>{

  let subscriptList = loadSubscriptionList()

  for (let item of subscriptList)
  {
    let rssUrl = item.feedId.substring(5)
    const data = Object.assign({}, {}, {})
    await  axios.get(rssUrl, {
      params: data,
      headers: headers
    }).then(resp => {
      console.log(resp.data)
    })
  }

  return Promise.reject(0)
})() */
import {loadSubscriptionList} from 'common/js/cache'
import tld from 'tldjs'

function unescape(str) {
  var elem = document.createElement('div')
  elem.innerHTML = str
  return elem.innerText || elem.textContent
}

window.configJobs = window.configJobs || []
window.configJobs.push(function ($, urllib, dataManager) {
  function getItems(feedId, response) {
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
        'FEED_ID': feedId,
        'POST_TIME': pubDate.getTime(),
        'IMG_URL': thumbnail
      }
      results.push(link)
    })

    return results
  }

  function getDetail(response, detail) {
    let result = Object.assign(detail, {
      'response': response
    })

    result.CONTENT = $('div[property=articleBody] > p', response.data).toArray()/* .filter(x=>$(x).find('a').length===0) */.map(x => $(x).text()).join('\n').replace(/\n+/g, '\n')
    console.log(result)

    return result
  }
  function url2io(detailObj) {
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
          console.info(data)
          resolve(detailObj)
        }
      })
    })
  }
  let subscriptList = loadSubscriptionList()
  for (let item of subscriptList) {
    console.log(item)
    dataManager.addConfig(
      {
        feedId: item.feedId,
        getItems: getItems,
        getDetail: getDetail,
        url2io: url2io
      }
    )
  }
})

