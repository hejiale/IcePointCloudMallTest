// pages/person/person.js
var Login = require('../../utils/Login.js')
var app = getApp();

Page({
  data: {
    personLinkURL:'https://dev.icepointcloud.com/wx/userInfo?key='
  },
  onLoad: function () {
    var that = this;

    that.setData({ personLinkURL: that.data.personLinkURL + encodeURIComponent(Login.ConfigData.wechatAppKey) + '&from=mini' + '&back=true'});

    console.log(that.data.personLinkURL);
  },
  bindGetMsg: function (e) {
    wx.reLaunch({
      url: '../home/home'
    })
  }
})