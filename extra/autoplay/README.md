# Web如何自动播放音视频

## 1. 为什么浏览器禁止自动播放？
改善用户体验，节省用户流量。参考：
- [Autoplay policy in Chrome](https://developer.chrome.com/blog/autoplay/)
- [Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide)
- [Auto-Play Policy Changes for macOS](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/)

## 2. 自动播放策略

### 2.1 策略概述
- 视频：大部分情况允许**视频静音**自动播放，但
  - iOS低电量模式下，不允许自动播放；
  - iOS微信浏览器，不允许自动播放；
  - ...(其他case欢迎补充)
- 音频：始终不允许自动播放音频。

### 2.2 如何捕获自动播放失败？
可以查看 `play()` 方法的 promise 状态，判断自动播放是否被阻止。
```typescript
media.play().catch(e => {
  if (e.name === 'NotAllowedError') {
    // 自动播放被阻止
  }
});
```


## 3. 如何应对自动播放策略？
### 3.1 规避方案
#### 允许麦克风/摄像头权限
如果当前页面有麦克风/摄像头权限，浏览器允许自动播放。（可能这也是一种用户交互）
```typescript
await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
await media.play();
```

#### 微信浏览器
微信浏览器有 `WeixinJSBridge` ，提供了类似用户交互的接口。
```typescript
if (window.WeixinJSBridge) {
  window.WeixinJSBridge.invoke?.('getNetworkType', {}, () => media.play()); // 恢复播放
}
document.addEventListener('WeixinJSBridgeReady', () => {
  media.play(); // 恢复播放
  window.WeixinJSBridge?.invoke?.('getNetworkType', {}, () => media.play()); // 恢复播放
});
```

#### Android微信浏览器
Android 微信浏览器不允许 HTMLAudioElement 自动播放，但允许 AudioContext 自动播放。
```typescript
const audioContext = new AudioContext();
if (audioContext.state === 'running') {
  const source = audioContext.createMediaElementSource(media);
  source.connect(audioContext.destination);
  return audioContext.resume();
}
```
Android 微信浏览器不允许 video.src 自动播放，但允许 video.srcObject 自动播放。（可能是 WebRTC 友好）

#### 媒体互动指数（MEI）
浏览器自动计算，开发者无法干预。即该用户是否经常在网站上使用媒体，详见 [Media Engagement Index](https://developer.chrome.com/blog/autoplay?hl=zh-cn#media_engagement_index)

### 3.2 恢复播放
#### 用户交互
绑定全局的 `click` or `mousemove` 等事件，恢复自动播放失败的媒体标签。
- 特别注意，用户交互在 iOS 环境中要求严格，必须要在事件回调中**同步**执行 `play()` 才允许播放。
- 而在其他浏览器环境中，只需要用户与 **当前域** 有过交互，后续均可自动播放。（比如 `window.open()` 打开同样域的页面）
```typescript
// 部分 iOS 设备中无法自动播放
document.addEventListener('click', () => {
  Promise.then(() => media.play());
});
// iOS 中必须要同步执行 play
document.addEventListener('click', () => media.play());
```

## 4. Demo & Code

- [github](https://github.com/shushushv/Front-End-Media/blob/master/extra/autoplay)

- [demo](https://shushushv.github.io/Front-End-Media/extra/autoplay/dist)