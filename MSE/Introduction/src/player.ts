import { getMimeType, logger } from './utils';

interface MediaStream {
  chunks: ArrayBuffer[];
  mime: string;
  sourceBuffer: SourceBuffer;
}

class Player {
  public ms = new MediaSource();

  public source = URL.createObjectURL(this.ms);

  public streams = new Map<number, MediaStream>();

  public onReady?: () => void;

  constructor () {
    logger.info('初始化 MediaSource');
    this.ms.addEventListener('sourceopen', () => {
      this.onReady && this.onReady();
    });
  }

  public async addChunk (streamId: number, buffer: ArrayBuffer) {
    let stream = this.streams.get(streamId);

    if (!stream) {
      const mime = await getMimeType(buffer);
      logger.info(`MIME 解析成功：${mime}`);
      if (!MediaSource.isTypeSupported(mime)) {
        logger.error(`当前浏览器不支持该 MIME 类型`);
        throw new Error('mimetype not supported');
      }

      const sourceBuffer = this.ms.addSourceBuffer(mime);
      logger.info(`给 MSE 添加新的一段 SourceBuffer，当前已有 ${this.ms.sourceBuffers.length} 个 SourceBuffer`);
      sourceBuffer.addEventListener('updateend', () => this._flush(streamId));
      sourceBuffer.addEventListener('error', () => logger.error('sourceBuffer 异常，请打开 chrome://media-internals 查看'))
      
      stream = {
        mime,
        sourceBuffer,
        chunks: []
      };
      this.streams.set(streamId, stream);
    }

    stream.chunks.push(buffer);
    this._flush(streamId);
  }

  public destroy () {
    URL.revokeObjectURL(this.source);
    this.streams.forEach(steam => {
      this.ms.removeSourceBuffer(steam.sourceBuffer);
      steam.chunks = [];
    });
    this.streams.clear();
    this.ms.endOfStream();
  }

  private _flush (streamId: number) {
    const stream = this.streams.get(streamId);

    if (stream && !stream.sourceBuffer.updating) {
      const chunk = stream.chunks.shift();
      if (chunk) {
        logger.info('添加初始化/媒体分段 （appendBuffer）');
        stream.sourceBuffer.appendBuffer(chunk);
      }
    }
  }
}

export default Player;