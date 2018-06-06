
App({
  onLaunch: function (options) {

  },
  onShow:function(){
    this.globalData.isRequireLoad = true;
  },
  onHide:function(){
    console.log('hide');
  },
  getSystemInfo: function (cb) {
    var that = this;

    if (that.globalData.systemInfo) {
      typeof cb == "function" && cb(that.globalData.systemInfo)
    } else {
      wx.getSystemInfo({
        success: function (res) {
          that.globalData.systemInfo = res;
          typeof cb == "function" && cb(that.globalData.systemInfo)
        }
      })
    }
  },
  globalData: {
    systemInfo: null,
    isRequireLoad:false
  }  
})