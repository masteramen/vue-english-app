<template>
  <page title="home" :no-back="true">
    <m-header slot="navbar"  :data="songs"></m-header>
    <div style="position:absolute;top:44px;bottom:60px;left:0;right:0">

          <div class="articles" ref="articles">

            <scroll :data="songs" class="toplist" ref="toplist" :listenScroll="true" @scroll="onScroll" :pullDownConfig="pullDownConfig" @pullingDown="onPullingDown">
              <div>
                <div ref="topbar" style="position:absolute;width:100%;left:0;top:-50px;text-align:center;color:#999;"><div>{{pullDownTip}}</div><div v-if="lastFetchTime">上次刷新：{{lastFetchTime|formatDate2}} </div></div>
                <ul>
                  <li @click="selectItem(song,index)" class="item" :class="{selected:index===currentIndex}" v-for="(song,index) in songs">
                    <div class="progressbar" :style="'width: '+(song.percent || 0)+'%;'"  v-if="downloadAll && song.percent!=100"></div>
                    <div class="sequenceList">
                      <div class="song">
                        <div>{{song.title}}</div>
                        <lazy-component @show="handlerTSCNtitle(song)" v-if="reload">
                          {{song.title_CN}}
                        </lazy-component>
                      </div>

                      <div class="summary">
                        <div class="summaryWrap">
                          <span v-if="song.ORG_SITE">{{song.ORG_SITE}}</span> <span v-if="song.ORG_SITE">|</span>
                          <span v-if="song.TOTAL">{{song.TOTAL&&((song.TOTAL/1024/1024).toFixed(2)+' MB')||'未知大小'}} |</span>
                          <span>{{song.pubDate}}</span>
                          <span v-if="song.DURATION">| {{song.DURATION&&(Array(2).join('0') + parseInt(song.DURATION/60)).slice(-2)+':'+(Array(2).join('0') + parseInt(song.DURATION%60)).slice(-2)||'未知时长'}}</span>
                          <i v-if="song.audio" :class="{'icon-play':song.audio}" ></i>
                          <i class="icon-success"  v-if="song.TOTAL"></i>
                        </div>
                      </div>
                    </div>
                    <lazy-component v-if="song.thumb" @show="handlerIMG(song,song.thumb)" class="icon" >
                      <img  :id="song.ID"  :dataSrc="song.thumb" v-lazy="song.thumb"   />
                    </lazy-component>
                  </li>
                </ul>
              </div>
              <div class="loading-container" v-show="!songs.length">
                <loading v-if="subscriptionList.length!==0"></loading>
                <div v-if="subscriptionList.length===0" style="color:black;line-height: 2em;" >
                  你还没有添加订阅源，请先点击 订阅 -&gt; <span>+新的订阅</span> 或者点击 <b style="color:green;" @click="addNewSubscription()">这里</b> 添加订阅源。
                </div>
              </div>
            </scroll>

          </div>



    </div>

  </page>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll2/scroll'
  import Loading from 'base/loading/loading'
  import {playlistMixin} from 'common/js/mixin'
  import {getOrSetRefreshTime} from '../common/js/cache'
  import {formatDate} from 'common/js/formatDate'
  import MHeader from 'components/m-header/m-header'
  import {shuffle} from 'common/js/util'
  import {getLatestArticles, fetchLatest, downloadAllArticles, downloadArtilePic, createArticle} from 'common/js/service'
  import {getRConfig} from 'api/config'
  import {mapGetters, mapMutations, mapActions} from 'vuex'
  import ProgressCircle from 'base/progress-circle/progress-circle'
  import 'c-swipe/dist/swipe.css'
  import { Swipe, SwipeItem } from 'c-swipe'

export default {
    mixins: [playlistMixin],
    created() {

    },
    mounted() {
      (async () => {
        let time = this.subscriptionList && this.subscriptionList.length ? 0 : 6 * 1000
        setTimeout(() => {
          this._getLatestArticles()
          console.log(' getOrSetRefreshTime():'+ getOrSetRefreshTime())
          if(new Date().getTime() - getOrSetRefreshTime()>360000){
            this.pulldownRefreshDataList()
          }
        }, time)

        let rConfig = await getRConfig()
        if (rConfig.rss && rConfig.rss.items) {
          for (let subscription of rConfig.rss.items) {
            this.saveSubcription(subscription)
          }
        }
      })()
    },
    data() {
      return {
        index: 0,
        songs: [],
        reload: true,
        selected: -1,
        lastFetchTime: getOrSetRefreshTime(),
        pullDownTip: '',
        isPullingDown: false,
        pullDownConfig: {
          threshold: 60,
          stop: 60
        }
      }
    },
    filters: {
      formatDate2(time) {
        return formatDate(new Date(parseInt(time)), 'yyyy-MM-dd hh:mm:ss')
      }
    },
    methods: {
      addNewSubscription() {
        this.$router.push({
          path: `/subscription`
        })
      },
      onSlideChangeStart (currentPage) {
        console.log('onSlideChangeStart', currentPage)
      },
      onSlideChangeEnd (currentPage) {
        console.log('onSlideChangeEnd', currentPage)
      },
      handlerIMG(item, url) {
        downloadArtilePic(item)
      },
      handlerTSCNtitle(item) {
        if (!item.title_CN && !item.title.match(/[\u4e00-\u9fa5]/)) {
          (async () => {
            await item.tsTitle()
            this.$refs.toplist.refresh()
          })()
        }
      },
      onScroll(pos) {
        setTimeout(() => {
          if (this.isPullingDown) {
            return
          }
          if (pos.y >= this.pullDownConfig.threshold) {
            this.pullDownTip = '松开刷新'
          } else {
            this.pullDownTip = '下拉刷新'
          }
        }, 0)
      },
      onPullingDown(isPullingDown) {
        if (isPullingDown) {
          this.isPullingDown = true
          this.pullDownTip = '正在刷新'
          this.pulldownRefreshDataList()
        } else this.isPullingDown = false
        // this.$refs.toplist.forceUpdate()
      },
      pulldownRefreshDataList() {
        fetchLatest()
          .then(contents => {
            this.lastFetchTime = new Date().getTime()
            getOrSetRefreshTime(this.lastFetchTime)
            return this._getLatestArticles()
          }).then(() => {
            this.$refs.toplist.forceUpdate(true)
            this.reload = false
            setTimeout(_ => this.reload = true, 200)
          })
      },

      _getLatestArticles() {
        getLatestArticles().then((res) => {
          if (res.contents) {
            let ret = []
            res.contents.forEach(item => {
              ret.push(createArticle(item))
            })
            this.songs = ret
            window.sequenceList = ret
            window.randomList = shuffle(Array(ret.length).fill(0).map((v, i) => i))
          }
        }).catch(e => {
          console.log(e)
        })
      },
      handlePlaylist(playlist) {
        const bottom = '60px'

        // this.$refs.articles.style.bottom = bottom
        // this.$refs.toplist.refresh()
      },
      ...mapMutations({
        setDownloadAll: 'SET_DOWNLOAD_ALL_STATE'
      }),
      ...mapGetters([
        'currentSong',
        'fullScreen'
      ]),
      selectItem(item, index) {
        console.log(item.audio)

        /*if (item.audio && item.audio.match(/\.mp4/)) {
          item.getFinalAudioUrl().then(url => {
            window.plugins.streamingMedia.playVideo(item.audio, {srt: 'http://192.168.1.126/rss/test.srt'})
          })
          return
        }*/
        this.selectCurIndex({index})
        let path = '/detail'
        if (item.isAudio()) path = '/player'
        console.log(item)
        this.$router.push({
          path: path
        })
        console.log(index)
      },
      ...mapMutations({
        setFilterType: 'SET_FILTER_TYPE',
        setTopList: 'SET_TOP_LIST'

      }),
      ...mapActions([
        'selectCurIndex',
        'toggleDownloadAll',
        'saveSubcription'
      ])
    },
    computed: {
      ...mapGetters([
        'currentIndex',
        'downloadAll',
        'subscriptionList'
      ]),
      mSongs() {
        return this.songs
      }

    },
    watch: {
      songs() {
        setTimeout(() => {
          this.$Lazyload.lazyLoadHandler()
        }, 20)
      },
      downloadAll(newValue, oldValue) {
        if (newValue) {
          setTimeout(_ => {
            (async () => {
              await downloadAllArticles(this.songs, () => {
                return !this.downloadAll
              })
              if (this.downloadAll) this.toggleDownloadAll()
            })()
          }, 0)
        }
      },
      subscriptionList() {
        this._getLatestArticles()
        //this.pulldownRefreshDataList()
      }
    },
    components: {
      Scroll,
      ProgressCircle,
      Loading,
      MHeader,
      Swipe,
      SwipeItem
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .articles
    position: absolute
    width: 100%
    top: 0
    bottom: 0
    background-color: #f0eff5
    .toplist
      height: 100%
      overflow: hidden
      .item
        display: flex
        border-bottom:1px solid #f2f2f2;
        position: relative
        background-color: #fff
        color: black
        .progressbar
          position: absolute;
          //top:0;
          bottom: 0
          background: green;
          opacity: 0.6;
          height:2px;
        //&:last-child
          //padding-bottom: 20px
        .progress
          height:2px
          overflow:hidden
          background-color:#f5f5f5
          border-radius:44px
          margin-top:5px
          box-shadom:inset 0 1px 2px rgba(0,0,0,.1)
          .progress-bar
            float:left
            height:100%
            line-height:20px
            color:#fff
            background-color:#337ab7
            box-shadom:inset 0 -1px 0 rgba(0,0,0,.15)
            transition:width .6s ease

        .icon
          flex: 0 0 100px
          width: 100px
          height: 100px

          img
            margin:10px
            height: 80%
            width:80%
        .sequenceList
          flex: 1
          display: flex
          flex-direction: column
          justify-content: center
          padding: 0 10px 0 10px
          overflow: hidden
          font-size: $font-size-small
          .song
            font-size: 16px
            line-height: 130%
            padding-top:10px
            color:#666

          .summary
            margin:10px 0
            line-height :1.5em
            color: #b2b2b2

            .summaryWrap
              .icon-success
                font-size: 100%
                color:green
                padding-left:10px
              .icon-play
                font-size:100%
                padding-left:10px
              span
                font-size: 80%
        &.selected
          .song
            color: green

      .loading-container
        position: absolute
        width: 100%
        top: 50%
        transform: translateY(-50%)
</style>
