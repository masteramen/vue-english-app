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
      <div class="title" ref="title">正文</div>
      </div>
    </div>
    <div class="middle" ref="middle">
      <scroll class="middle-l" ref="lyricList" :data="currentLyric && currentLyric.lines" :pullup="true" @scrollEnd="scrollLyricEnd"   >
        <div class="lyric-wrapper" >
          <p class="cover"><img :src="curArticle.IMG_URL"/></p>
          <p  class="text"><a target="_blank" :href="curArticle.REFERER">{{curArticle.REFERER}}</a></p>
          <div v-if="currentLyric" >
            <p ref="lyricLine"
               class="text"
               :class="{'current': currentLyric.curNum-1 ===index}"
               v-for="(line,index) in currentLyric.lines" v-html="format(line.time/1000)+ '  ' +line.txt" @click="playTime(line.time)"></p>
          </div>
          <div ref="fillScroll" ></div>
        </div>
        <div class="loading-container" v-show="loadingTitle">
          <loading :title="loadingTitle"></loading>
        </div>
      </scroll>

    </div>
    <div class="bottom">
      <div class="dot-wrapper">
        <span class="dot" :class="{'active': currentShow==='lyric'}"></span>
        <span class="dot" :class="{'active': currentShow==='cd'}"></span>
      </div>
      <div class="progress-wrapper">
        <span class="time time-l">{{format(currentTime)}}</span>
        <div class="progress-bar-wrapper">
          <progress-bar :percent="percent" @percentChange="onProgressBarChange"></progress-bar>
        </div>
        <span class="time time-r">{{curArticle.DURATION && format(curArticle.DURATION) || '未知'}}</span>
      </div>
      <div class="operators">
        <div class="icon i-left" @click="changeMode">
          <i :class="iconMode"></i>
        </div>
        <div class="icon i-left" :class="disableCls">
          <i @click="prev" class="icon-prev"></i>
        </div>
        <div class="icon i-center" :class="disableCls">
          <i @click="togglePlaying" :class="playIcon"></i>
        </div>
        <div class="icon i-right" :class="disableCls">
          <i @click="next" class="icon-next"></i>
        </div>
        <div class="icon i-right" :class="lyricFollowCls">
          <i class="icon-book" @click="toggleLyric"></i>
        </div>
      </div>
    </div>
    <div ref="audio" :src="curArticle.AUDIO_URL" :title="curArticle.TITLE" @duration="onDuration" @canplay="ready" @error="error" @timeupdate="updateTime" @ended="end"></div>
    <audio ref="wordAudio" style="display:none;" ></audio>
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
  import {getSilent, createArticle,getDict} from 'common/js/service'
  import {update} from 'common/js/data-manager'
  import Loading from 'base/loading/loading'
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
        loadingTitle: ''
      }
    },
    created() {
      this.touch = {}
    },
    mounted() {
      getSilent()

      this.$nextTick(() => {
        console.log(this.$refs.lyricList.$el)
        touchDir(this.$refs.lyricList.$el, dir => {
          if (!this.playing) {
            return
          }
          let curNum = this.currentLyric.curNum || 0
          if (dir === 'down') {
            console.log('up....')
            curNum = this.currentLineNum - 1
          } else {
            // if(curNum !== this.currentLineNum)
            curNum = this.currentLineNum + 1
          }

          console.log(curNum)
          let elips = +new Date() - (this.currentLyric.startStamp)
          console.log(`elips:${elips}`)

          if (curNum === undefined || curNum < 0 || !this.currentLyric.lines[curNum ]) return
          this.currentLyric.lines[curNum ].time = elips

          for (let i = curNum + 1; i < this.currentLyric.lines.length; i++) {
            this.currentLyric.lines[i].time = 100 * 60 * 1000
          }

          this.currentLyric.play(elips)
        })
        this.$refs.playerWrap.style['width'] = window.innerWidth + 'px'
        player.setAudio(this.$refs.audio)
        let _this = this
        console.log('bind RemoteCommand position')
        RemoteCommand.on('position', function(position) {
          console.log('seek to position:' + position)
          player.seekTo(position)
        })
        document.addEventListener('pause', function(event) {
          _this.enableOrDisableScreenLock(_this.fullScreen)
        })
        document.addEventListener('resume', function(event) {
          _this.enableOrDisableScreenLock(_this.fullScreen)
        })

        document.addEventListener('remote-event', function(event) {
          console.log(event)

          switch (event.remoteEvent.subtype) {
            case 'nextTrack':
              _this.next()
              break
            case 'prevTrack':
              _this.prev()
              break
            case 'pause':
            case 'play':
            case 'playpause':
              console.log('togglePlaying')
              _this.togglePlaying()
              break

          }
        })

        let that = this
        $('.lyric-wrapper').on('click', 'span', function() {
          $(this).toggleClass('mark')
          if ($(this).hasClass('mark')) {
            getDict($(this).text().trim()).then(result=>{
              let html = $(this).html()
              $(this).html(`${html}<b>(${result.result})</b>`)

              that.$refs.wordAudio.src = result.audio
              let playing = that.playing
              if (playing) {
                that.togglePlaying()
              }

              that.$refs.wordAudio.onerror = that.$refs.wordAudio.onended = function() {
                if (playing) {
                  that.togglePlaying()
                }
              }
              that.$refs.wordAudio.play()
            })

          } else {
            $(this).find('b').remove()
          }
        })
      })
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
        'fullScreen',
        'playlist',
        'currentSong',
        'playing',
        'currentIndex',
        'mode'
      ])
    },
    methods: {
      lyricPan(e) {
        console.log(e)
      },
      lyricTouchStart(e) {
        const touch = e.touches[0]
        this.touch.startY = touch.pageY
      },
      lyricTouchEnd(e) {
        const touch = e.touches[0]
        this.touch.direction = touch.pageY - this.touch.startY
        console.log(this.touch.direction)
      },
      scrollLyricEnd(pos) {
        if (!this.playing) {
          return
        }
        let lineNum = (this.currentLyric.curNum || 1) - 1
        let curLine = this.$refs.lyricLine[lineNum]

        if (this.lyricFollow) {
          if ($(curLine).offset().top < $('.middle').offset().top ||
            $(curLine).offset().top + $(curLine).height() > $('.middle').offset().top + $('.middle').height()
          ) {
            this.$refs.lyricList.scrollToElement(curLine, 1000)
          }
        }
      },
      play() {
        player.play(this.curArticle)
      },
      back() {
        this.setFullScreen(false)
        this.$router.back()
      },
      open() {
        this.setFullScreen(true)
      },
      enableOrDisableScreenLock(value) {
        if (value) {
          console.log('keep awake')
          window.plugins.insomnia.keepAwake()
        } else {
          console.log('keep allowSleepAgain')
          window.plugins.insomnia.allowSleepAgain()
        }
      },
      togglePlaying() {
        this.setPlayingState(!this.playing)
      },
      toggleLyric() {
        this.lyricFollow = !this.lyricFollow
      },
      end() {
        if (this.mode === playMode.loop) {
          this.loop()
        } else {
          this.next()
        }
      },
      onDuration(e) {
        this.curArticle.DURATION = e.detail
        console.log(this.curArticle)
        update(this.curArticle)
      },
      loop() {
        this.currentTime = 0
        player.play(null,0)
        if (this.currentLyric) {
          this.currentLyric.seek(0)
        }
      },
      next() {
        if (this.playlist.length === 1) {
          this.loop()
        } else {
          let index = this.currentIndex + 1
          if (index === this.playlist.length) {
            index = 0
          }

          this.setCurrentIndex(index)
        }
      },
      prev() {
        console.log('prev')
        if (this.playlist.length === 1) {
          this.loop()
        } else {
          let index = this.currentIndex - 1
          if (index === -1) {
            index = this.playlist.length - 1
          }
          this.setCurrentIndex(index)
        }
      },
      ready() {
        console.log('ready....')
        this.songReady = true
      },
      error() {
        console.log('error')
        // this.songReady = true
        this.next()
        // this.togglePlaying()
      },
      updateTime(e) {
        this.currentTime = e.target.currentTime
        if (device.platform == 'iOS' && window.remoteControls && this.needUpdateRemoteControl) {
          setTimeout(() => {
            let params = ['artist', this.curArticle.TITLE, 'album', this.curArticle.IMG_URL, this.curArticle.DURATION, this.currentTime]

            window.remoteControls.updateMetas(success => {
              this.needUpdateRemoteControl = false
            }, fail => {
              console.log(fail)
            }, params)
          }, 10)
        }
      },
      format(interval) {
        interval = interval | 0
        const minute = interval / 60 | 0
        const second = this._fullZero(interval % 60)
        return `${minute}:${second}`
      },
      onProgressBarChange(percent) {
        let currentTime = this.curArticle.DURATION * percent
        console.log('currentTime:' + currentTime)
        player.seekTo(currentTime)
        if (this.currentLyric) {
          this.currentLyric.seek(currentTime * 1000)
          if (!this.playing) {
            this.currentLyric.togglePlay()
          }
        }
      },
      playTime(interval) {
        console.log(new Date())
        if(this.clickTimer) {
          player.seekTo(interval / 1000)
          // player.play(this.curArticle.AUDIO_URL, interval / 1000)
          if (this.currentLyric) {
            this.currentLyric.seek(interval)
          }
        }
        else this.clickTimer = setTimeout(() => {
          clearTimeout(this.clickTimer)
          this.clickTimer = false

        }, 400);

      },
      changeMode() {
        const mode = (this.mode + 1) % 3
        this.setPlayMode(mode)
      },
      resetCurrentIndex(list) {
        let index = list.findIndex((item) => {
          return item.id === this.curArticle.id
        })
        this.setCurrentIndex(index)
      },
      getAudio() {
        if (!this.songReady) {
          this.loadingTitle = '正在加载音频'
          let id = this.curArticle.ID
          this.curArticle.getAudio(progressEvt => {
            if (this.curArticle.ID === id) {
              if (progressEvt.lengthComputable) {
                let percent = Math.round((progressEvt.loaded / progressEvt.total) * 100)
                this.loadingTitle = `正在加载音频 ${percent}%`
              }
            }
          }).then(audioUrl => {
            console.log('download audioUrl Success')
            this.songReady = true
            this.loadingTitle = ''
          }).catch(err => {
            console.log(err)
            if(err&&err.desc){
              this.loadingTitle = `加载音频发生错误 :${err.desc}`
            }
            if(!err || err.code!=0){
              setTimeout(_=>{
                this.error()
              },3000)

            }

          })
        }
      },
      getLyric() {
        this.loadingTitle = '正在加载内容'
        let id = this.curArticle.ID
        return this.curArticle.getLyric()
          .then(lyric => {
            if (id !== this.curArticle.ID) return
            if (this.currentLyric) {
              this.currentLyric.stop()
              delete this.currentLyric
            }
            this.loadingTitle = ''
            if (lyric) this.currentLyric = new Lyric(lyric, this.handleLyric)
            console.log('lyric load success')
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
        setFullScreen: 'SET_FULL_SCREEN',
        setPlayingState: 'SET_PLAYING_STATE',
        setCurrentIndex: 'SET_CURRENT_INDEX',
        setPlayMode: 'SET_PLAY_MODE',
        setPlaylist: 'SET_PLAYLIST'
      }),
      ...mapActions([
        'savePlayHistory'
      ])
    },
    watch: {
      currentIndex(newIndex, oldIndex) {
        this.songReady = false
        this.currentTime = 0

        player.pause()
        let currentArticle = window.sequenceList[(this.mode === playMode.random?window.randomList[newIndex]:newIndex)]
        this.curArticle = currentArticle
        this.$refs.lyricList.scrollTo(0, 0)
        this.$nextTick(() => {
          this.$refs.fillScroll.style.height = $(this.$refs.middle).height() - 50 + 'px'
        })
        if (this.currentLyric) {
          // this.currentLyric.seek(0)
          this.currentLyric.stop()
        }

        getSilent().then(url => {
          player.loopplay(url)
        })

        this.getLyric().then(() => {
          if (this.playing) {
            this.loadingTitle = '正在加载音频'
            this.getAudio()
          }
        })
      },
      songReady(value) {
        if (value) {
          if (this.playing) {
            this.curArticle.getAudio().then(url => {
              player.play(url, this.currentTime)
              if (this.currentLyric) this.currentLyric.play(this.currentTime)
            })
          }
        } else {
          player.pause()
          if (this.currentLyric) this.currentLyric.stop()
        }
      },
      playing(newPlaying) {
        if (newPlaying) {
          if (this.songReady) {
            newPlaying ? player.play() : player.pause()
            this.currentLyric.togglePlay()
          } else {
            this.getAudio()
          }
        } else {
          player.pause()
          if (this.currentLyric) this.currentLyric.stop()
        }
      },
      fullScreen(value) {
        this.enableOrDisableScreenLock(value)

      }

    },
    components: {
      ProgressBar,
      ProgressCircle,
      Scroll,
      Loading
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
      .top
        position: relative
        background: $color-background
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
        bottom: 130px
        white-space: nowrap
        font-size: 0
        .middle-r
          display: inline-block
          vertical-align: top
          position: relative
          width: 100%
          height: 0
          padding-top: 80%
          .cd-wrapper
            position: absolute
            left: 10%
            top: 0
            width: 80%
            height: 100%
            .cd
              width: 100%
              height: 100%
              box-sizing: border-box
              border: 10px solid rgba(255, 255, 255, 0.1)
              border-radius: 50%
              &.play
                animation: rotate 20s linear infinite
              &.pause
                animation-play-state: paused
              .image
                position: absolute
                left: 0
                top: 0
                width: 100%
                height: 100%
                border-radius: 50%

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
          .loading-container
            position: absolute
            width: 100%
            top: 50%
            transform: translateY(-50%)
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
