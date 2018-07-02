// pages/person/person.js
var Login = require('../../utils/Login.js')
var app = getApp();

Page({
  data: {

  },
  onLoad: function() {
    var that = this;
    that.LoginComponent = that.selectComponent('#LoginComponent');
  },
  onShow: function() {
    var that = this;

    if (!that.data.isLoad) {
      Login.valityLogigStatus(function(e) {
        if (e) {
          wx.setNavigationBarTitle({
            title: '',
          })
          that.setData({
            isLogin: true
          });
          that.loadWebView();
        } else {
          wx.setNavigationBarTitle({
            title: '立即开卡',
          })
          that.setData({
            isLogin: false
          });
        }
        that.setData({isShow: true})
      })
    }
  },
  loadWebView: function() {
    var that = this;
    var personLinkURL = 'https://dev.icepointcloud.com/wx/userInfo?key=';

    var pages = getCurrentPages();

    var linkURL = personLinkURL + encodeURIComponent(Login.ConfigData.wechatAppKey) + '&from=mini';

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
  },
  onMyEvent: function(e) {
    console.log(e);
    this.onShow();
  }
})