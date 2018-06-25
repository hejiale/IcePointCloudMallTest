// pages/person/person.js
var Login = require('../../utils/Login.js')
var app = getApp();

Page({
  data: {
    personLinkURL:'https://dev.icepointcloud.com/wx/userInfo?key='
  },
  onLoad: function () {
    var that = this;

    that.setData({ personLinkURL: that.data.personLinkURL + encodeURIComponent(Login.ConfigData.wechatAppKey) + '&from=mini'});

    console.log(that.data.personLinkURL);

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