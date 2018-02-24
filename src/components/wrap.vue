<template>
	
<div ref="wrap" class="scroll-wrap" :style="{ height: wrapH}" :id="wrapId">
	<div class="scroll-con" :style="{ minHeight: wrapH}">
		<slot></slot>
	</div>
</div>

</template>

<script>
import iscroll from '../js/iscroll'

export default {
	name: 'wrap',
	props: {
		height: null,
		id: String,
	},
	computed: {
		wrapH() {
			let h = 'auto';
			if(this.height) {
				h = this.height + 'px';
			}
			return h;
		},
		wrapId() {
			var id = this.id || Date.now();
			return `wrap-${id}`;
		}
	},
	methods: {
		refresh() {
			// console.log('refresh')
			this.$nextTick(() => {
				if (!this.scroll) {
					this.scroll = new iscroll(this.wrapId, {hScrollbar: false,vScrollbar: this.vScrollbar});
				}
				else this.scroll.refresh();
			})
		}
	},
	mounted() {
		this.refresh()
	},
	updated() {
		// console.log('updated')
		if(this.scroll) this.refresh()
	}
}

</script>