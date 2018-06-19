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

function indexOfFloat(value) {
  var valueStr = value.toString();

  if (valueStr.indexOf('.') != -1) {
    return parseFloat(valueStr.substring(0, valueStr.indexOf('.') + 3));
  } else {
    return parseFloat(valueStr);
  }
}

function compare(a, b, c) {
  if (a < b) {
    if (a < c) {
      return a;
    }
    return c;
  } else {
    if (b < c) {
      return b;
    }
    return c;
  }
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
  indexOfFloat: indexOfFloat,
  compare: compare,
  Config
}
