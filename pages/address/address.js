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

    request.deleteAddress({ userAddressId: item.id }, function (data) {
      that.queryAddressList();
    });
  },
  onInsertNewAddress: function (e) {
    wx.navigateTo({
      url: '../editAddress/editAddress'
    })
  },
  onChooseWechatAddress: function () {
    var that = this;

    wx.chooseAddress({
      success: function (res) {
        //新增地址
        var weChatUserAddress = {
          name: res.userName,
          phone: res.telNumber,
          region: (res.provinceName + ' ' + res.cityName + ' ' + res.countyName),
          address: res.detailInfo
        };

        request.saveAddress(weChatUserAddress, function (data) {
          if (data.retCode == 2) {
            wx.showLoading({
              title: '保存地址失败',
              icon: 'none'
            })
          } else {
            that.queryAddressList();
          }
        });
      }, fail(res) {
        console.log(res);
        if (res.errMsg == "chooseAddress:fail auth deny") {
          wx.showModal({
            content: '检测到您未打开微信地址授权，开启后即可进行导入',
            confirmText: '去开启',
            cancelColor: '#333',
            confirmColor: '#333',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting({
                  success: (res) => {
                  }
                })
              }
            }
          })
        }
      }
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
      if (data.result.resultList == null && that.data.orderSelectAddressId && that.data.orderSelectAddressId != null) {
        var pages = getCurrentPages()
        var prevPage = pages[pages.length - 2]  //上一个页面

        prevPage.setData({
          currentAddress: null
        })
      }
      that.setData({ addressList: data.result.resultList });
      wx.hideLoading();
    });
  }
})