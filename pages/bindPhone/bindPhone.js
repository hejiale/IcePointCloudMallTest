var Login = require('../../utils/Login.js')

Page({
  data: {},
  onLoad: function () {
    var that = this;

    that.LoginComponent = that.selectComponent('#LoginComponent');
  },
  onMyEvent: function (e) {
    console.log(e);

    wx.showLoading();

    Login.userLogin(function () {
      wx.hideLoading();
      wx.navigateBack();
    })
  }
})