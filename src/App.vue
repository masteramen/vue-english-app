<template>
 <app >
  <!-- <tab></tab> -->
  <article-player></article-player>
   </app>
</template>

<script type="text/ecmascript-6">

  import ArticlePlayer from 'components/player-controll'
  // import {downloadArtilePic2} from 'common/js/service'

  function handler ({ el, src }, formCache) {
  // console.log(el, src)
    // if(!formCache){
    console.log('trigger loaded event...')
    el.dispatchEvent(new Event('loaded'))

    // $(el).trigger('loaded')
    // downloadArtilePic2(src,el.dataset.id)
  // }
}

  export default {
    created() {
      this.$Lazyload.$on('loaded', handler)
    },
    components: {
      ArticlePlayer
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">

</style>
