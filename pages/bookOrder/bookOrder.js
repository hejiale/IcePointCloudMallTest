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
      //折后价
      afterPrice: 0,
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
      couponPrice: 0,
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
    //处理优惠券抵扣金额
    if (that.data.payInfo.coupon) {
      if (that.data.payInfo.couponPrice > that.data.payInfo.afterPrice) {
        that.setData({ 'payInfo.realCouponPrice': that.data.payInfo.afterPrice });
      } else {
        that.setData({ 'payInfo.realCouponPrice': that.data.payInfo.couponPrice });
      }
      that.clearAccountAmount();
    } else {
      that.getShouldPayAmount();
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
      totalPrice: that.data.payInfo.afterPrice,
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

    if (that.data.payInfo.coupon) {
      order.cashCouponPrice = that.data.payInfo.realCouponPrice;
      order.cashCouponId = that.data.payInfo.coupon.id;
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

    //折后最大储值可抵扣金额
    var maxBalance = (parseFloat(that.data.payInfo.afterPrice) * (parseFloat(that.data.payInfo.memberInfo.mallCustomer.balanceValue) / 100)).toFixed(2)

    that.setData({
      'payInfo.inputShouldPrice': Config.compare(parseFloat(maxBalance),
        that.data.payInfo.memberInfo.mallCustomer.balance,
        parseFloat(that.queryShouldAmount(false))),
      isShowMemberRights: true,
      'payInfo.isInputPoint': false,
    });

    if (that.data.payInfo.useBalance > 0) {
      that.setData({ 'payInfo.inputValue': that.data.payInfo.useBalance });
    } else {
      that.setData({ 'payInfo.inputValue': '' });
    }

    that.setData({
      'payInfo.overcapStatus': false,
      'payInfo.canPayStaus': true
    })
  },
  onShowInputPoint: function () {
    var that = this;

    //折后最大积分可抵扣金额
    var maxPointPrice = parseFloat(that.data.payInfo.afterPrice) * (parseFloat(that.data.payInfo.memberInfo.mallCustomer.integralValue) / 100);
    //折后最大抵扣积分数
    var maxPoint = maxPointPrice * that.data.payInfo.memberInfo.integralTrade.integral_sum / that.data.payInfo.memberInfo.integralTrade.money;

    var realMaxPointPrice = (Math.ceil(maxPoint) * that.data.payInfo.memberInfo.integralTrade.money) / that.data.payInfo.memberInfo.integralTrade.integral_sum;

    //账户积分可抵扣金额
    var accountPrice = that.data.payInfo.memberInfo.mallCustomer.integral * that.data.payInfo.memberInfo.integralTrade.money;

    var shouldPay = Config.compare(parseFloat(that.queryShouldAmount(true)),
      accountPrice,
      Config.indexOfFloat(realMaxPointPrice));

    //剩余应付金额可抵扣积分数
    var shouldPoint = that.queryShouldAmount(true) * that.data.payInfo.memberInfo.integralTrade.integral_sum / that.data.payInfo.memberInfo.integralTrade.money;

    that.setData({
      isShowMemberRights: true,
      'payInfo.isInputPoint': true,
      'payInfo.inputShouldPrice': shouldPay
    });

    if (shouldPay > 0) {
      that.setData({
        'payInfo.inputPoint': Config.compare(Math.ceil(maxPoint), that.data.payInfo.memberInfo.mallCustomer.integral, Math.ceil(shouldPoint))
      });
    } else {
      that.setData({
        'payInfo.inputPoint': 0
      });
    }

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

    if (that.data.payInfo.isInputPoint) {
      //输入积分操作
      if (parseInt(str) > that.data.payInfo.inputPoint) {
        that.setData({
          'payInfo.overcapStatus': true,
          'payInfo.canPayStaus': false
        })
      } else {
        var exchangePrice = parseFloat(str) * that.data.payInfo.memberInfo.integralTrade.money / that.data.payInfo.memberInfo.integralTrade.integral_sum;

        if (exchangePrice > that.data.payInfo.inputShouldPrice) {
          exchangePrice = that.data.payInfo.inputShouldPrice;
          that.setData({ 'payInfo.isLowPoint': true })
        }

        that.setData({
          'payInfo.canPayStaus': true,
          'payInfo.inputValue': str,
          'payInfo.inputPointPrice': exchangePrice,
          'payInfo.overcapStatus': false,
        })
      }
    } else {
      //输入储值金额操作
      if (parseFloat(str) > that.data.payInfo.inputShouldPrice) {
        that.setData({
          'payInfo.overcapStatus': true,
          'payInfo.canPayStaus': false
        })
      } else {
        that.setData({
          'payInfo.canPayStaus': true,
          'payInfo.inputValue': str,
          'payInfo.overcapStatus': false,
        })
      }
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
      if (that.data.payInfo.isLowPoint) {
        wx.showToast({
          title: '积分已归零',
        })
        that.setData({
          'payInfo.pointPrice': 0,
          'payInfo.usePoint': 0,
          'payInfo.inputPointPrice': 0,
          'payInfo.isLowPoint': false
        });
      }
    }
    that.getShouldPayAmount();
    that.setData({ isShowMemberRights: false });
  },
  //选取卡券
  onSelectMemberCard: function () {
    var that = this;

    if (that.data.payInfo.coupon) {
      wx.navigateTo({
        url: '../memberCard/memberCard?price=' + that.data.payInfo.shouldPayPrice + "&id=" + that.data.payInfo.coupon.id
      })
    } else {
      wx.navigateTo({
        url: '../memberCard/memberCard?price=' + that.data.payInfo.shouldPayPrice
      })
    }
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
    that.setData({
      'payInfo.totalPrice': price,
      'payInfo.discountPrice': discountPrice.toFixed(2)
    });
    that.getShouldPayAmount();
    that.setData({ 'payInfo.afterPrice': that.data.payInfo.shouldPayPrice })
  },
  //计算剩余应付金额
  getShouldPayAmount: function () {
    var that = this;
    var shouldPay = parseFloat(that.data.payInfo.totalPrice) - parseFloat(that.data.payInfo.discountPrice) - parseFloat(that.data.payInfo.balancePrice) - parseFloat(that.data.payInfo.pointPrice);
    if (that.data.payInfo.coupon) {
      if (that.data.payInfo.couponPrice > shouldPay) {
        shouldPay = 0;
      } else {
        shouldPay -= parseFloat(that.data.payInfo.couponPrice);
      }
    }
    that.setData({ 'payInfo.shouldPayPrice': shouldPay });
  },
  //剩余去除积分或储值的价格
  queryShouldAmount: function (isPoint) {
    var that = this;
    var shouldPay = 0;

    if (isPoint) {
      shouldPay = parseFloat(that.data.payInfo.totalPrice) - parseFloat(that.data.payInfo.discountPrice) - parseFloat(that.data.payInfo.balancePrice);
    } else {
      shouldPay = parseFloat(that.data.payInfo.totalPrice) - parseFloat(that.data.payInfo.discountPrice) - parseFloat(that.data.payInfo.pointPrice);
    }

    if (that.data.payInfo.coupon) {
      if (that.data.payInfo.couponPrice > shouldPay) {
        shouldPay = 0;
      } else {
        shouldPay -= parseFloat(that.data.payInfo.couponPrice);
      }
    }
    return parseFloat(shouldPay.toFixed(2));
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
        that.setData({ "payInfo.couponCount": data.result.matchConditionCashCouponCount })
      });
  },
  clearAccountAmount: function () {
    var that = this;
    if (that.data.payInfo.isSelectCoupon) {
      that.setData({
        'payInfo.balancePrice': 0,
        'payInfo.pointPrice': 0,
        'payInfo.inputShouldPrice': 0,
        'payInfo.inputValue': '',
        'payInfo.inputPointPrice': 0,
        'payInfo.useBalance': 0,
        'payInfo.usePoint': 0,
        'payInfo.isSelectCoupon': false
      });
    }
    that.getShouldPayAmount();
  }
})


