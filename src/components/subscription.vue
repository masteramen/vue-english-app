<template>
  <page :title="'订阅('+(subscriptionList&&subscriptionList.length)+')'" class="subscription"  >
<!--    <div style="text-align: center;font-size:16px;" @click="rssSearch=true">
      <i class="icon-add" style="font-size:16px;">添加新的订阅</i>
    </div>-->
    <div class="listCon">
     <subscription-list :edit="edit"></subscription-list>
    </div>
  <search class="search-rss" v-if="rssSearch" @cancel="rssSearch=false"></search>
  </page>


</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll2/scroll'
  import Search from 'components/search/search'
  import {mapGetters, mapActions} from 'vuex'
  import SubscriptionList from './suggest/subscription-list'
  import SubscriptionSearchBox from '../base/search-box/subscription-search-box'
import {getLatestSubscriptionList} from 'common/js/service'

export default {
    created() {

    },
    mounted() {
      (async () => {
        let rsubscriptionList = await getLatestSubscriptionList()
        let first = !this.subscriptionList || this.subscriptionList.length === 0
        for (let subscription of rsubscriptionList) {
          if (first) {
            subscription.enable = true
          }
          this.saveSubcription(subscription)
        }
      })()
    },
    data() {
      return {
        fullScreen: true,
        rssSearch: false,
        edit: false
      }
    },
    filters: {

    },
    methods: {
      back() {
        this.show = false
      },
      clickVersion() {
      },
      showAdd() {
        this.$router.push({
          path: `/subscription/search`
        })
      },
      ...mapActions([
        'saveSubcription'
      ])
    },
    computed: {
      ...mapGetters([
        'subscriptionList'
      ])
    },
    watch: {

    },
    components: {
      SubscriptionSearchBox,
      SubscriptionList,
      Scroll,
      Search
    }
  }
</script>

<style  lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"
  .subscription
    position: fixed
    left: 0
    right: 0
    top: 0
    bottom: 0
    z-index: 1000!important
    background: $color-background
    .search-rss
      position:absolute
      top:0
      left:0
      width: 100%
      height:100%
      background :#222222
      z-index:1000
    mt-checklist
      .mint-checkbox-label
        margin-left: 0
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
   .subscription
    position: fixed
    width: 100%
    top: 0px
    bottom: 0
    .listCon
      position: fixed;
      width: 100%;
      top: 84px;
      bottom: 0px;
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
