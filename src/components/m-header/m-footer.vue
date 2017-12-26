<template>
  <div class="m-footer">
  <div class="box">
    <div class="border_1px"></div>
    <div class="option">
      <router-link to="/articles" class="items">
        <span class="icon-home"></span>
        <p class="text">新闻</p>
      </router-link>
      <router-link to="/select" class="items">
        <span class="icon-book"></span>
        <p class="text">频道</p>
      </router-link>
      <router-link to="/search" class="items">
        <span class="icon icon-video-camera"></span>
        <p class="text">搜索</p>
      </router-link>
      <router-link :to="url" class="items"  ref="link">
        <span class="icon icon-spinner10"></span>
        <p class="text">我的</p>
      </router-link>
    </div>
  </div>
  </div>
</template>

<script type="text/ecmascript-6">
  export default {

  methods:{
    user(){
        this.$router.push("/login")
    }
  },
  computed:{
    account(){
    },
    url(){
      return 0?"/user":"/login"
    }
  }

  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .m-header
    position: relative
    height: 44px
    text-align: center
    color: $color-theme
    font-size: 0
    .icon
      display: inline-block
      vertical-align: top
      margin-top: 6px
      width: 30px
      height: 32px
      margin-right: 9px
      bg-image('logo')
      background-size: 30px 32px
    .text
      display: inline-block
      vertical-align: top
      line-height: 44px
      font-size: $font-size-large
    .mine
      position: absolute
      top: 0
      right: 0
      .icon-mine
        display: block
        padding: 12px
        font-size: 20px
        color: $color-theme
</style>

<style lang="scss">
  .m-footer{
    width:100%;
    position: fixed;
    bottom: 0;
    z-index: 100;
    background:#fff;
    .box{
      position:fixed;
      bottom:0;
      left:0;
      z-index:10;
      width:100%;
      height:2.5rem;
      box-sizing:border-box;
      background:rgba(232,193,119,1);
      .border_1px{
        position:absolute;
        left:0;
        top:0;
      }
      .option{
        display:flex;
        padding:0 1.0rem;
        height:100%;
        font-size:0;
        align-items:center;
        .items{
          flex:auto;
          display:inline-block;
          text-align:center;
          color:#131517;
          &.active{
            color:#1886da;
          }
          .icon{
            font-size:0.9rem;
          }
          .text{
            margin-top:0.1rem;
            font-size:0.5rem;
          }
        }
      }
    }
    .view{
      width:100%;
      height:100%;
    }
  }
</style>