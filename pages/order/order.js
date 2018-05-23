// pages/person/order/order.js
var app = getApp();
var request = require('../../utils/Request.js')
var MD5 = require('../../utils/md5.js')
var Login = require('../../utils/Login.js')

Page({
  data: {
    orderList: [],
    currentPage: 1,
    orderType: null,
    keyword: null,
    isLoad: true
  },
  onShow: function () {
    var that = this;

    if (that.data.isLoad) {
      that.queryOrderList();
      that.setData({ isLoad: false });
    }
  },
  onAllOrder: function () {
    var that = this;
    that.setData({ orderType: null, orderList: [], currentPage: 1, keyword: null });
    that.queryOrderList();
  },
  onUnPay: function () {
    var that = this;
    that.setData({ orderType: 'NOT_PAY', orderList: [], currentPage: 1, keyword: null });
    that.queryOrderList();
  },
  onUndelivery: function () {
    var that = this;
    that.setData({ orderType: 'PENDING_DELIVERY', orderList: [], currentPage: 1, keyword: null });
    that.queryOrderList();
  },
  onUnGoods: function () {
    var that = this;
    that.setData({ orderType: 'GOODS_TO_BE_RECEIVED', orderList: [], currentPage: 1, keyword: null });
    that.queryOrderList();
  },
  //跳转订单详情页面
  onOrderDetail: function (event) {
    var value = event.currentTarget.dataset.key;

    wx.navigateTo({
      url: '../orderDetail/orderDetail?id=' + value.order.orderId + '&backStatus=2'
    })
  },
  onSearchInput: function (e) {
    var that = this;
    that.setData({ keyword: e.detail.value, orderList: [], currentPage: 1 });
    that.queryOrderList();
  },
  //加载更多
  onLoadMore: function () {
    var that = this;
    that.data.currentPage += 1;
    that.queryOrderList();
  },
  //订单付款
  onPayOrder: function (e) {
    var that = this;
    var value = e.currentTarget.dataset.key;
    that.wechatPayOrder(value);
  },
  onDeliveryOrder: function (e) {
    var that = this;
    var value = e.currentTarget.dataset.key;

    let parameter = {
      orderId: value.orderId,
      orderStatus: 'COMPLETE_TRANSACTION'
    };

    wx.showLoading({
      title: '确认收货中...',
    })
    request.updateOrderStatus(parameter, function (data) {
      wx.hideLoading();
      that.queryOrderList();
    });
  },
  //查询订单列表
  queryOrderList: function () {
    var that = this;

    wx.showLoading();

    that.setData({ orderList: [] });

    let options = {
      pageNumber: that.data.currentPage,
      pageSize: 10,
      order: { orderStatus: that.data.orderType, orderSerialNumber: that.data.keyword },
    };

    request.queryOrderList(options, function (data) {
      for (var i = 0; i < data.result.resultList.length; i++) {
        var order = data.result.resultList[i].order;
        order.statusName = that.parseStatusName(order.orderStatus);

        var products = data.result.resultList[i].snapshots;
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
      }

      that.setData({ orderList: that.data.orderList.concat(data.result.resultList) })

      wx.hideLoading();

      if (data.resultList.length == 0) {
        if (that.data.orderList.length == 0) {
          wx.showToast({
            title: '未查询到任何订单',
            icon: 'none',
            duration: 2000
          })
        } else {
          wx.showToast({
            title: '全部订单加载完',
            icon: 'none',
            duration: 2000
          })
        }
      }
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
  wechatPayOrder: function (order) {
    var that = this;

    let options = {
      price: order.amountPayable * 100,
      mchId: '1499898872',
      webAppId: Login.ConfigData.miniProgramId,
      key: Login.ConfigData.wechatSecret,
      openId: Login.Customer.weChatUser.openId,
      orderId: order.orderId,
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
          that.queryOrderList();
        },
        'fail': function (res) {
          request.wechatCancelPayOrder({ orderId: order.orderId }, function (data) {
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