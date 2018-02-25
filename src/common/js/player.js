import {downloadFile} from './service'
class Player {

  setAudio(audio) {
    this.audio = audio
  }

  seekTo(position) {
    console.log('seekTo:' + position)
    if (this.my_media) this.my_media.seekTo(position * 1000)
    return this
  }

  tmpPlay(url,onerror,onended){
    let tmpmedia = new Media(url,
      () => {
        console.log('play :' + url)
      },
      err => {
        console.log(err)
        onerror&&onerror()
      },
      mediaStatus => {
        console.log(`mediaStatus:${mediaStatus}`)
        if (mediaStatus == Media.MEDIA_STOPPED) {
          onended&&onended()
          tmpmedia.release()
        }
      }
    )
    tmpmedia.play()
  }
  loopplay(url) {
    if (this.timer) clearInterval(this.timer)
    if (this.my_media) {
      this.my_media.release()
      delete this.my_media
    }
    this.my_media = new Media(url,
      () => {
        console.log('play :' + url)
      },
      err => {
        console.log(err)
      },
      mediaStatus => {
        console.log(`mediaStatus:${mediaStatus}`)
        if (mediaStatus == 5) {
          console.log('play again')
          this.play()
          console.log('play again2')
        }
      }
    )

    this.my_media.play({numberOfLoops: new Date().getTime()})
    console.log('play silent model.....')
  }

  play(newAudioUrl, position) {
    if (newAudioUrl && this.audioUrl !== newAudioUrl) {
      this.audioUrl = newAudioUrl
      let url = this.audioUrl

      if (this.my_media) {
        if (this.status != Media.MEDIA_STOPPED) {
          this.my_media.pause()
        }
        this.my_media.release()
        delete this.my_media
      }
      this.my_media = new Media(url,
        () => {
          this.audio.dispatchEvent(new Event('ended'))

          console.log('playAudio():Audio Success')
          if (this.timer) clearInterval(this.timer)
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
      var timerDur = setInterval(() => {
        if (this.my_media.getDuration() > 0) {
          clearInterval(timerDur)
          console.log('trigger duration event')
          this.audio.dispatchEvent(new CustomEvent('duration', {'detail': this.my_media.getDuration()}))
        }
      }, 100)

      // this.my_media.play({ playAudioWhenScreenIsLocked : true })
      if (typeof position === 'number') {
        this.seekTo(position)
      }
      this.my_media.play()

      // this.audio.dispatchEvent(new Event('canplay'))
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

