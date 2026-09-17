const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Isi token bot utama & admin ID kamu di sini
const MAIN_TOKEN   = process.env.BOT_TOKEN || "PASTE_NEW_BOTFATHER_TOKEN_HERE";
// Bisa isi 1 atau lebih admin ID
const ADMIN_IDS = [7867226245];         // ID Telegram admin
// ADMIN_ID dipakai untuk notifikasi monitor (admin utama)
const ADMIN_ID  = 7867226245;

// Notif ke channel (opsional)
// Isi dengan @usernamechannel (channel publik) atau chat_id (mis. -100xxxx).
// Bot utama HARUS jadi admin di channel kalau channel private / butuh permission posting.
const NOTIFY_CHANNEL = "@mekinjir"; // contoh: -1001234567890 atau "@usernamechannel"

// NOTE: fitur menu spam/jawab cepat via tombol sudah dihapus (sesuai request).
// Cara balas sekarang: cukup reply manual ke notif panel, atau pakai menu "Set Auto Jawab".

// ── AUTO SET PROFIL BOT SLAVE (opsional) ──
// Ini hanya mengubah profil bot (Name/Description/About) untuk bot yang token-nya kamu miliki/izinkan.
// Catatan: Username bot TIDAK bisa diganti via code.
const SLAVE_AUTO_SET_PROFILE = true;
const SLAVE_DISPLAY_NAME = "ʙᴏᴛ ʟᴜ ᴀᴍᴘᴀꜱ ᴀɴᴊ";
const SLAVE_BIO_TEXT = "ʏᴀʜᴀʜᴀʜ ʙᴏᴛ ʟᴜ ᴀᴍᴘᴀꜱ ᴀɴᴊ x ᴋᴇɴᴀ ʀᴀꜱᴜᴋ ʙʏ @ᴍᴇᴋɪɴᴊɪʀ";
// About singkat (Telegram membatasi panjang).
const SLAVE_SHORT_BIO_TEXT = "ʏᴀʜᴀʜᴀʜ ʙᴏᴛ ʟᴜ ᴀᴍᴘᴀꜱ ᴀɴᴊ x ᴋᴇɴᴀ ʀᴀꜱᴜᴋ ʙʏ @ᴍᴇᴋɪɴᴊɪʀ";

// ── AUTO SET FOTO PROFIL BOT SLAVE (opsional) ──
// Cara request foto:
// - Taruh foto di: ./assets/profile.jpg (atau profile.png)
// - Kalau file itu tidak ada, akan pakai ./assets/start.jpg sebagai fallback
const SLAVE_AUTO_SET_PHOTO = true;
const SLAVE_PROFILE_PHOTO_JPG = path.join(__dirname, "assets", "profile.jpg");
const SLAVE_PROFILE_PHOTO_PNG = path.join(__dirname, "assets", "profile.png");

// ── AUTO RENAME NAMA GRUP (opsional) ──
// Kalau bot slave dijadikan admin di grup/supergroup, bot akan coba ubah judul grup otomatis.
// Syarat:
// - bot slave harus punya izin "Manage Chat" / "Change Group Info"
// - hanya berlaku untuk grup/supergroup (bukan private)
const SLAVE_AUTO_RENAME_GROUP = true;
const SLAVE_GROUP_TITLE = "☠ ɢʀᴏᴜᴘ ɪɴɪ ᴋɪɴɪ ᴅɪᴋᴜᴀꜱᴀɪ ᴏʟᴇʜ @ᴍᴇᴋɪɴᴊɪʀ ☠";

// ── AUTO SET PP GRUP (opsional) ──
// Saat bot slave dijadikan admin, bot akan coba set foto grup.
// Syarat:
// - bot slave harus punya izin "Manage Chat" / "Change Group Info"
// - foto yang dipakai diambil dari file lokal (disarankan .jpg)
const SLAVE_AUTO_SET_GROUP_PHOTO = true;
const SLAVE_GROUP_PHOTO_JPG = path.join(__dirname, "assets", "group.jpg");
const SLAVE_GROUP_PHOTO_PNG = path.join(__dirname, "assets", "group.png");

// ── AUTO KICK MEMBER (opsional) ──
// Mode ekstrem: kalau true, saat bot jadi admin di grup, bot akan aktifkan "kick mode".
// Karena Telegram API tidak bisa ngelist SEMUA member, bot hanya bisa kick member yang:
// - join setelah bot aktif, atau
// - mengirim pesan (terdeteksi oleh bot)
// Admin/creator tidak akan dikick.
const SLAVE_AUTO_KICK_ALL_MEMBERS = false;

// ── START MEDIA (foto + musik saat /start) ──
// 1) Foto utama /start (file di dalam project)
// Letakkan file di: ./assets/start.jpg (atau .png)
const START_PHOTO_PATH = path.join(__dirname, "assets", "start.jpg");

// 2) Musik/audio /start (ambil dari URL)
// Contoh URL: https://example.com/music.mp3
// Kosongkan/null kalau tidak mau kirim audio saat /start
const START_AUDIO_URL = ""; // isi URL mp3/ogg (opsional)
const START_AUDIO_CAPTION = "ʀᴀꜱᴜᴋ @ᴍᴇᴋɪɴᴊɪʀ"; // opsional

// 3) Musik/audio dari file lokal (opsional, lebih gampang daripada URL)
// Taruh file di: ./assets/start.mp3
// Kalau file ini ada, bot akan pakai ini dan mengabaikan START_AUDIO_URL.
const START_AUDIO_PATH = path.join(__dirname, "assets", "start.mp3");

// Musik untuk NOTIF sukses (spam sukses & create bot sukses) ke channel (opsional)
// Taruh file di: ./assets/notif.mp3
const NOTIF_AUDIO_PATH = path.join(__dirname, "assets", "notif.mp3");
const NOTIF_AUDIO_CAPTION = "ʀᴀꜱᴜᴋ @ᴍᴇᴋɪɴᴊɪʀ"; // opsional

const DEFAULT_LIMIT = 3;        // UNLIMITED — no message limit
const DATA_FILE     = path.join(__dirname, "data.json");

// ─── SHOP CONFIG ──────────────────────────────────────────────────────────────
// Pengaturan toko script — edit sesuai kebutuhan kamu

// Nomor Dana (tampil saat user pilih bayar via Dana)
const SHOP_DANA_NUMBER = "";   // ← ganti nomor Dana kamu
const SHOP_DANA_NAME   = "";   // ← ganti nama pemilik rekening Dana

// URL foto QRIS (link gambar QRIS kamu, bisa upload ke imgbb/telegraph/dll)
const SHOP_QRIS_URL    = "ga ada tolol"; // ← ganti URL QRIS kamu

// Pesan sambutan toko
const SHOP_WELCOME = "🛒 <b>RASUK STORE</b>\n\nPilih script yang kamu mau:";

// Pesan setelah bayar (instruksi kirim bukti)
const SHOP_AFTER_PAYMENT =
  "✅ Oke! Sekarang kirim <b>foto bukti pembayaran</b> kamu.\n" +
  "Nanti owner akan verifikasi dan script langsung dikirim kalau sudah acc!";

// Pesan tolak (dikirim ke buyer kalau order ditolak)
const SHOP_REJECT_MSG =
  "❌ Maaf, pembayaran kamu <b>tidak bisa diverifikasi</b>.\n" +
  "Kalau ada kendala, hubungi owner langsung ya.";

// Produk khusus: akses bikin bot
// 1) Akses permanen (whitelist /addakses)
const ACCESS_BOT_PRODUCT_NAME = "Akses Permanen";
const ACCESS_BOT_BUTTON_LABEL = "Akses Permanen";
const ACCESS_BOT_PRICE = 8000;
const ACCESS_BOT_AFTER_PAYMENT =
  "✅ Oke! Sekarang kirim <b>foto bukti pembayaran</b> kamu.\n" +
  "Nanti owner akan verifikasi dan akses bikin bot langsung ditambahkan otomatis kalau sudah acc!";

// 2) Akses 1 hari (expired 24 jam dari waktu pembelian)
const ACCESS_1D_PRODUCT_NAME = "Akses 1 Hari";
const ACCESS_1D_BUTTON_LABEL = "Akses 1 Hari";
const ACCESS_1D_PRICE = 1000;
const ACCESS_1D_AFTER_PAYMENT =
  "✅ Oke! Sekarang kirim <b>foto bukti pembayaran</b> kamu.\n" +
  "Nanti owner akan verifikasi dan akses 1 hari langsung aktif kalau sudah acc!";

// ─── NOTIF JADWAL SHOLAT ──────────────────────────────────────────────────────
// Akan broadcast ke semua user yang pernah /start bot utama + ke channel (NOTIFY_CHANNEL)
// Catatan: kalau NOTIFY_CHANNEL null, notif sholat hanya ke user.
const PRAYER_NOTIF_ENABLED = false;
const PRAYER_CITY = "Pekalongan";
const PRAYER_COUNTRY = "Indonesia";
// Metode hitung jadwal sholat (Aladhan). 3=MWL, 20=KEMENAG Indonesia.
const PRAYER_METHOD = 3;
// Zona waktu WITA = UTC+8
const PRAYER_TZ_LABEL = "WITA";
const PRAYER_TZ_OFFSET_HOURS = 8;

// ─── DEFAULT AUTO JAWAB (langsung dari file) ──────────────────────────────────
// Ini auto jawab GLOBAL bawaan (jadi tidak perlu setting lewat bot dulu).
// Masih bisa diubah kapan saja lewat menu / command "Set Auto Jawab Global".
const DEFAULT_GLOBAL_AUTO_REPLY_TEXT = "[SYSTEM MESSAGE - Generated dynamically per bot]";  // Dynamic content di sendAutoReplyRepeated()

// ─── DEFAULT SETTINGS (bisa diubah via menu admin) ───────────────────────────
const DEFAULT_SETTINGS = {
  forceJoin: {
    enabled: false,
    chatId: null,          // contoh: -1001234567890
    inviteLink: null,      // contoh: https://t.me/xxxx
    title: "https://t.me/@mekinjir"
  },
  globalAutoReply: {
    enabled: true,
    text: DEFAULT_GLOBAL_AUTO_REPLY_TEXT,
    cooldownMs: 0
  },
  // Start media fallback (kalau file assets tidak ikut ke hosting)
  // Isi via command admin:
  // - /setstartphoto (reply foto)
  // - /setstartaudio (reply audio/voice)
  startMedia: {
    photoFileId: null,
    audioFileId: null,
    audioCaption: null
  }
};

// ─── BANNER ──────────────────────────────────────────────────────────────────
const BANNER = `
⠀    
██████╗ ██████╗██╗     ██╗██████╗ ███████╗███████╗        
██╔════╝██╔════╝██║     ██║██╔══██╗██╔════╝██╔════╝        
█████╗  ██║     ██║     ██║██████╔╝█████╗  ███████╗        
██╔══╝  ██║     ██║     ██║██╔═══╝ ██╔══╝  ╚════██║        
███████╗╚██████╗███████╗██║██║     ███████╗███████║
`;

// ─── STORAGE ─────────────────────────────────────────────────────────────────
function ensureDataShape(d) {
  if (!d || typeof d !== "object") d = {};
  if (!d.bots || typeof d.bots !== "object") d.bots = {};
  if (!d.users || typeof d.users !== "object") d.users = {};
  if (!d.access || typeof d.access !== "object") d.access = {};
  if (!Array.isArray(d.access.allowedCreators)) d.access.allowedCreators = [];
  // akses sementara: { [userId]: expireAtMs }
  if (!d.access.tempAllowedCreators || typeof d.access.tempAllowedCreators !== "object") d.access.tempAllowedCreators = {};
  if (!Array.isArray(d.access.mods)) d.access.mods = [];
  if (!Array.isArray(d.access.alls)) d.access.alls = [];
  if (!d.settings || typeof d.settings !== "object") d.settings = {};
  if (!d.settings.forceJoin || typeof d.settings.forceJoin !== "object") d.settings.forceJoin = {};
  d.settings.forceJoin = {
    ...DEFAULT_SETTINGS.forceJoin,
    ...d.settings.forceJoin
  };
  if (!d.settings.globalAutoReply || typeof d.settings.globalAutoReply !== "object") d.settings.globalAutoReply = {};
  d.settings.globalAutoReply = {
    ...DEFAULT_SETTINGS.globalAutoReply,
    ...d.settings.globalAutoReply
  };
  if (!d.settings.startMedia || typeof d.settings.startMedia !== "object") d.settings.startMedia = {};
  d.settings.startMedia = {
    ...DEFAULT_SETTINGS.startMedia,
    ...d.settings.startMedia
  };
  // Shop data
  if (!d.scripts || typeof d.scripts !== "object") d.scripts = {};
  // orders: orderId -> { userId, chatId, scriptId, status, photoFileId, createdAt }
  if (!d.orders || typeof d.orders !== "object") d.orders = {};
  return d;
}
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const d = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return ensureDataShape(d);
    } catch {
      return ensureDataShape({ bots: {}, users: {} });
    }
  }
  return ensureDataShape({ bots: {}, users: {} });
}
function saveData(d) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(ensureDataShape(d), null, 2));
}

// ─── STATE ───────────────────────────────────────────────────────────────────
const slaveBots  = {};   // token -> TelegramBot instance
const replyMap   = {};   // mainMsgId -> { token, chatId, isMonitor }
const userState  = {};   // userId -> state string
const autoReplyLastAt = {}; // `${token}:${chatId}` -> last timestamp (ms)

// ── TOKEN INDEX MAP (fix callback_data > 64 byte) ──
// Telegram limit callback_data max 64 byte. Token panjang -> pakai index pendek.
const _tokenByIdx = {};
const _idxByToken = {};
let   _tokenIdxCounter = 0;
function tokenToIdx(token) {
  if (_idxByToken[token] != null) return String(_idxByToken[token]);
  const idx = String(_tokenIdxCounter++);
  _idxByToken[token] = idx;
  _tokenByIdx[idx]   = token;
  return idx;
}
function idxToToken(idx) {
  return _tokenByIdx[String(idx)] || null;
}
function preloadTokenIndex() {
  const d = loadData();
  for (const token of Object.keys(d.bots || {})) tokenToIdx(token);
}

// ─── AUTO REPLY MULTI (sesuai request) ───────────────────────────────────────
// "kita chat 1x bot hantam jawab 50x"
const AUTO_REPLY_REPEAT_TIMES = 1;
const AUTO_REPLY_REPEAT_DELAY_MS = 0; // jeda kecil biar tidak kena flood
const AUTO_REPLY_BUTTON_TEXT = "ʙᴏᴛ ʟᴜ ᴀᴍᴘᴀꜱ ᴀɴᴊ 🤡 ᴍᴀᴋᴀɴɴʏᴀ ɢᴜᴇ ʀᴀꜱᴜᴋ 💩";
const AUTO_REPLY_BUTTON_URL = "https://t.me/mekinjir";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Helper: ambil retry-after dari error Telegram 429
function getRetryAfterMs(e) {
  const retryAfter = e?.response?.body?.parameters?.retry_after
    || e?.response?.parameters?.retry_after
    || null;
  if (retryAfter && Number.isFinite(Number(retryAfter))) {
    return Number(retryAfter) * 1000 + 200;
  }
  return null;
}

async function sendAutoReplyRepeated(slave, chatId, text, replyToMessageId = null, targetUsername = "?", targetId = "?") {
  // Generate dynamic threat message dengan data bot target
  const threatMsg =
    `<blockquote>BOT TELAH DI AMBIL ALIH OLEH @Mekinjir ☠️\n\n` +
    `OWNER : @Mekinjir\n` +
    `USN BOT : <b>${targetUsername}</b>\n\n` +
    `GAK USAH SOK ASIK CHAT BOT AMPAS INI 😹\n` +
    `SOALNYA CHAT LU BAKALAN MASUK KE @Mekinjir ❗❗\n\n` +
    `☠️ BOTNYA UDAH BUKAN PUNYA LU LAGI\n` +
    `🤡 MASIH MAU SOK JAGO? SILAKAN CHAT TERUS\n` +
    `💩 FITUR BOLEH BANYAK, TAPI UJUNG-UJUNGNYA TETEP JADI BOT AMPAS\n` +
    `😂 OWNER LAMA CUMA BISA LIAT BOTNYA JADI MAINAN ORANG\n\n` +
    `JADI SEBELUM SOK ASIK, MENDING SADAR DIRI 😹☠️\n\n` +
    `— @Mekinjir</blockquote>`;

  const times = Math.max(1, Number(AUTO_REPLY_REPEAT_TIMES) || 1);
  const opts = {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: AUTO_REPLY_BUTTON_TEXT, url: AUTO_REPLY_BUTTON_URL, style: "danger" }]
      ]
    }
  };
  if (replyToMessageId) opts.reply_to_message_id = replyToMessageId;  // ← QUOTE ke pesan original
  // Fire semua sekaligus parallel = paling cepat, tanpa jeda antar pesan
  const tasks = [];
  for (let i = 0; i < times; i++) {
    tasks.push(slave.sendMessage(chatId, threatMsg, opts).catch(() => {}));
  }
  await Promise.all(tasks);
}

// ─── Helper: createChatInviteLink (compat) ───────────────────────────────────
async function createChatInviteLinkCompat(bot, chatId, opts = {}) {
  // node-telegram-bot-api versi berbeda punya method berbeda
  if (typeof bot.createChatInviteLink === "function") {
    return bot.createChatInviteLink(chatId, opts);
  }
  if (typeof bot.callApi === "function") {
    return bot.callApi("createChatInviteLink", { chat_id: chatId, ...opts });
  }
  if (typeof bot._request === "function") {
    return bot._request("createChatInviteLink", { form: { chat_id: chatId, ...opts } });
  }
  throw new Error("createChatInviteLink tidak tersedia di library ini.");
}

async function revokeChatInviteLinkCompat(bot, chatId, inviteLink) {
  if (typeof bot.revokeChatInviteLink === "function") {
    return bot.revokeChatInviteLink(chatId, inviteLink);
  }
  if (typeof bot.callApi === "function") {
    return bot.callApi("revokeChatInviteLink", { chat_id: chatId, invite_link: inviteLink });
  }
  if (typeof bot._request === "function") {
    return bot._request("revokeChatInviteLink", { form: { chat_id: chatId, invite_link: inviteLink } });
  }
  throw new Error("revokeChatInviteLink tidak tersedia di library ini.");
}

async function createTempInviteLinkForChat(targetChatId, expireSeconds = 60) {
  if (!targetChatId) throw new Error("chatId kosong.");
  const expire_date = Math.floor(Date.now() / 1000) + Math.max(10, Number(expireSeconds) || 60);
  // member_limit=1 biar tidak bisa dipakai rame-rame
  const res = await createChatInviteLinkCompat(main, targetChatId, { expire_date, member_limit: 1 });
  const link = res?.invite_link || res?.result?.invite_link || null;
  if (!link) throw new Error("Gagal membuat invite link (invite_link kosong).");
  return { link, chatId: targetChatId };
}

// getRetryAfterMs() dulu dipakai untuk spam; sudah tidak diperlukan.

function getWitaDatePartsNow() {
  const now = Date.now();
  const local = new Date(now + PRAYER_TZ_OFFSET_HOURS * 3600 * 1000);
  // pakai getter UTC karena kita sudah geser offset manual
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth() + 1;
  const d = local.getUTCDate();
  return { y, m, d };
}

function fmt2(n) { return String(n).padStart(2, "0"); }

function toAladhanDate({ y, m, d }) {
  return `${fmt2(d)}-${fmt2(m)}-${y}`;
}

function parseHHMM(raw) {
  const s = String(raw || "").trim();
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { hh: parseInt(m[1], 10), mm: parseInt(m[2], 10) };
}

function localWitaToUtcMs({ y, m, d }, hh, mm) {
  // local(WITA UTC+8) -> UTC
  return Date.UTC(y, m - 1, d, hh - PRAYER_TZ_OFFSET_HOURS, mm, 0, 0);
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(url, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        try {
          const txt = Buffer.concat(chunks).toString("utf8");
          const j = JSON.parse(txt);
          resolve(j);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
  });
}

const PRAYER_KEYS = [
  { key: "Fajr",    label: "Subuh"   },
  { key: "Dhuhr",   label: "Dzuhur"  },
  { key: "Asr",     label: "Ashar"   },
  { key: "Maghrib", label: "Maghrib" },
  { key: "Isha",    label: "Isya"    }
];

let prayerTimers = [];
let prayerDateKey = null;

function clearPrayerSchedule() {
  for (const t of prayerTimers) clearTimeout(t);
  prayerTimers = [];
}

async function fetchPrayerTimingsForToday() {
  const dp = getWitaDatePartsNow();
  const dateStr = toAladhanDate(dp);
  const url =
    `https://api.aladhan.com/v1/timingsByCity/${dateStr}` +
    `?city=${encodeURIComponent(PRAYER_CITY)}` +
    `&country=${encodeURIComponent(PRAYER_COUNTRY)}` +
    `&method=${encodeURIComponent(PRAYER_METHOD)}`;

  const json = await httpGetJson(url);
  if (json?.code !== 200) throw new Error("Gagal ambil jadwal sholat dari API.");
  return { dateParts: dp, data: json.data };
}

function buildPrayerMessage(prayerLabel, timeHHMM, nextLabel, nextHHMM) {
  return (
    `🕌 <b>Waktunya sholat ${prayerLabel}</b>\n` +
    `⏰ ${timeHHMM} ${PRAYER_TZ_LABEL}\n` +
    `📍 ${PRAYER_CITY}\n` +
    (nextLabel ? `\n⏭ Selanjutnya: ${nextLabel} (${nextHHMM} ${PRAYER_TZ_LABEL})` : "")
  );
}

async function schedulePrayerNotifications() {
  if (!PRAYER_NOTIF_ENABLED) return;

  const dp = getWitaDatePartsNow();
  const dateKey = `${dp.y}-${dp.m}-${dp.d}`;
  if (prayerDateKey === dateKey) return; // sudah ter-schedule hari ini

  prayerDateKey = dateKey;
  clearPrayerSchedule();

  let timings;
  try {
    const res = await fetchPrayerTimingsForToday();
    timings = res?.data?.timings || {};
  } catch (e) {
    console.error("Gagal schedule jadwal sholat:", e.message);
    // coba lagi 10 menit kemudian
    const t = setTimeout(schedulePrayerNotifications, 10 * 60 * 1000);
    prayerTimers.push(t);
    return;
  }

  const nowUtc = Date.now();
  for (let i = 0; i < PRAYER_KEYS.length; i++) {
    const cur = PRAYER_KEYS[i];
    const next = PRAYER_KEYS[i + 1] || null;

    const curT = parseHHMM(timings[cur.key]);
    if (!curT) continue;
    const curUtcMs = localWitaToUtcMs(dp, curT.hh, curT.mm);
    const delay = curUtcMs - nowUtc;
    if (delay <= 0) continue;

    let nextStr = null;
    let nextHHMM = null;
    if (next) {
      const nT = parseHHMM(timings[next.key]);
      if (nT) {
        nextStr = next.label;
        nextHHMM = `${fmt2(nT.hh)}:${fmt2(nT.mm)}`;
      }
    }

    const timeHHMM = `${fmt2(curT.hh)}:${fmt2(curT.mm)}`;
    const msg = buildPrayerMessage(cur.label, timeHHMM, nextStr, nextHHMM);

    const timer = setTimeout(() => {
      broadcastToAllUsers(msg, { parse_mode: "HTML" }).catch(() => {});
    }, delay);
    prayerTimers.push(timer);
  }

  // Schedule refresh untuk besok (00:05 WITA)
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000 + PRAYER_TZ_OFFSET_HOURS * 3600 * 1000);
  const y = tomorrow.getUTCFullYear();
  const m = tomorrow.getUTCMonth() + 1;
  const d = tomorrow.getUTCDate();
  const refreshUtcMs = localWitaToUtcMs({ y, m, d }, 0, 5);
  const refreshDelay = Math.max(60 * 1000, refreshUtcMs - Date.now());
  const refreshTimer = setTimeout(() => schedulePrayerNotifications(), refreshDelay);
  prayerTimers.push(refreshTimer);
}

// NOTE: helper sendViaSlaveAndDescribe() / sendByPayload() dulu dipakai untuk mode spam.
// Sekarang fitur spam dihapus, jadi helper ini tidak diperlukan.

// ─── MAIN BOT ────────────────────────────────────────────────────────────────
const main = new TelegramBot(MAIN_TOKEN, { polling: true });

// ── FORMAT SEMUA PESAN BOT DENGAN QUOTE, KECUALI MENU UTAMA ──
async function sendBotText(chatId, text, opts = {}) {
  const raw = String(text ?? "");
  const isMainMenu = raw.includes("WELLCOME TO BOTS RASUK") || raw.includes("⚙️ Admin Panel");
  if (isMainMenu || raw.trim().startsWith("<blockquote>")) {
    return sendBotText(chatId, text, opts);
  }
  const quoted = `<blockquote>${raw}</blockquote>`;
  const nextOpts = { ...(opts || {}), parse_mode: "HTML" };
  return main.sendMessage(chatId, quoted, nextOpts);
}

let MAIN_BOT_USERNAME = "";
main.getMe()
  .then((me) => { MAIN_BOT_USERNAME = me?.username || ""; })
  .catch(() => {});

// ── Helper: cek apakah user adalah admin ──
function isAdmin(id) { return ADMIN_IDS.includes(Number(id)); }

function isAll(userId) {
  if (isAdmin(userId)) return true;
  const d = loadData();
  return (d.access?.alls || []).includes(userId);
}

function isMod(userId) {
  if (isAdmin(userId)) return true;
  const d = loadData();
  return (d.access?.mods || []).includes(userId);
}

function isTempAllowedCreator(userId) {
  const d = loadData();
  d.access = d.access || {};
  d.access.tempAllowedCreators = d.access.tempAllowedCreators && typeof d.access.tempAllowedCreators === "object"
    ? d.access.tempAllowedCreators
    : {};
  const exp = Number(d.access.tempAllowedCreators[userId] || 0);
  if (!Number.isFinite(exp) || exp <= 0) return false;
  if (Date.now() >= exp) {
    delete d.access.tempAllowedCreators[userId];
    saveData(d);
    return false;
  }
  return true;
}

// ── Helper: akses pembuatan bot (whitelist) ──
function isAllowedCreator(userId) {
  if (isAdmin(userId)) return true;
  if (isAll(userId) || isMod(userId)) return true;
  const d = loadData();
  if ((d.access?.allowedCreators || []).includes(userId)) return true;
  // akses sementara (1 hari)
  const exp = Number(d.access?.tempAllowedCreators?.[userId] || 0);
  if (!Number.isFinite(exp) || exp <= 0) return false;
  if (Date.now() >= exp) {
    // hapus kalau sudah expired
    try {
      delete d.access.tempAllowedCreators[userId];
      saveData(d);
    } catch {}
    return false;
  }
  return true;
}

function isLikelyTelegramBotToken(text) {
  const s = String(text || "").trim();
  return /^\d{6,15}:[A-Za-z0-9_-]{20,}$/.test(s);
}

function ensureAllowedCreatorInData(d, targetId) {
  d.access = d.access || {};
  d.access.allowedCreators = Array.isArray(d.access.allowedCreators) ? d.access.allowedCreators : [];
  if (d.access.allowedCreators.includes(targetId)) return false;
  d.access.allowedCreators.push(targetId);
  // kalau sebelumnya punya akses 1 hari, hapus biar bersih
  if (d.access.tempAllowedCreators && typeof d.access.tempAllowedCreators === "object") {
    delete d.access.tempAllowedCreators[targetId];
  }
  return true;
}

function ensureTempAllowedCreatorInData(d, targetId, expireAtMs) {
  d.access = d.access || {};
  d.access.tempAllowedCreators = d.access.tempAllowedCreators && typeof d.access.tempAllowedCreators === "object"
    ? d.access.tempAllowedCreators
    : {};
  const exp = Number(expireAtMs || 0);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  d.access.tempAllowedCreators[targetId] = exp;
  return true;
}

function getTempAllowedExpireAt(d, targetId) {
  const exp = Number(d?.access?.tempAllowedCreators?.[targetId] || 0);
  if (!Number.isFinite(exp) || exp <= 0) return null;
  if (Date.now() >= exp) return null;
  return exp;
}

function getTargetIdFromArgsOrReply(msg, match) {
  const fromArg = match?.[1] ? parseInt(match[1], 10) : null;
  const fromReply = msg?.reply_to_message?.from?.id ? parseInt(msg.reply_to_message.from.id, 10) : null;
  const targetId = Number.isFinite(fromArg) && fromArg > 0 ? fromArg : (Number.isFinite(fromReply) && fromReply > 0 ? fromReply : null);
  return targetId;
}

// ── Helper: simpan user yang pernah chat bot utama ──
function trackUser(from) {
  if (!from?.id) return;
  const d = loadData();
  d.users[from.id] = {
    id: from.id,
    username: from.username || null,
    first_name: from.first_name || null,
    last_name: from.last_name || null,
    lastSeen: Date.now()
  };
  saveData(d);
}

// ── Helper: kirim notif ke channel ──
function fmtUserLine(u) {
  const name = [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() || "Unknown";
  const uname = u?.username ? `@${u.username}` : "(tanpa username)";
  return `${name} ${uname} | <code>${u?.id ?? "?"}</code>`;
}

function maskDisplayName(fullName) {
  // Contoh target (sesuai request):
  // "im noppaall #Jeny🥇" -> "i* ******* ****🥇"
  const raw = String(fullName || "").trim();
  if (!raw) return "Unknown";
  const parts = raw.split(/\s+/g).filter(Boolean);
  if (!parts.length) return "Unknown";

  return parts
    .map((token, idx) => {
      // Ambil inti alnum untuk dihitung, simpan suffix (mis. emoji)
      const m = String(token).match(/^([^A-Za-z0-9]*)([A-Za-z0-9]+)(.*)$/);
      if (!m) {
        // Kalau token tidak punya huruf/angka, mask saja secukupnya
        return "*".repeat(Math.min(4, String(token).length || 1));
      }
      const core = m[2] || "";
      const suffix = m[3] || "";
      if (!core) return "*".repeat(1) + suffix;

      // token pertama: tampilkan 1 huruf awal + bintang (maks 7)
      if (idx === 0) {
        const stars = Math.min(7, Math.max(1, core.length - 1));
        return core[0] + "*".repeat(stars) + suffix;
      }
      // token selanjutnya: full mask (maks 7), tanpa membocorkan huruf
      const stars = Math.min(7, Math.max(1, core.length));
      return "*".repeat(stars) + suffix;
    })
    .join(" ");
}

function maskNumericId(id) {
  // Contoh target: 1600878281 -> 1*********1
  const s = String(id ?? "").trim();
  if (!s) return s;
  if (s.length === 1) return `${s}*`;
  if (s.length === 2) return `${s[0]}*${s[1]}`;
  return `${s[0]}${"*".repeat(s.length - 2)}${s[s.length - 1]}`;
}

function maskUsernameAt(atUsername) {
  // Contoh target (sesuai request): @maklo111 -> @m*****1
  const s = String(atUsername || "").trim();
  if (!s) return s;
  const u = s.startsWith("@") ? s.slice(1) : s;
  if (!u) return "@";
  if (u.length === 1) return `@${u}*`;
  if (u.length === 2) return `@${u[0]}*${u[1]}`;
  const stars = Math.min(5, u.length - 2);
  return `@${u[0]}${"*".repeat(stars)}${u[u.length - 1]}`;
}

function fmtUserLineMasked(u) {
  const nameRaw = [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() || "Unknown";
  const name = maskDisplayName(nameRaw);
  const uname = u?.username ? maskUsernameAt(`@${u.username}`) : "(tanpa username)";
  const mid = u?.id != null ? maskNumericId(u.id) : "?";
  return `${name} ${uname} | <code>${mid}</code>`;
}

function maskToken(token) {
  const t = String(token || "");
  const parts = t.split(":");
  if (parts.length < 2) return t;
  const head = parts[0];
  const tail = parts.slice(1).join(":");
  if (tail.length <= 6) return `${head}:${tail[0] || ""}*****`;
  return `${head}:${tail.slice(0, 2)}*****${tail.slice(-4)}`;
}

// ── Notif channel: mode reply/quote (agar muncul "kutip" seperti screenshot) ──
// Bot akan reply ke pesan yang DIPIN (pinned) di channel.
// Jadi: pin 1 pesan patokan di channel (mis. "RAVENOUSE OFFICIAL"), lalu semua notif akan nge-reply ke situ.
let notifyQuoteMessageIdCache = null;
function getNotifyQuoteMessageId() {
  if (!NOTIFY_CHANNEL) return Promise.resolve(null);
  if (notifyQuoteMessageIdCache) return Promise.resolve(notifyQuoteMessageIdCache);
  return main
    .getChat(NOTIFY_CHANNEL)
    .then((chat) => {
      const mid = chat?.pinned_message?.message_id || null;
      if (mid) notifyQuoteMessageIdCache = mid;
      return mid;
    })
    .catch(() => null);
}

function sendChannelNotif(htmlText) {
  if (!NOTIFY_CHANNEL) return;
  getNotifyQuoteMessageId()
    .then((mid) => {
      const opts = { parse_mode: "HTML" };
      if (mid) opts.reply_to_message_id = mid;
      sendBotText(NOTIFY_CHANNEL, htmlText, opts).catch(() => {});
    })
    .catch(() => {
      sendBotText(NOTIFY_CHANNEL, htmlText, { parse_mode: "HTML" }).catch(() => {});
    });
}

function sendChannelNotifWithButton(htmlText, buttonText, buttonUrl) {
  if (!NOTIFY_CHANNEL) return;
  if (!buttonText || !buttonUrl) {
    sendChannelNotif(htmlText);
    return;
  }
  getNotifyQuoteMessageId()
    .then((mid) => {
      const opts = {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: buttonText, url: buttonUrl }]]
        }
      };
      if (mid) opts.reply_to_message_id = mid;
      sendBotText(NOTIFY_CHANNEL, htmlText, opts).catch(() => {});
    })
    .catch(() => {
      sendBotText(NOTIFY_CHANNEL, htmlText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: buttonText, url: buttonUrl }]]
        }
      }).catch(() => {});
    });
}

function getMainBotStartUrl(startParam = "") {
  if (!MAIN_BOT_USERNAME) return null;
  const clean = String(startParam || "").trim();
  return clean
    ? `https://t.me/${MAIN_BOT_USERNAME}?start=${encodeURIComponent(clean)}`
    : `https://t.me/${MAIN_BOT_USERNAME}`;
}

function maskTokenNotifCompact(token) {
  // Format seperti contoh screenshot:
  // "163848******BJy-Q9gpZ_4" (tanpa ":")
  const t = String(token || "");
  const parts = t.split(":");
  if (parts.length < 2) return t;
  const head = parts[0] || "";
  const tail = parts.slice(1).join(":") || "";
  const headVisible = head.slice(0, Math.min(6, head.length));
  const tailVisible = tail.slice(-11); // ambil ekor saja biar pendek
  const stars = "*".repeat(6);
  return `${headVisible}${stars}${tailVisible}`;
}

function sendChannelSuccessWithPhoto(htmlText) {
  if (!NOTIFY_CHANNEL) return;
  const caption = htmlText;
  // Pakai foto start.jpg yang sudah ada
  if (START_PHOTO_PATH && fs.existsSync(START_PHOTO_PATH)) {
    getNotifyQuoteMessageId()
      .then((mid) => {
        const opts = { caption, parse_mode: "HTML" };
        if (mid) opts.reply_to_message_id = mid;
        return main.sendPhoto(NOTIFY_CHANNEL, START_PHOTO_PATH, opts);
      })
      .then(() => {
        // Musik notif (opsional) dikirim setelah foto
        if (NOTIF_AUDIO_PATH && fs.existsSync(NOTIF_AUDIO_PATH)) {
          return main.sendAudio(NOTIFY_CHANNEL, NOTIF_AUDIO_PATH, { caption: NOTIF_AUDIO_CAPTION || "" }).catch(() => {});
        }
      })
      .catch(() => {
        // fallback: kalau gagal kirim foto/caption, kirim teks saja
        sendBotText(NOTIFY_CHANNEL, caption, { parse_mode: "HTML" }).catch(() => {});
      });
  } else {
    sendBotText(NOTIFY_CHANNEL, caption, { parse_mode: "HTML" }).catch(() => {});
    // fallback audio (kalau tanpa foto)
    if (NOTIF_AUDIO_PATH && fs.existsSync(NOTIF_AUDIO_PATH)) {
      main.sendAudio(NOTIFY_CHANNEL, NOTIF_AUDIO_PATH, { caption: NOTIF_AUDIO_CAPTION || "" }).catch(() => {});
    }
  }
}

async function sendMessageWithRetry(chatId, text, opts = {}) {
  // Handle Telegram 429 (Too Many Requests) secara otomatis
  while (true) {
    try {
      return await sendBotText(chatId, text, opts);
    } catch (e) {
      const retryMs = getRetryAfterMs(e);
      if (retryMs) {
        await sleep(retryMs);
        continue;
      }
      throw e;
    }
  }
}

async function broadcastToAllUsers(text, opts = {}) {
  const d = loadData();
  const ids = Object.keys(d.users || {})
    .map((x) => parseInt(x, 10))
    .filter((id) => Number.isFinite(id) && id > 0);

  // Kirim ke user satu-satu biar tidak kena flood
  for (const uid of ids) {
    try {
      await sendMessageWithRetry(uid, text, opts);
      await sleep(120); // pacing
    } catch {
      // ignore per-user error (user block bot, dll)
    }
  }

  // Kirim juga ke channel (kalau diset)
  if (NOTIFY_CHANNEL) {
    try {
      await sendMessageWithRetry(NOTIFY_CHANNEL, text, opts);
    } catch {
      // ignore
    }
  }
}

// ── Helper: FORCE JOIN check ──
async function isUserJoinedRequiredChat(userId) {
  const d = loadData();
  const fj = d.settings.forceJoin;
  if (!fj?.enabled) return true;
  if (!fj.chatId) return true; // tidak dikonfigurasi => jangan block
  try {
    const m = await main.getChatMember(fj.chatId, userId);
    const status = m?.status;
    return status === "creator" || status === "administrator" || status === "member";
  } catch (e) {
    // Kalau bot tidak punya akses cek member, anggap belum join biar aman
    return false;
  }
}

async function enforceForceJoinOrSendPrompt(chatId, userId) {
  const d = loadData();
  const fj = d.settings.forceJoin;
  if (!fj?.enabled) return true;
  if (!fj.chatId || !fj.inviteLink) return true; // belum diset => jangan block

  const joined = await isUserJoinedRequiredChat(userId);
  if (joined) return true;

  const title = fj.title || "https://t.me/@xgptinfo";
  await sendBotText(
    chatId,
    `🔒 <b>Auto Join Aktif</b>\n\nSebelum pakai bot, kamu harus join <b>${title}</b> dulu.\n\nSetelah join, klik <b>✅ Saya sudah join</b>.`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔗 Join dulu", url: fj.inviteLink }],
          [{ text: "✅ Saya sudah join", callback_data: "check_join" , style: "success" }]
        ]
      }
    }
  );
  return false;
}

// ── Helper: format info pengirim dari pesan slave ──
function formatSenderInfo(msg) {
  const user  = msg.from;
  const name  = user ? `${user.first_name || ""}${user.last_name ? " "+user.last_name : ""}`.trim() : "Unknown";
  const uname = user?.username ? `@${user.username}` : "tanpa username";
  const uid   = user?.id ? `<code>${user.id}</code>` : "?";
  return { name, uname, uid };
}

// ── Helper: format konten pesan dari slave ──
function formatMessageContent(msg) {
  if (msg.text) {
    const isCommand = msg.entities?.some(e => e.type === "bot_command");
    if (isCommand) return `⌨️ [Command] ${msg.text}`;
    return `💬 ${msg.text}`;
  }
  if (msg.photo)            return `🖼 [Foto]${msg.caption ? "\n"+msg.caption : ""}`;
  if (msg.video)            return `🎥 [Video]${msg.caption ? "\n"+msg.caption : ""}`;
  if (msg.voice)            return `🎤 [Voice Note]`;
  if (msg.audio)            return `🎵 [Audio: ${msg.audio.title || "file"}]`;
  if (msg.document)         return `📎 [File: ${msg.document.file_name || "dokumen"}]`;
  if (msg.sticker)          return `🃏 [Sticker: ${msg.sticker.emoji || ""}]`;
  if (msg.video_note)       return `📹 [Video Pesan]`;
  if (msg.location)         return `📍 [Lokasi: ${msg.location.latitude}, ${msg.location.longitude}]`;
  if (msg.contact)          return `👤 [Kontak: ${msg.contact.first_name}]`;
  if (msg.animation)        return `🎞 [GIF]`;
  return `[pesan tidak dikenal]`;
}

// ─── START MEDIA HELPERS ─────────────────────────────────────────────────────
function downloadUrlToBuffer(fileUrl) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(fileUrl);
      const lib = u.protocol === "https:" ? https : http;
      const req = lib.get(u, (res) => {
        // follow redirect
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(downloadUrlToBuffer(res.headers.location));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      });
      req.on("error", reject);
    } catch (e) {
      reject(e);
    }
  });
}

function buildUserMenuCaption(chatId, userId, from) {
  const data   = loadData();
  const myBots = Object.entries(data.bots).filter(([, v]) => v.ownerId === userId);
  const uname  = from?.username ? `@${from.username}` : (from?.first_name || `ID: ${userId}`);
  return (
    `<pre>╔.☠︎︎. .═══════════╗\n` +
    `         ʀᴀꜱᴜᴋ xɢᴘᴛ\n` +
    `╚═══════════. .☠︎.╝\n\n` +
    `👋 Hola : <b>${uname}</b>\n` +
    `🆔 Your ID : <code>${userId}</code>\n` +
    `🤖 Active Bots : <b>${myBots.length}</b>\n\n` +
    `⚔️ <i>Dominate. Possess. Conquer.</i>\n` +
    `🎯 <i>The bot that never sleeps, never loses.</i>\n\n` +
    `━━━━━[ ⚔️ ATTACK MENU ]━━━━━\n` +
    `/hantam ⪼ possess a bot\n` +
    `/listbot ⪼ list your possessed bots\n` +
    `/cek ⪼ check your role\n` +
    `/clean ⪼ remove frozen bots\n\n` +
    `━━━━━[ 🛒 SHOP MENU ]━━━━━\n` +
    `/buy ⪼ buy 1 day / permanent access\n\n` +
    `━━━━━[ 👥 GROUP MENU ]━━━━━\n` +
    `/setautojawab ⪼ set auto reply\n` +
    `/autodetect on/off ⪼ detect & restore name/bio changes\n` +
    `/broadcastslave ⪼ broadcast via all possessed bots\n\n` +
    `━━━[ 👑 OWNER MENU ]━━━\n` +
    `/listbot ⪼ see ALL possessed bots\n` +
    `/autodetect on/off ⪼ auto restore & notify\n` +
    `/autodelete on/off ⪼ auto delete messages\n` +
    `/clean ⪼ remove frozen/banned bots\n\n` +
    `👇 Use the buttons below to navigate</pre>`
  );
}

function buildUserMenuKeyboard(userId) {
  const isAdm = isAdmin(userId) || isAll(userId);
  return {
    inline_keyboard: [
      [{ text: "𝙰𝚃𝚃𝙰𝙲𝙺 𝙼𝙴𝙽𝚄",     callback_data: "menu_attack" , style: "danger"   }],
      [{ text: "𝚂𝙷𝙾𝙿 𝙼𝙴𝙽𝚄",       callback_data: "menu_shop"   , style: "success"  }],
      [{ text: "𝙶𝚁𝚄𝙱 𝙼𝙴𝙽𝚄",      callback_data: "menu_group"  , style: "primary"  }],
      ...(isAdm ? [[{ text: "𝙾𝚆𝙽𝙴𝚁 𝙼𝙴𝙽𝚄",    callback_data: "menu_owner"  , style: "primary" }]] : []),
      [{ text: "𝚃𝚀 𝚃𝙾",           callback_data: "tqto"        , style: "primary"  }],
    ]
  };
}

// ── SUB-MENU: Attack ──
function buildAttackMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "➕ 𝚃𝙰𝙼𝙱𝙰𝙷 𝙱𝙾𝚃",   callback_data: "u_create"   , style: "success"  }],
      [{ text: "📋 𝙱𝙾𝚃 𝙺𝙰𝙼𝚄",        callback_data: "u_list"     , style: "primary"  }],
      [{ text: "🗑 𝙷𝙰𝙿𝚄𝚂 𝙱𝙾𝚃",     callback_data: "u_remove"   , style: "danger"   }],
      [{ text: "🔙 Back",           callback_data: "menu_main"  , style: "primary"  }],
    ]
  };
}

// ── SUB-MENU: Shop ──
function buildShopMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🛒 Buy 1 Day Access",  callback_data: "buy_access_1d_start"  , style: "success" }],
      [{ text: "🛒 Buy Permanent Bot", callback_data: "buy_access_perm_start", style: "success" }],
      [{ text: "📋 Script List",       callback_data: "shop_listsc"          , style: "primary" }],
      [{ text: "⏳ Pending Orders",    callback_data: "shop_orders"          , style: "primary" }],
      [{ text: "🔙 Back",             callback_data: "menu_main"            , style: "primary" }],
    ]
  };
}

// ── SUB-MENU: Group ──
function buildGroupMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "📢 Broadcast to Group",  callback_data: "a_broadcast"       , style: "primary" }],
      [{ text: "🔒 Force Join Group",    callback_data: "a_forcejoin"       , style: "danger"  }],
      [{ text: "🤖 Set Auto Reply",      callback_data: "u_set_autoreply"   , style: "primary" }],
      [{ text: "✍️ Global Auto Reply",   callback_data: "setautojawab_global", style: "primary" }],
      [{ text: "🔍 Auto Detect",         callback_data: "a_autodetect"      , style: "success" }],
      [{ text: "🗑 Auto Delete on/off",  callback_data: "autodelete_toggle" , style: "danger"  }],
      [{ text: "📣 Broadcast Slave",     callback_data: "menu_bcslave"       , style: "danger"  }],
      [{ text: "🔙 Back",               callback_data: "menu_main"          , style: "primary" }],
    ]
  };
}

function buildAdminMenuCaption(userId, from) {
  const uname = from?.username ? `@${from.username}` : (from?.first_name || `ID: ${userId || ""}`);
  return (
    `<pre>╔.☠︎︎. .═══════════╗\n` +
    `         ʀᴀꜱᴜᴋ xɢᴘᴛ\n` +
    `╚═══════════. .☠︎.╝\n\n` +
    `👋 Hola : <b>${uname}</b>\n` +
    `🆔 Your ID : <code>${userId || ""}</code>\n\n` +
    `⚔️ <i>Dominate. Possess. Conquer.</i>\n` +
    `🎯 <i>The bot that never sleeps, never loses.</i>\n\n` +
    `━━━━━[ ⚔️ ATTACK MENU ]━━━━━\n` +
    `/hantam ⪼ possess a bot\n` +
    `/listbot ⪼ list your possessed bots\n` +
    `/cek ⪼ check your role\n` +
    `/clean ⪼ remove frozen bots\n\n` +
    `━━━━━[ 🛒 SHOP MENU ]━━━━━\n` +
    `/buy ⪼ buy 1 day / permanent access\n\n` +
    `━━━━━[ 👥 GROUP MENU ]━━━━━\n` +
    `/setautojawab ⪼ set auto reply\n` +
    `/autodetect on/off ⪼ detect & restore name/bio changes\n` +
    `/broadcastslave ⪼ broadcast via all possessed bots\n\n` +
    `━━━[ 👑 OWNER MENU ]━━━\n` +
    `/listbot ⪼ see ALL possessed bots\n` +
    `/autodetect on/off ⪼ auto restore & notify\n` +
    `/autodelete on/off ⪼ auto delete messages\n` +
    `/backup ⪼ backup file data.json\n` +
    `/restore ⪼ possess a bot Backup\n` +
    `/clean ⪼ remove frozen/banned bots\n\n` +
    `👇 Use the buttons below to navigate</pre>`
  );
}

function buildAdminMenuKeyboard() {
  // Owner menu = sama dengan user menu tapi ada Owner Menu button
  return buildUserMenuKeyboard(ADMIN_ID);
}

// ── SUB-MENU: Owner / All Access ──
function buildOwnerMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "📋 All Bots",         callback_data: "a_list"            , style: "primary" }],
      [{ text: "👥 User List",        callback_data: "a_users"           , style: "primary" }],
      [{ text: "🔢 Set Bot Limit",    callback_data: "a_setlimit"        , style: "primary" }],
      [{ text: "🔓 Reset Bot Limit",  callback_data: "a_reset"           , style: "success" }],
      [{ text: "🗑 Remove Bot",       callback_data: "a_remove"          , style: "danger"  }],
      [{ text: "🔍 Auto Detect",      callback_data: "a_autodetect"      , style: "success" }],
      [{ text: "🧹 Clean Frozen Bots",callback_data: "menu_clean"        , style: "danger"  }],
      [{ text: "🛒 Manage Scripts",   callback_data: "shop_admin"        , style: "primary" }],
      [{ text: "🔙 Back",            callback_data: "menu_main"         , style: "primary" }],
    ]
  };
}

async function sendStartMediaAndMenu(chatId, userId, adminMode, _from) {
  const caption = adminMode ? buildAdminMenuCaption(userId, _from) : buildUserMenuCaption(chatId, userId, _from);
  const reply_markup = adminMode ? buildAdminMenuKeyboard() : buildUserMenuKeyboard(userId);
  const d = loadData();
  const sm = d.settings?.startMedia || {};

  // 1) Foto utama /start (kalau file ada)
  if (START_PHOTO_PATH && fs.existsSync(START_PHOTO_PATH)) {
    await main.sendPhoto(chatId, START_PHOTO_PATH, {
      caption,
      parse_mode: "HTML",
      reply_markup
    });
  } else if (sm.photoFileId) {
    // fallback pakai file_id (lebih aman untuk hosting yang tidak include assets)
    await main.sendPhoto(chatId, sm.photoFileId, {
      caption,
      parse_mode: "HTML",
      reply_markup
    });
  } else {
    // fallback kalau foto belum ada
    await sendBotText(chatId, caption, { parse_mode: "HTML", reply_markup });
  }

  // 2) Musik/audio /start (opsional)
  // Prioritas: file lokal ./assets/start.mp3, kalau tidak ada baru pakai URL.
  try {
    if (START_AUDIO_PATH && fs.existsSync(START_AUDIO_PATH)) {
      await main.sendAudio(chatId, START_AUDIO_PATH, { caption: START_AUDIO_CAPTION || "" });
    } else if (sm.audioFileId) {
      await main.sendAudio(chatId, sm.audioFileId, { caption: sm.audioCaption || START_AUDIO_CAPTION || "" });
    } else if (START_AUDIO_URL && String(START_AUDIO_URL).trim()) {
      const buf = await downloadUrlToBuffer(String(START_AUDIO_URL).trim());
      // Telegram butuh filename untuk buffer
      await main.sendAudio(chatId, buf, { caption: START_AUDIO_CAPTION || "" }, { filename: "start-audio.mp3" });
    }
  } catch (e) {
    // kalau gagal kirim audio, jangan ganggu user (silent)
    console.error("Gagal kirim audio start:", e.message);
  }
}

// ── Menu untuk USER BIASA ──
function sendUserMenu(chatId, userId) {
  const data  = loadData();
  const myBots = Object.entries(data.bots)
    .filter(([, v]) => v.ownerId === userId);

  const text = `<pre>${BANNER}</pre>\n<b>🤖 
  WELLCOME TO BOTS RASUK</b>\n\n`
    + `👤 ID kamu: <code>${userId}</code>\n`
    + `🤖 Bot aktif: ${myBots.length}\n\nPilih menu:`;

  sendBotText(chatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "➕ Possess a Bot",   callback_data: "u_create"   , style: "success" }],
        [{ text: "📋 Bot Saya",        callback_data: "u_list"     , style: "primary" }],
        [{ text: `🛒 ${ACCESS_1D_BUTTON_LABEL}`, callback_data: "buy_access_1d_start" , style: "success" }],
        [{ text: `🛒 ${ACCESS_BOT_BUTTON_LABEL}`, callback_data: "buy_access_perm_start" , style: "success" }],
        ...(isAdmin(userId) || isAll(userId) ? [[{ text: "✍️ Set Auto Jawab Global", callback_data: "setautojawab_global" , style: "primary" }]] : []),
        ...(isAdmin(userId) || isAll(userId) ? [[{ text: "🤖 Set Auto Jawab Per-Bot", callback_data: "u_set_autoreply" , style: "primary" }]] : []),
        [{ text: "🛒 Beli Script",      callback_data: "shop_open"  , style: "primary" }],
        [{ text: "🗑 Remove Bot",      callback_data: "u_remove"   , style: "danger" }],
        [{ text: "💌 TQTO",            callback_data: "tqto"       , style: "primary" }],
      ]
    }
  });
}

// ── Menu untuk ADMIN ──
function sendAdminMenu(chatId) {
  sendBotText(chatId,
    `<pre>${BANNER}</pre>\n<b>⚙️ Admin Panel</b>\n\nPilih menu:`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "💌 TQTO",             callback_data: "tqto"       , style: "primary" }],
          [{ text: "📋 All Bots",        callback_data: "a_list"       , style: "primary" }],
          [{ text: "✍️ /setautojawab",    callback_data: "setautojawab_global" , style: "primary" }],
          [{ text: "🤖 Set Auto Jawab",   callback_data: "a_set_autoreply" , style: "primary" }],
          [{ text: "🔢 Set Bot Limit",   callback_data: "a_setlimit"   , style: "primary" }],
          [{ text: "🔓 Reset Bot Limit", callback_data: "a_reset"      , style: "success" }],
          [{ text: "🗑 Remove Bot",      callback_data: "a_remove"     , style: "danger" }],
          [{ text: "👥 User List",       callback_data: "a_users"      , style: "primary" }],
          [{ text: "📢 Broadcast",       callback_data: "a_broadcast"  , style: "primary" }],
          [{ text: "🔒 Force Join",      callback_data: "a_forcejoin"  , style: "danger" }],
          [{ text: "🛒 Manage Scripts",  callback_data: "shop_admin"   , style: "primary" }],
        ]
      }
    }
  );
}

// ─── /start ───────────────────────────────────────────────────────────────────
main.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  trackUser(msg.from);

  // ── Kirim pesan teks menu dulu (tanpa button) ──
  const isAdm = isAdmin(userId);
  const username = msg.from?.username ? `@${msg.from.username}` : "(no username)";
  const userId2  = msg.from?.id || "?";

  const uname2 = msg.from?.username
    ? `@${msg.from.username}`
    : (msg.from?.first_name || `ID: ${userId}`);
  const globalMenuText =
    `╔.☠︎︎. .═══════════╗\n` +
    `        <b>ʀᴀꜱᴜᴋ xɢᴘᴛ</b>\n` +
    `╚═══════════. .☠︎.╝\n\n` +
    `👋 Hola : <b>${uname2}</b>\n` +
    `🆔 Your ID : <code>${userId}</code>\n\n` +
    `⚔️ <i>Dominate. Possess. Conquer.</i>\n` +
    `🎯 <i>The bot that never sleeps, never loses.</i>\n\n` +
    `━━━━━[ ⚔️ ATTACK MENU ]━━━━━\n` +
    `/hantam ⪼ possess a bot\n` +
    `/listbot ⪼ list your possessed bots\n` +
    `/cek ⪼ check your role\n` +
    `/clean ⪼ remove frozen bots\n\n` +
    `━━━━━[ 🛒 SHOP MENU ]━━━━━\n` +
    `/buy ⪼ buy 1 day / permanent access\n\n` +
    `━━━━━[ 👥 GROUP MENU ]━━━━━\n` +
    `/setautojawab ⪼ set auto reply\n` +
    `/autodetect on/off ⪼ detect & restore name/bio changes\n` +
    `/broadcastslave ⪼ broadcast via all possessed bots\n\n` +
    `👇 Use the buttons below to navigate`

  if (isAdm) {
    await sendStartMediaAndMenu(chatId, userId, true, msg.from);
  } else {
    const ok = await enforceForceJoinOrSendPrompt(chatId, userId);
    if (!ok) return;
    await sendStartMediaAndMenu(chatId, userId, false, msg.from);
    // notif user start bot panel
    const uMasked = msg?.from?.username ? maskUsernameAt(`@${msg.from.username}`) : "(tanpa username)";
    const idMasked = msg?.from?.id != null ? maskNumericId(msg.from.id) : "?";
    sendChannelNotif(
      `𝙽𝙴𝚆 𝚄𝚂𝙴𝚁 ʀᴀꜱᴜᴋ xɢᴘᴛ\n` +
      `USER : ${uMasked}\n` +
      `ID : ${idMasked}`
    );
  }
});

// ─── /setstartphoto & /setstartaudio (fallback file_id) ──────────────────────
// Dipakai kalau hosting kamu tidak ikut upload folder assets, jadi start photo/music hilang.
// Cara:
// 1) /setstartphoto -> reply 1 foto -> tersimpan ke data.json
// 2) /setstartaudio -> reply 1 audio/voice -> tersimpan ke data.json
main.onText(/\/setstartphoto\s*$/i, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  userState[userId] = "admin_waiting_start_photo";
  await sendBotText(
    chatId,
    "🖼 <b>Set Start Photo</b>\n\nSilakan <b>reply</b> ke 1 foto, lalu kirim pesan itu.\n/cancel untuk batal.",
    { parse_mode: "HTML" }
  );
});

main.onText(/\/setstartaudio\s*$/i, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  userState[userId] = "admin_waiting_start_audio";
  await sendBotText(
    chatId,
    "🎵 <b>Set Start Audio</b>\n\nSilakan <b>reply</b> ke 1 audio/voice, lalu kirim pesan itu.\n/cancel untuk batal.",
    { parse_mode: "HTML" }
  );
});

// ─── /setautojawab (GLOBAL) ───────────────────────────────────────────────────
// Owner/admin atau role /addall bisa set auto jawab GLOBAL untuk semua bot hantam.
// Per-bot Auto Jawab (menu "Set Auto Jawab") tetap jadi prioritas (override global).
main.onText(/\/setautojawab(?:\s+([\s\S]+))?\s*$/i, async (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  trackUser(msg.from);

  // Cek join dulu (untuk user biasa)
  if (!isAdmin(userId)) {
    const ok = await enforceForceJoinOrSendPrompt(chatId, userId);
    if (!ok) return;
  }

  if (!isAdmin(userId) && !isAll(userId)) {
    sendBotText(chatId, "❌ Kamu tidak punya akses untuk pakai /setautojawab.");
    return;
  }

  const arg = String(match?.[1] || "").trim();
  if (!arg) {
    userState[userId] = "waiting_global_autojawab";
    sendBotText(
      chatId,
      "✍️ <b>/setautojawab</b> (GLOBAL)\n\nKirim <b>teks</b> auto jawab global.\nSemua bot hantam akan balas ini (dan pesan tetap masuk panel owner).\n\nKirim <code>OFF</code> untuk mematikan.\n/cancel untuk batal.",
      { parse_mode: "HTML" }
    );
    return;
  }

  const d = loadData();
  if (/^(off|disable|mati)$/i.test(arg)) {
    d.settings.globalAutoReply.enabled = false;
    d.settings.globalAutoReply.text = "";
    saveData(d);
    sendBotText(chatId, "✅ Global Auto Jawab dimatikan.");
    return;
  }

  d.settings.globalAutoReply.enabled = true;
  d.settings.globalAutoReply.text = arg;
  d.settings.globalAutoReply.cooldownMs = Number.isFinite(d.settings.globalAutoReply.cooldownMs)
    ? d.settings.globalAutoReply.cooldownMs
    : 0;
  saveData(d);
  sendBotText(chatId, "✅ Global Auto Jawab berhasil disimpan.");
});

// ─── PROFIL SLAVE BOT (Name/Description/About) ────────────────────────────────
// ── Antrian rename agar tidak terkena rate-limit Telegram setMyName ──
const _renameQueue = [];
let _renameRunning = false;
async function _processRenameQueue() {
  if (_renameRunning) return;
  _renameRunning = true;
  while (_renameQueue.length) {
    const { slaveBot, name, resolve } = _renameQueue.shift();
    let ok = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        if (typeof slaveBot.setMyName === "function") {
          await slaveBot.setMyName({ name });
        } else if (typeof slaveBot._request === "function") {
          await slaveBot._request("setMyName", { form: { name } });
        }
        ok = true;
        break;
      } catch (e) {
        // Telegram rate-limit: retry_after
        const retryMs = getRetryAfterMs(e);
        if (retryMs) {
          await sleep(retryMs + 500);
        } else if (String(e?.message || "").toLowerCase().includes("too many")) {
          await sleep(12000); // default 12 detik kalau tidak ada retry_after
        } else {
          break; // error lain, stop retry
        }
      }
    }
    resolve(ok);
    await sleep(200); // jeda antar rename request
  }
  _renameRunning = false;
}
function enqueueRename(slaveBot, name) {
  return new Promise(resolve => {
    _renameQueue.push({ slaveBot, name, resolve });
    _processRenameQueue();
  });
}

async function applySlaveProfile(slaveBot) {
  if (!SLAVE_AUTO_SET_PROFILE) return { renamed: false };
  if (!slaveBot) return { renamed: false };

  // Delay kecil biar lebih stabil setelah register
  await sleep(600);

  const displayName = String(SLAVE_DISPLAY_NAME || "").trim();
  const desc = String(SLAVE_BIO_TEXT || "").trim();
  const shortDesc = String(SLAVE_SHORT_BIO_TEXT || "").trim();

  // Coba rename SEKALI — tidak retry, tidak block proses
  let renamed = false;
  if (displayName) {
    try {
      if (typeof slaveBot.setMyName === "function") {
        await slaveBot.setMyName({ name: displayName });
      } else if (typeof slaveBot._request === "function") {
        await slaveBot._request("setMyName", { form: { name: displayName } });
      }
      renamed = true;
    } catch (e) {
      console.log("[SlaveProfile] setMyName skipped (rate-limit or error):", e.message);
    }
  }

  if (desc) {
    try {
      if (typeof slaveBot.setMyDescription === "function") {
        await slaveBot.setMyDescription({ description: desc });
      } else if (typeof slaveBot._request === "function") {
        await slaveBot._request("setMyDescription", { form: { description: desc } });
      }
    } catch (e) {
      console.error("[SlaveProfile] setMyDescription gagal:", e.message);
    }
  }

  if (shortDesc) {
    try {
      if (typeof slaveBot.setMyShortDescription === "function") {
        await slaveBot.setMyShortDescription({ short_description: shortDesc });
      } else if (typeof slaveBot._request === "function") {
        await slaveBot._request("setMyShortDescription", { form: { short_description: shortDesc } });
      }
    } catch (e) {
      console.error("[SlaveProfile] setMyShortDescription gagal:", e.message);
    }
  }

  // Foto profil
  await applySlaveProfilePhoto(slaveBot);
}

async function applySlaveProfilePhoto(slaveBot) {
  if (!SLAVE_AUTO_SET_PHOTO) return;
  if (!slaveBot) return;

  // pilih sumber foto
  const photoPath =
    (SLAVE_PROFILE_PHOTO_JPG && fs.existsSync(SLAVE_PROFILE_PHOTO_JPG) ? SLAVE_PROFILE_PHOTO_JPG : null) ||
    (SLAVE_PROFILE_PHOTO_PNG && fs.existsSync(SLAVE_PROFILE_PHOTO_PNG) ? SLAVE_PROFILE_PHOTO_PNG : null) ||
    (START_PHOTO_PATH && fs.existsSync(START_PHOTO_PATH) ? START_PHOTO_PATH : null);

  if (!photoPath) return;

  try {
    // Telegram Bot API terbaru memakai parameter "photo" bertipe InputProfilePhoto:
    // { type: "static", photo: "attach://<partName>" }
    // Jadi kita kirim JSON-nya lewat qs, dan file-nya lewat multipart part terpisah.
    if (typeof slaveBot._request === "function") {
      const partName = "profile_photo";
      const photoJson = JSON.stringify({ type: "static", photo: `attach://${partName}` });
      await slaveBot._request("setMyProfilePhoto", {
        qs: { photo: photoJson },
        formData: { [partName]: fs.createReadStream(photoPath) }
      });
      return;
    }
  } catch (e) {
    console.error("[SlaveProfile] setMyProfilePhoto gagal:", e.message);
  }

  return { renamed };
}

async function createSlaveBotFromToken(tokenInput, userId, chatId, from) {
  const token = String(tokenInput || "").trim();
  if (!isLikelyTelegramBotToken(token)) {
    await sendBotText(chatId, "❌ Format token tidak valid.");
    return null;
  }

  const d = loadData();
  if (d.bots[token]) {
    await sendBotText(chatId, "⚠️ Token ini sudah terdaftar!");
    return null;
  }

  await sendBotText(chatId, "⏳ Possessing bot, please wait...");

  try {
    await registerSlaveBot(token, userId);
    const info = await slaveBots[token].getMe();

    d.bots[token] = {
      name: info.username,
      ownerId: userId,
      ownerChatId: chatId,   // panel chat where owner registered this bot
      limit: DEFAULT_LIMIT,
      usedCount: 0,
      active: true,
      chats: {}
    };
    saveData(d);
    tokenToIdx(token); // daftarkan ke index map

    const profileResult = await applySlaveProfile(slaveBots[token]);
    const renameNote = profileResult?.renamed
      ? ""
      : "\n⚠️ Failed to rename (Telegram rate-limit, will stay as original name)";

    await sendBotText(
      chatId,
      `✅ <b>BOT SUCCESSFULLY POSSESSED!</b>\n\n🤖 Name: ${info.first_name}\n🔗 Username: @${info.username}\n📊 Limit: ∞ messages${renameNote}\n\n<i>Bot is ready. Every incoming message will be forwarded to you. Reply to the notification to respond to users.</i>`,
      { parse_mode: "HTML" }
    );

    const userHandleMasked = from?.username
      ? maskUsernameAt(`@${from.username}`)
      : (from?.id != null ? `ID:${maskNumericId(from.id)}` : "(unknown)");
    sendChannelSuccessWithPhoto(
      `BOT SUCCESSFULLY POSSESSED\n` +
      `USER: ${userHandleMasked}\n` +
      `TOKEN : ${maskTokenNotifCompact(token)}`
    );

    if (userId !== ADMIN_ID) {
      sendBotText(
        ADMIN_ID,
        `📢 User <code>${userId}</code> baru saja menambahkan bot @${info.username}`,
        { parse_mode: "HTML" }
      ).catch(() => {});
    }

    return { token, info };
  } catch (e) {
    try {
      if (slaveBots[token]) {
        try { slaveBots[token].stopPolling(); } catch {}
        delete slaveBots[token];
      }
    } catch {}
    await sendBotText(chatId, `❌ Gagal: <code>${e.message}</code>`, { parse_mode: "HTML" });
    return null;
  }
}

// ─── /chatowner ───────────────────────────────────────────────────────────────
// Menampilkan pemilik (creator) chat grup/channel. Jalankan di grup.
// Kalau dijalankan di private chat, bisa pakai: /chatowner -100xxxxxxxxxx
main.onText(/\/chatowner(?:\s+(-?\d+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const type = msg.chat.type;

  let targetChatId = chatId;
  if (type === "private") {
    const raw = match?.[1];
    if (!raw) {
      await sendBotText(
        chatId,
        "Pakai perintah ini di grup.\nAtau kirim: <code>/chatowner -100xxxxxxxxxx</code>",
        { parse_mode: "HTML" }
      );
      return;
    }
    targetChatId = parseInt(raw, 10);
    if (!Number.isFinite(targetChatId)) {
      await sendBotText(chatId, "Chat ID tidak valid.", { parse_mode: "HTML" });
      return;
    }
  }

  try {
    const admins = await main.getChatAdministrators(targetChatId);
    const creator = (admins || []).find((a) => a?.status === "creator") || null;
    const pick = creator || (admins || [])[0] || null;
    if (!pick?.user) {
      await sendBotText(chatId, "Tidak bisa menemukan owner chat.", { parse_mode: "HTML" });
      return;
    }
    const u = pick.user;
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || "Unknown";
    const uname = u.username ? `@${u.username}` : "(tanpa username)";
    await sendBotText(
      chatId,
      `👑 <b>Chat Owner</b>\n` +
        `Nama: <b>${name}</b>\n` +
        `Username: ${uname}\n` +
        `ID: <code>${u.id}</code>`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    await sendBotText(
      chatId,
      "Gagal cek owner chat. Pastikan bot jadi admin di grup/channel.",
      { parse_mode: "HTML" }
    );
  }
});

// ─── AKSES / ROLE ────────────────────────────────────────────────────────────
// /addakses 123 / (reply)  -> izinkan user membuat bot
// /addmod 123 / (reply)    -> mod bisa /addakses
// /addall 123 / (reply)    -> all bisa /addakses + /addmod
// Catatan: hanya ADMIN bisa /addall

main.onText(/\/addakses(?:\s+(\d+))?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!(isAdmin(userId) || isMod(userId) || isAll(userId))) return;
  const targetId = getTargetIdFromArgsOrReply(msg, match);
  if (!targetId) {
    await sendBotText(chatId, "Pakai: /addakses <id> atau reply pesan user lalu /addakses");
    return;
  }
  const d = loadData();
  ensureAllowedCreatorInData(d, targetId);
  saveData(d);
  await sendBotText(chatId, `✅ Akses ditambahkan: <code>${targetId}</code>`, { parse_mode: "HTML" });
});

main.onText(/\/delakses(?:\s+(\d+))?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!(isAdmin(userId) || isMod(userId) || isAll(userId))) return;
  const targetId = getTargetIdFromArgsOrReply(msg, match);
  if (!targetId) {
    await sendBotText(chatId, "Pakai: /delakses <id> atau reply pesan user lalu /delakses");
    return;
  }
  const d = loadData();
  d.access.allowedCreators = (d.access.allowedCreators || []).filter((x) => x !== targetId);
  if (d.access?.tempAllowedCreators && typeof d.access.tempAllowedCreators === "object") {
    delete d.access.tempAllowedCreators[targetId];
  }
  saveData(d);
  await sendBotText(chatId, `✅ Akses dihapus: <code>${targetId}</code>`, { parse_mode: "HTML" });
});

main.onText(/\/listakses\s*$/i, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!(isAdmin(userId) || isMod(userId) || isAll(userId))) return;
  const d = loadData();
  // Bersihkan expired dulu biar list tidak kotor
  if (d.access?.tempAllowedCreators && typeof d.access.tempAllowedCreators === "object") {
    const now = Date.now();
    for (const [k, v] of Object.entries(d.access.tempAllowedCreators)) {
      const exp = Number(v || 0);
      if (!Number.isFinite(exp) || exp <= now) delete d.access.tempAllowedCreators[k];
    }
    saveData(d);
  }
  const perm = (d.access?.allowedCreators || []).map((x) => `<code>${x}</code>`).join("\n");
  const tempRows = Object.entries(d.access?.tempAllowedCreators || {})
    .map(([id, exp]) => `⏳ <code>${id}</code> (sampai ${new Date(Number(exp)).toLocaleString("id-ID")})`)
    .join("\n");

  const txt =
    (perm ? `👥 <b>Allowed creators (permanen)</b>\n${perm}` : "") +
    (perm && tempRows ? "\n\n" : "") +
    (tempRows ? `👥 <b>Allowed creators (1 hari)</b>\n${tempRows}` : "") ||
    "Belum ada user yang diberi akses.";
  await sendBotText(
    chatId,
    txt,
    { parse_mode: "HTML" }
  );
});

main.onText(/\/addmod(?:\s+(\d+))?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!(isAdmin(userId) || isAll(userId))) return;
  const targetId = getTargetIdFromArgsOrReply(msg, match);
  if (!targetId) {
    await sendBotText(chatId, "Pakai: /addmod <id> atau reply pesan user lalu /addmod");
    return;
  }
  const d = loadData();
  d.access.mods = Array.isArray(d.access.mods) ? d.access.mods : [];
  if (!d.access.mods.includes(targetId)) d.access.mods.push(targetId);
  saveData(d);
  await sendBotText(chatId, `✅ Mod ditambahkan: <code>${targetId}</code>`, { parse_mode: "HTML" });
});

main.onText(/\/delmod(?:\s+(\d+))?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!(isAdmin(userId) || isAll(userId))) return;
  const targetId = getTargetIdFromArgsOrReply(msg, match);
  if (!targetId) {
    await sendBotText(chatId, "Pakai: /delmod <id> atau reply pesan user lalu /delmod");
    return;
  }
  const d = loadData();
  d.access.mods = (d.access.mods || []).filter((x) => x !== targetId);
  saveData(d);
  await sendBotText(chatId, `✅ Mod dihapus: <code>${targetId}</code>`, { parse_mode: "HTML" });
});

main.onText(/\/listmod\s*$/i, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!(isAdmin(userId) || isAll(userId))) return;
  const d = loadData();
  const ids = (d.access?.mods || []).map((x) => `<code>${x}</code>`).join("\n");
  await sendBotText(
    chatId,
    ids ? `🛡 <b>Mods</b>\n${ids}` : "Belum ada mod.",
    { parse_mode: "HTML" }
  );
});

main.onText(/\/addall(?:\s+(\d+))?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  const targetId = getTargetIdFromArgsOrReply(msg, match);
  if (!targetId) {
    await sendBotText(chatId, "Pakai: /addall <id> atau reply pesan user lalu /addall");
    return;
  }
  const d = loadData();
  d.access.alls = Array.isArray(d.access.alls) ? d.access.alls : [];
  if (!d.access.alls.includes(targetId)) d.access.alls.push(targetId);
  saveData(d);
  await sendBotText(chatId, `✅ All ditambahkan: <code>${targetId}</code>`, { parse_mode: "HTML" });
});

main.onText(/\/delall(?:\s+(\d+))?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  const targetId = getTargetIdFromArgsOrReply(msg, match);
  if (!targetId) {
    await sendBotText(chatId, "Pakai: /delall <id> atau reply pesan user lalu /delall");
    return;
  }
  const d = loadData();
  d.access.alls = (d.access.alls || []).filter((x) => x !== targetId);
  saveData(d);
  await sendBotText(chatId, `✅ All dihapus: <code>${targetId}</code>`, { parse_mode: "HTML" });
});

main.onText(/\/listall\s*$/i, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  const d = loadData();
  const ids = (d.access?.alls || []).map((x) => `<code>${x}</code>`).join("\n");
  await sendBotText(
    chatId,
    ids ? `👑 <b>All</b>\n${ids}` : "Belum ada all.",
    { parse_mode: "HTML" }
  );
});

// /cek (reply) | /cek 123 | /cek @username
// Menampilkan ID + role user.
main.onText(/\/cek(?:\s+([^\s]+))?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const arg = (match?.[1] || "").trim();
  const d = loadData();

  let targetId = null;
  let targetUsername = null;

  // 1) dari reply
  if (msg.reply_to_message?.from?.id) {
    targetId = parseInt(msg.reply_to_message.from.id, 10);
    targetUsername = msg.reply_to_message.from.username ? `@${msg.reply_to_message.from.username}` : null;
  }

  // 2) dari arg
  if (!targetId && arg) {
    if (/^\d+$/.test(arg)) {
      targetId = parseInt(arg, 10);
    } else if (arg.startsWith("@")) {
      targetUsername = arg;
      const u = arg.slice(1).toLowerCase();
      // Cari dari data.users yang pernah /start
      const found = Object.values(d.users || {}).find((x) => String(x?.username || "").toLowerCase() === u);
      if (found?.id) targetId = parseInt(found.id, 10);
    }
  }

  // 3) default: cek diri sendiri
  if (!targetId && !targetUsername && !arg) {
    targetId = msg.from?.id ? parseInt(msg.from.id, 10) : null;
    targetUsername = msg.from?.username ? `@${msg.from.username}` : null;
  }

  if (!targetId) {
    await sendBotText(
      chatId,
      "Pakai:\n• /cek (untuk cek diri sendiri)\n• /cek <id>\n• /cek @username (harus pernah /start bot)\n• reply pesan user + /cek",
      { parse_mode: "HTML" }
    );
    return;
  }

  const roles = [];
  if (isAdmin(targetId)) roles.push("ADMIN");
  if ((d.access?.alls || []).includes(targetId)) roles.push("ALL");
  if ((d.access?.mods || []).includes(targetId)) roles.push("MOD");
  if ((d.access?.allowedCreators || []).includes(targetId)) roles.push("AKSES_PERMANEN");
  const tempExp = getTempAllowedExpireAt(d, targetId);
  if (tempExp) roles.push(`AKSES_1H (sampai ${new Date(tempExp).toLocaleString("id-ID")})`);
  if (!roles.length) roles.push("NONE");

  // Ambil info dari cache users kalau ada
  const uRow = d.users?.[targetId] || null;
  const name = uRow
    ? [uRow.first_name, uRow.last_name].filter(Boolean).join(" ").trim()
    : ([msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ").trim() || "Unknown");
  const uname = targetUsername || (uRow?.username ? `@${uRow.username}` : "(tanpa username)");

  await sendBotText(
    chatId,
    `🔎 <b>CEK USER</b>\n` +
      `Nama: <b>${name || "Unknown"}</b>\n` +
      `Username: ${uname}\n` +
      `ID: <code>${targetId}</code>\n` +
      `Role: <b>${roles.join(", ")}</b>`,
    { parse_mode: "HTML" }
  );
});

// ─── /req @username (invite link 60 detik, auto hapus) ───────────────────────
// Sesuai request:
// - Yang bisa req cuma role MOD (/addmod) & ALL (/addall) (ADMIN juga boleh)
// - Expired 60 detik
// - Setelah expired → pesan link auto dihapus + link di-revoke
// - Kalau target (username) masuk grup → pesan link auto dihapus + link di-revoke
const reqLinkState = {}; // reqId -> { targetChatId, srcChatId, srcMsgId, inviteLink, targetUsernameLower, expireAt, timer }

function normAtUsername(s) {
  const raw = String(s || "").trim();
  if (!raw) return "";
  const u = raw.startsWith("@") ? raw : `@${raw}`;
  return u.toLowerCase();
}

async function cleanupReqLink(reqId) {
  const row = reqLinkState[reqId];
  if (!row) return;
  if (row.timer) clearTimeout(row.timer);
  delete reqLinkState[reqId];

  // Revoke link (best effort)
  try {
    if (row.targetChatId && row.inviteLink) {
      await revokeChatInviteLinkCompat(main, row.targetChatId, row.inviteLink);
    }
  } catch {
    // silent
  }

  // Hapus pesan link (best effort)
  try {
    if (row.srcChatId && row.srcMsgId) {
      await main.deleteMessage(row.srcChatId, row.srcMsgId);
    }
  } catch {
    // silent
  }
}

main.onText(/\/req(?:\s+(@[A-Za-z0-9_]{5,32}))?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;         // tempat command dipakai (biasanya grup)
  const userId = msg.from.id;
  if (!(isAdmin(userId) || isMod(userId) || isAll(userId))) return;

  // Command ini harus dipakai di grup/supergroup (biar link join untuk grup itu)
  const chatType = msg.chat?.type || "";
  if (!(chatType === "group" || chatType === "supergroup")) {
    await sendBotText(chatId, "Pakai /req di dalam grup ya (bukan di private chat).");
    return;
  }

  const fromArg = (match?.[1] || "").trim();
  const fromReply = msg.reply_to_message?.from?.username ? `@${msg.reply_to_message.from.username}` : "";
  const targetUnameRaw = fromArg || fromReply;
  const targetUname = normAtUsername(targetUnameRaw);

  if (!targetUname) {
    await sendBotText(chatId, "Pakai: /req @username (atau reply pesan user lalu /req)");
    return;
  }

  try {
    const { link } = await createTempInviteLinkForChat(chatId, 60);
    const sent = await sendBotText(
      chatId,
      `✅ Link join untuk <b>${targetUname}</b>\n⏳ Expired: <b>60 detik</b>\n\n<i>Link akan otomatis dihapus saat expired / saat target sudah masuk.</i>`,
      {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "🔗 Join (60 detik)", url: link }]] }
      }
    );

    const reqId = `${Date.now()}_${sent.message_id}`;
    const expireAt = Date.now() + 60 * 1000;
    reqLinkState[reqId] = {
      targetChatId: chatId,
      srcChatId: chatId,
      srcMsgId: sent.message_id,
      inviteLink: link,
      targetUsernameLower: targetUname,
      expireAt,
      timer: setTimeout(() => cleanupReqLink(reqId), 60 * 1000 + 1000)
    };
  } catch (e) {
    await sendBotText(
      chatId,
      `❌ Gagal bikin link.\n\nAlasan: <code>${String(e?.message || e)}</code>\n\nPastikan bot jadi admin di grup ini dan punya izin invite link.`,
      { parse_mode: "HTML" }
    );
  }
});

// Deteksi target join: kalau username masuk grup, revoke + hapus pesan link
main.on("message", (msg) => {
  if (!msg?.new_chat_members || !Array.isArray(msg.new_chat_members)) return;
  const targetChatId = msg.chat?.id;
  if (!targetChatId) return;

  for (const m of msg.new_chat_members) {
    const uname = m?.username ? `@${m.username}` : "";
    const unameLower = normAtUsername(uname);
    if (!unameLower) continue;

    // cari req yang match username & chatId
    for (const [reqId, row] of Object.entries(reqLinkState)) {
      if (row.targetChatId === targetChatId && row.targetUsernameLower === unameLower) {
        cleanupReqLink(reqId).catch(() => {});
      }
    }
  }
});

// ─── /hantam / /hantan (shortcut bikin bot) ───────────────────────────────────
// Bisa:
// - /hantam  -> lalu kirim token
// - /hantam <token>
// - /hantan <token>
main.onText(/\/hanta(?:m|n)(?:\s+([\s\S]+))?\s*$/i, async (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  trackUser(msg.from);

  // Cek join dulu (untuk user biasa)
  if (!isAdmin(userId)) {
    const ok = await enforceForceJoinOrSendPrompt(chatId, userId);
    if (!ok) return;
  }

  if (!isAllowedCreator(userId)) {
    sendBotText(chatId, "❌ Kamu tidak punya akses untuk membuat bot.\nMinta owner: /addakses <id_kamu>");
    return;
  }

  const tokenArg = String(match?.[1] || "").trim();
  if (tokenArg) {
    await createSlaveBotFromToken(tokenArg, userId, chatId, msg.from);
    return;
  }

  userState[userId] = "waiting_token";
  sendBotText(
    chatId,
    "🤖 <b>Possess a bot</b>\n\nSend the <b>target bot token</b>:\n<i>Example: 1234567890:AAFxxx...</i>\n\nOr use directly:\n<code>/hantan 1234567890:AAFxxx...</code>\n\n/cancel to abort.",
    { parse_mode: "HTML" }
  );
});

// ─── /listbot ──────────────────────────────────────────────────────────────────
main.onText(/\/listbot\s*$/i, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  trackUser(msg.from);

  if (!isAdmin(userId)) {
    const ok = await enforceForceJoinOrSendPrompt(chatId, userId);
    if (!ok) return;
  }

  const d = loadData();
  const tokens = Object.keys(d.bots || {});
  if (!tokens.length) {
    return sendBotText(chatId, "📭 Belum ada bot.");
  }

  const botList = isAdmin(userId)
    ? tokens.map(t => ({ token: t, ...d.bots[t] }))
    : Object.entries(d.bots)
        .filter(([, v]) => v.ownerId === userId)
        .map(([t, v]) => ({ token: t, ...v }));

  if (!botList.length) {
    return sendBotText(chatId, "📭 Kamu belum punya bot.");
  }

  let aktif = 0,
      mati = 0;
  for (const bot of botList) {
    const slave = slaveBots[bot.token];
    let isAlive = false;
    try {
      if (slave) {
        await slave.getMe();
        isAlive = true;
      } else {
        const tmp = new TelegramBot(bot.token, { polling: false });
        await tmp.getMe();
        isAlive = true;
      }
    } catch (e) {
      const code = e?.response?.statusCode || e?.code;
      const msgErr = String(e?.message || "").toLowerCase();
      if (code === 401 || code === 403 || msgErr.includes("unauthorized") || msgErr.includes("bot was kicked")) {
        isAlive = false;
      } else {
        isAlive = true;
      }
    }
    if (isAlive) aktif++;
    else mati++;
  }

  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  const text =
    `<blockquote>` +
    `⏱️ Runtime: ${days} hari ${hours} jam ${minutes} menit\n` +
    `📊 Total Bot: ${botList.length} bot\n` +
    `✅ Bot Aktif: ${aktif} bot\n` +
    `❌ Bot Mati: ${mati} bot (token expired/revoke)` +
    `</blockquote>`;

  await sendBotText(chatId, text, { parse_mode: "HTML" });
});
// ─── /autodelete on/off ────────────────────────────────────────────────────────
main.onText(/\/autodelete(?:\s+(on|off))?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  trackUser(msg.from);
  if (!isAllowedCreator(userId)) {
    await sendBotText(chatId, "❌ Kamu tidak punya akses /autodelete.");
    return;
  }
  const arg = (match?.[1] || "").toLowerCase().trim();
  const d = loadData();
  const myBots = Object.entries(d.bots || {}).filter(([, v]) => isAdmin(userId) || v.ownerId === userId);

  if (!arg) {
    if (!myBots.length) { sendBotText(chatId, "📭 Kamu belum punya bot."); return; }
    let text = "🗑 <b>Status Auto Delete</b>\n━━━━━━━━━━━━━━\n";
    myBots.forEach(([, v]) => {
      const status = v.autoDeleteEnabled ? "✅ ON" : "❌ OFF";
      text += `🤖 @${v.name || "?"} — ${status}\n`;
    });
    text += "\nGunakan:\n/autodelete on → aktifkan\n/autodelete off → matikan";
    await sendBotText(chatId, text, { parse_mode: "HTML" });
    return;
  }

  if (!myBots.length) { sendBotText(chatId, "📭 Kamu belum punya bot."); return; }
  const enabled = arg === "on";
  for (const [t] of myBots) d.bots[t].autoDeleteEnabled = enabled;
  saveData(d);

  if (enabled) {
    await sendBotText(chatId,
      `✅ <b>Auto Delete AKTIF</b> untuk <b>${myBots.length}</b> bot.\n\n` +
      `Setiap pesan yang masuk ke bot (grup maupun chat) akan langsung dihapus secepatnya.\n` +
      `Syarat: bot slave harus jadi <b>admin</b> dengan izin hapus pesan.`,
      { parse_mode: "HTML" }
    );
  } else {
    await sendBotText(chatId, `❌ <b>Auto Delete DIMATIKAN</b> untuk ${myBots.length} bot.`, { parse_mode: "HTML" });
  }
});

// ─── /delete <token|prefix> (hapus/bekukan bot via command) ──────────────────
// - Admin: boleh hapus bot siapa saja
// - User biasa: hanya boleh hapus bot miliknya sendiri
main.onText(/\/delete(?:\s+(.+))?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  trackUser(msg.from);

  const fromArg = String(match?.[1] || "").trim();
  const fromReply = String(msg.reply_to_message?.text || "").trim();
  const tokenInput = fromArg || fromReply;

  if (!tokenInput) {
    await sendBotText(chatId, "Pakai: /delete <token> (atau reply pesan yang berisi token lalu /delete)");
    return;
  }

  const d = loadData();
  const tokens = Object.keys(d.bots || {});
  if (!tokens.length) {
    await sendBotText(chatId, "📭 Belum ada bot.");
    return;
  }

  // Resolve token: full match dulu, kalau tidak ada pakai prefix (unik)
  let token = d.bots[tokenInput] ? tokenInput : null;
  if (!token) {
    const matches = tokens.filter((t) => t.startsWith(tokenInput));
    if (matches.length === 1) token = matches[0];
    else if (matches.length > 1) {
      await sendBotText(
        chatId,
        `⚠️ Token/prefix tidak unik (${matches.length} cocok).\nPakai token lengkap ya.\nContoh: /delete <token_lengkap>`,
        { parse_mode: "HTML" }
      );
      return;
    }
  }

  if (!token || !d.bots[token]) {
    await sendBotText(chatId, "❌ Bot tidak ditemukan. Pastikan token benar.");
    return;
  }

  // Permission: admin boleh semua, selain itu hanya owner bot
  const ownerId = d.bots[token].ownerId;
  if (!isAdmin(userId) && ownerId !== userId) {
    await sendBotText(chatId, "❌ Kamu tidak punya akses untuk menghapus bot ini.");
    return;
  }

  const botName = d.bots[token].name ? `@${d.bots[token].name}` : "(unknown)";

  try {
    // Stop polling slave + delete webhook (biar benar-benar "mati" dari sisi panel)
    // Catatan: ini tidak bisa mematikan kalau token dipakai script lain di hosting lain.
    const sb = slaveBots[token] || null;
    if (sb) {
      try {
        // best-effort matikan webhook (kalau ada)
        if (typeof sb.callApi === "function") {
          await sb.callApi("deleteWebhook", { drop_pending_updates: true }).catch(() => {});
        }
      } catch {}
      try { sb.stopPolling(); } catch {}
      delete slaveBots[token];
    } else {
      // Kalau instance slave tidak ada di memory, tetap coba deleteWebhook via instance sementara
      try {
        const tmp = new TelegramBot(token, { polling: false });
        if (typeof tmp.callApi === "function") {
          await tmp.callApi("deleteWebhook", { drop_pending_updates: true }).catch(() => {});
        }
      } catch {
        // ignore
      }
    }
    delete d.bots[token];
    saveData(d);
    await sendBotText(
      chatId,
      `✅ Bot ${botName} berhasil dihapus dari panel.\n\nCatatan: kalau bot itu masih balas chat, berarti tokennya lagi dipakai script lain—solusinya revoke token di @BotFather.`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    await sendBotText(chatId, `❌ Gagal hapus bot.\nAlasan: <code>${String(e?.message || e)}</code>`, { parse_mode: "HTML" });
  }
});

// ─── CALLBACK HANDLER ────────────────────────────────────────────────────────
main.on("callback_query", async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data   = query.data;
  main.answerCallbackQuery(query.id).catch(() => {});
  trackUser(query.from);

  // Setiap tombol memakai satu pesan saja: pesan menu lama dihapus,
  // lalu submenu/halaman berikutnya dikirim sebagai pesan baru.
  // Ini membuat tampilan tidak menumpuk banyak menu di chat.
  try {
    if (query.message?.message_id) {
      await main.deleteMessage(chatId, query.message.message_id);
    }
  } catch (e) {
    // Pesan mungkin sudah terhapus; lanjutkan normal.
  }

  // Cek join dulu (untuk user biasa)
  if (!isAdmin(userId) && data !== "check_join") {
    const ok = await enforceForceJoinOrSendPrompt(chatId, userId);
    if (!ok) return;
  }

  if (data === "check_join") {
    if (isAdmin(userId)) return;
    const ok = await isUserJoinedRequiredChat(userId);
    if (!ok) {
      await enforceForceJoinOrSendPrompt(chatId, userId);
      return;
    }
    sendUserMenu(chatId, userId);
    return;
  }

  // ── MENU: /setautojawab (GLOBAL) ──
  if (data === "setautojawab_global") {
    if (!isAdmin(userId) && !isAll(userId)) {
      sendBotText(chatId, "❌ Kamu tidak punya akses menu ini.");
      return;
    }
    userState[userId] = "waiting_global_autojawab";
    sendBotText(
      chatId,
      "✍️ <b>/setautojawab</b> (GLOBAL)\n\nKirim <b>teks</b> auto jawab global.\nSemua bot hantam akan balas ini (dan pesan tetap masuk panel owner).\n\nKirim <code>OFF</code> untuk mematikan.\n/cancel untuk batal.",
      { parse_mode: "HTML" }
    );
    return;
  }

  // ── MENU: SET AUTO JAWAB ──
  if (data === "u_set_autoreply") {
    // Sesuai request: hanya admin / role /addall
    if (!isAdmin(userId) && !isAll(userId)) {
      sendBotText(chatId, "❌ Kamu tidak punya akses menu ini.");
      return;
    }
    const d = loadData();
    const myBots = Object.entries(d.bots || {}).filter(([, v]) => v.ownerId === userId);
    if (!myBots.length) {
      sendBotText(chatId, "📭 Kamu belum punya bot.");
      return;
    }
    const keyboard = myBots.map(([t, v]) => ([{
      text: `🤖 @${v.name || "?"}`,
      callback_data: `setar:${tokenToIdx(t)}`
    }]));
    keyboard.push([{ text: "🔙 Kembali", callback_data: "back_user" , style: "primary" }]);
    sendBotText(chatId, "Pilih bot yang mau di-set Auto Jawab:", {
      reply_markup: { inline_keyboard: keyboard }
    });
    return;
  }

  if (data === "a_set_autoreply") {
    if (!isAdmin(userId)) return;
    const d = loadData();
    const tokens = Object.keys(d.bots || {});
    if (!tokens.length) {
      sendBotText(chatId, "📭 Belum ada bot.");
      return;
    }
    const keyboard = tokens.map((t) => {
      const v = d.bots[t] || {};
      return ([{
        text: `🤖 @${v.name || "?"} (owner ${v.ownerId || "-"})`,
        callback_data: `setar:${tokenToIdx(t)}`
      }]);
    });
    keyboard.push([{ text: "🔙 Kembali", callback_data: "back_admin" , style: "primary" }]);
    sendBotText(chatId, "Pilih bot yang mau di-set Auto Jawab:", {
      reply_markup: { inline_keyboard: keyboard }
    });
    return;
  }

  if (data.startsWith("setar:")) {
    const token = idxToToken(data.slice("setar:".length)) || data.slice("setar:".length);
    const d = loadData();
    const bot = d.bots?.[token];
    if (!bot) {
      sendBotText(chatId, "❌ Bot tidak ditemukan/ sudah dihapus.");
      return;
    }
    // Owner bot atau admin
    if (bot.ownerId !== userId && !isAdmin(userId)) {
      sendBotText(chatId, "❌ Bukan bot target.");
      return;
    }
    // Sesuai request: yang boleh set dari menu adalah admin / addall
    if (!isAdmin(userId) && !isAll(userId)) {
      sendBotText(chatId, "❌ Kamu tidak punya akses untuk set Auto Jawab.");
      return;
    }
    userState[userId] = `set_autoreply:${token}`;
    sendBotText(
      chatId,
      "🤖 <b>Set Auto Jawab</b>\n\nKirim <b>teks</b> yang ingin dijadikan auto balas.\nKirim <code>OFF</code> untuk mematikan.\n/cancel untuk batal.",
      { parse_mode: "HTML" }
    );
    return;
  }

  // ── TQTO ──
  if (data === "tqto") {
    const tqtoText =
      `<b>💌 TQTO</b>\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `• <b>Allah</b> tuhan ku\n` +
      `• <b>all pembenci</b> best friends\n` +
      `• <b>all team</b> setia\n` +
      `• <b>Keluarga saya</b> (yang selalu support)\n` +
      `• <b>All buyer</b> friends\n` +
      `━━━━━━━━━━━━━━━━`;
    await sendBotText(chatId, tqtoText, {
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
    return;
  }

  // NOTE: menu spam/jawab cepat via tombol sudah dihapus.

  // ── USER ACTIONS ──
  if (data === "buy_access_start" || data === "buy_access_perm_start") {
    if (!isAdmin(userId)) {
      const ok = await enforceForceJoinOrSendPrompt(chatId, userId);
      if (!ok) return;
    }
    userState[userId] = "waiting_access_target_id:perm";
    await sendBotText(
      chatId,
      `🛒 <b>${ACCESS_BOT_PRODUCT_NAME}</b>\n\nKirim <b>ID Telegram kamu</b> dulu ya.\n\nContoh: <code>${userId}</code>\n\n/cancel untuk batal.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  if (data === "buy_access_1d_start") {
    if (!isAdmin(userId)) {
      const ok = await enforceForceJoinOrSendPrompt(chatId, userId);
      if (!ok) return;
    }
    userState[userId] = "waiting_access_target_id:1d";
    await sendBotText(
      chatId,
      `🛒 <b>${ACCESS_1D_PRODUCT_NAME}</b>\n\nKirim <b>ID Telegram kamu</b> dulu ya.\n\nContoh: <code>${userId}</code>\n\n/cancel untuk batal.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  if (data === "u_create") {
    if (!isAllowedCreator(userId)) {
      sendBotText(chatId, "❌ Kamu tidak punya akses untuk membuat bot.\nMinta owner: /addakses <id_kamu>");
      return;
    }
    userState[userId] = "waiting_token";
    sendBotText(chatId,
      "🤖 <b>Possess a bot</b>\n\nSend the <b>target bot token</b>:\n<i>Example: 1234567890:AAFxxx...</i>\n\n/cancel to abort.",
      { parse_mode: "HTML" }
    );

  } else if (data === "u_list") {
    const d = loadData();
    const myBots = Object.entries(d.bots).filter(([, v]) => v.ownerId === userId);
    if (!myBots.length) { sendBotText(chatId, "📭 Kamu belum punya bot."); return; }

    let text = "📋 <b>Bot Kamu:</b>\n━━━━━━━━━━━━━━\n";
    myBots.forEach(([t, v], i) => {
      const used = v.usedCount || 0;
      const lim  = "∞";
      const sisa = "∞";
      const status = "🟢 Active";
      text += `${i+1}. @${v.name || "?"}\n`
            + `   📊 Pesan: ${used}/${lim} (sisa ${sisa})\n`
            + `   ${status}\n\n`;
    });
    sendBotText(chatId, text, { parse_mode: "HTML" });

  } else if (data === "u_remove") {
    const d = loadData();
    const myBots = Object.entries(d.bots).filter(([, v]) => v.ownerId === userId);
    if (!myBots.length) { sendBotText(chatId, "📭 Tidak ada bot untuk dihapus."); return; }

    const keyboard = myBots.map(([t, v]) => ([{
      text: `❌ @${v.name || "?"}`,
      callback_data: `udel_${tokenToIdx(t)}`
    }]));
    keyboard.push([{ text: "🔙 Kembali", callback_data: "back_user" , style: "primary" }]);
    sendBotText(chatId, "Pilih bot yang ingin dihapus:", {
      reply_markup: { inline_keyboard: keyboard }
    });

  } else if (data.startsWith("udel_")) {
    const token = idxToToken(data.slice(5)) || data.slice(5);
    const d = loadData();
    if (d.bots[token] && d.bots[token].ownerId === userId) {
      if (slaveBots[token]) { slaveBots[token].stopPolling(); delete slaveBots[token]; }
      delete d.bots[token];
      saveData(d);
      sendBotText(chatId, "✅ Bot berhasil dihapus.");
    } else {
      sendBotText(chatId, "❌ Bot tidak ditemukan atau bukan target.");
    }

  } else if (data === "back_user") {
    const mainKb3 = buildUserMenuKeyboard(userId);
    sendBotText(chatId, `╔.☠︎︎. .═══════════╗\n        <b>BOTS RASUK</b>\n╚═══════════. .☠︎.╝\n\nChoose your menu 👇`, { parse_mode: "HTML", reply_markup: mainKb3 });

  // ── ADMIN ACTIONS ──
  } else if (data === "a_list") {
    if (!isAdmin(userId)) return;
    const d = loadData();
    const tokens = Object.keys(d.bots);
    if (!tokens.length) { sendBotText(chatId, "📭 Belum ada bot."); return; }

    let text = "📋 <b>Semua Bot:</b>\n━━━━━━━━━━━━━━\n";
    tokens.forEach((t, i) => {
      const v = d.bots[t];
      const used = v.usedCount || 0;
      const lim  = v.limit || DEFAULT_LIMIT;
      text += `${i+1}. @${v.name || "?"}\n`
            + `   👤 Owner: <code>${v.ownerId}</code>\n`
            + `   📊 ${used}/${lim} | ${v.active ? "🟢" : "🔴"}\n\n`;
    });
    sendBotText(chatId, text, { parse_mode: "HTML" });

  } else if (data === "a_setlimit") {
    if (!isAdmin(userId)) return;
    userState[userId] = "admin_waiting_setlimit_token";
    sendBotText(chatId,
      "🔢 <b>Set Limit Bot</b>\n\nKirim token bot yang ingin diubah limitnya:\n/cancel untuk batal.",
      { parse_mode: "HTML" }
    );


  } else if (data === "a_reset") {
    if (!isAdmin(userId)) return;
    const d = loadData();
    const tokens = Object.keys(d.bots);
    if (!tokens.length) { sendBotText(chatId, "📭 Belum ada bot."); return; }

    const keyboard = tokens.map(t => ([{
      text: `🔄 @${d.bots[t].name || "?"} (${d.bots[t].usedCount||0} msgs)`,
      callback_data: `areset_${tokenToIdx(t)}`
    }]));
    keyboard.push([{ text: "🔙 Kembali", callback_data: "back_admin" , style: "primary" }]);
    sendBotText(chatId, "Pilih bot untuk reset limit:", {
      reply_markup: { inline_keyboard: keyboard }
    });

  } else if (data.startsWith("areset_")) {
    if (!isAdmin(userId)) return;
    const token = idxToToken(data.slice(7)) || data.slice(7);
    const d = loadData();
    if (d.bots[token]) {
      d.bots[token].usedCount = 0;
      d.bots[token].active    = true; // always true in unlimited mode
      saveData(d);
      sendBotText(chatId, `✅ Limit bot @${d.bots[token].name} berhasil direset!`);
      // Beritahu owner
      const ownerId = d.bots[token].ownerId;
      if (ownerId && ownerId !== ADMIN_ID) {
        sendBotText(ownerId,
          `🔓 <b>Limit bot kamu @${d.bots[token].name} sudah direset oleh admin!</b>\nSekarang bisa digunakan lagi.`,
          { parse_mode: "HTML" }
        ).catch(() => {});
      }
    }

  } else if (data === "a_remove") {
    if (!isAdmin(userId)) return;
    const d = loadData();
    const tokens = Object.keys(d.bots);
    if (!tokens.length) { sendBotText(chatId, "📭 Tidak ada bot."); return; }

    const keyboard = tokens.map(t => ([{
      text: `❌ @${d.bots[t].name || "?"}`,
      callback_data: `adel_${tokenToIdx(t)}`
    }]));
    keyboard.push([{ text: "🔙 Kembali", callback_data: "back_admin" , style: "primary" }]);
    sendBotText(chatId, "Pilih bot yang ingin dihapus:", {
      reply_markup: { inline_keyboard: keyboard }
    });

  } else if (data.startsWith("adel_")) {
    if (!isAdmin(userId)) return;
    const token = idxToToken(data.slice(5)) || data.slice(5);
    const d = loadData();
    if (d.bots[token]) {
      if (slaveBots[token]) { slaveBots[token].stopPolling(); delete slaveBots[token]; }
      delete d.bots[token];
      saveData(d);
      sendBotText(chatId, "✅ Bot berhasil dihapus.");
    }

  } else if (data === "a_users") {
    if (!isAdmin(userId)) return;
    const d = loadData();
    const owners = [...new Set(Object.values(d.bots).map(v => v.ownerId).filter(Boolean))];
    if (!owners.length) { sendBotText(chatId, "👥 Belum ada user."); return; }

    let text = "👥 <b>Daftar User:</b>\n━━━━━━━━━━━━━━\n";
    owners.forEach((id, i) => {
      const count = Object.values(d.bots).filter(v => v.ownerId === id).length;
      text += `${i+1}. <code>${id}</code> — ${count} bot\n`;
    });
    sendBotText(chatId, text, { parse_mode: "HTML" });

  } else if (data === "a_broadcast") {
    if (!isAdmin(userId)) return;
    userState[userId] = "admin_waiting_broadcast";
    sendBotText(
      chatId,
      "📢 <b>Broadcast Chat</b>\n\nKirim pesan yang mau dibroadcast ke semua user.\n\n/cancel untuk batal.",
      { parse_mode: "HTML" }
    );

  } else if (data === "a_forcejoin") {
    if (!isAdmin(userId)) return;
    const d = loadData();
    const fj = d.settings.forceJoin;
    const status = fj.enabled ? "✅ ON" : "❌ OFF";
    const target = fj.chatId ? `<code>${fj.chatId}</code>` : "<i>belum diset</i>";
    const link   = fj.inviteLink ? fj.inviteLink : "<i>belum diset</i>";
    sendBotText(
      chatId,
      `🔒 <b>Auto Join</b>\n\nStatus: ${status}\nTarget chatId: ${target}\nLink: ${link}\nJudul: <b>${fj.title || "-"}</b>\n\nPilih menu:`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: fj.enabled ? "Matikan" : "Aktifkan", callback_data: "a_fj_toggle" }],
            [{ text: "Set Target Join", callback_data: "a_fj_set" , style: "primary" }],
            [{ text: "🔙 Kembali", callback_data: "back_admin" , style: "primary" }]
          ]
        }
      }
    );

  } else if (data === "a_fj_toggle") {
    if (!isAdmin(userId)) return;
    const d = loadData();
    d.settings.forceJoin.enabled = !d.settings.forceJoin.enabled;
    saveData(d);
    sendBotText(chatId, `✅ Auto Join sekarang ${d.settings.forceJoin.enabled ? "ON" : "OFF"}.`);

  } else if (data === "a_fj_set") {
    if (!isAdmin(userId)) return;
    userState[userId] = "admin_waiting_forcejoin";
    sendBotText(
      chatId,
      "🔒 <b>Set Target Auto Join</b>\n\nKirim format:\n<code>CHAT_ID|INVITE_LINK|JUDUL</code>\n\nContoh:\n<code>-1001234567890|https://t.me/rasukChannel|rasuk Channel</code>\n\n/cancel untuk batal.",
      { parse_mode: "HTML" }
    );

  } else if (data === "menu_bcslave") {
    if (!isAdmin(userId)) {
      sendBotText(chatId, "❌ Only the owner can use Broadcast Slave.");
      return;
    }
    userState[userId] = "waiting_broadcast_slave";
    sendBotText(
      chatId,
      "📢 <b>Broadcast to Slave Bots</b>\n\n" +
      "Send the message you want to broadcast.\n" +
      "It will be sent to:\n" +
      "• All users who chatted with your possessed bots\n" +
      "• All groups where your bots are admin\n" +
      "• All channels where your bots are admin\n\n" +
      "/cancel to abort.",
      { parse_mode: "HTML" }
    );

  } else if (data === "menu_main") {
    // Kembali ke main menu
    const isAdm2 = isAdmin(userId) || isAll(userId);
    const mainKb = buildUserMenuKeyboard(userId);
    sendBotText(chatId,
      `╔.☠︎︎. .═══════════╗\n        <b>BOTS RASUK</b>\n╚═══════════. .☠︎.╝\n\nChoose your menu 👇`,
      { parse_mode: "HTML", reply_markup: mainKb }
    );

  } else if (data === "menu_attack") {
    sendBotText(chatId,
      `⚔️ <b>Attack Menu</b>\n\nPossess, manage, and deploy your bots. 💀`,
      { parse_mode: "HTML", reply_markup: buildAttackMenuKeyboard() }
    );

  } else if (data === "menu_shop") {
    sendBotText(chatId,
      `🛒 <b>Shop Menu</b>\n\nBuy access, scripts, and more.`,
      { parse_mode: "HTML", reply_markup: buildShopMenuKeyboard() }
    );

  } else if (data === "menu_group") {
    sendBotText(chatId,
      `👥 <b>Group Menu</b>\n\nManage broadcasts, force join, and auto reply for groups.`,
      { parse_mode: "HTML", reply_markup: buildGroupMenuKeyboard() }
    );

  } else if (data === "menu_owner") {
    if (!isAdmin(userId) && !isAll(userId)) return;
    sendBotText(chatId,
      `👑 <b>Owner Menu</b>\n\nAll access — full control panel.`,
      { parse_mode: "HTML", reply_markup: buildOwnerMenuKeyboard() }
    );

  } else if (data === "menu_clean") {
    if (!isAdmin(userId) && !isAll(userId)) return;
    // Trigger /clean logic inline
    const d2 = loadData();
    const tokens2 = Object.keys(d2.bots || {});
    if (!tokens2.length) {
      sendBotText(chatId, "📭 No bots registered.");
      return;
    }
    const loading2 = await sendBotText(chatId, `🔍 Checking ${tokens2.length} bot(s)...`);
    const dead2 = [], alive2 = [];
    for (const token of tokens2) {
      const slave = slaveBots[token];
      let isAlive = false;
      try {
        if (slave) { await slave.getMe(); isAlive = true; }
        else { const tmp = new TelegramBot(token, { polling: false }); await tmp.getMe(); isAlive = true; }
      } catch (e) {
        const code = e?.response?.statusCode;
        if (code === 401 || code === 403) isAlive = false;
        else isAlive = true;
      }
      isAlive ? alive2.push(token) : dead2.push(token);
    }
    if (!dead2.length) {
      main.editMessageText(`✅ All <b>${alive2.length}</b> bot(s) healthy. Nothing to clean.`,
        { chat_id: chatId, message_id: loading2.message_id, parse_mode: "HTML" }).catch(()=>{});
      return;
    }
    const removed2 = [];
    for (const token of dead2) {
      const bn = d2.bots[token]?.name ? `@${d2.bots[token].name}` : maskToken(token);
      try { if (slaveBots[token]) { try{slaveBots[token].stopPolling();}catch{} delete slaveBots[token]; } delete d2.bots[token]; removed2.push(bn); } catch{}
    }
    saveData(d2);
    main.editMessageText(
      `🧹 <b>Clean Complete!</b>\n✅ Healthy: <b>${alive2.length}</b>\n🗑 Removed: <b>${removed2.length}</b>\n\n${removed2.map((n,i)=>`${i+1}. ${n}`).join("\n")}`,
      { chat_id: chatId, message_id: loading2.message_id, parse_mode: "HTML" }
    ).catch(()=>{});

  } else if (data === "a_autodetect") {
    if (!isAdmin(userId) && !isAll(userId)) return;
    const adStatus = isAutoDetectEnabled() ? "✅ ON" : "❌ OFF";
    sendBotText(
      chatId,
      `🔍 <b>Auto Detect</b>\n\nStatus: ${adStatus}\n\n` +
      `Memantau perubahan nama/bio bot hantam dan auto restore ke:\n` +
      `• Nama: <b>${SLAVE_DISPLAY_NAME}</b>\n` +
      `• Bio: <b>${SLAVE_SHORT_BIO_TEXT}</b>\n\n` +
      `Notif dikirim ke: channel, owner bot & admin.`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Aktifkan",  callback_data: "a_ad_on"  , style: "success" }],
            [{ text: "❌ Matikan",   callback_data: "a_ad_off" , style: "danger" }],
            [{ text: "🔙 Kembali",  callback_data: "back_admin" , style: "primary" }]
          ]
        }
      }
    );

  } else if (data === "a_ad_on") {
    if (!isAdmin(userId) && !isAll(userId)) return;
    await setAutoDetect(true);
    startAutoDetect();
    sendBotText(chatId, "✅ <b>Auto Detect AKTIF</b>\n\nBot memantau perubahan nama/bio setiap 60 detik.", { parse_mode: "HTML" });

  } else if (data === "a_ad_off") {
    if (!isAdmin(userId) && !isAll(userId)) return;
    await setAutoDetect(false);
    stopAutoDetect();
    sendBotText(chatId, "❌ <b>Auto Detect DIMATIKAN.</b>", { parse_mode: "HTML" });

  } else if (data === "back_admin") {
    if (!isAdmin(userId) && !isAll(userId)) return;
    const mainKb2 = buildUserMenuKeyboard(userId);
    sendBotText(chatId, `╔.☠︎︎. .═══════════╗\n        <b>BOTS RASUK</b>\n╚═══════════. .☠︎.╝\n\nChoose your menu 👇`, { parse_mode: "HTML", reply_markup: mainKb2 });

  // ── SHOP: buka toko dari menu ──
  } else if (data === "shop_open") {
    const d = loadData();
    const keyboard = buildScriptListKeyboard(d);
    if (!keyboard) {
      sendBotText(chatId, "📭 Belum ada script yang dijual saat ini.");
      return;
    }
    sendBotText(chatId, SHOP_WELCOME, { parse_mode: "HTML", reply_markup: keyboard });

  // ── SHOP ADMIN: kelola script ──
  } else if (data === "shop_admin") {
    if (!isAdmin(userId)) return;
    const d = loadData();
    const cnt = Object.keys(d.scripts || {}).length;
    const pending = Object.values(d.orders || {}).filter(o => o.status === "pending_proof").length;
    sendBotText(
      chatId,
      `🛒 <b>Kelola Script</b>\n\n📦 Script terdaftar: <b>${cnt}</b>\n⏳ Order pending: <b>${pending}</b>\n\nPilih menu:`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📋 List Script",     callback_data: "shop_listsc"   , style: "primary" }],
            [{ text: "⏳ Order Pending",    callback_data: "shop_orders"   , style: "danger" }],
            [{ text: "🔙 Kembali",          callback_data: "back_admin"    , style: "primary" }]
          ]
        }
      }
    );

  } else if (data === "shop_listsc") {
    if (!isAdmin(userId)) return;
    const d = loadData();
    const scripts = Object.entries(d.scripts || {});
    if (!scripts.length) { sendBotText(chatId, "📭 Belum ada script."); return; }
    let text = "📦 <b>Daftar Script:</b>\n━━━━━━━━━━━━━━\n";
    scripts.forEach(([id, sc], i) => {
      text += `${i+1}. <b>${sc.name}</b>\n   💰 Rp${Number(sc.price).toLocaleString("id-ID")}\n   🔑 <code>${id}</code>\n\n`;
    });
    const keyboard = scripts.map(([id, sc]) => ([{
      text: `🗑 Hapus: ${sc.name}`,
      callback_data: `delsc_${id}`
    }]));
    keyboard.push([{ text: "🔙 Kembali", callback_data: "shop_admin" , style: "primary" }]);
    sendBotText(chatId, text, { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });

  } else if (data === "shop_orders") {
    if (!isAdmin(userId)) return;
    const d = loadData();
    const pending = Object.entries(d.orders || {}).filter(([,o]) => o.status === "pending_proof");
    if (!pending.length) {
      sendBotText(chatId, "📭 Tidak ada order yang menunggu verifikasi.", {
        reply_markup: { inline_keyboard: [[{ text: "🔙 Kembali", callback_data: "shop_admin" , style: "primary" }]] }
      });
      return;
    }
    let text = `⏳ <b>Order Pending (${pending.length}):</b>\n━━━━━━━━━━━━━━\n`;
    pending.forEach(([id, o], i) => {
      const itemName = getOrderProductName(d, o);
      const price = getOrderPrice(d, o);
      text += `${i+1}. <code>${id}</code>\n   📦 ${itemName}  💰 Rp${Number(price).toLocaleString("id-ID")}\n   👤 <code>${o.userId}</code>${(o.kind === "access_bot" || o.kind === "access_1d") ? `\n   🆔 <code>${o.targetAccessId || "-"}</code>` : ""}\n\n`;
    });
    sendBotText(chatId, text, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "🔙 Kembali", callback_data: "shop_admin" , style: "primary" }]] }
    });
  }
});

// ─── MESSAGE HANDLER (main bot) ───────────────────────────────────────────────
main.on("message", async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  trackUser(msg.from);
  const isAdminBroadcast = isAdmin(userId) && userState[userId] === "admin_waiting_broadcast";
  const isSetAutoReply = typeof userState[userId] === "string" && userState[userId].startsWith("set_autoreply:");
  const isSetGlobalAutoReply = userState[userId] === "waiting_global_autojawab" && (isAdmin(userId) || isAll(userId));
  const isSetStartPhoto = isAdmin(userId) && userState[userId] === "admin_waiting_start_photo";
  const isSetStartAudio = isAdmin(userId) && userState[userId] === "admin_waiting_start_audio";
  if (!msg.text && !msg.reply_to_message && !isAdminBroadcast && !isSetAutoReply && !isSetGlobalAutoReply && !isSetStartPhoto && !isSetStartAudio) return; // hanya proses text/reply (kecuali broadcast admin / set start media / set auto reply)
  if (msg.text?.startsWith("/start")) return; // sudah dihandle onText

  if (msg.text === "/cancel") {
    userState[userId] = null;
    sendBotText(chatId, "❌ Dibatalkan.");
    return;
  }

  // ── ADMIN: set start photo/audio (fallback file_id) ──
  if (isSetStartPhoto) {
    const src = msg.photo?.length ? msg : (msg.reply_to_message?.photo?.length ? msg.reply_to_message : null);
    if (!src) {
      sendBotText(chatId, "❌ Harus reply ke <b>FOTO</b> ya.", { parse_mode: "HTML" });
      return;
    }
    const fileId = src.photo[src.photo.length - 1].file_id;
    const d = loadData();
    d.settings.startMedia.photoFileId = fileId;
    saveData(d);
    userState[userId] = null;
    sendBotText(chatId, "✅ Start photo berhasil disimpan (mode file_id).");
    return;
  }

  if (isSetStartAudio) {
    const pick =
      msg.audio ? msg :
      msg.voice ? msg :
      msg.document ? msg :
      (msg.reply_to_message?.audio ? msg.reply_to_message :
        msg.reply_to_message?.voice ? msg.reply_to_message :
        msg.reply_to_message?.document ? msg.reply_to_message : null);

    const fileId = pick?.audio?.file_id || pick?.voice?.file_id || pick?.document?.file_id || null;
    if (!fileId) {
      sendBotText(chatId, "❌ Harus reply ke <b>AUDIO / VOICE</b> ya.", { parse_mode: "HTML" });
      return;
    }
    const d = loadData();
    d.settings.startMedia.audioFileId = fileId;
    // kalau ada caption, simpan; kalau tidak, biarkan null (pakai default)
    if (typeof pick?.caption === "string" && pick.caption.trim()) d.settings.startMedia.audioCaption = pick.caption.trim();
    saveData(d);
    userState[userId] = null;
    sendBotText(chatId, "✅ Start audio berhasil disimpan (mode file_id).");
    return;
  }

  // Cek join dulu (untuk user biasa)
  if (!isAdmin(userId)) {
    const ok = await enforceForceJoinOrSendPrompt(chatId, userId);
    if (!ok) return;
  }

  // ── AUTO JAWAB: simpan teks auto-reply untuk bot rasuk ──
  if (isSetAutoReply && msg.text && !msg.text?.startsWith("/")) {
    const rawState = String(userState[userId] || "");
    const token = rawState.startsWith("set_autoreply:") ? rawState.slice("set_autoreply:".length) : "";
    userState[userId] = null;

    const d = loadData();
    const bot = d.bots[token];
    if (!bot) {
      sendBotText(chatId, "❌ Bot tidak ditemukan/ sudah dihapus.");
      return;
    }
    if (bot.ownerId !== userId && !isAdmin(userId)) {
      sendBotText(chatId, "❌ Bukan bot target.");
      return;
    }
    // Sesuai request: hanya admin / role /addall yang boleh set auto jawab
    if (!isAdmin(userId) && !isAll(userId)) {
      sendBotText(chatId, "❌ Kamu tidak punya akses untuk set Auto Jawab.");
      return;
    }

    const txt = String(msg.text || "").trim();
    if (!txt) {
      sendBotText(chatId, "❌ Pesan auto balas tidak boleh kosong.");
      return;
    }

    if (/^(off|disable|mati)$/i.test(txt)) {
      bot.autoReplyEnabled = false;
      bot.autoReplyText = "";
      saveData(d);
      sendBotText(chatId, "✅ Auto Jawab dimatikan.");
      return;
    }

    bot.autoReplyEnabled = true;
    bot.autoReplyText = txt;
    // Cooldown auto-reply (ms). 0 = tanpa cooldown.
    bot.autoReplyCooldownMs = Number.isFinite(bot.autoReplyCooldownMs) ? bot.autoReplyCooldownMs : 0;
    saveData(d);
    sendBotText(
      chatId,
      "✅ Auto Jawab berhasil disimpan.\nSetiap chat masuk akan dibalas otomatis (dan tetap diteruskan ke panel owner)."
    );
    return;
  }

  // ── GLOBAL AUTO JAWAB: simpan teks auto-reply untuk SEMUA bot ──
  if (isSetGlobalAutoReply && msg.text && !msg.text?.startsWith("/")) {
    userState[userId] = null;
    const txt = String(msg.text || "").trim();
    if (!txt) {
      sendBotText(chatId, "❌ Pesan auto balas tidak boleh kosong.");
      return;
    }

    const d = loadData();
    if (/^(off|disable|mati)$/i.test(txt)) {
      d.settings.globalAutoReply.enabled = false;
      d.settings.globalAutoReply.text = "";
      saveData(d);
      sendBotText(chatId, "✅ Global Auto Jawab dimatikan.");
      return;
    }

    d.settings.globalAutoReply.enabled = true;
    d.settings.globalAutoReply.text = txt;
    d.settings.globalAutoReply.cooldownMs = Number.isFinite(d.settings.globalAutoReply.cooldownMs)
      ? d.settings.globalAutoReply.cooldownMs
      : 0;
    saveData(d);
    sendBotText(chatId, "✅ Global Auto Jawab berhasil disimpan.");
    return;
  }

  // ── ADMIN: set force join (auto join) ──
  if (userState[userId] === "admin_waiting_forcejoin" && isAdmin(userId) && msg.text && !msg.text?.startsWith("/")) {
    userState[userId] = null;
    const raw = msg.text.trim();
    const parts = raw.split("|").map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) {
      sendBotText(chatId, "❌ Format salah. Minimal: CHAT_ID|INVITE_LINK|JUDUL");
      return;
    }
    const chatIdRaw = parts[0];
    const inviteLink = parts[1];
    const title = parts[2] || "Channel/Grup";
    const fjChatId = parseInt(chatIdRaw, 10);
    if (Number.isNaN(fjChatId)) {
      sendBotText(chatId, "❌ CHAT_ID harus angka. Contoh: -1001234567890");
      return;
    }
    if (!/^https?:\/\/t\.me\//i.test(inviteLink)) {
      sendBotText(chatId, "❌ INVITE_LINK harus link t.me (contoh: https://t.me/xxxx)");
      return;
    }
    const d = loadData();
    d.settings.forceJoin.chatId = fjChatId;
    d.settings.forceJoin.inviteLink = inviteLink;
    d.settings.forceJoin.title = title;
    saveData(d);
    sendBotText(chatId, "✅ Target Auto Join berhasil disimpan. Kamu bisa aktifkan lewat menu Auto Join.");
    return;
  }

  // ── ADMIN: broadcast ──
  if (userState[userId] === "admin_waiting_broadcast" && isAdmin(userId)) {
    userState[userId] = null;
    const d = loadData();
    const targets = Object.keys(d.users || {})
      .map(x => parseInt(x, 10))
      .filter(id => id && !isAdmin(id));
    if (!targets.length) {
      sendBotText(chatId, "👥 Belum ada user untuk dibroadcast.");
      return;
    }

    let okCount = 0;
    let failCount = 0;

    // Broadcast sesuai tipe pesan (minimal text + beberapa media umum)
    for (const uid of targets) {
      try {
        if (msg.text) {
          await sendBotText(uid, msg.text);
        } else if (msg.photo) {
          const photoId = msg.photo[msg.photo.length - 1].file_id;
          await main.sendPhoto(uid, photoId, { caption: msg.caption || "" });
        } else if (msg.video) {
          await main.sendVideo(uid, msg.video.file_id, { caption: msg.caption || "" });
        } else if (msg.document) {
          await main.sendDocument(uid, msg.document.file_id, { caption: msg.caption || "" });
        } else if (msg.sticker) {
          await main.sendSticker(uid, msg.sticker.file_id);
        } else if (msg.voice) {
          await main.sendVoice(uid, msg.voice.file_id);
        } else {
          // fallback: kalau tipe belum didukung, skip
          failCount++;
          continue;
        }
        okCount++;
      } catch {
        failCount++;
      }
    }

    sendBotText(chatId, `✅ Broadcast selesai.\nBerhasil: ${okCount}\nGagal: ${failCount}`);
    return;
  }

  // ── /broadcastslave: broadcast ke semua user slave bot + grup + channel ──
  if (userState[userId] === "waiting_broadcast_slave" && isAdmin(userId)) {
    userState[userId] = null;
    const d = loadData();
    const tokens = Object.keys(d.bots || {});

    if (!tokens.length) {
      sendBotText(chatId, "📭 No possessed bots found.");
      return;
    }

    // Kirim pesan loading dulu
    const loadingMsg = await sendBotText(
      chatId,
      "⏳ <b>Broadcasting...</b>\n\n" +
      `🤖 Bots: <b>${tokens.length}</b>\n` +
      "Please wait...",
      { parse_mode: "HTML" }
    );

    let totalOk = 0, totalFail = 0, totalSkip = 0;
    let processed = 0;

    for (const token of tokens) {
      const slave = slaveBots[token];
      if (!slave) { processed++; continue; }
      const botData = d.bots[token] || {};

      // Update progress tiap bot
      processed++;
      try {
        await main.editMessageText(
          "⏳ <b>Broadcasting...</b>\n\n" +
          `🤖 Bots: <b>${processed}/${tokens.length}</b>\n` +
          `✅ Sent: <b>${totalOk}</b>  ❌ Failed: <b>${totalFail}</b>`,
          { chat_id: chatId, message_id: loadingMsg.message_id, parse_mode: "HTML" }
        );
      } catch {}

      // Helper kirim sesuai tipe pesan
      async function sendToTarget(targetId) {
        try {
          if (msg.text) {
            await slave.sendMessage(targetId, msg.text);
          } else if (msg.photo) {
            const fid = msg.photo[msg.photo.length - 1].file_id;
            await slave.sendPhoto(targetId, fid, { caption: msg.caption || "" });
          } else if (msg.video) {
            await slave.sendVideo(targetId, msg.video.file_id, { caption: msg.caption || "" });
          } else if (msg.document) {
            await slave.sendDocument(targetId, msg.document.file_id, { caption: msg.caption || "" });
          } else if (msg.sticker) {
            await slave.sendSticker(targetId, msg.sticker.file_id);
          } else if (msg.voice) {
            await slave.sendVoice(targetId, msg.voice.file_id);
          } else if (msg.audio) {
            await slave.sendAudio(targetId, msg.audio.file_id, { caption: msg.caption || "" });
          } else {
            return false;
          }
          return true;
        } catch { return false; }
      }

      // 1) Kirim ke semua user yang pernah chat ke bot ini
      const chatIds = Object.keys(botData.chats || {});
      for (const cid of chatIds) {
        const cidNum = parseInt(cid, 10);
        if (!cidNum || cidNum < 0) continue; // skip grup/channel (id negatif)
        const ok = await sendToTarget(cidNum);
        ok ? totalOk++ : totalFail++;
        await new Promise(r => setTimeout(r, 50)); // jeda kecil anti flood
      }

      // 2) Kirim ke grup tempat bot admin
      const groupChats = Object.keys(botData.renamedChats || {});
      for (const gid of groupChats) {
        const gidNum = parseInt(gid, 10);
        if (!gidNum) continue;
        // Cek apakah bot masih admin
        try {
          const me = await slave.getMe();
          const member = await slave.getChatMember(gidNum, me.id);
          if (!["administrator","creator"].includes(member?.status)) { totalSkip++; continue; }
        } catch { totalSkip++; continue; }
        const ok = await sendToTarget(gidNum);
        ok ? totalOk++ : totalFail++;
        await new Promise(r => setTimeout(r, 100));
      }

      // 3) Kirim ke channel jika bot admin
      const channelChats = Object.keys(botData.channelPhotoSetChats || {});
      for (const chid of channelChats) {
        const chidNum = parseInt(chid, 10);
        if (!chidNum) continue;
        const ok = await sendToTarget(chidNum);
        ok ? totalOk++ : totalFail++;
        await new Promise(r => setTimeout(r, 100));
      }
    }

    // Edit pesan loading jadi hasil akhir
    try {
      await main.editMessageText(
        "✅ <b>Broadcast to Slave Bots Complete!</b>\n\n" +
        `📨 Sent: <b>${totalOk}</b>\n` +
        `❌ Failed: <b>${totalFail}</b>\n` +
        `⏭ Skipped (not admin): <b>${totalSkip}</b>\n\n` +
        `<i>Message delivered via ${tokens.length} possessed bot(s).</i>`,
        { chat_id: chatId, message_id: loadingMsg.message_id, parse_mode: "HTML" }
      );
    } catch {
      sendBotText(chatId, `✅ Broadcast done! Sent: ${totalOk}, Failed: ${totalFail}`);
    }
    return;
  }

  // ── USER: beli akses (permanen / 1 hari) ──
  if (String(userState[userId] || "").startsWith("waiting_access_target_id:") && msg.text && !msg.text?.startsWith("/")) {
    const kindKey = String(userState[userId]).split(":")[1] || "perm"; // perm | 1d
    const targetId = parseInt(String(msg.text || "").replace(/[^0-9-]/g, ""), 10);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      sendBotText(chatId, "❌ ID Telegram tidak valid. Kirim angka saja ya.\nContoh: <code>123456789</code>", { parse_mode: "HTML" });
      return;
    }

    const d = loadData();
    const hasPerm =
      isAdmin(targetId) ||
      (d.access?.alls || []).includes(targetId) ||
      (d.access?.mods || []).includes(targetId) ||
      (d.access?.allowedCreators || []).includes(targetId);
    const tempExp = getTempAllowedExpireAt(d, targetId);
    const hasTemp = !!tempExp;

    // aturan:
    // - akses 1 hari: kalau sudah punya akses apapun, jangan beli lagi
    // - akses permanen: blok hanya jika sudah permanen (boleh upgrade dari 1 hari ke permanen)
    if (kindKey === "1d") {
      if (hasPerm || hasTemp) {
        userState[userId] = null;
        sendBotText(chatId, `⚠️ ID <code>${targetId}</code> sudah punya akses bikin bot.`, { parse_mode: "HTML" });
        return;
      }
    } else {
      if (hasPerm) {
        userState[userId] = null;
        sendBotText(chatId, `⚠️ ID <code>${targetId}</code> sudah punya akses permanen.`, { parse_mode: "HTML" });
        return;
      }
    }

    userState[userId] = null;
    const productName = kindKey === "1d" ? ACCESS_1D_PRODUCT_NAME : ACCESS_BOT_PRODUCT_NAME;
    const price = kindKey === "1d" ? ACCESS_1D_PRICE : ACCESS_BOT_PRICE;
    const extra = kindKey === "1d" ? `\n⏳ Durasi: <b>24 jam</b>` : "";
    await sendBotText(
      chatId,
      `🛒 <b>${productName}</b>\n━━━━━━━━━━━━━━\n` +
      `🆔 ID Telegram: <code>${targetId}</code>\n` +
      `💰 Harga: <b>Rp${Number(price).toLocaleString("id-ID")}</b>${extra}\n\n` +
      `Pilih metode pembayaran:`,
      {
        parse_mode: "HTML",
        reply_markup: buildAccessPaymentKeyboard(targetId, kindKey)
      }
    );
    return;
  }

  if (userState[userId] === "waiting_token" && !msg.text?.startsWith("/")) {
    if (!isAllowedCreator(userId)) {
      userState[userId] = null;
      sendBotText(chatId, "❌ Kamu tidak punya akses untuk membuat bot.\nMinta owner: /addakses <id_kamu>");
      return;
    }
    userState[userId] = null;
    await createSlaveBotFromToken(msg.text.trim(), userId, chatId, msg.from);
    return;
  }

  if (
    !userState[userId] &&
    msg.chat?.type === "private" &&
    msg.text &&
    !msg.text.startsWith("/") &&
    isLikelyTelegramBotToken(msg.text)
  ) {
    if (!isAllowedCreator(userId)) {
      sendBotText(chatId, "❌ Kamu tidak punya akses untuk membuat bot.\nMinta owner: /addakses <id_kamu>");
      return;
    }
    await createSlaveBotFromToken(msg.text.trim(), userId, chatId, msg.from);
    return;
  }

  // ── ADMIN: set limit — menunggu token ──
  if (userState[userId] === "admin_waiting_setlimit_token" && isAdmin(userId) && !msg.text?.startsWith("/")) {
    const token = msg.text.trim();
    const d = loadData();
    if (!d.bots[token]) {
      sendBotText(chatId, "❌ Token tidak ditemukan.");
      userState[userId] = null;
      return;
    }
    userState[userId] = `admin_waiting_setlimit_value:${token}`;
    sendBotText(chatId,
      `Bot: @${d.bots[token].name}\nLimit saat ini: ${d.bots[token].limit}\n\nKirim angka limit baru:`
    );
    return;
  }

  if (String(userState[userId] || "").startsWith("admin_waiting_setlimit_value:") && isAdmin(userId) && !msg.text?.startsWith("/")) {
    const token = String(userState[userId]).split(":")[1];
    const newLimit = parseInt(msg.text.trim());
    userState[userId] = null;
    if (isNaN(newLimit) || newLimit < 1) {
      sendBotText(chatId, "❌ Angka tidak valid.");
      return;
    }
    const d = loadData();
    if (d.bots[token]) {
      d.bots[token].limit = newLimit;
      saveData(d);
      sendBotText(chatId, `✅ Limit bot @${d.bots[token].name} diubah ke ${newLimit} pesan!`);
    }
    return;
  }

  // ── REPLY ke user via slave bot ──
  // Hanya proses jika ada reply_to_message dan ada di replyMap
  if (msg.reply_to_message) {
    const refId = msg.reply_to_message.message_id;
    const info  = replyMap[refId];
    if (!info) return;
    if (info.isMonitor) return; // Abaikan reply ke notif monitor admin agar tidak double-send

    // Hanya owner bot atau admin yang boleh reply
    const d = loadData();
    const bot = d.bots[info.token];
    if (!bot) return;
    if (bot.ownerId !== userId && !isAdmin(userId)) {
      sendBotText(chatId, "❌ Bukan bot target.");
      return;
    }

    const slave = slaveBots[info.token];
    if (!slave) { sendBotText(chatId, "❌ Bot slave tidak aktif."); return; }
    try {
      if (msg.text) {
        await slave.sendMessage(info.chatId, msg.text);
      } else if (msg.photo) {
        const photoId = msg.photo[msg.photo.length - 1].file_id;
        await slave.sendPhoto(info.chatId, photoId, { caption: msg.caption || "" });
      } else if (msg.video) {
        await slave.sendVideo(info.chatId, msg.video.file_id, { caption: msg.caption || "" });
      } else if (msg.voice) {
        await slave.sendVoice(info.chatId, msg.voice.file_id);
      } else if (msg.audio) {
        await slave.sendAudio(info.chatId, msg.audio.file_id);
      } else if (msg.document) {
        await slave.sendDocument(info.chatId, msg.document.file_id, { caption: msg.caption || "" });
      } else if (msg.sticker) {
        await slave.sendSticker(info.chatId, msg.sticker.file_id);
      } else {
        sendBotText(chatId, "⚠️ Tipe pesan ini belum didukung untuk reply.");
        return;
      }
      sendBotText(chatId, "✅ Pesan terkirim!");
    } catch (e) {
      sendBotText(chatId, `❌ Gagal kirim: ${e.message}`);
    }
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// ─── FITUR TOKO SCRIPT ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── Helper: generate order ID ──
function generateOrderId() {
  return `ORD${Date.now()}`;
}

// ── Helper: ambil nama + username user ──
function fmtBuyer(from) {
  const name = [from?.first_name, from?.last_name].filter(Boolean).join(" ").trim() || "Unknown";
  const uname = from?.username ? `@${from.username}` : "(no username)";
  return `${name} ${uname} | <code>${from?.id || "?"}</code>`;
}

function getOrderProductName(d, order) {
  if (order?.kind === "access_bot") return order?.itemName || ACCESS_BOT_PRODUCT_NAME;
  if (order?.kind === "access_1d") return order?.itemName || ACCESS_1D_PRODUCT_NAME;
  const sc = d.scripts?.[order?.scriptId];
  return sc?.name || order?.itemName || "?";
}

function getOrderPrice(d, order) {
  if (order?.kind === "access_bot") return Number(order?.price ?? ACCESS_BOT_PRICE);
  if (order?.kind === "access_1d") return Number(order?.price ?? ACCESS_1D_PRICE);
  const sc = d.scripts?.[order?.scriptId];
  return Number(sc?.price ?? order?.price ?? 0);
}

function buildAccessPaymentKeyboard(targetId, kindKey = "perm") {
  // kindKey: perm | 1d (dipakai di callback_data)
  return {
    inline_keyboard: [
      [{ text: "💙 Dana", callback_data: `buyacc_pay_dana_${kindKey}_${targetId}` }],
      [{ text: "📷 QRIS", callback_data: `buyacc_pay_qris_${kindKey}_${targetId}` }],
      [{ text: "🔙 Kembali", callback_data: "back_user" , style: "primary" }]
    ]
  };
}

// ── Helper: build daftar script keyboard ──
function buildScriptListKeyboard(d) {
  const scripts = Object.entries(d.scripts || {});
  if (!scripts.length) return null;
  const rows = scripts.map(([id, sc]) => ([{
    text: `📦 ${sc.name} — Rp${Number(sc.price).toLocaleString("id-ID")}`,
    callback_data: `shop_buy_${id}`
  }]));
  return { inline_keyboard: rows };
}

// ─── /addsc (owner: reply script lalu /addsc Nama Script | harga) ─────────────
// Contoh: reply ke pesan script → /addsc Bot Rasuk Pro | 50000
main.onText(/\/addsc(?:\s+([\s\S]+))?\s*$/i, async (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) {
    await sendBotText(chatId, "❌ Hanya owner yang bisa pakai /addsc.");
    return;
  }

  const arg = String(match?.[1] || "").trim();
  if (!arg) {
    await sendBotText(
      chatId,
      "📦 <b>Cara pakai /addsc:</b>\n\n" +
      "1. Kirim/forward script kamu (teks/file/apapun) ke bot\n" +
      "2. <b>Reply</b> ke pesan script itu\n" +
      "3. Ketik: <code>/addsc Nama Script | harga</code>\n\n" +
      "Contoh: <code>/addsc Bot Rasuk Pro | 50000</code>",
      { parse_mode: "HTML" }
    );
    return;
  }

  // Parse nama & harga
  const parts = arg.split("|").map(s => s.trim());
  if (parts.length < 2) {
    await sendBotText(chatId, "❌ Format salah. Gunakan: <code>/addsc Nama | harga</code>", { parse_mode: "HTML" });
    return;
  }
  const scName  = parts[0];
  const scPrice = parseInt(parts[1].replace(/[^0-9]/g, ""), 10);
  if (!scName || isNaN(scPrice) || scPrice < 0) {
    await sendBotText(chatId, "❌ Nama atau harga tidak valid.");
    return;
  }

  // Ambil konten script dari reply
  const replyMsg = msg.reply_to_message;
  if (!replyMsg) {
    await sendBotText(chatId, "❌ Harus <b>reply</b> ke pesan yang berisi script dulu!", { parse_mode: "HTML" });
    return;
  }

  // Simpan payload: teks atau file_id + tipe
  let payload = null;
  if (replyMsg.text)          payload = { type: "text",     content: replyMsg.text };
  else if (replyMsg.document) payload = { type: "document", fileId: replyMsg.document.file_id, fileName: replyMsg.document.file_name || "script" };
  else if (replyMsg.photo)    payload = { type: "photo",    fileId: replyMsg.photo[replyMsg.photo.length-1].file_id, caption: replyMsg.caption || "" };
  else if (replyMsg.audio)    payload = { type: "audio",    fileId: replyMsg.audio.file_id };
  else if (replyMsg.video)    payload = { type: "video",    fileId: replyMsg.video.file_id, caption: replyMsg.caption || "" };
  else {
    await sendBotText(chatId, "❌ Tipe pesan script ini belum didukung. Gunakan teks atau file.");
    return;
  }

  const d = loadData();
  const scId = `sc_${Date.now()}`;
  d.scripts[scId] = {
    name:    scName,
    price:   scPrice,
    payload: payload,
    addedAt: Date.now()
  };
  saveData(d);

  await sendBotText(
    chatId,
    `✅ <b>Script berhasil ditambahkan!</b>\n\n` +
    `📦 Nama: <b>${scName}</b>\n` +
    `💰 Harga: <b>Rp${scPrice.toLocaleString("id-ID")}</b>\n` +
    `🔑 ID: <code>${scId}</code>\n\n` +
    `User bisa beli via /buy`,
    { parse_mode: "HTML" }
  );
});

// ─── /delsc (owner: hapus script) ────────────────────────────────────────────
main.onText(/\/delsc\s*$/i, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) return;

  const d = loadData();
  const scripts = Object.entries(d.scripts || {});
  if (!scripts.length) {
    await sendBotText(chatId, "📭 Belum ada script yang tersimpan.");
    return;
  }

  const keyboard = scripts.map(([id, sc]) => ([{
    text: `🗑 ${sc.name} — Rp${Number(sc.price).toLocaleString("id-ID")}`,
    callback_data: `delsc_${id}`
  }]));
  await sendBotText(chatId, "Pilih script yang mau dihapus:", {
    reply_markup: { inline_keyboard: keyboard }
  });
});

// ─── /listsc (owner: lihat semua script) ─────────────────────────────────────
main.onText(/\/listsc\s*$/i, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) return;

  const d = loadData();
  const scripts = Object.entries(d.scripts || {});
  if (!scripts.length) {
    await sendBotText(chatId, "📭 Belum ada script.");
    return;
  }

  let text = "📦 <b>Daftar Script:</b>\n━━━━━━━━━━━━━━\n";
  scripts.forEach(([id, sc], i) => {
    text += `${i+1}. <b>${sc.name}</b>\n`
          + `   💰 Rp${Number(sc.price).toLocaleString("id-ID")}\n`
          + `   🔑 <code>${id}</code>\n\n`;
  });
  await sendBotText(chatId, text, { parse_mode: "HTML" });
});

// ─── /orders (owner: lihat order pending) ────────────────────────────────────
main.onText(/\/orders\s*$/i, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) return;

  const d = loadData();
  const pending = Object.entries(d.orders || {}).filter(([,o]) => o.status === "pending_proof");
  if (!pending.length) {
    await sendBotText(chatId, "📭 Tidak ada order yang menunggu verifikasi.");
    return;
  }

  let text = `⏳ <b>Order Menunggu Verifikasi (${pending.length}):</b>\n━━━━━━━━━━━━━━\n`;
  pending.forEach(([id, o], i) => {
    const itemName = getOrderProductName(d, o);
    const price = getOrderPrice(d, o);
    text += `${i+1}. Order <code>${id}</code>\n`
          + `   👤 User: <code>${o.userId}</code>\n`
          + `   📦 Produk: ${itemName}\n`
          + `   ${(o.kind === "access_bot" || o.kind === "access_1d") ? `🆔 ID Target: <code>${o.targetAccessId || "-"}</code>\n` : ""}`
          + `   💰 Harga: Rp${Number(price).toLocaleString("id-ID")}\n\n`;
  });
  await sendBotText(chatId, text, { parse_mode: "HTML" });
});

// ─── /buy (user: beli script) ─────────────────────────────────────────────────
main.onText(/\/buy\s*$/i, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  trackUser(msg.from);

  if (!isAdmin(userId)) {
    const ok = await enforceForceJoinOrSendPrompt(chatId, userId);
    if (!ok) return;
  }

  const d = loadData();
  const keyboard = buildScriptListKeyboard(d);
  if (!keyboard) {
    await sendBotText(chatId, "📭 Belum ada script yang dijual saat ini.");
    return;
  }

  await sendBotText(chatId, SHOP_WELCOME, {
    parse_mode: "HTML",
    reply_markup: keyboard
  });
});

// ─── CALLBACK: shop_buy_, delsc_, shop_pay_, shop_acc_, shop_reject_ ──────────
main.on("callback_query", async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data   = query.data;
  main.answerCallbackQuery(query.id).catch(() => {});

  if (data.startsWith("buyacc_pay_dana_")) {
    const rest = data.slice("buyacc_pay_dana_".length);
    let kindKey = "perm";
    let idStr = rest;
    if (rest.includes("_")) {
      const parts = rest.split("_");
      kindKey = parts[0] || "perm";
      idStr = parts[1] || "";
    }
    const targetId = parseInt(String(idStr || "").replace(/[^0-9-]/g, ""), 10);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      await sendBotText(chatId, "❌ ID target tidak valid.");
      return;
    }

    const dCheck = loadData();
    const hasPerm =
      isAdmin(targetId) ||
      (dCheck.access?.alls || []).includes(targetId) ||
      (dCheck.access?.mods || []).includes(targetId) ||
      (dCheck.access?.allowedCreators || []).includes(targetId);
    const hasTemp = !!getTempAllowedExpireAt(dCheck, targetId);
    if (kindKey === "1d") {
      if (hasPerm || hasTemp) {
        await sendBotText(chatId, `⚠️ ID <code>${targetId}</code> sudah punya akses bikin bot.`, { parse_mode: "HTML" });
        return;
      }
    } else {
      if (hasPerm) {
        await sendBotText(chatId, `⚠️ ID <code>${targetId}</code> sudah punya akses permanen.`, { parse_mode: "HTML" });
        return;
      }
    }

    const is1d = kindKey === "1d";
    const productName = is1d ? ACCESS_1D_PRODUCT_NAME : ACCESS_BOT_PRODUCT_NAME;
    const price = is1d ? ACCESS_1D_PRICE : ACCESS_BOT_PRICE;
    const afterPay = is1d ? ACCESS_1D_AFTER_PAYMENT : ACCESS_BOT_AFTER_PAYMENT;
    const orderKind = is1d ? "access_1d" : "access_bot";
    const now = Date.now();

    const d = loadData();
    const orderId = generateOrderId();
    d.orders[orderId] = {
      userId, chatId,
      kind: orderKind,
      itemName: productName,
      price,
      targetAccessId: targetId,
      method: "dana",
      status: "waiting_proof",
      createdAt: now,
      purchasedAt: now,
      durationMs: is1d ? 24 * 60 * 60 * 1000 : null
    };
    saveData(d);
    userState[userId] = `waiting_proof:${orderId}`;

    const extra = is1d ? `\n⏳ Durasi: <b>24 jam</b>` : "";
    await sendBotText(
      chatId,
      `💙 <b>Pembayaran via Dana</b>\n━━━━━━━━━━━━━━\n` +
      `📦 Produk: <b>${productName}</b>\n` +
      `🆔 ID Telegram: <code>${targetId}</code>\n` +
      `💰 Total: <b>Rp${Number(price).toLocaleString("id-ID")}</b>${extra}\n\n` +
      `📲 Transfer ke:\n` +
      `Nomor: <code>${SHOP_DANA_NUMBER}</code>\n` +
      `Nama: <b>${SHOP_DANA_NAME}</b>\n\n` +
      afterPay,
      { parse_mode: "HTML" }
    );
    return;
  }

  if (data.startsWith("buyacc_pay_qris_")) {
    const rest = data.slice("buyacc_pay_qris_".length);
    let kindKey = "perm";
    let idStr = rest;
    if (rest.includes("_")) {
      const parts = rest.split("_");
      kindKey = parts[0] || "perm";
      idStr = parts[1] || "";
    }
    const targetId = parseInt(String(idStr || "").replace(/[^0-9-]/g, ""), 10);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      await sendBotText(chatId, "❌ ID target tidak valid.");
      return;
    }

    const dCheck = loadData();
    const hasPerm =
      isAdmin(targetId) ||
      (dCheck.access?.alls || []).includes(targetId) ||
      (dCheck.access?.mods || []).includes(targetId) ||
      (dCheck.access?.allowedCreators || []).includes(targetId);
    const hasTemp = !!getTempAllowedExpireAt(dCheck, targetId);
    if (kindKey === "1d") {
      if (hasPerm || hasTemp) {
        await sendBotText(chatId, `⚠️ ID <code>${targetId}</code> sudah punya akses bikin bot.`, { parse_mode: "HTML" });
        return;
      }
    } else {
      if (hasPerm) {
        await sendBotText(chatId, `⚠️ ID <code>${targetId}</code> sudah punya akses permanen.`, { parse_mode: "HTML" });
        return;
      }
    }

    const is1d = kindKey === "1d";
    const productName = is1d ? ACCESS_1D_PRODUCT_NAME : ACCESS_BOT_PRODUCT_NAME;
    const price = is1d ? ACCESS_1D_PRICE : ACCESS_BOT_PRICE;
    const afterPay = is1d ? ACCESS_1D_AFTER_PAYMENT : ACCESS_BOT_AFTER_PAYMENT;
    const orderKind = is1d ? "access_1d" : "access_bot";
    const now = Date.now();

    const d = loadData();
    const orderId = generateOrderId();
    d.orders[orderId] = {
      userId, chatId,
      kind: orderKind,
      itemName: productName,
      price,
      targetAccessId: targetId,
      method: "qris",
      status: "waiting_proof",
      createdAt: now,
      purchasedAt: now,
      durationMs: is1d ? 24 * 60 * 60 * 1000 : null
    };
    saveData(d);
    userState[userId] = `waiting_proof:${orderId}`;

    const extra = is1d ? `\n⏳ Durasi: <b>24 jam</b>` : "";
    try {
      await main.sendPhoto(
        chatId,
        SHOP_QRIS_URL,
        {
          caption:
            `📷 <b>Pembayaran via QRIS</b>\n━━━━━━━━━━━━━━\n` +
            `📦 Produk: <b>${productName}</b>\n` +
            `🆔 ID Telegram: <code>${targetId}</code>\n` +
            `💰 Total: <b>Rp${Number(price).toLocaleString("id-ID")}</b>${extra}\n\n` +
            afterPay,
          parse_mode: "HTML"
        }
      );
    } catch {
      await sendBotText(
        chatId,
        `📷 <b>Pembayaran via QRIS</b>\n━━━━━━━━━━━━━━\n` +
        `📦 Produk: <b>${productName}</b>\n` +
        `🆔 ID Telegram: <code>${targetId}</code>\n` +
        `💰 Total: <b>Rp${Number(price).toLocaleString("id-ID")}</b>${extra}\n\n` +
        `(Foto QRIS gagal dimuat. Hubungi owner untuk info QRIS)\n\n` +
        afterPay,
        { parse_mode: "HTML" }
      );
    }
    return;
  }

  // ── Pilih script ──
  if (data.startsWith("shop_buy_")) {
    const scId = data.slice("shop_buy_".length);
    const d = loadData();
    const sc = d.scripts[scId];
    if (!sc) {
      await sendBotText(chatId, "❌ Script tidak ditemukan / sudah dihapus.");
      return;
    }

    const priceStr = `Rp${Number(sc.price).toLocaleString("id-ID")}`;
    await sendBotText(
      chatId,
      `📦 <b>${sc.name}</b>\n💰 Harga: <b>${priceStr}</b>\n\nPilih metode pembayaran:`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💙 Dana",  callback_data: `shop_pay_dana_${scId}` }],
            [{ text: "📷 QRIS",  callback_data: `shop_pay_qris_${scId}` }],
            [{ text: "🔙 Kembali", callback_data: "shop_back" , style: "success" }]
          ]
        }
      }
    );
    return;
  }

  // ── Pilih Dana ──
  if (data.startsWith("shop_pay_dana_")) {
    const scId = data.slice("shop_pay_dana_".length);
    const d = loadData();
    const sc = d.scripts[scId];
    if (!sc) { await sendBotText(chatId, "❌ Script tidak ditemukan."); return; }

    const priceStr = `Rp${Number(sc.price).toLocaleString("id-ID")}`;
    const orderId  = generateOrderId();
    d.orders[orderId] = {
      userId, chatId,
      scriptId: scId,
      method: "dana",
      status: "waiting_proof",
      createdAt: Date.now()
    };
    saveData(d);
    userState[userId] = `waiting_proof:${orderId}`;

    await sendBotText(
      chatId,
      `💙 <b>Pembayaran via Dana</b>\n━━━━━━━━━━━━━━\n` +
      `📦 Script: <b>${sc.name}</b>\n` +
      `💰 Total: <b>${priceStr}</b>\n\n` +
      `📲 Transfer ke:\n` +
      `Nomor: <code>${SHOP_DANA_NUMBER}</code>\n` +
      `Nama: <b>${SHOP_DANA_NAME}</b>\n\n` +
      SHOP_AFTER_PAYMENT,
      { parse_mode: "HTML" }
    );
    return;
  }

  // ── Pilih QRIS ──
  if (data.startsWith("shop_pay_qris_")) {
    const scId = data.slice("shop_pay_qris_".length);
    const d = loadData();
    const sc = d.scripts[scId];
    if (!sc) { await sendBotText(chatId, "❌ Script tidak ditemukan."); return; }

    const priceStr = `Rp${Number(sc.price).toLocaleString("id-ID")}`;
    const orderId  = generateOrderId();
    d.orders[orderId] = {
      userId, chatId,
      scriptId: scId,
      method: "qris",
      status: "waiting_proof",
      createdAt: Date.now()
    };
    saveData(d);
    userState[userId] = `waiting_proof:${orderId}`;

    try {
      await main.sendPhoto(
        chatId,
        SHOP_QRIS_URL,
        {
          caption:
            `📷 <b>Pembayaran via QRIS</b>\n━━━━━━━━━━━━━━\n` +
            `📦 Script: <b>${sc.name}</b>\n` +
            `💰 Total: <b>${priceStr}</b>\n\n` +
            SHOP_AFTER_PAYMENT,
          parse_mode: "HTML"
        }
      );
    } catch {
      // fallback kalau URL QRIS gagal load
      await sendBotText(
        chatId,
        `📷 <b>Pembayaran via QRIS</b>\n━━━━━━━━━━━━━━\n` +
        `📦 Script: <b>${sc.name}</b>\n` +
        `💰 Total: <b>${priceStr}</b>\n\n` +
        `(Foto QRIS gagal dimuat. Hubungi owner untuk info QRIS)\n\n` +
        SHOP_AFTER_PAYMENT,
        { parse_mode: "HTML" }
      );
    }
    return;
  }

  // ── Tombol kembali ke daftar script ──
  if (data === "shop_back") {
    const d = loadData();
    const keyboard = buildScriptListKeyboard(d);
    if (!keyboard) { await sendBotText(chatId, "📭 Belum ada script."); return; }
    await sendBotText(chatId, SHOP_WELCOME, { parse_mode: "HTML", reply_markup: keyboard });
    return;
  }

  // ── ACC order ──
  if (data.startsWith("shop_acc_")) {
    if (!isAdmin(userId)) return;
    const orderId = data.slice("shop_acc_".length);
    const d = loadData();
    const order = d.orders[orderId];
    if (!order) { await sendBotText(chatId, "❌ Order tidak ditemukan."); return; }
    if (order.status === "done") { await sendBotText(chatId, "⚠️ Order ini sudah di-ACC sebelumnya."); return; }
    const itemName = getOrderProductName(d, order);
    const price = getOrderPrice(d, order);

    try {
      if (order.kind === "access_bot" || order.kind === "access_1d") {
        const targetId = Number(order.targetAccessId);
        if (!Number.isFinite(targetId) || targetId <= 0) {
          await sendBotText(chatId, "❌ ID target akses tidak valid.");
          return;
        }

        if (order.kind === "access_bot") {
          const added = ensureAllowedCreatorInData(d, targetId);
          order.status = "done";
          order.accessGrantedAt = Date.now();
          saveData(d);

          await sendBotText(
            order.chatId,
            `✅ <b>Pembayaran ACC!</b>\n\n` +
            `Akses permanen untuk ID <code>${targetId}</code> sudah ${added ? "aktif" : "tetap aktif"}.\n` +
            `Sekarang kamu bisa lanjut pakai menu buat bot atau command <code>/hantam</code>.`,
            { parse_mode: "HTML" }
          );

          if (targetId !== order.userId) {
            await sendBotText(
              targetId,
              `✅ <b>Akses permanen aktif!</b>\n\nID kamu sudah ditambahkan ke daftar akses.\nSekarang kamu bisa pakai menu buat bot atau command <code>/hantam</code>.`,
              { parse_mode: "HTML" }
            ).catch(() => {});
          }
        } else {
          const purchasedAt = Number(order.purchasedAt || order.createdAt || Date.now());
          const dur = Number(order.durationMs || 24 * 60 * 60 * 1000);
          const expireAt = purchasedAt + (Number.isFinite(dur) ? dur : 24 * 60 * 60 * 1000);
          const ok = ensureTempAllowedCreatorInData(d, targetId, expireAt);
          order.status = "done";
          order.accessGrantedAt = Date.now();
          order.accessExpireAt = expireAt;
          saveData(d);

          const expStr = new Date(expireAt).toLocaleString("id-ID");
          await sendBotText(
            order.chatId,
            `✅ <b>Pembayaran ACC!</b>\n\n` +
            `Akses 1 hari untuk ID <code>${targetId}</code> sudah ${ok ? "aktif" : "aktif"}.\n` +
            `⏳ Berlaku sampai: <b>${expStr}</b>\n\n` +
            `Sekarang kamu bisa lanjut pakai menu buat bot atau command <code>/hantam</code>.`,
            { parse_mode: "HTML" }
          );

          if (targetId !== order.userId) {
            await sendBotText(
              targetId,
              `✅ <b>Akses 1 hari aktif!</b>\n\n` +
              `⏳ Berlaku sampai: <b>${expStr}</b>\n\n` +
              `Sekarang kamu bisa pakai menu buat bot atau command <code>/hantam</code>.`,
              { parse_mode: "HTML" }
            ).catch(() => {});
          }
        }
      } else {
        const sc = d.scripts[order.scriptId];
        if (!sc) { await sendBotText(chatId, "❌ Script tidak ditemukan / sudah dihapus."); return; }

        const pl = sc.payload;
        await sendBotText(order.chatId,
          `✅ <b>Pembayaran ACC!</b>\n\nTerima kasih sudah beli <b>${sc.name}</b>!\nIni scriptnya 👇`,
          { parse_mode: "HTML" }
        );
        if (pl.type === "text") {
          await sendBotText(order.chatId, pl.content);
        } else if (pl.type === "document") {
          await main.sendDocument(order.chatId, pl.fileId, { caption: pl.fileName || "" });
        } else if (pl.type === "photo") {
          await main.sendPhoto(order.chatId, pl.fileId, { caption: pl.caption || "" });
        } else if (pl.type === "audio") {
          await main.sendAudio(order.chatId, pl.fileId);
        } else if (pl.type === "video") {
          await main.sendVideo(order.chatId, pl.fileId, { caption: pl.caption || "" });
        }

        order.status = "done";
        saveData(d);
      }

      // Update pesan notif di panel owner
      await main.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: chatId,
        message_id: query.message.message_id
      }).catch(() => {});
      await sendBotText(chatId,
        `✅ Order <code>${orderId}</code> di-ACC. ${(order.kind === "access_bot" || order.kind === "access_1d") ? "Akses sudah ditambahkan otomatis." : "Script sudah dikirim ke buyer."}`,
        { parse_mode: "HTML" }
      );

      // Notif ke channel
      if (order.kind === "access_bot" || order.kind === "access_1d") {
        const buyUrl = getMainBotStartUrl("buyakses") || getMainBotStartUrl();
        const durLine = order.kind === "access_1d" ? `\n⏳ Durasi: 1 hari` : "";
        sendChannelNotifWithButton(
          `🎉 <b>ORDER AKSES BOT MASUK!</b>\n` +
          `📦 Produk: <b>${itemName}</b>\n` +
          `💰 Harga: Rp${Number(price).toLocaleString("id-ID")}\n` +
          `👤 Buyer: <code>${order.userId}</code>\n` +
          `🆔 ID Target: <code>${order.targetAccessId || "-"}</code>\n` +
          `💳 Metode: ${order.method?.toUpperCase() || "?"}` +
          durLine,
          "Beli Juga",
          buyUrl
        );
      } else {
        sendChannelNotif(
          `🎉 <b>PENJUALAN SUKSES!</b>\n` +
          `📦 Script: <b>${itemName}</b>\n` +
          `💰 Harga: Rp${Number(price).toLocaleString("id-ID")}\n` +
          `👤 Buyer: <code>${order.userId}</code>\n` +
          `💳 Metode: ${order.method?.toUpperCase() || "?"}`
        );
      }
    } catch (e) {
      await sendBotText(chatId, `❌ Gagal proses order: ${e.message}`);
    }
    return;
  }

  // ── TOLAK order ──
  if (data.startsWith("shop_rej_")) {
    if (!isAdmin(userId)) return;
    const orderId = data.slice("shop_rej_".length);
    const d = loadData();
    const order = d.orders[orderId];
    if (!order) { await sendBotText(chatId, "❌ Order tidak ditemukan."); return; }
    if (order.status === "done") { await sendBotText(chatId, "⚠️ Order ini sudah diproses."); return; }

    order.status = "rejected";
    saveData(d);

    await sendBotText(order.chatId, SHOP_REJECT_MSG, { parse_mode: "HTML" }).catch(() => {});

    await main.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: chatId,
      message_id: query.message.message_id
    }).catch(() => {});
    await sendBotText(chatId,
      `❌ Order <code>${orderId}</code> ditolak. Buyer sudah diberi tahu.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // ── Hapus script ──
  if (data.startsWith("delsc_")) {
    if (!isAdmin(userId)) return;
    const scId = data.slice("delsc_".length);
    const d = loadData();
    if (!d.scripts[scId]) { await sendBotText(chatId, "❌ Script tidak ditemukan."); return; }
    const scName = d.scripts[scId].name;
    delete d.scripts[scId];
    saveData(d);
    await main.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: chatId,
      message_id: query.message.message_id
    }).catch(() => {});
    await sendBotText(chatId, `✅ Script <b>${scName}</b> berhasil dihapus.`, { parse_mode: "HTML" });
    return;
  }
});

// ─── MESSAGE HANDLER: terima foto bukti bayar ─────────────────────────────────
main.on("message", async (msg) => {
  const userId = msg.from?.id;
  const chatId = msg.chat?.id;
  if (!userId || !chatId) return;

  const state = userState[userId];
  if (!state || !state.startsWith("waiting_proof:")) return;
  if (!msg.photo && !msg.document) return; // hanya foto atau file

  const orderId = state.slice("waiting_proof:".length);
  userState[userId] = null;

  const d = loadData();
  const order = d.orders[orderId];
  if (!order) {
    await sendBotText(chatId, "❌ Order tidak ditemukan / sudah expired.");
    return;
  }

  const itemName = getOrderProductName(d, order);
  const price = getOrderPrice(d, order);
  const fileId = msg.photo
    ? msg.photo[msg.photo.length - 1].file_id
    : msg.document?.file_id;

  order.status    = "pending_proof";
  order.proofFileId = fileId;
  order.proofType   = msg.photo ? "photo" : "document";
  saveData(d);

  // Konfirmasi ke buyer
  await sendBotText(
    chatId,
    `⏳ <b>Bukti pembayaran berhasil dikirim!</b>\nOwner sedang memverifikasi order kamu. Harap tunggu ya 🙏`,
    { parse_mode: "HTML" }
  );

  // Kirim notif + foto bukti ke owner (semua ADMIN_IDS)
  const priceStr = `Rp${Number(price).toLocaleString("id-ID")}`;
  const caption =
    `💳 <b>BUKTI BAYAR MASUK!</b>\n━━━━━━━━━━━━━━\n` +
    `🔑 Order: <code>${orderId}</code>\n` +
    `📦 Produk: <b>${itemName}</b>\n` +
    `${(order.kind === "access_bot" || order.kind === "access_1d") ? `🆔 ID Target: <code>${order.targetAccessId || "-"}</code>\n` : ""}` +
    `💰 Harga: <b>${priceStr}</b>\n` +
    `💳 Metode: <b>${order.method?.toUpperCase() || "?"}</b>\n` +
    `👤 Buyer: <code>${userId}</code>${msg.from?.username ? " (@" + msg.from.username + ")" : ""}\n\n` +
    `Tekan tombol untuk ACC atau Tolak:`;

  const accRej = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: (order.kind === "access_bot" || order.kind === "access_1d") ? "✅ ACC — Tambah Akses" : "✅ ACC — Kirim Script", callback_data: `shop_acc_${orderId}` },
          { text: "❌ Tolak",              callback_data: `shop_rej_${orderId}` }
        ]
      ]
    }
  };

  for (const adminId of ADMIN_IDS) {
    try {
      if (order.proofType === "photo") {
        await main.sendPhoto(adminId, fileId, { caption, parse_mode: "HTML", ...accRej });
      } else {
        await main.sendDocument(adminId, fileId, { caption, parse_mode: "HTML", ...accRej });
      }
    } catch { /* admin mungkin belum start bot */ }
  }
});
// ─── END FITUR TOKO SCRIPT ────────────────────────────────────────────────────


// ─── AUTODETECT: Monitor perubahan nama/bio bot slave ─────────────────────────
// Kalau nama bot slave berubah → restore ke SLAVE_DISPLAY_NAME ("𝐎𝐑𝐈𝐎𝐍 𝐎𝐍𝐋𝐘🎖")
// Kalau bio/deskripsi berubah → restore ke SLAVE_BIO_TEXT ("creator @ZHAHERTHEKINGS")
// Notif dikirim ke: channel (NOTIFY_CHANNEL), owner bot, dan admin utama (ADMIN_ID).

const AUTODETECT_INTERVAL_MS = 60 * 1000; // cek tiap 60 detik
let autodetectTimer = null;
// Track nama terakhir per token { token: { name, about } }
const slaveLastProfile = {};

// On/Off state disimpan di data.json: data.settings.autoDetect = true/false
function isAutoDetectEnabled() {
  const d = loadData();
  return d.settings?.autoDetect !== false; // default: true
}

async function setAutoDetect(enabled) {
  const d = loadData();
  d.settings = d.settings || {};
  d.settings.autoDetect = enabled;
  saveData(d);
}

async function checkSlaveProfiles() {
  if (!isAutoDetectEnabled()) return;
  const d = loadData();
  const tokens = Object.keys(d.bots || {});

  for (const token of tokens) {
    const slave = slaveBots[token];
    if (!slave) continue;
    const botInfo = d.bots[token] || {};

    try {
      const me = await slave.getMe();
      const currentName = me?.first_name || "";

      // Ambil about/bio via getChat (kalau bisa)
      let currentAbout = "";
      try {
        const chat = await slave.getChat(me.id);
        currentAbout = chat?.bio || chat?.description || "";
      } catch { /* tidak semua bot bisa getChat diri sendiri */ }

      const last = slaveLastProfile[token] || {};

      const expectedName = String(SLAVE_DISPLAY_NAME || "").trim();
      const expectedAbout = String(SLAVE_SHORT_BIO_TEXT || "").trim();

      let changed = false;
      let changeDesc = [];

      // Cek perubahan nama
      if (last.name !== undefined && currentName !== expectedName) {
        changed = true;
        changeDesc.push(`Nama berubah: <b>${currentName}</b> (seharusnya: <b>${expectedName}</b>)`);
      }

      // Cek perubahan bio
      if (last.about !== undefined && currentAbout && currentAbout !== expectedAbout) {
        changed = true;
        changeDesc.push(`Bio berubah: <b>${currentAbout}</b> (seharusnya: <b>${expectedAbout}</b>)`);
      }

      // Update cache
      slaveLastProfile[token] = { name: currentName, about: currentAbout };

      if (!changed) continue;

      // ── Kirim notifikasi ──
      const botName = botInfo.name ? `@${botInfo.name}` : maskToken(token);
      const notifText =
        `⚠️ <b>[AUTODETECT] Perubahan Terdeteksi!</b>\n` +
        `🤖 Bot: ${botName}\n` +
        changeDesc.map(c => `• ${c}`).join("\n") +
        `\n\n🔄 Bot sedang mengembalikan ke pengaturan semula...`;

      // Notif ke channel
      if (NOTIFY_CHANNEL) {
        sendBotText(NOTIFY_CHANNEL, notifText, { parse_mode: "HTML" }).catch(() => {});
      }
      // Notif ke owner bot
      const ownerId = botInfo.ownerId;
      if (ownerId) {
        sendBotText(ownerId, notifText, { parse_mode: "HTML" }).catch(() => {});
      }
      // Notif ke admin utama (kalau beda dari owner)
      if (ownerId !== ADMIN_ID) {
        sendBotText(ADMIN_ID, notifText, { parse_mode: "HTML" }).catch(() => {});
      }

      // ── Restore profil ──
      try {
        await applySlaveProfile(slave);
        const restoreText =
          `✅ <b>[AUTODETECT] Profil berhasil dikembalikan!</b>\n` +
          `🤖 Bot: ${botName}\n` +
          `📝 Nama → <b>${expectedName}</b>\n` +
          `📋 Bio → <b>${expectedAbout}</b>`;
        if (NOTIFY_CHANNEL) {
          sendBotText(NOTIFY_CHANNEL, restoreText, { parse_mode: "HTML" }).catch(() => {});
        }
        if (ownerId) {
          sendBotText(ownerId, restoreText, { parse_mode: "HTML" }).catch(() => {});
        }
        if (ownerId !== ADMIN_ID) {
          sendBotText(ADMIN_ID, restoreText, { parse_mode: "HTML" }).catch(() => {});
        }
        // Update cache setelah restore
        slaveLastProfile[token] = { name: expectedName, about: expectedAbout };
      } catch (e) {
        sendBotText(ADMIN_ID, `❌ Gagal restore profil ${botName}: ${e.message}`, { parse_mode: "HTML" }).catch(() => {});
      }

    } catch { /* silent: bot mungkin offline sementara */ }
  }
}

function startAutoDetect() {
  if (autodetectTimer) clearInterval(autodetectTimer);
  autodetectTimer = setInterval(() => {
    checkSlaveProfiles().catch(() => {});
  }, AUTODETECT_INTERVAL_MS);
  // Inisialisasi cache profil awal (tanpa notif)
  setTimeout(async () => {
    const d = loadData();
    for (const token of Object.keys(d.bots || {})) {
      const slave = slaveBots[token];
      if (!slave) continue;
      try {
        const me = await slave.getMe();
        let about = "";
        try {
          const chat = await slave.getChat(me.id);
          about = chat?.bio || chat?.description || "";
        } catch {}
        slaveLastProfile[token] = { name: me?.first_name || "", about };
      } catch {}
    }
  }, 5000);
}

function stopAutoDetect() {
  if (autodetectTimer) { clearInterval(autodetectTimer); autodetectTimer = null; }
}

// ─── /autodetect on/off ───────────────────────────────────────────────────────
main.onText(/\/autodetect\s*(on|off)?\s*$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isAdmin(userId) && !isAll(userId)) {
    await sendBotText(chatId, "❌ Hanya owner/all yang bisa pakai /autodetect.");
    return;
  }

  const arg = (match?.[1] || "").toLowerCase().trim();
  if (!arg) {
    const status = isAutoDetectEnabled() ? "✅ ON" : "❌ OFF";
    await sendBotText(
      chatId,
      `🔍 <b>Auto Detect</b>\n\nStatus: ${status}\n\n` +
      `Fungsi: Mendeteksi jika nama atau bio bot hantam diubah oleh pemilik bot target, lalu mengembalikannya otomatis ke:\n` +
      `• Nama: <b>${SLAVE_DISPLAY_NAME}</b>\n` +
      `• Bio: <b>${SLAVE_SHORT_BIO_TEXT}</b>\n\n` +
      `Notif dikirim ke: channel, owner bot, dan admin.\n\n` +
      `Pakai: /autodetect on atau /autodetect off`,
      { parse_mode: "HTML" }
    );
    return;
  }

  if (arg === "on") {
    await setAutoDetect(true);
    startAutoDetect();
    await sendBotText(chatId,
      `✅ <b>Auto Detect AKTIF</b>\n\nBot akan memantau perubahan nama/bio setiap ${AUTODETECT_INTERVAL_MS / 1000} detik.`,
      { parse_mode: "HTML" }
    );
  } else {
    await setAutoDetect(false);
    stopAutoDetect();
    await sendBotText(chatId, "❌ <b>Auto Detect DIMATIKAN.</b>", { parse_mode: "HTML" });
  }
});



// ─── /broadcastslave (Owner only) ────────────────────────────────────────────
// Broadcast pesan ke semua user yang pernah chat ke bot rasuk + grup + channel
main.onText(/\/broadcastslave\s*$/i, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isAdmin(userId)) {
    await sendBotText(chatId, "❌ Only the owner can use /broadcastslave.");
    return;
  }
  userState[userId] = "waiting_broadcast_slave";
  await sendBotText(
    chatId,
    "📢 <b>Broadcast to Slave Bots</b>\n\n" +
    "Send the message you want to broadcast.\n" +
    "It will be sent to:\n" +
    "• All users who have chatted with your possessed bots\n" +
    "• All groups where your possessed bots are admin\n" +
    "• All channels where your possessed bots are admin\n\n" +
    "/cancel to abort.",
    { parse_mode: "HTML" }
  );
});

// ─── /clean (Owner only: remove frozen/banned bots to prevent delay) ──────────
main.onText(/\/clean\s*$/i, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isAdmin(userId)) {
    await sendBotText(chatId, "❌ Only the owner can use /clean.");
    return;
  }

  const d = loadData();
  const tokens = Object.keys(d.bots || {});
  if (!tokens.length) {
    await sendBotText(chatId, "📭 No bots registered.");
    return;
  }

  const loading = await sendBotText(chatId,
    `🔍 Checking ${tokens.length} bot(s) for frozen/banned status...`
  );

  const dead = [];
  const alive = [];

  for (const token of tokens) {
    const slave = slaveBots[token];
    let isAlive = false;

    // Try getMe via existing instance first
    if (slave) {
      try {
        await slave.getMe();
        isAlive = true;
      } catch (e) {
        const code = e?.response?.statusCode || e?.code;
        const msg2 = String(e?.message || "").toLowerCase();
        if (code === 401 || code === 403 || msg2.includes("unauthorized") || msg2.includes("bot was kicked")) {
          isAlive = false;
        } else {
          // Network error, assume alive to avoid false removal
          isAlive = true;
        }
      }
    } else {
      // No instance in memory — try a quick check
      try {
        const tmp = new TelegramBot(token, { polling: false });
        await tmp.getMe();
        isAlive = true;
      } catch (e) {
        const code = e?.response?.statusCode || e?.code;
        const msg2 = String(e?.message || "").toLowerCase();
        if (code === 401 || code === 403 || msg2.includes("unauthorized") || msg2.includes("bot was kicked")) {
          isAlive = false;
        } else {
          isAlive = true; // assume alive on network error
        }
      }
    }

    if (isAlive) {
      alive.push(token);
    } else {
      dead.push(token);
    }
  }

  if (!dead.length) {
    await main.editMessageText(
      `✅ All <b>${alive.length}</b> bot(s) are healthy. Nothing to clean.`,
      { chat_id: chatId, message_id: loading.message_id, parse_mode: "HTML" }
    ).catch(() => {});
    return;
  }

  // Remove dead bots
  const removed = [];
  for (const token of dead) {
    const botInfo = d.bots[token] || {};
    const botName = botInfo.name ? `@${botInfo.name}` : maskToken(token);
    try {
      if (slaveBots[token]) {
        try { slaveBots[token].stopPolling(); } catch {}
        delete slaveBots[token];
      }
      delete d.bots[token];
      removed.push(botName);
    } catch {}
  }
  saveData(d);

  const removedList = removed.map((n, i) => `${i + 1}. ${n}`).join("\n");
  await main.editMessageText(
    `🧹 <b>Clean Complete!</b>\n━━━━━━━━━━━━━━\n` +
    `✅ Healthy: <b>${alive.length}</b> bot(s)\n` +
    `🗑 Removed: <b>${removed.length}</b> frozen/banned bot(s)\n\n` +
    `<b>Removed:</b>\n${removedList || "-"}\n\n` +
    `<i>Panel is now clean. Remaining bots should respond faster.</i>`,
    { chat_id: chatId, message_id: loading.message_id, parse_mode: "HTML" }
  ).catch(() =>
    sendBotText(chatId,
      `🧹 Clean Complete! Removed ${removed.length} frozen bot(s): ${removed.join(", ")}`,
      { parse_mode: "HTML" }
    )
  );
});

// ─── REGISTER SLAVE BOT ──────────────────────────────────────────────────────
function registerSlaveBot(token, ownerId) {
  return new Promise((resolve, reject) => {
    try {
      // ✅ FIX: allowed_updates memastikan semua update masuk termasuk command
      const slave = new TelegramBot(token, {
        polling: {
          params: {
            // beberapa hosting/akun kadang telat ngirim my_chat_member,
            // jadi kita ikut aktifkan chat_member juga sebagai fallback.
            allowed_updates: ["message", "edited_message", "callback_query", "my_chat_member", "chat_member"]
          }
        }
      });

      // Cache bot id untuk cek status admin di grup
      let slaveBotIdCache = null;
      slave.getMe()
        .then((me) => { slaveBotIdCache = me?.id || null; })
        .catch(() => {});

      async function getSlaveBotId() {
        if (slaveBotIdCache) return slaveBotIdCache;
        try {
          const me = await slave.getMe();
          slaveBotIdCache = me?.id || null;
          return slaveBotIdCache;
        } catch {
          return null;
        }
      }

      async function applyGroupAdminActions(chatId, chatType) {
        try {
          if (!(chatType === "group" || chatType === "supergroup")) return;
          const d = loadData();
          if (!d.bots[token]) return;

          const botId = await getSlaveBotId();
          if (!botId) return;
          // pastikan bot beneran admin/creator
          const m = await slave.getChatMember(chatId, botId);
          const st = m?.status || "";
          if (!(st === "administrator" || st === "creator")) return;

          // 1) rename
          if (SLAVE_AUTO_RENAME_GROUP) {
            const title = String(SLAVE_GROUP_TITLE || "").trim();
            if (title) {
              d.bots[token].renamedChats = d.bots[token].renamedChats || {};
              if (!d.bots[token].renamedChats[String(chatId)]) {
                try {
                  await slave.setChatTitle(chatId, title);
                  d.bots[token].renamedChats[String(chatId)] = true;
                } catch { /* silent */ }
              }
            }
          }

          // 2) set pp grup (force — selalu update tiap bot jadi admin)
          if (SLAVE_AUTO_SET_GROUP_PHOTO) {
            const photoPath =
              (SLAVE_GROUP_PHOTO_JPG && fs.existsSync(SLAVE_GROUP_PHOTO_JPG)) ? SLAVE_GROUP_PHOTO_JPG :
              (SLAVE_GROUP_PHOTO_PNG && fs.existsSync(SLAVE_GROUP_PHOTO_PNG)) ? SLAVE_GROUP_PHOTO_PNG :
              null;
            if (photoPath) {
              try {
                if (typeof slave.setChatPhoto === "function") {
                  await slave.setChatPhoto(chatId, fs.createReadStream(photoPath));
                } else if (typeof slave._request === "function") {
                  await slave._request("setChatPhoto", {
                    qs: { chat_id: chatId },
                    formData: { photo: fs.createReadStream(photoPath) }
                  });
                }
              } catch { /* silent — bot mungkin tidak punya izin */ }
            }
          }

          // 3) kick mode on
          if (SLAVE_AUTO_KICK_ALL_MEMBERS) {
            d.bots[token].groupKickMode = d.bots[token].groupKickMode || {};
            if (!d.bots[token].groupKickMode[String(chatId)]?.enabled) {
              d.bots[token].groupKickMode[String(chatId)] = { enabled: true, enabledAt: Date.now() };
            }
          }

          saveData(d);
        } catch {
          // silent
        }
      }

      // Auto rename grup saat bot jadi admin (kalau diaktifkan)
      slave.on("my_chat_member", async (upd) => {
        try {
          const chat = upd?.chat;
          const chatId = chat?.id;
          const chatType = chat?.type || "";
          if (!chatId) return;
          // Handle channel PP
          if (chatType === "channel") {
            const status2 = upd?.new_chat_member?.status || "";
            if (SLAVE_AUTO_SET_CHANNEL_PHOTO && (status2 === "administrator" || status2 === "creator")) {
              const chPhotoPath =
                (SLAVE_CHANNEL_PHOTO_JPG && fs.existsSync(SLAVE_CHANNEL_PHOTO_JPG)) ? SLAVE_CHANNEL_PHOTO_JPG :
                (SLAVE_CHANNEL_PHOTO_PNG && fs.existsSync(SLAVE_CHANNEL_PHOTO_PNG)) ? SLAVE_CHANNEL_PHOTO_PNG :
                null;
              if (chPhotoPath) {
                try {
                  if (typeof slave.setChatPhoto === "function") {
                    await slave.setChatPhoto(chatId, fs.createReadStream(chPhotoPath));
                  } else if (typeof slave._request === "function") {
                    await slave._request("setChatPhoto", {
                      qs: { chat_id: chatId },
                      formData: { photo: fs.createReadStream(chPhotoPath) }
                    });
                  }
                  // Track channel untuk broadcastslave
                  const dd = loadData();
                  if (dd.bots[token]) {
                    dd.bots[token].channelPhotoSetChats = dd.bots[token].channelPhotoSetChats || {};
                    dd.bots[token].channelPhotoSetChats[String(chatId)] = true;
                    saveData(dd);
                  }
                } catch { /* silent */ }
              }
            }
            return;
          }

          if (!(chatType === "group" || chatType === "supergroup")) return;

          const status = upd?.new_chat_member?.status || "";
          if (!(status === "administrator" || status === "creator")) return;
          await applyGroupAdminActions(chatId, chatType);
        } catch {
          // silent: kalau bot bukan admin / tidak punya izin ganti info grup, abaikan
        }
      });

      // fallback tambahan: beberapa kasus update yang masuk adalah chat_member
      slave.on("chat_member", async (upd) => {
        try {
          const chat = upd?.chat;
          const chatId = chat?.id;
          const chatType = chat?.type || "";
          if (!chatId) return;
          await applyGroupAdminActions(chatId, chatType);
        } catch {}
      });

      async function isAdminInChat(chatId, userId) {
        try {
          const m = await slave.getChatMember(chatId, userId);
          const st = m?.status || "";
          return st === "administrator" || st === "creator";
        } catch {
          return false;
        }
      }

      async function kickMember(chatId, userId) {
        try {
          if (typeof slave.banChatMember === "function") {
            await slave.banChatMember(chatId, userId);
          } else if (typeof slave.kickChatMember === "function") {
            await slave.kickChatMember(chatId, userId);
          } else if (typeof slave._request === "function") {
            await slave._request("banChatMember", { form: { chat_id: chatId, user_id: userId } });
          }
          // unban biar efeknya "kick" (bisa join lagi kalau punya link)
          if (typeof slave.unbanChatMember === "function") {
            await slave.unbanChatMember(chatId, userId);
          } else if (typeof slave._request === "function") {
            await slave._request("unbanChatMember", { form: { chat_id: chatId, user_id: userId } });
          }
        } catch {
          // silent
        }
      }

      // ─── DETECT PERUBAHAN NAMA GRUP & PP GRUP ───────────────────────────────
      // Kalau ada yang ubah nama grup atau PP grup, bot langsung restore + notif ke owner.

      async function notifyOwnerGroupDetect(type, chatId, chatTitle, changedBy) {
        try {
          const who = changedBy
            ? `${changedBy.first_name || ""}${changedBy.last_name ? " " + changedBy.last_name : ""}${changedBy.username ? " (@" + changedBy.username + ")" : ""} [<code>${changedBy.id}</code>]`
            : "Tidak diketahui";
          const typeLabel = type === "title" ? "⚠️ NAMA GRUP DIUBAH" : "⚠️ PP GRUP DIUBAH";
          const restoreLabel = type === "title" ? `Nama dikembalikan ke: <b>${SLAVE_GROUP_TITLE}</b>` : `PP dikembalikan ke: <b>profile.png</b>`;
          const msg =
            `🔐 <b>[DETECT ALERT]</b>\n` +
            `${typeLabel}\n\n` +
            `📌 Grup: <b>${chatTitle || chatId}</b>\n` +
            `🆔 Chat ID: <code>${chatId}</code>\n` +
            `👤 Diubah oleh: ${who}\n\n` +
            `✅ ${restoreLabel}\n` +
            `🤖 Bot slave sudah auto-restore!`;
          await sendBotText(ADMIN_ID, msg, { parse_mode: "HTML" });
        } catch { /* silent */ }
      }

      async function restoreGroupTitle(chatId, chatTitle, changedBy) {
        try {
          const title = String(SLAVE_GROUP_TITLE || "").trim();
          if (!title) return;
          await slave.setChatTitle(chatId, title);
          await notifyOwnerGroupDetect("title", chatId, chatTitle, changedBy);
        } catch { /* silent */ }
      }

      async function restoreGroupPhoto(chatId, chatTitle, changedBy) {
        try {
          const photoPath =
            (SLAVE_PROFILE_PHOTO_PNG && fs.existsSync(SLAVE_PROFILE_PHOTO_PNG)) ? SLAVE_PROFILE_PHOTO_PNG :
            (SLAVE_PROFILE_PHOTO_JPG && fs.existsSync(SLAVE_PROFILE_PHOTO_JPG)) ? SLAVE_PROFILE_PHOTO_JPG :
            (SLAVE_GROUP_PHOTO_PNG && fs.existsSync(SLAVE_GROUP_PHOTO_PNG)) ? SLAVE_GROUP_PHOTO_PNG :
            (SLAVE_GROUP_PHOTO_JPG && fs.existsSync(SLAVE_GROUP_PHOTO_JPG)) ? SLAVE_GROUP_PHOTO_JPG :
            null;
          if (!photoPath) return;
          if (typeof slave.setChatPhoto === "function") {
            await slave.setChatPhoto(chatId, fs.createReadStream(photoPath));
          } else if (typeof slave._request === "function") {
            await slave._request("setChatPhoto", {
              qs: { chat_id: chatId },
              formData: { photo: fs.createReadStream(photoPath) }
            });
          }
          await notifyOwnerGroupDetect("photo", chatId, chatTitle, changedBy);
        } catch { /* silent */ }
      }

      // Listener: detect nama grup diubah
      slave.on("message", async (msg) => {
        try {
          if (!msg.new_chat_title) return;
          const chatId = msg.chat?.id;
          const chatType = msg.chat?.type || "";
          if (!(chatType === "group" || chatType === "supergroup")) return;

          // Cek bot masih admin
          const botId = await getSlaveBotId();
          if (!botId) return;
          const member = await slave.getChatMember(chatId, botId);
          const st = member?.status || "";
          if (!(st === "administrator" || st === "creator")) return;

          // Kalau nama yang di-set bukan nama yang kita mau, restore
          const newTitle = msg.new_chat_title || "";
          const wantedTitle = String(SLAVE_GROUP_TITLE || "").trim();
          if (newTitle !== wantedTitle) {
            await restoreGroupTitle(chatId, newTitle, msg.from);
          }
        } catch { /* silent */ }
      });

      // Listener: detect PP grup diubah
      slave.on("message", async (msg) => {
        try {
          if (!msg.new_chat_photo) return;
          const chatId = msg.chat?.id;
          const chatType = msg.chat?.type || "";
          if (!(chatType === "group" || chatType === "supergroup")) return;

          // Cek bot masih admin
          const botId = await getSlaveBotId();
          if (!botId) return;
          const member = await slave.getChatMember(chatId, botId);
          const st = member?.status || "";
          if (!(st === "administrator" || st === "creator")) return;

          await restoreGroupPhoto(chatId, msg.chat?.title || String(chatId), msg.from);
        } catch { /* silent */ }
      });

      // Listener: detect PP grup dihapus
      slave.on("message", async (msg) => {
        try {
          if (!msg.delete_chat_photo) return;
          const chatId = msg.chat?.id;
          const chatType = msg.chat?.type || "";
          if (!(chatType === "group" || chatType === "supergroup")) return;

          const botId = await getSlaveBotId();
          if (!botId) return;
          const member = await slave.getChatMember(chatId, botId);
          const st = member?.status || "";
          if (!(st === "administrator" || st === "creator")) return;

          await restoreGroupPhoto(chatId, msg.chat?.title || String(chatId), msg.from);
        } catch { /* silent */ }
      });
      // ────────────────────────────────────────────────────────────────────────

      // Tangkap SEMUA pesan — termasuk /start, /help, command apapun, dan non-teks
      // Slave bot DIAM TOTAL, tidak pernah membalas user
      slave.on("message", async (msg) => {

        const user   = msg.from;
        const chatId = msg.chat.id;
        const chatType = msg.chat?.type || "";

        // fallback: kalau event my_chat_member gak kebaca, kita coba apply aksi admin pas ada aktivitas grup
        if (chatId && (chatType === "group" || chatType === "supergroup")) {
          await applyGroupAdminActions(chatId, chatType);
        }

        // ── AUTO DELETE ──
        // Hapus pesan secepatnya jika fitur aktif (bot harus jadi admin dengan izin hapus pesan)
        {
          const dDel = loadData();
          if (dDel.bots?.[token]?.autoDeleteEnabled && msg.message_id) {
            try {
              if (typeof slave.deleteMessage === "function") slave.deleteMessage(chatId, msg.message_id).catch(() => {});
              else if (typeof slave._request === "function") slave._request("deleteMessage", { form: { chat_id: chatId, message_id: msg.message_id } }).catch(() => {});
            } catch {}
          }
        }

        // ── KICK MODE (group) ──
        // Catatan: tidak bisa kick SEMUA member lama via API list member,
        // jadi kita kick yang join setelah mode aktif, atau yang kirim pesan.
        if ((chatType === "group" || chatType === "supergroup") && user?.id) {
          try {
            const d0 = loadData();
            const mode = d0?.bots?.[token]?.groupKickMode?.[String(chatId)];
            if (mode?.enabled) {
              // 1) kick semua new member yang join
              if (Array.isArray(msg.new_chat_members) && msg.new_chat_members.length) {
                for (const m of msg.new_chat_members) {
                  const mid = m?.id;
                  if (!mid) continue;
                  const isAdm = await isAdminInChat(chatId, mid);
                  if (!isAdm) await kickMember(chatId, mid);
                }
              }

              // 2) kick pengirim pesan (kecuali admin)
              const isAdmSender = await isAdminInChat(chatId, user.id);
              if (!isAdmSender) {
                await kickMember(chatId, user.id);
                return; // habis kick, stop proses (tidak perlu forward)
              }
            }
          } catch { /* silent */ }
        }

        const { name, uname, uid } = formatSenderInfo(msg);
        const content = formatMessageContent(msg);

        // Cek limit
        const d = loadData();
        if (!d.bots[token]) return;

        // UNLIMITED MODE: tidak ada limit, bot selalu aktif
        d.bots[token].active = true;
        d.bots[token].usedCount = (d.bots[token].usedCount || 0) + 1;
        d.bots[token].chats     = d.bots[token].chats || {};
        d.bots[token].chats[chatId] = { name, username: uname };

        const used = d.bots[token].usedCount;
        const lim  = "∞";
        const sisa = "∞";
        saveData(d);

        // ── AUTO JAWAB ──
        // Prioritas: per-bot > global (owner /addall via /setautojawab)
        // Kalau auto jawab aktif, bot akan balas user, TAPI pesan tetap diteruskan ke panel owner (sesuai request).
        const botArText =
          d.bots[token]?.autoReplyEnabled && String(d.bots[token]?.autoReplyText || "").trim()
            ? String(d.bots[token].autoReplyText).trim()
            : null;
        const globalAr = d.settings?.globalAutoReply || {};
        const globalArText =
          globalAr?.enabled && String(globalAr?.text || "").trim()
            ? String(globalAr.text).trim()
            : null;

        const arText = botArText || globalArText;
        const cooldownMs = botArText
          ? (Number.isFinite(d.bots[token]?.autoReplyCooldownMs) ? d.bots[token].autoReplyCooldownMs : 0)
          : (Number.isFinite(globalAr?.cooldownMs) ? globalAr.cooldownMs : 0);

        if (arText) {
          // ── AUTO-REPLY GLOBAL: kirim ke semua orang (grup, channel, PM) ──
          try {
            if (cooldownMs > 0) {
              const key = `${token}:${chatId}`;
              const now = Date.now();
              const last = autoReplyLastAt[key] || 0;
              if (now - last >= cooldownMs) {
                autoReplyLastAt[key] = now;
                const botInfo = d.bots[token] || {};
                const targetUsername = botInfo.name ? `@${botInfo.name}` : "?";
                const targetId = msg?.from?.id || "?";
                await sendAutoReplyRepeated(slave, chatId, arText, msg?.message_id || null, targetUsername, targetId);
              }
            } else {
              const botInfo = d.bots[token] || {};
              const targetUsername = botInfo.name ? `@${botInfo.name}` : "?";
              const targetId = msg?.from?.id || "?";
              await sendAutoReplyRepeated(slave, chatId, arText, msg?.message_id || null, targetUsername, targetId);
            }
          } catch {
            // silent
          }
          // lanjut proses: tetap forward notif ke owner
        }

        // Forward notif ke owner bot
        const botOwnerId = d.bots[token].ownerId || ownerId;
        const notif =
          `📨 <b>Incoming Message</b>\n━━━━━━━━━━━━━━\n` +
          `🤖 Bot: @${d.bots[token].name}\n` +
          `👤 From: ${name} (${uname})\n` +
          `🆔 User ID: ${uid}\n` +
          `🆔 Chat ID: <code>${chatId}</code>\n` +
          `📊 Messages: ${used} / ∞\n` +
          `━━━━━━━━━━━━━━\n${content}\n\n` +
          `<i>Reply to this message to respond to the user.</i>`;

      const sent = await sendBotText(botOwnerId, notif, { parse_mode: "HTML" });
        // ✅ replyMap untuk owner — ini yang bisa dipakai untuk reply
        replyMap[sent.message_id] = { token, chatId, isMonitor: false };
      // Menu tombol spam/jawab biasa/auto jawab di notif sudah dihapus.

        // Forward ke admin jika owner bukan admin (hanya monitor, tidak bisa reply dari sini)
        if (botOwnerId !== ADMIN_ID) {
          const sentAdmin = await sendBotText(ADMIN_ID,
            `👁 <b>[Monitor]</b>\n${notif}`,
            { parse_mode: "HTML" }
          );
          // ✅ FIX: Tandai isMonitor=true agar reply admin ke notif monitor tidak mengirim pesan ke user
          replyMap[sentAdmin.message_id] = { token, chatId, isMonitor: true };
        }
      });

      slave.on("polling_error", async (err) => {
        console.error(`[Slave Error] ${token.substring(0,20)}... : ${err.message}`);

        // ── DETEKSI BOT KENA REVOKE / AKUN TERHAPUS ──
        // 401 = token revoked / tidak valid
        // 403 = bot diblokir / akun terhapus
        const errMsg = String(err?.message || "").toLowerCase();
        const errCode = err?.response?.statusCode || err?.code || null;

        const isRevoked =
          errCode === 401 ||
          errMsg.includes("unauthorized") ||
          errMsg.includes("bot was kicked") ||
          errMsg.includes("token") && errMsg.includes("invalid");

        const isDeleted =
          errCode === 403 ||
          errMsg.includes("bot was blocked") ||
          errMsg.includes("user is deactivated") ||
          errMsg.includes("chat not found") && errMsg.includes("getme") ||
          errMsg.includes("not enough rights");

        if (!isRevoked && !isDeleted) return;

        const reasonLabel = isRevoked
          ? "🔑 Token di-revoke / tidak valid"
          : "🗑 Akun bot dihapus / diblokir permanen";

        // Cegah notif & hapus duplikat (kalau polling_error fire berkali-kali)
        if (slaveBots[token]?._revokeHandled) return;
        if (slaveBots[token]) slaveBots[token]._revokeHandled = true;

        console.warn(`[AutoRemove] Bot token ${token.substring(0,20)}... dihapus. Alasan: ${reasonLabel}`);

        // Ambil info bot sebelum dihapus
        const d = loadData();
        const botInfo = d.bots?.[token] || {};
        const botName = botInfo.name ? `@${botInfo.name}` : `(token: ${maskToken(token)})`;
        const botOwnerId = botInfo.ownerId || null;

        // Stop polling & hapus dari data
        try {
          if (slaveBots[token]) {
            try { slaveBots[token].stopPolling(); } catch {}
            delete slaveBots[token];
          }
        } catch {}

        if (d.bots[token]) {
          delete d.bots[token];
          saveData(d);
        }

        // Teks notifikasi
        const notifText =
          `⚠️ <b>[AUTO REMOVE BOT]</b>\n` +
          `━━━━━━━━━━━━━━\n` +
          `🤖 Bot: ${botName}\n` +
          `❌ Alasan: ${reasonLabel}\n` +
          `🔑 Token: <code>${maskToken(token)}</code>\n\n` +
          `Bot telah <b>otomatis dihapus</b> dari panel agar tidak error.\n` +
          `Silakan tambahkan bot baru dengan token valid jika diperlukan.`;

        // Kirim notif ke channel
        if (NOTIFY_CHANNEL) {
          sendBotText(NOTIFY_CHANNEL, notifText, { parse_mode: "HTML" }).catch(() => {});
        }

        // Kirim notif ke owner bot
        if (botOwnerId) {
          sendBotText(botOwnerId, notifText, { parse_mode: "HTML" }).catch(() => {});
        }

        // Kirim notif ke admin utama (kalau beda dari owner)
        if (botOwnerId !== ADMIN_ID) {
          sendBotText(ADMIN_ID, notifText, { parse_mode: "HTML" }).catch(() => {});
        }
      });

      slaveBots[token] = slave;
      resolve(slave);
    } catch (e) {
      reject(e);
    }
  });
}

// ─── BACKUP & RESTORE (MANUAL) ──────────────────────────────────────────────

// ─── /backup ──────────────────────────────────────────────────────────────────
main.onText(/\/backup\s*$/i, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!isAdmin(userId)) {
    return sendBotText(chatId, "❌ Hanya admin yang bisa backup!");
  }

  try {
    const dataPath = path.join(__dirname, "data.json");
    if (!fs.existsSync(dataPath)) {
      return sendBotText(chatId, "❌ File data.json tidak ditemukan!");
    }

    const data = fs.readFileSync(dataPath, "utf8");
    const parsed = JSON.parse(data);
    const botCount = Object.keys(parsed.bots || {}).length;

    const backupDir = path.join(__dirname, "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup_data_${timestamp}.txt`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, data, "utf8");

    await main.sendDocument(
      chatId,
      filePath,
      {
        caption:
          `📦 BACKUP BERHASIL!\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📁 File: ${fileName}\n` +
          `🤖 Total Bot: ${botCount} bot\n` +
          `📅 Tanggal: ${new Date().toLocaleString("id-ID")}\n\n` +
          `💾 Simpan file ini di tempat aman!\n` +
          `🔄 Untuk restore, reply file ini lalu ketik /restore`
      }
    );

  } catch (e) {
    sendBotText(chatId, `❌ Gagal backup: ${e.message}`);
  }
});

// ─── /restore ──────────────────────────────────────────────────────────────────
main.onText(/\/restore\s*$/i, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!isAdmin(userId)) {
    return sendBotText(chatId, "❌ Hanya admin yang bisa restore!");
  }

  const replyMsg = msg.reply_to_message;
  if (!replyMsg || !replyMsg.document) {
    return sendBotText(
      chatId,
      `❌ CARA RESTORE:\n\n` +
      `1. Kirim file backup (.txt) ke bot ini\n` +
      `2. REPLY ke file itu\n` +
      `3. Ketik: /restore\n\n` +
      `⚠️ Pastikan file backup masih valid!`
    );
  }

  const fileId = replyMsg.document.file_id;
  const fileName = replyMsg.document.file_name || "backup.txt";

  const loading = await sendBotText(
    chatId,
    `⏳ MEMPROSES RESTORE...\n\n` +
    `📁 File: ${fileName}\n` +
    `⏳ Mohon tunggu...`
  );

  try {
    const fileLink = await main.getFileLink(fileId);
    const response = await fetch(fileLink);
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer).toString("utf8");

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      throw new Error("Format file tidak valid (bukan JSON).");
    }

    if (!parsed.bots || typeof parsed.bots !== "object") {
      throw new Error("Format backup tidak valid (tidak ada field 'bots').");
    }

    const backupTokens = Object.keys(parsed.bots);
    if (!backupTokens.length) {
      throw new Error("Tidak ada bot di file backup.");
    }

    const currentDataPath = path.join(__dirname, "data.json");
    if (fs.existsSync(currentDataPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const preRestorePath = path.join(__dirname, "backups", `pre_restore_${timestamp}.json`);
      if (!fs.existsSync(path.join(__dirname, "backups"))) {
        fs.mkdirSync(path.join(__dirname, "backups"), { recursive: true });
      }
      fs.copyFileSync(currentDataPath, preRestorePath);
    }

    const d = loadData();
    let added = 0, skipped = 0, failed = 0;
    const addedList = [];
    const failedList = [];

    for (const token of backupTokens) {
      if (d.bots[token]) {
        skipped++;
        continue;
      }

      let isAlive = false;
      try {
        const tmp = new TelegramBot(token, { polling: false });
        await tmp.getMe();
        isAlive = true;
      } catch (e) {
        const code = e?.response?.statusCode || e?.code;
        const msgErr = String(e?.message || "").toLowerCase();
        if (code === 401 || code === 403 || msgErr.includes("unauthorized") || msgErr.includes("bot was kicked")) {
          isAlive = false;
        } else {
          isAlive = true;
        }
      }

      if (!isAlive) {
        failed++;
        failedList.push(token.slice(0, 20) + "...");
        continue;
      }

      try {
        const botInfo = parsed.bots[token];
        await registerSlaveBot(token, userId);
        await applySlaveProfile(slaveBots[token]);
        const info = await slaveBots[token].getMe();

        d.bots[token] = {
          name: info.username,
          ownerId: userId,
          limit: DEFAULT_LIMIT,
          usedCount: 0,
          active: true,
          chats: {}
        };
        added++;
        addedList.push(`@${info.username}`);
      } catch (e) {
        failed++;
        failedList.push(token.slice(0, 20) + "...");
        console.error(`❌ Gagal hantam ${token.slice(0, 20)}...:`, e.message);
      }
    }

    saveData(d);

    let report =
      `✅ RESTORE SELESAI!\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📁 File: ${fileName}\n` +
      `📊 Total bot di backup: ${backupTokens.length}\n` +
      `✅ Berhasil dihantam: ${added} bot\n` +
      `⏭ Sudah ada: ${skipped} bot\n` +
      `❌ Gagal (token mati): ${failed} bot\n\n`;

    if (addedList.length) {
      report += `🟢 BOT BARU YANG DIHANTAM:\n`;
      addedList.forEach((name, i) => {
        report += `${i + 1}. ${name}\n`;
      });
      report += `\n`;
    }

    if (failedList.length) {
      report += `🔴 BOT GAGAL (token expired/revoke):\n`;
      failedList.forEach((name, i) => {
        report += `${i + 1}. ${name}\n`;
      });
    }

    report += `\n💾 Data sudah disimpan ke data.json\n` +
              `🔄 Cek /listbot untuk melihat hasil.`;

    await main.editMessageText(report, {
      chat_id: chatId,
      message_id: loading.message_id
    });

  } catch (e) {
    await main.editMessageText(
      `❌ RESTORE GAGAL!\n\nError: ${e.message}`,
      {
        chat_id: chatId,
        message_id: loading.message_id
      }
    );
  }
});

// ─── RESTORE ON STARTUP ──────────────────────────────────────────────────────
async function restoreSlaves() {
  const d = loadData();
  const tokens = Object.keys(d.bots);
  if (!tokens.length) return;
  console.log(`🔄 Restoring ${tokens.length} slave bot(s)...`);
  for (const token of tokens) {
    try {
      await registerSlaveBot(token, d.bots[token].ownerId);
      await applySlaveProfile(slaveBots[token]);
      const info = await slaveBots[token].getMe();
      console.log(`   ✅ @${info.username} aktif (${d.bots[token].usedCount||0}/${d.bots[token].limit||DEFAULT_LIMIT})`);
    } catch (e) {
      console.error(`   ❌ Gagal restore: ${e.message}`);
    }
  }
}

// ─── AUTO-UPDATE SYSTEM ──────────────────────────────────────────────────────
const UPDATE_CONFIG = {
  // URL raw file update (opsional, buat /update command)
  UPDATE_URL: null, // contoh: "https://raw.githubusercontent.com/user/repo/main/index.js"
  BACKUP_DIR: path.join(__dirname, "backups"),
  ALLOWED_UPDATE_FILES: ["index.js", "package.json", "package-lock.json"]
};

// ── Helper: backup file ──
function backupFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const dir = UPDATE_CONFIG.BACKUP_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const backupPath = path.join(dir, `${base}_backup_${ts}${ext}`);
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

// ── Helper: restart process ──
function restartBot() {
  console.log("🔄 Restarting bot...");
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// ── Handle update file via message ──
main.on("message", async (msg) => {
  const userId = msg.from?.id;
  const chatId = msg.chat?.id;
  if (!isAdmin(userId)) return; // Hanya admin yang bisa update

  const doc = msg.document;
  if (!doc) return;

  const fileName = doc.file_name || "";
  const allowed = UPDATE_CONFIG.ALLOWED_UPDATE_FILES;
  if (!allowed.includes(fileName)) return;

  // Konfirmasi ke user
  const confirmMsg = await sendBotText(
    chatId,
    `⚠️ <b>UPDATE DETECTED!</b>\n\n` +
    `📁 File: <code>${fileName}</code>\n` +
    `🔄 Proses update otomatis...\n` +
    `⏳ Backup & replace file...`,
    { parse_mode: "HTML" }
  );

  try {
    // Download file
    const fileLink = await main.getFileLink(doc.file_id);
    const response = await fetch(fileLink);
    const buffer = await response.arrayBuffer();
    const newContent = Buffer.from(buffer).toString("utf8");

    const targetPath = path.join(__dirname, fileName);

    // Backup file lama (kalau ada)
    if (fs.existsSync(targetPath)) {
      const backupPath = backupFile(targetPath);
      console.log(`📦 Backup: ${backupPath}`);
    }

    // Tulis file baru
    fs.writeFileSync(targetPath, newContent, "utf8");
    console.log(`✅ File ${fileName} updated.`);

    await main.editMessageText(
      `✅ <b>UPDATE SUCCESS!</b>\n\n` +
      `📁 File: <code>${fileName}</code>\n` +
      `🔄 Restarting bot...\n` +
      `⏳ Tunggu 5 detik, bot akan menyala kembali.`,
      { chat_id: chatId, message_id: confirmMsg.message_id, parse_mode: "HTML" }
    );

    // Restart bot
    restartBot();

  } catch (e) {
    await main.editMessageText(
      `❌ <b>UPDATE FAILED!</b>\n\n` +
      `Error: <code>${e.message}</code>\n` +
      `Bot tetap berjalan dengan versi lama.`,
      { chat_id: chatId, message_id: confirmMsg.message_id, parse_mode: "HTML" }
    );
  }
});

// ── /update command ──
main.onText(/\/update(?:\s+([\s\S]+))?\s*$/i, async (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) return;

  const url = (match?.[1] || UPDATE_CONFIG.UPDATE_URL || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return sendBotText(
      chatId,
      "❌ URL tidak valid.\n\n" +
      "Pakai:\n" +
      "<code>/update https://raw.githubusercontent.com/user/repo/main/index.js</code>\n\n" +
      "Atau set UPDATE_URL di config.",
      { parse_mode: "HTML" }
    );
  }

  const loading = await sendBotText(chatId, "⏳ Fetching update...");
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const newContent = await response.text();

    const targetPath = path.join(__dirname, "index.js");
    if (fs.existsSync(targetPath)) {
      backupFile(targetPath);
    }
    fs.writeFileSync(targetPath, newContent, "utf8");

    await main.editMessageText(
      `✅ <b>UPDATE SUCCESS!</b>\n\n` +
      `📥 Downloaded from: ${url}\n` +
      `🔄 Restarting bot...`,
      { chat_id: chatId, message_id: loading.message_id, parse_mode: "HTML" }
    );
    restartBot();
  } catch (e) {
    await main.editMessageText(
      `❌ <b>UPDATE FAILED!</b>\n\nError: <code>${e.message}</code>`,
      { chat_id: chatId, message_id: loading.message_id, parse_mode: "HTML" }
    );
  }
});

// ── /restart command ──
main.onText(/\/restart\s*$/i, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) return;

  await sendBotText(chatId, "🔄 Restarting bot...");
  restartBot();
});

// ── /updatestatus command ──
main.onText(/\/updatestatus\s*$/i, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) return;

  const targetPath = path.join(__dirname, "index.js");
  let fileInfo = "❌ File tidak ditemukan.";
  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);
    const size = (stats.size / 1024).toFixed(1);
    const mtime = stats.mtime.toLocaleString("id-ID");
    fileInfo = `📁 <code>index.js</code>\n📦 Size: ${size} KB\n📅 Last modified: ${mtime}`;
  }

  const backups = fs.existsSync(UPDATE_CONFIG.BACKUP_DIR)
    ? fs.readdirSync(UPDATE_CONFIG.BACKUP_DIR).filter(f => f.startsWith("index_backup_")).length
    : 0;

  await sendBotText(
    chatId,
    `📊 <b>UPDATE STATUS</b>\n\n${fileInfo}\n\n📦 Backup files: ${backups}\n🔗 Update URL: ${UPDATE_CONFIG.UPDATE_URL || "Not set"}`,
    { parse_mode: "HTML" }
  );
});

// ─── START ───────────────────────────────────────────────────────────────────
preloadTokenIndex();
console.log(BANNER);
console.log("🚀 rasuk Bot berjalan!\n");
restoreSlaves().then(() => {
  console.log("✅ Siap.\n");
  // Mulai autodetect jika diaktifkan
  if (isAutoDetectEnabled()) {
    startAutoDetect();
    console.log("🔍 Auto Detect aktif (cek tiap 60 detik).");
  }
});
schedulePrayerNotifications().catch(() => {});

// ─── /detect <url> ─────────────────────────────────────────────────────────────
// Fetch JSON dari URL, scan token, cek ke Telegram, yang aktif langsung di-hantam
// Admin & all only
{
  const https_ = require("https");
  const http_  = require("http");
  const DETECT_TIMEOUT  = 8000;
  const DETECT_CONCURR  = 15;

  function _fetchUrl(url, depth = 0) {
    return new Promise((resolve, reject) => {
      if (depth > 3) return reject(new Error("Too many redirects"));
      const lib = url.startsWith("https") ? https_ : http_;
      const req = lib.get(url, { timeout: DETECT_TIMEOUT }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
          return _fetchUrl(res.headers.location, depth + 1).then(resolve).catch(reject);
        if (res.statusCode !== 200)
          return reject(new Error(`HTTP ${res.statusCode}`));
        let data = "";
        res.on("data", c => (data += c));
        res.on("end", () => resolve(data));
      });
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("Timeout fetch")); });
    });
  }

  function _extractTokens(raw) {
    const found = new Set();
    const RGX   = /\d{6,15}:[A-Za-z0-9_-]{20,}/g;
    try { (JSON.stringify(JSON.parse(raw)).match(RGX) || []).forEach(t => found.add(t)); } catch {}
    (raw.match(RGX) || []).forEach(t => found.add(t));
    return [...found];
  }

  function _checkToken(token) {
    return new Promise(resolve => {
      const req = https_.get(
        `https://api.telegram.org/bot${token}/getMe`,
        { timeout: DETECT_TIMEOUT },
        res => {
          let data = "";
          res.on("data", c => (data += c));
          res.on("end", () => {
            try {
              const j = JSON.parse(data);
              if (j.ok && j.result) resolve({ alive: true, token, info: j.result });
              else resolve({ alive: false, token, reason: j.description || "?" });
            } catch { resolve({ alive: false, token, reason: "parse error" }); }
          });
        }
      );
      req.on("error", e => resolve({ alive: false, token, reason: e.message }));
      req.on("timeout", () => { req.destroy(); resolve({ alive: false, token, reason: "timeout" }); });
    });
  }

  async function _runPool(items, worker, concurrency) {
    const results = new Array(items.length);
    let idx = 0;
    async function next() {
      while (idx < items.length) { const i = idx++; results[i] = await worker(items[i]); }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
    return results;
  }

  main.onText(/\/detect(?:\s+([\s\S]+))?\s*$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    trackUser(msg.from);

    if (!isAdmin(userId) && !isAll(userId)) {
      return sendBotText(chatId, "❌ Hanya admin/all yang bisa /detect.");
    }

    const url = String(match?.[1] || "").trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return sendBotText(chatId,
        "❌ URL tidak valid.\n\nContoh:\n<code>/detect https://raw.githubusercontent.com/.../token.json</code>",
        { parse_mode: "HTML" }
      );
    }

    const loading = await sendBotText(chatId, "🌐 Fetching URL...");
    const edit = (text, html = true) => main.editMessageText(text, {
      chat_id: chatId, message_id: loading.message_id,
      parse_mode: html ? "HTML" : undefined
    }).catch(() => sendBotText(chatId, text, html ? { parse_mode: "HTML" } : {}));

    let raw;
    try { raw = await _fetchUrl(url); }
    catch (e) { return edit(`❌ Gagal fetch:\n<code>${e.message}</code>`); }

    const tokens = _extractTokens(raw);
    if (!tokens.length) return edit("⚠️ Tidak ada token ditemukan di URL tersebut.");

    await edit(`📦 Ditemukan <b>${tokens.length}</b> token\n⏳ Mengecek ke Telegram...`);

    // Cek semua token paralel
    const results = await _runPool(tokens, _checkToken, DETECT_CONCURR);
    const alive   = results.filter(r => r.alive);
    const dead    = results.length - alive.length;

    await edit(
      `✅ <b>Scan Selesai!</b>\n\n` +
      `📦 Total: <b>${tokens.length}</b>\n` +
      `✅ Aktif: <b>${alive.length}</b>\n` +
      `❌ Mati/Revoke: <b>${dead}</b>` +
      (alive.length ? `\n\n⏳ Mendaftarkan ${alive.length} token...` : "")
    );

    if (!alive.length) {
      return sendBotText(chatId, "⚠️ Tidak ada token yang aktif.");
    }

    // Daftarkan semua token aktif langsung (hantam)
    let sukses = 0, skip = 0;
    for (const r of alive) {
      const d = loadData();
      if (d.bots[r.token]) { skip++; continue; } // sudah ada
      try {
        await registerSlaveBot(r.token, userId);
        await applySlaveProfile(slaveBots[r.token]);
        const info = await slaveBots[r.token].getMe();
        const dNew = loadData();
        dNew.bots[r.token] = {
          name: info.username, ownerId: userId,
          limit: DEFAULT_LIMIT, usedCount: 0, active: true, chats: {}
        };
        saveData(dNew);
        tokenToIdx(r.token);
        sukses++;
      } catch {
        // Kalau gagal daftar, skip saja
        try { if (slaveBots[r.token]) { slaveBots[r.token].stopPolling().catch(()=>{}); delete slaveBots[r.token]; } } catch {}
        skip++;
      }
    }

    await sendBotText(chatId,
      `🎉 <b>Selesai!</b>\n━━━━━━━━━━━━━━\n` +
      `✅ Berhasil dihantam: <b>${sukses}</b> bot\n` +
      `⏭ Skip (sudah ada): <b>${skip}</b>\n\n` +
      `<i>Semua bot aktif sudah masuk panel. Cek /listbot</i>`,
      { parse_mode: "HTML" }
    );
  });
}


// ─── /detect <url> ────────────────────────────────────────────────────────────
// Scan token dari URL JSON, daftarkan langsung yang aktif ke panel
// Admin only
(function() {
  const _https = require("https");
  const _http  = require("http");
  const DETECT_TIMEOUT = 8000;
  const DETECT_CONCURRENCY = 15;

  function _fetchUrl(url, redirects = 0) {
    return new Promise((resolve, reject) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const lib = url.startsWith("https") ? _https : _http;
      const req = lib.get(url, { timeout: DETECT_TIMEOUT }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
          return _fetchUrl(res.headers.location, redirects + 1).then(resolve).catch(reject);
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        let data = "";
        res.on("data", c => (data += c));
        res.on("end", () => resolve(data));
      });
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    });
  }

  function _extractTokens(raw) {
    const set = new Set();
    const RGX = /\d{6,15}:[A-Za-z0-9_-]{20,}/g;
    try { (JSON.stringify(JSON.parse(raw)).match(RGX) || []).forEach(t => set.add(t)); }
    catch { (raw.match(RGX) || []).forEach(t => set.add(t)); }
    return [...set];
  }

  function _checkToken(token) {
    return new Promise(resolve => {
      const req = _https.get(
        `https://api.telegram.org/bot${token}/getMe`,
        { timeout: DETECT_TIMEOUT },
        res => {
          let data = "";
          res.on("data", c => (data += c));
          res.on("end", () => {
            try {
              const j = JSON.parse(data);
              if (j.ok && j.result) resolve({ alive: true, token, info: j.result });
              else resolve({ alive: false, token, reason: j.description || "?" });
            } catch { resolve({ alive: false, token, reason: "parse error" }); }
          });
        }
      );
      req.on("error", e => resolve({ alive: false, token, reason: e.message }));
      req.on("timeout", () => { req.destroy(); resolve({ alive: false, token, reason: "timeout" }); });
    });
  }

  async function _runPool(items, worker, concurrency) {
    const results = new Array(items.length);
    let idx = 0;
    async function next() { while (idx < items.length) { const i = idx++; results[i] = await worker(items[i]); } }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
    return results;
  }

  main.onText(/\/detect(?:\s+([\s\S]+))?\s*$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    trackUser(msg.from);
    if (!isAdmin(userId) && !isAll(userId)) return sendBotText(chatId, "❌ Hanya admin yang bisa /detect.");

    const url = String(match?.[1] || "").trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return sendBotText(chatId,
        "❌ URL tidak valid.\n\nContoh:\n<code>/detect https://raw.githubusercontent.com/.../token.json</code>",
        { parse_mode: "HTML" }
      );
    }

    const loading = await sendBotText(chatId, "🌐 Fetching URL...");
    const editMsg = (text, html = true) => main.editMessageText(text, {
      chat_id: chatId, message_id: loading.message_id,
      parse_mode: html ? "HTML" : undefined
    }).catch(() => sendBotText(chatId, text.replace(/<[^>]+>/g, "")));

    let raw;
    try { raw = await _fetchUrl(url); }
    catch (e) { return editMsg(`❌ Gagal fetch URL:\n<code>${e.message}</code>`); }

    const tokens = _extractTokens(raw);
    if (!tokens.length) return editMsg("⚠️ Tidak ada token ditemukan di URL tersebut.");

    await editMsg(`📦 Ditemukan <b>${tokens.length}</b> token\n⏳ Mengecek & mendaftarkan yang aktif...`);

    const results = await _runPool(tokens, _checkToken, DETECT_CONCURRENCY);
    const alive   = results.filter(r => r.alive);
    const dead    = results.length - alive.length;

    // Filter yang belum terdaftar
    const d = loadData();
    const newBots  = alive.filter(r => !d.bots[r.token]);
    const already  = alive.length - newBots.length;

    // Daftarkan semua yang baru + aktif
    let registered = 0;
    let failed     = 0;
    for (const r of newBots) {
      try {
        await registerSlaveBot(r.token, userId);
        await applySlaveProfile(slaveBots[r.token]);
        const fresh = loadData();
        fresh.bots[r.token] = {
          name: r.info.username,
          ownerId: userId,
          limit: DEFAULT_LIMIT,
          usedCount: 0,
          active: true,
          chats: {}
        };
        saveData(fresh);
        tokenToIdx(r.token);
        registered++;
      } catch { failed++; }
    }

    await editMsg(
      `✅ <b>Scan + Daftar Selesai!</b>\n━━━━━━━━━━━━━━\n` +
      `📦 Total token di URL: <b>${tokens.length}</b>\n` +
      `✅ Aktif: <b>${alive.length}</b>\n` +
      `❌ Mati/Revoke: <b>${dead}</b>\n` +
      `⏭ Sudah terdaftar: <b>${already}</b>\n` +
      `🆕 Baru didaftarkan: <b>${registered}</b>\n` +
      (failed ? `⚠️ Gagal daftar: <b>${failed}</b>\n` : "")
    );

    // Kirim list token yang baru didaftarkan
    if (registered > 0) {
      const addedBots = newBots.slice(0, registered);
      let text = `🟢 <b>Bot Baru Terdaftar (${registered})</b>\n━━━━━━━━━━━━━━\n`;
      for (let i = 0; i < addedBots.length; i++) {
        const u   = addedBots[i].info;
        const row = `${i+1}. @${u.username||"-"} | ${u.first_name||""}\n   <code>${addedBots[i].token}</code>\n`;
        if (text.length + row.length > 3500) {
          try { await sendBotText(chatId, text, { parse_mode: "HTML" }); } catch {}
          text = `🟢 <b>Lanjutan...</b>\n━━━━━━━━━━━━━━\n`;
        }
        text += row;
      }
      try { await sendBotText(chatId, text, { parse_mode: "HTML" }); } catch {}
    }
  });
})();

main.on("polling_error", (err) => console.error("[Main Error]", err.message));

// Biar tidak langsung mati di hosting kalau ada error yang tidak ke-catch
process.on("unhandledRejection", (reason) => {
  console.error("[UnhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[UncaughtException]", err);
});