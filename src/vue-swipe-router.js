import App from './components/app'
import Wrap from './components/wrap'
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

    Vue.component(opts.list_name || 'list', { template: '<ul class="set-list"><slot/></ul>'})
    Vue.component(App.name, App)
    Vue.component(Wrap.name, Wrap)
    Vue.component(Page.name, Page)
  }
}
