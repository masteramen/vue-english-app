<template>
  <div class="m-header">
    <!--<i class="icon-refresh" @click.stop="refresh()"></i>-->
    <h1 class="text">列表({{data.length}})</h1>
    <index-menu></index-menu>
<!--    <router-link tag="div" class="mine" to="/user">
      <i class="icon-more icon" @click.stop="triggerDownloadAll(!downloadAll)"></i>
    </router-link>-->
  </div>

</template>

<script type="text/ecmascript-6">
import {mapGetters, mapActions} from 'vuex'
import Bus from 'common/js/bus'
import indexMenu from './index-menu'
  export default {
    props: {
      data: {
        type: Array,
        default: function () {
          return []
        }
      }
    },
  refresh(){
        Bus.$emit('refresh');

  }
  ,
  computed: {
  ...mapGetters([
    'downloadAll'
  ])
},
    components:{indexMenu}

  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .m-header
    position: relative
    height: 44px
    text-align: center

    background: linear-gradient(180deg,#303036,#3c3b40)
    font-size: 0
    .icon-add1
      position: absolute
      left: 0
      top: 0
      margin-top: 6px
    .icon
      display: inline-block
      vertical-align: top
      padding-right:12px

      //margin-right: 9px
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
      right: 3px
      margin-top: 3px
      .icon-mine
        display: block
        padding: 12px
        font-size: 20px

</style>
