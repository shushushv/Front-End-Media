import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { message, Button, Space, Image, ConfigProvider } from 'antd';
import { captureWithCanvas, captureWithImageCapture } from './utils';
import zhCN from 'antd/lib/locale/zh_CN';
import 'antd/dist/antd.css';

const App = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream>();
  const [loading, setLoading] = useState(true);
  const [imgList, setImgList] = useState<string[]>([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
      video: {
        width: 1920,
        height: 1080
      }
    }).then(s => {
      setStream(s);
    }).catch(() => {
      message.error('获取摄像头失败，请检测设备是否存在')
    });
    return () => stream?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const captureImage = (useCanvas = true) => {
    (
      useCanvas
        ? Promise.resolve(captureWithCanvas(videoRef.current!))
        : captureWithImageCapture(stream?.getVideoTracks()[0]!)
    ).then(url => {
      setImgList(list => [...list, url]);
      message.success('抓拍成功');
    }).catch(err => {
      message.error(err);
    })
  };

  return (
    <ConfigProvider locale={zhCN}>
      <div style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: '#000'
      }}>
        <video
          autoPlay
          ref={videoRef}
          onCanPlay={() => setLoading(false)}
          style={{
            width: '100%',
            height: '100%'
          }}
          ></video>
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: 0,
            padding: '0 40px',
            whiteSpace: 'nowrap',
            width: '100%',
            overflowX: 'auto'
          }}>
          <Image.PreviewGroup>
            {
              imgList.map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  style={{
                    width: '300px',
                    padding: '0 10px'
                  }} />
              ))
            }
          </Image.PreviewGroup>
        </div>
        <Space style={{
          position: 'absolute',
          left: '50%',
          bottom: '40px',
          transform: 'translateX(-50%)'
        }}>
          <Button
            type="primary"
            disabled={loading}
            onClick={() => captureImage(true)}
            >Canvas 截图</Button>
          <Button
            type="primary"
            disabled={loading}
            onClick={() => captureImage(false)}
            >ImageCapture 截图</Button>
        </Space>
      </div>
    </ConfigProvider>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));