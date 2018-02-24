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
          <img :class="cdCls" width="40" height="40" :src="curArticle.IMG_URL">
        </div>
        <router-link to="/subscription" class="items" >
          <span class="icon-class"></span>
          <p class="text">订阅</p>
        </router-link>
        <router-link to="/settings" class="items"  ref="link">
          <span class="icon-user" ></span>
          <p class="text">设置</p>
        </router-link>

        <div class="text" v-show="false">
          <div class="name"  v-html="curArticle.name"></div>
          <div class="desc"  v-html="curArticle.singer"></div>
        </div>
        <div class="control" v-show="false">
          <progress-circle :radius="radius" :percent="percent">
            <i @click.stop="togglePlaying" class="icon-mini" :class="miniIcon"></i>
          </progress-circle>
        </div>
        <div class="control" v-show="false">
          <div class="icon-playlist"></div>
        </div>
        <div class="line" style="height:10px;height: constant(safe-area-inset-bottom);height: env(safe-area-inset-bottom);"></div>
      </div>
  </div>

</template>

<script type="text/ecmascript-6">
  import {mapGetters, mapMutations, mapActions} from 'vuex'
  import animations from 'create-keyframe-animation'
  import {prefixStyle} from 'common/js/dom'

  import ProgressBar from 'base/progress-bar/progress-bar'
  import ProgressCircle from 'base/progress-circle/progress-circle'
  import {playMode} from 'common/js/config'
  import {shuffle} from 'common/js/util'
  import Lyric from 'lyric-parser'
  import Scroll from 'base/scroll/scroll'
  import player from 'common/js/player'
  import touchDir from 'common/js/touch-dir'
  import {getSilent, createArticle} from 'common/js/service'
  import {update} from 'common/js/data-manager'
  import * as ts from 'common/js/translation'
  import Loading from 'base/loading/loading'
  const transform = prefixStyle('transform')
  const webkit = 'transform' in document.body.style ? '' : '-webkit-';
  const transitionDuration = prefixStyle('transitionDuration')
  const ransitionDurationValue = 200

  export default {
    data() {
      return {
        curArticle: createArticle({}),
        songReady: false,
        currentTime: 0,
        duration: 1,
        radius: 32,
        currentLyric: null,
        currentLineNum: 0,
        currentShow: 'lyric',
        playingLyric: '',
        audioUrl: '',
        lyricFollow: true,
        needUpdateRemoteControl: true,
        lastSwipeTime: '',
        showLoading: true,
        loadingTitle: '',
        popupVisible: true
      }
    },
    computed: {
      cdCls() {
        return this.playing ? 'play' : 'play pause'
      },
      playIcon() {
        return this.playing ? 'icon-pause' : 'icon-play'
      },
      miniIcon() {
        return this.playing ? 'icon-pause-mini' : 'icon-play-mini'
      },
      disableCls() {
        return ''
      },
      lyricFollowCls() {
        return this.lyricFollow ? '' : 'not-lyricFollow'
      },
      percent() {
        return this.currentTime / this.curArticle.DURATION
      },
      iconMode() {
        return this.mode === playMode.sequence ? 'icon-sequence' : this.mode === playMode.loop ? 'icon-loop' : 'icon-random'
      },
      ...mapGetters([
        'fullScreen'
      ])
    },
    methods: {

      open() {
        this.setFullScreen(true)
        this.$router.push({
          path: `/detail`
        })
      },
      ...mapMutations({
        setFullScreen: 'SET_FULL_SCREEN'
      })
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
    z-index: 2;
  }
</style>
<style  scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .player
    bottom:0;
    position:absolute;
    width:100%;
    z-index:2
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
        flex: 0 0 30px
        width: 30px
        padding: 0 10px
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
