<template>
<div class="lastest">
  <transition name="slide">
    <article-list-view :rank="rank" :title="title" :bg-image="bgImage" :songs="songs"></article-list-view>
  </transition>
 </div>
</template>

<script type="text/ecmascript-6">
  import ArticleListView from 'components/article-list-view'
  import {getMusicList} from 'api/rank'
  import {ERR_OK} from 'api/config'
  import {mapGetters} from 'vuex'
  import {createArticle} from 'common/js/service'
  import {getLatestArticles,fetchLatest} from 'common/js/service'

  export default {
    computed: {
      title() {
        return this.topList.topTitle
      },
      bgImage() {
        if (this.songs.length) {
          return this.songs[0].image
        }
        return ''
      },
      ...mapGetters([
        'topList'
      ])
    },
    data() {
      return {
        songs: [],
        rank: true
      }
    },
    created() {
      this._getMusicList()
      this._fetchLatest()
    },
    methods: {
      pulldownRefreshDataList(){
        let _this=this
        //setTimeout(()=>{

        fetchLatest().then((res) => {
          if (res.code === ERR_OK) {
      //this.songs=res.contents
      this.songs=this._normalizeArticle(res.contents)
            //this.songs = this._normalizeSongs(res.songlist)
      //console.log(this.songs)
          }
        })

        //},500)

      },
      _getMusicList() {
        console.log('_getMusicList...')
        getLatestArticles().then((res) => {
          if (res.code === ERR_OK) {
			//this.songs=res.contents
			this.songs=this._normalizeArticle(res.contents)
            //this.songs = this._normalizeSongs(res.songlist)
			//console.log(this.songs)
          }
        })
      },
      _normalizeArticle(list) {
        let ret = []

        list.forEach((item) => {
          const articleData = item
          if (articleData.mp3) {
            ret.push(createArticle(articleData))
          }
        })
        return ret
      }
    },
    components: {
      ArticleListView
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  .slide-enter-active, .slide-leave-active
    transition: all 0.3s ease

  .slide-enter, .slide-leave-to
    transform: translate3d(100%, 0, 0)
  .music-list
    top: 90px
</style>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .lastest
    position: fixed
    width: 100%
    top: 88px
    bottom: 60px
    .toplist
      height: 100%
      overflow: hidden
      .item
        display: flex
        margin: 0 20px
        padding-top: 20px
        height: 100px
        &:last-child
          padding-bottom: 20px
        .icon
          flex: 0 0 100px
          width: 100px
          height: 100px
        .songlist
          flex: 1
          display: flex
          flex-direction: column
          justify-content: center
          padding: 0 20px
          height: 100px
          overflow: hidden
          background: $color-highlight-background
          color: $color-text-d
          font-size: $font-size-small
          .song
            no-wrap()
            line-height: 26px
      .loading-container
        position: absolute
        width: 100%
        top: 50%
        transform: translateY(-50%)
</style>
