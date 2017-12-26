var appUpdate = {
        // Application Constructor
        initialize: function() {
            this.bindEvents();
        },
        // Bind any events that are required.
        // Usually you should subscribe on 'deviceready' event to know, when you can start calling cordova modules
        bindEvents: function() {
            document.addEventListener('deviceready', this.onDeviceReady, false);
            document.addEventListener('chcp_updateLoadFailed', this.onUpdateLoadError, false);
        },
        // deviceready Event Handler
        onDeviceReady: function() {
        },
        onUpdateLoadError: function(eventData) {
            var error = eventData.detail.error;
            
            // 当检测出外核版本有更新，// 针对不同平台进行相应更新操作
            if (error && error.code == chcp.error.APPLICATION_BUILD_VERSION_TOO_LOW) {
                var dialogMessage = '有新的版本,请下载更新';
                
                // iOS端 直接弹窗提示升级，点击ok后自动跳转
                if(ionic.Platform.isIOS()){
                    chcp.requestApplicationUpdate(dialogMessage, this.userWentToStoreCallback, this.userDeclinedRedirectCallback);
                //Android端 提示升级下载最新APK文件 
                } else if(ionic.Platform.isAndroid()){
                    //这儿放Android端更新代码...，在下面👇
                }
            }
        },
        userWentToStoreCallback: function() {
            // user went to the store from the dialog
        },
        userDeclinedRedirectCallback: function() {
            // User didn't want to leave the app.
            // Maybe he will update later.
        }
    };
    appUpdate.initialize();
