export function hexEncode(str: string): string[] {
  let hex, i;

  const result = [];
  for (i = 0; i < str.length; i++) {
    hex = str.charCodeAt(i).toString(16);
    result.push(("0" + hex).slice(-2));
  }

  return result;
}

export function hexDump(
  str: string,
  blockSize?: number,
  newLine?: string,
): string {
  // Taken from https://gist.github.com/igorgatis/d294fe714a4f523ac3a3
  blockSize = blockSize || 16;
  newLine = newLine || "\n";
  const lines = [];
  const hex = "0123456789ABCDEF";
  for (let b = 0; b < str.length; b += blockSize) {
    const block = str.slice(b, Math.min(b + blockSize, str.length));
    const addr = ("0000" + b.toString(16)).slice(-4);
    let codes = block
      .split("")
      .map(function (ch) {
        const code = ch.charCodeAt(0);
        return " " + hex[(0xf0 & code) >> 4] + hex[0x0f & code];
      })
      .join("");
    codes += "   ".repeat(blockSize - block.length);

    let chars = block.replaceAll(/[\\x00-\\x1F\\x20\n]/g, ".");
    chars += " ".repeat(blockSize - block.length);
    lines.push(addr + " " + codes + "  " + chars);
  }
  return lines.join(newLine);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function toUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}
