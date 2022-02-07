function captureWithCanvas (video: HTMLVideoElement) {
  const { videoWidth, videoHeight } = video;
  const canvas = document.createElement('canvas');
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  canvas.getContext('2d')?.drawImage(video, 0, 0, videoWidth, videoHeight);
  
  return canvas.toDataURL('image/jpeg');
}

function captureWithImageCapture (track: MediaStreamTrack): Promise<string> {
  if (!window.ImageCapture) {
    return Promise.reject('你的电脑不支持 ImageCapture API');
  }

  const imageCapture = new ImageCapture(track);

  // 第一次截图会有延迟
  // return imageCapture.takePhoto().then(URL.createObjectURL);
  
  return imageCapture.grabFrame().then(imageBitmap => {
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    canvas.getContext('2d')?.drawImage(imageBitmap, 0, 0);
  
    return canvas.toDataURL('image/jpeg');
  });
}

function download (url: string, name?: string) {
  const a = document.createElement('a');

  a.href = url;
  a.download = `${name || new Date().getTime()}.jpg`;
  a.click();
}

export {
  captureWithCanvas,
  captureWithImageCapture,
  download
};