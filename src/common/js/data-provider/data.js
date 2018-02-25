window.configJobs = window.configJobs || []
window.configJobs.push(function ($,urlib,dataManager) {
  function getItems(listUrl, response) {
    let lies = $('#list li', response.data)
    let results = []
    for (let i = 0; i < lies.length; i++) {
      let li = lies.get(i)
      let a = $('a', li).last()
      var text = a.text()
      var absUrl = url.resolve(listUrl, a.attr('href'))
      var link = {'REFERER': absUrl, 'TITLE': text, 'ORG_SITE': 'VOA', 'POST_TIME': new Date().getTime()}
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

    if (audioUrl) audioUrl = url.resolve(detail.REFERER, audioUrl)
    if (lrcUrl) lrcUrl = url.resolve(detail.REFERER, lrcUrl)

    $('div', body).remove()
    body = ''
    let result = Object.assign(detail, {
      'IMG_URL': coverImageUrl,
      'AUDIO_URL': audioUrl,
      'POST_TIME': dateTime,
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

