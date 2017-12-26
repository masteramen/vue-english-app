<template>
  <div id="app">
  <m-header></m-header>
  <!-- <tab></tab> -->
  <keep-alive>
    <router-view></router-view>
  </keep-alive> 
  <article-player></article-player>   
  </div>
</template>

<script type="text/ecmascript-6">
  import MHeader from 'components/m-header/m-header'
  import MFooter from 'components/m-header/m-footer'
  import Tab from 'components/tab'
  import ArticlePlayer from 'components/article-player'

  export default {
    components: {
      MHeader,
      MFooter,
      Tab,
      ArticlePlayer
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">

</style>
