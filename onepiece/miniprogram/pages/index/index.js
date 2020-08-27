//index.js
const app = getApp()

const db=wx.cloud.database(); //初始化数据库

Page({
  data: {
    openid: '',
    videos: [],
    currentVideo: {},  // {_id, fileID, _openid}
    currentIndex: 9
  },

  changeVideo:function(e) {
    console.log(e.currentTarget.dataset);
    const video = e.currentTarget.dataset.video;
    console.log(video);
    this.setData({
      currentVideo: video
    })
  },

  uploadVideo: function () {
    wx.chooseVideo({
      sourceType: ['album','camera'],
      maxDuration: 60*30,
      // compressed: false,
      camera: 'back',
      success(res) {
        console.log(res.tempFilePath)
        wx.cloud.uploadFile({
          cloudPath: "videos/"+new Date().getTime()+'.mp4',
          filePath: res.tempFilePath, // 文件路径
          success: res => {
            console.log(res)
            wx.showLoading({
              title: '上传中',
            })
            //保存fileID至数据库
            db.collection('videos').add({
              data:{
                _id: '933',
                fileID: res.fileID
              }
            }).then(res=>{
              console.log(res);
              wx.hideLoading()  //关闭提示框
              wx.showModal({
                title: '通知',
                content: '视频上传成功！',
              })
            }).catch(err=>{
              console.error(err);
            })
          },
          fail: err => {
            console.log(err)
          }
        })
      }
    })
  },

  onLoad: function() {
    // 获取video fileID
    db.collection('videos').orderBy('_id', 'asc').get().then(res=>{
      // console.log(res.data);
      const len = res.data.length;
      this.setData({
        videos: res.data,
        currentVideo: res.data[len-1],
        currentIndex: len-1
      })
    }).catch(err=>console.log(err))

    // 获取用户openid
    wx.cloud.callFunction({
      name:'login'
    }).then(res=>{
      console.log(res.result.openid)
      this.setData({
        openid: res.result.openid
      })
    }).catch(err=>{
      console.log(err)
    })

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })
  },

  onGetUserInfo: function(e) {
    if (!this.data.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        
        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            
            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },

})
