var request = require('../utils/Request.js')
var Login = require('../utils/Login.js')

//门店request
function queryStoreRequest(location, keyword, page, size,callBack) {
  var that = this;

  wx.showLoading();

  var options = {
    key: Login.ConfigData.wechatAppKey,
    pageNo: page,
    pageSize: size
  };

  if(keyword){
    options.keyword = keyword;
  }

  if (location != null) {
    options.lat = location.y;
    options.lng = location.x;
  }

  request.queryStoreList(options, function (data) {
    if (data.result.content.length > 0) {
      for (var i = 0; i < data.result.content.length; i++) {
        var store = data.result.content[i];

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
      }
      typeof callBack == "function" && callBack(data.result)
    }
    wx.hideLoading();
  });
}

module.exports = {
  queryStoreRequest: queryStoreRequest
}