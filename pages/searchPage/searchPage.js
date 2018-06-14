// pages/searchPage/searchPage.js
var app = getApp();
var request = require('../../utils/Request.js')
var Login = require('../../utils/Login.js')
var Config = require('../../utils/Config.js')

Page({
  data: {
    historySearchWords: [],
    allProductList: [],
    isShowSearchView: true,
    classList: [],
    parameterList: [],
    currentPage: 1,
    pageSize: 20,
    currentTypeIndex: -1,
    //选中分类参数集合
    selectAllParameter: []
  },
  //--------------页面初始化 加载分类商品参数----------------//
  onLoad: function () {
    var that = this;

    Config.getImageAutoHeight(function (singleLayoutHeight, doubleLayoutHeight) {
      that.setData({
        doubleLayoutHeight: doubleLayoutHeight
      })
    });

    //搜索商品记录
    var historyKeywords = wx.getStorageSync(Config.Config.historySearchWords);
    if (historyKeywords.length > 0) {
      that.setData({ historySearchWords: historyKeywords });
    }
    //查询所有商品分类信息
    that.queryAllClassParameter();

    //scrollView 高度
    app.getSystemInfo(function (systemInfo) {
      that.setData({
        scrollHeight: (systemInfo.windowHeight - 45)
      })
    })
  },
  onShow:function(){
    app.globalData.isRequireLoad = false;
  },
  //--------------点击搜索记录查询商品----------------//
  onLastesItem: function (e) {
    var that = this;
    that.setData({
      isShowProductList: true,
      isShowSearchView: false,
      keyWord: e.currentTarget.dataset.key,
      isFilter: false
    });
    that.onResetProperty();
    that.filterProductsRequest();
  },
  //--------------清空搜索记录----------------//
  onClearHistoryWords: function () {
    var that = this;
    wx.removeStorage({
      key: Config.Config.historySearchWords,
      success: function (res) {
        that.setData({ historySearchWords: [] });
      }
    })
  },
  //--------------点击分类----------------//
  onClassClicked: function (e) {
    var that = this;
    
    that.setData({ showOrHide: true });
    that.resetParameterSelectStatus();
    that.querySelectClassInfo(that.data.currentTypeIndex);
  },
  onBgClicked: function () {
    var that = this;
    that.setData({ showOrHide: false });
  },
  //--------------点击商品详情----------------//
  onGoodsDetail: function (event) {
    var value = event.currentTarget.dataset.key;
    wx.navigateTo({
      url: '../productDetail/productDetail?id=' + value.goodsId,
    })
  },
  //--------------加载更多（提前加载）----------------//
  onLoadMore: function () {
    var that = this;
    that.data.currentPage += 1;
    that.queryProductsRequest();
  },
  //--------------选择类别操作----------------//
  onChooseClass: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;
    that.querySelectClassInfo(parseInt(e.currentTarget.id))
  },
  //--------------选择分类参数操作----------------//
  onSelectProperty: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.key;

    for (var i = 0; i < that.data.parameterList.length; i++) {
      var object = that.data.parameterList[i];
      for (var j = 0; j < object.goodsParameters.length; j++) {
        var parameter = object.goodsParameters[j];
        if (parameter.id == item.id) {
          parameter.selected = !item.selected;
        }
      }
    }
    that.setData({ parameterList: that.data.parameterList });
  },
  //--------------确认操作----------------//
  onSureFilterProducts: function () {
    var that = this;
    that.addFilterParameter();
    that.setData({ showOrHide: false, keyWord: '', isFilter: true });
    that.filterProductsRequest();
  },
  //--------------重置操作----------------//
  onResetProperty: function () {
    var that = this;
    that.clearFilterData();
  },
  //--------------输入价格操作----------------//
  onStartPriceClicked: function (event) {
    var that = this;
    if (parseFloat(event.detail.value) > parseFloat(that.data.heighPriceStr)) {
      that.setData({ lowPriceStr: '' });
      return;
    }
    that.setData({ lowPriceStr: event.detail.value });
  },
  onEndPriceClicked: function (event) {
    var that = this;
    that.setData({ heighPriceStr: event.detail.value });
  },
  //--------------输入框搜索商品----------------//
  onSearchInput: function (e) {
    var that = this;
    that.setData({ keyWord: e.detail.value, isFilter: false });
    that.updateHistorySearchWords();
    that.onResetProperty();
    that.filterProductsRequest();
  },
  //搜索商品初始化查询//
  filterProductsRequest: function () {
    wx.showLoading({});

    var that = this;

    that.setData({
      isShowProductList: true,
      isShowSearchView: false,
      currentPage: 1,
      scrollTop: 0,
      allProductList: []
    });
    that.queryProductsRequest();
  },
  //查询商品//
  queryProductsRequest: function () {
    var that = this;

    if (that.data.currentPage == 1) {
      that.setData({ isEndLoad: false, isEmpty: false });
    }

    var options = new Object();
    options.companyId = Login.Customer.companyId;
    options.pageNumber = that.data.currentPage;
    options.pageSize = that.data.pageSize;

    if (that.data.isFilter) {
      if (that.data.startPrice){
        options.minPrice = that.data.startPrice;
      }
      if (that.data.endPrice){
        options.maxPrice = that.data.endPrice;
      }
      if (that.data.currentTypeId != null) {
        options.typeId = that.data.currentTypeId;
      }

      if (that.data.selectAllParameter.length > 0) {
        options.goodsParameterIds = that.chooseParameter().join(',');
      }
    } else {
      options.keyword = that.data.keyWord;
    }

    request.queryProductList(options, function (data) {
      that.setData({ allProductList: that.data.allProductList.concat(data.resultList) });

      if (data.resultList.length == 0) {
        if (that.data.allProductList.length > 0){
          that.setData({ isEndLoad: true });
        }else{
          that.setData({ isEmpty: true });
        }
      }
      wx.hideLoading();
    })
  },
  //本地保存商品搜索记录//
  updateHistorySearchWords: function () {
    var that = this;

    if (that.data.keyWord.length == 0) return;

    if (that.data.historySearchWords.length > 0) {
      if (that.data.historySearchWords.indexOf(that.data.keyWord) == -1) {
        that.data.historySearchWords.push(that.data.keyWord);
        wx.setStorageSync(Config.Config.historySearchWords, that.data.historySearchWords);
      }
    } else {
      var historyList = new Array();
      historyList.push(that.data.keyWord);

      wx.setStorage({
        key: Config.Config.historySearchWords,
        data: historyList,
      })
    }
  },
  //查询所有商品分类信息
  queryAllClassParameter: function () {
    var that = this;

    let options = { companyId: Login.Customer.companyId };

    request.queryProductCategory(options, function (data) {
      that.setData({ classList: data.result });
    })
  },
  querySelectClassInfo: function (index) {
    var that = this;
    var indexClass = that.data.classList[index > 0 ? index : 0];

    for (var i = 0; i < that.data.classList.length; i++) {
      var value = that.data.classList[i];
      if (i == index) {
        value.selected = !value.selected;
      } else {
        value.selected = false;
      }
    }

    //hasClassSelect
    for (var i = 0; i < that.data.classList.length; i++) {
      var value = that.data.classList[i];
      if (value.selected) {
        that.setData({ hasClassSelect: true });
        break;
      } else {
        that.setData({ hasClassSelect: false });
      }
    }

    for (var i = 0; i < that.data.selectAllParameter.length; i++) {
      var item = that.data.selectAllParameter[i];
      for (var z = 0; z < indexClass.parameterBeans.length; z++) {
        var object = indexClass.parameterBeans[z];
        for (var j = 0; j < object.goodsParameters.length; j++) {
          var parameter = object.goodsParameters[j];
          if (parameter.id == item.id && indexClass.type.typeId == that.data.currentTypeId) {
            parameter.selected = true;
          }
        }
      }
    }

    that.setData({
      classList: that.data.classList,
      parameterList: indexClass.parameterBeans
    });
  },
  //已选商品参数集合
  chooseParameter: function () {
    var that = this;
    var allParameter = new Array();

    for (var i = 0; i < that.data.selectAllParameter.length; i++) {
      var parameter = that.data.selectAllParameter[i];
      if (parameter.selected) {
        allParameter.push(parameter.id);
      }
    }
    return allParameter;
  },
  //新增商品分类参数选择(确认操作)
  addFilterParameter: function () {
    var that = this;
    that.setData({ currentTypeId: null, currentTypeIndex: -1 });
    that.data.selectAllParameter.splice(0, that.data.selectAllParameter.length);

    for (var i = 0; i < that.data.classList.length; i++) {
      var classObject = that.data.classList[i];
      if (classObject.selected) {
        that.setData({
          currentTypeId: classObject.type.typeId,
          currentTypeIndex: i
        });
      }
    }

    for (var i = 0; i < that.data.parameterList.length; i++) {
      var parameterObject = that.data.parameterList[i];
      for (var j = 0; j < parameterObject.goodsParameters.length; j++) {
        var parameter = parameterObject.goodsParameters[j];
        if (parameter.selected) {
          that.data.selectAllParameter.push(parameter);
        }
      }
    }
    that.setData({
      startPrice: ((that.data.lowPriceStr != null) ? that.data.lowPriceStr : ""),
      endPrice: ((that.data.heighPriceStr != null) ? that.data.heighPriceStr: "")
    });
  },
  //清除筛选数据//
  clearFilterData: function () {
    var that = this;
    that.resetParameterSelectStatus();

    that.setData({
      lowPriceStr: '',
      heighPriceStr: ''
    });
  },
  //初始化筛选数据选中状态
  resetParameterSelectStatus: function () {
    var that = this;

    for (var i = 0; i < that.data.classList.length; i++) {
      var object = that.data.classList[i];
      object.selected = false;
    }

    for (var z = 0; z < that.data.classList.length; z++) {
      var classObject = that.data.classList[z];
      for (var i = 0; i < classObject.parameterBeans.length; i++) {
        var paremetrObject = classObject.parameterBeans[i];
        for (var j = 0; j < paremetrObject.goodsParameters.length; j++) {
          var parameter = paremetrObject.goodsParameters[j];
          parameter.selected = false;
        }
      }
    }

    that.setData({
      hasClassSelect: false,
      parameterList: [],
      classList: that.data.classList
    });
  }
})