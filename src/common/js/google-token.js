/**
 * 代码来自 https://github.com/matheuss/google-translate-token
 * 做了一些修改以适应本项目
 */
const axios = require('axios')
var tk = '';
// region 复制过来的代码，做了一些修改确保 typescript 不会报错
/* tslint:disable */
var yr = null;
function sM(a) {
    var b;
    if (null !== yr)
        b = yr;
    else {
        b = (yr = tk || '') || '';
    }
    var d = ['t', 'k'];
    var c1 = '&' + d.join('') + '=';
    d = b.split('.');
    b = Number(d[0]) || 0;
    for (var e = [], f = 0, g = 0; g < a.length; g++) {
        var l = a.charCodeAt(g);
        128 > l
            ? (e[f++] = l)
            : (2048 > l
                ? (e[f++] = (l >> 6) | 192)
                : (55296 == (l & 64512) &&
                    g + 1 < a.length &&
                    56320 == (a.charCodeAt(g + 1) & 64512)
                    ? ((l = 65536 + ((l & 1023) << 10) + (a.charCodeAt(++g) & 1023)),
                        (e[f++] = (l >> 18) | 240),
                        (e[f++] = ((l >> 12) & 63) | 128))
                    : (e[f++] = (l >> 12) | 224),
                    (e[f++] = ((l >> 6) & 63) | 128)),
                (e[f++] = (l & 63) | 128));
    }
    a = b;
    for (f = 0; f < e.length; f++)
        (a += e[f]), (a = xr(a, '+-a^+6'));
    a = xr(a, '+-3^+b+-f');
    a ^= Number(d[1]) || 0;
    0 > a && (a = (a & 2147483647) + 2147483648);
    a %= 1e6;
    return c1 + (a.toString() + '.' + (a ^ b));
}
function xr(a, b) {
    for (var c = 0; c < b.length - 2; c += 3) {
        var d = b.charAt(c + 2), d1 = 'a' <= d ? d.charCodeAt(0) - 87 : Number(d), d2 = '+' == b.charAt(c + 1) ? a >>> d1 : a << d1;
        a = '+' == b.charAt(c) ? (a + d2) & 4294967295 : a ^ d2;
    }
    return a;
}
// endregion
/* tslint:enable */
function default_1(text, com) {
    return new Promise(function (resolve, reject) {
        var now = Math.floor(Date.now() / 3600000);
        // token 每小时才刷新一次，如果没过期则直接使用上次更新的 token
        if (Number(tk.split('.')[0]) === now) {
            resolve();
        }
        else {
            // 从谷歌翻译的网页上获取到最新的 token
                const data = Object.assign({},{},{})
                axios.get('https://translate.google.' + (com ? 'com' : 'cn'),{
                    params:data,
                    headers: {
                     }
                }).then(resp=>resp.data).then(function (text) {
                var match = text.match(/TKK=eval\('\(\(function\(\){(.*?)}\)\(\)\)'\);/);
                if (match) {
                    // 函数体不接收 ASCII 码，所以这里要手动转换一遍
                    var code = match[1].replace(/\\x3d/g, '=').replace(/\\x27/g, "'");
                    try {
                        tk = new Function(code)();
                        console.log('tk....:'+tk);
                    }
                    catch (e) { }
                }
                resolve();
            }, reject);


}
    }).then(function () { return sM(text).replace('&tk=', ''); });
}
exports.default = default_1;

exports.translate = function(text){
    return default_1(text,false).then(tk=>{
        return tk
    })
    .then(function (tk) {
                var headers = {
                    'referer':'https://translate.google.cn/',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
                };
                 let to = 'zh-CN'
                 const data = Object.assign({},{
                    client: 't',
                    sl: 'auto',
                    tl: to,
                    hl: to,
                    tk: tk,
                    ie: 'UTF-8',
                    oe: 'UTF-8',
                    otf: '1',
                    ssel: '0',
                    tsel: '0',
                    kc: '7',
                    q: 'hello'
                },{})
                             //    dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'].join(,
                let dt=['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'].map(x=>'dt='+x).join('&')
                 //console.log(data);
                let options = {
                    params:data,
                    headers: headers,
                     }
                    return axios.get('https://translate.google.cn/translate_a/single?'+dt,options).
                    then(res=>{
                            return res.data[0][0][0]
                     })
    })


}
