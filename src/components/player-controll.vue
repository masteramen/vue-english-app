<template>

  <div class="player  _line-fine" >
    <div></div>
      <div class="mini-player">

        <router-link to="/list" class="items">
          <span class="icon-home"></span>
          <p class="text">列表</p>
        </router-link>
        <router-link to="/words" class="items">
          <span class="icon-book"></span>
          <p class="text">生词</p>
        </router-link>
        <div class="icon itmes" @click="open">
          <div class="control" >
            <progress-circle :radius="radius" :percent="percent">
              <img  class="icon-mini"  :class="{play:playing,pause:!playing}" width="40" height="40" :src="logo">
            </progress-circle>
          </div>
        </div>
        <router-link to="/subscription" class="items" >
          <span class="icon-class"></span>
          <p class="text">订阅</p>
        </router-link>
        <router-link to="/settings" class="items"  ref="link">
          <span class="icon-user" ></span>
          <p class="text">设置</p>
        </router-link>
        <div class="line" style="height:10px;height: constant(safe-area-inset-bottom);height: env(safe-area-inset-bottom);"></div>
      </div>
  </div>

</template>

<script type="text/ecmascript-6">
  import {mapGetters, mapMutations, mapActions} from 'vuex'
  import Bus from 'common/js/bus'

  import ProgressCircle from 'base/progress-circle/progress-circle'

  export default {
    data() {
      return {
        curArticle: {},
        radius: 40,
        percent: 0
      }
    },
    created() {
      Bus.$on('percent', percent => {
        this.percent = percent
      })
      Bus.$on('play', article => {
        this.curArticle = article

      })
    },
    computed: {

      ...mapGetters([
        'fullScreen',
        'playing'
      ]),
      logo(){
        return this.curArticle.IMG_URL || decodeURIComponent(cordova.file.applicationDirectory + 'www/no-image.png');
      }
    },
    watch: {
      '$route' (to, from) {
        if (AdMob) {
          if (to.path == '/detail') {

            // AdMob.showRewardVideoAd()
           /* AdMob.createBanner({
              adId: 'ca-app-pub-3940256099942544/6300978111',
              position:AdMob.AD_POSITION.BOTTOM_CENTER,
              autoShow: true
            }) */
          } else {
            AdMob.removeBanner()
            if (to.path == '/list') {
              // AdMob.showRewardVideoAd()
              AdMob.showInterstitial()
            }
          }
        }
      }
    },
    methods: {

      open() {
        this.setFullScreen(true)
        let index = 0
        this.$router.push({
          path: `/player`
        })
      },
      ...mapMutations({
        setFullScreen: 'SET_FULL_SCREEN'
      }),
      ...mapActions([
        'selectCurIndex'
      ])
    },
    components: {
      ProgressCircle
    }
  }

</script>
<style>
  .mark{color:red}
  ._line-fine{
    color:red;
  }
  ._line-fine:first-child::before {
    content: "";
    position: absolute;
    width: 200%;
    left: 0;
    top: 0;
    transform: scale(.5);
    transform-origin: 0 0;
    -webkit-transform: scale(.5);
    -webkit-transform-origin: 0 0;
    background-color: #b7b7b7;
    height: 1px;
  }
</style>
<style  scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .player
    bottom:0;
    position:absolute;
    width:100%;
    img[src=""],img:not([src])
      opacity:0;
    .mini-player
      display: flex
      align-items: center
      width: 100%
      height: 60px
      //background: #f9f9f9
      &.mini-enter-active, &.mini-leave-active
        transition: all 0.4s
      &.mini-enter, &.mini-leave-to
        opacity: 0
      .items
        flex: 1
        text-align: center
        &.router-link-active
          color: $color-theme
      .icon
        flex: 0 0 40px
        width: 40px
        img
          border-radius: 50%
          &.play
            animation: rotate 10s linear infinite
          &.pause
            animation-play-state: paused
      .text
        display: flex
        flex-direction: column
        justify-content: center
        flex: 1
        line-height: 20px
        overflow: hidden
        .name
          margin-bottom: 2px
          no-wrap()
          font-size: $font-size-medium
          color: $color-text
        .desc
          no-wrap()
          font-size: $font-size-small
          color: $color-text-d
      .control
        width: 40px
        .icon-play-mini, .icon-pause-mini, .icon-playlist
          font-size: 30px
          color: $color-theme-d
        .icon-mini
          font-size: 32px
          position: absolute
          left: 0
          top: 0

  @keyframes rotate
    0%
      transform: rotate(0)
    100%
      transform: rotate(360deg)
</style>

<style scoped lang="stylus" rel="stylesheet/stylus">
  .slide-enter-active, .slide-leave-active
    transition: all 0.3s ease

  .slide-enter, .slide-leave-to
    transform: translate3d(100%, 0, 0)
</style>
