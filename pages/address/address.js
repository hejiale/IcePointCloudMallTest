// pages/person/address/address.js
var request = require('../../utils/Request.js')
var Login = require('../../utils/Login.js')
var app = getApp();

Page({
  data: {
    
  },

  onLoad: function (options) {
    var that = this;
    that.setData({ orderSelectAddressId: options.id });
  },
  onShow: function () {
    var that = this;

    Login.valityLogigStatus(function (e) {
      if (e == false) {
        Login.userLogin(function (customer) {
          if (customer != null) {
            that.queryAddressList();
          } else {
            wx.navigateTo({
              url: '../bindPhone/bindPhone',
            })
          }
        });
      } else {
        that.queryAddressList();
      }
    })
  },
  onSetDefault: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;

    request.setDefaultAddress({ userAddressId: item.id }, function (data) {
      that.queryAddressList();
    });
  },
  editAddress: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;

    wx.navigateTo({
      url: '../editAddress/editAddress?id=' + item.id
    })
  },
  onDeleteAddress: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;

    if (that.data.orderSelectAddressId == item.id && that.data.orderSelectAddressId != null) {
      wx.showToast({
        title: '当前选中的地址不可删除',
        icon: 'none'
      })
      return;
    }

    request.deleteAddress({ userAddressId: item.id }, function (data) {
      that.queryAddressList();
    });
  },
  onInsertNewAddress: function (e) {
    wx.navigateTo({
      url: '../editAddress/editAddress'
    })
  },
  onChooseAddress: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;

    var pages = getCurrentPages()
    var prevPage = pages[pages.length - 2]  //上一个页面

    prevPage.setData({
      currentAddress: item
    })
    wx.navigateBack()
  },
  queryAddressList: function () {
    var that = this;

    let options = {
      pageNo: 1,
      maxPageSize: 100
    };

    wx.showLoading({});

    request.queryAddressList(options, function (data) {
      that.setData({ addressList: data.result.resultList });
      wx.hideLoading();
    });
  }
})