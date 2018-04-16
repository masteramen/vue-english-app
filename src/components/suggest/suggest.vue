<template>
  <scroll ref="suggest"
          class="suggest"
          :data="result"
          :pullup="pullup"
          :beforeScroll="beforeScroll"
          @scrollToEnd="searchMore"
          @beforeScroll="listScroll"
  >
    <ul class="suggest-list">
      <li @click="selectItem(item)" class="suggest-item" v-for="item in result">
        <div class="icon">
          <div class="image" :style="'background-image: url('+item.visualUrl+');height:60px;width:60px;'"></div>

        </div>
        <div class="name">
          <div>{{item.title}}</div>
          <div>{{item.feedId}}</div>
          <p class="text">{{item.description}}</p>
        </div>
        <div class="op">
          <i :class="statusIcon(item)" @click="toggleItem(item)">
            <loading v-if="statusIcon(item)===''" title="Checking"></loading>
          </i>
        </div>
      </li>
      <loading v-show="hasMore" title=""></loading>
    </ul>
    <div v-show="!hasMore && !result.length" class="no-result-wrapper">
      <no-result title="抱歉，暂无搜索结果"></no-result>
    </div>
  </scroll>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll2/scroll'
  import Loading from 'base/loading/loading'
  import NoResult from 'base/no-result/no-result'
  import {search} from 'api/search'
  import {ERR_OK, checkFeed, FEED_STATUS} from 'api/config'
  import {mapMutations, mapActions, mapGetters} from 'vuex'

  const TYPE_SINGER = 'singer'
  const perpage = 20

  export default {
    props: {
      showSinger: {
        type: Boolean,
        default: true
      },
      query: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        page: 1,
        pullup: true,
        beforeScroll: true,
        hasMore: true,
        result: []
      }
    },
    methods: {
      refresh() {
        this.$refs.suggest.refresh()
      },
      search() {
        this.page = 1
        this.hasMore = false
        this.$refs.suggest.scrollTo(0, 0)
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          for (let item of res) {
            item.feedId = item.feedId.substring(5)
            if (this.subscriptionList.filter(e => e.feedId === item.feedId).length > 0) {
              item.status = FEED_STATUS.ok
            } else item.status = FEED_STATUS.unknow
          }
          this.result = res
          console.log(this.result)
        })
      },
      searchMore() {
        if (!this.hasMore) {
          return
        }
        this.page++
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          if (res.code === ERR_OK) {
            this.result = this.result.concat(this._genResult(res.data))
            this._checkMore(res.data)
          }
        })
      },
      listScroll() {
        this.$emit('listScroll')
      },
      selectItem(item) {

      },
      toggleItem(item) {
        (async () => {
          if (item.status !== FEED_STATUS.ok) {
            item.status = FEED_STATUS.checking
            let result = await checkFeed(item.feedId)
            item.enable = true
            Object.assign(item, result)
          } else if (item.status === FEED_STATUS.ok) {
            item.status = FEED_STATUS.unknow
          }

          this.toggleSubcription(item)
          this.$emit('select', item)
        })()
      },
/*      getDisplayName(item) {
        if (item.type === TYPE_SINGER) {
          return item.singername
        } else {
          return `${item.name}-${item.singer}`
        }
      }, */
      getIconCls(item) {
        if (item.type === TYPE_SINGER) {
          return 'icon-mine'
        } else {
          return 'icon-music'
        }
      },
      statusIcon(item) {
        if (item.status === FEED_STATUS.ok) return 'icon-circle-remove'
        else if (item.status === FEED_STATUS.unknow) return 'icon-add'
        else if (item.status === FEED_STATUS.fail) return 'icon-error'
        else return ''
      },
      _genResult(data) {
        return data
      },
      _checkMore(data) {
        const song = data.song
        if (!song.list.length || (song.curnum + song.curpage * perpage) > song.totalnum) {
          this.hasMore = false
        }
      },
      ...mapMutations({
        setSinger: 'SET_SINGER'
      }),
      ...mapActions([
        'insertSong',
        'toggleSubcription'
      ])
    },
    computed: {
      ...mapGetters([
        'subscriptionList'
      ])
    },
    watch: {
      query(newQuery) {
        this.search(newQuery)
      }
    },
    components: {
      Scroll,
      Loading,
      NoResult
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .suggest
    height: 100%
    overflow: hidden
    .suggest-list
      padding: 0 10px
      .suggest-item
        display: flex
        align-items: center
        padding-bottom: 20px
        border-bottom: 1px solid #333;
        margin-bottom: 20px
      .op
        flex: 0 0 50px
        width: 40px
        text-align: right
        .icon-error
          color:red

      .icon
        flex: 0 0 70px
        width: 60px
        .image
          background-position:50%
          background-repeat: no-repeat;
          background-size: cover;
          border: 0;
          border-radius: .25rem;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.05);
          margin: 0;
        [class^="icon-"]
          font-size: 14px
          color: $color-text-d
      .name
        flex: 1
        font-size: $font-size-medium
        color: $color-text-d
        overflow: hidden
        .text
          no-wrap()
    .no-result-wrapper
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
