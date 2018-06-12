// pages/memberCard/memberCard.js
var request = require('../../utils/Request.js')
var Config = require('../../utils/Config.js')

Page({
  data: {
    isCanUse: true
  },
  onLoad: function (options) {
    var that = this;

    wx.showLoading();

    that.queryMemberCardRequest(options.price, options.id);
  },
  onCanUse: function () {
    this.setData({ isCanUse: true })
  },
  onAllCard: function () {
    this.setData({ isCanUse: false })
  },
  onSelectCoupon: function (e) {
    var that = this;
    var value = e.currentTarget.dataset.key;

    if (that.data.isCanUse) {
      if (that.data.selectCoupon){
        if (value.id == that.data.selectCoupon.id) {
          that.setData({ selectCoupon: null });
        } else {
          that.setData({ selectCoupon: value });
        }
      }else{
        that.setData({ selectCoupon: value });
      }
    }
  },
  onSure: function(){
    var pages = getCurrentPages()
    var prevPage = pages[pages.length - 2]

    if (this.data.selectCoupon){
      prevPage.setData({
        'payInfo.coupon': this.data.selectCoupon,
        'payInfo.couponPrice': this.data.selectCoupon.denomination,
        'payInfo.isSelectCoupon': true
      })
    }else{
      prevPage.setData({
        'payInfo.coupon': null,
        'payInfo.couponPrice': null,
        'payInfo.isSelectCoupon':true
      })
    }

    wx.navigateBack({
      
    });
  },
  //查询卡券
  queryMemberCardRequest: function (price, id) {
    var that = this;

    request.queryMemberCard({
      totalPrice: price,
      cashCouponSceneType: 'ONLINE_MALL'
    },
      function (data) {
        for (var i = 0; i < data.result.allCashCoupon.length; i++) {
          var coupon = data.result.allCashCoupon[i];

          if(id == coupon.id && id != null){
            that.setData({ selectCoupon: coupon});
          }
          
          if (coupon.effectiveStartTime != null) {
            coupon.effectiveStartTime = Config.js_date_time(coupon.effectiveStartTime);
          }
          if (coupon.effectiveEndTime != null) {
            coupon.effectiveEndTime = Config.js_date_time(coupon.effectiveEndTime);
          }
        }
        for (var i = 0; i < data.result.matchConditionCashCoupon.length; i++) {
          var coupon = data.result.matchConditionCashCoupon[i];
          var remark = coupon.remark.replace("<p>", "");
          remark = remark.replace("</p>", "");
          coupon.remark = remark;

          if (coupon.effectiveStartTime != null) {
            coupon.effectiveStartTime = Config.js_date_time(coupon.effectiveStartTime);
          }
          if (coupon.effectiveEndTime != null) {
            coupon.effectiveEndTime = Config.js_date_time(coupon.effectiveEndTime);
          }
        }
        that.setData({ memberCardObject: data.result });
        wx.hideLoading();
      });
  }

})