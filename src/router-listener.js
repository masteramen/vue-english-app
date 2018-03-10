/* author: HuangQS<409337645@qq.com> */
import swiper from './router-swiper'

const defThreshold = 30
let options = {
  threshold: 0, // 距离页面左边多少间距以内可以开始滑动，0代表任意
  useDefThreshold: false, // 如有这个参数，则会设定threshold为defThreshold，忽略threshold参数
  hoverClass: 'hover', // 按下元素之后会添加的class，松开会移除
  androidCanDrag: false // 安卓默认不支持手势滑动
}
const sysOptions = {
  startMoveDis: 10, // 手势滑动最小可以开始移动的距离
  defmoveDure: 260, // 这里设置了比页面切换间隔时间大40ms，保证回退时显示完整的页面切换动画
  endmoveDure: 100, // 手势滑动松开之后页面切换时间是100ms
  cancelMoveDis: 20 // 垂直方向滑动这个距离之后取消识别页面滑动
}

export default function (app, opts = {}) {
  const router = app.$router
  if (!router) {
    console.warn('this plugin only works with vue-router')
    return
  }

  Object.assign(options, opts, sysOptions)
  if (options.useDefThreshold) options.threshold = defThreshold
	// console.log(options.threshold)
  swiper(app, options)

	// 取得path对应的component
  const getComponent = (path) => {
    console.log(path)
    if (path === '') path = '/'
    var arr = router.options.routes.filter(item => {
      return path == item.path
    })
    if (arr.length > 1) console.log(arr)
    return arr.length ? arr[0].component : null
  }
  const getSlideItem = (path) => {
    return {component: getComponent(path), name: path.replace('t_','')}
  }

  let pathArr = JSON.parse(sessionStorage.pathArr || '[]') // 路由路径本地存储

  app.slides = ['/t_list','/t_detail','/t_settings','/t_subscription','/t_words','/t_player'].map(x => getSlideItem(x))
  router.beforeEach((to, from, next) => {
    const fromPath = from.matched[0].path
    const toPath = to.matched[0].path
    console.log(toPath)
    app.curPath = toPath
    let prevPath = fromPath

    if (!pathArr.length) pathArr.push(fromPath)
    const toIndex = pathArr.indexOf(toPath)

    let backMode = 0 // 0：前进 1：回退一个路由 2：回退多个路由

    if (toIndex == -1) {
      pathArr.push(toPath)
    } else if (toIndex == pathArr.length - 2) {
      backMode = 1
    } else {
      backMode = 2
    }

    if (backMode > 0) {
      prevPath = pathArr[toIndex - 1] // toIndex为0时，undefined，前一页会为空
      pathArr = pathArr.slice(0, toIndex + 1)
    }

    sessionStorage.pathArr = JSON.stringify(pathArr)
    const prevPage = getComponent(prevPath)
    app.prevPath = prevPath

    let trans_dure = options.defmoveDure
    if (app.onmove) {
			// 手势滑动结束后的路由切换
      app.onmove = false
      app.currTrans = false
      app.prevTrans = false
      trans_dure = options.endmoveDure
    }
    if (backMode == 0) {
			// 前进：先next切换路由，再setTimeout异步显示动画
      app.isShow = false
      app.isPrev = false
      app.prevPage = prevPage
      next()
      setTimeout(_ => {
        app.isShow = true
        app.isPrev = true
      }, 10)
    }		else {
      if (!app.prevPage || backMode == 2) {
				//! app.prevPage为页面被刷新之后的情况
        app.prevPage = getComponent(toPath) // 先设置好回退目标页
      }
			// 回退：先显示回退动画，再next切换路由
      app.goback = true
      app.isPrev = false
      setTimeout(_ => {
        next()
        app.goback = false
        app.isPrev = true
        app.prevPage = prevPage
      }, trans_dure)
    }

		// console.log(to, router)
  })
  router.afterEach(route => {
		// console.log(route)
  })
}

