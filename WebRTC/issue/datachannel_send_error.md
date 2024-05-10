# WebRTC DataChannel 发送失败

## Message too large (can send a maximum of xxx bytes)
错误来源：[webrtc-adapter](https://github.com/webrtc/adapter) 库中重写了dc.send方法，会比较发送的数据和 `sctp.maxMessageSize` ，如果超出阈值就会报错。[代码戳这里](https://github.com/webrtc/adapter/blob/master/release/adapter.js#L1435)

解决方案：
- 如果报错内容中 xxx bytes 是一个正常值，比如 262144
    - 考虑减小发送的数据大小，比如拆包；
    - 或者通过设置更大的 `maxMessageSize` 阈值。设置方式为修改 sdp 为 `a=max-message-size:xxx`；
- 如果是个异常的值，比如 1.23401e-8
    - 可能是浏览器bug，比如：[在win64上安装了32位的360浏览器](https://bbs.360.cn/forum.php?mod=viewthread&tid=16128021)。需要检查下不引入webrtc-adapter库时，dc.send方法是否正常使用。如果正常，临时方案可注释掉[抛错代码](https://github.com/webrtc/adapter/blob/master/release/adapter.js#L1436C19-L1436C28)。