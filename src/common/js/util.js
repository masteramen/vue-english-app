function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function shuffle(arr) {
  let _arr = arr.slice()
  for (let i = 0; i < _arr.length; i++) {
    let j = getRandomInt(0, i)
    let t = _arr[i]
    _arr[i] = _arr[j]
    _arr[j] = t
  }
  return _arr
}

export function debounce(func, delay) {
  let timer

  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

export function fixnum(n) {
  return (Array(2).join('0') + n).slice(-2)
}

export async function formate2Lyric(detailObj) {
  let duration = detailObj.DURATION || 6 * 60
  let lines = false
  let text = detailObj.CONTENT

  try {
    lines = JSON.parse(detailObj.CONTENT)
    text = lines.join('\n')
  } catch (e) {}
  let timer = 0
  let str = `[ti:${detailObj.TITLE}]\r\n`
  if (!lines) {
    lines = detailObj.CONTENT
      .replace(/(;)/g, '$1\n')
      .replace(/(")/g, '\n$1\n')
      .replace(/([^A-Z]+[.?!])[\s\n]+(?=[A-Z])/g, '$1\n')
      .replace(/([a-z0-9]+\.)(?=[A-Z])/g, '$1\n')
      .replace(/([".]\s+)(?=[A-Z][a-z]+)/g, '$1\n')
      .replace(/([?.]\s*")(?=[A-Z][a-z]+)/g, '$1\n')
      .replace(/\n+/g, '\n')
      // .replace(/(,)[\n\s]+/g, '$1')
      // .replace(/"\n([\s\S]*?)\n"/g, '"$1"')
      // .replace(/\n([a-z]{1,20}\.)\n/gi, '\n$1')
      // .replace(/(\s[a-z]{1,3}\.)\n(.{0,10}\.)/gi, '$1 $2')
      // .replace(/\n(.{1,10}\.)\n/gi, '\n$1 ')
      .replace(/([A-Z]+.\n[A-Z]+\.)\s/gi, function (matchStr) {
        return matchStr.replace(/\n+/gm, '') + ' '
      })
      .replace(/"[^"]+"/g, function (matchStr) {
        return matchStr.replace(/\n+/gm, ' ').replace(/"\s+/g, '"')
      })
      .replace(/("\n+\s*)(?=[a-z0-9]+)/g, '" ')
      .replace(/([a-z0-9]+)\s*\n+\s*"/g, '$1 "')
      // .replace(/"\n([^.]*\.)/gi, '" $1\n')
      .replace(/([A-Z]\s*\.)\n+(\s*)/g, '$1$2')
      .replace(/(,\s*)\n+/g, '$1')
      .replace(/\n+/g, '\n')
      .replace(/\n\s*\n/g, '')

      .split(/\n/)
  }

  let timeLines = lines.filter(x => x.trim().match(/^[[]*\d+:\d+/))
  if (timeLines.lenght > 3) {
    str = +text.replace(/(\d+(:\d+)+)/g, '[$1]')
  } else {
    var words = text.split(/\s+/).filter(x => x)
    var wordTime = duration / words.length
    lines.forEach((line, index) => {
      let wc = line.split(/\s+/).filter(x => x).length
      let takeTImes = wc * wordTime
      let m = fixnum(parseInt(timer / 60))
      let s = fixnum(parseInt(timer % 60))
      let ms = fixnum(0)
      str += `[${m}:${s}.${ms}]${line}\n`
      timer += takeTImes
    })
  }
  // if (content.length > 1) { str += '\n' + content[1] }
  str = str.split(/\n/).map(x => x.match(/^\[\d+/) ? x.replace(/([a-z]+)/gi, '<span>$1</span>') : x).join('\n')
  console.log(lines)
  return [lines, str]
}
