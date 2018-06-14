// pages/editAddress/editAddress.js
var request = require('../../utils/Request.js')
var address = require('../../utils/city.js')
var app = getApp();
var animation;

Page({
  data: {
    animationAddressMenu: {},
    value: [0, 0, 0],
    provinces: [],
    citys: [],
    areas: []
  },
  
  onLoad: function (options) {
    var that = this;
    that.setData({ addressId: options.id });

    //查询客户详细收货地址
    if (that.data.addressId) {
      request.getDetailAddress({ userAddressId: that.data.addressId }, function (data) {
        that.setData({
          contacter: data.result.name,
          contactPhone: data.result.phone,
          areaInfo: data.result.region,
          contactAddress: data.result.address
        });
      });
    }

    app.getSystemInfo(function (systemInfo) {
      that.setData({
        pickviewHeight: (systemInfo.windowHeight / 3)
      })
    })

    //初始化省市区pickerView选择数据
    var animation = wx.createAnimation({
      duration: 400,
      transformOrigin: "50% 50%",
      timingFunction: 'ease',
    })
    that.animation = animation;
    // 默认联动显示北京
    var id = address.provinces[0].id
    that.setData({
      provinces: address.provinces,
      citys: address.citys[id],
      areas: address.areas[address.citys[id][0].id],
    })
  },
  // 点击所在地区弹出选择框
  selectDistrict: function (e) {
    var that = this

    if (that.data.addressMenuIsShow) {
      return
    }
    that.startAddressAnimation(true, 0);
  },
  onSaveAddress: function () {
    var that = this;

    if (that.data.contacter.length > 0 && that.data.contactPhone.length > 0 && that.data.areaInfo.length > 0 && that.data.contactAddress.length > 0) {
      var weChatUserAddress = {
        name: that.data.contacter,
        phone: that.data.contactPhone,
        region: that.data.areaInfo,
        address: that.data.contactAddress
      };

      if (that.data.addressId) {
        weChatUserAddress.id = that.data.addressId;
      }

      request.saveAddress(weChatUserAddress, function (data) {
        if (data.retCode == 2) {
          wx.showLoading({
            title: '保存地址失败',
            icon: 'none'
          })
        } else {
          wx.showLoading({
            title: '保存中...',
          })
          var pages = getCurrentPages()
          var prevPage = pages[pages.length - 3]

          prevPage.setData({
            currentAddress: data.result
          })
          wx.navigateBack({
            delta: 2
          })
        }
      });
    }
  },
  //输入框操作
  onInputFocus: function (e) {
    var that = this;
    if (that.data.addressMenuIsShow) {
      that.startAddressAnimation(false, -that.data.pickviewHeight);
    }
  },
  bindContacterInput: function (e) {
    var that = this;
    that.setData({ contacter: e.detail.value.replace(/(^\s+)|(\s+$)/g, '') })
  },
  bindContacterPhoneInput: function (e) {
    var that = this;
    that.setData({ contactPhone: e.detail.value.replace(/(^\s+)|(\s+$)/g, '') })
  },
  bindContacterAddressInput: function (e) {
    var that = this;
    that.setData({ contactAddress: e.detail.value.replace(/(^\s+)|(\s+$)/g, '') })
  },
  //执行省市区选择pickerView动画
  startAddressAnimation: function (isShow) {
    var that = this
    if (isShow) {
      that.animation.translateY(0 + 'vh').step()
    } else {
      that.animation.translateY(40 + 'vh').step()
    }
    that.setData({
      animationAddressMenu: that.animation.export(),
      addressMenuIsShow: isShow,
    })
  },
  // 点击地区选择取消按钮
  cityCancel: function (e) {
    var that = this;
    that.startAddressAnimation(false, -that.data.pickviewHeight)
  },
  // 点击地区选择确定按钮
  citySure: function (e) {
    var that = this
    var value = that.data.value
    that.startAddressAnimation(false, -that.data.pickviewHeight);
    // 将选择的城市信息显示到输入框
    var areaInfo = that.data.provinces[value[0]].name + ' ' + that.data.citys[value[1]].name + ' ' + that.data.areas[value[2]].name
    that.setData({
      areaInfo: areaInfo,
    })
  },
  hideCitySelected: function (e) {
    this.startAddressAnimation(false, -that.data.pickviewHeight)
  },
  // 处理省市县联动逻辑
  cityChange: function (e) {
    var value = e.detail.value
    var provinces = this.data.provinces
    var citys = this.data.citys
    var areas = this.data.areas
    var provinceNum = value[0]
    var cityNum = value[1]
    var countyNum = value[2]
    if (this.data.value[0] != provinceNum) {
      var id = provinces[provinceNum].id
      this.setData({
        value: [provinceNum, 0, 0],
        citys: address.citys[id],
        areas: address.areas[address.citys[id][0].id],
      })
    } else if (this.data.value[1] != cityNum) {
      var id = citys[cityNum].id
      this.setData({
        value: [provinceNum, cityNum, 0],
        areas: address.areas[citys[cityNum].id],
      })
    } else {
      this.setData({
        value: [provinceNum, cityNum, countyNum]
      })
    }
  }
})