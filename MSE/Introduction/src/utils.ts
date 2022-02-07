import { MediaConfig } from './config';
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

export function getSegments (segmentIdx: number, conf: MediaConfig) {
  return Promise.all(conf.streams.map(({
    id,
    type
  }) => {
    const url = segmentIdx === 0
      ? conf.initSegmentUrl.replace('{streamId}', String(id))
      : conf.mediaSegmentUrl.replace('{streamId}', String(id))
                            .replace('{segmentIdx}', String(segmentIdx));
    return fetch(url)
      .then(e => e.arrayBuffer())
      .then(buffer => ({
        buffer,
        id,
        type
      }));
  }));
}

export function timeRangesToString (ranges: TimeRanges) {
  return Array.from({ length: ranges.length })
    .map((_, idx) => JSON.stringify([ranges.start(idx), ranges.end(idx)]))
    .join(' ') || "[0,0]";
}

export const logger = {
  el: document.querySelector('.logger')!,
  info (msg: string) {
    this.el.innerHTML += `<span>${new Date().toLocaleTimeString()}：${msg}</span><br/>`;
  },
  error (msg: string) {
    this.el.innerHTML += `<span class="error">${new Date().toLocaleTimeString()}：${msg}</span><br/>`;
  }
};