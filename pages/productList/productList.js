// pages/productList/productList.js
var Config = require('../../utils/Config.js')
var app = getApp()

Page({
  data: {
    templateObject: null,
    doubleLayoutHeight: 0,
    deviceWidth: 0
  },
  onLoad: function(){
    var that = this;
    
    Config.getImageAutoHeight(function (singleLayoutHeight, doubleLayoutHeight) {
      that.setData({
        doubleLayoutHeight: doubleLayoutHeight
      })
    });

    app.getSystemInfo(function (systemInfo) {
      that.setData({
        deviceWidth: systemInfo.windowWidth,
      })
    })
  },
  onGoodsDetail: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;

    wx.navigateTo({
      url: '../productDetail/productDetail?id=' + item.goodsId,
    })
  },
})