class Player {

  setAudio(audio) {
    this.audio = audio
  }

  seekTo(position) {
    console.log('seekTo:' + position)
    if (this.my_media) this.my_media.seekTo(position * 1000)
    return this
  }

  tmpPlay(url, onerror, onended) {
    let tmpmedia = new Media(url,
      () => {
        console.log('play :' + url)
      },
      err => {
        console.log(err)
        onerror && onerror()
      },
      mediaStatus => {
        console.log(`mediaStatus:${mediaStatus}`)
        if (mediaStatus == Media.MEDIA_STOPPED) {
          onended && onended()
          tmpmedia.release()
        }
      }
    )
    tmpmedia.play()
  }
  bgMode() {
    if(this.bg_silent!=null){
      this.bg_silent.play({numberOfLoops: new Date().getTime(), playAudioWhenScreenIsLocked: true});
      return
    }
    this.bg_silent = new Media(cordova.file.applicationDirectory + 'www/silent.mp3',
      () => {
      },
      err => {
        console.log(err)
      },
      mediaStatus => {
        console.log(`mediaStatus:${mediaStatus}`)
      }
    )
    this.bg_silent.play({numberOfLoops: new Date().getTime(), playAudioWhenScreenIsLocked: true})
    console.log('play silent model.....')
  }

  play(newAudioUrl, position) {
    if (newAudioUrl && this.audioUrl !== newAudioUrl) {
      this.audioUrl = newAudioUrl
      let url = this.audioUrl

      if (this.my_media) {
       // if (this.status != Media.MEDIA_STOPPED) {
        this.my_media.pause()
        // }
        this.my_media.release()
        delete this.my_media
      }
      //this.bgMode();
      this.my_media = new Media(url,
        () => {
          console.log('playAudio():Audio Success')
          if (this.timer) clearInterval(this.timer)
          this.audio.dispatchEvent(new Event('ended'))

          // this.my_media.getCurrentPosition(
          //   position => {
          //    console.log(`position:${position} && this.my_media.getDuration():${this.my_media.getDuration()}`)
          //   },
          //   function (e) {
          //     console.log('Error getting pos=' + e)
          //   }
          // )
        },
        err => {
          this.audio.dispatchEvent(new Event('error'))
          console.log('playAudio():Audio Error: ' + err.code)
          console.log('playAudio():Audio Error: ' + err.message)
          console.log(err)
        },
        mediaStatus => {
          this.status = mediaStatus
          console.log('mediaStatus:' + mediaStatus)
          if (mediaStatus === Media.MEDIA_STOPPED) {

          }

          // _this.audio.dispatchEvent(new Event('ended'));
        }
      )
    }
    if (this.my_media) {
      if (this.timerDur)clearInterval(this.timerDur)
      this.timerDur = setInterval(() => {
        if (this.my_media.getDuration() > 0) {
          clearInterval(this.timerDur)
          console.log(this.my_media.getDuration())
          console.log('trigger duration event')
          this.audio.dispatchEvent(new CustomEvent('duration', {'detail': this.my_media.getDuration()}))
        }
      }, 100)

      // this.my_media.play({ playAudioWhenScreenIsLocked : true })
      this.my_media.play()

      if (typeof position === 'number' && position > 0) {
        setTimeout(() => this.seekTo(position, 0))
      }
      if (this.timer) clearInterval(this.timer)

      this.timer = setInterval(() => {
        this.my_media.getCurrentPosition(
          position => {
            if (position > -1 && this.audio.currentTime != position) {
              this.audio.currentTime = position
              this.audio.dispatchEvent(new Event('timeupdate'))
            }
          },
          function (e) {
            console.log('Error getting pos=' + e)
          }
        )
      }, 1000)
    }
    return this
  }

  pause() {
    if (this.my_media) {
      this.my_media.pause()
    }
    return this
  }
}

const player = new Player()

export default player

