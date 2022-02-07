import type { Mp4Box } from '../common/box';
import Box from '../common/box';
import binary from '../utils/binary';

/**
 * Box Type: `ftyp’
 * Container: File
 * Mandatory: Yes
 * Quantity: Exactly one
 */

interface FileTypeProps {
  // 比如常见的 isom、mp41、mp42、avc1、qt等。它表示“最好”基于哪种格式来解析当前的文件。一般而言都是使用 isom 这个万金油即可。如果是需要特定的格式，可以自行定义。
  major_brand: string;    // uint32
  // 指major_brand的最低兼容版本。
  minor_version: number;    // uint32
  // 和 major_brand 类似，通常是针对 MP4 中包含的额外格式，比如，AVC，AAC 等相当于的音视频解码格式。
  compatible_brands: string[];    //uint32[]
}

const FileTypeBox: Mp4Box<FileTypeProps> = {
  type: 'ftyp',
  encode: ({
    major_brand,
    minor_version,
    compatible_brands
  }) => {
    const dataSize = 4 + 4 + compatible_brands.length * 4;
    const header = Box.getHeader(FileTypeBox.type, dataSize);

    const buffer = new ArrayBuffer(Number(header.largesize || header.size));
    let offset = Box.encodeHeader(buffer, header, 0);
    binary.writeAscii(buffer, major_brand, offset); offset += 4;
    new DataView(buffer).setUint32(offset, minor_version); offset += 4;
    binary.writeAscii(buffer, compatible_brands.join(''), offset);
  
    return buffer;
  },
  decode: (buffer: ArrayBuffer, byteOffset = 0) => {
    let [header, offset] = Box.decodeHeader(buffer, byteOffset);
    const compatibleBrandsLength = (header.size - header.header_size - 4 - 4) / 4;
    
    const major_brand = binary.readAscii(buffer, offset, 4); offset += 4;
    const minor_version = new DataView(buffer, offset).getUint32(0); offset += 4;
    const compatible_brands = Array.from({ length: compatibleBrandsLength }).map(() => {
      const brand = binary.readAscii(buffer, offset, 4); offset += 4;
      return brand;
    });

    return {
      header,
      data: {
        major_brand,
        minor_version,
        compatible_brands
      }
    }
  }
};

export default FileTypeBox;