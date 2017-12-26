import Vue from 'vue'
import Router from 'vue-router'
import Recommend from 'components/recommend/recommend'
import Singer from 'components/singer/singer'
import Rank from 'components/rank/rank'
import Search from 'components/search/search'
import SingerDetail from 'components/singer-detail/singer-detail'
import Disc from 'components/disc/disc'
import Article from 'components/article/article'
import TopList from 'components/top-list/top-list'
import UserCenter from 'components/user-center/user-center'
import LatestList from 'components/latest-list'
import Articles from 'components/articles'
import Settings from 'components/settings'

Vue.use(Router)


export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/articles'
    },
    {
      path: '/recommend',
      component: Recommend,
      children: [
        {
          path: ':id',
          component: Article
        }
      ]
    },
    {
      path: '/singer',
      component: Singer,
      children: [
        {
          path: ':id',
          component: SingerDetail
        }
      ]
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
      path: '/search',
      component: Search
    },
    {
      path: '/settings',
      component: Settings
    },
    {
      path: '/lastest-list',
      component: LatestList
    },
    {
      path: '/articles',
      component: Articles
    }
  ]
})
