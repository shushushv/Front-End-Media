# RTP - 实时传输协议

## 简介
实时传输协议（`Real-time Transport Protocol`）用于互联网上传输流媒体数据的一种传输层协议。它通常和控制协议 `RTCP` 搭配使用，`RTP` 协议用于实时传输数据，提供包括 时间戳（用于同步）、序列号（用于丢包和重排序检测）、负载格式（用于说明数据的编码格式）、以及负载的媒体数据等信息；而 `RTCP` 则用于服务质量（QoS）反馈和同步媒体流等，`RTCP` 所占的带宽非常小，通常只有5%。

## 报文格式
`RTP` 报文有两部分组成：报头（`RTP header`）和有效载荷（`RTP payload`）。**报头格式**如下：

```
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|V=2|P|X|  CC   |M|     PT      |       sequence number         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                           timestamp                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|           synchronization source (SSRC) identifier            |
+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
|            contributing source (CSRC) identifiers             |
|                             ....                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

- version (V)：RTP协议的版本，占2位。
- padding (P)：填充标志，占1位，如果 `P=1` 则在该报文的尾部填充一个或多个额外的八位组，它们不是有效载荷的一部分。
- extension (X)：扩展标志，占1位，如果 `X=1` 则在RTP报头后跟有一个[扩展报头](https://datatracker.ietf.org/doc/html/rfc3550#section-5.3.1)（见下文）。
- CSRC count (CC)：CSRC标识符的个数，占4位。
- marker (M)：标记，占1位，不同的有效载荷有不同的含义，对于视频，标记一帧的结束；对于音频，标记会话的开始。
- payload type (PT)：表示有效载荷的类型，占7位，在流媒体中大部分是用来区分音频流和视频流的。
- sequence number：序列号，占16位，用于标识发送者所发送的RTP报文的序列号，每发送一个报文，序列号增1。接收者通过序列号来检测报文丢失情况，重新排序报文，恢复数据。
- timestamp：时间戳，占32位，接收者使用时戳来计算延迟和延迟抖动，并进行同步控制。
- SSRC：同步信源列表，用于标识同步信源，占32位。
- CSRC list：特约信源列表，个数（0～15个）由CC指定，每个 CSRC 占32位。

**扩展报头**的格式如下：
```
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|      defined by profile       |           length              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        header extension                       |
|                             ....                              |
```

- defined by profile：自定义扩展报头标识符，占16位，根据配置文件规范定义。
- length：用于计算后续扩展中 32 位的长度，占16位，不包括扩展头中的4个字节（因此 0 是有效长度）。
- header extension：扩展头数据，长度为 length *  4 字节。

## code
```typescript
export default class RTP {
  public version: number;             // 2 bits，RTP的版本

  public padding: number;             // 1 bit，如果置1，在packet的末尾被填充，填充有时是方便一些针对固定长度的算法的封装

  public extension: number;           // 1 bit，如果置1，在RTP Header会跟着一个扩展头部（header extension）

  public csrcCount: number;           // 4 bits，表示头部后contributing sources的个数

  public marker: number;              // 1 bit，具体这位的定义由配置文档（Profile）来承担，不同的有效载荷有不同的含义，一般而言，对于视频，标记一帧的结束；对于音频，标记会话的开始。

  public payloadType: number;         // 7 bits，表示所传输的多媒体的类型，如GSM音频、JPEM图像等,在流媒体中大部分是用来区分音频流和视频流的，这样便于客户端进行解析。

  public sequenceNumber: number;      // 16 bits，每个RTP packet的sequence number会自动加一，以便接收端检测丢包情况。音频包和视频包的sequence是分别记数的。

  public timestamp: number;           // 32 bits，时间戳

  public ssrc: number;                // 32 bits，同步源的id

  public csrcList: any[]              // 个数由CC指定，范围是0-15

  public headerExtension?: {          // 扩展头部
    identifier: number;
    length: number;
    data: Uint8Array;
  };

  public headerLength: number;

  public payload: Uint8Array;

  constructor (pkt: Uint8Array) {
    let bytes = new DataView(pkt.buffer, pkt.byteOffset, pkt.byteLength);

    this.version        = bytes.getUint8(0) >>> 6;
    this.padding        = (bytes.getUint8(0) & 0x20) >>> 5;
    this.extension      = (bytes.getUint8(0) & 0x10) >>> 4;
    this.csrcCount      = bytes.getUint8(0) & 0x0F;
    this.marker         = bytes.getUint8(1) >>> 7;
    this.payloadType    = bytes.getUint8(1) & 0x7F;
    this.sequenceNumber = bytes.getUint16(2);
    this.timestamp      = bytes.getUint32(4);
    this.ssrc           = bytes.getUint32(8);
    this.csrcList       = [];

    let offset = 12;

    for (;offset < offset + this.csrcCount * 4; offset += 4) {
      this.csrcList.push(bytes.getUint32(offset));
    }

    // 扩展头解析
    if (this.extension === 1) {
      const identifier = bytes.getUint16(offset); offset += 2;
      // 单位字节，长度指扩展项中的32bit的个数，所以要*4
      const length = bytes.getUint16(offset) * 4; offset += 2;
      this.headerExtension = {
        identifier,
        length,
        data: pkt.slice(offset, offset + length)
      };
      offset += length;
    }

    this.headerLength = offset;

    this.payload = pkt.subarray(offset);
  }
}
```

参考
- [实时传输协议（百度百科）](https://baike.baidu.com/item/%E5%AE%9E%E6%97%B6%E4%BC%A0%E8%BE%93%E5%8D%8F%E8%AE%AE)
- [rfc3550](https://datatracker.ietf.org/doc/html/rfc3550)
