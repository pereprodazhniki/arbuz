/* Синхронизация общего рейтинга: ntfy -> leaderboard.json
   Запускается GitHub Actions каждые 10 минут. */

const fs = require("fs");
const path = require("path");

const TOPIC = process.env.LB_TOPIC || "prz-liga-85e536";
const TOP = 50;
const FILE = process.env.LB_FILE || path.join(__dirname, "..", "leaderboard.json");

/* ntfy.sh заблокирован в России, поэтому читаем ещё и зеркала */
const HOSTS = [
  "https://ntfy.sh",
  "https://ntfy.envs.net",
  "https://ntfy.adminforge.de"
];

var NAME_WORDS = (
  "александр алексей анатолий андрей андрюша антон аркадий арсений артем артемий артур афанасий " +
  "богдан борис борислав вадим валентин валерий василий виктор виталий владимир владислав всеволод вячеслав " +
  "гаврила гавриил геннадий георгий герман глеб гордей григорий гриша давид дамир даниил данила даниэль " +
  "демьян денис дмитрий дима добрыня евгений егор елисей емельян еремей ефим захар иван игнат игорь иларион " +
  "илья иннокентий иосиф ислам кирилл клавдий клим константин корней костя лаврентий лев леонид лука макар " +
  "максим макс марат марк мартын матвей мирон мирослав михаил миша назар нестор никита николай нил олег " +
  "онисим павел пантелей петр платон прохор радим ратмир роман ростислав руслан рустам савва савелий самсон " +
  "светозар семен сережа сергей станислав степан тарас тимофей тимур тихон трофим федор феликс филипп фрол " +
  "эдуард эльдар эмиль эрик юлиан юрий юра яков ян ярослав ахмед али амир аслан адам гасан хасан магомед " +
  "мурат рамиль ринат тагир шамиль юнус юсуп ник " +
  "александра алина алиса алла альбина анастасия ангелина анна антонина арина агата аделина азалия аида " +
  "айгуль алсу амелия амина асель валентина валерия варвара василиса вера вероника виктория виолетта " +
  "владислава галина гульнара гульшат дарья даша диана динара ева евгения екатерина елена елизавета жанна " +
  "жасмин зарина земфира зинаида злата зоя инна ирина камила карина кира клавдия кристина ксения лариса " +
  "лейла лена лидия лилиана лилия любовь людмила мадина маргарита марина мария марта маша милана милена " +
  "мирослава надежда наиля наталья наташа нелли ника нина нонна оксана олеся ольга полина раиса регина " +
  "римма роза сабина сара света светлана снежана софия софья станислава таисия тамара таня татьяна ульяна " +
  "эвелина элеонора элина эльвира эльмира эмилия эсмира юлия юля яна ярослава ясмина " +
  "саша шура женя валя паша вика настя катя оля ира юра ваня петя вася коля алеша леша гоша " +
  "влад стас данил даня вова дима миша гриша сережа андрюха толя костя тема артемка максимка рома ромка " +
  "матвей тимур марк лев мирон савелий богдан дамир тимофей семен степа федя ярик слава владик витя " +
  "виталя виталик володя саня мишаня диман кирюха гена валера вадик костик толик валик юрик юрец ромыч " +
  "димыч санек пашок мишутка " +
  "аня настюша катюша машенька дашенька оленька юленька танечка светик ирочка леночка анечка викуся " +
  "поля софа соня лиза лизавета ксюша ксю наташа ната тата рита марго дина мила есения варя люба люда " +
  "надя снежа тая уля эля яся алиса алина арина милана диана кристина карина регина эвелина эмилия " +
  "юлия агафья аглая марфа пелагея прасковья фекла матрена евдокия василина агата аделина азалия аида " +
  "айгуль алсу амелия амина асель гульнара гульшат динара жасмин зарина земфира камила лейла лилиана " +
  "мадина милена наиля нелли нонна сабина сара эльмира эсмира ясмина " +
  "ахмед мурат рустам рамиль алан аслан ислам магомед хасан юсуп адам али амир давид даниэль камиль " +
  "ринат тагир шамиль эмиль юнус"
).split(/\s+/);

var NAME_SET = {};
for (let i = 0; i < NAME_WORDS.length; i++) {
  if (NAME_WORDS[i]) NAME_SET[NAME_WORDS[i]] = true;
}

/* куски, которых в настоящих именах не бывает — по ним ловим «ываплро» */
const MASH_PARTS = [
  "фыв", "ыва", "вап", "апр", "прол", "йцу", "цук", "укен",
  "ячс", "чсм", "плр", "вгл", "asdf", "qwer", "zxcv", "hjkl"
];

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

/* приводим имя к аккуратному виду: «иван петров» → «Иван Петров» */
function normalizeName(s) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.split(" ").map((word) =>
    word.split("-").map((part) =>
      part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part
    ).join("-")
  ).join(" ");
}

/* слово похоже на настоящее имя, даже если его нет в списке */
function nameWordLooksReal(word) {
  const w = String(word || "").toLowerCase().replace(/ё/g, "е");
  if (NAME_SET[w]) return true;
  if (w.length < 2 || w.length > 20) return false;

  const vowels = (w.match(/[аеиоуыэюя]/g) || []).length;
  if (!vowels) return false;
  if (vowels < Math.ceil(w.length / 4)) return false;
  if (/[аеиоуыэюя]{4,}/.test(w)) return false;
  if (/[^аеиоуыэюя]{4,}/.test(w)) return false;
  if (/(.)\1\1/.test(w)) return false;

  return !MASH_PARTS.some((part) => w.includes(part));
}

function looksLikeName(t) {
  const words = String(t || "").toLowerCase().replace(/ё/g, "е").split(/[ \-]+/).filter(Boolean);
  if (!words.length) return false;
  return words.every((w) => NAME_SET[w] || nameWordLooksReal(w));
}

function nameProblem(s) {
  const t = String(s || "").trim().replace(/\s+/g, " ");
  if (t.length < 2 || t.length > 30) return "bad length";
  if (!/^[А-Яа-яЁё\- ]+$/.test(t)) return "bad letters";
  if (hasBadWords(t)) return "bad words";
  if (!looksLikeName(t)) return "not a name";
  return null;
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

  const name = normalizeName(parts[1]);
  const score = parseInt(parts[2], 10);
  const ts = parseInt(parts[3], 10);

  if (nameProblem(name)) return null;
  if (!Number.isFinite(score) || score <= 0 || score > 1000000) return null;
  if (!Number.isFinite(ts) || ts <= 0) return null;

  return { name, score, ts };
}

function normalizeScore(item) {
  return {
    name: normalizeName(item && item.name),
    score: parseInt(item && item.score, 10) || 0,
    ts: parseInt(item && item.ts, 10) || 0
  };
}

function mergeBest(map, item) {
  const s = normalizeScore(item);
  if (!s.name || s.score <= 0 || nameProblem(s.name)) return;

  const key = s.name.toLowerCase();
  const old = map.get(key);
  if (!old || s.score > old.score || (s.score === old.score && s.ts < old.ts)) {
    map.set(key, s);
  }
}

async function fetchFrom(host) {
  const url = `${host}/${TOPIC}/json?poll=1&since=12h`;
  const res = await fetch(url, {
    headers: { "User-Agent": "prz-leaderboard-bot" },
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error(host + ": HTTP " + res.status);

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

async function fetchMessages() {
  const results = await Promise.allSettled(HOSTS.map((host) => fetchFrom(host)));
  const out = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      out.push(...r.value);
    } else {
      console.warn(HOSTS[i] + " недоступен: " + (r.reason && r.reason.message));
    }
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
    .filter((s) => s.name && s.score > 0 && !nameProblem(s.name))
    .sort((a, b) => b.score - a.score || a.ts - b.ts)
    .slice(0, TOP);

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
