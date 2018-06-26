// pages/person/order/order.js
var app = getApp();
var request = require('../../utils/Request.js')
var Wechat = require('../../utils/Wechat.js')
var Login = require('../../utils/Login.js')
var Config = require('../../utils/Config.js')

Page({
  data: {
    orderList: [],
    currentPage: 1,
    isLoad: true
  },
  onLoad: function () {
    var that = this;

    app.getSystemInfo(function (systemInfo) {
      that.setData({
        scrollHeight: (systemInfo.windowHeight - 100)
      })
    })
  },
  onShow: function () {
    var that = this;

    if (that.data.isLoad) {
      that.setData({ isLoad: false, orderList: [] });
      that.queryOrderList();
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
    // wx.navigateTo({
    //   url: '../orderDetail/orderDetail?id=' + value.order.orderSerialNumber + '&backStatus=2'
    // })
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

    Wechat.wechatPayOrder(value.orderId, value.amountPayable * 100, function (e) {
      if (e) {
        that.setData({ isLoad: false, orderList: [] });
        that.queryOrderList();
      }
    })
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

      that.setData({ isLoad: false, orderList: [] });
      that.queryOrderList();
    });
  },
  //查询订单列表
  queryOrderList: function () {
    var that = this;

    if (that.data.currentPage == 1) {
      that.setData({ isEndLoad: false });
    }

    let options = {
      pageNumber: that.data.currentPage,
      pageSize: 10,
      order: { orderStatus: that.data.orderType, orderSerialNumber: that.data.keyword },
    };

    wx.showLoading();

    request.queryOrderList(options, function (data) {
      for (var i = 0; i < data.result.resultList.length; i++) {
        var order = data.result.resultList[i].order;
        order.statusName = Config.parseStatusName(order.orderStatus);

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

      if (data.result.resultList.length == 0 && that.data.orderList.length > 0) {
        that.setData({ isEndLoad: true });
      }

      wx.hideLoading();
    });
  }
})