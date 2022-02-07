export interface MediaConfig {
  streams: {
    type: string;
    id: number;
  }[];
  initSegmentUrl: string;
  mediaSegmentUrl: string;
  mediaSegmentNum: number;
}

const fmp4Conf: MediaConfig = {
  streams: [
    { type: 'video', id: 0 },
    { type: 'audio', id: 1 },
  ],
  initSegmentUrl: './assets/init-stream{streamId}.m4s',
  mediaSegmentUrl: './assets/chunk-stream{streamId}-0000{segmentIdx}.m4s',
  mediaSegmentNum: 8
};

export {
  fmp4Conf
};