import AES from 'crypto-js/AES'
import MD5 from 'crypto-js/MD5'

import Utf8 from 'crypto-js/enc-utf8'
import ZeroPadding from 'crypto-js/pad-zeropadding'

import Latin1 from 'crypto-js/enc-latin1'

var key = Latin1.parse('@12345678912345!')// 密钥
var iv = Latin1.parse('@12345678912345!')// 与密钥保持一致

export function encrypt2(data) {
// 加密
 // var data = JSON.stringify(data);//将数据对象转换为json字符串
  var encrypted = AES.encrypt(data, key, {iv: iv/*, mode:mode.CBC */, padding: ZeroPadding})
  return encrypted.toString()
}
export function decrypt2(data) {
  var decrypted = AES.decrypt(data, key, {iv: iv, padding: ZeroPadding})
  decrypted = decrypted.toString(Utf8)
  return decrypted
}
export function md5(data) {
  return MD5(data).toString()
}

