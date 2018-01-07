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
  //import {downloadArtilePic2} from 'common/js/service'

  function handler ({ el, src }, formCache) {

    //console.log(el, src)
    //if(!formCache){
      console.log('trigger loaded event...');
      el.dispatchEvent(new Event('loaded'));

      //$(el).trigger('loaded')
      //downloadArtilePic2(src,el.dataset.id)  
    //}

  }

  export default {
    created() {
      this.$Lazyload.$on('loaded', handler)

    },
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
