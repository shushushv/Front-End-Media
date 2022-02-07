/**
 * @description 读取ArrayBuffer为ASCII码
 * @author wuxuanshu
 * @date 2022-01-07
 * @param {ArrayBuffer} buffer
 * @param {number} [byteOffset=0]
 * @param {number} [byteLength]
 * @return {*} 
 */
function readAscii (buffer: ArrayBuffer, byteOffset = 0, byteLength?: number) {
  const dv = new DataView(buffer, byteOffset, byteLength);
  let ascii = '';
  for (let i = 0; i < dv.byteLength; i++) {
    ascii += String.fromCharCode(dv.getUint8(i));
  }
  return ascii;
}

/**
 * @description 往ArrayBuffer中写入ASCII码
 * @author wuxuanshu
 * @date 2022-01-07
 * @param {ArrayBuffer} buffer
 * @param {string} str
 * @param {number} [byteOffset=0]
 * @param {number} [byteLength]
 */
function writeAscii (buffer: ArrayBuffer, str: string,  byteOffset = 0, byteLength?: number) {
  const dv = new DataView(buffer, byteOffset, byteLength);
  for (let i = 0; i < dv.byteLength; i++) {
    dv.setUint8(i, str.charCodeAt(i));
  }
}

export default {
  readAscii,
  writeAscii
}