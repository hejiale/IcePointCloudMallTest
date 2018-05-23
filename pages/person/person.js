// pages/person/person.js
var app = getApp();

Page({
  data: {
    userInfo: null,
    memberCustomer: null
  },
  onLoad: function () {
    var that = this;

    // wx.showLoading()

    // app.getUserInfo(function (userInfo) {
    //   that.setData({
    //     userInfo: userInfo
    //   })
    // })

    // app.userLogin(function () {
    //   that.setData({
    //     memberCustomer: app.globalData.customer
    //   })
    //   wx.hideLoading();
    // })
  }
})