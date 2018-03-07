import Vue from 'vue'
import Router from 'vue-router'
import Articles from 'components/articles'
import Detail from 'components/detail'
import Settings from 'components/settings'
import Empty from 'components/empty'
import Subscription from 'components/subscription'
import Search from 'components/search/search'
import swipeRouter from '../vue-swipe-router'
import Player from 'components/player'
import Words from 'components/words'
Vue.use(Router)
Vue.use(swipeRouter)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/list'
    },
    {
      path: '/settings',
      component: Settings
    },
    {
      path: '/t_list',
      component: Articles
    },
    {
      path: '/t_detail',
      component: Detail
    },
    {
      path: '/subscription',
      component: Subscription,
      children: [
        {
          path: '/subscription/search',
          component: Search
        }
      ]
    },
    {
      path: '/list',
      component: Empty
    },
    {
      path: '/detail',
      component: Detail
    },
    {
      path: '/words',
      component: Words
    }

  ]
})
