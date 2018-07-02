// Component/OrderDetailComponent.js
var request = require('../../utils/Request.js')
var Login = require('../../utils/Login.js')
var Wechat = require('../../utils/Wechat.js')
var Config = require('../../utils/Config.js')
var app = getApp();

Component({
  /**
   * 组件的初始数据
   */
  data: {
    showFoot: 'hide',
    productList: [],
    isShowContent: 'hide',
    currentOrderId: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    showOrderDetail(orderId) {
      var that = this;

      that.setData({
        currentOrderId: orderId
      });
      that.queryOrderDetail();
    },

    onCall() {
      var that = this;

      wx.makePhoneCall({
        phoneNumber: that.data.orderDetail.order.netPointPhone,
      })
    },

    onCancleOrder() {
      var that = this;

      wx.showModal({
        title: '提示',
        content: '确认要取消该订单吗?',
        success: function (res) {
          if (res.confirm) {
            that.cancleOrderRequest();
          }
        }
      })
    },

    cancleOrderRequest() {
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

    onPayOrder() {
      var that = this;

      Wechat.wechatPayOrder(that.data.currentOrderId, that.data.orderDetail.order.amountPayable * 100, function (e) {
        if (e) {
          that.queryOrderDetail();

          var pages = getCurrentPages()
          var prevPage = pages[pages.length - 2]

          prevPage.setData({
            isLoad: true
          })
        }
      })
    },

    onDeliveryOrder() {
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
    queryOrderDetail() {
      var that = this;

      let parameter = {
        orderId: that.data.currentOrderId
      };
      // let parameter = {
      //   serialNumber: that.data.currentOrderId
      // };

      wx.showLoading();

      request.queryOrderDetail(parameter, function (data) {
        var order = data.result.order;
        order.statusName = Config.parseStatusName(order.orderStatus);

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
        wx.hideLoading();
      });
    }
  }
})
