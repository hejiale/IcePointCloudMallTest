var MapLocation = require('../../utils/MapLocation.js')
var StoreRequest = require('../../utils/StoreRequest.js')
var request = require('../../utils/Request.js')
var Login = require('../../utils/Login.js')
var Config = require('../../utils/Config.js')
var Wechat = require('../../utils/Wechat.js')
var app = getApp();

Page({
  data: {
    productList: [],
    pickUpStyle: [],
    //下单信息
    payInfo: {
      totalPrice: 0,
      shouldPayPrice: 0,
      discountPrice: 0,
      balancePrice: 0,
      pointPrice: 0,
      //当前剩余应付金额
      inputShouldPrice: 0,
      inputValue: '',
      inputPointPrice: 0,
      useBalance: 0,
      usePoint: 0,
      //按钮status
      canPayStaus: true
    }
  },
  onLoad: function (options) {
    var that = this;
    that.setData({ isFromCart: options.isFromCart });

    wx.showLoading();
    //获取会员信息
    request.getMemberInfo(function (data) {
      that.setData({ 'payInfo.memberInfo': data.result });
      //处理商品数据
      that.setData({ productList: Config.Config.orderProducts });
      that.getCartTotalPrice();
      that.queryMemberCardRequest();
    });

    //获取客户默认地址
    request.getDefaultAddress(function (data) {
      if (data.result != null) {
        that.setData({
          currentAddress: data.result,
          preAddress: data.result.region + data.result.address
        });
      }
      //获取提货方式
      request.queryPickupStatus(function (data) {
        if (data.result.length > 0) {
          that.setData({ pickUpStyle: data.result, pickUp: data.result[0] });
        }
        that.queryStoreList();
      });
    });
  },
  onShow: function () {
    var that = this;
    if (that.data.isShowContent && that.data.preAddress != (that.data.currentAddress.region + that.data.currentAddress.address)) {
      that.setData({ preAddress: (that.data.currentAddress.region + that.data.currentAddress.address) });
      that.queryStoreList();
    }
  },
  onSelectAddress: function () {
    var that = this;

    if (that.data.currentAddress != null) {
      wx.navigateTo({
        url: '../address/address?id=' + that.data.currentAddress.id,
      })
    } else {
      wx.navigateTo({
        url: '../address/address',
      })
    }
  },
  onSelectStore: function () {
    var that = this;

    //邮寄传送货地址
    if (that.data.pickUp == 'MAIL') {
      wx.navigateTo({
        url: '../store/store?address=' + that.data.currentAddress.region + that.data.currentAddress.address,
      })
    } else {
      wx.navigateTo({
        url: '../store/store',
      })
    }
  },
  onCall: function () {
    var that = this;

    wx.makePhoneCall({
      phoneNumber: that.data.currentStore.phone,
    })
  },
  //下单
  onOfferOrder: function () {
    var that = this;

    if (that.data.currentAddress == null) {
      wx.showToast({
        title: '请选择联系人信息!',
        icon: 'none'
      })
      return;
    }

    var order = {
      pickUpGoodsType: that.data.pickUp,
      addressId: that.data.currentAddress.id,
      amountPayable: parseFloat(that.data.payInfo.shouldPayPrice).toFixed(2),
      discount: that.data.payInfo.memberInfo.mallCustomer.discount,
      discountPrice: parseFloat(that.data.payInfo.discountPrice).toFixed(2),
      integral: that.data.payInfo.usePoint,
      integralPrice: that.data.payInfo.pointPrice,
      balance: parseFloat(that.data.payInfo.useBalance).toFixed(2),
      balancePrice: parseFloat(that.data.payInfo.balancePrice).toFixed(2)
    }

    if (that.data.currentStore != null) {
      order.netPointId = that.data.currentStore.id
    }

    var orderParameter = {
      order: order
    };

    var products = [];
    var carts = [];

    for (var i = 0; i < that.data.productList.length; i++) {
      var item = that.data.productList[i];
      if (item.specifications != null) {
        products.push({
          specificationsId: item.specifications.id,
          count: item.shoppingCart.count
        });
      } else {
        products.push({
          goodsId: item.goods.goodsId,
          count: item.shoppingCart.count
        });
      }
      if (item.shoppingCart.cartId) {
        carts.push(item.shoppingCart.cartId);
      }
    }
    orderParameter.goodsOrders = products;
    orderParameter.cartIds = carts;

    Login.valityLogigStatus(function (e) {
      if (e) {
        that.offerOrderRequest(orderParameter);
      }
    })
  },
  //show 输入储值余额 积分
  onShowInputBalance: function () {
    var that = this;
    that.setData({
      isShowMemberRights: true,
      'payInfo.isInputPoint': false,
      'payInfo.inputShouldPrice': that.data.payInfo.shouldPayPrice
    });

    if (that.data.payInfo.useBalance > 0) {
      that.setData({ 'payInfo.inputValue': that.data.payInfo.useBalance });
    } else {
      that.setData({ 'payInfo.inputValue': '' });
    }

    that.setData({
      'payInfo.overcapStatus': false,
      'payInfo.upBalanceStatus': false,
      'payInfo.canPayStaus': true
    })
  },
  onShowInputPoint: function () {
    var that = this;
    that.setData({
      isShowMemberRights: true,
      'payInfo.isInputPoint': true,
      'payInfo.inputShouldPrice': that.data.payInfo.shouldPayPrice
    });

    if (that.data.payInfo.usePoint > 0) {
      that.setData({
        'payInfo.inputValue': that.data.payInfo.usePoint,
        'payInfo.inputPointPrice': that.data.payInfo.pointPrice
      });
    } else {
      that.setData({ 'payInfo.inputValue': '' });
    }

    that.setData({
      'payInfo.overcapStatus': false,
      'payInfo.upBalanceStatus': false,
      'payInfo.canPayStaus': true
    })
  },
  onCoverClicked: function (e) {
    this.setData({ isShowMemberRights: false });
  },
  //切换提货方式
  onExtractStyle: function () {
    var that = this;
    if (that.data.pickUp == 'MAIL') {
      that.setData({ pickUp: 'PICK_UP_IN_A_STORE' });
    } else {
      that.setData({ pickUp: 'MAIL' });
    }

    wx.showLoading();
    that.queryStoreList();
  },
  //会员权益 积分储值输入框操作
  textFieldInput: function (event) {
    console.log(event);
    var that = this;
    var str = event.detail.value;
    var isCan = false;

    that.setData({
      'payInfo.overcapStatus': false,
      'payInfo.upBalanceStatus': false,
      'payInfo.canPayStaus': false
    })

    //输入积分操作
    if (that.data.payInfo.isInputPoint) {
      //积分兑换金额
      var pointMoney = (parseInt(str) * that.data.payInfo.memberInfo.integralTrade.money) / that.data.payInfo.memberInfo.integralTrade.integral_sum;

      //最大应付金额
      var shouldMoney = parseFloat(that.data.payInfo.totalPrice) - parseFloat(that.data.payInfo.discountPrice) - parseFloat(that.data.payInfo.balancePrice);

      if (parseInt(str) > parseInt(that.data.payInfo.memberInfo.mallCustomer.integral)) {
        that.setData({ 'payInfo.upBalanceStatus': true })
      } else if (pointMoney > shouldMoney) {
        that.setData({ 'payInfo.overcapStatus': true })
      } else {
        that.setData({
          'payInfo.canPayStaus': true,
          'payInfo.inputValue': str
        })
        isCan = true;
      }
    } else {
      //输入储值金额操作
      var shouldPay = parseFloat(that.data.payInfo.totalPrice) - parseFloat(that.data.payInfo.discountPrice) - parseFloat(that.data.payInfo.pointPrice);

      if (parseFloat(str) > parseFloat(that.data.payInfo.memberInfo.mallCustomer.balance)) {
        that.setData({ 'payInfo.upBalanceStatus': true })
      } else if (parseFloat(str) > shouldPay.toFixed(2)) {
        that.setData({ 'payInfo.overcapStatus': true })
      } else {
        that.setData({
          'payInfo.canPayStaus': true,
          'payInfo.inputValue': str
        })
        isCan = true;
      }
    }

    if (isCan) {
      if (that.data.payInfo.isInputPoint) {
        //积分兑换金额
        var exchangePrice = (parseFloat(that.data.payInfo.inputValue.length > 0 ? that.data.payInfo.inputValue : 0) * that.data.payInfo.memberInfo.integralTrade.money) / that.data.payInfo.memberInfo.integralTrade.integral_sum;
        //剩余支付金额
        var shouldMoney = parseFloat(that.data.payInfo.totalPrice) - parseFloat(that.data.payInfo.discountPrice) - parseFloat(that.data.payInfo.balancePrice) - exchangePrice;

        that.setData({ 'payInfo.inputShouldPrice': shouldMoney.toFixed(2), 'payInfo.inputPointPrice': exchangePrice.toFixed(2) });

      } else {
        //剩余支付金额
        var shouldPay = parseFloat(that.data.payInfo.totalPrice) - parseFloat(that.data.payInfo.discountPrice) - parseFloat(that.data.payInfo.pointPrice) - parseFloat(str.length > 0 ? str : 0);
        that.setData({ 'payInfo.inputShouldPrice': shouldPay.toFixed(2) });
      }
    } else {
      that.setData({
        'payInfo.inputShouldPrice': that.data.payInfo.shouldPayPrice,
        'payInfo.inputPointPrice': 0
      });
    }
  },
  onSure: function () {
    var that = this;

    if (that.data.payInfo.isInputPoint) {
      if (that.data.payInfo.inputValue > 0) {
        that.setData({
          'payInfo.pointPrice': that.data.payInfo.inputPointPrice,
          'payInfo.usePoint': that.data.payInfo.inputValue
        });
      } else {
        that.setData({
          'payInfo.pointPrice': 0,
          'payInfo.usePoint': 0
        });
      }
      that.getShouldPayAmount();
    } else {
      if (that.data.payInfo.inputValue > 0) {
        that.setData({
          'payInfo.balancePrice': that.data.payInfo.inputValue,
          'payInfo.useBalance': that.data.payInfo.inputValue
        });
      } else {
        that.setData({
          'payInfo.balancePrice': 0,
          'payInfo.useBalance': 0
        });
      }
      that.getShouldPayAmount();
    }

    that.setData({ isShowMemberRights: false });
  },
  //选取卡券
  onSelectMemberCard:function(){
    var that = this;
    
    wx.navigateTo({
      url: '../memberCard/memberCard?price=' + that.data.payInfo.shouldPayPrice,
    })
  },
  //提交订单
  offerOrderRequest: function (orderParameter) {
    var that = this;

    wx.showLoading({
      title: '正在提交订单...',
    })

    request.payOrder(orderParameter, function (data) {
      if (data.retCode >= 306 && data.retCode <= 308) {
        wx.showToast({
          title: data.retMsg,
          icon: "none"
        })
      } else {
        wx.hideLoading();

        if (parseFloat(that.data.payInfo.shouldPayPrice).toFixed(2) > 0) {
          Wechat.wechatPayOrder(data.result.order.orderId, parseFloat(that.data.payInfo.shouldPayPrice * 100).toFixed(0), function (e) {
            wx.hideLoading();
            that.showOrderDetail(data.result.order.orderId);
          })
        } else {
          let parameter = {
            orderId: data.result.order.orderId,
            orderStatus: 'PENDING_DELIVERY'
          };
          //待发货订单
          request.updateOrderStatus(parameter, function (data) {
            wx.hideLoading();
            //跳转订单详情
            that.showOrderDetail(data.result.orderId);
          });
        }
      }
    });
  },
  //计算商品总价
  getCartTotalPrice: function () {
    var that = this;
    var price = 0;

    for (var i = 0; i < that.data.productList.length; i++) {
      var item = that.data.productList[i];
      if (item.specifications != null) {
        price += item.shoppingCart.count * item.specifications.price;
      } else {
        price += item.shoppingCart.count * item.goods.goodsRetailPrice;
      }
    }
    var discountPrice = 0;
    if (that.data.payInfo.memberInfo.mallCustomer.discount != null) {
      discountPrice = price * (1 - (that.data.payInfo.memberInfo.mallCustomer.discount / 10));
    }
    that.setData({ 'payInfo.totalPrice': price, 'payInfo.discountPrice': discountPrice.toFixed(2) });
    that.getShouldPayAmount();
  },
  //计算剩余应付金额
  getShouldPayAmount: function () {
    var that = this;
    var shouldPay = parseFloat(that.data.payInfo.totalPrice) - parseFloat(that.data.payInfo.discountPrice) - parseFloat(that.data.payInfo.balancePrice) - parseFloat(that.data.payInfo.pointPrice);
    that.setData({ 'payInfo.shouldPayPrice': shouldPay });
  },
  //查询默认门店
  queryStoreList: function () {
    var that = this;

    if (that.data.pickUp == 'MAIL' && that.data.currentAddress != null) {
      MapLocation.queryMapLocation(that.data.currentAddress.region + that.data.currentAddress.address, function (location) {
        that.queryStoreRequest(location);
      });
    } else {
      MapLocation.queryMapLocation(null, function (location) {
        that.queryStoreRequest(location);
      });
    }
  },
  queryStoreRequest: function (location) {
    var that = this;

    StoreRequest.queryStoreRequest(location, '', 0, 1, function (result) {
      if (result.content.length > 0) {
        that.setData({ currentStore: result.content[0], totalStore: result.totalElements });
      }
      that.setData({ isShowContent: true });
      wx.hideLoading();
    });
  },
  //show订单详情
  showOrderDetail: function (orderId) {
    var that = this;

    that.setData({ isShowOrderDetail: true })
    that.OrderDetailComponent = that.selectComponent('#OrderDetailComponent');
    that.OrderDetailComponent.showOrderDetail(orderId);

    wx.setNavigationBarTitle({
      title: '订单详情'
    })
  },
  //查询卡券
  queryMemberCardRequest: function () {
    var that = this;

    request.queryMemberCard({
      totalPrice: that.data.payInfo.shouldPayPrice,
      cashCouponSceneType: 'ONLINE_MALL'
    },
      function (data) {

      });

  }
})


