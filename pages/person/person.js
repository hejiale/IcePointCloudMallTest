// pages/person/person.js
var Login = require('../../utils/Login.js')
var app = getApp();

Page({
  data: {
    personLinkURL: 'https://dev.icepointcloud.com/wx/userInfo?key='
  },
  onLoad: function() {
    Login.valityLogigStatus(function(e) {
      if (e == false) {
        wx.navigateTo({
          url: '../bindPhone/bindPhone',
        })
      }
    })
  },
  onShow: function() {
    var that = this;

    if (!that.data.isLoad) {
      Login.valityLogigStatus(function(e) {
        if (e) {
          that.loadWebView();
        }
      })
    }
  },
  loadWebView: function() {
    var that = this;

    var pages = getCurrentPages();

    var linkURL = that.data.personLinkURL + encodeURIComponent(Login.ConfigData.wechatAppKey) + '&from=mini';

    if (pages.length > 1) {
      linkURL = linkURL + '&back=true';
    }

    if (Login.Customer.weChatUserInfo) {
      linkURL = linkURL + '&phone=' + Login.Customer.weChatUserInfo.phoneNumber;
    }

    that.setData({
      personLinkURL: linkURL,
      isLoad: true
    });

    console.log(that.data.personLinkURL);
  }
})