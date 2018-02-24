
let ua = navigator.userAgent;
export const isAndroid = /android/i.test(ua);
export const isIos = /iPhone|iPad/i.test(ua);
export const isWechat = /MicroMessenger/i.test(ua);

export const supportTouch = 'ontouchstart' in window;

export function showClass(el, cls, isShow='true') {
	while(el) {
		isShow ? el.classList.add(cls) : el.classList.remove(cls);
		el = el.parentElement;
	}
}

export function getSiblings(el) {
	var cur = el;
	var res = [];
	while(cur = cur.previousElementSibling) res.push(cur);
	cur = el;
	while(cur = cur.nextElementSibling) res.push(cur);
	return res;
}

export function getHeight(doms) {
	var h = 0;
	doms.forEach(dom => {
		h += dom.offsetHeight;
	})
	return h;
}