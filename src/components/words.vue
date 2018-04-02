<template>
  <page :title="'生词('+dictList.length+')'" class="words" >
    <div class="listCon">
    <scroll class="listview" :data="data" ref="listview" :listenScroll="listenScroll" @scroll="scroll" :probeType="probeType"   :pullDownConfig="pullDownConfig" @pullingDown="onPullingDown">
      <div>
        <div ref="topbar" style="position:absolute;width:100%;left:0;top:-50px;text-align:center;">
          <div>{{pullDownTip}}</div>
        </div>
        <ul>
          <li v-for="group in data" class="list-group" ref="listGroup">
            <h2 class="list-group-title">{{group.title}}</h2>
            <ul>
              <li v-for="item in group.items" class="list-group-item" @click="selectItem(item)">
                <div><span>{{item.QTEXT}}</span> - {{item.RESULT}}<br /></div>
                <div style="padding-top:10px;color:#777;font-size:80%;">{{item.DETAIL}}</div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </scroll>

      <div class="list-shortcut" @touchstart="onShortcutTouchStart" @touchmove.stop.prevent="onShortcutTouchMove">
        <ul>
          <li v-for="(item,index) in shortcutList" class="item" :data-index="index" :class="{'current': currentIndex===index}">{{item}}</li>
        </ul>
      </div>
      <div class="list-fixed" v-show="fixedTitle" ref="fixed">
        <h1 class="fixed-title">{{fixedTitle}}</h1>
      </div>
    </div>
  </page>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll2/scroll'
  import {getData} from 'common/js/dom'
  import {configProvider, getDictList,getRecentDictList} from 'common/js/service'
  const ANCHOR_HEIGHT = 18
  const TITLE_HEIGHT = 30

  export default {
    created() {
      this.touch = {}
      this.listenScroll = true
      this.listHeight = []
      this.probeType = 3
    },
    mounted() {
      this.pulldownRefreshDataList()
    },
    data() {
      return {
        scrollY: -1,
        currentIndex: 0,
        diff: -1,
        pullDownTip: '',
        isPullingDown: false,
        pullDownConfig: {
          threshold: 60,
          stop: 60
        },
        dictList: [],
        recentList: []
      }
    },
    computed: {
      data() {
        let groupList = []
        let group = {title: '最近', items: []}

        groupList.push(group)
        this.recentList.forEach(e => {
          group.items.push(e)
        })

        this.dictList.forEach(e => {
          if (group.title != e.QTEXT[0].toUpperCase()) {
            console.log(`group.title:${group.title} e.QTEXT[0]:${e.QTEXT[0]}`)
            group = {title: e.QTEXT[0].toUpperCase(), items: []}
            groupList.push(group)
          }
          group.items.push(e)
        })
        return groupList
      },
      shortcutList() {
        return this.data.map((group) => {
          return group.title.substr(0, 1)
        })
      },
      fixedTitle() {
        if (this.scrollY > 0) {
          return ''
        }
        return this.data[this.currentIndex] ? this.data[this.currentIndex].title : ''
      }
    },
    methods: {
      onPullingDown(isPullingDown) {
        console.log(isPullingDown)
        if (isPullingDown) {
          this.isPullingDown = true
          this.pullDownTip = '正在刷新'
          this.pulldownRefreshDataList()
        } else this.isPullingDown = false
        // this.$refs.toplist.forceUpdate()
      },
      pulldownRefreshDataList() {
        (async ()=>{
          this.dictList = await getDictList()
          this.recentList = await getRecentDictList()
          this.$refs.listview.forceUpdate(true)
        })()

      },
      selectItem(item) {
        this.$emit('select', item)
      },
      onShortcutTouchStart(e) {
        let anchorIndex = getData(e.target, 'index')
        let firstTouch = e.touches[0]
        this.touch.y1 = firstTouch.pageY
        this.touch.anchorIndex = anchorIndex
        this._scrollTo(anchorIndex)
      },
      onShortcutTouchMove(e) {
        let firstTouch = e.touches[0]
        this.touch.y2 = firstTouch.pageY
        let delta = (this.touch.y2 - this.touch.y1) / ANCHOR_HEIGHT | 0
        let anchorIndex = parseInt(this.touch.anchorIndex) + delta
        console.log(anchorIndex)
        this._scrollTo(anchorIndex)
      },
      refresh() {
        this.$refs.listview.refresh()
      },
      scroll(pos) {
        this.scrollY = pos.y
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
      _scrollTo(index) {
        if (!index && index !== 0) {
          return
        }
        if (index < 0) {
          index = 0
        } else if (index > this.listHeight.length - 2) {
          index = this.listHeight.length - 2
        }
        this.scrollY = -this.listHeight[index]
        this.$refs.listview.scrollToElement(this.$refs.listGroup[index], 0)
      },
      _calculateHeight() {
        this.listHeight = []
        const list = this.$refs.listGroup
        let height = 0
        this.listHeight.push(height)
        for (let i = 0; i < list.length; i++) {
          let item = list[i]
          height += item.clientHeight
          this.listHeight.push(height)
        }
      }
    },
    watch: {
      data() {
        setTimeout(() => {
          this._calculateHeight()
        }, 20)
      },
      scrollY(newY) {
        const listHeight = this.listHeight
        // 当滚动到顶部 newY>0
        if (newY > 0) {
          this.currentIndex = 0
          return
        }

        // 在中间部分滚动
        for (let i = 0; i < listHeight.length - 1; i++) {
          let height1 = listHeight[i]
          let height2 = listHeight[i + 1]
          if (-newY >= height1 && -newY < height2) {
            this.currentIndex = i
            this.diff = height2 + newY
            return
          }
        }
        // 滚动到底部且-newY大于最后一个元素的上限
        this.currentIndex = listHeight.length - 2
      },
      diff(newVal) {
        let fixedTop = (newVal > 0 && newVal < TITLE_HEIGHT) ? newVal - TITLE_HEIGHT : 0
        if (this.fixedTop === fixedTop) {
          return
        }
        this.fixedTop = fixedTop
        this.$refs.fixed.style.transform = `translate3d(0,${fixedTop}px,0)`
      }
    },
    components: {
      Scroll
    }
  }

</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  .words
    width: 100%
    .listCon
      position: absolute;
      width: 100%;
      top: 44px;
      bottom: 60px;
  .listview
    position: relative
    width: 100%
    height: 100%
    overflow: hidden
    background: $color-background
    .list-group
      padding-bottom: 30px
      .list-group-title
        height: 30px
        line-height: 30px
        padding-left: 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background
      .list-group-item
        align-items: center
        padding: 20px
        .avatar
          width: 50px
          height: 50px
          border-radius: 50%
        .name
          margin-left: 20px
          color: $color-text-l
          font-size: $font-size-medium
  .list-shortcut
    position: absolute
    z-index: 30
    right: 0
    top: 50%
    transform: translateY(-50%)
    width: 20px
    padding: 20px 0
    border-radius: 10px
    text-align: center
    background: $color-background-d
    font-family: Helvetica
    .item
      padding: 3px
      line-height: 1
      color: $color-text-l
      font-size: $font-size-small
      &.current
        color: $color-theme
  .list-fixed
    position: absolute
    top: 0
    left: 0
    width: 100%
    .fixed-title
      height: 30px
      line-height: 30px
      padding-left: 20px
      font-size: $font-size-small
      color: $color-text-l
      background: $color-highlight-background
    .loading-container
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
