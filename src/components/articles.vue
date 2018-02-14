<template>
  <div class="articles" ref="articles">

    <scroll :data="songs" class="toplist" ref="toplist" :listenScroll="true" @scroll="onScroll" :pullDownConfig="pullDownConfig" @pullingDown="onPullingDown">
      <div>
        <div ref="topbar" style="margin-top:-40px;text-align:center;"><div>{{pullDownTip}}</div><div>上次刷新：{{lastFetchTime|formatDate2}} </div></div>
      <ul>
        <li @click="selectItem(song,index)" class="item" :class="{selected:index===currentIndex}" v-for="(song,index) in songs">
          <div class="progressbar" :style="'width: '+(song.percent || 0)+'%;'"  v-if="song.percent!=100"></div>
          <div class="songlist">
            <div class="song">
              <span>{{song.ID}}</span>
              <span>{{song.TITLE}}</span>
            </div>

            <div class="summary">
            <div style="float:left;line-height:30px;">
            <span>{{song.ORG_SITE}}</span> |
            <span>{{song.TOTAL&&((song.TOTAL/1024/1024).toFixed(2)+' MB')||'未知大小'}}</span> |
             <span>{{song.POST_DATE|formatDate}}</span> |
              <span>{{song.DURATION&&(Array(2).join('0') + parseInt(song.DURATION/60)).slice(-2)+':'+(Array(2).join('0') + parseInt(song.DURATION%60)).slice(-2)||'未知时长'}}</span>
             </div>
             <div>
               <i class="icon-success" style="float:right;" v-if="song.TOTAL"></i>
             </div>

            </div>
          </div>
          <div class="icon">
            <img width="100" height="100" :id="song.ID"  v-lazy="song.IMG_URL" @loaded="loadPicUrl($event,song)" />
          </div>
        </li>
      </ul>
      </div>
      <div class="loading-container" v-show="!songs.length">
        <loading></loading>
      </div>
    </scroll>
    <router-view></router-view>
  </div>
</template>

<script type="text/ecmascript-6">
  // import Scroll from 'base/scroll/scroll'
  import Scroll from 'base/scroll2/scroll/scroll'
  import Loading from 'base/loading/loading'
  import {ERR_OK} from 'api/config'
  import {playlistMixin} from 'common/js/mixin'
  import {createArticle} from 'common/js/service'
  import {formatDate} from 'common/js/formatDate'
  import Bus from 'common/js/bus'

  import {getLatestArticles, fetchLatest, saveFile, downloadAllArticles, downloadArtilePic, getOrUpdateConfig, saveArticles} from 'common/js/service'
  import {mapGetters, mapMutations, mapActions} from 'vuex'
  import ProgressCircle from 'base/progress-circle/progress-circle'
  import * as db from 'common/db'

  // db.initialize()

  export default {
    mixins: [playlistMixin],
    created() {
      // this._getTopList()
      this._getLatestArticles()
      this.pulldownRefreshDataList()
    },
    mounted() {
      Bus.$on('selected', selected => {
        this.selected = selected
      })
      Bus.$on('refresh', selected => {
        this.$nextTick(() => {
          this.$refs.toplist.scrollTo(0, this.pullDownConfig.threshold)
          this.$refs.toplist.$emit('scroll', {'x': 0, 'y': this.pullDownConfig.threshold})
          this.$refs.toplist.$emit('pullingDown', true)
        })
      })
    },
    data() {
      return {
        songs: [],
        selected: -1,
        lastFetchTime: 0,
        pullDownTip: '',
        isPullingDown: false,
        pullDownConfig: {
          threshold: 60,
          stop: 40
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
      loadPicUrl(event, item) {
        downloadArtilePic(item)
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
          // return contents.length
            console.log('resolve2 ....')
            return this._getLatestArticles()
          })/*
          .then((count, lastTime) => {
            this.lastFetchTime = lastTime
            if (count <= 0) this.pullDownTip = '已经是最新的了'
            else {
              this._getLatestArticles()
            }
          }) */.then(() => {
            this.$refs.toplist.forceUpdate(true)
          })
            .catch(err => {
              console.log('error')
              console.log(err)
            })
      },

      _getLatestArticles() {
        getLatestArticles().then((res) => {
          console.log(res)
          if (res.code === ERR_OK) {
            let ret = []
            res.contents.forEach(item => {
              ret.push(createArticle(item))
            })
            this.songs = ret
            console.log('setTopList')
            console.log(ret)
            window.songList = ret
            // this.setTopList(ret)
          }
          console.log(this.songs)
        }).catch(e => {
          console.log('catch error:')

          console.log(e)
        })
      },
      handlePlaylist(playlist) {
        const bottom = '60px'

        this.$refs.articles.style.bottom = bottom
        this.$refs.toplist.refresh()
      },
      ...mapGetters([
        'currentSong'
      ]),
      selectItem(item, index) {
      /* this.$router.push({
          path: `/article/${item.id}`
        })
        this.setTopList(item) */
       // this.selected = item.id
       // this.setFilterType(0)
        this.selectCurIndex({
          list: this.songs,
          index
        })
      },
      ...mapMutations({
        setFilterType: 'SET_FILTER_TYPE',
        setTopList: 'SET_TOP_LIST'

      }),
      ...mapActions([
        'selectPlay',
        'selectCurIndex',
        'randomPlay'
      ])
    },
    computed: {
      ...mapGetters(['downloadAll', 'currentIndex']),
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
      downloadAll(newDownloadAll) {
        this.$nextTick(() => {
          console.log('download All')
          downloadAllArticles(this.songs)
        })
      }
    },
    components: {
      Scroll,
      ProgressCircle,
      Loading
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .articles
    position: fixed
    width: 100%
    top: 50px
    bottom: 0
    .toplist
      height: 100%
      overflow: hidden
      .item
        display: flex
        margin: 0 10px
        padding-top: 10px
        height: 100px
        position: relative
        .progressbar
          position: absolute;
          top: 10px;
          bottom: 0;
          background: gray;
          opacity: 0.6;
        &:last-child
          padding-bottom: 20px
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
          background-color: $color-highlight-background
        .songlist
          flex: 1
          display: flex
          flex-direction: column
          justify-content: center
          padding: 0 0 0 10px
          height: 100px
          overflow: hidden
          background: $color-highlight-background
          color: $color-text-d
          font-size: $font-size-small
          .summary
            margin-top:10px
        &.selected
          .songlist
            color: green
          .song
            no-wrap()
            line-height: 26px
      .loading-container
        position: absolute
        width: 100%
        top: 50%
        transform: translateY(-50%)
</style>
