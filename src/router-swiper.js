/* author: HuangQS<409337645@qq.com> */
import { supportTouch, showClass, isAndroid } from './js/domhelper'

let winw
let needMove
let startTouch = false
let canMove = false
let cancelMove = false
let e0, x0, y0, dx, dy
// 手势事件，兼容非触屏的鼠标拖动页面
const evStart = supportTouch ? 'touchstart' : 'mousedown'
const evMove = supportTouch ? 'touchmove' : 'mousemove'
const evEnd = supportTouch ? 'touchend' : 'mouseup'

const getXY = e => e.changedTouches ? e.changedTouches[0] : e

export default function (app, options) {
  app.$el.addEventListener(evStart, e => {
    e0 = e
    let { pageX, pageY } = getXY(e)
    startTouch = true
    canMove = false
    cancelMove = false
    needMove = !(isAndroid && !options.androidCanDrag)
    if (options.threshold > 0 && pageX > options.threshold && !isAndroid) cancelMove = true
    winw = document.documentElement.clientWidth
    x0 = pageX
    y0 = pageY
    showClass(e.target, options.hoverClass)
  })

  app.$el.addEventListener(evMove, e => {
    if (!startTouch) return

    let { pageX, pageY } = getXY(e)
		// console.log(pageX, pageY)
    dx = pageX - x0
    dy = pageY - y0
    if (!canMove && Math.abs(dy) > options.cancelMoveDis) cancelMove = true
    if (!canMove && !cancelMove && dx > options.startMoveDis && (app.prevPage)) canMove = true
    if (canMove && needMove) {
      e.preventDefault() // 阻止浏览器默认行为 防止页面上下滚动
      var mx_curr = Math.max(0, dx)
      var mx_prev = -parseInt((winw - mx_curr) / 3)
      app.onmove = true
      app.currTrans = `translateX(${mx_curr}px)`
      app.prevTrans = `translateX(${mx_prev}px)`
    }
    if (dx * dx + dy * dy > 6 * 6) showClass(e0.target, options.hoverClass, false)
  })

  app.$el.addEventListener(evEnd, e => {
    if (!startTouch) return
    startTouch = false
    showClass(e0.target, options.hoverClass, false)
		// console.log(e)
    let { pageX, pageY } = getXY(e)
		// console.log(pageX, pageY)
    if (canMove) {
      var dt = (e.timeStamp - e0.timeStamp) / 1000
      var vx = parseInt(dx / dt)
			// console.log(vx)
      if (app.onmove) {
        app.endmove = true
      }
      if (pageX - x0 > winw / 3 || vx > 280 && dx > 40) {
/*        if (app.fullScreen){
          app.setFullScreen(false)
          app.onmove = false
          app.currTrans = false
          app.prevTrans = false
        }
        else */
          app.$router.back()
      } else {
        app.onmove = false
        app.currTrans = false
        app.prevTrans = false
      }
      setTimeout(_ => app.endmove = false, options.endmoveDure)
    }
  })
}
