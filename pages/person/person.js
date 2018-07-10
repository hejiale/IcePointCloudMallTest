// pages/person/person.js
var Login = require('../../utils/Login.js')
var request = require('../../utils/Request.js')
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
      if(Login.ConfigData.wechatId == null){
        request.getCompanyInfo(function (data) {
          Login.parseCompanyInfo(data.result);
          that.onLogin();
        });
      }else{
        that.onLogin();
      }
    }
  },
  onLogin:function(){
    var that = this;

    Login.valityLogigStatus(function (e) {
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
      that.setData({ isShow: true })
    })
  },
  loadWebView: function() {
    var that = this;
    var personLinkURL = app.globalData.HostURL + '/wx/userInfo?key=';

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
  },
  bindGetMsg:function(e){
    console.log(e);
  }
})