<template>
  <page title="home" :no-back="true">
    <m-header slot="navbar"  :data="songs"></m-header>
    <div style="position:absolute;top:44px;bottom:60px;left:0;right:0">
        <div class="articles" ref="articles">

          <scroll :data="songs" class="toplist" ref="toplist" :listenScroll="true" @scroll="onScroll" :pullDownConfig="pullDownConfig" @pullingDown="onPullingDown">
            <div>
              <div ref="topbar" style="position:absolute;width:100%;left:0;top:-50px;text-align:center;color:#999;"><div>{{pullDownTip}}</div><div>上次刷新：{{lastFetchTime|formatDate2}} </div></div>
              <ul>
                <li @click="selectItem(song,index)" class="item" :class="{selected:index===currentIndex}" v-for="(song,index) in songs">
                  <div class="progressbar" :style="'width: '+(song.percent || 0)+'%;'"  v-if="song.percent!=100"></div>
                  <div class="sequenceList">
                    <div class="song">
                      <div> <span>{{song.TITLE}}</span></div>
                      <lazy-component @show="handlerTSCNTITLE(song)" v-if="reload">
                        <span>{{song.TITLE_CN}}</span>
                      </lazy-component>
                    </div>

                    <div class="summary">
                      <div class="summaryWrap">
                        <span>{{song.ORG_SITE}}</span> |
                        <span v-if="song.TOTAL">{{song.TOTAL&&((song.TOTAL/1024/1024).toFixed(2)+' MB')||'未知大小'}} |</span>
                        <span>{{song.POST_DATE|formatDate}}</span>
                        <span v-if="song.DURATION">| {{song.DURATION&&(Array(2).join('0') + parseInt(song.DURATION/60)).slice(-2)+':'+(Array(2).join('0') + parseInt(song.DURATION%60)).slice(-2)||'未知时长'}}</span>
                        <i v-if="song.AUDIO_URL" :class="{'icon-play':song.AUDIO_URL}" ></i>
                        <i class="icon-success"  v-if="song.TOTAL"></i>
                      </div>
                    </div>
                  </div>
                  <lazy-component v-if="song.IMG_URL" @show="handlerIMG(song,song.IMG_URL)" class="icon" >
                    <img  :id="song.ID"  :dataSrc="song.IMG_URL" v-lazy="song.IMG_URL"   />
                  </lazy-component>
                </li>
              </ul>
            </div>
            <div class="loading-container" v-show="!songs.length">
              <loading></loading>
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
  import {formatDate} from 'common/js/formatDate'
  import MHeader from 'components/m-header/m-header'
  import {shuffle} from 'common/js/util'
  import {getLatestArticles, fetchLatest, downloadAllArticles, downloadArtilePic, createArticle} from 'common/js/service'
  import {mapGetters, mapMutations, mapActions} from 'vuex'
  import ProgressCircle from 'base/progress-circle/progress-circle'

  export default {
    mixins: [playlistMixin],
    created() {
    },
    mounted() {
      let time = this.subscriptionList&&this.subscriptionList.length?0:6*1000
      setTimeout(()=>{
        this._getLatestArticles()
        this.pulldownRefreshDataList()
      },time)
    },
    data() {
      return {
        index: 0,
        songs: [],
        reload: true,
        selected: -1,
        lastFetchTime: 0,
        pullDownTip: '',
        isPullingDown: false,
        pullDownConfig: {
          threshold: 60,
          stop: 60
        }
      }
    },
    filters: {
      formatDate(time) {
        return formatDate(new Date(parseInt(time)), 'yyyy-MM-dd')
      },
      formatDate2(time) {
        return formatDate(new Date(parseInt(time)), 'yyyy-MM-dd hh:mm:ss')
      }
    },
    methods: {
      onSlideChangeStart (currentPage) {
        console.log('onSlideChangeStart', currentPage)
      },
      onSlideChangeEnd (currentPage) {
        console.log('onSlideChangeEnd', currentPage)
      },
      handlerIMG(item, url) {
        downloadArtilePic(item)
      },
      handlerTSCNTITLE(item) {
        if (!item.TITLE_CN) {
          (async ()=>{
            await item.tsTitle()
            this.$refs.toplist.refresh();
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
            return this._getLatestArticles()
          }).then(() => {
            this.$refs.topli//  lllkkst./////(true)
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
      ...mapGetters([
        'currentSong'
      ]),
      selectItem(item, index) {
        this.selectCurIndex({index})
        let path = '/detail'
        if (item.FEED_TYPE === 'audio') path = '/player'
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
        'toggleDownloadAll'
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
      }
    },
    components: {
      Scroll,
      ProgressCircle,
      Loading,
      MHeader
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
            font-size: 150%
            line-height: 1.5em
            padding-top:10px
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
          .sequenceList
            color: green
          .song
            line-height: 26px
      .loading-container
        position: absolute
        width: 100%
        top: 50%
        transform: translateY(-50%)
</style>
