<template>
  <div class="setting" v-show="fullScreen">
        <div class="background"></div>
        <div class="top">
            <div class="back" @click="back">
              <router-link to="/articles">
              <i class="icon-back"></i>
              </router-link>

            </div>
            <div class="title">设置</div>
        </div>
        <div class="listCon">
        <scroll  class="toplist" ref="settinglist" >
        <ul>

        <mt-cell
          title="保留文章数上限"
          label="超出上限后自动删除旧的文章"
          to="//github.com"
          is-link
          value="100">
        </mt-cell>
        <mt-cell title="占用空间大小"></mt-cell>
        <mt-cell title="已使用存储"><mt-switch v-model="value"></mt-switch></mt-cell>
        <mt-cell title="版本" :value="currentWebVersion" @click="clickVersion">{{clickVersionCount}}</mt-cell>
        <mt-cell title="已读文章数" :value="currentWebVersion"></mt-cell>
        <mt-cell title="已听过分钟" :value="currentWebVersion"></mt-cell>
        <mt-cell
          title="关于"
          to="//github.com"
          is-link
          value="带链接">
        </mt-cell>

        </ul>
        </scroll>
       </div>

</div>

</template>

<script type="text/ecmascript-6">
  import Bus from 'common/js/bus'
  import Scroll from 'base/scroll2/scroll/scroll'
  const vConsole = require( 'vconsole')

  export default {
    created() {

    },
    mounted() {
      chcp.getVersionInfo((err, data) => {

        console.log('Current web version: ' + data.currentWebVersion);
        console.log('Previous web version: ' + data.previousWebVersion);
        console.log('Loaded and ready for installation web version: ' + data.readyToInstallWebVersion);
        console.log('Application version name: ' + data.appVersion);
        console.log('Application build version: ' + data.buildVersion);
        this.currentWebVersion=data.currentWebVersion

      });

    },


    data() {
      return {
          fullScreen:true,
          currentWebVersion:'',
          clickVersionCount:0
        }
      
    },
    filters:{

      
    },
    methods: {
      back() {
        this.show=false
      },
      clickVersion(){
        this.clickVersionCount++
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

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .setting
    position: fixed
    left: 0
    right: 0
    top: 0
    bottom: 0
    z-index: 150
    background: $color-background
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
   .setting
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
