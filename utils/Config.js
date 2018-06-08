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

function parseStatusName(status) {
  if (status == 'NOT_PAY') {
    return '未支付';
  } else if (status == 'PENDING_DELIVERY') {
    return '待发货';
  } else if (status == 'GOODS_TO_BE_RECEIVED') {
    return '待收货';
  } else if (status == 'COMPLETE_TRANSACTION') {
    return '交易完成';
  } else if (status == 'CLOSED') {
    return '交易关闭';
  }
}

function js_date_time(unixtime) {
  var dateTime = new Date(parseInt(unixtime));  
  var year = dateTime.getFullYear();
  var month = dateTime.getMonth() + 1;
  var day = dateTime.getDate();

  var now = new Date();
  var now_new = Date.parse(now.toDateString()); 
  var milliseconds = now_new - dateTime;
  var timeSpanStr = year + '/' + month + '/' + day;
  return timeSpanStr;
}

var Config = {
  //本地保存商品搜索记录key
  historySearchWords: 'historySearchWordsKey',
  //下单商品集合
  orderProducts: null
}

module.exports = {
  getImageAutoHeight: getImageAutoHeight,
  parseStatusName: parseStatusName,
  js_date_time: js_date_time,
  Config
}
