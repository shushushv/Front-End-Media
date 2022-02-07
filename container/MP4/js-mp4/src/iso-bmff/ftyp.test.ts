import FileTypeBox from './ftyp';

const FtypBoxData = {
  major_brand: 'isom',
  minor_version: 1,
  compatible_brands: ['avc1']
};
const FtypBoxBuffer = Uint8Array.from([0, 0, 0, 20, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 1, 97, 118, 99, 49]).buffer;
const FtypBoxBufferDv = new DataView(FtypBoxBuffer);

describe('ftyp box', () => {
  test('encode ftyp box', () => {
    const buffer = FileTypeBox.encode(FtypBoxData);
    const dv = new DataView(buffer);
    for (let i = 0; i < dv.byteLength; i++) {
      expect(dv.getUint8(i)).toBe(FtypBoxBufferDv.getUint8(i));
    }
  });
  test('decode ftyp box', () => {
    const { header, data } = FileTypeBox.decode(FtypBoxBuffer, 0);
    expect(header).toEqual({
      header_size: 8,
      size: 20,
      type: FileTypeBox.type,
      largesize: undefined,
      extended_type: undefined
    });
    expect(data).toEqual(FtypBoxData);
  });
});
