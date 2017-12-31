<template>
  <div class="player" >
    <transition name="normal"
                @enter="enter"
                @after-enter="afterEnter"
                @leave="leave"
                @after-leave="afterLeave"
    >
      <div class="normal-player" v-show="fullScreen"  ref="playerWrap"
      v-swipeleft = "swiper"    
      v-panright = "swiper"    
      v-panleft = "swiper"    
      v-swiperight = "swiper"  
      v-panend="swiper"
      >
        <div class="background">
          <img width="100%" height="100%" :src="currentSong.image">
        </div>
        <div class="top">
          <div class="back" @click="back">
            <i class="icon-back"></i>
          </div>
          <div class="title">正文</div>
        </div>
        <div class="middle"
              ref="middle"
        >
        <scroll class="middle-l" ref="lyricList" :data="currentLyric && currentLyric.lines">
          <div class="lyric-wrapper">
            <div v-if="currentLyric">
              <p ref="lyricLine"
                 class="text"
                 :class="{'current': currentLineNum ===index}"
                 v-for="(line,index) in currentLyric.lines" v-html="line.txt"></p>
            </div>
          </div>
        </scroll>
        
          <div class="middle-r" ref="middleR">
            <div class="cd-wrapper" ref="cdWrapper">
              <div class="cd" :class="cdCls">
                <img class="image" :src="currentSong.image">
              </div>
            </div>
            <div class="playing-lyric-wrapper">
              <div class="playing-lyric" v-html="playingLyric"></div>
            </div>
          </div>


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
            <span class="time time-r">{{format(duration)}}</span>
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
      </div>
     </transition>
     <transition name="mini">
        <div class="mini-player" v-show="!fullScreen" >

        <router-link to="/articles" class="items">
          <span class="icon-home"></span>
          <p class="text">新闻</p>
        </router-link>
        <router-link to="/select" class="items">
          <span class="icon-book"></span>
          <p class="text">生词</p>
        </router-link>
        <div class="icon itmes" @click="open">
          <img :class="cdCls" width="40" height="40" :src="currentSong.image">
        </div>
        <router-link to="/rank" class="items">
          <span class="icon-class"></span>
          <p class="text">分类</p>
        </router-link>
        <router-link to="/settings" class="items"  ref="link">
          <span class="icon-user"></span>
          <p class="text">设置</p>
        </router-link>

          <div class="text" v-show="false">
            <div class="name"  v-html="currentSong.name"></div>
            <div class="desc"  v-html="currentSong.singer"></div>
          </div>
          <div class="control" v-show="false">
           <progress-circle :radius="radius" :percent="percent">
             <i @click.stop="togglePlaying" class="icon-mini" :class="miniIcon"></i>
           </progress-circle>
          </div>
          <div class="control" v-show="false">
            <div class="icon-playlist"></div>
          </div>
        </div>
      </transition>
      <div ref="audio" :src="currentSong.url" :title="currentSong.title" @duration="onDuration" @canplay="ready" @error="error" @timeupdate="updateTime" @ended="end"></div>
      <audio ref="wordAudio" style="display:none;" ></audio>
  </div>
    
</template>

<script type="text/ecmascript-6">
  import {mapGetters, mapMutations, mapActions} from 'vuex'
  import animations from 'create-keyframe-animation'
  import {prefixStyle} from 'common/js/dom'
  import Bus from 'common/js/bus'
  import ProgressBar from 'base/progress-bar/progress-bar'
  import ProgressCircle from 'base/progress-circle/progress-circle'
  import {playMode} from 'common/js/config'
  import {shuffle} from 'common/js/util'
  import Lyric from 'lyric-parser'
  import Scroll from 'base/scroll/scroll'
  import  player from 'common/js/player'
  import {downloadArtile} from 'common/js/service'
  import * as ts from 'common/js/translation'



  const transform = prefixStyle('transform')
  const transitionDuration = prefixStyle('transitionDuration')
  const ransitionDurationValue=200


  export default {
  data() {
    return {
      songReady: false,
      currentTime: 0,
      duration: 1,
      radius: 32,
      currentLyric: null,
      currentLineNum: 0,
      currentShow: 'lyric',
      playingLyric: '',
      audioUrl:'',
      lyricFollow:true,
      needUpdateRemoteControl:true,
      lastSwipeTime:''
    }
  },
  created() {
    this.touch = {}

  },
  mounted() {
    this.$nextTick(() => {

      this.$refs.playerWrap.style['width']=window.innerWidth+'px'
      player.setAudio(this.$refs.audio)
      let _this = this
      console.log('bind RemoteCommand position');
    RemoteCommand.on('position',function(position){
      console.log('seek to position:'+position);
      player.seekTo(position)

    })
      document.addEventListener("pause", function(event) {
        _this.enableOrDisableScreenLock(_this.fullScreen)

      })
      document.addEventListener("resume", function(event) {
        _this.enableOrDisableScreenLock(_this.fullScreen)
      })

      document.addEventListener("remote-event", function(event) {

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
                console.log('togglePlaying')
                _this.togglePlaying()
                break

            }

      })



      let that=this
      $('.lyric-wrapper').on('click','span',function(){
        $(this).toggleClass("mark")
        if($(this).hasClass('mark')){
          console.log('translateWithAudio');
          ts.translateWithAudio($(this).text().trim()).then(result=>{
            let html=$(this).html();
            $(this).html(`${html}<b>(${result.zh_CN})</b>`)

            that.$refs.wordAudio.src=result.audio
            let playing=that.playing
            if(playing){
              that.togglePlaying()
            }

            that.$refs.wordAudio.onerror=that.$refs.wordAudio.onended=function(){
              if(playing){
                that.togglePlaying()
              }
            }
            that.$refs.wordAudio.play()
          })
        }else{
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
      return this.songReady ? '' : 'disable'
    },
    lyricFollowCls(){
      return this.lyricFollow?'':'not-lyricFollow'
    },
    percent() {
      return this.currentTime / this.duration
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
      'sequenceList'
    ])
  },
  methods: {
    play() {
      player.play(this.currentSong)

    },
    back() {
      this.setFullScreen(false)

    },
    open() {
      this.setFullScreen(true)

    },
    enableOrDisableScreenLock(value){
        if (value) {
          console.log('keep awake');
          window.plugins.insomnia.keepAwake()

        } else {
          console.log('keep allowSleepAgain');
          window.plugins.insomnia.allowSleepAgain()

        }
    },
    enter(el, done) {
      const { x, y, scale } = this._getPosAndScale()
      
      let animation = {
        0: {
          transform: `translate3d(${x}px,${y}px,0) scale(${scale})`
        },
        60: {
          transform: `translate3d(0,0,0) scale(1.1)`
        },
        100: {
          transform: `translate3d(0,0,0) scale(1)`
        }
      }

      animations.registerAnimation({
        name: 'move',
        animation,
        presets: {
          duration: 400,
          easing: 'linear'
        }
      })

      animations.runAnimation(this.$refs.cdWrapper, 'move', done)
    },
    afterEnter() {
      animations.unregisterAnimation('move')
      this.$refs.cdWrapper.style.animation = ''
    },
    leave(el, done) {
      this.$refs.cdWrapper.style.transition = 'all 0.4s'
      const { x, y, scale } = this._getPosAndScale()
      this.$refs.cdWrapper.style[transform] = `translate3d(${x}px,${y}px,0) scale(${scale})`
      this.$refs.cdWrapper.addEventListener('transitionend', done)
    },
    afterLeave() {
      this.$refs.cdWrapper.style.transition = ''
      this.$refs.cdWrapper.style[transform] = ''
    },
    togglePlaying() {
      console.log('togglePlaying');
      if (!this.songReady) {
        return
      }
      this.setPlayingState(!this.playing)
      if (this.currentLyric) {
        this.currentLyric.togglePlay()
      }
    },
    toggleLyric(){

      this.lyricFollow=!this.lyricFollow

    },
    end() {
      if (this.mode === playMode.loop) {
        this.loop()
      } else {
        this.next()
      }
    },
    onDuration(e) {
      this.duration = e.detail
    },
    loop() {
      player.seekTo(0).play()
      if (this.currentLyric) {
        this.currentLyric.seek(0)
      }
    },
    next() {
      if (!this.songReady) {
        return
      }

      this.currentTime = 0

      if (this.playlist.length === 1) {
        this.loop()
      } else {
        let index = this.currentIndex + 1
        if (index === this.playlist.length) {
          index = 0
        }
        this.setCurrentIndex(index)

      }
      this.songReady = false
    },
    prev() {
      if (!this.songReady) {
        return
      }
      this.currentTime = 0
      if (this.playlist.length === 1) {
        this.loop()
      } else {
        let index = this.currentIndex - 1
        if (index === -1) {
          index = this.playlist.length - 1
        }
        this.setCurrentIndex(index)
      }
      this.songReady = false
    },
    ready() {
      this.songReady = true


    },
    error() {
      console.log('error')
      // this.songReady = true   
      //this.next()
      this.togglePlaying()
    },
    updateTime(e) {
      this.currentTime = e.target.currentTime
      if (device.platform == 'iOS'  && window.remoteControls  &&this.needUpdateRemoteControl) {
        setTimeout(() => {

          let params = ['artist', this.currentSong.title, 'album', this.currentSong.picUrl, this.duration, this.currentTime];

          window.remoteControls.updateMetas(success => {
            this.needUpdateRemoteControl = false
          }, fail => {
            console.log(fail);
          }, params);


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
      let currentTime = this.duration * percent
      console.log('currentTime:' + currentTime)
      player.seekTo(currentTime)

      if (!this.playing) {
        this.togglePlaying()
      }
      if (this.currentLyric) {
        this.currentLyric.seek(currentTime * 1000)
      }

    },

    changeMode() {
      const mode = (this.mode + 1) % 3
      this.setPlayMode(mode)

      let list = null
      if (mode === playMode.random) {
        list = shuffle(this.sequenceList)
      } else {
        list = this.sequenceList
      }
      this.resetCurrentIndex(list)
      this.setPlaylist(list)
    },
    resetCurrentIndex(list) {
      let index = list.findIndex((item) => {
        return item.id === this.currentSong.id
      })
      this.setCurrentIndex(index)
    },
    getLyric() {
      if (this.currentLyric) {
        this.currentLyric.stop()
      }
      this.currentSong.getLyric()
        .then(lyric => {
          console.log(lyric);
          this.currentLyric = new Lyric(lyric, this.handleLyric)
          if (this.playing) {
            this.currentLyric.play()
          }
        })
        .catch(() => {
          this.currentLyric = null
          this.playingLyric = ''
          this.currentLineNum = 0
        })
    },
    handleLyric({ lineNum, txt }) {


      this.$nextTick(() => {
        this.currentLineNum = lineNum
        if (!this.$refs.lyricList.scrollToElement) return
        let curLine = this.$refs.lyricLine[lineNum]
        if(this.lyricFollow){
          if ($(curLine).offset().top < $('.middle').offset().top || $(curLine).offset().top + $(curLine).height() > $('.middle').offset().top + $('.middle').height()) {
            this.$refs.lyricList.scrollToElement(curLine, 1000)
          }
        }

        this.playingLyric = txt
      })


    },
    swiper(s,e){

      this.$refs.playerWrap.style['width']=window.innerWidth+'px'
      //this.$refs.playerWrap.style['left']=s.deltaX+'px'
      let playWrapLeft=0

      if(s.type=='swiperight'){

        this.lastSwipeTime = new Date().getTime()
        this.$refs.playerWrap.style[transitionDuration] = ((window.innerWidth-s.deltaX)/window.innerWidth*ransitionDurationValue/2)+'ms';
        this.$refs.playerWrap.style['left']=(window.innerWidth+s.deltaX/s.deltaTime)+'px';
        setTimeout(()=>{
          this.back()
        },ransitionDurationValue);
        
               
      }else if(s.type=='panend'){

        //fixed swipe event before panend event
        if(new Date().getTime()-this.lastSwipeTime<ransitionDurationValue){
         return
        }
        if(s.deltaX>window.innerWidth/3){
          this.back()
        }else{
          this.$refs.playerWrap.style[transitionDuration] = s.deltaX/window.innerWidth*ransitionDurationValue+'ms'
          this.$refs.playerWrap.style['left']='0px'       
        }


      }else if( (s.type=='panright'||s.type=='panleft') && Math.abs(s.deltaX)>Math.abs(s.deltaY)){

        console.log(s.deltaTime);
        this.$refs.playerWrap.style[transitionDuration] = `0ms`
       
        this.$refs.playerWrap.style['left']=(s.deltaX+s.deltaX/s.deltaTime)+'px'

      }

    },
    playWrapTouchStart(e){
     this.middleTouchStart(e);

    },
    playWrapTouchMove(e){
     this.middleTouchMove(e);
    },
    playWrapTouchEnd(e){
     this.middleTouchEnd(e);

    },
    middleTouchStart(e) {
      this.touch.initiated = true
      const touch = e.touches[0]
      this.touch.startX = touch.pageX
      this.touch.startY = touch.pageY
      this.$refs.playerWrap.style['width']=window.innerWidth+'px'

    },
    middleTouchMove2(e) {
      /*
      if (!this.touch.initiated) {
        return
      }
      const touch = e.touches[0]
      const deltaX = touch.pageX - this.touch.startX
      const deltaY = touch.pageY - this.touch.startY
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return
      }
      const left = this.currentShow === 'lyric' ? 0 : -window.innerWidth

      if(this.currentShow === 'lyric' && deltaX >0 ){
        this.$refs.playerWrap.style['left']=deltaX+'px'
        //this.$refs.middle.style['left']=deltaX+'px'
        return
      }

      const offsetWidth = Math.min(0, Math.max(-window.innerWidth, left + deltaX))
      this.touch.percent = Math.abs(offsetWidth / window.innerWidth)

      requestAnimationFrame(()=>{
        this.$refs.middleR.style[transform] = `translate3d(${offsetWidth}px,0,0)`
        this.$refs.middleR.style[transitionDuration] = 0

        this.$refs.lyricList.$el.style['opacity'] = 1 - this.touch.percent
        this.$refs.lyricList.$el.style[transitionDuration] = 0
      })
*/
    },
    middleTouchEnd2(e) {
      /*
      let offsetWidth
      let opacity
      console.log(this.$refs.playerWrap.style.left);
      let playWrapLeft=parseInt(this.$refs.playerWrap.style.left);
      if(playWrapLeft>0){

        if(playWrapLeft>window.innerWidth/3){
            playWrapLeft=window.innerWidth


        }else{
          playWrapLeft=0
        }

        this.$refs.playerWrap.style[transitionDuration] = `500ms`
        this.$refs.playerWrap.style['left']=playWrapLeft+'px'
        //this.$refs.middle.style['left']=playWrapLeft+'px'
        setTimeout(()=>{
          if(parseInt(this.$refs.playerWrap.style.left)>0){
            this.setFullScreen(false)
          }
          this.$refs.playerWrap.style[transitionDuration] = `0ms`

        },100)

        e.preventDefault();
        return
      }
      if (this.touch.percent > 0.3) {

        if (this.currentShow === 'cd') {

          this.currentShow = 'lyric'

        }else{
          this.currentShow = 'cd'
        }

      }


      if(this.currentShow=='lyric'){
        offsetWidth = 0
        opacity = 1
      }else if(this.currentShow=='cd'){
        offsetWidth = -window.innerWidth
        opacity = 0
      }

      console.log(`${this.currentShow} ${this.touch.percent}  ${offsetWidth}`);

      this.touch.percent=0
      const time = 300
      this.$nextTick(() => {
        this.$refs.middleR.style[transform] = `translate3d(${offsetWidth}px,0,0)`
        this.$refs.middleR.style[transitionDuration] = `${time}ms`
        this.$refs.lyricList.$el.style.opacity = opacity
        this.$refs.lyricList.$el.style[transitionDuration] = `${time}ms`


      })

      this.touch.initiated = false
      */
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
    currentSong(newSong, oldSong) {
      if (oldSong && newSong.id === oldSong.id) {
        return
      }
      if (this.currentLyric) {
        this.currentLyric.stop()
        this.currentLyric=null
        }

      
      downloadArtile(newSong,
        evt => { console.log(evt) },
        lrc => {
          this.getLyric()
        }
      ).catch(() => {}).then(() => {
          this.getLyric()

        if(this.playing){
          //this.togglePlaying()
          this.play()
        }
        this.ready()

      })
      Bus.$emit('selected', newSong.id);

    },
    playing(newPlaying) {
      this.$nextTick(() => {
        //newPlaying?this.$refs.audio.play():this.$refs.audio.pause()
        newPlaying ? player.play(this.currentSong) : player.pause()

      })
    },
    fullScreen(value) {
      this.enableOrDisableScreenLock(value)
      this.$refs.playerWrap.style[transitionDuration] = ransitionDurationValue+'ms'
      this.$refs.playerWrap.style['left']=window.innerWidth+'px'
      let left = 0
      if(!value){
        left = window.innerWidth
      }

      requestAnimationFrame(()=>{

        this.$refs.playerWrap.style['left']=left+'px'

      })


    }
  },
  components: {
    ProgressBar,
    ProgressCircle,
    Scroll
  }
}

</script>
<style>
.mark{color:red}
</style>
<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .player
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
        bottom: 160px
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
          .lyric-wrapper
           
            margin: 0 20px
            overflow: hidden
            text-align: left
            .text
              .mark
                font-weight:bold
                color:red
              line-height: 52px
              color: $color-text-l
              font-size: $font-size-medium
              white-space: normal
              &.current
                color: $color-text


      .bottom
        position: absolute
        bottom: 50px
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
        padding: 0 10px 0 20px
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