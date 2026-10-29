// ===== ข้อมูลและฟังก์ชันที่ใช้ร่วมกัน (หน้าบ้าน + หลังบ้าน) =====
const SITE = { name: "คลังหนังสือบาลี", email: "natthawutss09@gmail.com" };
const CATEGORIES = ["ไวยากรณ์","อรรถกถา","ข้อสอบ/แบบฝึก","พจนานุกรม","ธรรมบทบาลี","ธรรมบทยกศัพท์","ธรรมบทแปล","หลักสูตรเปรียญธรรม"];

// ลิงก์ดาวน์โหลดภายนอก (เช่น MediaFire) — คีย์คือพาธเดิมของไฟล์ ถ้ามีจะใช้แทน
const EXTERNAL_LINKS = {
  "books/dhammapada-pali-1.pdf": "https://www.mediafire.com/file/pix9yv1hzj152l6/1.%25E0%25B8%259B%25E0%25B8%2590%25E0%25B9%2582%25E0%25B8%25A1_%25E0%25B8%25A0%25E0%25B8%25B2%25E0%25B9%2582%25E0%25B8%2584.pdf/file",
};

function defaultBooks() {
  const b = [
    ["บาลีไวยากรณ์เบื้องต้น","ไวยากรณ์","เริ่มต้น","หนังสือสำหรับผู้เริ่มเรียนบาลี อธิบายอักขระ สนธิ นามศัพท์ และกิริยาเบื้องต้น","12 MB","pali-grammar.pdf"],
    ["ธัมมปทัฏฐกถา เล่ม 1","อรรถกถา","กลาง","เอกสารประกอบการอ่านอรรถกถาธรรมบท เหมาะสำหรับผู้มีพื้นฐานบาลีแล้ว","25 MB","dhammapada-atthakatha-1.pdf"],
    ["แบบฝึกแปลบาลี ป.ธ. 3","ข้อสอบ/แบบฝึก","ป.ธ.3","รวมแบบฝึกหัดแปลบาลีเป็นไทย พร้อมพื้นที่สำหรับจดคำศัพท์และหลักไวยากรณ์","8 MB","pali-translation-pt3.pdf"],
    ["พจนานุกรมศัพท์บาลีพื้นฐาน","พจนานุกรม","ทุกระดับ","รวบรวมศัพท์บาลีที่พบบ่อย พร้อมคำแปลไทย ใช้ประกอบการอ่านและท่องศัพท์","18 MB","pali-dictionary.pdf"],
    ["คู่มือเตรียมสอบบาลี ป.ธ. 5","ข้อสอบ/แบบฝึก","ป.ธ.5","แนวทางอ่านหนังสือ ทบทวนหลักบาลี และตัวอย่างโจทย์สำหรับผู้เตรียมสอบ ป.ธ.5","15 MB","pali-pt5-guide.pdf"],
    ["มูลกัจจายนะเบื้องต้น","ไวยากรณ์","สูง","หนังสือศึกษาไวยากรณ์บาลีแบบดั้งเดิม เหมาะสำหรับผู้ต้องการเรียนเชิงลึก","22 MB","mula-kaccayana.pdf"],
  ].map(r => ({ title:r[0], category:r[1], level:"ระดับ: "+r[2], desc:r[3], size:r[4], file:"books/"+r[5] }));

  const th = ["๑","๒","๓","๔","๕","๖","๗","๘"];
  const pali = ["ปฐโม","ทุติโย","ตติโย","จตุตฺโถ","ปญฺจโม","ฉฏฺโฐ","สตฺตโม","อฏฺฐโม"];
  const lv = (i, wbw) => i >= 4 ? (wbw ? "ป.ธ.๓" : "ป.ธ.๓ และ ป.ธ.๖") : wbw ? "ประโยค ๑-๒" : "ประโยค ๑-๒ และ ป.ธ." + (i === 0 ? "๔" : "๕");
  const sizes = {
    pali:["581.61 KB","636.98 KB","762.03 KB","588.20 KB","479.49 KB","675.45 KB","596.57 KB","706.65 KB"],
    wbw:["8.94 MB","603.67 KB","887.74 KB","598.25 KB","487.17 KB","880.47 KB","900.01 KB","711.57 KB"],
    tr:["801.89 KB","879.00 KB","1017.04 KB","786.82 KB","693.60 KB","981.02 KB","862.01 KB","999.61 KB"],
  };
  for (let i = 0; i < 8; i++) {
    b.push({ title:`หนังสือธรรมบทบาลี ภาค ${th[i]} (${pali[i]} ภาโค)`, category:"ธรรมบทบาลี", level:"ระดับ: "+lv(i,false), desc:`วิชาแปล-กลับธรรมบทบาลี ภาค ${th[i]} สำหรับใช้ประกอบการเรียนและการเตรียมสอบบาลี`, size:sizes.pali[i], file:`books/dhammapada-pali-${i+1}.pdf` });
    b.push({ title:`ธรรมบท ภาค ${th[i]} (ยกศัพท์แปลโดยพยัญชนะ)`, category:"ธรรมบทยกศัพท์", level:"ระดับ: "+lv(i,true), desc:`เอกสารยกศัพท์และแปลโดยพยัญชนะธรรมบท ภาค ${th[i]} สำหรับฝึกแปลบาลีเป็นไทย`, size:sizes.wbw[i], file:`books/dhammapada-word-by-word-${i+1}.pdf` });
    b.push({ title:`หนังสือธรรมบทแปล ภาค ${th[i]}`, category:"ธรรมบทแปล", level:"ระดับ: "+lv(i,false), desc:`วิชาแปล-กลับธรรมบทแปล ภาค ${th[i]} ใช้ประกอบการอ่านแปลและเตรียมสอบ`, size:sizes.tr[i], file:`books/dhammapada-translation-${i+1}.pdf` });
  }
  // หลักสูตรเปรียญธรรม ประโยค ๑-๒ ถึง ป.ธ.๙
  const levels = [["ประโยค ๑-๒","pt1-2"],["ป.ธ.๓","pt3"],["ป.ธ.๔","pt4"],["ป.ธ.๕","pt5"],["ป.ธ.๖","pt6"],["ป.ธ.๗","pt7"],["ป.ธ.๘","pt8"],["ป.ธ.๙","pt9"]];
  levels.forEach(([name, key]) => {
    b.push({ title:`หลักสูตร${name} — เอกสารประกอบการเรียน`, category:"หลักสูตรเปรียญธรรม", level:"ระดับ: "+name, desc:`เอกสารประกอบหลักสูตรระดับ${name} สำหรับใช้ศึกษาและเตรียมสอบบาลีสนามหลวง`, size:"—", file:`books/curriculum-${key}.pdf` });
  });
  // หนังสือเพิ่มเติม: [ชื่อ, หมวด, ระดับ, คำอธิบาย, ขนาด, ไฟล์]
  [
    ["คู่มือบาลีไวยากรณ์และหลักสัมพันธ์ (ฉบับแผนผัง)","ไวยากรณ์","ประโยค ๑-๒ และ ป.ธ.๓","พระมหาปรีชา ปิยธมฺโม รวบรวมและเรียบเรียง สรุปบาลีไวยากรณ์และหลักสัมพันธ์เป็นแผนผัง เหมาะสำหรับผู้ศึกษาประโยค ๑-๒ และ ป.ธ.๓","12.64 MB","pali-grammar-diagram-guide.pdf"],
    ["สรุปวิชาบาลีไวยากรณ์ ประโยค ๑-๒ (ก่อนสอบ ปี ๒๕๖๙)","ไวยากรณ์","ประโยค ๑-๒","สรุปจากแนวข้อสอบเก่าสนามหลวง ปี ๒๕๓๐-๒๕๖๘ ไฮไลต์ส่วนที่เคยออกสอบ ใช้ทบทวนก่อนสอบ","501.46 KB","pali-grammar-summary-pt1-2.pdf"],
    ["ปัญหา-เฉลย วิชาบาลีไวยากรณ์ ประโยค ๑-๒ (ฉบับปรับปรุง)","ข้อสอบ/แบบฝึก","ประโยค ๑-๒","ขนฺตสิรโณ ภิกฺขุ รวบรวมและเรียบเรียง ข้อสอบสนามหลวงพร้อมเฉลย จัดปัญหาและเฉลยไว้ติดกันเพื่อให้อ่านง่าย","—","pali-grammar-qa-pt1-2.pdf"],
    ["อตฺถานุกฺกมทีปิกา กิริยากิตก์ในธัมมปทัฏฐกถา ภาค ๑ (ฉบับทดลอง)","อรรถกถา","ฉบับทดลอง","นาวาโท สุรเชษฐ์ ทองแม้น ป.ธ.๙ วิเคราะห์กิริยากิตก์ในธัมมปทัฏฐกถา ภาค ๑ รวม ๑๔ เรื่อง ตั้งแต่พระจักขุบาลเถระถึงภิกษุสองสหาย","—","atthanukkamadipika-kitaka-1.pdf"],
  ].forEach(r => b.push({ title:r[0], category:r[1], level:"ระดับ: "+r[2], desc:r[3], size:r[4], file:"books/"+r[5] }));
  return b.map((x, i) => ({ id: i + 1, ...x, file: EXTERNAL_LINKS[x.file] || x.file }));
}

// ที่อยู่ตัวเก็บข้อมูลกลาง: หน้าบ้านอ่าน ส่วนหลังบ้านเขียน (ผ่าน server.js)
const DATA_URL = "data/books.json";
const DRAFT_KEY = "pali_books_admin_draft"; // ร่างในเครื่องของแอดมิน ใช้เฉพาะตอนไม่มีเซิร์ฟเวอร์
const BASE = location.pathname.includes("/admin/") ? "../" : "";

// โหลดรายการหนังสือจาก data/books.json (ถ้าโหลดไม่ได้ใช้ค่าเริ่มต้นในโค้ด)
async function loadBooks() {
  try {
    const r = await fetch(BASE + DATA_URL, { cache: "no-store" });
    if (r.ok) { const d = await r.json(); if (Array.isArray(d)) return d; }
  } catch (e) {}
  return defaultBooks();
}
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function safeHref(u) { return /^\s*(javascript|data|vbscript):/i.test(u) ? "#" : u; }

function bookCard(b, base = "") {
  return `<article class="book-card"><div class="book-top"><div class="file-icon">📄</div><span class="book-category">${esc(b.category)}</span></div>
  <h3>${esc(b.title)}</h3><div class="book-level">${esc(b.level)}</div><p class="book-description">${esc(b.desc)}</p>
  <div class="book-meta"><span>PDF</span><span>${esc(b.size)}</span></div>
  <a href="${esc(safeHref(base + b.file))}" class="download-button" target="_blank" download>⬇ ดาวน์โหลด</a></article>`;
}

function renderLayout(active) {
  const links = [["index.html","หน้าแรก"],["books.html","หนังสือ"],["about.html","เกี่ยวกับเรา"],["contact.html","ติดต่อ"]];
  document.getElementById("site-header").innerHTML = `<header><div class="container"><div class="navbar">
    <a href="index.html" class="logo"><div class="logo-icon">📖</div><div><div class="logo-title">${SITE.name}</div><div class="logo-subtitle">อ่าน ค้นหา และดาวน์โหลดฟรี</div></div></a>
    <nav class="menu" id="menu">${links.map(l => `<a href="${l[0]}" class="${l[0]===active?"active":""}">${l[1]}</a>`).join("")}</nav>
    <button class="menu-button" id="menuBtn" aria-label="เมนู">☰</button></div></div></header>`;
  document.getElementById("site-footer").innerHTML = `<footer><div class="container">© 2026 ${SITE.name} — จัดทำเพื่อการศึกษาและเผยแพร่ธรรมะ · <a href="admin/login.html">หลังบ้าน</a></div></footer>`;
  document.getElementById("menuBtn").onclick = () => document.getElementById("menu").classList.toggle("show");
}
