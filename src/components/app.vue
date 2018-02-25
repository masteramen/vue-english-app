<template>
  <div id="app">

  <div :class="{ onmove:onmove, endmove:endmove }" style="position: relative;height:100%;">
    <slot></slot>


    <component  class="page listPage"   :class="{ show:true,prev:curPath!='/list'}"  :is="listPage" v-show="listPage!=null"
                :style="prevPath=='/list'&&prevTrans?{ [webkit+'transform']: webkit+prevTrans }:(curPath=='/list'&&currTrans?{ [webkit+'transform']: webkit+currTrans }:{})" ></component>

    <component id="settingsPage"  class="page settingsPage"   :class="{ show:curPath=='/settings',prev:prevPath=='/settings'}"  :is="settingsPage" v-show="settingsPage!=null"
                :style="prevPath=='/settings'&&prevTrans?{ [webkit+'transform']: webkit+prevTrans }:(curPath=='/settings'&&currTrans?{ [webkit+'transform']: webkit+currTrans }:{})" ></component>
    <component id="wordsPage"  class="page wordsPage"   :class="{ show:curPath=='/words',prev:prevPath=='/words'}"  :is="wordsPage"
               :style="prevPath=='/words'&&prevTrans?{ [webkit+'transform']: webkit+prevTrans }:(curPath=='/words'&&currTrans?{ [webkit+'transform']: webkit+currTrans }:{})" ></component>

    <component  class="page subscriptionPage"   :class="{ show:curPath=='/subscription',prev:prevPath=='/subscription'}"  :is="subscriptionPage" v-show="subscriptionPage!=null"
                :style="prevPath=='/subscription'&&prevTrans?{ [webkit+'transform']: webkit+prevTrans }:(curPath=='/subscription'&&currTrans?{ [webkit+'transform']: webkit+currTrans }:{})" ></component>


    <component  class="page detailPage"   :class="{ show:curPath=='/detail'}"  :is="detailPage" v-show="detailPage!=null"
             style="z-index: 10000"   :style="curPath=='/detail'&&currTrans?{ [webkit+'transform']: webkit+currTrans }:{}" ></component>



  </div>
  </div>
</template>

<script>
import '../css/page.css'
import {mapGetters, mapMutations, mapActions} from 'vuex'
const webkit = 'transform' in document.body.style ? '' : '-webkit-';


export default {
  name: 'app',
  data() {
  	return {
      webkit,
  	  prevPage: null,
      detailPage: null,
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

  .slide-enter, .slide-leave-to
    transform: translate3d(100%, 0, 0)
</style>
