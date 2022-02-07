import binary from '../utils/binary';

export interface BoxHeader {
  header_size: number;
  size: number;
  type: string;
  largesize?: bigint;
  extended_type?: string;
}

export interface Mp4Box<T> {
  type: string;
  encode: (params: T) => ArrayBuffer;
  decode: (buffer: ArrayBuffer, byteOffset: number) => {
    header: BoxHeader;
    data: T
  };
}

type ByteOffset = number;

const Box = {
  getHeader: (type: string, dataSize: number, extended_type?: string): BoxHeader => {
    let header_size = 4 + 4;  // size + type
  
    // 如果type为uuid，则后续会有个 128bits 的用户自定义盒子类型
    if (type === 'uuid') {
      header_size += 16; // 16byte
    }

    // 如果盒子长度超出 32bits，需要用额外的 64bits 来存储
    let largesize: bigint | undefined;
    if (header_size + dataSize >= Math.pow(2, 31)) {
      header_size += 8;  // 8byte
      largesize = BigInt(header_size + dataSize);
    }
  
    return {
      header_size,
      size: largesize ? 1 : header_size + dataSize,
      type,
      largesize,
      extended_type
    };
  },
  encodeHeader: (buffer: ArrayBuffer, header: BoxHeader, byteOffset = 0): ByteOffset => {
    let offset = 0;
    const dv = new DataView(buffer, byteOffset);
    
    dv.setUint32(byteOffset, header.size); offset += 4;
    
    binary.writeAscii(buffer, header.type, byteOffset + 4, 4); offset += 4;

    if (header.size === 1) {
      if (header.largesize) {
        dv.setBigUint64(byteOffset + 8, header.largesize); offset += 8;
      } else {
        throw new Error(`encode ${header.type} box error, no 'largesize' parameters found.`);
      }
    }
    
    if (header.type === 'uuid') {
      if (header.extended_type) {
        binary.writeAscii(buffer, header.extended_type, byteOffset + 16, 16); offset += 16;
      } else {
        throw new Error(`encode ${header.type} box error, no 'extended_type' parameters found.`);
      }
    }

    return offset + byteOffset;
  },
  decodeHeader: (buffer: ArrayBuffer, byteOffset: number): [BoxHeader, ByteOffset] => {
    let offset = 0;

    const dv = new DataView(buffer, byteOffset);
    const size = dv.getUint32(0); offset += 4;
    const type = binary.readAscii(buffer, byteOffset + offset, 4); offset += 4;
    let largesize, extended_type;
  
    if (size === 1) {
      largesize = dv.getBigUint64(offset); offset += 8;
    }
  
    if (type === 'uuid') {
      extended_type = binary.readAscii(buffer, byteOffset + offset, 16); offset += 16;
    }
  
    return [
      {
        header_size: offset,
        size,
        type,
        largesize,
        extended_type
      },
      offset + byteOffset
    ]
  }
};

export default Box;