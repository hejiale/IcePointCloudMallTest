var app = getApp();

//获取商品图片预加载高度
function getImageAutoHeight(cb) {
  var that = this

  app.getSystemInfo(function (systemInfo) {
    var singleLayoutHeight = ((systemInfo.windowWidth * 0.8 * 9) / 16);
    var doubleLayoutHeight = ((systemInfo.windowWidth * 0.5 * 0.8 * 9) / 16);

    typeof cb == "function" && cb(singleLayoutHeight, doubleLayoutHeight);
  })
}

var Config = {
  //本地保存商品搜索记录key
  historySearchWords: 'historySearchWordsKey',
  //下单商品集合
  orderProducts: null,
  //专场详情object
  templateObject: null,
}

module.exports = {
  getImageAutoHeight: getImageAutoHeight,
  Config
}
