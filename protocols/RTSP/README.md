# RTSP - 实时流传输协议

## 简介
RTSP（Real Time Streaming Protocol），实时流传输协议，属于 TCP/IP 协议体系中的应用层协议，但我们生活中说的 RTSP 常指 RTSP 协议族，分别有：

- RTSP协议：负责服务端与客户端之间的请求，主要提供视频控制能力；
- RTP协议：负责传输视频数据；
- RTCP协议：负责反馈传输质量信息。

在 RTSP 协议中，也会传递 SDP 媒体描述信息。他们的关系通常如下图所示：
![关系](./docs/images/relationship.png)

## 协议格式
`RTSP` 中所有的操作都是通过服务器和客户端的消息应答机制完成的，其中消息包括请求和应答两种，`RTSP` 是对称的协议，客户机和服务器都可以发送和回应请求。`RTSP` 是一个基于文本的协议，它使用 `UTF-8` 编码（RFC2279）和 `ISO10646` 字符序列，采用 `RFC882` 定义的通用消息格式，每个语句行由 `CRLF` 结束（CR表示回回车，LF表示换行）。

请求消息的格式如下：
```

```

## 常用方法定义
### OPTIONS
客户端向服务端询问可用的方法。

### DESCRIBE
客户端向服务端请求媒体资源描述，服务端通过 SDP 返回媒体信息。

### SETUP


### PLAY

### TEARDOWN

## 连接过程


## 参考
[RTSP 百度百科](https://baike.baidu.com/item/RTSP/1276768?fr=aladdin)
[rfc2326](https://datatracker.ietf.org/doc/html/rfc2326#page-41)