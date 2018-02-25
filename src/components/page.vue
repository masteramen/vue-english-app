<template>
	<div>
		<div class="navbar bdb" v-if="!noNavBar">
      <div style="position: relative;height:44px;">
			<!-- 头部导航条 -->
			<slot name="navbar">
				<!-- 左边返回键按钮 -->
				<slot name="back">
					<div class="item back" :class="{ no_arrow:noBackArrow||this.backTxt=='取消' }"
						@click="onNavBack" v-if="!noBack">
						<i class="arrow"></i>
						<span class="txt y_center">{{backTxt}}</span>
					</div>
				</slot>
				<!-- 中间标题 -->
				<h1 class="pos_center">{{title}}</h1>
				<!-- 右边菜单按钮 -->
				<slot name="menu">
					<div class="item menu" v-if="menuIcon||menuTxt">
						<span class="txt pos_center">
							<i :class="`icon-${menuIcon}`" v-if="menuIcon"></i>
							{{menuTxt}}
						</span>
					</div>
				</slot>

			</slot>
      </div>
		</div>

		<!-- 可滚动内容区域 -->
		<div class="page-wrap" :style="{ height: wrapH+'px' }" v-if="$slots.con">
			<div class="page-con">
				<slot name="con"></slot>
			</div>
		</div>
    <slot></slot>
		<!-- 底部自定义 -->
		<slot name="btm"></slot>

	</div>
</template>
<script>
const config = {
	noNavBar: false,
}
let getClientHeight = _ => document.documentElement.clientHeight;

export default {
	name: 'page',
	data() {
		return {
			clientHeight: getClientHeight(),
			siblingsHeight: 44,
		}
	},
	props: {
		title: { type:String },
		backTxt: { type:String, default: '返回' },
		menuTxt: { type:String },
		menuIcon: { type:String },
		noBack: { type:Boolean },
		onBack: { type:Function },
		noBackArrow: { type:Boolean },
		vScrollbar: { type:Boolean },
		noNavBar: { type:Boolean, default: config.noNavBar },
	},
	computed: {
		wrapH() {
			return this.clientHeight - this.siblingsHeight;
		},
		wrapId() {
			return this.$parent.$vnode.tag.replace('vue-component-', '');
		}
	},
	methods: {
		onNavBack() {
			if(typeof this.onBack=='function') this.onBack();
			else this.$router.back();
		},
	},
	created() {
		window.onresize = _ => {
			this.clientHeight = getClientHeight();
		}
	}
}
</script>

