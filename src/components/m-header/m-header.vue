<template>
  <div class="m-header">
    <i class="icon-refresh" @click.stop="refresh()"></i>
    <h1 class="text">News</h1>
    <router-link tag="div" class="mine" to="/user">
      <i class="icon-download" @click.stop="triggerDownloadAll(!downloadAll)"></i>
    </router-link>
  </div>
</template>

<script type="text/ecmascript-6">
import {mapGetters, mapMutations, mapActions} from 'vuex'
import Bus from 'common/js/bus'

  export default {

  methods:{
  ...mapMutations({
    triggerDownloadAll: 'SET_DOWNLOAD_ALL_STATE'
  }),
  refresh(){
        Bus.$emit('refresh');   

  }
  },
  computed: {
  ...mapGetters([
    'downloadAll'
  ])
}

  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .m-header
    position: relative
    height: 44px
    text-align: center
    color: $color-theme
    background: #333;
    font-size: 0
    .icon-refresh
      position: absolute
      left: 0
      top: 0
      margin-top: 6px
      margin-left: 20px
    .icon
      display: inline-block
      vertical-align: top
      margin-top: 6px
      width: 30px
      height: 32px
      margin-right: 9px
      //bg-image('logo')
      background-size: 30px 32px
    .text
      display: inline-block
      vertical-align: top
      line-height: 44px
      font-size: $font-size-large
    .mine
      position: absolute
      top: 0
      right: 0
      margin-top: 6px
      margin-right: 20px
      .icon-mine
        display: block
        padding: 12px
        font-size: 20px
        color: $color-theme
</style>