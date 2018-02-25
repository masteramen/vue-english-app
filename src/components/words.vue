<template>
  <page :title="'生词('+dictList.length+')'" class="words" >
    <div class="listCon">
      <scroll  class="toplist" ref="list" :listenScroll="true" @scroll="onScroll" :pullDownConfig="pullDownConfig" @pullingDown="onPullingDown">
        <div>
          <div ref="topbar" style="position:absolute;width:100%;left:0;top:-50px;text-align:center;">
            <div>{{pullDownTip}}</div>
          </div>
          <ul>
            <li v-for="(dict,index) in dictList" style="padding:10px;border-top:1px solid #ccc;">
              <div><span>{{dict.QTEXT}}</span> - {{dict.RESULT}}<br /></div>
              <div style="padding-top:10px;color:#777;font-size:80%;">{{dict.DETAIL}}</div>
            </li>

          </ul>
        </div>
      </scroll>
    </div>
  </page>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll2/scroll'
  import {configProvider,getDictList} from 'common/js/service'

  export default {
    created() {

    },
    mounted() {
      getDictList().then(dictList=>this.dictList=dictList)
    },
    data() {
      return {
        pullDownTip: '',
        isPullingDown: false,
        pullDownConfig: {
          threshold: 60,
          stop: 40
        },
        dictList:[]
      }
    },
    filters:{
    },
    methods: {
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
        getDictList().then(dictList=>{
          this.dictList=dictList;
        }).then(x=>{
          this.$refs.list.forceUpdate(true)
        });
      },
    },
    computed:{

    },
    watch: {
      config:{
        handler(val, oldVal){
          console.log(val)
          configProvider.save(this.config)
        },
        deep:true
      }

    },
    components: {
      Scroll,
    }
  }
</script>

<style  lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .words
    background: $color-background
    .mint-checklist
      .mint-cell
        text-align: left

    .mint-cell
      background: $color-background
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
        line-height: 40px
        text-align: center
        no-wrap()
        font-size: $font-size-large
        color: $color-text
  .words
    width: 100%
    .listCon
      position: absolute;
      width: 100%;
      top: 44px;
      bottom: 60px;
    .toplist
      height: 100%
      overflow: hidden
      .item
        display: flex
        margin: 0 20px
        padding-top: 10px
        border-bottom: 1px solid #777;
        padding-bottom: 10px;
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
</style>
