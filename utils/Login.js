var app = getApp();
var request = require('../utils/Request.js')

//用户登录
function userLogin(cb) {
  var that = this;

  wx.login({
    success: function (res) {
      let options = {
        jsCode: res.code,
        appid: ConfigData.wechatId
      };

      request.login(options, function (data) {
        //保存客户登录信息
        Customer.openId = data.result.weChatUserInfo.weChatUserKey.openId;
        Customer.weChatAccount = data.result.weChatAccountObject.wechatAccount;
        //登录sessionId
        request.setSessionId(data.result.sessionId);

        typeof cb == "function" && cb(data.result.weChatUserInfo.customer);
      });
    }
  });
}
//校验用户登录状态
function valityLogigStatus(cb) {
   wx.showLoading();

  var that = this;
  request.valityLoginStatus(function (data) {
    if (data.retCode == 201 || data.retCode == 203) {
      userLogin(function (customer) {
        wx.hideLoading();
        
        if (customer != null) {
          typeof cb == "function" && cb(true);
        } else {
          typeof cb == "function" && cb(false);
        }
      })
    } else {
      wx.hideLoading();
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
  //qq地图key
  qqMapKey: '7KFBZ-DM533-AJE3Q-YOEM3-ZLKOS-EGBBL'
}

var Customer = {
  sessionId: null,
  weChatAccount: null,
  openId: null,
  companyId: null
}

module.exports = {
  userLogin: userLogin,
  valityLogigStatus: valityLogigStatus,
  ConfigData,
  Customer
}

