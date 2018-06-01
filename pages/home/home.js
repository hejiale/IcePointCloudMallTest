var app = getApp()
var request = require('../../utils/Request.js')
var Login = require('../../utils/Login.js')
var Config = require('../../utils/Config.js')

Page({
  data: {
    classList: [],
    productList: [],
    currentType: "精选",
    currentPage: 1,
    pageSize: 20
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
        classItemWidth: (systemInfo.windowWidth - 30 - 2*13)/3
      })
    })

    that.getCompanyInfo();
  },
  onSearchProduct: function () {
    wx.navigateTo({
      url: '../searchPage/searchPage',
    })
  },
  onShowClassView: function () {
    this.setData({ isShowClassView: true });
  },
  onCloseClassCover: function () {
    this.setData({ isShowClassView: false });
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

    that.setData({ currentType: item.typeName, isShowClassView: false });

    if (item.typeName == '精选') {
      that.getCompanyTemplate();
    } else {
      that.setData({ isShowProductListView: true, isShowTemplateView: false, productList: [] });
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
        Login.userLogin(function (customer) {
          if (customer != null) {
            wx.navigateTo({
              url: '../person/person',
            })
          } else {
            wx.navigateTo({
              url: '../bindPhone/bindPhone',
            })
          }
        });
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
        Login.userLogin(function (customer) {
          if (customer != null) {
            wx.navigateTo({
              url: '../order/order',
            })
          } else {
            wx.navigateTo({
              url: '../bindPhone/bindPhone',
            })
          }
        });
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
        Login.userLogin(function (customer) {
          if (customer != null) {
            wx.navigateTo({
              url: '../cart/cart',
            })
          } else {
            wx.navigateTo({
              url: '../bindPhone/bindPhone',
            })
          }
        });
      } else {
        wx.navigateTo({
          url: '../cart/cart',
        })
      }
    })
  },

  onBgClicked: function () {
    this.setData({ isShowClassView: false });
  },
  //获取公司信息
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
      that.getCompanyTemplate();
    });
  },
  //获取商店展示模板
  getCompanyTemplate: function () {
    var that = this;

    that.setData({ isShowProductListView: false, isShowTemplateView: true, templateList: [], classList: [{ typeName: '精选' }] });

    let options = { companyId: Login.Customer.companyId };

    request.getCompanyTemplate(options, function (data) {
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

        var viewList = [];

        for (var i = 0; i < data.result.previewData.length; i++) {
          var value = data.result.previewData[i];
          if (value.type == "SESSION") {
            viewList.push(value);
          } else if (value.type == "NAVIGATION") {
            for (var j = 0; j < value.navDataBeans.length; j++) {
              var bean = value.navDataBeans[j];
              if (!bean.hide) {
                that.data.classList.push(bean);
              }
            }
          }
        }
        that.setData({ templateList: viewList, classList: that.data.classList });
      }
    })
  },
  //--------------查询商品----------------//
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
  },
  onShareAppMessage: function (res) {
    console.log(res)
    return {
      title: '冰点云智慧零售Lab',
      path: '/pages/home/home'
    }
  }
})