var app = getApp();
var request = require('../utils/Request.js')

//用户登录
function userLogin(cb) {
  var that = this;

  wx.login({
    success: function (res) {

      let options = {
        jsCode: res.code,
        appid: ConfigData.wechatId,
        webappId: ConfigData.miniProgramId,
        webappSecret: ConfigData.miniProgramSecret
      };

      request.login(options, function (data) {

        //保存客户登录信息
        Customer.customer = data.result.weChatUserInfo.customer;
        Customer.weChatUser = data.result.weChatUserInfo.weChatUserKey;
        Customer.weChatAccountObject = data.result.weChatAccountObject;

        request.setSessionId(data.result.sessionId);

        typeof cb == "function" && cb(Customer.customer);
      });
    }
  });
}
//校验用户登录状态
function valityLogigStatus(cb) {
  var that = this;

  request.valityLoginStatus(function (data) {
    if (data.retCode == 201 || data.retCode == 203) {
      typeof cb == "function" && cb(false);
    } else {
      typeof cb == "function" && cb(true);
    }
  });
}

var ConfigData = {
  //公众号key
  wechatAppKey: 'FCtwvJYVNagFHA+a0IJbNxTSsxFoLTy6CFzpKDmPnc8=',
  //公众号密钥
  wechatSecret: 'E1AF5770A1770C4C572415DA17306504',
  //公众号id 
  wechatId: 'wxb6c27db2d85fd508',
  //小程序id
  miniProgramId: 'wx6703326230ba4ecd',
  //小程序密钥
  miniProgramSecret: '3a6e2fa8d571ef86ceb626071ab83474',
}

var Customer = {
  sessionId: null,
  weChatAccountObject: null,
  customer: null,
  weChatUser: null,
  companyId: null
}

module.exports = {
  userLogin: userLogin,
  valityLogigStatus: valityLogigStatus,
  ConfigData,
  Customer
}

