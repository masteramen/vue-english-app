<template>
  <scroll ref="subscription"
          class="subscription"
          :data="subscriptionList"
          :pullup="pullup"
          :beforeScroll="beforeScroll"
          @scrollToEnd="searchMore"
          @beforeScroll="listScroll"
  >
    <ul class="subscription-list">
      <li @click="selectItem(item)" class="subscription-item" v-for="item in subscriptionList">
        <div class="icon" v-if="item.visualUrl">
          <div class="image" :style="'background-image: url('+item.visualUrl+');height:60px;width:60px;'"></div>

        </div>
        <div class="name">
          <div style="position: relative;line-height:20px;">
            <span>{{item.title}}</span>
            <div @click="toggleItem(item)" style="position: absolute;top:0;right:0;">
              <my-switch open-name="关闭" close-name="开启" size="lg" color="orange" :value.sync="item.enable===true"></my-switch>
            </div>
          </div>
<!--          <div>{{item.feedId}}</div>-->
          <p class="text">{{item.description}}</p>
        </div>

        <div class="op" v-if="isEdit">
          <i class="icon-delete" @click="toggleItem(item)"></i>
        </div>
      </li>
      <loading v-show="hasMore" title=""></loading>
    </ul>
    <div v-show="!hasMore && (!subscriptionList||!subscriptionList.length)" class="no-result-wrapper" @click="clickNoResult">
      <no-result title="暂无订阅，请点击添加新的订阅" ></no-result>
    </div>
  </scroll>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll2/scroll'
  import Loading from 'base/loading/loading'
  import NoResult from 'base/no-result/no-result'
  import {search} from 'api/search'
  import {ERR_OK} from 'api/config'
  import {mapMutations, mapActions, mapGetters} from 'vuex'
  import mySwitch from 'vue-switch/switch-2.vue'
  const TYPE_SINGER = 'singer'
  const perpage = 20

  export default {
    props: {
      showSinger: {
        type: Boolean,
        default: true
      },
      edit: {
        type: Boolean,
        default: false
      },
      query: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        page: 1,
        isEdit:false,
        pullup: true,
        beforeScroll: true,
        hasMore: false,
        result: []
      }
    },
    methods: {
      clickNoResult(){
        this.$emit('addnew')
      },
      refresh() {
        this.$refs.subscription.refresh()
      },
      search() {
        this.page = 1
        this.hasMore = false
        this.$refs.subscription.scrollTo(0, 0)
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          for(let item of res){
            if(this.subscriptionList.filter(e=>e.feedId===item.feedId).length>0){
              item.remove=true
            }else item.remove=false
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
        console.log(item)
        let cloneItem = Object.assign({},item,{enable:!item.enable})
        console.log(cloneItem)
        this.toggleSubcription(cloneItem)

        //item.remove = !item.remove
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
      console.log('icon status....')
      if (item.remove) return 'icon-circle-remove'
      else return 'icon-add'
    },
      _genResult(data) {
        return data
      },
      _normalizeSongs(list) {
        let ret = []
        list.forEach((musicData) => {
          if (musicData.songid && musicData.albummid) {
            ret.push(createSong(musicData))
          }
        })
        return ret
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
      edit(e){
        this.isEdit = e
      }

    },
    components: {
      Scroll,
      Loading,
      NoResult,
      mySwitch
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .subscription
    height: 100%
    overflow: hidden
    .subscription-list
      padding: 0 10px
      .subscription-item
        display: flex
        align-items: center
        padding-bottom: 20px
        border-bottom: 1px solid #333;
        margin-bottom: 20px
      .op
        flex: 0 0 50px
        width: 40px
        text-align: right
        .icon-delete
          font-size:24px

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
