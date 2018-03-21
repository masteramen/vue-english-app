import AES from 'crypto-js/AES'

import Utf8 from 'crypto-js/enc-utf8'
import ZeroPadding from 'crypto-js/pad-zeropadding'
import CBC from 'crypto-js/mode-ecb'
import Latin1 from 'crypto-js/enc-latin1'

var key = Latin1.parse('@12345678912345!');//密钥
var iv = Latin1.parse('@12345678912345!');//与密钥保持一致

export function encrypt2(data){

//加密
 // var data = JSON.stringify(data);//将数据对象转换为json字符串
  var encrypted = AES.encrypt(data,key,{iv:iv,mode:CBC,padding:ZeroPadding});
  return encrypted.toString()
}
export function decrypt2(data) {
  var decrypted = AES.decrypt(data,key,{iv:iv,padding:ZeroPadding});
  decrypted=decrypted.toString(Utf8);
  return decrypted;
}


