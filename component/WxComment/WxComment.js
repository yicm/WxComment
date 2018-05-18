// TODO
// - 按查询条数分段显示
// - 添加回复功能
// - 支持图像显示
// - 支持markdown语法
// - ....

const AV = require('../../libs/leancloud/av-weapp-min.js');
// LeanCloud 应用的 ID 和 Key
AV.init({
  appId: 'your leancloud appid',
  appKey: 'your leancloud appkey',
});

Component({
    properties: {
      tipOne: {
        type: String,
        value: 'Markdown'
      },
      tipTwo: {
        type: String,
        value: 'will be supported, Powered by yicm.'
      },
      submitBtnText: {
        type: String,
        value: '回复'
      },
      articleID: {
        type: String,
        value: '',
        observer: function(newVal, oldVal) {
          var that = this;
          var query = new AV.Query('WxComment');
          query.equalTo('article_id', this.data.articleID);
          // descending:降序/ascending:升序
          query.descending('updateAt');
          // 同时查询包含对象Pointer的详细信息
          query.include('targetUser');
          query.find().then(function (results) {            
            //console.log(results);
            // 处理初次加载的评论
            for(var i = 0; i < results.length; i++) {
              var item = {};
              item['articleID'] = results[i].attributes.article_id;
              item['nickName'] = results[i].attributes.targetUser.attributes.nickName;
              item['avatarUrl'] = results[i].attributes.targetUser.attributes.avatarUrl;
              item['content'] = results[i].attributes.content;
              item['time'] = results[i].attributes.time;
              item['at'] = results[i].attributes.at;
              
              that.data.leancloud_comment_data.push(item);
            }
            that.setData({
              leancloud_comment_data: that.data.leancloud_comment_data,
              comment_num: results.length
            });
          }, function (error) {
            wx.showToast({
              title: '评论加载失败！',
              icon: 'none',
              duration: 2000
            })
          });
        }
      },
      contentLen: {
        // 评论内容至少为多长限制
        type: Number,
        value: 1
      }
    },
    data: {
      comment_id: "",
      comment_data: "",
      comment_num: 0,
      show_aur_button: false,
      user_info: [],
      login_user_info:[],
      leancloud_comment_data: []
    },
    methods: {
      // 事件响应函数
      bindFormSubmit: function(e) {
        var that = this;
        // 判断内容是否满足要求
        console.log(that.data.contentLen);
        if (e.detail.value.comment_text.length <= that.data.contentLen) {
          wx.showToast({
            title: '评论内容长度不够！',
            icon: 'none',
            duration: 2000
          })
          return ;
        }

        console.log(that.data.articleID);
        that.data.comment_id = that.data.articleID;
        that.data.comment_data = e.detail.value.comment_text;

        // 获取用户信息
        wx.getSetting({
          success(res) {
            if (!res.authSetting['scope.userInfo']) {
              console.log("没有授权获取用户信息");
              wx.showToast({
                title: '没有授权获取用户信息',
                icon: 'none',
                duration: 2000
              })
              that.setData({
                show_aur_button: true
              });
            } else {
              console.log("已经授权获取用户信息，开始获取信息");
              wx.getUserInfo({
                success: function (res) {
                  that.setData({
                    user_info: res.userInfo
                  });
                  // LeanCloud 用户一键登录
                  AV.User.loginWithWeapp().then(user => {
                    console.log('user...');
                    console.log(user);
                    that.data.login_user_info = user.toJSON();
                    //console.log(that.data.login_user_info);
                    // 更新LeanCloud用户信息
                    that._updateUserInfoInLeanCloud();
                    // 写入评论
                    // 写入并更新显示评论
                    that._writeCommentInLeanCloud();
                  }).catch(console.error);
                }
              })
            }
          }, fail: function () {
            console.log("获取用户的当前设置失败");
          }
        })

      },
      onGotUserInfo: function(e) {
        var that = this;
        if(e.detail.userInfo) {
          console.log(e.detail.userInfo);
          wx.showToast({
            title: '授权成功！',
            icon: 'success',
            duration: 2000
          })
          that.setData({
            user_info: e.detail.userInfo,
            show_aur_button: false
          });
          // LeanCloud 一键登录
          AV.User.loginWithWeapp().then(user => {
            that.data.login_user_info = user.toJSON();
            // 更新LeanCloud用户信息
            that._updateUserInfoInLeanCloud();            
          }).catch(console.error);
        }
      },
      _updateUserInfoInLeanCloud: function() {
        // 获得当前登录用户
        const user = AV.User.current();
        // 调用小程序 API，得到用户信息
        wx.getUserInfo({
          success: ({ userInfo }) => {
            // 更新当前用户的信息
            user.set(userInfo).save().then(user => {
              // 成功，此时可在控制台中看到更新后的用户信息
              this.data.login_user_info = user.toJSON();
            }).catch(console.error);
          },
          fail: function() {
            console.log("获取用户信息失败");
          }
        });
      },
      _getTime: function () {
        //获取当前时间戳  
        var timestamp = Date.parse(new Date());
        var n = timestamp;
        var date = new Date(n);
        //年  
        var Y = date.getFullYear();
        //月  
        var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
        //日  
        var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
        //时  
        var h = date.getHours();
        //分  
        var m = date.getMinutes();
        //秒  
        var s = date.getSeconds();
        return  Y +'-'+ M +'-'+ D +' '+ h + ":" + m + ":" + s;
      },
      // 自定义方法
      _writeCommentInLeanCloud: function () {
        var that = this;
        var WxComment = AV.Object.extend('WxComment');
        var wxcomment = new WxComment();
        var current_time = that._getTime();
        const user = AV.User.current();
        console.log(that.data.login_user_info);
        wxcomment.set('username', that.data.login_user_info.username);
        wxcomment.set('article_id', that.data.comment_id);
        wxcomment.set('content', that.data.comment_data);
        wxcomment.set('time', current_time);
        wxcomment.set('at', '');
        var targetUser = AV.Object.createWithoutData('_User', user.id);
        wxcomment.set('targetUser', targetUser);
        wxcomment.save().then(function (wxcomment) {
          // 成功保存之后，执行其他逻辑.
          wx.showToast({
            title: '评论成功！',
            icon: 'success',
            duration: 2000
          });
          // 同步更新评论显示
          // nickName/city/country/gender/province
          var current_comment = {};
          current_comment['articleID'] = that.data.articleID;
          current_comment['nickName'] = that.data.login_user_info.nickName;
          current_comment['avatarUrl'] = that.data.login_user_info.avatarUrl;
          current_comment['time'] = current_time;
          current_comment['content'] = that.data.comment_data;
          current_comment['at'] = '';
          that.data.leancloud_comment_data.push(current_comment);
          that.setData({
            leancloud_comment_data: that.data.leancloud_comment_data,
            comment_num: that.data.comment_num + 1,
            comment_data: ''
          });
        }, function (error) {
          // 异常处理
          wx.showToast({
            title: '评论失败！',
            icon: 'none',
            duration: 2000
          })
        });
      }
    },
    _getCommentsInLeanCloud: function() {
      var query = new AV.Query('WxComment');
      query.equalTo('article_id', this.data.articleID);
      query.find().then(function (results) {
        // 如果这样写，第二个条件将覆盖第一个条件，查询只会返回 priority = 1 的结果
        console.log(results);
      }, function (error) {
        wx.showToast({
          title: '评论加载失败！',
          icon: 'none',
          duration: 2000
        })
      });
    },
    _articleIDChange: function(newVal, oldVal) {
      //[BUG] observer无法进入自定义函数
      console.log('observer...');
      //newVal == this.data.articleID
      //加载LeanCloud对应articleID评论
      console.log(this.data.articleID);
      this._getCommentsInLeanCloud();
    },
    created: function() {            
      //console.log('create...');
    },
    ready: function() {
      //console.log('ready...');
    }
})
