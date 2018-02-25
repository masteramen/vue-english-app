import App from './components/app'
import Page from './components/page'
import swiper from './router-listener'

export default {
  install(Vue, opts = { }) {
    if (this.installed) return

    App.beforeCreate = function() {

    }
    App.created = function() {
      this.$nextTick(_ => {
        swiper(this, opts)
      })
    }
    Vue.component(App.name, App)
    Vue.component(Page.name, Page)
  }
}
