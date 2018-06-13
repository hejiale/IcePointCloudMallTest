var app = getApp()
var request = require('../../utils/Request.js')
var Login = require('../../utils/Login.js')
var Config = require('../../utils/Config.js')

Page({
  data: {
    classList: [{ typeName: '精选' }],
    productList: [],
    currentType: "精选",
    currentPage: 1,
    pageSize: 20,
    currentPageIndex: 0,
    animationTranslate: {},
    animationRotate: {}
  },
  onLoad: function (options) {
    var that = this;

    Config.getImageAutoHeight(function (singleLayoutHeight, doubleLayoutHeight) {
      that.setData({
        singleLayoutHeight: singleLayoutHeight,
        doubleLayoutHeight: doubleLayoutHeight
      })
    });

    app.getSystemInfo(function (systemInfo) {
      that.setData({
        deviceWidth: systemInfo.windowWidth,
        classItemWidth: (systemInfo.windowWidth - 30 - 2 * 13) / 3
      })
    })
    //初始化动画
    that.animation = wx.createAnimation({
      duration: 400,
      timingFunction: 'ease',
      transformOrigin: "50% 50%",
    })
  },
  onShow: function () {
    //从后台返回前台刷新首页
    if (app.globalData.isRequireLoad) {
      this.setData({
        classList: [{ typeName: '精选' }],
        currentType: "精选",
        currentPageIndex: 0,
        scrollLeft: 0
      })
      this.getCompanyInfo();
      app.globalData.isRequireLoad = false;
    }
  },
  onSearchProduct: function () {
    wx.navigateTo({
      url: '../searchPage/searchPage',
    })
  },
  //显示与隐藏类目页面
  onShowOrHideClassView: function () {
    var that = this;
    that.setData({ isShowClassView: !that.data.isShowClassView });
    that.classViewAnimation();
  },
  //选择类目
  onClassItemClicked: function (e) {
    console.log(e)

    var that = this;
    var item = e.currentTarget.dataset.key;

    that.setData({ scrollLeft: e.currentTarget.offsetLeft });
    that.chooseClassItem(item);
  },
  onClassItemClicked2: function (e) {
    console.log(e)

    var that = this;
    var item = e.currentTarget.dataset.key;
    that.chooseClassItem(item);
    that.classViewAnimation();
    //创建节点查询器 query
    var query = wx.createSelectorQuery()
    query.select('#classOutItem-' + item.typeId).boundingClientRect(function (rect) {
      console.log(rect)

      if (rect != null) {
        if (rect.left < 0) {
          that.setData({ scrollLeft: 0 });
        } else {
          that.setData({ scrollLeft: rect.left });
        }
      } else {
        that.setData({ scrollLeft: 0 });
      }
    }).exec()
  },
  //选择类目
  chooseClassItem: function (item) {
    var that = this;

    that.setData({
      currentType: item.typeName,
      isShowClassView: false
    });

    if (item.typeName == '精选') {
      that.getCompanyTemplate();
    } else {
      that.setData({
        isShowProductListView: true,
        isShowTemplateView: false,
        productList: []
      });
      that.queryProductsRequest(item.typeId);
    }
  },
  onTemplateDetail: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;

    wx.navigateTo({
      url: '../productList/productList?id=' + item.tid,
    })
  },
  onGoodsDetail: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;

    wx.navigateTo({
      url: '../productDetail/productDetail?id=' + item.goodsId,
    })
  },
  onLoadMore: function () {
    var that = this;
    that.data.currentPage += 1;
    that.queryProductsRequest();
  },
  onBottomMenuToPerson: function () {
    Login.valityLogigStatus(function (e) {
      if (e == false) {
        wx.navigateTo({
          url: '../bindPhone/bindPhone',
        })
      } else {
        wx.navigateTo({
          url: '../person/person',
        })
      }
    })
  },
  onBottomMenuToOrder: function () {
    Login.valityLogigStatus(function (e) {
      if (e == false) {
        wx.navigateTo({
          url: '../bindPhone/bindPhone',
        })
      } else {
        wx.navigateTo({
          url: '../order/order',
        })
      }
    })
  },
  onBottomMenuToCart: function () {
    Login.valityLogigStatus(function (e) {
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
  onBgClicked: function () {
    this.setData({ isShowClassView: false });
    this.classViewAnimation();
  },
  //转发分享
  onShareAppMessage: function (res) {
    console.log(res)
    return {
      title: '冰点云智慧零售Lab',
      path: '/pages/home/home'
    }
  },
  //类目导航动画
  classViewAnimation: function () {
    var that = this;

    if (that.data.isShowClassView) {
      that.animation.rotate(180).step()
    } else {
      that.animation.rotate(-180).step()
    }

    that.setData({
      animationRotate: that.animation.export()
    })
  },
  //获取公司信息请求
  getCompanyInfo: function () {
    var that = this;
    request.getCompanyInfo({ appid: Login.ConfigData.wechatId }, function (data) {
      if (data.retCode == 202 || data.retCode == 207 || data.retCode == 208) {
        wx.showToast({
          title: data.retMsg,
          icon: 'none'
        })
      }
      Login.Customer.companyId = data.result.id;
      that.getCompanyClass();
      that.getCompanyTemplate();
    });
  },
  //获取首页类目请求
  getCompanyClass: function () {
    var that = this;

    that.setData({ classList: [{ typeName: '精选' }] });

    request.getCompanyClass({ companyId: Login.Customer.companyId }
      , function (data) {
        if (data.retCode == 401) {
          that.setData({ noneWechatAccount: true });
        } else {
          if (data.result != null) {
            that.setData({ classList: that.data.classList.concat(data.result) })
          }
        }
      })
  },
  //获取商店展示模板请求
  getCompanyTemplate: function () {
    var that = this;

    that.setData({
      isShowProductListView: false,
      isShowTemplateView: true,
      templateList: []
    });

    request.getCompanyTemplate({ companyId: Login.Customer.companyId },
      function (data) {
        if (data.retCode == 401) {
          wx.showToast({
            title: '请前去后台配置模板',
            icon: 'none'
          })
          that.setData({ noneWechatAccount: true });
        } else {
          if (data.result.previewData == null) {
            that.setData({ noneWechatAccount: true });
          }

          for (var i = 0; i < data.result.previewData.length; i++) {
            var value = data.result.previewData[i];
            if (value.type == "SESSION") {
              that.data.templateList.push(value);
            }
          }
          that.setData({ templateList: that.data.templateList });
        }
      })
  },
  //查询商品请求
  queryProductsRequest: function (typeId) {
    var that = this;

    let options = {
      companyId: Login.Customer.companyId,
      pageNumber: that.data.currentPage,
      pageSize: that.data.pageSize,
      typeId: typeId
    };

    request.queryProductList(options, function (data) {
      that.setData({ productList: that.data.productList.concat(data.resultList) });
    })
  }
})