import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Player from './player';
import { getSegments, logger, timeRangesToString } from './utils';
import { fmp4Conf } from './config';

const App = () => {
  const [player, setPlayer] = useState<Player>();
  const [num, setNumber] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const player = new Player();
    setPlayer(player);
    player.onReady = () => setLoading(false);

    () => player.destroy();
  }, []);

  useEffect(() => {
    player?.source
      && logger.info('video.src = URL.createObjectURL(mse)');
  }, [player?.source])

  const addChunk = useCallback(() => {
    setLoading(true);
    getSegments(num, fmp4Conf).then(segments => {
      segments.forEach(segment => {
        logger.info(`获取到第 ${num} 个 ${segment.type} 分片`);
        player?.addChunk(segment.id, segment.buffer);
      });

      setLoading(false);
      setNumber(num => num + 1);
    });
  }, [player, num]);

  const trigger = (eventName: string, ...args: any[]) => {
    logger.info(`video trigger event "${eventName}" ${args.join(' ')}`);
  }

  return <>
    {
      num < fmp4Conf.mediaSegmentNum && (
        <button
          onClick={addChunk}
          disabled={loading}
          >
          { num === 0 ? '添加初始化分片' : `添加第${num}个媒体分片` }
        </button>
      )
    }
    <br/>
    <video
      onLoadStart={() => trigger('loadstart')}
      onDurationChange={() => trigger('durationchange')}
      onLoadedMetadata={() => trigger('loadedmetadata')}
      onLoadedData={() => trigger('loadeddata')}
      onProgress={e => trigger('progress', `可播放范围(s)：${timeRangesToString((e.target as HTMLVideoElement).buffered)}`)}
      onCanPlay={() => trigger('canplay')}
      onError={() => logger.error('video标签报错，请打开 chrome://media-internals 查看')}
      style={{ width: '500px' }}
      src={player?.source}
      controls
      autoPlay
      ></video>
  </>;
};

ReactDOM.render(<App />, document.getElementById('app'));