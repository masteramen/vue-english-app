/**
 obj:触发元素；
 dir:期望触发方向；'up','down','left','right'
 fn :触发后的回调函数
 */
var TouchEvent = function(obj, fn) {
  this.pos = {x: 0, y: 0}// 开始触发位置
  var me = this
  obj.addEventListener('touchstart', function(event) {
    var touch = event.touches[0]
    me.pos.x = touch.pageX
    me.pos.y = touch.pageY
    me.curtouch = undefined
  }, false)
  obj.addEventListener('touchmove', function(event) {
    var touch = event.touches[0]
    me.curtouch = {
      x: touch.pageX,
      y: touch.pageY
    }
  }, false)
  obj.addEventListener('touchend', function(event) {
    if (me.pos && me.curtouch) {
      let dir = me.checkDirV(me.pos, me.curtouch) || me.checkDirH(me.pos, me.curtouch)
      dir && (typeof fn === 'function') && fn(dir)
    }
  }, false)
}
TouchEvent.prototype = {
  posdiff: 10, // 触发敏感度
  checkDirV: function(a, b) {
    return Math.abs(a.y - b.y) > this.posdiff ? (a.y > b.y ? 'up' : 'down') : ''
  },
  checkDirH: function(a, b) {
    return Math.abs(a.x - b.x) > this.posdiff ? (a.x > b.x ? 'left' : 'right') : ''
  }
}

export default function touchDir(el, handlerFn) {
  new TouchEvent(el, handlerFn)
}
// //eg:new touchEvent(document.getElementById('content'),'left',function(){alert(34);});
