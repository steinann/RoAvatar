//https://www.reddit.com/r/dartlang/comments/19ahswx/a_simple_lz4_block_decoder/ then converted to TypeScript by Copilot (sorry... i dont know dart)
export function decompress(data: ArrayBuffer, uncompressedLength: number): ArrayBuffer {
  const src = new Uint8Array(data);
  const dest = new Uint8Array(uncompressedLength);

  let op = 0;
  let ip = 0;

  while (true) {
    const token = src[ip++];
    let length = token >> 4;

    if (length === 15) {
      let lenByte;
      do {
        lenByte = src[ip++];
        length += lenByte;
      } while (lenByte === 255);
    }

    for (let i = 0; i < length; i++) {
      dest[op++] = src[ip++];
    }

    if (ip >= src.length) break;

    const offset = src[ip++] + (src[ip++] << 8);
    if (offset === 0) throw new Error("Invalid offset: 0");

    let matchp = op - offset;
    let matchLength = (token & 0x0f) + 4;

    if (matchLength === 19) {
      let lenByte;
      do {
        lenByte = src[ip++];
        matchLength += lenByte;
      } while (lenByte === 255);
    }

    for (let i = 0; i < matchLength; i++) {
      dest[op++] = dest[matchp++];
    }
  }

  return dest.buffer;
}