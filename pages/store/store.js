var request = require('../../utils/Request.js')
var MapLocation = require('../../utils/MapLocation.js')
var StoreRequest = require('../../utils/StoreRequest.js')
var app = getApp();

Page({
  data: {
    storeList: [],
    currentPage: 0
  },
  onLoad: function (options) {
    var that = this;

    app.getSystemInfo(function (systemInfo) {
      that.setData({
        imageHeight: (((systemInfo.windowWidth - 40) * 9) / 16),
        storeListHeight: (systemInfo.windowHeight - 50)
      })
    })

    that.setData({ currentAddress: options.address })
    that.queryStoreList();
  },
  onSelectStore: function (event) {
    var that = this;
    var item = event.currentTarget.dataset.key;

    var pages = getCurrentPages()
    var prevPage = pages[pages.length - 2]  //上一个页面

    prevPage.setData({
      currentStore: item
    })
    wx.navigateBack()
  },
  //--------------加载更多（提前加载）----------------//
  onLoadMore: function () {
    var that = this;
    that.data.currentPage += 1;
    that.queryStoreList();
  },
  onMap: function (event) {
    console.log(event);

    var that = this;
    var item = event.currentTarget.dataset.key;

    MapLocation.mapPosition(item);
  },
  onSearchInput: function (event) {
    var that = this;
    that.setData({
      keyword: event.detail.value,
      storeList: [],
      currentPage: 0
    });
    that.queryStoreList();
  },
  onCall: function (event) {
    var that = this;
    var item = event.currentTarget.dataset.key;

    wx.makePhoneCall({
      phoneNumber: item.phone,
    })
  },
  //查询门店列表
  queryStoreList: function () {
    var that = this;

    MapLocation.queryMapLocation(that.data.currentAddress, function (location) {
      that.queryStoreRequest(location);
    });
  },
  queryStoreRequest: function (location) {
    var that = this;

    if (that.data.currentPage == 0) {
      that.setData({ isEndLoad: false });
    }

    StoreRequest.queryStoreRequest(location, that.data.keyword, that.data.currentPage, 20, function (result) {
      if (result.content.length > 0) {
        that.setData({ storeList: that.data.storeList.concat(result.content) });

        if (that.data.storeList.length > 0 && result.content.length == 0) {
          that.setData({ isEndLoad: true });
        }
      } else {
        wx.showToast({
          title: '未搜索到附近门店',
          icon: 'none'
        })
      }
    });
  }
})

