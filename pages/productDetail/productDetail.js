// pages/productDetail/productDetail.js
var WxParse = require('../../wxParse/wxParse.js');
var Login = require('../../utils/Login.js')
var Config = require('../../utils/Config.js')
var app = getApp();
var request = require('../../utils/Request.js')

Page({
  data: {
    isSelectDetail: true,
    selectParameters: [],
    cartNum: 1,
    isFirstShowParameter: true,
    isEndLoad: false
  },
  onLoad: function (options) {
    var that = this;
    that.setData({ goodsId: options.id });

    wx.showLoading();

    request.queryProductDetail({ goodsId: options.id },
      function (data) {
        WxParse.wxParse('article', 'html', data.goods.goodsTextDetails, that, 0);
        that.setData({ DetailObject: data });
        that.queryParameterRequest();
      })

    app.getSystemInfo(function (systemInfo) {
      that.setData({
        deviceWidth: systemInfo.windowWidth,
        deviceHeight: systemInfo.windowHeight
      })
    })
  },
  onShow: function (res) {
    var that = this;

    if (that.data.tryGlassToOrder) {
      that.setData({ tryGlassToOrder: false });
      that.onBook();
    }
    //查询购物车数量
    that.queryCartCount();

    var pages = getCurrentPages();
    if (pages.length == 1) {
      that.setData({ isFromShare: true });
    }
  },
  onBook: function (event) {
    var that = this;

    wx.showLoading();

    Login.valityLogigStatus(function (e) {
      wx.hideLoading();

      if (e == false) {
        wx.navigateTo({
          url: '../bindPhone/bindPhone',
        })
      } else {
        that.setData({ isToOrder: true });
        that.selectParameterToCart();
      }
    })
  },
  onCall: function () {
    var that = this;
    wx.makePhoneCall({
      phoneNumber: that.data.DetailObject.goods.belongedCompany.contactMobilePhone,
    })
  },
  onTryGlass: function () {
    var that = this;

    wx.navigateTo({
      url: '../tryGlass/tryGlass?link=' + that.data.DetailObject.goods.proTryImage,
    })
  },
  onCart: function () {
    var that = this;

    wx.showLoading();

    Login.valityLogigStatus(function (e) {
      wx.hideLoading();

      if (e == false) {
        wx.navigateTo({
          url: '../bindPhone/bindPhone',
        })
      } else {
        that.setData({ isToOrder: false });
        that.selectParameterToCart();
      }
    })
  },
  onToCart: function () {
    wx.showLoading();

    Login.valityLogigStatus(function (e) {
      wx.hideLoading();

      if (e == false) {
        wx.navigateTo({
          url: '../bindPhone/bindPhone',
        })
      } else {
        wx.navigateTo({
          url: '../cart/cart',
        })
      }
    })
  },
  selectParameterToCart: function () {
    var that = this;

    if (that.data.DetailObject.goods.isSpecifications && that.data.parameterObject.specifications != null) {
      if (that.data.parameterObject.specifications.length > 0 && that.data.selectParameters.length != that.data.parameterObject.specifications.length) {
        wx.showToast({
          title: '请先选择商品规格',
          icon: 'none'
        })
        return;
      }
    }

    if (that.data.isToOrder) {
      that.addProductToOrder();
    } else {
      that.addProductToCart();
    }
  },
  addProductToCart: function () {
    var that = this;
    var cart = {
      count: that.data.cartNum
    };

    if (that.data.parameterObject != null) {
      cart.specificationsId = that.data.parameterObject.specificationsId;
    } else {
      cart.goodsId = that.data.goodsId;
    }

    request.addShoppingCart(cart, function (data) {
      if (data.retCode >= 301 && data.retCode <= 305) {
        wx.showToast({
          title: data.retMsg,
          icon: "none"
        })
      } else {
        that.queryCartCountRequest();

        wx.showToast({
          title: '加入购物车成功!'
        })
      }
    });
  },
  addProductToOrder: function () {
    var that = this;

    Config.Config.orderProducts = that.bindOrderProduct();

    wx.navigateTo({
      url: '../bookOrder/bookOrder?isFromCart=0',
    })
  },
  //立即支付绑定参数数据
  bindOrderProduct: function () {
    var that = this;
    var productList = new Array();

    var product = {
      goods: that.data.DetailObject.goods,
      photos: that.data.DetailObject.photos
    }

    if (that.data.parameterObject != null) {
      product.shoppingCart = {
        count: that.data.cartNum,
        specificationsId: that.data.parameterObject.specificationsId
      };
      product.specifications = {
        price: that.data.parameterObject.price,
        id: that.data.parameterObject.specificationsId,
      };
      var appendStr = '';
      for (var i = 0; i < that.data.selectParameters.length; i++) {
        var parameter = that.data.selectParameters[i];
        appendStr += parameter.name + ":" + parameter.value + ' ';
      }
      product.specification = appendStr;
    } else {
      product.shoppingCart = { count: that.data.cartNum };
    }
    productList.push(product);

    return productList;
  },
  //商品数量加减
  onReduceCart: function () {
    var that = this;
    that.data.cartNum -= 1;
    if (that.data.cartNum == 0) {
      that.data.cartNum = 1;
    }
    that.setData({ cartNum: that.data.cartNum });
  },
  onAddCart: function () {
    var that = this;
    that.data.cartNum += 1;
    that.setData({ cartNum: that.data.cartNum });
  },
  //图文详情  商品参数
  onDetail: function () {
    this.setData({ isSelectDetail: true });
  },
  onParameter: function () {
    this.setData({ isSelectDetail: false });
  },
  //点击商品规格参数method
  onSelectParameter: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;

    if (item.enableSelect) {
      if (!item.selected) {
        for (var i = 0; i < that.data.selectParameters.length; i++) {
          var selectItem = that.data.selectParameters[i];
          if (selectItem.name == item.name) {
            that.data.selectParameters.splice(i, 1);
          }
        }

        if (that.data.selectParameters.indexOf(item) == -1) {
          that.data.selectParameters.push(item);
        }
      } else {
        for (var i = 0; i < that.data.selectParameters.length; i++) {
          var selectItem = that.data.selectParameters[i];
          if (selectItem.value == item.value && selectItem.nameId == item.nameId) {
            that.data.selectParameters.splice(i, 1);
          }
        }
      }
      wx.showLoading();
      that.queryParameterRequest();
    }
  },
  //返回首页
  onToHomePage: function () {
    app.globalData.menuScene = null;

    wx.reLaunch({
      url: '../home/home'
    })
  },
  //查询商品规格参数请求
  queryParameterRequest: function () {
    var that = this;

    var options = new Object();
    options.goodsId = that.data.goodsId;

    if (that.data.selectParameters.length > 0) {
      var array = new Array();

      for (var i = 0; i < that.data.selectParameters.length; i++) {
        var parameter = that.data.selectParameters[i];
        array.push({ specificationName: parameter.name, specificationValue: parameter.value });
      }
      options.specificationsModels = array;
    }

    request.queryProductDetailParameter(JSON.stringify(options), function (data) {
      if (data.price) {
        that.setData({ parameterPrice: data.price });
      } else {
        that.setData({ parameterPrice: that.data.DetailObject.goods.goodsRetailPrice });
      }

      if (that.data.isFirstShowParameter && data.specifications) {
        for (var i = 0; i < data.specifications.length; i++) {
          var specification = data.specifications[i];
          var selectNum = 0;
          var parameter = null;

          for (var j = 0; j < specification.values.length; j++) {
            var value = specification.values[j];
            if (value.enableSelect) {
              selectNum += 1;
              parameter = value;
            }
            if (j == specification.values.length - 1) {
              if (selectNum == 1) {
                that.data.selectParameters.push(parameter);
                selectNum = 0;
              }
            }
          }
        }
        that.setData({ isFirstShowParameter: false });
      }

      for (var z = 0; z < that.data.selectParameters.length; z++) {
        var selectParameter = that.data.selectParameters[z];
        for (var i = 0; i < data.specifications.length; i++) {
          var specification = data.specifications[i];
          for (var j = 0; j < specification.values.length; j++) {
            var value = specification.values[j];
            if (selectParameter.name == value.name && selectParameter.value == value.value) {
              value.selected = true;
            }
          }
        }
      }
      that.setData({ parameterObject: data, isEndLoad: true });
      wx.hideLoading();
    })
  },
  //查询购物车数量
  queryCartCount: function () {
    var that = this;

    Login.valityLogigStatus(function (e) {
      if (e == false) {
        Login.userLogin(function (customer) {
          if (customer != null) {
            that.queryCartCountRequest();
          }
        });
      } else {
        that.queryCartCountRequest();
      }
    })
  },
  queryCartCountRequest: function () {
    var that = this;

    request.queryCartCount(function (data) {
      that.setData({ cartCount: data.result });
    });
  },
  //转发
  onShareAppMessage: function (res) {
    console.log(res.target)

    var that = this;
    return {
      title: that.data.DetailObject.goods.goodsName,
      path: '/pages/productDetail/productDetail?id=' + that.data.goodsId
    }
  }
})