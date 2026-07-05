import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getDefaultMembership } from "@/lib/permissions";
import path from "path";
import fs from "fs";

const EXTENSION_FILES = [
  "manifest.json",
  "background.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "options.html",
  "options.js",
  "options.css",
  "shared.js",
];

function u16le(n: number) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n, 0);
  return b;
}
function u32le(n: number) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n, 0);
  return b;
}

function crc32(buf: Buffer): number {
  const table = makeCrcTable();
  let crc = 0xffffffff;
  for (const byte of buf) crc = (table[(crc ^ byte) & 0xff] ^ (crc >>> 8)) >>> 0;
  return (crc ^ 0xffffffff) >>> 0;
}

let _crcTable: number[] | null = null;
function makeCrcTable() {
  if (_crcTable) return _crcTable;
  _crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    _crcTable[n] = c;
  }
  return _crcTable;
}

function buildZip(files: { name: string; data: Buffer }[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    const size = file.data.length;

    const local = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      u16le(20), u16le(0), u16le(0),
      u16le(0), u16le(0),
      u32le(crc), u32le(size), u32le(size),
      u16le(nameBytes.length), u16le(0),
      nameBytes,
      file.data,
    ]);

    const central = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x01, 0x02]),
      u16le(20), u16le(20), u16le(0), u16le(0),
      u16le(0), u16le(0), u16le(0),
      u32le(crc), u32le(size), u32le(size),
      u16le(nameBytes.length), u16le(0), u16le(0),
      u16le(0), u16le(0), u32le(0),
      u32le(offset),
      nameBytes,
    ]);

    localHeaders.push(local);
    centralHeaders.push(central);
    offset += local.length;
  }

  const centralStart = offset;
  const centralBuf = Buffer.concat(centralHeaders);
  const commentBytes = Buffer.from("StorePilot Extension", "utf8");

  const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x05, 0x06]),
    u16le(0), u16le(0),
    u16le(files.length), u16le(files.length),
    u32le(centralBuf.length), u32le(centralStart),
    u16le(commentBytes.length),
    commentBytes,
  ]);

  return Buffer.concat([...localHeaders, centralBuf, eocd]);
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const membership = await getDefaultMembership(userId);
  if (!membership) return NextResponse.json({ error: "No workspace found." }, { status: 403 });

  const extensionDir = path.join(process.cwd(), "extension");

  const files: { name: string; data: Buffer }[] = [];
  for (const fileName of EXTENSION_FILES) {
    const filePath = path.join(extensionDir, fileName);
    if (fs.existsSync(filePath)) {
      files.push({ name: fileName, data: fs.readFileSync(filePath) });
    }
  }

  const zip = buildZip(files);

  return new NextResponse(new Uint8Array(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="storepilot-extension.zip"',
      "Content-Length": String(zip.length),
    },
  });
}
