window.configJobs = window.configJobs || []

window.configJobs.push(function ($,urllib,dataManager) {
  function getItems(listUrl, response) {
    let lies = $('#list li', response.data)
    let results = []
    for (let i = 0; i < lies.length; i++) {
      let li = lies.get(i)
      let a = $('a', li).last()
      var text = a.text()
      var absUrl = urllib.resolve(listUrl, a.attr('href'))
      var link = {'REFERER': absUrl, 'TITLE': text, 'ORG_SITE': 'VOA', 'POST_TIME': new Date(response.headers.date).getTime()}
      results.push(link)

    }
    return results
  }

  function getDetail(response, detail) {
    let body = $('#content', response.data)
    let coverImageUrl = $('#content img', response.data).eq(0).attr('src')

    let audioUrl = $('a#mp3', response.data).eq(0).attr('href')
    let lrcUrl = $('a#lrc', response.data).eq(0).attr('href')
    let dateTime = Date.parse($('.datetime', response.data).eq(0).text())
    let by = $('.byline', response.data).eq(0).text()

    if (audioUrl) audioUrl = urllib.resolve(detail.REFERER, audioUrl)
    if (lrcUrl) lrcUrl = urllib.resolve(detail.REFERER, lrcUrl)

    $('div', body).remove()
    body = ''
    let result = Object.assign(detail, {
      'IMG_URL': coverImageUrl,
      'AUDIO_URL': audioUrl,
      'POST_TIME': dateTime || new Date(response.headers.date).getTime(),
      'BY': by,
      'response': response
    })

    result.CONTENT = getLyricContent(result)
    console.log(result)

    return result
  }

  function getLyricContent(detailObj) {
    let removeTags = ['head', 'iframe', 'img', 'script']
    let html = detailObj.response.data
    for (let tag of removeTags) {
      html = html.replace(new RegExp(`<${tag}\b[^<]*(?:(?!<\/${tag}>)<[^<]*)*<\/${tag}>gi`, 'ig'), '')
      html = html.replace(new RegExp(`<${tag}.*?>`, 'gi'), '')
    }
    let content = $('#content', html).text().split('_______________________________________________________________')[0]

    return content
  }
  dataManager.addConfig(
    {
      listUrl: 'http://www.51voa.com/',
      regex: /51voa\.com/,
      getItems: getItems,
      getDetail: getDetail
    }
  )
  dataManager.runJobs()

});

window.configJobs = window.configJobs || []
window.configJobs.push(function ($,urllib,dataManager) {
  function getItems(listUrl, response) {

    let results = []

    $($.parseXML(response.data)).find("item").each(function () {
      var el = $(this);

      var text = el.find("title").text()
      var absUrl = el.find("link").text()
      var pubDate = new Date(el.find("pubDate").text())
      var thumbnail = el.find("media\\:thumbnail").attr('url')

      var link = {
        'REFERER': absUrl,
        'TITLE': text,
        'ORG_SITE': 'BBC',
        'POST_TIME': pubDate.getTime(),
        'IMG_URL': thumbnail
      }
      results.push(link);

    });


    return results
  }

  function getDetail(response, detail) {

    let result = Object.assign(detail, {
      'response': response
    })

    result.CONTENT = $("div[property=articleBody] > p",response.data).toArray()/*.filter(x=>$(x).find('a').length===0)*/.map(x=>$(x).text()).join('\n').replace(/\n+/g,'\n')
    console.log(result)

    return result
  }


  dataManager.addConfig(
    {
      listUrl: 'http://feeds.bbci.co.uk/news/world/rss.xml',
      regex: /bbc.*?/,
      getItems: getItems,
      getDetail: getDetail
    }
  )

});

