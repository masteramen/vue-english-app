<template>
  <page title="订阅" class="subscription" >

    <div class="listCon">
      <scroll  class="toplist" ref="subscriptionlist" >
        <div class="subscription">
          <mt-checklist
            align="right"
            v-model="subscriptionList"
            :options="['VOA News', 'BBC News', 'CNN News','Fox News',' ABC News','NBC Nightly News Podcast','AP News','VOA Standard English','VOA Special English','VOA English Learning']">
          </mt-checklist>
        </div>
      </scroll>
    </div>

  </page>


</template>

<script type="text/ecmascript-6">
  import Bus from 'common/js/bus'
  import Scroll from 'base/scroll2/scroll'
  const vConsole = require( 'vconsole')

  export default {
    created() {

    },
    mounted() {


    },
    data() {
      return {
          fullScreen:true,
         subscriptionList:['voa','bbc']
        }

    },
    filters:{


    },
    methods: {
      back() {
        this.show=false
      },
      clickVersion(){
        this.clickVersionCount+=1
        if(this.clickVersionCount>3){
          new vConsole()
        }
      }
    },
    computed:{

    },
    watch: {


    },
    components: {
      Scroll,
    }
  }
</script>

<style  lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .subscription
    position: fixed
    left: 0
    right: 0
    top: 0
    bottom: 0
    z-index: 1000!important
    background: $color-background
    mt-checklist
      .mint-checkbox-label
        margin-left: 0
    .mint-checklist

      .mint-cell
        text-align: left

    .mint-cell
      background: $color-background
    .top
      position: relative
      margin-bottom: 25px
      .back
        position absolute
        top: 0
        left: 6px
        z-index: 50
        .icon-back
          display: block
          padding: 9px
          font-size: $font-size-large-x
          color: $color-theme
          transform: rotate(-90deg)
      .title
        margin: 0 auto
        line-height: 40px
        text-align: center
        no-wrap()
        font-size: $font-size-large
        color: $color-text
   .subscription
    position: fixed
    width: 100%
    top: 0px
    bottom: 0
    .listCon
      position: fixed;
      width: 100%;
      top: 44px;
      bottom: 0px;
    .toplist
      height: 100%
      overflow: hidden
      .item
        display: flex
        margin: 0 20px
        padding-top: 10px
        border-bottom: 1px solid #777;
        padding-bottom: 10px;
        &:last-child
          padding-bottom: 20px
        .icon
          flex: 0 0 100px
          width: 100px
          height: 100px
        .songlist
          flex: 1
          display: flex
          flex-direction: column
          justify-content: center
          padding: 0 20px
          height: 100px
          overflow: hidden
          background: $color-highlight-background
          color: $color-text-d
          font-size: $font-size-small
          .song
            no-wrap()
            line-height: 26px
</style>
