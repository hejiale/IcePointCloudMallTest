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
        Customer.weChatUserInfo = data.result.weChatUserInfo;
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

function parseCompanyInfo(result) {
  Customer.companyId = result.wechatAccount.belongedCompany.id;//公司id
  ConfigData.wechatAppKey = result.key;//公众号key
  ConfigData.wechatSecret = result.wechatAccount.paySecret;//支付密钥
  ConfigData.wechatId = result.wechatAccount.appId;
}

var ConfigData = {
  //公众号key
  wechatAppKey: null,
  //公众号密钥
  wechatSecret: null,
  //公众号id 
  wechatId: null,
  //qq地图key
  qqMapKey: '7KFBZ-DM533-AJE3Q-YOEM3-ZLKOS-EGBBL'
}

var Customer = {
  sessionId: null,
  weChatAccount: null,
  weChatUserInfo: null,
  openId: null,
  companyId: null
}

module.exports = {
  userLogin: userLogin,
  valityLogigStatus: valityLogigStatus,
  parseCompanyInfo: parseCompanyInfo,
  ConfigData,
  Customer
}

