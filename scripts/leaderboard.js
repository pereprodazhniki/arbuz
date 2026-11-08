/* Синхронизация общего рейтинга: ntfy -> leaderboard.json
   Запускается GitHub Actions каждые 10 минут. */

const fs = require("fs");
const path = require("path");

const TOPIC = process.env.LB_TOPIC || "prz-liga-2f8d61";
const TOP = 50;
const FILE = process.env.LB_FILE || path.join(__dirname, "..", "leaderboard.json");

const LAT_TO_RU = {
  a: "а", b: "в", c: "с", e: "е", h: "н", k: "к", m: "м", o: "о",
  p: "р", t: "т", x: "х", y: "у", "0": "о", "3": "з", "1": "и", "4": "а", "6": "б"
};

const BAD_ROOTS = [
  "хуй", "хуя", "хуе", "хуи", "хуйн", "охуе", "хй",
  "пизд", "пзд",
  "бля", "блят", "блть", "блт",
  "сука", "суки", "сучар",
  "мудак", "мудил",
  "пидор", "пидар", "пидр", "педик",
  "дурак", "дура", "идиот", "урод", "гнида", "скотин",
  "ебат", "ебал", "ебан", "ебуч", "ебну", "еблан",
  "заеб", "наеб", "уеб", "отъеб", "разъеб", "долбоеб",
  "гандон", "гондон",
  "шлюх",
  "мразь", "тварь", "дебил", "кретин",
  "fuck", "shit", "bitch", "asshole", "cunt", "whore", "slut"
];

function normalizeBad(s) {
  let t = String(s || "").toLowerCase().replace(/ё/g, "е");
  let out = "";
  for (const ch of t) {
    const c = LAT_TO_RU[ch] || ch;
    if (/[а-я0-9]/.test(c)) out += c;
  }
  return out.replace(/(.)\1+/g, "$1");
}

function hasBadWords(s) {
  const ru = normalizeBad(s);
  const en = String(s || "")
    .toLowerCase()
    .replace(/[013457]/g, (d) => ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t" })[d])
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1+/g, "$1");

  return BAD_ROOTS.some((root) =>
    /^[a-z]+$/.test(root) ? en.includes(root) : ru.includes(root)
  );
}

function loadArchive() {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (Array.isArray(data.scores)) return data.scores;
    if (Array.isArray(data)) return data;
    return [];
  } catch (e) {
    return [];
  }
}

function parseMessage(text) {
  const parts = String(text || "").split("|");
  if (parts.length < 4 || parts[0] !== "LB") return null;

  const name = parts[1].trim();
  const score = parseInt(parts[2], 10);
  const ts = parseInt(parts[3], 10);

  if (!/^[А-Яа-яЁёA-Za-z\- ]{2,30}$/.test(name)) return null;
  if (hasBadWords(name)) return null;
  if (!Number.isFinite(score) || score <= 0 || score > 1000000) return null;
  if (!Number.isFinite(ts) || ts <= 0) return null;

  return { name, score, ts };
}

function normalizeScore(item) {
  return {
    name: String(item.name || "").trim(),
    score: parseInt(item.score, 10) || 0,
    ts: parseInt(item.ts, 10) || 0
  };
}

function mergeBest(map, item) {
  const s = normalizeScore(item);
  if (!s.name || s.score <= 0) return;

  const key = s.name.toLowerCase();
  const old = map.get(key);
  if (!old || s.score > old.score || (s.score === old.score && s.ts < old.ts)) {
    map.set(key, s);
  }
}

async function fetchMessages() {
  const url = `https://ntfy.sh/${TOPIC}/json?poll=1&since=12h`;
  const res = await fetch(url, { headers: { "User-Agent": "prz-leaderboard-bot" } });
  if (!res.ok) throw new Error("ntfy: HTTP " + res.status);

  const text = await res.text();
  const out = [];

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let ev;
    try { ev = JSON.parse(line); } catch (e) { continue; }
    if (!ev || ev.event !== "message" || !ev.message) continue;
    const item = parseMessage(ev.message);
    if (item) out.push(item);
  }

  return out;
}

async function main() {
  const merged = new Map();

  for (const item of loadArchive()) {
    if (item && item.name) mergeBest(merged, item);
  }

  const fresh = await fetchMessages();
  for (const item of fresh) mergeBest(merged, item);

  const scores = Array.from(merged.values())
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.ts - b.ts)
    .slice(0, TOP);

  const oldScores = loadArchive()
    .map(normalizeScore)
    .filter((s) => s.name && s.score > 0);

  const same = JSON.stringify(oldScores) === JSON.stringify(scores);
  if (same) {
    console.log(`Новых результатов нет. В рейтинге: ${scores.length}`);
    return;
  }

  const out = { updated: new Date().toISOString(), scores };
  fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + "\n", "utf8");

  console.log(`Собрано сообщений: ${fresh.length}, в рейтинге: ${scores.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
