var Login = require('../utils/Login.js')
var MD5 = require('../utils/md5.js')
var request = require('../utils/Request.js')
var app = getApp();

//微信支付
function wechatPayOrder(orderId, shouldPayPrice, callBack) {
  var that = this;

  let options = {
    price: shouldPayPrice,
    openId: Login.Customer.openId,
    orderId: orderId,
    appId: Login.ConfigData.wechatId,
    body: '商城消费'
  }

  request.wechatPayOrder(options, function (data) {
    console.log(data);

    var date = String(new Date().getTime()).substr(0, 10);

    wx.requestPayment({
      timeStamp: date,
      'nonceStr': data.nonce_str,
      'package': "prepay_id=" + data.prepay_id,
      'signType': 'MD5',
      'paySign': paySignData(data, date),
      'success': function (res) {
        typeof callBack == "function" && callBack(true);
      },
      'fail': function (res) {
        request.wechatCancelPayOrder({ orderId: orderId }, function (data) {
          typeof callBack == "function" && callBack(false);
        });
      }
    })
  })
}

//微信支付重签名
function paySignData(data, date) {
  var stringA = "appId=" + data.appid + "&nonceStr=" + data.nonce_str + "&package=prepay_id=" + data.prepay_id + "&signType=MD5" + "&timeStamp=" + date;

  var stringSignTemp = stringA + "&key=" + Login.ConfigData.wechatSecret;
  var sign = MD5.hexMD5(stringSignTemp).toUpperCase();
  return sign;
}


module.exports = {
  wechatPayOrder: wechatPayOrder
}
