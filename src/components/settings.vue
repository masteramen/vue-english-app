<template>
  <page title="设置" class="setting" >
    <div class="listCon">
      <scroll  class="toplist" ref="settinglist" >
        <ul tyle="height:100%;">
          <mt-checklist
            style="margin-left:-16px"
            align="right"
            v-model="config.checklistValues"
            :options="checklistOptions">
          </mt-checklist>
          <div  v-on:click="clickNDays">
          <mt-cell
            title="删除旧文章"
            label="自动删除几天前旧的文章" is-link>
            {{config.nDay}}天
          </mt-cell>
          </div>
          <div @click="clickVersion">
            <mt-cell title="软件版本" ><span :class="{admin:config.isDebug>10}">1.0</span></mt-cell>
          </div>

        </ul>
      </scroll>
      <mt-actionsheet
        :actions="dayActions"
        v-model="nDaySheetVisible">
      </mt-actionsheet>
      <mt-popup
        v-model="popupVisible"
        popup-transition="popup-fade">
        <mt-radio
          title="请选择天数"
          v-model="config.nDay"
          :options="nDayOptions">
        </mt-radio>
      </mt-popup>
    </div>
  </page>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll2/scroll'
  import {getOrSetSetting} from 'common/js/cache'
  export default {
    created() {

    },
    mounted() {
    },
    data() {
      return {
        config: getOrSetSetting(),
        checklistOptions: [
          {
            label: '手机网络下载音频',
            value: 'download-cell-net-work'
          },
          {
            label: '显示生词翻译',
            value: 'disp-new-word-ts'
          },
          {
            label: '显示段落译文',
            value: 'disp-p-ts'
          }],
        nDayOptions: [
          {
            label: '2天',
            value: '2'
          },
          {
            label: '3天',
            value: '3'
          },
          {
            label: '4天',
            value: '4'
          },
          {
            label: '5天',
            value: '5'
          }],

        settingList: ['voa', 'bbc'],
        nDaySheetVisible: false,
        dayActions: [{name: '2'}, {name: '3'}, {name: '4'}, {name: '5'}],
        popupVisible: false
      }
    },
    filters: {

    },
    methods: {
      clickNDays() {
        this.popupVisible = !this.popupVisible
      },
      clickVersion() {
        this.config.isDebug += 1
        console.log(this.config.isDebug)
      },
      back() {
        this.show = false
      }
    },
    computed: {

    },
    watch: {
      config: {
        handler(val, oldVal) {
          console.log(val)
          getOrSetSetting(this.config)
        },
        deep: true
      }

    },
    components: {
      Scroll
    }
  }
</script>

<style  lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .setting
    background: $color-background
    z-index 10000!important
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
  .setting
    width: 100%
    .listCon
      position: fixed;
      width: 100%;
      top: 44px;
      bottom: 0px;
    .toplist
      height: 100%
      overflow: hidden
      .admin
        color:red;
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
