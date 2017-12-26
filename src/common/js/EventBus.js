 export function dispatchEvent(eventType,value) {
     var ev = document.createEvent('HTMLEvents');
     ev.initEvent(eventType, true, true);
     ev[eventType] = value;
     document.dispatchEvent(ev);
 }
