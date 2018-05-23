// pages/orderDetail/orderDetail.js
var request = require('../../utils/Request.js')
var MD5 = require('../../utils/md5.js')
var Login = require('../../utils/Login.js')
var app = getApp();

Page({
  data: {
    orderDetail: null,
    showFoot: 'hide',
    productList: [],
    isShowOpmetory: 'hide',
    isShowContent: 'hide',
    defaultOpmetory: null,
    isShowMemberRights: 'hide',
    backMethod: null,
    currentOrderId: ''
  },
  onLoad: function (options) {
    var that = this;

    that.setData({
      backMethod: options.backStatus,
      currentOrderId: options.id
    });
    that.queryOrderDetail();
  },
  onCall: function () {
    var that = this;

    wx.makePhoneCall({
      phoneNumber: that.data.orderDetail.order.netPointPhone,
    })
  },
  onUnload: function () {
    var that = this;

    if (that.data.backMethod == 0 || that.data.backMethod == 1) {
      wx.navigateBack({
        delta: 1
      })
    }
  },
  onCancleOrder: function () {
    var that = this;

    let parameter = {
      orderId: that.data.currentOrderId,
      orderStatus: 'CLOSED'
    };

    wx.showLoading({
      title: '取消订单中...',
    })
    request.updateOrderStatus(parameter, function (data) {
      wx.hideLoading();
      that.queryOrderDetail();

      var pages = getCurrentPages()
      var prevPage = pages[pages.length - 2]

      prevPage.setData({
        isLoad: true
      })
    });
  },
  onPayOrder: function () {
    var that = this;
    that.wechatPayOrder();
  },
  onDeliveryOrder: function () {
    var that = this;

    let parameter = {
      orderId: that.data.currentOrderId,
      orderStatus: 'COMPLETE_TRANSACTION'
    };

    wx.showLoading({
      title: '确认收货中...',
    })
    request.updateOrderStatus(parameter, function (data) {
      wx.hideLoading();
      that.queryOrderDetail();

      var pages = getCurrentPages()
      var prevPage = pages[pages.length - 2]

      prevPage.setData({
        isLoad: true
      })
    });
  },
  //查询订单详情
  queryOrderDetail: function () {
    var that = this;

    let parameter = {
      orderId: that.data.currentOrderId
    };

    // wx.showLoading();

    request.queryOrderDetail(parameter, function (data) {
      var order = data.result.order;
      order.statusName = that.parseStatusName(order.orderStatus);

      var products = data.result.snapshots;

      for (var j = 0; j < products.length; j++) {
        var goods = products[j];
        if (goods.models.length > 0) {

          var appendStr = '';
          for (var z = 0; z < goods.models.length; z++) {
            var spec = goods.models[z];
            appendStr += spec.specificationName + ':' + spec.specificationValue + ' ';
            goods.specification = appendStr;
          }
        }
      }

      that.setData({ orderDetail: data.result, isShowContent: '' });
      // wx.hideLoading();
    });
  },
  parseStatusName: function (status) {
    if (status == 'NOT_PAY') {
      return '未支付';
    } else if (status == 'PENDING_DELIVERY') {
      return '待发货';
    } else if (status == 'GOODS_TO_BE_RECEIVED') {
      return '待收货';
    } else if (status == 'COMPLETE_TRANSACTION') {
      return '交易完成';
    } else if (status == 'CLOSED') {
      return '交易关闭';
    }
  },
  //微信支付
  wechatPayOrder: function () {
    var that = this;

    let options = {
      price: that.data.orderDetail.order.amountPayable * 100,
      mchId: '1499898872',
      webAppId: Login.ConfigData.miniProgramId,
      key: Login.ConfigData.wechatSecret,
      openId: Login.Customer.weChatUser.openId,
      orderId: that.data.currentOrderId,
      webappSecret: Login.ConfigData.miniProgramSecret,
      body: '冰点云线上商城测试-'
    }

    request.wechatPayOrder(options, function (data) {
      console.log(data);

      var date = String(new Date().getTime()).substr(0, 10);

      wx.requestPayment({
        timeStamp: date,
        'nonceStr': data.nonce_str,
        'package': "prepay_id=" + data.prepay_id,
        'signType': 'MD5',
        'paySign': that.paySignData(data, date),
        'success': function (res) {
          that.queryOrderDetail();

          var pages = getCurrentPages()
          var prevPage = pages[pages.length - 2]

          prevPage.setData({
            isLoad: true
          })
        },
        'fail': function (res) {
          request.wechatCancelPayOrder({ orderId: that.data.currentOrderId }, function (data) {
            console.log(data)
          });
        }
      })
    })
  },
  //微信支付重签名
  paySignData: function (data, date) {
    var stringA = "appId=" + data.appid + "&nonceStr=" + data.nonce_str + "&package=prepay_id=" + data.prepay_id + "&signType=MD5" + "&timeStamp=" + date;

    var stringSignTemp = stringA + "&key=" + Login.ConfigData.wechatSecret;
    var sign = MD5.hexMD5(stringSignTemp).toUpperCase();
    return sign;
  }
})