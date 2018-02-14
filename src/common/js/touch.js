import Vue from 'vue'
//引入外部js
import 'hammerjs'


function vueTouch(el,type,binding){
	this.el = el;
	this.type = type;
	this.binding = binding;
	//直接调用
	var hammertime = new Hammer(this.el);
	hammertime.on(this.type,this.binding.value);
};

//包装成指令
['tab','swipeleft','swiperight','press','panleft','panright','panend','pan'].forEach(action=>{
    console.log(action);
    Vue.directive(action,{
        bind:function(el,binding){
            new vueTouch(el,action,binding);
        }
    });
})


//导出需要的指令
export{}
