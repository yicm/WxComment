# WxComment

`WxComment`是一个微信小程序的评论插件，结合BaaS提供商[LeanCloud](https://leancloud.cn/)，无需其他另外的个人或者云服务器，就可以免费使用。解决了需要个人去注册域名、备案、购买云服务器的繁杂问题。


# 特色

- 独立插件，独立放入小程序项目即可使用
- 友好的UI界面和交互界面
- 与微信用户信息绑定，显示微信用户头像和昵称
- 支持插件内容修改，包括按钮文字，评论提示，评论字数最低限制等属性
- 支持长按删除评论操作
- 支持评论点赞功能
- 支持emoji表情显示
- 支持文章阅读量统计功能


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
  <WxComment tipOne="Markdown " tipTwo="will be supported, Powered by yicm." submitBtnText="回复" articleID="{{article_id}}" contentLen='1'></WxComment>
</view>
```

WxComment组件属性说明：

```bash
tipOne: 颜色显示tip区域文字内容
tipTwo: 无颜色显示tip区域文字内容
submitBtnText：提交按钮文字内容
articleID：文章与WxComment绑定的唯一ID
contentLen：评论内容至少为多长限制
```

# Demo

小程序`小白AI`博客引用WxComment组件示例：

![](https://raw.githubusercontent.com/yicm/WxComment/master/screenshot/xiaobaiai.jpg)

# TODO

- 添加回复功能
- 支持图像显示
- 支持markdown语法
- ...

# License

[MIT](https://opensource.org/licenses/MIT)





