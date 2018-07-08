# WxComment

`WxComment`[https://github.com/yicm/WxComment](https://github.com/yicm/WxComment)是一个微信小程序的评论插件，结合BaaS提供商[LeanCloud](https://leancloud.cn/)，无需其他另外的个人或者云服务器，就可以免费使用。解决了需要个人去注册域名、备案、购买云服务器的繁杂问题。


# 特色

- 独立插件，独立放入小程序项目即可使用
- 友好的UI界面和交互界面
- 与微信用户信息绑定，显示微信用户头像和昵称
- 支持插件内容修改，包括按钮文字，评论提示，评论字数最低限制等属性
- 支持长按删除评论操作
- 支持评论点赞功能
- 支持评论回复功能，即子评论
- 子评论支持点赞功能
- 支持emoji表情显示😉
- 支持文章阅读量统计功能
- 支持light/dark两种样式设置
- 支持点击头像关注用户功能
    - 对发布高质量文章的用户关注（见微信小程序`小白AI`）
    - 关注后，可通过在WxComment组件外对用户详细资料查看等操作(见微信小程序`小白AI`)
- 支持评论消息订阅功能
    - 评论指定文章或页面后，会自动订阅该文章或页面的评论，当有新的评论则可以实现消息更新，提示已有新的评论。
- 支持配置Admin用户删除其他用户的评论


# 屏幕截图

下图为`WxComment`嵌入式到具体博客中显示的效果。

![](https://raw.githubusercontent.com/yicm/WxComment/master/screenshot/screenshot.png)

# 快速入手

1. 注册LeanCloud账号，并创建过LeanCloud应用；

2. 登陆LeanCloud账号，打开链接[https://leancloud.cn/docs/weapp-domains.html](https://leancloud.cn/docs/weapp-domains.html)，将显示域名配置到你的微信小程序服务器配置中；

3. 设置小程序的 AppID 与 AppSecret
    3.1 登录 微信公众平台，在`设置` > `开发设置` 中获得 AppID 与 AppSecret
    3.2 前往 LeanCloud `控制台` > `组件` > `社交`，保存「微信小程序」的 AppID 与 AppSecret

4. 克隆项目WxComment并将其放入小程序根目录

```
$ git clone https://github.com/yicm/WxComment.git
```

5. 将LeanCloud自己的AppID和AppKey复制到WxComment.js对应位置；

```
AV.init({
    appId: 'your leancloud appid',
    appKey: 'your leancloud appkey',
});
```

6. 在小程序其他wxml文件中引入WxComment组件

test.wxml

```
<view class="WxComment">
  <WxComment tipOne="Markdown " tipTwo="will be supported, Powered by yicm." submitBtnText="回复" articleID="{{article_id}}" contentLen='1' theme="light"></WxComment>
</view>
```

test.json

```
"usingComponents": {
    "WxComment": "/component/WxComment/WxComment"
}
```

7. 配置Admin删除其他用户评论

    - 登陆LeanCloud，进入应用->`存储`->`数据`->`创建Class`->创建`Admin` Class：

![](https://raw.githubusercontent.com/yicm/WxComment/master/screenshot/admin.png)


WxComment组件属性说明：

```bash
tipOne: 颜色显示tip区域文字内容
tipTwo: 无颜色显示tip区域文字内容
submitBtnText：提交按钮文字内容，默认为“回复”
textMaxLength: 评论最大文字长度限制，默认300
articleID：文章或页面与WxComment绑定的唯一ID
articleTitle: 文章或页面标题，默认值为空
articleURL: 文章或页面的访问链接，默认值为空
contentLen：评论内容至少为多长限制，默认为1
theme: 评论组件样式，支持light/dark两种样式，默认值为light
```

# Demo

小程序`小白AI`博客引用WxComment组件示例，评论消息订阅可见`我的`->`消息`：

![](https://raw.githubusercontent.com/yicm/WxComment/master/screenshot/xiaobaiai.jpg)

# TODO

- 支持查看用户详细信息以及优化关注功能
- 支持设置用户资料
- 支持匿名群聊和私聊
- 支持评论附加图片
- ...

# License

[MIT](https://opensource.org/licenses/MIT)

