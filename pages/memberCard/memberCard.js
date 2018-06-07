// pages/memberCard/memberCard.js
var request = require('../../utils/Request.js')

Page({
  data: {
  },

  onLoad: function (options) {
    var that = this;

    that.queryMemberCardRequest(options.price);
  },
  //查询卡券
  queryMemberCardRequest: function (price) {
    var that = this;

    request.queryMemberCard({
      totalPrice: price,
      cashCouponSceneType: 'ONLINE_MALL'
    },
      function (data) {
        for (var i = 0; i < data.result.allCashCoupon.length; i++) {
          var coupon = data.result.allCashCoupon[i];
          var remark = coupon.remark.replace("<p>", "");
          remark = remark.replace("</p>", "");
          coupon.remark = remark;
        }

        that.setData({ memberCardObject: data.result });
      });
  }

})