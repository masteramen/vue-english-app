import Vue from 'vue'
import Router from 'vue-router'
import Rank from 'components/rank/rank'
import TopList from 'components/top-list/top-list'
import Articles from 'components/articles'
import Settings from 'components/settings'
import Subscription from 'components/subscription'

Vue.use(Router)


export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/articles'
    },
    {
      path: '/rank',
      component: Rank,
      children: [
        {
          path: ':id',
          component: TopList
        }
      ]
    },
    {
      path: '/settings',
      component: Settings
    },
    {
      path: '/articles',
      component: Articles
    },
    {
      path: '/subscription',
      component: Subscription
    }

  ]
})
