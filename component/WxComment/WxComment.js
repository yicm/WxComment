/*
* author: yicm1102@gmail.com
* github: https://github.com/yicm/WxComment
* github_page: https://yicm.github.io
*/
const AV = require('../../libs/leancloud/av-weapp-min.js');
var Common = require('../../libs/scripts/common.js');
// LeanCloud 应用的 ID 和 Key
AV.init({
  appId: 'your appid',
  appKey: 'your appkey',
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
    textMaxLength: {
      type: Number,
      value: 300
    },
    articleTitle: {
      type: String,
      value: ''
    },
    articleURL: {
      type: String,
      value: ''
    },
    articleID: {
      type: String,
      value: '',
      observer: function (newVal, oldVal) {
        console.log(this.data.articleID);
        var that = this;
        // 定义内部Promise相关函数
        function promiseGetSubComment(index, p_id) {
          return new Promise(function (resolve, reject) {
            var sub_query = new AV.Query('WxSubComment');
            sub_query.ascending('createdAt');
            sub_query.include('targetUser');
            sub_query.include('targetZan');
            sub_query.equalTo('p_id', p_id)
            sub_query.find().then(function (sub_comments) {
              resolve([index, p_id, sub_comments]);
            })
          });
        }

        wx.showLoading({
          title: '加载中',
        })
        setTimeout(function () {
          wx.hideLoading()
        }, 3000)
        // 文章阅读量和文章点赞统计和显示
        var count_query = new AV.Query('Count');
        count_query.equalTo('article_id', that.data.articleID);
        count_query.find().then(function (results) {
          // 阅读量统计对象一文章对应一对象
          if (results.length == 1) {
            var count_todo = AV.Object.createWithoutData('Count', results[0].id);
            count_todo.save().then(function (count_todo) {
              count_todo.increment('views', 1);
              count_todo.fetchWhenSave(true);
              return count_todo.save();
            }).then(function (count_todo) {
              // show
              //console.log(count_todo);
              //console.log(count_todo.attributes.views);
              that.setData({
                article_views: count_todo.attributes.views
              });
            }, function (error) {
              // 异常处理
              console.log(error);
            });
          }
          else if (results.length == 0) {            
            // 初始化文章统计对象
            var ArticleCount = AV.Object.extend('Count');
            var articlecount = new ArticleCount();
            articlecount.set('article_id', that.data.articleID);
            articlecount.set('views', 1);
            articlecount.set('zan', 0);
            articlecount.save();
            // show
            that.setData({
              article_views: 1
            });
            // 初始化文章评论计数
            var ArticleCommentCount = AV.Object.extend('WxCommentCount');
            var articlecommentcount = new ArticleCommentCount();
            articlecommentcount.set('article_id', that.data.articleID);
            articlecommentcount.set('article_title', that.data.articleTitle);
            articlecommentcount.set('article_url', that.data.articleURL);
            articlecommentcount.set('count', 0);
            articlecommentcount.save();
          }
          else {
            console.log(that.data.articleID);
            console.log("文章ID有重复，请检查！");
          }
        }, function (error) {
          console.log(error.message);
          console.log(error.code);
          // https://leancloud.cn/docs/error_code.html#hash1444
          // 第一次创建Count Class
          if (error.code == 101) {
            var ArticleCount = AV.Object.extend('Count');
            var articlecount = new ArticleCount();
            articlecount.set('article_id', that.data.articleID);
            articlecount.set('views', 1);
            articlecount.set('zan', 0);
            articlecount.save();
            // show
            that.setData({
              article_views: 1
            });
          }
        });

        // 完成阅读量统计查询，Then...
        // 加载评论列表和评论点赞信息
        AV.User.loginWithWeapp().then(user => {
          that.data.leancloud_user_id = user.id;
          that.data.login_user_info = user.toJSON();

          var query = new AV.Query('WxComment');
          query.equalTo('article_id', that.data.articleID);
          // descending:降序/ascending:升序
          query.ascending('createdAt');
          // 同时查询包含对象Pointer的详细信息
          query.include('targetUser');
          query.include('targetZan');
          query.include('subCommentList');
          query.find().then(function (results) {
            //console.log(results);
            that.data.all_comment_num = results.length;
            // 处理初次加载的评论
            var promiseFuncArr = [];
            for (var i = 0; i < results.length; i++) {
              var item = {};
              item['p_index'] = i;
              item['p_id'] = results[i].id;
              item['id'] = results[i].id;
              item['userId'] = results[i].attributes.targetUser.id;
              item['zanId'] = results[i].attributes.targetZan.id;
              // 赞list
              var zanUserList = results[i].attributes.targetZan.attributes.userList;
              item['zanCurrent'] = false;
              for (var j = 0; j < zanUserList.length; j++) {
                if (zanUserList[j] == that.data.leancloud_user_id) {
                  item['zanCurrent'] = true;
                  break;
                } else {
                  item['zanCurrent'] = false;
                }
              }

              item['zanNum'] = results[i].attributes.targetZan.attributes.zan;
              item['articleID'] = results[i].attributes.article_id;
              item['nickName'] = results[i].attributes.targetUser.attributes.nickName;
              if (item['nickName'].length > 12) {
                item['showNickName'] = item['nickName'].substr(0, 12) + "...";
              }
              else {
                item['showNickName'] = item['nickName'];
              }
              item['pre_' + item['id']] = item['nickName'];
              item['avatarUrl'] = results[i].attributes.targetUser.attributes.avatarUrl;
              item['content'] = results[i].attributes.content;
              item['time'] = Common.timeAgoWithTimeStr(results[i].attributes.time);
              item['at'] = results[i].attributes.at;

              item['subCommentList'] = [];
              if (results[i].attributes.subCommentList.length > 0) {
                that.data.all_comment_num = that.data.all_comment_num + results[i].attributes.subCommentList.length;
                that.data.leancloud_comment_data.push(item);
                promiseFuncArr.push(promiseGetSubComment(i, results[i].id));
              } else {
                that.data.leancloud_comment_data.push(item);
              }
            } // end for results

            var p = Promise.resolve();
            for (var x = 0; x <= promiseFuncArr.length; x++) {
              (function (x) {
                p = p.then(function (data) {
                  // 第一次data为空promise，undefined
                  // 开始处理子评论
                  if (x > 0) {
                    var p_index = data[0];
                    var p_id = data[1];
                    var sub_comments = data[2];
                    for (var k = 0; k < sub_comments.length; k++) {
                      var sub_item = {}
                      sub_item['p_index'] = p_index;
                      sub_item['p_id'] = p_id;
                      sub_item['id'] = sub_comments[k].id;
                      sub_item['userId'] = sub_comments[k].attributes.targetUser.id;
                      sub_item['zanId'] = sub_comments[k].attributes.targetZan.id;
                      // 子评论赞list
                      var subzanUserList = sub_comments[k].attributes.targetZan.attributes.userList;
                      sub_item['zanCurrent'] = false;
                      for (var m = 0; m < subzanUserList.length; m++) {
                        if (subzanUserList[m] == that.data.leancloud_user_id) {
                          sub_item['zanCurrent'] = true;
                          break;
                        } else {
                          sub_item['zanCurrent'] = false;
                        }
                      }
                      sub_item['zanNum'] = sub_comments[k].attributes.targetZan.attributes.zan;
                      sub_item['articleID'] = sub_comments[k].attributes.article_id;
                      sub_item['nickName'] = sub_comments[k].attributes.targetUser.attributes.nickName;
                      if (sub_item['nickName'].length > 12) {
                        sub_item['showNickName'] = sub_item['nickName'].substr(0, 12) + "...";
                      }
                      else {
                        sub_item['showNickName'] = sub_item['nickName'];
                      }
                      sub_item['pre_' + sub_item['id']] = sub_item['nickName'];
                      sub_item['avatarUrl'] = sub_comments[k].attributes.targetUser.attributes.avatarUrl;
                      sub_item['content'] = sub_comments[k].attributes.content;
                      sub_item['time'] = Common.timeAgoWithTimeStr(sub_comments[k].attributes.time);
                      sub_item['at'] = sub_comments[k].attributes.at;
                      that.data.leancloud_comment_data[p_index].subCommentList.push(sub_item)
                    } // end for subcoments
                  } // end if
                  if (x == promiseFuncArr.length) {
                    //console.log('finished')
                    console.log(that.data.all_comment_num);
                    // 显示所有评论
                    that.setData({
                      leancloud_comment_data: that.data.leancloud_comment_data,
                      comment_num: that.data.leancloud_comment_data.length
                    });
                    that._isAdmin();
                    return null;
                  }
                  // 当x为length时，return promiseFuncArr[x]()后，循环退出，
                  // 没有then方法获取promiseFuncArr[x]()的回调
                  // 因此多循环一次
                  return promiseFuncArr[x];
                });
              })(x)
            }

            wx.hideLoading();
          }).catch(console.error);
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
    textarea_focus: false,
    is_sub_comment: false,
    sub_comment_p_comment_id: '',
    sub_comment_p_index: -1,
    article_id: "",
    comment_count_id: "",
    comment_data: "",
    comment_num: 0,
    all_comment_num: 0,
    show_aur_button: false,
    user_info: [],
    leancloud_user_id: '',
    login_user_info: [],
    leancloud_comment_data: [],
    leancloud_comment_zan_data: [],
    article_views: 0,
    is_admin: false
  },
  methods: {
    // 事件响应函数
    bindFormSubmit: function (e) {
      var that = this;
      // 判断内容是否满足要求
      //console.log(that.data.contentLen);
      if (e.detail.value.comment_text.length <= that.data.contentLen) {
        wx.showToast({
          title: '评论内容长度不够！',
          icon: 'none',
          duration: 2000
        })
        return;
      }

      //console.log(that.data.articleID);
      that.data.article_id = that.data.articleID;
      that.data.comment_data = e.detail.value.comment_text;

      // 双重判断是否是子评论
      if (that.data.is_sub_comment) {
        // 再通过文本内容是否含有@字符判断
        if (that.data.comment_data.charAt(0) == '@') {
          // Done
        }
        else {
          that.data.is_sub_comment = false
        }
      }

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
            that.setData({
              comment_textarea_value: ''
            })

            wx.getUserInfo({
              success: function (res) {
                that.setData({
                  user_info: res.userInfo
                });
                // LeanCloud 用户一键登录
                AV.User.loginWithWeapp().then(user => {
                  //console.log('user...');
                  //console.log(user);
                  that.data.login_user_info = user.toJSON();
                  //console.log(that.data.login_user_info);
                  // 更新LeanCloud用户信息
                  that._updateUserInfoInLeanCloud();
                  // 写入评论
                  // 写入并更新显示评论
                  if (that.data.is_sub_comment) {
                    // 子评论
                    that._writeSubCommentInLeanCloud();
                    that.data.is_sub_comment = false;
                  }
                  else {
                    that._writeCommentInLeanCloud();
                  }
                }).catch(console.error);
              }
            })
          }
        }, fail: function () {
          console.log("获取用户的当前设置失败");
        }
      })

    },
    commentTextTap: function (e) {
      //console.log('commentTextTap')
      // 子评论
      var that = this;
      var parent_comment_id = e.currentTarget.dataset.p_comment_id;
      var user_id = e.currentTarget.dataset.user_id;
      var comment_id = e.currentTarget.dataset.comment_id;
      var nickname = e.currentTarget.dataset.nickname;
      var p_index = e.currentTarget.dataset.p_index;

      //console.log(p_index)
      //console.log(parent_comment_id)

      that.setData({
        comment_textarea_value: '@' + nickname + ' ',
        textarea_focus: true,
      })

      that.data.is_sub_comment = true;
      that.data.sub_comment_p_comment_id = parent_comment_id;
      that.data.sub_comment_p_index = p_index;
      // 使页面滚动到底部
      wx.pageScrollTo({
        scrollTop: 10000
      })
    },
    _isAdmin: function() {
      var that = this;
      const user = AV.User.current();

      var query = new AV.Query('Admin');
      query.equalTo('adminId', user.id);
      query.find().then(function (results) {
        if(results.length >= 1) {
          that.data.is_admin = true;
          wx.showToast({
            title: '欢迎Admin!',
            icon: 'success',
            duration: 1000
          })
        }
      }, function(error) {
        console.log(error)
        // 101: 查询的 Class 不存在
        if (error.code == 101) {
          wx.showToast({
            title: 'Admin Class不存在,请手动添加',
            icon: 'none',
            duration: 2000
          })
        }
      })
    },
    _writeCommentSubscribeInLeanCloud: function() {
      var that = this;
      // 评论订阅
      const user = AV.User.current();
      // 先判断评论订阅Class里面是否已有当前用户ID
      var query = new AV.Query('WxCommentSubscribe');
      query.equalTo('user_id', user.id);
      query.find().then(function (results) {
        //console.log(results);
        if(results.length == 1) {
          var op_str = "update WxCommentSubscribe set comment_count_array=op('AddUnique', {'objects':[pointer('WxCommentCount','" + that.data.comment_count_id + "')]}) where objectId='" + results[0].id + "'";
          AV.Query.doCloudQuery(op_str).then(function (data) {
            console.log('更新评论订阅成功');
          }, function (error) {
            // 异常处理
            console.error(error);
          });
        } 
        else if(results.length > 1){
          console.log('WxCommentSubscribe ID重复')
        }
        else{
          console.log('评论订阅还未有该用户')
          console.log(results.length)
          var ArticleCommentSubscribe = AV.Object.extend('WxCommentSubscribe');
          var articlecommentsubscribe = new ArticleCommentSubscribe();
          // writeCommentCountInLeanCloud必须先执行
          var comment_count_obj = AV.Object.createWithoutData('WxCommentCount', that.data.comment_count_id);
          articlecommentsubscribe.addUnique('comment_count_array', [comment_count_obj]);
          articlecommentsubscribe.set('user_id', user.id);
          articlecommentsubscribe.save();
        }
      }, function (error) {
        console.log(error);
        console.log(error.code)
        // 101: 查询的 Class 不存在
        if(error.code == 101) {
          console.log(that.data.comment_count_id);
          var ArticleCommentSubscribe = AV.Object.extend('WxCommentSubscribe');
          var articlecommentsubscribe = new ArticleCommentSubscribe();
          // writeCommentCountInLeanCloud必须先执行
          var comment_count_obj = AV.Object.createWithoutData('WxCommentCount', that.data.comment_count_id);
          articlecommentsubscribe.addUnique('comment_count_array', [comment_count_obj]);
          articlecommentsubscribe.set('user_id', user.id);
          articlecommentsubscribe.save();
        }
      });
    },
    _writeCommentCountInLeanCloud: function() {
      // 更新评论计数
      var that = this;
      //console.log('开始更新评论计数');
      var commentcount_query = new AV.Query('WxCommentCount');
      commentcount_query.equalTo('article_id', that.data.articleID);
      commentcount_query.find().then(function (results) {
        //console.log(results.length)
        if (results.length == 1) {
          var todo = AV.Object.createWithoutData('WxCommentCount', results[0].id);
          todo.set('count', that.data.all_comment_num);
          todo.set('article_url', that.data.articleURL)
          todo.save().then(function(todo){
            that.data.comment_count_id = todo.id;
            // 更新用户评论订阅,count增加和减少都触发订阅
            that._writeCommentSubscribeInLeanCloud();
          }) 
        }
        else if (results.length > 1) {
          console.log("WxCommentCount有重复ID");
        }
        else {
          console.log("还未创建WxCommentCount对象");
          // TODO
          // BUG: 会出现discovery_discovery_xxxid
          // 初始化文章评论计数
          var ArticleCommentCount = AV.Object.extend('WxCommentCount');
          var articlecommentcount = new ArticleCommentCount();
          articlecommentcount.set('article_id', that.data.articleID);
          articlecommentcount.set('article_title', that.data.articleTitle);
          articlecommentcount.set('article_url', that.data.articleURL);
          articlecommentcount.set('count', 0);
          articlecommentcount.save();
        }
      }, function (error) {
        console.log(error)
      });
    },
    commentLongTap: function (e) {
      var that = this;
      wx.showModal({
        title: '提示',
        content: '确定删除该评论吗？',
        success: function (res) {
          if (res.confirm) {
            //console.log('用户点击确定')
            // 长按删除评论
            AV.User.loginWithWeapp().then(user => {
              if (user.id == e.currentTarget.dataset.user_id || that.data.is_admin) {
                // 如果该评论下有子评论
                // 1.可以删除父评论和所有子评论？2.还是只能所以子评论删除完毕后才可以删除？
                // Done 1
                var p_index = e.currentTarget.dataset.p_index;
                if (that.data.leancloud_comment_data[p_index].subCommentList.length > 0) {
                  // 父评论下有子评论
                  wx.showModal({
                    title: '提示',
                    content: '父评论下有子评论，无法删除！',
                    showCancel: false,
                    success: function (res) {
                      if (res.confirm) {
                        console.log('用户点击确定')
                        // nothing to do
                      } else if (res.cancel) {
                        console.log('用户点击取消')
                      }
                    }
                  })
                  return;
                }

                //console.log('当前登陆用户与待删除评论用户id相同');
                var todo = new AV.Object.createWithoutData('WxComment', e.currentTarget.dataset.comment_id);
                todo.destroy().then(function (success) {
                  // 删除成功
                  // 删除评论对应的点赞对象
                  //console.log(e.currentTarget.dataset.zan_id)
                  var zantodo = new AV.Object.createWithoutData('Zan', e.currentTarget.dataset.zan_id);
                  zantodo.destroy().then(function (success) {
                    // 删除评论对应赞成功
                    wx.showToast({
                      title: '删除评论成功！',
                      icon: 'success',
                      duration: 2000
                    })
                    // 同步本地显示
                    var index;
                    //console.log(that.data.leancloud_comment_data.length);
                    for (var i = 0; i < that.data.leancloud_comment_data.length; i++) {
                      if ((that.data.leancloud_comment_data[i].id).indexOf(e.currentTarget.dataset.comment_id) > -1) {
                        index = i;
                        that.data.leancloud_comment_data.splice(index, 1);
                        break;
                      }
                    }
                    // 更新p_id for all comments
                    for (var i = 0; i < that.data.leancloud_comment_data.length; i++) {
                      // update
                      if (i >= index) {
                        that.data.leancloud_comment_data[i].p_index = that.data.leancloud_comment_data[i].p_index - 1;
                        for (var j = 0; j < that.data.leancloud_comment_data[i].subCommentList.length; j++) {
                          that.data.leancloud_comment_data[i].subCommentList[j].p_index = that.data.leancloud_comment_data[i].subCommentList[j].p_index - 1;
                        }
                      }
                    }

                    that.setData({
                      leancloud_comment_data: that.data.leancloud_comment_data,
                      comment_num: that.data.leancloud_comment_data.length
                    })
                    // 更新评论计数
                    that.data.all_comment_num = that.data.all_comment_num - 1;
                    that._writeCommentCountInLeanCloud();
                  }), function (error) {
                    // 删除评论对应赞失败
                    wx.showToast({
                      title: '删除评论赞失败！',
                      icon: 'none',
                      duration: 2000
                    })
                  }
                }, function (error) {
                  // 删除失败
                  wx.showToast({
                    title: '删除评论失败！',
                    icon: 'none',
                    duration: 2000
                  })
                });
              }
              else {
                wx.showToast({
                  title: '无权删除其他用户评论！',
                  icon: 'none',
                  duration: 2000
                })
              }
            }).catch(console.error);
          } else if (res.cancel) {
            //console.log('用户点击取消')
          }
        }
      })
    },
    subCommentLongTap: function (e) {
      var that = this;
      wx.showModal({
        title: '提示',
        content: '确定删除该评论吗？',
        success: function (res) {
          if (res.confirm) {
            //console.log('用户点击确定')
            // 长按删除评论
            AV.User.loginWithWeapp().then(user => {
              if (user.id == e.currentTarget.dataset.user_id || that.data.is_admin) {
                //console.log('当前登陆用户与待删除评论用户id相同');
                var todo = new AV.Object.createWithoutData('WxSubComment', e.currentTarget.dataset.comment_id);
                todo.destroy().then(function (success) {
                  // 删除成功
                  // 删除评论对应的点赞对象
                  //console.log(e.currentTarget.dataset.zan_id)
                  var zantodo = new AV.Object.createWithoutData('SubZan', e.currentTarget.dataset.zan_id);
                  zantodo.destroy().then(function (success) {
                    // 删除评论对应赞成功
                    // 删除父评论WxComment中subCommentList信息
                    var op_str = "update WxComment set subCommentList=op('Remove', {'objects':[pointer('WxSubComment','" + e.currentTarget.dataset.comment_id + "')]}) where objectId='" + e.currentTarget.dataset.p_comment_id + "'";
                    AV.Query.doCloudQuery(op_str).then(function (data) {
                      // 同步本地显示
                      var index;
                      //console.log(that.data.leancloud_comment_data.length);
                      for (var i = 0; i < that.data.leancloud_comment_data[e.currentTarget.dataset.p_index].subCommentList.length; i++) {
                        if ((that.data.leancloud_comment_data[e.currentTarget.dataset.p_index].subCommentList[i].id).indexOf(e.currentTarget.dataset.comment_id) > -1) {
                          index = i;
                          that.data.leancloud_comment_data[e.currentTarget.dataset.p_index].subCommentList.splice(index, 1);
                          break;
                        }
                      }
                      that.setData({
                        leancloud_comment_data: that.data.leancloud_comment_data
                      })
                      // 更新评论计数
                      that.data.all_comment_num = that.data.all_comment_num - 1;
                      that._writeCommentCountInLeanCloud();

                      wx.showToast({
                        title: '删除子评论成功！',
                        icon: 'success',
                        duration: 2000
                      })
                    }, function (error) {
                      // 异常处理
                      console.error(error);
                    });

                  }), function (error) {
                    // 删除评论对应赞失败
                    wx.showToast({
                      title: '删除评论赞失败！',
                      icon: 'none',
                      duration: 2000
                    })
                  }
                }, function (error) {
                  // 删除失败
                  wx.showToast({
                    title: '删除评论失败！',
                    icon: 'none',
                    duration: 2000
                  })
                });
              }
              else {
                wx.showToast({
                  title: '无权删除其他用户评论！',
                  icon: 'none',
                  duration: 2000
                })
              }
            }).catch(console.error);
          } else if (res.cancel) {
            //console.log('用户点击取消')
          }
        }
      })
    },
    _updateZanShow: function (mode, comment_id, is_sub_comment, p_index) {
      var that = this;
      
      if (is_sub_comment == "true") {
        for (var i = 0; i < that.data.leancloud_comment_data[p_index].subCommentList.length; i++) {
          if (that.data.leancloud_comment_data[p_index].subCommentList[i].id == comment_id) {
            if (mode == 'cancel') {
              that.data.leancloud_comment_data[p_index].subCommentList[i].zanNum = that.data.leancloud_comment_data[p_index].subCommentList[i].zanNum - 1;
              that.data.leancloud_comment_data[p_index].subCommentList[i].zanCurrent = false;
            }
            else if (mode == 'submit') {
              that.data.leancloud_comment_data[p_index].subCommentList[i].zanNum = that.data.leancloud_comment_data[p_index].subCommentList[i].zanNum + 1;
              that.data.leancloud_comment_data[p_index].subCommentList[i].zanCurrent = true;
            }

            break;
          }
        }
      }
      else {
        if (mode == 'cancel') {
          that.data.leancloud_comment_data[p_index].zanNum = that.data.leancloud_comment_data[p_index].zanNum - 1;
          that.data.leancloud_comment_data[p_index].zanCurrent = false;
        }
        else if (mode == 'submit') {
          that.data.leancloud_comment_data[p_index].zanNum = that.data.leancloud_comment_data[p_index].zanNum + 1;
          that.data.leancloud_comment_data[p_index].zanCurrent = true;
        }
      }
      that.setData({
        leancloud_comment_data: that.data.leancloud_comment_data
      })
    },
    _writeZanInLeanCloud: function (user_id, comment_id, zan_id, class_name, is_sub_comment, p_index) {
      var that = this;
      // 查询当前用户是否已点赞
      var query = new AV.Query(class_name);
      var search = [that.data.leancloud_user_id];
      query.equalTo('commentObjId', comment_id);
      query.containsAll('userList', search);
      query.find().then(function (results) {
        //console.log(results);      
        if (results.length == 1) {
          // 当前用户已给该评论点赞，取消赞
          var op_str = "update " + class_name + " set zan=op('Decrement', {'amount': 1}),userList=op('Remove', {'objects':[\"" + that.data.leancloud_user_id + "\"]}) where objectId='" + zan_id + "'";
          AV.Query.doCloudQuery(op_str).then(function (data) {
            // data 中的 results 是本次查询返回的结果，AV.Object 实例列表
            // 更新显示, -1
            //console.log('update zan cancel');
            that._updateZanShow('cancel', comment_id, is_sub_comment, p_index);
          }, function (error) {
            // 异常处理
            console.error(error);
          });
        }
        else {
          // 当前用户还未给该评论点赞
          var op_str = "update " + class_name + " set zan=op('Increment', {'amount': 1}),userList=op('AddUnique', {'objects':[\"" + that.data.leancloud_user_id + "\"]}) where objectId='" + zan_id + "'";
          AV.Query.doCloudQuery(op_str).then(function (data) {
            // data 中的 results 是本次查询返回的结果，AV.Object 实例列表
            // 更新显示
            //console.log('update zan submit');
            that._updateZanShow('submit', comment_id, is_sub_comment, p_index);
          }, function (error) {
            // 异常处理
            console.error(error);
          });
        }
      }).catch(console.error);
    },
    zanCommentClick: function (e) {
      var that = this;
      // user_id为评论发布者的用户id，非当前用户id
      var user_id = e.currentTarget.dataset.user_id;
      var comment_id = e.currentTarget.dataset.comment_id;
      var zan_id = e.currentTarget.dataset.zan_id;
      var p_index = e.currentTarget.dataset.p_index;

      var class_name = "Zan";
      if (e.currentTarget.dataset.is_sub_comment == "true") {
        class_name = "SubZan";
      }

      that._writeZanInLeanCloud(user_id, comment_id, zan_id, class_name, e.currentTarget.dataset.is_sub_comment, p_index);
    },
    onGetUserInfo: function (e) {
      var that = this;
      if (e.detail.userInfo) {
        //console.log(e.detail.userInfo);
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
    avatarClicked: function (e) {
      //console.log(e.currentTarget.dataset.user_id);
      var that = this;
      if (e.detail.userInfo) {
        //console.log(e.detail.userInfo);
        // 查阅是否已经关注该用户
        var query = AV.User.current().followeeQuery();
        //query.include('followee');
        var targetFollower = AV.Object.createWithoutData('_Followee', e.currentTarget.dataset.user_id);
        query.equalTo('followee', targetFollower);
        query.find().then(function (followees) {
          // 关注的用户列表 followees
          //console.log(followees);
          if (followees.length == 1) {
            // 已经关注了该用户，是否取关
            wx.showModal({
              title: '提示',
              content: '已关注，是否取消关注该用户？',
              success: function (res) {
                if (res.confirm) {
                  AV.User.current().unfollow(e.currentTarget.dataset.user_id).then(function () {
                    // 取消关注成功
                    wx.showToast({
                      title: '取消关注成功！',
                      icon: 'success',
                      duration: 2000
                    });
                    return;
                  }, function (err) {
                    // 取消关注失败
                    console.log(err);
                    return;
                  });
                }
                else if (res.cancel) {
                  // nothing to do
                  return;
                }
              }
            });
          } else {
            // 处理关注
            wx.showModal({
              title: '提示',
              content: '关注该用户？',
              success: function (res) {
                if (res.confirm) {
                  AV.User.current().follow(e.currentTarget.dataset.user_id).then(function () {
                    // 关注成功
                    // https://leancloud.cn/docs/status_system.html#hash918332471
                    // TODO: 取消关注
                    wx.showToast({
                      title: '关注成功！',
                      icon: 'success',
                      duration: 2000
                    })
                  }, function (err) {
                    // 关注失败
                    //console.log(err.message);
                    //console.log(err.code);
                    wx.showToast({
                      title: err.message,
                      icon: 'none',
                      duration: 4000
                    })
                  });
                } else if (res.cancel) {
                  //console.log('用户点击取消')
                }
              }
            })
          }
        }, function (err) {
          // 查询失败
          console.log('查询失败');
          console.log(err);
        });
      }
    },
    _updateUserInfoInLeanCloud: function () {
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
        fail: function () {
          console.log("获取用户信息失败");
        }
      });
    },
    _writeSubCommentInLeanCloud: function () {
      var that = this;
      // new WxSubComment
      var WxSubComment = AV.Object.extend('WxSubComment');
      var wxsubcomment = new WxSubComment();

      var current_time = Common.getTime();
      const user = AV.User.current();
      //console.log(that.data.login_user_info);
      wxsubcomment.set('p_id', that.data.sub_comment_p_comment_id)
      wxsubcomment.set('username', that.data.login_user_info.username);
      wxsubcomment.set('article_id', that.data.article_id);
      wxsubcomment.set('article_title', that.data.articleTitle);
      // article_url暂未用到
      wxsubcomment.set('article_url', that.data.articleURL);
      wxsubcomment.set('content', that.data.comment_data);
      wxsubcomment.set('time', current_time);
      wxsubcomment.set('at', '');
      var targetUser = AV.Object.createWithoutData('_User', user.id);
      wxsubcomment.set('targetUser', targetUser);

      wxsubcomment.save().then(function (wxsubcomment) {
        // new Zan
        var Zan = AV.Object.extend('SubZan');
        var zan = new Zan();
        zan.set('zan', 0);
        zan.set('commentObjId', wxsubcomment.id);
        zan.set('userList', []);
        zan.save().then(function (zan) {
          var targetZan = AV.Object.createWithoutData('SubZan', zan.id);
          wxsubcomment.set('targetZan', targetZan);
          wxsubcomment.save().then(function (wxsubcomment) {
            console.log('子评论和赞处理完毕')
            // 子评论和赞处理完毕
            // 将子评论加入到父评论索引数组中
            // WxComment添加子评论objectId
            var op_str = "update WxComment set subCommentList=op('AddUnique', {'objects':[pointer('WxSubComment','" + wxsubcomment.id + "')]}) where objectId='" + that.data.sub_comment_p_comment_id + "'";
            AV.Query.doCloudQuery(op_str).then(function (data) {
              console.log('子评论和赞及父评论处理完毕')
              // data 中的 results 是本次查询返回的结果，AV.Object 实例列表
              // 同步更新子评论和相关初赞显示
              // nickName/city/country/gender/province
              //console.log(that.data.sub_comment_p_index)
              var current_comment = {};
              current_comment['p_index'] = that.data.sub_comment_p_index;
              current_comment['p_id'] = that.data.sub_comment_p_comment_id;
              current_comment['id'] = wxsubcomment.id;
              current_comment['userId'] = user.id;
              current_comment['articleID'] = that.data.articleID;
              current_comment['nickName'] = that.data.login_user_info.nickName;
              if (current_comment['nickName'].length > 12) {
                current_comment['showNickName'] = current_comment['nickName'].substr(0, 12) + "...";
              }
              else {
                current_comment['showNickName'] = current_comment['nickName'];
              }
              current_comment['pre_' + current_comment['id']] = current_comment['nickName'];
              current_comment['avatarUrl'] = that.data.login_user_info.avatarUrl;
              current_comment['time'] = Common.timeAgoWithTimeStr(current_time);
              current_comment['content'] = that.data.comment_data;
              current_comment['at'] = '';
              current_comment['zanNum'] = 0;
              current_comment['zanId'] = zan.id;
              //console.log(that.data.leancloud_comment_data[that.data.sub_comment_p_index]['subCommentList'])
              that.data.leancloud_comment_data[that.data.sub_comment_p_index].subCommentList.push(current_comment);
              // 子评论不增加commnet_num
              that.setData({
                leancloud_comment_data: that.data.leancloud_comment_data,
                comment_data: '',
                comment_textarea_value: ''
              });

              that.data.all_comment_num = that.data.all_comment_num + 1;
              // 更新评论计数
              that._writeCommentCountInLeanCloud();
              console.log("评论和赞显示处理完毕");
            }, function (error) {
              // 异常处理
              console.error(error);
            });
          }), function (error) {
            console.log('子评论初始化赞失败！')
            console.log(error)
          }
        }), function (error) {
          // 异常处理
          console.log('赞初始化失败！')
          console.log(error)
        }
      }, function (error) {
        // 异常处理
        console.log('子评论初始化失败')
        console.log(error)
      });
    },
    // 自定义方法
    _writeCommentInLeanCloud: function () {
      var that = this;
      // new WxComment
      var WxComment = AV.Object.extend('WxComment');
      var wxcomment = new WxComment();

      var current_time = Common.getTime();
      const user = AV.User.current();
      //console.log(that.data.login_user_info);
      wxcomment.set('username', that.data.login_user_info.username);
      wxcomment.set('article_id', that.data.article_id);
      wxcomment.set('article_title', that.data.articleTitle);
      // article_url暂未用到
      wxcomment.set('article_url', that.data.articleURL);
      wxcomment.set('content', that.data.comment_data);
      wxcomment.set('time', current_time);
      wxcomment.set('at', '');
      wxcomment.set('subCommentList', []);
      var targetUser = AV.Object.createWithoutData('_User', user.id);
      wxcomment.set('targetUser', targetUser);

      wxcomment.save().then(function (wxcomment) {
        // new Zan
        var Zan = AV.Object.extend('Zan');
        var zan = new Zan();
        zan.set('zan', 0);
        zan.set('commentObjId', wxcomment.id);
        zan.set('userList', []);
        zan.save().then(function (zan) {
          var targetZan = AV.Object.createWithoutData('Zan', zan.id);
          wxcomment.set('targetZan', targetZan);
          wxcomment.save().then(function (wxcomment) {            
            // 评论和赞处理完毕
            // do something...
            // 同步更新评论显示
            // nickName/city/country/gender/province
            var current_comment = {};
            current_comment['p_index'] = that.data.leancloud_comment_data.length;
            current_comment['p_id'] = wxcomment.id;
            current_comment['id'] = wxcomment.id;
            current_comment['userId'] = user.id;
            current_comment['articleID'] = that.data.articleID;
            current_comment['nickName'] = that.data.login_user_info.nickName;
            if (current_comment['nickName'].length > 12) {
              current_comment['showNickName'] = current_comment['nickName'].substr(0, 12) + "...";
            }
            else {
              current_comment['showNickName'] = current_comment['nickName'];
            }
            current_comment['pre_' + current_comment['id']] = current_comment['nickName'];
            current_comment['avatarUrl'] = that.data.login_user_info.avatarUrl;
            current_comment['time'] = Common.timeAgoWithTimeStr(current_time);
            current_comment['content'] = that.data.comment_data;
            current_comment['at'] = '';
            current_comment['zanNum'] = 0;
            current_comment['zanId'] = zan.id;
            current_comment['subCommentList'] = [];
            that.data.leancloud_comment_data.push(current_comment);
            that.setData({
              leancloud_comment_data: that.data.leancloud_comment_data,
              comment_num: that.data.comment_num + 1,             
              comment_data: '',
              comment_textarea_value: ''
            });
            // 更新评论计数
            that.data.all_comment_num = that.data.all_comment_num + 1;
            that._writeCommentCountInLeanCloud();
            console.log("评论和赞处理完毕");
          }), function (error) {
            wx.showToast({
              title: '评论处理失败！',
              icon: 'none',
              duration: 2000
            })
          }
        }), function (error) {
          // 异常处理
          wx.showToast({
            title: '赞初始化失败！',
            icon: 'none',
            duration: 2000
          })
        }

        // 成功保存之后，执行其他逻辑.
        wx.showToast({
          title: '评论成功！',
          icon: 'success',
          duration: 2000
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
  _getCommentsInLeanCloud: function () {
    var query = new AV.Query('WxComment');
    query.equalTo('article_id', this.data.articleID);
    query.find().then(function (results) {
      // 如果这样写，第二个条件将覆盖第一个条件，查询只会返回 priority = 1 的结果
      //console.log(results);
    }, function (error) {
      wx.showToast({
        title: '评论加载失败！',
        icon: 'none',
        duration: 2000
      })
    });
  },
  _articleIDChange: function (newVal, oldVal) {
    // [BUG] observer无法进入自定义函数
    console.log('observer...');
    //newVal == this.data.articleID
    // 加载LeanCloud对应articleID评论
    //console.log(this.data.articleID);
    this._getCommentsInLeanCloud();
  },
  created: function () {
    //console.log('create...');
  },
  ready: function () {
    //console.log('ready...');
  }
})
