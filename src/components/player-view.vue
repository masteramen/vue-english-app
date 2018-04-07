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
        <admin-menu v-if="config.isDebug>10"></admin-menu>
      </div>
    </div>
    <div class="middle" ref="middle">
      <scroll class="middle-l" ref="lyricList" :data="currentLyric && currentLyric.lines" :pullup="true"   >
        <div class="lyric-wrapper" >
<!--
          <p class="cover"><img v-if="curArticle.IMG_URL" v-lazy="curArticle.IMG_URL" style="max-width:100%;margin-left:50%;transform: translateX(-50%);"/></p>
-->
          <p class="text">{{curArticle.TITLE}}</p>
          <p class="text">{{curArticle.TITLE_CN}}</p>
          <div v-if="currentLyric" >
            <div  v-for="(line,index) in currentLyric.lines" >
              <p ref="lyricLine"
                 :id="'line'+index"
                 class="text"
                 :class="{'current': currentLyric.curNum-1 ===index}"
                 v-html="format(line.time/1000)+ '  ' +line.txt" @click="playTime(line.time)">
              </p>
              <lazy-component @show="handlerTS(index,line)" class="text" v-if="LRC" >
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
    <div class="bottom">
      <div class="dot-wrapper">
        <span class="dot" :class="{'active': currentShow==='lyric'}"></span>
        <span class="dot" :class="{'active': currentShow==='cd'}"></span>
      </div>
      <div class="progress-wrapper" @touchmove.prevent.stop="$event.preventDefault()" @touchstart.prevent.stop="$event.preventDefault()"  @touchend.prevent.stop="$event.preventDefault()">
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
        <div class="icon i-center" :class="{disable:disableCls}">
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
    <div ref="audio" :src="curArticle.AUDIO_URL" :title="curArticle.TITLE" @duration="onDuration" @error="error" @timeupdate="updateTime" @ended="end"></div>
    <audio ref="wordAudio" style="display:none;" ></audio>
  </div>
  </div>
</template>


<script type="text/ecmascript-6">
  import {mapGetters, mapMutations, mapActions} from 'vuex'

  import ProgressBar from 'base/progress-bar/progress-bar'
  import ProgressCircle from 'base/progress-circle/progress-circle'
  import {playMode} from 'common/js/config'
  import Lyric from 'common/js/lyric-parser'
  import Scroll from 'base/scroll2/scroll'
  import player from 'common/js/player'
  import touchDir from 'common/js/touch-dir'
  import {createArticle, getDict, configProvider, saveArticleToRemote, getDictListBy} from 'common/js/service'
  import Loading from 'base/loading/loading'
  import AdminMenu from './m-header/admin-menu'

  import Bus from 'common/js/bus'

  export default {
    data() {
      return {
        config: configProvider.getConfig(),
        curArticle: createArticle({}),
        status: 0,
        currentTime: 0,
        duration: 0,
        radius: 32,
        currentLyric: null,
        currentLineNum: 0,
        currentShow: 'lyric',
        playingLyric: '',
        audioUrl: '',
        lyricFollow: false,
        lastSwipeTime: '',
        showLoading: true,
        loadingTitle: '',
        LRC: false,
        AUDIO_URL: false,
        trlines: [],
        lines: []
      }
    },
    created() {
      this.touch = {}
      Bus.$on('saveRemote', target => {
        (async () => {
          saveArticleToRemote(this.curArticle, this.currentLyric, this.lines)
          alert('save success')
        })()
      })

/*      document.addEventListener('resume', this.onFront, false)
      document.addEventListener('pause', this.onBackGround, false) */
    },
    mounted() {
      this.$nextTick(() => {
        touchDir(this.$refs.lyricList.$el, dir => {
          if (this.editMode) {
            if (!this.playing) {
              return
            }
            let curNum = this.currentLyric.curNum || 0
            if (dir === 'down') {
              curNum = this.currentLineNum - 1
            } else {
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
          }
        })
      })

      this.$nextTick(() => {
        this.$refs.playerWrap.style['width'] = window.innerWidth + 'px'
        player.setAudio(this.$refs.audio)
        let _this = this
        console.log('bind RemoteCommand position')

        RemoteCommand.on('position', function(position) {
          console.log('seek to position:' + position)
          player.seekTo(position)
        })
/*        document.addEventListener('pause', function(event) {
          _this.enableOrDisableScreenLock(_this.fullScreen)
        })
        document.addEventListener('resume', function(event) {
          _this.enableOrDisableScreenLock(_this.fullScreen)
        }) */

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
        $(this.$refs.lyricList.$el).on('click', 'span', function() {
          if (!$(this).data('mark')) {
            $(this).addClass('mark')
            $(this).data('mark', true)
            $(this).find('b').remove()
            getDict($(this).text().trim().toLowerCase()).then(result => {
              let html = $(this).html().trim()

              $(this).html(`${html}<b>(${result.result})</b>`)

              // alert(result.audio)
              // that.$refs.wordAudio.src = result.audio
              let playing = that.playing
              if (playing) {
                that.togglePlaying()
              }

              let onerror = () => {
                if (playing) {
                  that.togglePlaying()
                }
                $(this).data('mark', false)
              }
              player.tmpPlay(result.audio, onerror, onerror)
              // that.$refs.wordAudio.play()
            })
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
        return !this.curArticle.AUDIO_URL
      },
      lyricFollowCls() {
        return this.lyricFollow ? '' : 'not-lyricFollow'
      },
      percent() {
        let percent = this.currentTime / this.curArticle.DURATION
        if (percent === +percent) {
          Bus.$emit('percent', percent)
          return percent
        }
        return 0
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
        'mode',
        'editMode',
        'subscriptionList'
      ])
    },
    methods: {
      onBackGround() {
        this.frontEnd = false
      },
      onFront() {
        this.frontEnd = true
      },
      handlerTS (index, line) {
        this.curArticle.translate(this.lines, index).then(result => {
          this.trlines.splice(index, 1, result)
          this.$refs.lyricList.refresh()
          var arr = this.lines[index].toLowerCase().match(/[a-z-]+/g).sort()
          var unArr = arr.filter((e, i) => arr.indexOf(e) === i)
          console.log(`unArr:${unArr}`)
          $(`#line${index} span`, this.$refs.lyricList.$el).each(function () {
            $(this).attr('value', $(this).text().toLowerCase())
          })
          getDictListBy(unArr).then(contents => {
            console.log(`contents:${contents}`)
            if (contents.length) {
              contents.forEach(d => {
                $(`#line${index} span[value=${d.QTEXT}]`, this.$refs.lyricList.$el).each(function () {
                  $(this).html(`${$(this).text()}<b>(${d.RESULT})</b>`).addClass('mark')
                })
              })
            }
          })
        })
      },
      back() {
        this.setFullScreen(false)
        this.$router.back()
      },
      open() {
        this.setFullScreen(true)
      },
      togglePlaying() {
        if (this.disableCls) return
        this.setPlayingState(!this.playing)
      },
      toggleLyric() {
        this.lyricFollow = !this.lyricFollow
      },
      end() {
        if (!this.editMode) {
          if (this.mode === playMode.loop) {
            this.loop()
          } else {
            this.next()
          }
        } else {
          this.togglePlaying()
        }
      },
      onDuration(e) {
        if (!this.curArticle.DURATION) {
          this.curArticle.DURATION = e.detail
          if (this.curArticle.LRC_OK === '3') {
            this.getLyric()
          }
          this.curArticle.save()
        }
      },
      loop() {
        this.currentTime = 0
        player.play(null, 0)
        if (this.currentLyric) {
          this.currentLyric.seek(0)
        }
      },
      next() {
        if (this.playlist.length === 1) {
          this.loop()
        } else {
          let index = this.currentIndex + 1
          if (index === window.sequenceList.length) {
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
            index = window.sequenceList.length - 1
          }
          this.setCurrentIndex(index)
        }
      },
      error() {
        console.log('error')
        this.next()
      },
      updateTime(e) {
        this.currentTime = e.target.currentTime
        if (device.platform === 'iOS' && window.remoteControls && !this.updatedRomte) {
          setTimeout(() => {
            let params = ['学英语听新闻', this.curArticle.TITLE, '', this.icon, this.curArticle.DURATION, this.currentTime]
            this.updatedRomte = true
            window.remoteControls.updateMetas(success => {
              this.updatedRomte = true
            }, fail => {
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
        if (this.clickTimer) {
          player.seekTo(interval / 1000)
          // player.play(this.curArticle.AUDIO_URL, interval / 1000)
          if (this.currentLyric) {
            this.currentLyric.seek(interval)
          }
        } else {
          this.clickTimer = setTimeout(() => {
            clearTimeout(this.clickTimer)
            this.clickTimer = false
          }, 400)
        }
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
        if (this.AUDIO_URL) return this.AUDIO_URL
        return (async () => {
          try {
            this.loadingTitle = '正在加载音频'
            let id = this.curArticle.ID
            let audioUrl = await this.curArticle.getAudio(progressEvt => {
              if (this.curArticle.ID === id) {
                if (progressEvt.lengthComputable) {
                  let percent = Math.round((progressEvt.loaded / progressEvt.total) * 100)
                  this.loadingTitle = `正在加载音频 ${percent}%`
                }
              }
            })
            this.loadingTitle = ''
            this.AUDIO_URL = audioUrl
            return audioUrl
          } catch (err) {
            console.log(err)
            if (err && err.desc) {
              this.loadingTitle = `加载音频发生错误 :${err.desc}`
            }
            throw err
          }
        })()
      },
      getLyric: function () {
        if (this.LRC && this.curArticle.LRC_OK === '2') return
        return (async () => {
          alert(this.LRC)
          alert(this.curArticle.LRC_OK)
          this.loadingTitle = '正在加载内容'
          let id = this.curArticle.ID
          let {lines, lyric} = await this.curArticle.getLyric()
          if (id !== this.curArticle.ID) return
          this.lines = lines
          this.trlines = [...Array(lines.length)].map((_, i) => false)
          this.LRC = true

          if (this.currentLyric) {
            this.currentLyric.stop()
            delete this.currentLyric
          }
          this.loadingTitle = ''
          if (lyric) {
            this.currentLyric = new Lyric(lyric, this.handleLyric)
            if(this.playing){
              this.currentLyric.togglePlay()
            }
          }
          console.log(lyric)
          console.log(this.currentLyric)

        })()
      },
      handleLyric({ lineNum, txt }) {
        console.log(txt)
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
      ...mapMutations({
        setFullScreen: 'SET_FULL_SCREEN',
        setPlayingState: 'SET_PLAYING_STATE',
        setCurrentIndex: 'SET_CURRENT_INDEX',
        setPlayMode: 'SET_PLAY_MODE',
        setPlaylist: 'SET_PLAYLIST',
        setEditMode: 'SET_EDIT_MODE'
      }),
      ...mapActions([
        'savePlayHistory'
      ])
    },
    watch: {
      currentIndex(newIndex, oldIndex) {
        let currentArticle = window.sequenceList[(this.mode === playMode.random ? window.randomList[newIndex] : newIndex)]
        if (newIndex === 0) { if (!currentArticle || !currentArticle.isAudio()) return }

        this.LRC = false
        this.AUDIO_URL = false
        this.currentTime = 0
        player.pause()
        if (this.currentLyric) this.currentLyric.stop()
        this.currentLyric = null
        this.curArticle = currentArticle
        Bus.$emit('play', currentArticle)
        this.lyricFollow = this.curArticle.LRC_OK == '1'
        this.$refs.lyricList.scrollTo(0, 0)
        this.icon = this.curArticle.IMG_URL || decodeURIComponent(cordova.file.applicationDirectory + 'www/no-image.png')
        player.loopplay('silent.mp3');
        (async () => {
          try {
            await this.getLyric()
            if (this.playing) {
              this.loadingTitle = '正在加载音频'
              let audioUrl = await this.getAudio()
              if (this.playing) {
                player.play(audioUrl)
                if (this.currentLyric) this.currentLyric.togglePlay()
              }
            } else player.pause()
          } catch (e) {
            console.log(e)
            this.next()
          }
        })()
      },
      playing(newPlaying) {
        if (newPlaying) {
          player.loopplay('silent.mp3');
          (async () => {
            await this.getLyric()
            let audioUrl = await this.getAudio()
            console.log(`play audio:${audioUrl}`)
            if (this.playing) {
              player.play(audioUrl, this.currentTime)
              this.currentLyric.togglePlay()
              this.updatedRomte = false
            }
          })()
        } else {
          player.pause()
          if (this.currentLyric) this.currentLyric.togglePlay()
        }
      },
      fullScreen(value) {
        if (this.currentIndex < 0) {
          let index = window.sequenceList.findIndex((item) => {
            return item.isAudio()
          })
          this.setCurrentIndex(index)
        }
        console.log(`this.currentIndex:${this.currentIndex}`)
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
  .mark::before{

  }
  .mark::after{

  }
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
        bottom: 130px
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
