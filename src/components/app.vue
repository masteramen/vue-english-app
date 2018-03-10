<template>
  <div id="app">

  <div :class="{ onmove:onmove, endmove:endmove }" style="position: relative;height:100%;">
    <slot></slot>

    <div :is="item.component" class="page" :id="item.name.replace('/','')"   :class="{ show:curPath==item.name,prev:prevPath===item.name,keep:prevPath===item.name&&curPath=='/player',down:item.name=='/player'}"   v-show="item.component!=null"

         :style="prevPath===item.name&&prevTrans?{ [webkit+'transform']: webkit+prevTrans }:(curPath===item.name&&currTrans?{ [webkit+'transform']: webkit+currTrans }:{})"
         v-for="item in slides" ></div>

    <article-player></article-player>

  </div>
  </div>
</template>

<script>
import '../css/page.css'
import ArticlePlayer from './player-controll'
import Player from './player'
import {mapGetters, mapMutations, mapActions} from 'vuex'
const webkit = 'transform' in document.body.style ? '' : '-webkit-';

export default {
  name: 'app',
  data() {
  	return {
      slides:null,
      webkit,
  	  prevPage: null,
      detailPage: null,
      playerPage:null,
      settingsPage:null,
      subscriptionPage:null,
      wordsPage:null,
      listPage:null,
      onmove: false,
      endmove: false,
  	  isPrev: true,
  	  isShow: true,
      prevTrans: false,
  	  currTrans: false,
  	  goback: false,
      curPath:'/list',
      prevPath:''
  	}
  },
  computed: {
    ...mapGetters([
      'fullScreen',
      'playlist',
      'currentSong',
      'playing',
      'currentIndex',
      'mode',
      'sequenceList'
    ])
  },
  methods:{
    ...mapMutations({
      setFullScreen: 'SET_FULL_SCREEN'
    })
  },
  components: {
      ArticlePlayer,
      Player
  }
}
</script>

<style>
#app {
	overflow: hidden;
	position: relative;
	height: 100%;
  padding-top:20px;
  padding-top:constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom:constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  height:100%;
}
</style>
<style scoped lang="stylus" rel="stylesheet/stylus">
  .slide-enter-active, .slide-leave-active
    transition: all 0.3s

  .slide-enter.show, .slide-leave-to.show
    transform: translate3d(100%, 0, 0)

</style>
