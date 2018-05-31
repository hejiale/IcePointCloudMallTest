
Page({
  data: {
  },

  onLoad: function (options) {
    var that = this;

    that.OrderDetailComponent = that.selectComponent('#OrderDetailComponent');
    that.OrderDetailComponent.showOrderDetail(options.id);
  }

})