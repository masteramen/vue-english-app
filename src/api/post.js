import {fixnum} from '../common/js/util'
import {encrypt2} from '../common/js/crypto'
import * as dataManager from '../common/js/data-manager'
import axios from 'axios'
import * as $ from 'jquery'
export async function saveArticleToRemote(article, lyric, lines) {
  await dataManager.update(article)
  console.log(lyric)
  window.lyric = lyric
  let str = `[ti:${article.TITLE}]\n`
  str += `${article.TITLE_CN}\n`
  for (let i = 0; i < lyric.lines.length; i++) {
    let line = lyric.lines[i]
    let m = fixnum(parseInt(line.time / 60000))
    let s = fixnum(parseInt(line.time / 1000) % 60)
    let ms = fixnum(0)
    str += `[${m}:${s}.${ms}]${$('<div/>').append(line.txt).text().trim()}\n`
    let lineTs = await article.translate(lines, i)
    str += `${lineTs}\n`
  }

  const data = Object.assign({}, {
    link: article.REFERER,
    content: str,
    audio: article.AUDIO_URL,
    title: article.TITLE,
    pubDate: parseInt(article.POST_DATE)
  }, {})
  let encryptStr = encrypt2(JSON.stringify(data))
  console.log(article)
  console.log(data)
  axios.post('http://www.jfox.info/rss/post.php', {'_e': encryptStr})

  console.log(str)
}
