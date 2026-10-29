#!/usr/bin/env node
// เซิร์ฟเวอร์เล็ก ๆ สำหรับคลังหนังสือบาลี — ไม่ต้องติดตั้งแพ็กเกจเพิ่ม (ต้องมี Node.js 18+)
//   รัน:  node server.js          แล้วเปิด http://localhost:3000
//   ตั้งรหัสผ่านจริง:  ADMIN_USER=ชื่อ ADMIN_PASS=รหัส node server.js
//
// หน้าที่: เสิร์ฟหน้าเว็บ + API สำหรับหลังบ้าน (ล็อกอิน, บันทึก data/books.json, อัปโหลด PDF ลง books/)
// หน้าบ้านอ่านข้อมูลจาก data/books.json ไฟล์เดียวกับที่หลังบ้านเขียน จึงเห็นการเปลี่ยนแปลงทันที

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pipeline, Transform } = require("stream");

const ROOT = __dirname;
const PORT = +process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "123456789";
const MAX_UPLOAD = (+process.env.MAX_UPLOAD_MB || 200) * 1024 * 1024;
const DATA_FILE = path.join(ROOT, "data", "books.json");
const BOOKS_DIR = path.join(ROOT, "books");
const TOKEN_TTL = 8 * 60 * 60 * 1000; // ล็อกอินค้างได้ 8 ชั่วโมง

const tokens = new Map(); // token -> เวลาหมดอายุ
const fails = new Map();  // ip -> { n, until } กันเดารหัสผ่าน

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
};
const BLOCKED = new Set(["server.js", "package.json", "package-lock.json", "node_modules"]);

// ---------- ตัวช่วย ----------
function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0, tooBig = false;
    const chunks = [];
    req.on("data", c => { size += c.length; if (size > limit) tooBig = true; else chunks.push(c); });
    req.on("end", () => tooBig ? reject(Object.assign(new Error("ข้อมูลใหญ่เกินไป"), { status: 413 })) : resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
const sha = v => crypto.createHash("sha256").update(String(v)).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const fmtSize = b => b >= 1048576 ? (b / 1048576).toFixed(2) + " MB" : (b / 1024).toFixed(2) + " KB";

function isAuthed(req) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  const exp = tokens.get(t);
  if (!exp) return false;
  if (exp < Date.now()) { tokens.delete(t); return false; }
  return true;
}

// ตรวจและทำความสะอาดรายการหนังสือก่อนบันทึก
function cleanBooks(arr) {
  if (!Array.isArray(arr) || arr.length > 5000) return null;
  let maxId = 0;
  arr.forEach(x => { if (x && +x.id > maxId) maxId = +x.id; });
  const s = v => String(v ?? "").slice(0, 2000);
  const out = [];
  for (const x of arr) {
    if (!x || typeof x.title !== "string" || typeof x.file !== "string") return null;
    const title = x.title.trim(), file = x.file.trim();
    if (!title || !file) return null;
    // ลิงก์ต้องเป็นพาธในเว็บหรือ http(s) เท่านั้น (กัน javascript: ฯลฯ)
    if (!/^https?:\/\//i.test(file) && /^[a-z][a-z0-9+.-]*:/i.test(file)) return null;
    out.push({ id: +x.id > 0 ? +x.id : ++maxId, title: s(title), category: s(x.category), level: s(x.level), desc: s(x.desc), size: s(x.size), file: s(file) });
  }
  return out;
}
function writeBooks(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, DATA_FILE); // เขียนไฟล์ชั่วคราวก่อนแล้วสลับ กันไฟล์เสียถ้าดับกลางคัน
}

// ---------- API ----------
async function handleLogin(req, res) {
  const ip = req.socket.remoteAddress || "?";
  const f = fails.get(ip);
  if (f && f.until > Date.now()) return send(res, 429, { error: "ลองผิดหลายครั้ง กรุณารอสักครู่" });
  let body;
  try { body = JSON.parse((await readBody(req, 10 * 1024)).toString("utf8")); } catch { return send(res, 400, { error: "คำขอไม่ถูกต้อง" }); }
  const ok = safeEq(body.username ?? "", ADMIN_USER) & safeEq(body.password ?? "", ADMIN_PASS);
  if (!ok) {
    const n = (f ? f.n : 0) + 1;
    fails.set(ip, { n, until: n >= 5 ? Date.now() + 5 * 60 * 1000 : 0 });
    return send(res, 401, { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  }
  fails.delete(ip);
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, Date.now() + TOKEN_TTL);
  send(res, 200, { token });
}

async function handleSaveBooks(req, res) {
  if (!isAuthed(req)) return send(res, 401, { error: "ต้องเข้าสู่ระบบ" });
  let list;
  try { list = cleanBooks(JSON.parse((await readBody(req, 5 * 1024 * 1024)).toString("utf8"))); } catch (e) { if (e.status) throw e; list = null; }
  if (!list) return send(res, 400, { error: "ข้อมูลหนังสือไม่ถูกต้อง" });
  writeBooks(list);
  send(res, 200, { ok: true, count: list.length });
}

function handleUpload(req, res, url) {
  if (!isAuthed(req)) { req.resume(); return send(res, 401, { error: "ต้องเข้าสู่ระบบ" }); }
  if (+req.headers["content-length"] > MAX_UPLOAD) { req.resume(); return send(res, 413, { error: `ไฟล์ใหญ่เกิน ${MAX_UPLOAD / 1048576} MB` }); }

  // ตั้งชื่อไฟล์ให้ปลอดภัย: เหลือตัวอักษร/ตัวเลข/จุด/ขีด (รองรับภาษาไทย) และลงท้าย .pdf
  let base = path.basename(url.searchParams.get("name") || "book.pdf")
    .replace(/\.pdf$/i, "").replace(/[^\p{L}\p{N}\p{M}._-]+/gu, "_").replace(/^[._]+/, "").slice(0, 120) || "book";
  let name = base + ".pdf";
  fs.mkdirSync(BOOKS_DIR, { recursive: true });
  if (fs.existsSync(path.join(BOOKS_DIR, name))) name = `${base}-${Date.now()}.pdf`; // ไม่เขียนทับไฟล์เดิม

  const tmp = path.join(BOOKS_DIR, "." + crypto.randomBytes(6).toString("hex") + ".part");
  let size = 0, head = Buffer.alloc(0);
  const guard = new Transform({
    transform(chunk, _, cb) {
      size += chunk.length;
      if (head.length < 5) head = Buffer.concat([head, chunk.subarray(0, 5 - head.length)]);
      if (size > MAX_UPLOAD) return cb(Object.assign(new Error(`ไฟล์ใหญ่เกิน ${MAX_UPLOAD / 1048576} MB`), { status: 413 }));
      cb(null, chunk);
    },
  });
  pipeline(req, guard, fs.createWriteStream(tmp), err => {
    if (err) { fs.unlink(tmp, () => {}); return send(res, err.status || 500, { error: err.message }); }
    if (size === 0 || head.toString("latin1") !== "%PDF-") { fs.unlink(tmp, () => {}); return send(res, 400, { error: "ไม่ใช่ไฟล์ PDF" }); }
    fs.renameSync(tmp, path.join(BOOKS_DIR, name));
    send(res, 200, { path: "books/" + name, size: fmtSize(size) });
  });
}

// ---------- ไฟล์หน้าเว็บ ----------
function notFound(res) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("ไม่พบหน้านี้"); }

function serveStatic(req, res, url) {
  let p;
  try { p = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
  if (p.endsWith("/")) p += "index.html";
  const full = path.join(ROOT, p);
  if (!full.startsWith(ROOT + path.sep)) return notFound(res);
  const rel = path.relative(ROOT, full).split(path.sep);
  if (rel.some(s => s.startsWith(".")) || BLOCKED.has(rel[0])) return notFound(res);

  fs.stat(full, (e, st) => {
    if (e || !st.isFile()) return notFound(res);
    const ext = path.extname(full).toLowerCase();
    const headers = { "Content-Type": MIME[ext] || "application/octet-stream", "Accept-Ranges": "bytes" };
    headers["Cache-Control"] = (full === DATA_FILE || ext === ".html" || ext === ".js") ? "no-cache" : "public, max-age=3600";

    let start = 0, end = st.size - 1, code = 200;
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (m && (m[1] || m[2])) { // รองรับดาวน์โหลดต่อและเปิด PDF แบบทีละส่วน
      if (m[1]) { start = +m[1]; if (m[2]) end = Math.min(+m[2], end); } else start = Math.max(0, st.size - +m[2]);
      if (start > end) { res.writeHead(416, { "Content-Range": "bytes */" + st.size }); return res.end(); }
      code = 206; headers["Content-Range"] = `bytes ${start}-${end}/${st.size}`;
    }
    headers["Content-Length"] = end - start + 1;
    res.writeHead(code, headers);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(full, { start, end }).pipe(res);
  });
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const { pathname } = url;
    if (pathname === "/api/ping") return send(res, 200, { ok: true });
    if (pathname === "/api/login" && req.method === "POST") return await handleLogin(req, res);
    if (pathname === "/api/books" && req.method === "PUT") return await handleSaveBooks(req, res);
    if (pathname === "/api/upload" && req.method === "POST") return handleUpload(req, res, url);
    if (pathname.startsWith("/api/")) return send(res, 404, { error: "ไม่พบ API นี้" });
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
    serveStatic(req, res, url);
  } catch (e) {
    if (!res.headersSent) send(res, e.status || 500, { error: e.message || "เกิดข้อผิดพลาด" });
    else res.end();
  }
}).listen(PORT, () => {
  console.log(`คลังหนังสือบาลี: http://localhost:${PORT}   หลังบ้าน: http://localhost:${PORT}/admin/login.html`);
  if (!process.env.ADMIN_PASS) console.warn("⚠ ยังใช้รหัสผ่านเริ่มต้น (123456789) — ตั้งค่า ADMIN_PASS ก่อนใช้งานจริง");
});
