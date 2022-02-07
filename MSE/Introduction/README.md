[demo](https://shushushv.github.io/Front-End-Media/MSE/Introduction/example/)

```javascript
// 安装依赖
yarn

// 开发环境，启动后访问 http://localhost:1234/index.html
yarn start

// 打包
yarn build
```

# MSE 入门

## 前言

流媒体协议多种多样，音视频编码格式更是繁多，要想在浏览器中正常浏览并非不容易。除开 WebRTC 这种浏览器已经支持的协议，HLS、FLV、RTSP、RTMP、DASH 等协议都需要预处理，不过流程大致都是：

- 通过 HTTP、WebSocket 等方式获取数据；
- 处理数据，解协议、组帧等得到媒体信息及数据；
- 封装成媒体片段，或解码成一帧画面；
- 通过 video 或 canvas（WebGL）等进行播放。

目前市面上也有一些前端解码的方案，如借助 `WASM` 的高性能调用 c 解码库，或者直接使用浏览器的 `WebCodecs API` 进行编解码......但都存在局限性，`WebCodecs` 仍是实验性功能；而 `WASM` 方案虽然突破浏览器沙盒限制（能播放浏览器不支持的编码格式如H265等），但解码和浏览器原始解码之间仍有差距，并且由于只能走软解导致多路性能也吃不消。所以，市面上更多的是采用另一种方式，解协议+封装+这篇文章的主角 [Media Source Extensions](https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API)（以下简称MSE）。

## 开始

HTML5 规范允许我们直接在网页中嵌入视频,
```html
<video src="demo.mp4"></video>
```
但 src 指定的资源地址必须是一个完整的媒体文件，如何在 Web 做到流式的媒体资源播放？`MSE` 提供了这样的可能性，先看下 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API) 对它对描述：

> 媒体源扩展 API（MSE） 提供了实现无插件且基于 Web 的流媒体的功能。使用 MSE，媒体串流能够通过  创建，并且能通过使用 `<audio>` 和 `<video>` 元素进行播放。

正如上面所说，`MSE` 让我们可以通过 JS 创建媒体资源，使用起来也十分方便：

```javascript
const mediaSource = new MediaSource();

const video = document.querySelector('video');
video.src = URL.createObjectURL(mediaSource);
```

媒体资源对象创建完毕，接下来就是喂给它视频数据（片段），代码看上去就像是：

```javascript
mediaSource.addEventListener('sourceopen', () => {
  const mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  const sourceBuffer = mediaSource.addSourceBuffer(mime);

  const data = new ArrayBuffer([...]);    // 视频数据
  sourceBuffer.appendBuffer(data);
});
```

此时，视频就可以正常播放了。要想做到流式播放，只需要不停的调用 `appendBuffer` 喂音视频数据就行了......但不禁有疑问， `'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'` 这段字符串什么意思？音视频数据又要从哪来的？🤔

### MIME TYPE
```javascript
// webm MIME-type
'video/webm;codecs="vp8,vorbis"'

// fmp4 MIME-type
'video/mp4;codecs="avc1.42E01E,mp4a.40.2"'
```
这段字符串描述了视频的相关参数，如封装格式、音/视频编码格式以及其他重要信息。以上面 mp4 这段为例，以 `;` 分为两部分：
 - 前半部分的 `video/mp4` 表示这是 mp4 格式的视频；
 - 后半部分的 `codecs` 描述了视频的编码信息，它是由一个或多个由 `,` 分隔的值组成，其中每个值又由一个或多个由 `.` 分割的元素组成：
   - `avc1` 表示视频是 `AVC`（即H264）编码;
   - `42E01E` 由（16进制表示的）三个字节构成，描述了视频的相关信息：
     - `0x42` （`AVCProfileIndication`）表示视频的[Profile](https://blog.pearce.org.nz/2013/11/what-does-h264avc1-codecs-parameters.html)，常见的有 Baseline/Extended/Main/High profile等；
     - `0xE0` （`profile_compatibility`）表示编码级别的约束条件；
     - `0x1E` （`AVCLevlIndication`）表示H264的[level](https://en.wikipedia.org/wiki/Advanced_Video_Coding#Levels)，表示最大支持的分辨率、帧率、码率等；
   - `mp4a` 表示某种 `MPEG-4` 音频；
   - `40` 是由[MP4注册机构](http://mp4ra.org/#/)指定的ObjectTypeIndication（OTI），`0x40` 对应 `Audio ISO/IEC 14496-3 (d)`标准；
   - `2` 表示某种音频OTI，`mp4a.40.2` 表示 `AAC LC`。

但音视频格式多种多样，前端有什么方法直接取到视频的 `MIME TYPE` 呢？

对于 mp4 格式的可以使用：🌟🌟🌟 [**mp4box**](https://www.npmjs.com/package/mp4box) 🌟🌟🌟，获取方式如下：

```typescript
// utils.ts

// 添加库
// yarn add mp4box

import MP4Box from 'mp4box';

export function getMimeType (buffer: ArrayBuffer) {
  return new Promise<string>((resolve, reject) => {
    const mp4boxfile = MP4Box.createFile();

    mp4boxfile.onReady = (info: any) => resolve(info.mime);
    mp4boxfile.onError = () => reject();

    (buffer as any).fileStart = 0;
    mp4boxfile.appendBuffer(buffer);
  });
}
```

`MIME TYPE` 获取到后，可以通过 MSE 的静态方法 [MediaSource.isTypeSupported()](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource/isTypeSupported) 检测当前浏览器是否支持该媒体格式。

```javascript
import { getMimeType } from './utils';

...

const mime = await getMimeType(buffer);
if (!MediaSource.isTypeSupported(mime)) {
  throw new Error('mimetype not supported');
}
```

### Media Segment
`SourceBuffer.appendBuffer(source)` 旨在将媒体片段数据 `source` 添加到 [SourceBuffer](https://developer.mozilla.org/zh-CN/docs/Web/API/SourceBuffer) 对象中，看 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/SourceBuffer/appendBuffer#parameters) 上对 `source` 的描述：

> 一个 BufferSource (en-US) 对象（ArrayBufferView 或 ArrayBuffer），存储了你要添加到 SourceBuffer 中去的媒体片段数据。

所以 `source` 就是一串二进制数据，当然也不是随便一串就行，那该 **媒体片段** 需要满足怎样的条件呢？

1. 满足 [MSE Byte Stream Format Registry](https://www.w3.org/TR/mse-byte-stream-format-registry/) 规定的 MIME 类型
2. 属于 [Initialization Segment](https://www.w3.org/TR/media-source/#init-segment) 或 [Media Segment](https://www.w3.org/TR/media-source/#media-segment) 中的一种

对于第一个条件，MSE 支持的媒体格式和音视频格式较少，常见的一般为 `fmp4(h264+aac)` 和 `webm(vp8/vorbis)` 等。[什么是fmp4？](https://stackoverflow.com/questions/35177797/what-exactly-is-fragmented-mp4fmp4-how-is-it-different-from-normal-mp4)[什么是webm？](https://www.w3.org/TR/mse-byte-stream-format-webm/)可以点开了解下，本篇文章不展开讨论。

对于第二个条件，`Initialization Segment` 意为初始化片段，包含了 `Media Segment` 解码所需的初始化信息，如媒体的分辨率、时长、比特率等信息； `Media Segment` 则是带有时间戳的音视频片段，并与最近添加的 `Initialization Segment` 相关联。一般都是 append 一个初始化片段后 append 多个媒体片段。

对于 `fmp4` 来说，初始化片段和媒体片段实际上都是 `MP4 box` ，只是类型不一样（[了解更多](https://w3c.github.io/mse-byte-stream-format-isobmff/#iso-init-segments)）；而对于 `webm` 来说，初始化片段是 `EBML Header` 以及 `Cluster` 元素前的内容（包括一些媒体、track等信息），媒体片段则是一个 `Cluster` 元素（[了解更多](https://w3c.github.io/mse-byte-stream-format-webm/#webm-init-segments)）。

理论都了解了，实操呢？如何从已有的媒体文件生成上述的 **媒体片段** 呢？

这里我们用到的是🌟🌟🌟 [FFmpeg](http://www.ffmpeg.org/) 🌟🌟🌟，用起来很方便，只需要一行命令：

> ffmpeg -i xxx -c copy -f dash index.mpd

`xxx` 是你本地的媒体文件，我这边分别用 `lol.mp4` 和 `big-buck-bunny.webm` 两个文件进行测试：

👉 `ffmpeg -i lol.mp4 -c copy -f dash index.mpd`

👇

![image.png](https://github.com/shushushv/Front-End-Media/blob/master/MSE/Introduction/docs/lol-dash.png)

👉 `ffmpeg -i big-buck-bunny.webm -c copy -f dash index.mpd`

👇

![image.png](https://github.com/shushushv/Front-End-Media/blob/master/MSE/Introduction/docs/big-buck-bunny-dash.png)

从测试结果可以看出，都是生成了 `init-xxx.xx` 、 `chunk-xxx-xxx.xx` 的文件，
很明显 `init-xxx.xx` 表示初始化片段，`chunk-xxx-xxx.xx` 表示媒体片段，而其中的 `stream0` 和 `stream1` 分别代表了视频和音频通道。

借助在线的 [mp4 box 解析工具](http://mp4parser.com/)，看下 `fmp4` 的初始化片段和媒体片段的内部构造：

![image.png](https://github.com/shushushv/Front-End-Media/blob/master/MSE/Introduction/docs/IS-mp4box.png)

![image.png](https://github.com/shushushv/Front-End-Media/blob/master/MSE/Introduction/docs/MS-mp4box.png)

跟 [ISO BMFF](https://www.w3.org/TR/mse-byte-stream-format-isobmff/#iso-init-segments) 描述一致，初始化分片由 `ftyp box` + `moov box` 组成；媒体分片 `styp box`、`sidx box`、`moof box`、`mdat box` 组成，想要了解各种盒子的含义可以前往 [学好 MP4，让直播更给力](https://segmentfault.com/a/1190000010776938) 学习。

### EXAMPLE

👇

![example.gif](https://github.com/shushushv/Front-End-Media/blob/master/MSE/Introduction/docs/example.gif)

[🖥 在线Demo 🌰](https://shushushv.github.io/Front-End-Media/MSE/Introduction/example/)

[🔗 github 🌟](https://github.com/shushushv/Front-End-Media/tree/master/MSE/Introduction)
