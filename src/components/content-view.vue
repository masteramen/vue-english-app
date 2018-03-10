<template>
  <div class="player" >
  <div class="normal-player"  ref="playerWrap">
    <div class="background">
      <img width="100%" height="100%" :src="curArticle.IMG_URL">
    </div>
    <div class="top">
      <div style="position: relative">
      <div class="back" @click="back">
        <i class="icon-back"></i>
      </div>
      <div class="title" ref="title">正文<span v-if="editMode">（编辑）</span></div>
        <admin-menu></admin-menu>
      </div>
    </div>
    <div class="middle" ref="middle">
      <scroll class="middle-l" ref="lyricList" :data="currentLyric && currentLyric.lines" :pullup="true"   >
        <div class="lyric-wrapper" >
          <p class="cover"><img :src="curArticle.IMG_URL" style="max-width:100%;"/></p>

          <p  class="text"><a target="_blank" :href="curArticle.REFERER">{{curArticle.REFERER}}</a></p>
          <p>{{curArticle.TITLE_CN}}</p>
          <div v-if="currentLyric" >
            <div  v-for="(line,index) in currentLyric.lines" >
              <p ref="lyricLine"
                 class="text"
                 :class="{'current': currentLyric.curNum-1 ===index}"
                v-html="line.txt" @click="playTime(line.time)">
              </p>
              <lazy-component @show="handlerTS(index,line)" class="text" v-if="reload" >
                <p class="text" v-if="trlines[index]">{{trlines[index]}}</p>
              </lazy-component>
            </div>

          </div>
        </div>
      </scroll>
      <div class="loading-container" v-show="loadingTitle">
        <loading :title="loadingTitle"></loading>
      </div>
    </div>
  </div>
  </div>
</template>


<script type="text/ecmascript-6">
  import {mapGetters, mapMutations, mapActions} from 'vuex'

  import ProgressBar from 'base/progress-bar/progress-bar'
  import ProgressCircle from 'base/progress-circle/progress-circle'
  import {playMode} from 'common/js/config'
  import Lyric from 'lyric-parser'
  import Scroll from 'base/scroll2/scroll'
  import player from 'common/js/player'
  import touchDir from 'common/js/touch-dir'
  import {getSilent, createArticle, getDict, configProvider} from 'common/js/service'
  import {update} from 'common/js/data-manager'
  import Loading from 'base/loading/loading'
  import AdminMenu from './m-header/admin-menu'
  export default {
    data() {
      return {
        curArticle: createArticle({}),
        currentLyric: null,
        currentLineNum: 0,
        currentShow: 'lyric',
        showLoading: true,
        loadingTitle: '',
        reload: true,
        trlines: [],
        lines:[]
      }
    },
    created() {
      this.touch = {}
    },
    mounted() {

      this.$nextTick(() => {
        this.$refs.playerWrap.style['width'] = window.innerWidth + 'px'

        let that = this
        $('.lyric-wrapper').on('click', 'span', function() {
          $(this).toggleClass('mark')
          if ($(this).hasClass('mark')) {
            getDict($(this).text().trim()).then(result => {
              let html = $(this).html()
              $(this).html(`${html}<b>(${result.result})</b>`)
              // alert(result.audio)
              // that.$refs.wordAudio.src = result.audio
              let playing = that.playing
              if (playing) {
                that.togglePlaying()
              }

              let onerror = function() {
                if (playing) {
                  that.togglePlaying()
                }
              }
              player.tmpPlay(result.audio, onerror, onerror)
              // that.$refs.wordAudio.play()
            })
          } else {
            $(this).find('b').remove()
          }
        })
      })
    },
    computed: {
      ...mapGetters([
        'fullScreen',
        'playlist',
        'currentSong',
        'playing',
        'currentIndex',
        'mode',
        'editMode'
      ])
    },
    methods: {
      handlerTS (index,line) {
        this.curArticle.tr(this.lines,index).then(result => {
          this.trlines.splice(index, 1, result)
        })
      },
      back() {
        this.$router.back()
      },
      togglePlaying() {
        this.setPlayingState(!this.playing)
      },
      getLyric: function () {
        this.loadingTitle = '正在加载内容'
        let id = this.curArticle.ID
        return this.curArticle.getLyric()
          .then(({lines, lyric}) => {
            if (id !== this.curArticle.ID) return
            this.lines = lines
            this.trlines = [...Array(lines.length)].map((_, i) => false)
            this.reload = false
            this.$nextTick(() => {
              setTimeout(_ => {
                this.reload = true
              }, 500)
            })
            if (this.currentLyric) {
              this.currentLyric.stop()
              delete this.currentLyric
            }
            this.loadingTitle = ''
            if (lyric) this.currentLyric = new Lyric(lyric, this.handleLyric)
          })
      },
      handleLyric({ lineNum, txt }) {
        // console.log(txt)
        this.$nextTick(() => {
          this.currentLineNum = lineNum
          let curLine = this.$refs.lyricLine[lineNum]

          if (this.lyricFollow) {
            if ($(curLine).offset().top < $('.middle').offset().top || $(curLine).offset().top + $(curLine).height() > $('.middle').offset().top + $('.middle').height()) {
              this.$refs.lyricList.scrollToElement(curLine, 1000)
            }
          }
          if (txt) this.playingLyric = txt
        })
      },
      _fullZero(num, n = 2) {
        let len = num.toString().length
        while (len < n) {
          num = '0' + num
          len++
        }
        return num
      },
      _getPosAndScale() {
        const targetWidth = 40
        const paddingLeft = 40
        const paddingBottom = 30
        const paddingTop = 80
        const width = window.innerWidth * 0.8
        const scale = targetWidth / width
        const x = -(window.innerWidth / 2 - paddingLeft)
        const y = window.innerHeight - paddingTop - width / 2 - paddingBottom
        return {
          x,
          y,
          scale
        }
      },
      ...mapMutations({
        setPlayingState: 'SET_PLAYING_STATE'
      }),
      ...mapActions([
        'savePlayHistory'
      ])
    },
    watch: {
      currentIndex(newIndex, oldIndex) {

        let currentArticle = window.sequenceList[(this.mode === playMode.random ? window.randomList[newIndex] : newIndex)]
        if(currentArticle.AUDIO_URL) return
        this.curArticle = currentArticle
        this.$refs.lyricList.scrollTo(0, 0)
        if (this.currentLyric) {
          // this.currentLyric.seek(0)
          this.currentLyric.stop()
        }
        this.getLyric()
      }

    },
    components: {
      ProgressBar,
      ProgressCircle,
      Scroll,
      Loading,
      AdminMenu
    }
  }

</script>
<style>
  .mark{color:red}
</style>
<style  scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .player
    .popup
      width: 100%
      text-align: center
      color: black
    .normal-player
      position: fixed
      left: 0
      right: 0
      top: 0
      bottom: 0
      z-index: 150
      background: $color-background
      .background
        position: absolute
        left: 0
        top: 0
        width: 100%
        height: 100%
        z-index: -1
        opacity: 0.6
        filter: blur(20px)
        padding:20px
      .top
        position: relative
        //background: $color-background
        z-index: 100
        .back
          position absolute
          top: 0
          z-index: 50
          .icon-back
            display: block
            padding: 9px
            font-size: $font-size-large-x
            color: $color-theme
            transform: rotate(-90deg)
        .title
          margin: 0 auto
          margin-left: 0px
          line-height: 40px
          text-align: center
          no-wrap()
          font-size: $font-size-large
          color: $color-text
        .subtitle
          line-height: 20px
          text-align: center
          font-size: $font-size-medium
          color: $color-text
      .middle
        position: absolute
        width: 100%
        top: 50px
        bottom: 10px
        white-space: nowrap
        font-size: 0
        .loading-container
          position: absolute
          width: 100%
          top: 50%
          z-index :1
          transform: translateY(-50%)
          .playing-lyric-wrapper
            width: 80%
            margin: 30px auto 0 auto
            overflow: hidden
            text-align: center
            .playing-lyric
              height: 20px
              line-height: 20px
              font-size: $font-size-medium
              color: $color-text-l
              white-space: normal
        .middle-l
          display: inline-block
          vertical-align: top
          width: 100%
          height: 100%
          overflow: hidden

          .lyric-wrapper

            margin: 0 20px
            overflow: hidden
            text-align: left
            .text
              .mark
                font-weight:bold
                color:red
              line-height: 2em
              margin:16px 0

              color: $color-text-l
              font-size: 16px
              white-space: normal
              &.current
                color: $color-text


      .bottom
        position: absolute
        bottom: 20px
        width: 100%
        .dot-wrapper
          text-align: center
          font-size: 0
          .dot
            display: inline-block
            vertical-align: middle
            margin: 0 4px
            width: 8px
            height: 8px
            border-radius: 50%
            background: $color-text-l
            &.active
              width: 20px
              border-radius: 5px
              background: $color-text-ll
        .progress-wrapper
          display: flex
          align-items: center
          width: 80%
          margin: 0px auto
          padding: 10px 0
          .time
            color: $color-text
            font-size: $font-size-small
            flex: 0 0 30px
            line-height: 30px
            width: 30px
            &.time-l
              text-align: left
            &.time-r
              text-align: right
          .progress-bar-wrapper
            flex: 1
        .operators
          display: flex
          align-items: center
          .icon
            flex: 1
            color: $color-theme
            &.disable
              color: $color-theme-d
            &.not-lyricFollow
              color:#ccc
            i
              font-size: 30px
          .i-left
            text-align: right
          .i-center
            padding: 0 20px
            text-align: center
            i
              font-size: 40px
          .i-right
            text-align: left
          .icon-favorite
            color: $color-sub-theme
      &.normal-enter-active, &.normal-leave-active
        transition: all 1s
        transition: all 1s cubic-bezier(0, 1, 1, 0.46)
        .top, .bottom
          transition: all 1s cubic-bezier(0.86, 0.18, 0.82, 1.32)

    .mini-player
      display: flex
      align-items: center
      position: fixed
      left: 0
      bottom: 0
      z-index: 180
      width: 100%
      height: 60px
      background: $color-highlight-background
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
