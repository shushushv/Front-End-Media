# SDP简介
SDP全称是Session Description Protocol，即会话描述协议，用于会话各方间的媒体协商。
- 什么是会话？ 视频聊天、语音通话、视频会议等等都算会话。
- 为什么要媒体协商？ 参加会话各用户环境、配置不一致，需要协商出兼容最优的解决方案。
- SDP长什么样子？ 一段多文本行，每行格式均为`<type>=<value>`。

看一下SDP具体是怎样的，复制以下代码到控制台 `Enter`~
```
const PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
const peer = new PeerConnection();
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
	.then(stream => {
		stream.getTracks().forEach(track => {
			peer.addTrack(track, stream);
		});
		peer.createOffer().then(e => {
			console.log(e.sdp);
		})
	})
	.catch(e => alert('无法获取摄像头信息'));
```

# SDP信息详解
## 协议版本（v=）
```
v=0
```

SDP的版本（Protocol version number）。当前规范版本为0

## 来源（o=）

```
o=<username> <sess-id> <sess-version> <nettype> <addrtype> <unicast-address>
```

会话所有者有关的参数（Owner/creator and session identifier）。

- \<username> 会话发起者的名称。如果不提供则用"-"表示，用户名不能包含空格；
- \<sess-id> 主叫方的会话标识符；
- \<sess-version> 会话版本号。用0标识的居多；
- \<nettype> 网络类型。IN表示Internet网络类型，目前仅定义该网络类型；
- \<addrtype> 地址类型。目前支持IPV4和IPV6两种地址类型；
- \<unicast-address> 会话发起者的IP地址。

## 会话名称（s=）

```
s=<session name>
```

本次会话的标题或会话的名称（Session name）。

## 计时（t=）

```
t=<start-time> <stop-time>
```

会话的起始时间和结束时间（Time session starts and stops）。

## 媒体说明（m=）

```
m=<media> <port>/<number of ports> <proto> <fmt> ...
```

媒体行，描述了发送方所支持的媒体类型等信息（Media information）。

- \<media> 媒体名称（audio/video）。表示包含音频类型或视频类型；
- \<port>/\<number of ports> 流传输端口号。表示在本地端口xxxx上发送音频/视频流；
- \<proto> 流传输协议。举例说明：
   - 🌰RTP/SAVPF 表示用UDP传输RTP包；
   - 🌰TCP/RTP/SAVPF 表示用TCP传输RTP包；
   - 🌰UDP/TLS/RTP/SAVPF 表示用UDP来传输RTP包，并使用TLS加密；
   - 最后的 SAVPF 还有其他几种值：AVP, SAVP, AVPF, SAVPF。
      - AVP 意为 AV profile
      - S 意为 secure
      - F 意为 feedback
- \<fmt> 从第四位开始都是媒体格式描述。

## 连接数据（c=）

```
c=<nettype> <addrtype> <connection-address>
```

媒体的连接信息（Connection information）。每个媒体描述中至少包含一个 `c =` 字段，或者在会话描述中包含一个 `c =` 字段。

- \<nettype> 网络类型。IN表示Internet网络类型，目前仅定义该网络类型；
- \<addrtype> 地址类型。目前支持IPV4和IPV6两种地址类型；
- \<unicast-address> 会话发起者的IP地址。


## 属性（a=）

```
a=<attribute> | <attribute>:<value>
```

属性（attribute）是扩展SDP的主要手段，分为`会话级`属性和`媒体级`属性:
-  会话级属性：添加在第一个媒体描述之前，传达的信息适用于整个会议而不是单个媒体。
   - 🌰`a=group:BUNDLE audio video` 通过mid标识符把多个媒体属性连接起来；
   - 🌰`a=msid-semantic: WMS ma` 表示是webrtc媒体流（Webrtc Media Streams）；
-  媒体级属性：媒体描述中添加有关媒体流的信息。
   - 🌰`a=mid:audio` 上述BUNDLE中用到的媒体标识；
   - 🌰`a=msid:ma ta` 连接不同的媒体描述，使用相同的MediaStreams；
   - 🌰`a=sendonly` 表示媒体发送端，其他类型：recvonly,sendrecv,inactive；
   - 🌰`a=rtcp:9 IN IP4 0.0.0.0` 用来传输rtcp地地址和端口；
   - 🌰`a=rtcp-mux` 表示rtp,rtcp包使用同一个端口来传输；
   - 🌰`a=ice-xxx:xxx` ice协商过程中的安全验证信息；
   - 🌰`a=fingerprint:xxx` 表示dtls协商过程中需要的认证信息；
   - 🌰`a=setup:actpass` 表示本客户端在dtls协商过程中，可以做客户端也可以做服务端；
   - 🌰`a=rtpmap:111 opus/48000/2` 负载类型111，编码格式opus，48000是时钟，2是通道数；
   - 🌰`a=rtcp-fb:111 nack` 支持丢包重传；
   - 🌰`a=rtcp-fb:111 nack pli` 支持关键帧丢包重传；	
   - 🌰`a=rtcp-fb:111 transport-cc` 表示opus编码支持使用rtcp来控制拥塞；
   - 🌰`a=fmtp:111 minptime=10;useinbandfec=1;maxplaybackrate=16000` 对opus编码可选的补充说明,minptime代表最小打包时长是10ms，useinbandfec=1代表使用opus编码内置fec特性；
   - 🌰`a=ssrc:1370113029 cname:NMediaAudio` cname用来标识一个数据源，ssrc当发生冲突时可能会发生变化，但是cname不会发生变化，也会出现在rtcp包中SDEC中，用于音视频同步；
   - 🌰`a=candidate:1 1 udp 2013266431 x.x.x.x 43342 typ host generation 0` 表示候选人的传输地址，[查看详情](https://tools.ietf.org/html/rfc5245#section-15.1)。

# 参考
- [https://tools.ietf.org/html/rfc4566](https://tools.ietf.org/html/rfc4566)
- [https://blog.piasy.com/2018/10/14/WebRTC-API-Overview/index.html](https://blog.piasy.com/2018/10/14/WebRTC-API-Overview/index.html)
- [https://blog.csdn.net/dzxs_gb28181/article/details/80951094](https://blog.csdn.net/dzxs_gb28181/article/details/80951094)
- [https://blog.csdn.net/chinabinlang/article/details/79151589](https://blog.csdn.net/chinabinlang/article/details/79151589)