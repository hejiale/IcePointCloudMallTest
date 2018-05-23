var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
var request = require('../../utils/Request.js')
var Login = require('../../utils/Login.js')
var qqmapsdk;
var app = getApp();

Page({
  data: {
    storeList: null,
    keyword: '',
    imageHeight: 0
  },
  onLoad: function () {
    var that = this;
    that.queryStoreList();

    app.getSystemInfo(function (systemInfo) {
      that.setData({
        imageHeight: (((systemInfo.windowWidth - 40) * 9) / 16),
      })
    })
  },
  onSelectStore: function (event) {
    console.log(event);

    var that = this;
    var item = event.currentTarget.dataset.key;

    var pages = getCurrentPages()
    var prevPage = pages[pages.length - 2]  //上一个页面

    prevPage.setData({
      currentStore: item
    })
    wx.navigateBack()
  },
  onMap: function (event) {
    console.log(event);

    var that = this;
    var item = event.currentTarget.dataset.key;

    //百度地图转腾讯地图坐标
    var demo = new QQMapWX({
      key: '7KFBZ-DM533-AJE3Q-YOEM3-ZLKOS-EGBBL'
    });

    demo.reverseGeocoder({
      location: {
        latitude: item.latitude,
        longitude: item.longitude
      },
      coord_type: 3,
      success: function (res) {
        var location = res.result.ad_info.location;

        wx.openLocation({
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lng),
        })
      }
    });
  },
  onSearchInput: function (event) {
    var that = this;
    that.setData({ keyword: event.detail.value, storeList: null });
    that.queryStoreList();
  },
  onCall: function (event) {
    console.log(event);

    var that = this;
    var item = event.currentTarget.dataset.key;

    wx.makePhoneCall({
      phoneNumber: item.phone,
    })
  },
  //查询门店列表
  queryStoreList: function () {
    var that = this;

    wx.getLocation({
      success: function (res) {
        //腾讯坐标转百度坐标
        wx.request({
          url: 'http://api.map.baidu.com/geoconv/v1/?coords=' + res.longitude + ',' + res.latitude + '&from=1&to=5&ak=5Bep8ZOHwOtQj7HVSPwm4u5cI8uiK71f',
          success: function (e) {
            that.queryStoreRequest(e.data.result[0]);
          }
        })
      }, fail: function (e) {
        that.queryStoreRequest(null);
      }
    })
  },
  //门店request
  queryStoreRequest: function (location) {
    var that = this;

    var options = {
      key: Login.ConfigData.wechatAppKey,
      keyword: that.data.keyword
    };

    if (location != null) {
      options.lat = location.y;
      options.lng = location.x;
    }

    wx.showLoading()

    request.queryStoreList(options, function (data) {
      if (data.result.content.length > 0) {
        for (var i = 0; i < data.result.content.length; i++) {
          var store = data.result.content[i];

          if (store.distance != null) {
            if (store.distance > 1000) {
              store.distance /= 1000;
              store.distanceStr = store.distance.toFixed(2) + 'km';
            } else {
              if (store.distance > 100) {
                store.distanceStr = store.distance.toFixed(0) + 'm';
              } else {
                store.distanceStr = '<100m';
              }
            }
          }
        }
        that.setData({ storeList: data.result.content });
      } else {
        wx.showToast({
          title: '未搜索到附近门店',
          icon: 'none'
        })
      }
      wx.hideLoading();
    });
  }
})

