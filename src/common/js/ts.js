//import { translate, detect, audio } from 'translation.js'
import * as  tjs from './translation'

export function translate(text){

console.log(text);
	return tjs.translate(text).then(result => {
	  console.log(result) // result 的数据结构见下文
	  return result
	})
} 
