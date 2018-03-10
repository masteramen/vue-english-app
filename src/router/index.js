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
      path: '/t_list',
      component: Articles
    },
    {
      path: '/list',
      component: Empty
    },
    {
      path: '/t_settings',
      component: Settings
    },
    {
      path: '/settings',
      component: Empty
    },
    {
      path: '/t_detail',
      component: Detail
    },
    {
      path: '/detail',
      component: Empty
    },
    {
      path: '/subscription',
      component: Empty,
      children: [
        {
          path: '/subscription/search',
          component: Search
        }
      ]
    },
    {
      path: '/t_subscription',
      component: Subscription
    },
    {
      path: '/t_words',
      component: Words
    },
    {
      path: '/words',
      component: Empty
    },
    {
      path: '/t_player',
      component: Player
    },
    {
      path: '/player',
      component: Empty
    }

  ]
})
