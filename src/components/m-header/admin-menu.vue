<template>
    <div class="_cover-top">
        <div class="other">
            <span class="icon-more icon"  @click.stop="tap()"></span>
            <ul class="tips-menu" :class="tips_isOpen?'tips-open':'tips-close'">
                <li v-for="(item ,index) in menuArr" @touchend="selectItem(item,index)" >

                    <span class="iconfont" :class="item.iconClass"></span>
                    <div v-text="item.text"></div>
                </li>
            </ul>
            <div class="tips-masker" v-show="tips_isOpen"></div>
        </div>
    </div>
</template>
<script>
import Bus from 'common/js/bus'
import {mapMutations,mapGetters} from 'vuex'
export default {
    data() {
        return {
            tips_isOpen: false,
            menuArr: [{
                text: '编辑模式',
                name:'editModel',
                iconClass: 'icon-download',
            },
              {
                text: '保存更新',
                name:'saveRemote',
                iconClass: 'icon-refresh'
            }
              ,
              {
                text: '删除',
                name:'saveRemote',
                iconClass: 'icon-refresh'
              }
            ]
        }
    },
    created() {
        var self = this;
        $('body').on('touchend', function() {
          self.tips_isOpen = false;
        })
    },
    methods: {
        tap() {
            event.stopPropagation();
            this.tips_isOpen = !this.tips_isOpen
        },
      selectItem(item,index){
        if(item.name ==='editModel'){
          this.setEditMode(!this.editMode)
        }else Bus.$emit(item.name, item.name);
      },
      ...mapMutations({
        setEditMode: 'SET_EDIT_MODE'
      })

    },
  computed: {
  ...mapGetters([
    'editMode'
  ])
  }
}
</script>
<style scoped>
.center {
    margin: 0 auto;
    text-align: center;
}

.other {
    position: absolute;
    right: 15px;
    top:6px;

}

.other .iconfont {
    font-size: 22px;
}

.other .tips-masker {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 1;
    top: 45px;
    bottom: 50px;
}

.other .tips-menu {
    position: absolute;
    z-index: 2;
    width: 133px;
    font-size: 16px;
    right: -10px;
    top: 54px;
    text-align: left;
    border-radius: 2px;
    background-color: #49484b;
    padding: 0 15px;
    transform-origin: 90% 0%;
}

.tips-open {
    transition: initial;
    opacity: 1;
}

.tips-close {
    opacity: 0;
    transition: .2s opacity ease, .6s transform ease;
    transform: scale(0);
}

.other .tips-menu li {
    position: relative;
    height: 40px;
    line-height: 40px;
}

.other .tips-menu li:not(:last-child)::after {
    content: "";
    width: 200%;
    position: absolute;
    bottom: 0;
    left: 0;
    height: 1px;
    background-color: #5b5b5d;
    transform: scale(.5);
    transform-origin: 0 100%;
}

.other .tips-menu::before {
    width: 0;
    height: 0;
    position: absolute;
    top: -8px;
    right: 15px;
    content: "";
    border-width: 0 6px 8px;
    border-color: rgba(0, 0, 0, 0) rgba(0, 0, 0, 0) #49484b rgba(0, 0, 0, 0);
    border-style: solid;
}

.other .tips-menu .iconfont {
    float: left;
    font-size: 16px;
}

.other .tips-menu .iconfont {
    margin-right: 15px;
}
.other .tips-menu .iconfont.icon-download,.other .tips-menu .iconfont.icon-refresh{
  height: 40px;
  line-height: 40px;
  font-size:22px;
}
</style>
