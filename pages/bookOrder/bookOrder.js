var request = require('../../utils/Request.js')
var Login = require('../../utils/Login.js')
var MD5 = require('../../utils/md5.js')
var Config = require('../../utils/Config.js')
var app = getApp();

Page({
  data: {
    productList: [],
    isShowMemberRights: 'hide',
    isShowContent: 'hide',
    isExtractEmail: 'show',
    isExtractSelf: 'hide',
    //自提或邮寄标签判定是否选择地址选项
    isShowStore: '',
    currentAddress: null,
    selectAddressId: null,
    totalPrice: 0,
    shouldPayPrice: 0,
    memberInfo: null,
    discountPrice: 0,
    balancePrice: 0,
    pointPrice: 0,
    isInputPoint: false,
    //当前输入折扣抵扣金额
    inputDiscountValue: 0,
    inputValue: '',
    useBalance: 0,
    usePoint: 0,
    isFromCart: false,
    currentStore: null,
    totalStore: 0,
    pickUpStyle: [],
    pickUp: 'MAIL'
  },
  onLoad: function (options) {
    var that = this;
    that.setData({ isFromCart: options.isFromCart });

    wx.showLoading();
    //获取会员信息
    request.getMemberInfo(function (data) {
      that.setData({ memberInfo: data.result });
      //处理商品数据
      that.setData({ productList: Config.Config.orderProducts });
      that.getCartTotalPrice();
    });

    //获取客户默认地址
    request.getDefaultAddress(function (data) {
      that.setData({ currentAddress: data.result, selectAddressId: data.result.id });
    });

    //获取门店
    that.queryStoreList();

    //获取提货方式
    request.queryPickupStatus(function (data) {
      that.setData({ pickUpStyle: data.result });
      console.log(that.data.pickUpStyle);
    });
  },
  onShow: function () {
    var that = this;

    if (that.data.selectAddressId) {
      request.getDetailAddress({ userAddressId: that.data.selectAddressId }, function (data) {
        that.setData({ currentAddress: data.result });
      });
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
    wx.navigateTo({
      url: '../store/store',
    })
  },
  onCall: function () {
    var that = this;

    wx.makePhoneCall({
      phoneNumber: that.data.currentStore.phone,
    })
  },
  //下单
  offerOrder: function () {
    var that = this;

    if (that.data.selectAddressId == null) {
      wx.showToast({
        title: '请选择联系人信息!',
        icon: 'none'
      })
      return;
    }

    var order = {
      pickUpGoodsType: that.data.pickUp,
      addressId: that.data.selectAddressId,
      amountPayable: parseFloat(that.data.shouldPayPrice).toFixed(2),
      discount: that.data.memberInfo.mallCustomer.discount,
      discountPrice: parseFloat(that.data.discountPrice).toFixed(2),
      integral: that.data.usePoint,
      integralPrice: that.data.pointPrice,
      balance: parseFloat(that.data.useBalance).toFixed(2),
      balancePrice: parseFloat(that.data.balancePrice).toFixed(2)
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
      if (e == false) {
        app.userLogin(function () {
          that.offerOrderRequest(orderParameter);
        });
      } else {
        that.offerOrderRequest(orderParameter);
      }
    })
  },
  onShowInputBalance: function () {
    var that = this;
    that.setData({ isShowMemberRights: 'show', isInputPoint: false, inputDiscountValue: that.data.balancePrice });

    if (that.data.balancePrice > 0) {
      that.setData({ inputValue: that.data.balancePrice });
    } else {
      that.setData({ inputValue: '' });
    }
  },
  onShowInputPoint: function () {
    var that = this;
    that.setData({ isShowMemberRights: 'show', isInputPoint: true, inputDiscountValue: that.data.pointPrice });

    if (that.data.pointPrice > 0) {
      that.setData({ inputValue: that.data.pointPrice });
    } else {
      that.setData({ inputValue: '' });
    }
  },
  onCoverClicked: function (e) {
    this.setData({ isShowMemberRights: 'hide' });
  },
  onExtractEmail: function () {
    this.setData({ isExtractEmail: 'hide' });
    this.setData({ isExtractSelf: 'show' });
    this.setData({ isShowStore: '', pickUp: 'PICK_UP_IN_A_STORE' });
  },
  onExtractSelf: function () {
    this.setData({ isExtractSelf: 'hide' });
    this.setData({ isExtractEmail: 'show' });
    this.setData({ isShowStore: 'hide', pickUp: 'MAIL' });
  },
  discountTextInput: function (event) {
    var that = this;
    var str = event.detail.value;

    //输入积分操作
    if (that.data.isInputPoint) {
      //积分兑换金额
      var pointMoney = (parseInt(str) * that.data.memberInfo.integralTrade.money) / that.data.memberInfo.integralTrade.integral_sum;

      //最大应付金额
      var shouldMoney = parseFloat(that.data.totalPrice) - parseFloat(that.data.discountPrice) - parseFloat(that.data.balancePrice);

      if (parseFloat(pointMoney) > shouldMoney) {
        that.setData({ inputValue: '' })
      } else if (parseInt(str) > parseInt(that.data.memberInfo.mallCustomer.integral)) {
        that.setData({ inputValue: '' });
      } else {
        that.setData({ inputValue: str })
      }
    } else {
      //输入储值金额操作
      var shouldPay = parseFloat(that.data.totalPrice) - parseFloat(that.data.discountPrice) - parseFloat(that.data.pointPrice);

      if (parseFloat(str) > shouldPay) {
        that.setData({ inputValue: '' })
      } else if (parseFloat(str) > parseFloat(that.data.memberInfo.mallCustomer.balance)) {
        that.setData({ inputValue: '' });
      } else {
        that.setData({ inputValue: str })
      }
    }

    if (str.length > 0) {
      if (that.data.isInputPoint) {
        var point = (parseInt(that.data.inputValue) * that.data.memberInfo.integralTrade.money) / that.data.memberInfo.integralTrade.integral_sum;
        that.setData({ inputDiscountValue: point });
      } else {
        that.setData({ inputDiscountValue: that.data.inputValue })
      }
    } else {
      that.setData({ inputDiscountValue: 0 })
    }
  },
  onSureDiscount: function () {
    var that = this;

    if (that.data.isInputPoint) {
      that.setData({ pointPrice: that.data.inputDiscountValue, usePoint: that.data.inputValue });
    } else {
      that.setData({ balancePrice: that.data.inputDiscountValue, useBalance: that.data.inputValue });
    }

    that.getShouldPayAmount();
    that.setData({ isShowMemberRights: 'hide' });
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
        that.wechatPayOrder(data.result.order.orderId);
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
    if (that.data.memberInfo.mallCustomer.discount != null) {
      discountPrice = price * (1 - (that.data.memberInfo.mallCustomer.discount / 10));
    }
    that.setData({ totalPrice: price, discountPrice: discountPrice });
    that.getShouldPayAmount();
  },
  //计算剩余应付金额
  getShouldPayAmount: function () {
    var that = this;
    var shouldPay = parseFloat(that.data.totalPrice) - parseFloat(that.data.discountPrice) - parseFloat(that.data.balancePrice) - parseFloat(that.data.pointPrice);
    that.setData({ shouldPayPrice: shouldPay });
  },
  //查询默认门店
  queryStoreList: function () {
    var that = this;

    wx.getLocation({
      success: function (res) {
        wx.request({
          url: 'http://api.map.baidu.com/geoconv/v1/?coords=' + res.longitude + ',' + res.latitude + '&from=1&to=5&ak=5Bep8ZOHwOtQj7HVSPwm4u5cI8uiK71f',
          success: function (e) {
            that.queryStoreRequest(e.data.result[0]);
          }
        });
      }, fail: function (e) {
        that.queryStoreRequest(null);
      }
    })
  },
  queryStoreRequest: function (location) {
    var that = this;

    var options = {
      key: Login.ConfigData.wechatAppKey
    };

    if (location != null) {
      options.lat = location.y;
      options.lng = location.x;
    }

    request.queryStoreList(options, function (data) {
      var store = data.result.content[0];

      if (store.distance != null) {
        if (store.distance > 1000) {
          store.distance /= 1000;
          store.distanceStr = store.distance.toFixed(2) + 'km';
        } else {
          if (store.distance > 100) {
            store.distanceStr = store.distance.toFixed(0) + 'm';
          } else {
            store.distanceStr = '<100m';
          }
        }
      }
      that.setData({ currentStore: store, totalStore: data.result.numberOfElements, isShowContent: '' });
      wx.hideLoading();
    });
  },
  //微信支付
  wechatPayOrder: function (orderId) {
    var that = this;

    let options = {
      price: parseFloat(that.data.shouldPayPrice * 100).toFixed(0),
      mchId: '1499898872',
      webAppId: Login.ConfigData.miniProgramId,
      key: Login.ConfigData.wechatSecret,
      openId: Login.Customer.weChatUser.openId,
      orderId: orderId,
      webappSecret: Login.ConfigData.miniProgramSecret,
      body: '冰点云线上商城测试-'
    }

    request.wechatPayOrder(options, function (data) {
      console.log(data);

      var date = String(new Date().getTime()).substr(0, 10);

      wx.hideLoading();

      wx.requestPayment({
        timeStamp: date,
        'nonceStr': data.nonce_str,
        'package': "prepay_id=" + data.prepay_id,
        'signType': 'MD5',
        'paySign': that.paySignData(data, date),
        'success': function (res) {

          wx.navigateTo({
            url: '../orderDetail/orderDetail?id=' + orderId + '&backStatus=' + (that.data.isFromCart ? 0 : 1)
          })
        },
        'fail': function (res) {
          wx.showLoading({
            title: '加载中',
          });

          request.wechatCancelPayOrder({ orderId: orderId }, function (data) {

            wx.navigateTo({
              url: '../orderDetail/orderDetail?id=' + orderId + '&backStatus=' + (that.data.isFromCart ? 0 : 1)
            })
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


