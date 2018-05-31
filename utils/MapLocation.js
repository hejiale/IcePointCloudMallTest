var QQMapWX = require('../utils/qqmap-wx-jssdk.js');
var Login = require('../utils/Login.js')

function queryMapLocation(address, callBack) {
  if (address != null) {
    addressPosition(address, function (res) {
      if (res) {
        exchangePosition({ longitude: res.lng, latitude: res.lat }, function (e) {
          typeof callBack == "function" && callBack(e)
        })
      } else {
        typeof callBack == "function" && callBack(null)
      }
    });
  } else {
    wx.getLocation({
      success: function (res) {
        exchangePosition(res, function (e) {
          console.log(res);
          typeof callBack == "function" && callBack(e)
        })
      }, fail: function (e) {
        typeof callBack == "function" && callBack(null)
      }
    })
  }
}

//腾讯坐标转百度坐标
function exchangePosition(res, callBack) {
  wx.request({
    url: 'https://api.map.baidu.com/geoconv/v1/?coords=' + res.longitude + ',' + res.latitude + '&from=1&to=5&ak=5Bep8ZOHwOtQj7HVSPwm4u5cI8uiK71f',
    success: function (e) {
      typeof callBack == "function" && callBack(e.data.result[0])
    }
  })
}

function mapPosition(item) {
  //百度地图转腾讯地图坐标
  var demo = new QQMapWX({
    key: Login.ConfigData.qqMapKey
  });

  demo.reverseGeocoder({
    location: {
      latitude: item.latitude,
      longitude: item.longitude
    },
    coord_type: 3,
    success: function (res) {
      var location = res.result.ad_info.location;

      wx.openLocation({
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lng),
      })
    }
  });
}

function addressPosition(address, callBack) {
  var demo = new QQMapWX({
    key: Login.ConfigData.qqMapKey
  });

  demo.geocoder({
    address: address,
    success: function (res) {
      console.log(res);
      typeof callBack == "function" && callBack(res.result.location)
    },
    fail: function (res) {
      console.log(res);
      typeof callBack == "function" && callBack(null)
    }
  });
}

module.exports = {
  queryMapLocation: queryMapLocation,
  mapPosition: mapPosition,
  addressPosition: addressPosition
}