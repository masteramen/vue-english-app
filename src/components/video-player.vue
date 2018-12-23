<template>
  <div class="video-player" v-if="reseted" style="
    height: 150px;
    background: #000;
    position: relative;
"
       :style="'background-image:url('+item.thumb+')'"
  >
<!--    <video id="preview-player" class="video-js vjs-big-play-centered" ref="video">
      <track src="http://192.168.1.126/rss/test.vtt" srclang="en" label="English" kind="caption" default>
    </video>-->
<!--    <video id="example_video_1" class="video-js vjs-default-skin" controls preload="none" width="640" height="264" poster="http://vjs.zencdn.net/v/oceans.png" data-setup="{plugins: { airplayButton: {} }}">
      <source src="http://api.frdic.com/api/v3/media/mp3/501fe7f1-54f1-11e8-b509-9b8cbe101d82?type=mp4&filename=501fe7f1-54f1-11e8-b509-9b8cbe101d82.mp4" type="video/mp4">
      <source src="http://vjs.zencdn.net/v/oceans.webm" type="video/webm">
      <source src="http://vjs.zencdn.net/v/oceans.ogv" type="video/ogg">
      <track kind="captions" src="http://192.168.1.126/rss/example-captions.vtt" srclang="en" label="English"></track>
      &lt;!&ndash; Tracks need an ending tag thanks to IE9 &ndash;&gt;
      <track kind="subtitles" src="http://192.168.1.126/rss/example-captions.vtt" srclang="en" label="English"></track>
      &lt;!&ndash; Tracks need an ending tag thanks to IE9 &ndash;&gt;
      <p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a></p>
    </video>-->
    <span style="
    color: white;
    position: absolute;
    top: 50%;
    left: 50%;
    font-size:60px;
    transform: translate(-50%, -50%);
" :class='{"icon-pause":playing,"icon-play":!playing}' @touchstart="togglePlay" ></span>
  </div>
</template>

<script>

  // export
  export default {
    name: 'video-player',
    props: {
      item: {
        type: Object,
        required: true
      }

    },
    data() {
      return {
        reseted: true,
        playing: false
      }
    },
    mounted() {

    },
    beforeDestroy() {

    },
    methods: {
      initialize() {
      // videojs options

      },
      done(p) {

        this.playing = false
        this.$emit('playEvent', 'done')
      },
      togglePlay() {
        console.log('play...')
          this.playing = !this.playing
          console.log('play this.playing:' + this.playing)
          this.play()

      },
      play() {
        if (this.playing == false) return
        console.log(this.item)
        let item = this.item
        console.log('play+this.playing:' + this.playing)
        this.$emit('playEvent', 'play')

        window.plugins.streamingMedia.playVideo(item.audio, {shouldAutoClose: false, successCallback: this.done, errorCallback: this.done})

        setTimeout( ()=> {
          item.getSrt().then(srt => {
            console.log('srt:' + srt)
            window.plugins.streamingMedia.addSrt(item.audio, {srt: srt, shouldAutoClose: false, successCallback: this.done, errorCallback: this.done})
          }).catch(e=>{
            console.log(e)
          })
        },1000);

      }
    },
    watch: {

/*
      item: {
        deep: true,
        handler(item, oldItem) {
          console.log('playing...' + this.playing)
          if (item.ID != oldItem.ID) {
            this.play()
          }
        }
      }
      */
    }
  }
</script>
<style>
  .vjs-paused .vjs-big-play-button,
  .vjs-paused.vjs-has-started .vjs-big-play-button {
    display: block;
  }
  .video-js .vjs-big-play-button{
    font-size: 2.5em;
    line-height: 2.3em;
    height: 2.5em;
    width: 2.5em;
    -webkit-border-radius: 2.5em;
    -moz-border-radius: 2.5em;
    border-radius: 2.5em;
    background-color: #73859f;
    background-color: rgba(115,133,159,.5);
    border-width: 0.15em;
    margin-top: -1.25em;
    margin-left: -1.75em;
  }
  /* 中间的播放箭头 */
  .vjs-big-play-button .vjs-icon-placeholder {
    font-size: 1.63em;
  }
  /* 加载圆圈 */
  .vjs-loading-spinner {
    font-size: 2.5em;
    width: 2em;
    height: 2em;
    border-radius: 1em;
    margin-top: -1em;
    margin-left: -1.5em;
  }
  .video-js.vjs-playing .vjs-tech {
    pointer-events: auto;
  }
</style>
