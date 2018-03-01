window.configJobs = window.configJobs || []
window.configJobs.push(function ($,urllib,dataManager) {
  function getItems(listUrl, response) {

    let results = []

    $($.parseXML(response.data)).find("item").each(function () {
      var el = $(this);

      var text = el.find("title").text()
      var absUrl = el.find("link").text()
      var pubDate = new Date(el.find("pubDate").text())
      var link = {'REFERER': absUrl, 'TITLE': text, 'ORG_SITE': 'BBC', 'POST_TIME': pubDate.getTime()}
      results.push(link);

    });


    return results
  }

  function getDetail(response, detail) {
    let body = $('div[property=articleBody]', response.data)



    $('div', body).remove()
    body = ''
    let result = Object.assign(detail, {
      'response': response
    })

    result.CONTENT = body.text()
    console.log(result)

    return result
  }


  dataManager.addConfig(
    {
      listUrl: 'http://feeds.bbci.co.uk/news/world/rss.xml',
      regex: /bbc.*?news\/world/,
      getItems: getItems,
      getDetail: getDetail
    }
  )
  dataManager.runJobs()

});

