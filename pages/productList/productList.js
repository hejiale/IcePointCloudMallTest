// pages/productList/productList.js
var Config = require('../../utils/Config.js')
var request = require('../../utils/Request.js')
var app = getApp()

Page({
  data: {

  },
  onLoad: function (options) {
    var that = this;

    that.setData({ templateId: options.id });

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

    that.queryTemplateDetail();
  },
  onShow: function () {
    var that = this;

    var pages = getCurrentPages();
    if (pages.length == 1) {
      that.setData({ isFromShare: true });
    }else{
      if (app.globalData.isRequireLoad) {
        app.globalData.isRequireLoad = false;
      }
    }
    that.queryTemplateDetail();
  },
  onGoodsDetail: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;

    wx.navigateTo({
      url: '../productDetail/productDetail?id=' + item.goodsId,
    })
  },
  onShareAppMessage: function (res) {
    var that = this;
    return {
      title: that.data.templateObject.mainTitle,
      path: '/pages/productList/productList?id=' + that.data.templateId
    }
  },
  onToHomePage: function () {
    app.globalData.menuScene = null;

    wx.reLaunch({
      url: '../home/home'
    })
  },
  queryTemplateDetail: function () {
    var that = this;

    wx.showLoading();

    request.getTemplateDetail({ tid: that.data.templateId }, function (data) {
      if (data.retCode == 400) {
        that.setData({ isEmpty: true });
      } else {
        if (data.result.mainTitle.length > 0){
          wx.setNavigationBarTitle({
            title: data.result.mainTitle,
          })
        }else{
          wx.setNavigationBarTitle({
            title: "专场详情",
          })
        }
        
        that.setData({ templateObject: data.result });
      }
      wx.hideLoading();
    })
  }
})