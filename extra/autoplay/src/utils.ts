export const createCanvasStream = (params: {
  width: number;
  height: number;
  fps: number;
}) => {
  const canvas = document.createElement('canvas');
  canvas.width = params.width;
  canvas.height = params.height;
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(params.fps);
  // 循环绘制当前时间，并移动绘制位置
  let timer;
  const draw = (x: number, y: number, xDirection: -1 | 1, yDirection: -1 | 1) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f5f6f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#007bff';
    ctx.font = '50px serif';
    ctx.fillText(getTime(), x, y);
    // 移动绘制位置
    if (x === 0) xDirection = 1;
    if (x === canvas.width) xDirection = -1;
    x += xDirection;
    if (y === 0) yDirection = 1;
    if (y === canvas.height) yDirection = -1;
    y += yDirection;

    timer = setTimeout(() => {
      draw(x, y, xDirection, yDirection);
    }, 1000 / params.fps);
  };

  draw(0, 0, 1, 1);

  return {
    stream,
    stop: () => {
      clearTimeout(timer);
      const tracks = stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
    }
  }
};

export const getTime = () => {
  return new Date().toTimeString().slice(0, 8) + '.' + new Date().getMilliseconds();
}


const prefix = 'cautoplay-demo';
export const logger = (...args: any[]) => {
	// const prefixStyle = 'background: rgb(0, 123, 255); color: white; border-radius: 2px; padding: 2px 4px;';
	const time = getTime();
	console.log(`[${time}][${prefix}]`, ...args);
};