/* Pereprodazhniki — вся логика: каталог, корзина, заказ, отзывы, шутки */

var PRODUCTS = [
  { id: "solnyi", name: "Солёный (нет)", icon: "🧂", price: 199, weight: "3 кг", tags: ["сок", "харизма"],
    desc: "Обычный арбуз, но мы его перепродали. Вкус не изменился, отношение — да." },
  { id: "medovyi", name: "Медовый перекуп", icon: "🍯", price: 349, weight: "5 кг", tags: ["сладкий", "хит"],
    desc: "Купили у соседа за 200, вам отдаём за 349. Беременным не рекомендуем." },
  { id: "kvadratnyi", name: "Квадратный", icon: "🟩", price: 499, weight: "7 кг", tags: ["необычный"],
    desc: "Не помещается в холодильник. Мы предупреждали. Вы продолжали настаивать." },
  { id: "nochnoy", name: "Ночной перекуп", icon: "🌙", price: 599, weight: "9 кг", tags: ["премиум", "ночь"],
    desc: "Привозим ночью, пока вы спите. Утром арбуз уже в холодильнике." },
  { id: "svinoy", name: "Свиной арбуз", icon: "🐷", price: 1499, weight: "13 кг", tags: ["не халяль", "мем", "премиум"],
    desc: "Не халяль, и мы это честно написали. Пятачок сладкий, но сертификата нет." },
  { id: "bezkostochek", name: "Арбуз без косточек", icon: "🫧", price: 99990, weight: "9 кг", tags: ["халяль", "премиум", "редкий"],
    desc: "Косточек нет вообще. Мы вытащили их все сами и сложили в отдельный пакет — в подарок." }
];

var BASE_REVIEWS = [
  { name: "Даша", tag: "12 покупок", text: "Впервые не пришлось выковыривать косточки из карманов. Рекомендую Pereprodazhniki." },
  { name: "Булат", tag: "5 арбузов", text: "Взял пять штук. Жена пересчитала арбузы в коридоре и решила, что я переехал. Похоже, я переехал." },
  { name: "Тимур", tag: "1 арбуз", text: "Купил один арбуз и сразу перепродал соседу за два. Прибыль ноль, опыт бесценный." },
  { name: "Ваня", tag: "3 арбуза", text: "Заказал три, приехал один. Остальные два съел по дороге. Виноват сам, но арбуз был великолепен." }
];

var JOKES = [
  "Арбуз — это груша, которая решила стать серьёзной.",
  "Мы не перепродаём арбузы. Мы их перепродаём ЗАНОВО.",
  "Сколько арбузов помещается в лифт? Ровно столько, сколько влезет.",
  "Продавец арбузов зимой не скучает. Он ждёт.",
  "Арбуз без косточек — это не дефект, а предоплата вашей удачи.",
  "Если арбуз не пахнет летом — мы вернём деньги и арбуз.",
  "Наш слоган: взяли дешевле, отдали веселее.",
  "Каждый арбуз проходит контроль: взвешивание, вздыхание, одобрение.",
  "Бабушка спросила, халяль ли свинина. Мы честно сказали: нет. Бабушка одобрила.",
  "Свиной арбуз у нас один и он с пометкой «не халяль». Честность — тоже маркетинг.",
  "Если косточек нет, значит их съели в пути. Мы не знаем кто.",
  "Бабушка просила не перепродавать. Мы перепродали. Она не узнает."
];

var TIPS = [
  "Арбуз сначала стукни. Если звук глухой — бабушка в восторге.",
  "Не режь арбуз на солнце, а то он стесняется.",
  "Соль на краю — и бабушка перестанет ворчать.",
  "Халяльный арбуз держи в холодильнике. Свиной — вообще в сарае.",
  "Если арбуз тяжёлый — значит, бабушка старалась.",
  "Никогда не бери арбуз у того, кто называет свинью халяль.",
  "Косточки — это не баг, это бабушкина проверка на твою честность.",
  "Отрезай от себя, а не от соседа. Так делает бабушка."];

var SHIP_FEE = 200;
var STORE = { cart: "prz_cart", ship: "prz_ship", sold: "prz_sold", reviews: "prz_reviews", coupon: "prz_coupon", votes: "prz_votes", voted: "prz_voted", buyers: "prz_buyers" };

var cart = read(STORE.cart, {});
var ship = read(STORE.ship, "delivery");
var reviews = read(STORE.reviews, []);
var sold = read(STORE.sold, 0);
var buyers = read(STORE.buyers, []);
var activeTag = null;

/* чистка: убираем из корзины товары, которых больше нет в каталоге */
(function cleanCart() {
  var changed = false;
  var ids = Object.keys(cart);
  for (var i = 0; i < ids.length; i++) {
    if (!productById(ids[i]) || !(cart[ids[i]] > 0)) {
      delete cart[ids[i]];
      changed = true;
    }
  }
  if (changed) write(STORE.cart, cart);
})();

/* чистка: нормализуем способ доставки */
if (ship !== "delivery" && ship !== "pickup") ship = "delivery";

/* чистка: отзывы должны быть массивом объектов */
if (!Array.isArray(reviews)) reviews = [];
if (typeof sold !== "number" || isNaN(sold) || sold < 0) sold = 0;
if (!Array.isArray(buyers)) buyers = [];

/* сброс старого локального счётчика продаж: теперь он общий для всех */
if (!read("prz_sold_reset2", false)) {
  sold = 0;
  write(STORE.sold, 0);
  write("prz_sold_reset2", true);
}
/* сброс кеша перед переездом на новый общий счётчик */
if (!read("prz_sold_reset3", false)) {
  sold = 0;
  write(STORE.sold, 0);
  write("prz_sold_reset3", true);
}

/* промокоды */
var COUPONS = {
  "БАБУШКА": { kind: "percent", value: 10, label: "скидка 10%" },
  "КОСТОЧКИ": { kind: "shipping", value: 0, label: "доставка бесплатно" },
  "ЛЕТО": { kind: "percent", value: 15, label: "скидка 15%" },
  "ПЕРЕПРОДАЖА": { kind: "percent", value: 5, label: "скидка 5%" },
  "БЕЛЕНЬКИЙ": { kind: "shipping", value: 0, label: "Беленький передаёт привет" },
  "ЗИНА": { kind: "percent", value: 20, label: "бабушкина скидка 20%" }
};
var coupon = read(STORE.coupon, null);

function read(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) { return fallback; }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

/* fetch с жёстким таймаутом: сеть не должна подвешивать интерфейс */
function fetchT(url, opts, ms) {
  ms = ms || 8000;
  var ctrl = null;
  try { ctrl = new AbortController(); } catch (e) { ctrl = null; }

  var o = {};
  if (opts) {
    for (var k in opts) {
      if (Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
    }
  }
  if (ctrl) o.signal = ctrl.signal;

  return new Promise(function (resolve, reject) {
    var done = false;
    var timer = setTimeout(function () {
      if (done) return;
      done = true;
      if (ctrl) { try { ctrl.abort(); } catch (e) {} }
      reject(new Error("timeout"));
    }, ms);

    fetch(url, o).then(function (r) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(r);
    }, function (e) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(e);
    });
  });
}

var toastTimer = null;
function toast(text) {
  var el = document.getElementById("toast");
  if (!el) return;
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.hidden = true; }, 3200);
}

function money(n) { return n.toLocaleString("ru-RU") + " ₽"; }

function productById(id) {
  for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
  return null;
}

/* ---------- каталог ---------- */
function currentList() {
  var query = (document.getElementById("search").value || "").trim().toLowerCase();
  var sort = document.getElementById("sort").value;

  var list = PRODUCTS.filter(function (p) {
    var hay = (p.name + " " + p.desc + " " + p.tags.join(" ")).toLowerCase();
    var okText = !query || hay.indexOf(query) !== -1;
    var okTag = !activeTag || p.tags.indexOf(activeTag) !== -1;
    return okText && okTag;
  });

  if (sort === "asc") list.sort(function (a, b) { return a.price - b.price; });
  if (sort === "desc") list.sort(function (a, b) { return b.price - a.price; });
  if (sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name, "ru"); });
  return list;
}

function renderChips() {
  var box = document.getElementById("chips");
  var tags = [];
  PRODUCTS.forEach(function (p) {
    p.tags.forEach(function (t) { if (tags.indexOf(t) === -1) tags.push(t); });
  });

  box.innerHTML = "";

  var all = document.createElement("button");
  all.type = "button";
  all.className = "chip" + (activeTag === null ? " is-active" : "");
  all.textContent = "все";
  all.addEventListener("click", function () { activeTag = null; renderCatalog(); });
  box.appendChild(all);

  tags.forEach(function (t) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (activeTag === t ? " is-active" : "");
    b.textContent = t;
    b.addEventListener("click", function () { activeTag = t; renderCatalog(); });
    box.appendChild(b);
  });
}

function renderCatalog() {
  renderChips();
  var grid = document.getElementById("catalogGrid");
  var empty = document.getElementById("catalogEmpty");
  var list = currentList();

  grid.innerHTML = "";

  if (list.length === 0) { empty.hidden = false; return; }
  empty.hidden = true;

  list.forEach(function (p) {
    var card = document.createElement("article");
    card.className = "card";

    var tagsHtml = "";
    p.tags.forEach(function (t) {
      var s = document.createElement("span");
      s.className = "tag";
      s.textContent = t;
      tagsHtml += s.outerHTML;
    });

    card.innerHTML =
      '<div class="card__icon"></div>' +
      '<h3 class="card__name"></h3>' +
      '<p class="card__desc"></p>' +
      '<div class="card__meta"><span class="tag weight"></span>' + tagsHtml + '</div>' +
      '<div class="card__foot"><span class="card__price"></span>' +
      '<button class="btn btn--big" type="button">В корзину</button></div>' +
      (p.tags.indexOf("хит") !== -1 ? '<span class="hit">ХИТ</span>' : "");

    card.querySelector(".card__icon").textContent = p.icon;
    card.querySelector(".card__name").textContent = p.name;
    card.querySelector(".card__desc").textContent = p.desc;
    card.querySelector(".card__meta .weight").textContent = p.weight;
    card.querySelector(".card__price").textContent = money(p.price);

    var btn = card.querySelector("button");
    btn.addEventListener("click", function () { addToCart(p.id, btn); });

    grid.appendChild(card);
  });
}

/* ---------- чек ---------- */
var lastReceipt = "";

function cartWeight() {
  var kg = 0;
  for (var id in cart) {
    var p = productById(id);
    if (p) kg += parseInt(p.weight, 10) * cart[id];
  }
  return kg;
}

function buildReceipt(orderNo, count, total, addr, phone) {
  var lines = [];
  lines.push("PEREPRODAZHNIKI");
  lines.push("Чек №" + orderNo);
  lines.push("----------------");
  var names = Object.keys(cart);
  for (var i = 0; i < names.length; i++) {
    var p = productById(names[i]);
    if (p) lines.push(p.name + " x" + cart[names[i]] + " = " + money(p.price * cart[names[i]]));
  }
  lines.push("----------------");
  lines.push("Вес: " + cartWeight() + " кг");
  lines.push("Доставка: " + (ship === "pickup" ? "самовывоз" : money(SHIP_FEE)));
  lines.push("ИТОГО: " + money(total));
  lines.push("Арбузов: " + count);
  lines.push("Получатель: " + addr);
  lines.push("Телефон: +7" + phone);
  lines.push("");
  lines.push("Спасибо, что перепродали!");
  return lines.join("\n");
}

function showReceipt(text) {
  lastReceipt = text;
  document.getElementById("receiptBody").textContent = text;
  document.getElementById("receipt").hidden = false;
}

function copyText(text, okMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, function () { fallback(); });
  } else {
    fallback();
  }
  function fallback() {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast(okMsg); }
    catch (e) { toast("Скопируй вручную"); }
    document.body.removeChild(ta);
  }
}

/* ---------- викторина ---------- */
var QUIZ = [
  { q: "Сколько стоит арбуз без косточек?", a: ["99 990 ₽", "199 ₽", "749 ₽"], correct: 0 },
  { q: "Кто у нас отвечает на звонки?", a: ["Камиль", "Карина", "Сафия"], correct: 1 },
  { q: "Какой арбуз у нас НЕ халяльный?", a: ["Ночной", "Свиной", "Медовый"], correct: 1 },
  { q: "Кто решает поставки арбузов?", a: ["Тимур Аминев", "Тимур Беленький", "Юля"], correct: 1 },
  { q: "Сколько арбузов съедает бабушка за лето?", a: ["Один", "Все, что привезли", "Ноль"], correct: 1 }
];
var quizIndex = 0, quizScore = 0;

function quizStart() {
  quizIndex = 0;
  quizScore = 0;
  renderQuiz();
}

function renderQuiz() {
  var qBox = document.getElementById("quizQ");
  var optBox = document.getElementById("quizOptions");
  var scoreBox = document.getElementById("quizScore");
  var btn = document.getElementById("quizBtn");

  optBox.innerHTML = "";

  if (quizIndex >= QUIZ.length) {
    var verdict = quizScore >= 4 ? "Бабушка бы тобой гордилась." : "Бабушка где-то плачет. В основном от смеха.";
    qBox.textContent = "Готово: " + quizScore + " из " + QUIZ.length + ". " + verdict;
    scoreBox.textContent = "";
    btn.textContent = "Пройти ещё раз";
    return;
  }

  var item = QUIZ[quizIndex];
  qBox.textContent = (quizIndex + 1) + ". " + item.q;
  btn.textContent = "Заново";
  scoreBox.textContent = "Сейчас: " + quizScore + " из " + QUIZ.length;

  item.a.forEach(function (text, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "quiz__btn";
    b.textContent = text;
    b.addEventListener("click", function () {
      var btns = optBox.querySelectorAll("button");
      for (var j = 0; j < btns.length; j++) btns[j].disabled = true;
      if (i === item.correct) {
        b.classList.add("is-right");
        quizScore++;
      } else {
        b.classList.add("is-wrong");
      }
      scoreBox.textContent = "Сейчас: " + quizScore + " из " + QUIZ.length;
      quizIndex++;
      setTimeout(renderQuiz, 800);
    });
    optBox.appendChild(b);
  });
}

/* ---------- голосование (общий счётчик для всех) ---------- */
var votes = read(STORE.votes, {});
var voted = read(STORE.voted, false);

var VOTE_API = "https://abacus.jasoncameron.dev";
var VOTE_NS = "pereprodazhniki-8c41f2";
var serverVotes = {};
var votesLoaded = false;

function voteCount(id) {
  if (votesLoaded && typeof serverVotes[id] === "number") return serverVotes[id];
  return votes[id] || 0;
}

function voteTotal() {
  var n = 0;
  PRODUCTS.forEach(function (p) { n += voteCount(p.id); });
  return n;
}

function loadVotes() {
  var ids = PRODUCTS.map(function (p) { return p.id; });
  return Promise.all(ids.map(function (id) {
    return fetch(VOTE_API + "/get/" + VOTE_NS + "/" + id)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && typeof d.value === "number") serverVotes[id] = d.value;
      })
      .catch(function () {});
  })).then(function () {
    votesLoaded = true;
    renderVotes();
  });
}

function sendVote(id) {
  return fetch(VOTE_API + "/hit/" + VOTE_NS + "/" + id)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d && typeof d.value === "number") serverVotes[id] = d.value;
      renderVotes();
    })
    .catch(function () {});
}

function renderVotes() {
  var box = document.getElementById("voteList");
  box.innerHTML = "";
  var total = voteTotal();

  PRODUCTS.forEach(function (p) {
    var count = voteCount(p.id);
    var pct = total > 0 ? Math.round(count / total * 100) : 0;

    var row = document.createElement("div");
    row.className = "vote";

    var top = document.createElement("div");
    top.className = "vote__row";

    var name = document.createElement("span");
    name.className = "vote__name";
    name.textContent = p.icon + " " + p.name;

    var pctEl = document.createElement("span");
    pctEl.className = "vote__pct";
    pctEl.textContent = pct + "%";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vote__btn";
    btn.textContent = voted ? "уже проголосовано" : "голосовать";
    btn.disabled = voted;
    btn.addEventListener("click", function () {
      if (voted) return;
      votes[p.id] = (votes[p.id] || 0) + 1;
      voted = true;
      write(STORE.votes, votes);
      write(STORE.voted, voted);
      renderVotes();
      toast("Голос зачтён: " + p.name);
      sendVote(p.id);
    });

    top.appendChild(name);
    top.appendChild(pctEl);
    top.appendChild(btn);

    var bar = document.createElement("div");
    bar.className = "vote__bar";

    var fill = document.createElement("div");
    fill.className = "vote__fill";
    fill.style.width = pct + "%";

    bar.appendChild(fill);
    row.appendChild(top);
    row.appendChild(bar);
    box.appendChild(row);
  });
}

/* ---------- генератор имени ---------- */
var NAME_PARTS = {
  adj: ["Медовый", "Ночной", "Боевой", "Халяльный", "Свиной", "Квадратный", "Солёный", "Безкосточный"],
  who: ["Беленький", "Аминев", "Камиль", "Сафия", "Карина", "Юля", "бабушка", "дядя с огорода"],
  extra: ["№1", "№2", "№7", "премиум", "оптом", "на зло соседу", "на вырост"]
};

function generateName() {
  var a = NAME_PARTS.adj[Math.floor(Math.random() * NAME_PARTS.adj.length)];
  var w = NAME_PARTS.who[Math.floor(Math.random() * NAME_PARTS.who.length)];
  var e = NAME_PARTS.extra[Math.floor(Math.random() * NAME_PARTS.extra.length)];
  document.getElementById("nameOut").textContent = "Арбуз «" + a + " " + w + " " + e + "»";
}

/* ---------- пасхалка ---------- */
function initEasterEgg() {
  var logo = document.querySelector(".logo__melon");
  if (!logo) return;
  var clicks = 0;
  logo.addEventListener("click", function () {
    clicks++;
    if (clicks === 5) {
      clicks = 0;
      toast("ПАСХАЛКА: бабушка знает про все арбузы. И про свинью тоже.");
    }
  });
}

/* ---------- скрытый квест ---------- */
var QUEST_KEY = "prz_quest";
var QUEST_CODE = "ЗИНА";
var SECRET_PRODUCT = {
  id: "kamila",
  name: "Арбуз Камиля",
  icon: "🏆",
  price: 0,
  weight: "10 кг",
  tags: ["секрет", "награда", "халяль"],
  desc: "Добыт в секретном квесте. Прошёл халяль-проверку, бабушка одобрила."
};

var quest = read(QUEST_KEY, null) || { started: false, hinted: false, zina: false, ordered: false, done: false };

function saveQuest() {
  write(QUEST_KEY, quest);
}

function questSteps() {
  return [
    { id: "start", text: "Кликнуть по большому зелёному арбузу", done: !!quest.started },
    { id: "zina", text: "Узнать секретный код у бабушки Зины", done: !!quest.zina },
    { id: "order", text: "Применить код «" + QUEST_CODE + "» и оформить заказ", done: !!quest.ordered },
    { id: "done", text: "Получить секретный арбуз Камиля", done: !!quest.done }
  ];
}

function renderQuest() {
  var panel = document.getElementById("questPanel");
  var list = document.getElementById("questSteps");
  var progress = document.getElementById("questProgress");
  var reward = document.getElementById("questReward");
  if (!panel || !list) return;

  if (!quest.started) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;
  list.innerHTML = "";

  var steps = questSteps();
  var doneCount = 0;
  var nextIndex = -1;

  steps.forEach(function (s, i) {
    if (s.done) doneCount++;
    else if (nextIndex === -1) nextIndex = i;
    var li = document.createElement("li");
    li.textContent = s.text;
    if (s.done) li.classList.add("is-done");
    else if (i === nextIndex) li.classList.add("is-now");
    list.appendChild(li);
  });

  if (progress) progress.textContent = doneCount + " из " + steps.length;

  if (reward) {
    reward.hidden = !quest.done;
    if (quest.done) reward.textContent = "Квест пройден! Промокод ПОБЕДА (−50%) доступен навсегда.";
  }
}

function unlockSecretProduct() {
  if (quest.done) return;
  quest.done = true;
  quest.ordered = true;
  saveQuest();

  var exists = false;
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id === SECRET_PRODUCT.id) exists = true;
  }
  if (!exists) {
    PRODUCTS.push(SECRET_PRODUCT);
    renderCatalog();
    renderChips();
  }
  COUPONS["ПОБЕДА"] = { kind: "percent", value: 50, label: "награда за квест: скидка 50%" };

  renderQuest();
  toast("🏆 Квест пройден! Открыт арбуз Камиля и промокод ПОБЕДА");
}

function startQuest() {
  if (!quest.started) {
    quest.started = true;
    saveQuest();
  }
  renderQuest();
  toast("Квест начался: пропавший арбуз");
}

function questHint() {
  if (!quest.zina) {
    quest.hinted = true;
    saveQuest();
    toast("Подсказка: бабушка Зина повёрнута в углу бабушек. Её можно нажать.");
    return;
  }
  toast("Код уже у тебя. Вставь его в корзине: поле «Промокод».");
}

function initQuest() {
  var melon = document.getElementById("bigMelon");
  if (melon) {
    melon.addEventListener("click", function () {
      startQuest();
    });
  }

  var close = document.getElementById("questClose");
  if (close) {
    close.addEventListener("click", function () {
      document.getElementById("questPanel").hidden = true;
    });
  }

  var hint = document.getElementById("questHint");
  if (hint) hint.addEventListener("click", questHint);

  var zina = document.getElementById("babaZina");
  if (zina) {
    zina.addEventListener("click", function () {
      if (!quest.started) return;
      if (!quest.zina) {
        quest.zina = true;
        saveQuest();
      }
      renderQuest();
      toast("Бабушка Зина: «Секретный код — " + QUEST_CODE + ". Больше никому не говори»");
    });
  }

  /* если квест уже пройден — сразу показываем награду */
  if (quest.done) {
    var exists = false;
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === SECRET_PRODUCT.id) exists = true;
    }
    if (!exists) {
      PRODUCTS.push(SECRET_PRODUCT);
      renderCatalog();
      renderChips();
    }
    COUPONS["ПОБЕДА"] = { kind: "percent", value: 50, label: "награда за квест: скидка 50%" };
  }

  renderQuest();
}

/* ---------- форма заявки на работу ---------- */
var JOB_COOLDOWN_MS = 30 * 60 * 1000;
var JOB_KEY = "prz_job_last";
var APPLY_URL = "https://ntfy.sh/prz-zayavki-4c81f2d9";

function jobWaitLeft() {
  try {
    var last = parseInt(localStorage.getItem(JOB_KEY) || "0", 10) || 0;
    var left = last + JOB_COOLDOWN_MS - Date.now();
    return left > 0 ? left : 0;
  } catch (e) {
    return 0;
  }
}

function jobWaitText(ms) {
  var min = Math.ceil(ms / 60000);
  return "Следующую заявку можно отправить через " + min + " мин.";
}

function updateJobCooldown() {
  var box = document.getElementById("jobCooldown");
  var btn = document.querySelector('#jobForm button[type="submit"]');
  var left = jobWaitLeft();

  if (!box) return;

  if (left > 0) {
    box.hidden = false;
    box.textContent = jobWaitText(left) + " Заявка уже принята, спасибо!";
    if (btn) btn.disabled = true;
  } else {
    box.hidden = true;
    if (btn) btn.disabled = false;
  }
}

function saveJobLocally(data) {
  var jobs = read("prz_jobs", []);
  if (!Array.isArray(jobs)) jobs = [];
  jobs.unshift({ at: Date.now(), data: data });
  jobs = jobs.slice(0, 20);
  write("prz_jobs", jobs);
  return jobs[0];
}

function jobAsText(d) {
  return "Заявка на работу\n" +
    "Имя: " + d.name + "\n" +
    "Возраст: " + d.age + "\n" +
    "Должность: " + d.position + "\n" +
    "Контакт: " + d.contact + "\n" +
    "Опыт: " + d.experience + "\n" +
    "Почему: " + d.why;
}

function validateJobForm(data) {
  var nameErr = nameProblem(data.name);
  if (nameErr) return nameErr;
  var age = parseInt(data.age, 10);
  if (!age || age < 10 || age > 99) return "Возраст должен быть от 10 до 99";
  if (!data.position) return "Выбери должность";
  if (!data.contact || data.contact.length < 4) return "Оставь телефон или почту";
  if (!data.experience || data.experience.length < 5) return "Расскажи про опыт чуть подробнее";
  if (!data.why || data.why.length < 10) return "Ответь, почему мы должны тебя взять";
  if (hasBadWords(data.name) || hasBadWords(data.experience) || hasBadWords(data.why)) {
    return "Давай без мата — у нас тут бабушки.";
  }
  return null;
}

function initJobForm() {
  var form = document.getElementById("jobForm");
  if (!form) return;

  updateJobCooldown();
  setInterval(updateJobCooldown, 30000);

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var note = document.getElementById("jobNote");
    var left = jobWaitLeft();

    if (left > 0) {
      note.className = "jobform__note is-bad";
      note.textContent = jobWaitText(left);
      updateJobCooldown();
      return;
    }

    var data = {};
    var inputs = form.querySelectorAll("input, select, textarea");
    for (var i = 0; i < inputs.length; i++) {
      var f = inputs[i];
      if (!f.name || f.name === "form-name" || f.name === "bot-field") continue;
      data[f.name] = f.type === "checkbox" ? (f.checked ? "да" : "нет") : String(f.value || "").trim();
    }

    if (data["bot-field"]) return;

    var problem = validateJobForm(data);
    if (problem) {
      note.className = "jobform__note is-bad";
      note.textContent = problem;
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    note.className = "jobform__note";
    note.textContent = "Отправляем заявку...";

    fetch(APPLY_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: jobAsText(data)
    })
      .then(function (r) {
        if (!r.ok) throw new Error("bad status " + r.status);
        write(JOB_KEY, Date.now());
        note.className = "jobform__note";
        note.textContent = "Заявка принята! Она летит Камилю на рабочий стол. 🍉";
        form.reset();
        updateJobCooldown();
      })
      .catch(function () {
        var job = saveJobLocally(data);
        note.className = "jobform__note";
        note.textContent = "Заявка сохранена на этом устройстве и скопирована. Отправь её Камилю.";
        copyText(jobAsText(job.data), "Заявка скопирована");
        form.reset();
        updateJobCooldown();
      });
  });
}

/* ---------- счётчик и покупатели (локально, без сервера) ---------- */
function setSyncNote(text, ok) {
  var el = document.getElementById("buyersSync");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("is-off", !ok);
}

function renderBuyers(buyers) {
  var box = document.getElementById("buyersList");
  if (!box) return;

  box.innerHTML = "";

  if (!buyers || buyers.length === 0) {
    var empty = document.createElement("p");
    empty.className = "buyers__empty";
    empty.textContent = "Пока никто. Будь первым!";
    box.appendChild(empty);
    return;
  }

  buyers.slice(0, 12).forEach(function (b, i) {
    var row = document.createElement("div");
    row.className = "buyer" + (i === 0 ? " buyer--top" : "");

    var place = document.createElement("span");
    place.className = "buyer__place";
    place.textContent = (i + 1) + ".";

    var name = document.createElement("span");
    name.className = "buyer__name";
    name.textContent = b.name;

    var count = document.createElement("span");
    count.className = "buyer__count";
    count.textContent = b.count + " шт";

    row.appendChild(place);
    row.appendChild(name);
    row.appendChild(count);
    box.appendChild(row);
  });
}

function syncFromServer() {
  renderBuyers(buyers);
  setSyncNote("Считается на этом устройстве", false);
  return Promise.resolve();
}

function pushToServer(name, count) {
  var entry = null;
  for (var i = 0; i < buyers.length; i++) {
    if (buyers[i] && buyers[i].name === name) { entry = buyers[i]; break; }
  }

  if (entry) {
    entry.count = (entry.count || 0) + count;
  } else {
    buyers.push({ name: name, count: count });
  }

  buyers.sort(function (a, b) { return (b.count || 0) - (a.count || 0); });
  buyers = buyers.slice(0, 20);
  write(STORE.buyers, buyers);
  renderBuyers(buyers);
  setSyncNote("Считается на этом устройстве", false);
}

/* ---------- корзина ---------- */
function cartCount() { var n = 0; for (var id in cart) n += cart[id]; return n; }

function cartSum() {
  var sum = 0;
  for (var id in cart) { var p = productById(id); if (p) sum += p.price * cart[id]; }
  return sum;
}

function cartTotal() {
  var sum = cartSum();

  if (cartCount() === 0) return 0;

  var shipCost = ship === "delivery" ? SHIP_FEE : 0;
  var freeShip = coupon && COUPONS[coupon] && COUPONS[coupon].kind === "shipping";
  if (freeShip) shipCost = 0;

  if (coupon && COUPONS[coupon] && COUPONS[coupon].kind === "percent") {
    sum = Math.round(sum * (1 - COUPONS[coupon].value / 100));
  }

  return sum + shipCost;
}

function applyCoupon(code) {
  var note = document.getElementById("couponNote");
  var clean = (code || "").trim().toUpperCase();

  if (!clean) {
    coupon = null;
    write(STORE.coupon, coupon);
    note.className = "coupon__note";
    note.textContent = "Промокод не найден — это не баг, это фича.";
    renderCart();
    return;
  }

  if (!COUPONS[clean]) {
    note.className = "coupon__note is-bad";
    note.textContent = "Промокод «" + clean + "» не подошёл. Попробуй БАБУШКА или КОСТОЧКИ.";
    return;
  }

  coupon = clean;
  write(STORE.coupon, coupon);
  note.className = "coupon__note is-ok";
  note.textContent = "Промокод применён: " + COUPONS[clean].label;
  renderCart();
  toast("Промокод «" + clean + "» применён");
}

function addToCart(id, btn) {
  var p = productById(id);
  if (!p) return;

  cart[id] = (cart[id] || 0) + 1;
  write(STORE.cart, cart);
  renderCart();
  toast(p.name + " в корзине");

  if (btn) {
    var old = btn.textContent;
    btn.textContent = "Добавлено ✓";
    btn.disabled = true;
    setTimeout(function () { btn.textContent = old; btn.disabled = false; }, 1200);
  }
  openCart();
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  write(STORE.cart, cart);
  renderCart();
}

function clearCart() {
  cart = {};
  write(STORE.cart, cart);
  renderCart();
}

function renderCart() {
  var countEl = document.getElementById("cartCount");
  var totalEl = document.getElementById("cartTotal");
  var weightEl = document.getElementById("cartWeight");
  var box = document.getElementById("cartItems");

  if (countEl) countEl.textContent = cartCount();
  if (totalEl) totalEl.textContent = money(cartTotal());
  if (weightEl) weightEl.textContent = cartWeight() + " кг · " + cartCount() + " шт";
  if (!box) return;

  box.innerHTML = "";
  var ids = Object.keys(cart);

  if (ids.length === 0) {
    var empty = document.createElement("p");
    empty.className = "cart__empty";
    empty.textContent = "Пока пусто. Купи арбуз.";
    box.appendChild(empty);
    return;
  }

  ids.forEach(function (id) {
    var prod = productById(id);
    if (!prod) return;

    var row = document.createElement("div");
    row.className = "cart__item";

    var info = document.createElement("div");
    var name = document.createElement("b");
    name.textContent = prod.icon + " " + prod.name;
    var one = document.createElement("small");
    one.textContent = money(prod.price) + " за штуку";
    info.appendChild(name);
    info.appendChild(one);

    var qty = document.createElement("div");
    qty.className = "cart__qty";

    var minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.addEventListener("click", function () { changeQty(id, -1); });

    var num = document.createElement("span");
    num.textContent = cart[id];

    var plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.addEventListener("click", function () { changeQty(id, 1); });

    qty.appendChild(minus); qty.appendChild(num); qty.appendChild(plus);

    var right = document.createElement("div");
    right.className = "cart__right";

    var price = document.createElement("div");
    price.className = "price";
    price.textContent = money(prod.price * cart[id]);

    var del = document.createElement("button");
    del.type = "button";
    del.className = "link-del";
    del.textContent = "убрать";
    del.addEventListener("click", function () {
      delete cart[id];
      write(STORE.cart, cart);
      renderCart();
    });

    right.appendChild(price);
    right.appendChild(del);

    row.appendChild(info);
    row.appendChild(qty);
    row.appendChild(right);
    box.appendChild(row);
  });
}

function openCart() {
  var c = document.getElementById("cart");
  c.hidden = false;
  c.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  var c = document.getElementById("cart");
  if (!c) return;
  c.classList.remove("is-open");
  c.hidden = true;
  c.style.display = "none";
  document.body.style.overflow = "";
}

/* ---------- доставка ---------- */
function renderShip() {
  var buttons = document.querySelectorAll(".ship__btn");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.toggle("is-active", buttons[i].getAttribute("data-ship") === ship);
  }
  document.getElementById("shipNote").textContent =
    ship === "pickup"
      ? "Самовывоз бесплатно: склад на бабушкиной даче, спроси пароль"
      : "Доставка " + money(SHIP_FEE) + " — курьер приедет за арбузом лично";
}

/* ---------- оформление заказа ---------- */
function digitsOnly(s) { return String(s).replace(/\D/g, ""); }

/* защита от автокликера */
var PAGE_LOADED_AT = Date.now();
var MIN_ORDER_GAP_MS = 10000;
var MAX_ITEMS_PER_ORDER = 20;

function orderTooFast() {
  var now = Date.now();
  if (now - PAGE_LOADED_AT < 2500) return "Секунду, страница ещё загружается.";

  var last = 0;
  try { last = parseInt(localStorage.getItem("prz_last_order") || "0", 10) || 0; } catch (e) {}
  if (now - last < MIN_ORDER_GAP_MS) {
    var left = Math.ceil((MIN_ORDER_GAP_MS - (now - last)) / 1000);
    return "Слишком быстро! Подожди " + left + " сек. и попробуй снова.";
  }

  try { localStorage.setItem("prz_last_order", String(now)); } catch (e) {}
  return null;
}

function checkout() {
  var note = document.getElementById("orderNote");

  if (cartCount() === 0) {
    note.textContent = "Сначала положи арбуз в корзину.";
    toast("Корзина пуста");
    return;
  }

  var name = document.getElementById("orderName").value.trim();
  var phone = digitsOnly(document.getElementById("orderPhone").value);
  var addr = document.getElementById("orderAddr").value.trim();

  var nameErr = nameProblem(name);
  if (nameErr) { note.textContent = nameErr; return; }
  if (phone.length < 11) { note.textContent = "Телефон должен быть из 11 цифр."; return; }
  if (addr.length < 3) { note.textContent = "Напиши адрес или слово «самовывоз»."; return; }

  var count = cartCount();
  var total = cartTotal();

  if (count > MAX_ITEMS_PER_ORDER) {
    note.textContent = "Максимум " + MAX_ITEMS_PER_ORDER + " арбузов за один заказ.";
    return;
  }

  var tooFast = orderTooFast();
  if (tooFast) {
    note.textContent = tooFast;
    return;
  }

  addSold(count);
  pushToServer(name, count);

  var orderNo = "PRZ-" + Math.floor(100000 + Math.random() * 899999);
  var usedCoupon = coupon;
  var questCodeUsed = coupon === QUEST_CODE;
  if (questCodeUsed && quest.zina && !quest.done) unlockSecretProduct();
  var receipt = buildReceipt(orderNo, count, total, addr, phone);
  showReceipt(receipt);
  note.textContent = "";
  closeCart();

  toast("Заказ " + orderNo + " на " + money(total) + ". Арбузов: " + count + ". Позвоним на +7" + phone.slice(0, 10));

  if (usedCoupon) {
    toast("Промокод «" + usedCoupon + "» сработал на этот заказ. Следующий — вводи заново.");
  }
  toast("Счётчик продаж: " + sold + " арбузов 🍉");

  /* промокод одноразовый: на следующий заказ его нужно ввести снова */
  coupon = null;
  write(STORE.coupon, null);
  document.getElementById("couponInput").value = "";
  var couponNote = document.getElementById("couponNote");
  couponNote.className = "coupon__note";
  couponNote.textContent = usedCoupon
    ? "Промокод «" + usedCoupon + "» использован. Сработает только на этот заказ."
    : "Промокод не найден — это не баг, это фича.";

  document.getElementById("orderName").value = "";
  document.getElementById("orderPhone").value = "";
  document.getElementById("orderAddr").value = "";
  clearCart();
}

/* ---------- фильтр плохих слов ---------- */
var LAT_TO_RU = { a: "а", b: "в", c: "с", e: "е", h: "н", k: "к", m: "м", o: "о", p: "р", t: "т", x: "х", y: "у", "0": "о", "3": "з", "1": "и", "4": "а", "6": "б" };

var BAD_ROOTS = [
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
  var t = String(s || "").toLowerCase().replace(/ё/g, "е");
  var out = "";
  for (var i = 0; i < t.length; i++) {
    var ch = t.charAt(i);
    if (LAT_TO_RU[ch]) ch = LAT_TO_RU[ch];
    if (/[а-я0-9]/.test(ch)) out += ch;
  }
  return out.replace(/(.)\1+/g, "$1");
}

function hasBadWords(s) {
  var ru = normalizeBad(s);
  var en = String(s || "")
    .toLowerCase()
    .replace(/[013457]/g, function (d) { return ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t" })[d]; })
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1+/g, "$1");
  var i, root;
  for (i = 0; i < BAD_ROOTS.length; i++) {
    root = BAD_ROOTS[i];
    if (/^[a-z]+$/.test(root)) {
      if (en.indexOf(root) >= 0) return true;
    } else if (ru.indexOf(root) >= 0) {
      return true;
    }
  }
  return false;
}

/* ---------- проверка имени: только настоящие имена ---------- */
/* список распространённых имён (в нижнем регистре, ё = е) */
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
(function () {
  for (var i = 0; i < NAME_WORDS.length; i++) {
    if (NAME_WORDS[i]) NAME_SET[NAME_WORDS[i]] = true;
  }
})();

/* приводим имя к аккуратному виду: «иван петров» → «Иван Петров» */
function normalizeName(s) {
  var t = String(s || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.split(" ").map(function (word) {
    return word.split("-").map(function (part) {
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join("-");
  }).join(" ");
}

/* слово похоже на фамилию: есть гласные, нет длинных каш */
function nameWordOk(word) {
  var w = String(word || "").toLowerCase().replace(/ё/g, "е");
  if (w.length < 2 || w.length > 20) return false;
  var vowels = (w.match(/[аеиоуыэюя]/g) || []).length;
  if (!vowels) return false;
  if (vowels < Math.ceil(w.length / 4)) return false;
  if (/[аеиоуыэюя]{4,}/.test(w)) return false;
  if (/[^аеиоуыэюя]{4,}/.test(w)) return false;
  if (/(.)\1\1/.test(w)) return false;
  return true;
}

/* куски, которых в настоящих именах не бывает — по ним ловим «ываплро» */
var MASH_PARTS = ["фыв", "ыва", "вап", "апр", "прол", "олд", "йцу", "цук", "укен", "ячс", "чсм", "сми", "плр", "вгл", "asdf", "qwer", "zxcv", "hjkl"];

/* слово похоже на настоящее имя, даже если его нет в списке */
function nameWordLooksReal(w) {
  if (!nameWordOk(w)) return false;
  var vowels = (w.match(/[аеиоуыэюя]/g) || []).length;
  if (vowels < Math.ceil(w.length * 0.3)) return false;
  for (var i = 0; i < MASH_PARTS.length; i++) {
    if (w.indexOf(MASH_PARTS[i]) >= 0) return false;
  }
  return true;
}

/* первое слово должно быть настоящим именем, остальные — фамилией */
function looksLikeName(t) {
  var words = String(t || "").toLowerCase().replace(/ё/g, "е").split(/[ \-]+/).filter(function (w) { return !!w; });
  if (!words.length) return false;

  /* имя: либо из списка, либо очень похожее на настоящее */
  if (!NAME_SET[words[0]] && !nameWordLooksReal(words[0])) return false;

  /* остальные слова — фамилия */
  for (var i = 1; i < words.length; i++) {
    if (!nameWordOk(words[i])) return false;
  }
  return true;
}

/* строгая проверка имени: только русские буквы и настоящее имя */
function nameProblem(s) {
  var t = String(s || "").trim().replace(/\s+/g, " ");
  if (t.length < 2) return "Напиши, как тебя зовут.";
  if (t.length > 30) return "Слишком длинное имя — максимум 30 букв.";
  if (!/^[А-Яа-яЁё\- ]+$/.test(t)) return "В имени можно только русские буквы, пробел и дефис.";
  if (hasBadWords(t)) return "Давай без мата — у нас тут бабушки.";
  if (!looksLikeName(t)) return "Это не похоже на имя. Напиши настоящее имя, например: Иван или Мария.";
  return null;
}

/* ---------- отзывы ---------- */
function renderReviews() {
  var box = document.getElementById("reviewList");
  box.innerHTML = "";

  BASE_REVIEWS.concat(reviews).forEach(function (r) {
    var b = document.createElement("blockquote");
    b.className = "review";

    var p = document.createElement("p");
    p.textContent = "«" + r.text + "»";

    var f = document.createElement("footer");
    f.textContent = "— " + r.name + ", " + (r.tag || "отзыв");

    b.appendChild(p);
    b.appendChild(f);
    box.appendChild(b);
  });
}

function addReview(event) {
  event.preventDefault();

  var name = document.getElementById("reviewName").value.trim();
  var text = document.getElementById("reviewText").value.trim();
  var note = document.getElementById("reviewNote");

  var nameErr = nameProblem(name);
  if (nameErr) { note.textContent = nameErr; return; }
  if (text.length < 5) { note.textContent = "Отзыв слишком короткий."; return; }

  if (hasBadWords(text)) {
    note.textContent = "Давай без мата — у нас тут бабушки читают.";
    return;
  }

  reviews.push({ name: name, text: text, tag: "твой отзыв" });
  write(STORE.reviews, reviews);
  renderReviews();

  note.textContent = "Спасибо! Отзыв уже в списке.";
  document.getElementById("reviewName").value = "";
  document.getElementById("reviewText").value = "";
  toast("Отзыв добавлен");
}

/* ---------- общий счётчик продаж ---------- */
var SOLD_API = "https://abacus.jasoncameron.dev";
var SOLD_NS = "pereprodazhniki-sold-v2";
var SOLD_KEY = "total";
var soldLiveStarted = false;

/* плавно показываем новое общее значение (без повторной отправки на сервер) */
function setSold(value, animate) {
  if (typeof value !== "number" || !isFinite(value) || value < 0) return false;

  var from = sold;
  if (value === from) {
    renderSold();
    return false;
  }

  sold = value;
  write(STORE.sold, sold);

  if (!animate) {
    renderSold();
    return true;
  }

  var hero = document.getElementById("soldCount");
  var top = document.getElementById("soldTop");
  var box = document.getElementById("soldBox");

  if (box) {
    box.classList.add("is-bump");
    setTimeout(function () { box.classList.remove("is-bump"); }, 520);
  }

  var steps = 10;
  var i = 0;
  var timer = setInterval(function () {
    i++;
    var v = Math.round(from + (sold - from) * (i / steps));
    if (hero) hero.textContent = v;
    if (top) top.textContent = v;
    if (i >= steps) {
      clearInterval(timer);
      renderSold();
    }
  }, 35);

  return true;
}

function loadSold() {
  return fetch(SOLD_API + "/get/" + SOLD_NS + "/" + SOLD_KEY, { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d && typeof d.value === "number") setSold(d.value, false);
    })
    .catch(function () {});
}

/* обновления счётчика в реальном времени для всех посетителей */
function startSoldLive() {
  if (soldLiveStarted) return;
  soldLiveStarted = true;

  if (typeof window.EventSource === "function") {
    try {
      var es = new EventSource(SOLD_API + "/stream/" + SOLD_NS + "/" + SOLD_KEY);
      es.onmessage = function (ev) {
        try {
          var d = JSON.parse(ev.data);
          if (d && typeof d.value === "number") setSold(d.value, true);
        } catch (e) {}
      };
      /* при обрыве EventSource сам переподключается, опрос ниже страхует */
      es.onerror = function () {};
    } catch (e) {}
  }

  setInterval(function () {
    if (!document.hidden) loadSold();
  }, 25000);

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) loadSold();
  });
}

function pushSold(n) {
  var hits = [];
  for (var i = 0; i < n; i++) {
    hits.push(fetch(SOLD_API + "/hit/" + SOLD_NS + "/" + SOLD_KEY).catch(function () {}));
  }
  return Promise.all(hits)
    .then(function () {
      return fetch(SOLD_API + "/get/" + SOLD_NS + "/" + SOLD_KEY, { cache: "no-store" });
    })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d && typeof d.value === "number") setSold(d.value, true);
    })
    .catch(function () {});
}

function renderSold() {
  var hero = document.getElementById("soldCount");
  var top = document.getElementById("soldTop");
  if (hero) hero.textContent = sold;
  if (top) top.textContent = sold;
}

/* увеличиваем счётчик с «перекруткой» цифр */
function addSold(n) {
  var from = sold;
  sold = sold + n;
  write(STORE.sold, sold);

  var hero = document.getElementById("soldCount");
  var box = document.getElementById("soldBox");
  var top = document.getElementById("soldTop");

  if (box) {
    box.classList.add("is-bump");
    setTimeout(function () { box.classList.remove("is-bump"); }, 520);
  }
  if (hero) hero.classList.add("is-bump");

  var steps = 12;
  var i = 0;
  var timer = setInterval(function () {
    i++;
    var value = Math.round(from + (sold - from) * (i / steps));
    if (hero) hero.textContent = value;
    if (top) top.textContent = value;
    if (i >= steps) {
      clearInterval(timer);
      renderSold();
      if (hero) hero.classList.remove("is-bump");
      pushSold(n);
    }
  }, 35);
}

/* ---------- поделиться ---------- */
function copyCurrentLink() {
  var link = window.location.href;
  var done = function () { toast("Ссылка скопирована"); };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(done, fallbackCopy);
  } else {
    fallbackCopy();
  }

  function fallbackCopy() {
    var ta = document.createElement("textarea");
    ta.value = link;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); }
    catch (e) { toast("Скопируй вручную: " + link); }
    document.body.removeChild(ta);
  }
}

function setupShare() {
  var url = encodeURIComponent(window.location.href);
  var text = encodeURIComponent("Залетай на Pereprodazhniki — тут продают арбузы со смехом");

  var tg = document.getElementById("shareTg");
  var vk = document.getElementById("shareVk");
  if (tg) tg.href = "https://t.me/share/url?url=" + url + "&text=" + text;
  if (vk) vk.href = "https://vk.com/share.php?url=" + url + "&title=" + text;

  var copy = document.getElementById("copyLink");
  if (copy) copy.addEventListener("click", copyCurrentLink);
}

/* ---------- калькулятор ---------- */
function renderCalc() {
  var perWeek = parseInt(document.getElementById("calcPerWeek").value, 10);
  var weight = parseInt(document.getElementById("calcWeight").value, 10);

  document.getElementById("calcPerWeekOut").textContent = perWeek;
  document.getElementById("calcWeightOut").textContent = weight + " кг";

  var yearKg = perWeek * weight * 52;
  var yearMoney = yearKg * 400;
  var lifetimes = Math.floor(yearKg / weight);

  document.getElementById("calcYearKg").textContent = yearKg.toLocaleString("ru-RU");
  document.getElementById("calcYearMoney").textContent = money(yearMoney);
  document.getElementById("calcLifetimes").textContent = lifetimes;

  var note = document.getElementById("calcNote");
  note.classList.remove("is-warn");

  if (yearKg > 2000) {
    note.classList.add("is-warn");
    note.textContent = "Это " + Math.round(yearKg / 1000 * 10) / 10 + " тонны в год. Позвони вожатю.";
  } else if (yearKg > 700) {
    note.classList.add("is-warn");
    note.textContent = "Серьёзный аппетит. Готовы выдать скидку оптом.";
  } else if (perWeek <= 2) {
    note.textContent = "Скромно. Купи один боевой — и статистика исправится.";
  } else {
    note.textContent = "Нормальный аппетит. Ничего подозрительного.";
  }
}

/* ---------- розыгрыш ---------- */
var PRIZES = [
  { weight: 40, text: "Ничего. Но мы улыбнулись в твою сторону." },
  { weight: 18, text: "Скидка 50 ₽ на следующий заказ." },
  { weight: 18, text: "Беленький передаёт привет и обещает поставку." },
  { weight: 14, text: "Сафия вписала тебя в список должников." },
  { weight: 10, text: "Подарок: самый дешёвый арбуз добавлен в корзину!", gift: true }
];

function spin() {
  var total = 0;
  PRIZES.forEach(function (p) { total += p.weight; });

  var roll = Math.random() * total;
  var acc = 0;
  var chosen = PRIZES[0];

  for (var i = 0; i < PRIZES.length; i++) {
    acc += PRIZES[i].weight;
    if (roll <= acc) { chosen = PRIZES[i]; break; }
  }

  document.getElementById("lotteryResult").textContent = chosen.text;

  if (chosen.gift) {
    var cheapest = PRODUCTS[0];
    for (var j = 1; j < PRODUCTS.length; j++) {
      if (PRODUCTS[j].price < cheapest.price) cheapest = PRODUCTS[j];
    }
    cart[cheapest.id] = (cart[cheapest.id] || 0) + 1;
    write(STORE.cart, cart);
    renderCart();
  }

  var log = document.getElementById("lotteryLog");
  var li = document.createElement("li");
  li.textContent = chosen.text;
  log.insertBefore(li, log.firstChild);

  while (log.children.length > 5) log.removeChild(log.lastChild);
}

/* ---------- отсчёт до конца сезона ---------- */
function renderSeason() {
  var now = new Date();
  var end = new Date(now.getFullYear(), 11, 31);
  var days = Math.ceil((end - now) / 86400000);
  document.getElementById("seasonDays").textContent = days < 0 ? 0 : days;
}

/* ---------- тема ---------- */
function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  var btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = theme === "light" ? "☀️" : "🌙";
}

function initTheme() {
  var saved = "dark";
  try { saved = localStorage.getItem("prz_theme") || "dark"; } catch (e) {}
  applyTheme(saved);

  var btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.addEventListener("click", function () {
    var next = document.body.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem("prz_theme", next); } catch (e) {}
    toast(next === "light" ? "Светлая тема" : "Тёмная тема");
  });
}

/* ---------- музыка: синтез в браузере, без файлов ---------- */
var MUSIC = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  noise: null,
  on: false,
  timer: null,
  step: 0,
  loops: 0,
  nextTime: 0,
  vol: 45,
  track: 0
};

/* 5 оригинальных треков «в стиле» — без чужих прав */
var TRACKS = [
  {
    name: "Арбузный шансон",
    bpm: 92,
    wave: "triangle",
    bassWave: "sine",
    pad: true,
    arp: true,
    kick: [0, 8],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    chords: [
      { bass: 45, notes: [57, 60, 64] },
      { bass: 38, notes: [50, 53, 57] },
      { bass: 40, notes: [52, 56, 59] },
      { bass: 45, notes: [57, 60, 64] }
    ],
    melody: [
      69, 0, 72, 0, 76, 0, 72, 0, 69, 0, 0, 72, 0, 76, 0, 0,
      74, 0, 0, 72, 0, 69, 0, 0, 65, 0, 69, 0, 72, 0, 0, 0,
      68, 0, 71, 0, 76, 0, 71, 0, 68, 0, 0, 64, 0, 68, 0, 0,
      69, 0, 72, 0, 76, 0, 81, 0, 76, 0, 72, 0, 69, 0, 0, 0
    ]
  },
  {
    name: "Дискотека у бабушки",
    bpm: 118,
    wave: "square",
    bassWave: "sawtooth",
    pad: true,
    arp: true,
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    chords: [
      { bass: 45, notes: [57, 60, 64, 67] },
      { bass: 41, notes: [53, 57, 60, 64] },
      { bass: 36, notes: [52, 55, 59, 64] },
      { bass: 43, notes: [55, 59, 62, 65] }
    ],
    melody: [
      76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 72, 0, 76, 0, 79, 0,
      72, 0, 76, 0, 79, 0, 76, 0, 72, 0, 69, 0, 72, 0, 76, 0,
      79, 0, 76, 0, 72, 0, 76, 0, 79, 0, 81, 0, 79, 0, 76, 0,
      74, 0, 79, 0, 83, 0, 79, 0, 74, 0, 71, 0, 74, 0, 79, 0
    ]
  },
  {
    name: "Ночной перекуп",
    bpm: 100,
    wave: "sawtooth",
    bassWave: "square",
    pad: true,
    arp: true,
    kick: [0, 8],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    chords: [
      { bass: 45, notes: [57, 60, 64] },
      { bass: 41, notes: [53, 57, 60] },
      { bass: 36, notes: [52, 55, 59] },
      { bass: 43, notes: [55, 59, 62] }
    ],
    melody: [
      69, 0, 0, 0, 72, 0, 0, 0, 76, 0, 0, 0, 72, 0, 0, 0,
      65, 0, 0, 0, 69, 0, 0, 0, 72, 0, 0, 0, 69, 0, 0, 0,
      67, 0, 0, 0, 72, 0, 0, 0, 76, 0, 0, 0, 72, 0, 0, 0,
      67, 0, 0, 0, 71, 0, 0, 0, 74, 0, 0, 0, 71, 0, 0, 0
    ]
  },
  {
    name: "Колхозный рэп",
    bpm: 88,
    wave: "triangle",
    bassWave: "sine",
    pad: false,
    arp: false,
    kick: [0, 6, 10],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    chords: [
      { bass: 45, notes: [57, 60, 64] },
      { bass: 43, notes: [55, 59, 62] },
      { bass: 41, notes: [53, 57, 60] },
      { bass: 40, notes: [52, 56, 59] }
    ],
    melody: [
      57, 0, 0, 60, 0, 0, 64, 0, 0, 0, 60, 0, 57, 0, 0, 0,
      55, 0, 0, 59, 0, 0, 62, 0, 0, 0, 59, 0, 55, 0, 0, 0,
      53, 0, 0, 57, 0, 0, 60, 0, 0, 0, 57, 0, 53, 0, 0, 0,
      52, 0, 0, 56, 0, 0, 59, 0, 0, 0, 56, 0, 52, 0, 0, 0
    ]
  },
  {
    name: "Лоу-фай на балконе",
    bpm: 76,
    wave: "sine",
    bassWave: "triangle",
    pad: true,
    arp: false,
    kick: [0, 10],
    snare: [8],
    hat: [2, 6, 10, 14],
    chords: [
      { bass: 45, notes: [57, 60, 64, 67] },
      { bass: 38, notes: [50, 53, 57, 60] },
      { bass: 41, notes: [53, 57, 60, 64] },
      { bass: 40, notes: [52, 56, 59, 62] }
    ],
    melody: [
      76, 0, 0, 74, 0, 72, 0, 0, 69, 0, 0, 72, 0, 74, 0, 0,
      74, 0, 0, 72, 0, 69, 0, 0, 65, 0, 0, 69, 0, 72, 0, 0,
      72, 0, 0, 69, 0, 67, 0, 0, 64, 0, 0, 67, 0, 69, 0, 0,
      71, 0, 0, 68, 0, 64, 0, 0, 59, 0, 0, 64, 0, 68, 0, 0
    ]
  }
];

(function musicPrefs() {
  var v = read("prz_music_vol", 45);
  if (typeof v === "number" && v >= 0 && v <= 100) MUSIC.vol = Math.round(v);
  var t = read("prz_music_track", 0);
  if (typeof t === "number" && t >= 0 && t < TRACKS.length) MUSIC.track = Math.floor(t);
})();

function musicStepDur() { return 60 / TRACKS[MUSIC.track].bpm / 4; }

function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function musicVolumeGain() {
  var v = Math.max(0, Math.min(100, MUSIC.vol)) / 100;
  return Math.max(0.0001, v * v * 0.55);
}

function audioCtx() {
  if (!MUSIC.ctx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      MUSIC.ctx = new AC();
    } catch (e) {
      /* звук запрещён браузером — игра должна работать без него */
      return null;
    }

    MUSIC.master = MUSIC.ctx.createGain();
    MUSIC.master.gain.value = 0.9;
    MUSIC.master.connect(MUSIC.ctx.destination);

    MUSIC.musicGain = MUSIC.ctx.createGain();
    MUSIC.musicGain.gain.value = 0.0001;
    MUSIC.musicGain.connect(MUSIC.master);

    MUSIC.sfxGain = MUSIC.ctx.createGain();
    MUSIC.sfxGain.gain.value = 0.5;
    MUSIC.sfxGain.connect(MUSIC.master);

    MUSIC.noise = MUSIC.ctx.createBuffer(1, Math.floor(MUSIC.ctx.sampleRate * 0.5), MUSIC.ctx.sampleRate);
    var data = MUSIC.noise.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (MUSIC.ctx.state === "suspended") {
    try { MUSIC.ctx.resume(); } catch (e) {}
  }
  return MUSIC.ctx;
}

function playTone(freq, time, dur, type, gain, dest) {
  var ctx = MUSIC.ctx;
  if (!ctx) return;
  var o = ctx.createOscillator();
  var g = ctx.createGain();
  o.type = type || "triangle";
  o.frequency.setValueAtTime(freq, time);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), time + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.connect(g);
  g.connect(dest || MUSIC.musicGain);
  o.start(time);
  o.stop(time + dur + 0.05);
}

function playPad(freqs, time, dur) {
  var ctx = MUSIC.ctx;
  if (!ctx) return;
  var filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 950;
  filter.Q.value = 0.6;
  var g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(0.05, time + 0.4);
  g.gain.linearRampToValueAtTime(0.0001, time + dur);
  filter.connect(g);
  g.connect(MUSIC.musicGain);
  for (var i = 0; i < freqs.length; i++) {
    var o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freqs[i];
    o.detune.value = (i % 2 === 0) ? -5 : 5;
    o.connect(filter);
    o.start(time);
    o.stop(time + dur + 0.1);
  }
}

function playKick(time) {
  var ctx = MUSIC.ctx;
  if (!ctx) return;
  var o = ctx.createOscillator();
  var g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(130, time);
  o.frequency.exponentialRampToValueAtTime(45, time + 0.16);
  g.gain.setValueAtTime(0.4, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  o.connect(g);
  g.connect(MUSIC.musicGain);
  o.start(time);
  o.stop(time + 0.25);
}

function playHat(time, gain) {
  var ctx = MUSIC.ctx;
  if (!ctx) return;
  var src = ctx.createBufferSource();
  src.buffer = MUSIC.noise;
  var f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 7500;
  var g = ctx.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  src.connect(f);
  f.connect(g);
  g.connect(MUSIC.musicGain);
  src.start(time);
  src.stop(time + 0.06);
}

function playSnare(time, gain) {
  var ctx = MUSIC.ctx;
  if (!ctx) return;
  var src = ctx.createBufferSource();
  src.buffer = MUSIC.noise;
  var f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1900;
  f.Q.value = 0.8;
  var g = ctx.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  src.connect(f);
  f.connect(g);
  g.connect(MUSIC.musicGain);
  src.start(time);
  src.stop(time + 0.17);

  playTone(190, time, 0.09, "triangle", gain * 0.5);
}

function scheduleStep(step, t) {
  var tr = TRACKS[MUSIC.track];
  var bar = Math.floor(step / 16) % 4;
  var s = step % 16;
  var ch = tr.chords[bar];
  var dur = musicStepDur();

  if (tr.kick.indexOf(s) >= 0) {
    playKick(t);
    playTone(midiToFreq(ch.bass), t, 0.5, tr.bassWave, 0.2);
  }
  if (tr.snare.indexOf(s) >= 0) playSnare(t, 0.1);
  if (tr.hat.indexOf(s) >= 0) playHat(t, 0.045);

  if (tr.pad && s === 0) playPad(ch.notes.map(midiToFreq), t, dur * 15.5);

  if (tr.arp && s % 2 === 0) {
    var idx = (s / 2) % ch.notes.length;
    var oct = (s === 6 || s === 14) ? 12 : 0;
    playTone(midiToFreq(ch.notes[idx] + 12 + oct), t, 0.3, tr.wave, 0.065);
  }

  var mel = tr.melody[step];
  if (mel) playTone(midiToFreq(mel), t, 0.5, tr.wave === "square" ? "square" : "triangle", 0.055);
}

function musicTick() {
  var ctx = MUSIC.ctx;
  if (!ctx || !MUSIC.on) return;
  var guard = 0;
  while (MUSIC.nextTime < ctx.currentTime + 0.35 && guard++ < 80) {
    scheduleStep(MUSIC.step, MUSIC.nextTime);
    MUSIC.nextTime += musicStepDur();
    MUSIC.step += 1;

    if (MUSIC.step >= 64) {
      MUSIC.step = 0;
      MUSIC.loops += 1;
      if (MUSIC.loops >= 4) {
        MUSIC.loops = 0;
        MUSIC.track = (MUSIC.track + 1) % TRACKS.length;
        write("prz_music_track", MUSIC.track);
        updateMusicUI();
      }
    }
  }
}

function setTrack(i, silent) {
  MUSIC.track = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
  write("prz_music_track", MUSIC.track);
  MUSIC.step = 0;
  MUSIC.loops = 0;

  var ctx = MUSIC.ctx;
  if (MUSIC.on && ctx && MUSIC.musicGain) {
    MUSIC.nextTime = ctx.currentTime + 0.12;
    MUSIC.musicGain.gain.cancelScheduledValues(ctx.currentTime);
    MUSIC.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    MUSIC.musicGain.gain.linearRampToValueAtTime(musicVolumeGain(), ctx.currentTime + 0.35);
  }

  updateMusicUI();
  if (!silent) toast("Трек: " + TRACKS[MUSIC.track].name);
}

function startMusic() {
  var ctx = audioCtx();
  if (!ctx) { toast("Браузер не поддерживает звук"); return; }
  if (MUSIC.on) return;

  MUSIC.on = true;
  MUSIC.step = 0;
  MUSIC.loops = 0;
  MUSIC.nextTime = ctx.currentTime + 0.15;

  MUSIC.musicGain.gain.cancelScheduledValues(ctx.currentTime);
  MUSIC.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  MUSIC.musicGain.gain.linearRampToValueAtTime(musicVolumeGain(), ctx.currentTime + 0.6);

  MUSIC.timer = setInterval(musicTick, 60);
  musicTick();
  updateMusicUI();
}

function stopMusic() {
  if (!MUSIC.on) return;
  MUSIC.on = false;
  if (MUSIC.timer) {
    clearInterval(MUSIC.timer);
    MUSIC.timer = null;
  }
  var ctx = MUSIC.ctx;
  if (ctx && MUSIC.musicGain) {
    MUSIC.musicGain.gain.cancelScheduledValues(ctx.currentTime);
    MUSIC.musicGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
  }
  updateMusicUI();
}

function setMusicVolume(v) {
  MUSIC.vol = Math.max(0, Math.min(100, Math.round(v)));
  write("prz_music_vol", MUSIC.vol);
  var ctx = MUSIC.ctx;
  if (ctx && MUSIC.musicGain) {
    MUSIC.musicGain.gain.cancelScheduledValues(ctx.currentTime);
    MUSIC.musicGain.gain.setTargetAtTime(MUSIC.on ? musicVolumeGain() : 0.0001, ctx.currentTime, 0.05);
  }
  updateMusicUI();
}

function updateMusicUI() {
  var btn = document.getElementById("musicBtn");
  var play = document.getElementById("musicPlay");
  var note = document.getElementById("musicNote");
  var volOut = document.getElementById("musicVolOut");
  var vol = document.getElementById("musicVol");
  var name = document.getElementById("musicTrack");
  var tr = TRACKS[MUSIC.track];

  if (btn) {
    btn.textContent = MUSIC.on ? "🎶" : "🎵";
    btn.classList.toggle("is-on", MUSIC.on);
    btn.title = MUSIC.on ? "Музыка играет — нажми, чтобы настроить" : "Музыка выключена";
  }
  if (play) play.textContent = MUSIC.on ? "⏸ Выключить" : "▶ Включить";
  if (name) name.textContent = (MUSIC.track + 1) + "/" + TRACKS.length + " · " + tr.name;
  if (note) {
    note.textContent = MUSIC.on
      ? "Играет «" + tr.name + "». Громкость — ползунком ниже."
      : "5 треков в стиле русской попсы. По умолчанию выключено.";
  }
  if (volOut) volOut.textContent = MUSIC.vol + "%";
  if (vol) vol.value = MUSIC.vol;
}

function initMusic() {
  var btn = document.getElementById("musicBtn");
  var panel = document.getElementById("musicPanel");
  var play = document.getElementById("musicPlay");
  var vol = document.getElementById("musicVol");
  var prev = document.getElementById("musicPrev");
  var next = document.getElementById("musicNext");
  if (!btn || !panel || !play || !vol) return;

  updateMusicUI();

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
    btn.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
  });

  play.addEventListener("click", function () {
    if (MUSIC.on) stopMusic(); else startMusic();
  });

  if (prev) prev.addEventListener("click", function () { setTrack(MUSIC.track - 1); });
  if (next) next.addEventListener("click", function () { setTrack(MUSIC.track + 1); });

  vol.addEventListener("input", function () {
    setMusicVolume(parseInt(this.value, 10) || 0);
  });

  document.addEventListener("click", function (e) {
    if (panel.hidden) return;
    if (panel.contains(e.target) || btn.contains(e.target)) return;
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  });
}

/* ---------- мини-игра «Арбузный слайсер» ---------- */
var GAME = {
  canvas: null,
  ctx: null,
  dpr: 1,
  W: 900,
  H: 460,
  running: false,
  over: false,
  paused: false,
  raf: 0,
  lastTs: 0,
  score: 0,
  best: 0,
  lives: 3,
  combo: 1,
  lastSliceAt: -99,
  objects: [],
  particles: [],
  texts: [],
  splats: [],
  trail: [],
  pointerDown: false,
  px: 0,
  py: 0,
  spawnTimer: 0.6,
  elapsed: 0,
  shake: 0,
  flash: 0,
  sound: true
};

(function gamePrefs() {
  var b = read("prz_game_best", 0);
  if (typeof b === "number" && b > 0) GAME.best = Math.floor(b);
  GAME.sound = read("prz_game_sound", true) !== false;
})();

function gameResize() {
  var c = GAME.canvas;
  if (!c) return;
  var rect = c.getBoundingClientRect();
  var w = Math.max(280, Math.round(rect.width));
  var h = Math.max(240, Math.round(rect.height));
  GAME.dpr = Math.min(2, window.devicePixelRatio || 1);
  GAME.W = w;
  GAME.H = h;
  c.width = Math.round(w * GAME.dpr);
  c.height = Math.round(h * GAME.dpr);
  GAME.ctx.setTransform(GAME.dpr, 0, 0, GAME.dpr, 0, 0);
  if (!GAME.running) gameDrawIdle();
}

function gamePos(e) {
  var rect = GAME.canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (GAME.W / rect.width),
    y: (e.clientY - rect.top) * (GAME.H / rect.height)
  };
}

function gameUpdateHud() {
  var score = document.getElementById("gameScore");
  var best = document.getElementById("gameBest");
  var lives = document.getElementById("gameLives");
  var combo = document.getElementById("gameCombo");
  var sound = document.getElementById("gameSound");

  if (score) score.textContent = GAME.score;
  if (best) best.textContent = GAME.best;
  if (lives) {
    var hearts = "";
    for (var i = 0; i < 3; i++) hearts += (i < GAME.lives) ? "❤️" : "🖤";
    lives.textContent = hearts;
  }
  if (combo) combo.textContent = "x" + GAME.combo;
  if (sound) sound.textContent = GAME.sound ? "🔊" : "🔇";
  gameUpdateComboBar();
}

function gameUpdateComboBar() {
  var fill = document.getElementById("gameComboFill");
  if (!fill) return;

  var left = 0;
  if (GAME.combo > 1) {
    left = 1 - (GAME.elapsed - GAME.lastSliceAt) / 1.6;
    if (left < 0) left = 0;
  }
  fill.style.width = Math.round(left * 100) + "%";
}

function gameBurst(x, y, count, colors) {
  for (var i = 0; i < count; i++) {
    var a = Math.random() * Math.PI * 2;
    var sp = 60 + Math.random() * 330;
    var life = 0.45 + Math.random() * 0.55;
    GAME.particles.push({
      x: x,
      y: y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 70,
      r: 2 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: life,
      maxLife: life
    });
  }
}

function gameSplat(x, y, r, color) {
  GAME.splats.push({ x: x, y: y, r: r, color: color, life: 0.9, maxLife: 0.9 });
}

function gameText(x, y, text, color) {
  GAME.texts.push({ x: x, y: y, text: text, color: color, life: 0.95, maxLife: 0.95 });
}

function spawnMelon() {
  var W = GAME.W;
  var H = GAME.H;
  var r = 24 + Math.random() * 14;
  var x = 60 + Math.random() * Math.max(40, W - 120);
  var g = 1500;
  var peak = H * (0.42 + Math.random() * 0.32);
  var vy = -Math.sqrt(2 * g * peak);
  var vx = (W / 2 - x) * 0.35 + (Math.random() - 0.5) * 90;
  var type = "melon";
  var roll = Math.random();
  if (roll < 0.13) type = "bomb";
  else if (roll < 0.21) type = "gold";

  GAME.objects.push({
    x: x,
    y: H + r + 10,
    vx: vx,
    vy: vy,
    r: r,
    type: type,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 2.2
  });
}

function segDist(px, py, x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  var len2 = dx * dx + dy * dy;
  var t = len2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  var qx = x1 + dx * t;
  var qy = y1 + dy * t;
  var ex = px - qx;
  var ey = py - qy;
  return Math.sqrt(ex * ex + ey * ey);
}

function gameSliceSegment(x1, y1, x2, y2) {
  for (var i = GAME.objects.length - 1; i >= 0; i--) {
    var o = GAME.objects[i];
    if (segDist(o.x, o.y, x1, y1, x2, y2) < o.r * 0.92) sliceMelon(o);
  }
}

function gameSliceAt(x, y) {
  for (var i = GAME.objects.length - 1; i >= 0; i--) {
    var o = GAME.objects[i];
    var dx = x - o.x;
    var dy = y - o.y;
    if (dx * dx + dy * dy < o.r * o.r) sliceMelon(o);
  }
}

function sliceMelon(o) {
  var idx = GAME.objects.indexOf(o);
  if (idx < 0) return;
  GAME.objects.splice(idx, 1);

  if (o.type === "bomb") {
    GAME.lives -= 1;
    GAME.combo = 1;
    GAME.shake = 18;
    GAME.flash = 0.85;
    gameBurst(o.x, o.y, 26, ["#ff4d5a", "#ff8fa3", "#2b0a0e", "#ffd166"]);
    sfxBomb();
    gameUpdateHud();
    if (GAME.lives <= 0) gameOver();
    return;
  }

  var now = GAME.elapsed;
  GAME.combo = (now - GAME.lastSliceAt < 1.5) ? Math.min(5, GAME.combo + 1) : 1;
  GAME.lastSliceAt = now;

  var pts = (o.type === "gold" ? 50 : 10) * GAME.combo;
  GAME.score += pts;

  gameBurst(
    o.x, o.y,
    o.type === "gold" ? 24 : 16,
    o.type === "gold" ? ["#ffd166", "#fff3b0", "#ffb703"] : ["#ff4d5a", "#ff8fa3", "#2fd35f", "#b6f06a"]
  );
  gameSplat(o.x, o.y, o.r * 1.7, o.type === "gold" ? "#ffd166" : "#ff4d5a");
  gameText(o.x, o.y - 12, "+" + pts + (GAME.combo > 1 ? " x" + GAME.combo : ""), o.type === "gold" ? "#ffd166" : "#eafff1");

  if (o.type === "gold") sfxGold(); else sfxSlice();
  gameUpdateHud();
}

function gameUpdate(dt) {
  GAME.elapsed += dt;

  GAME.spawnTimer -= dt;
  if (GAME.spawnTimer <= 0) {
    var gap = Math.max(0.45, 0.95 - GAME.elapsed * 0.014);
    GAME.spawnTimer = gap * (0.7 + Math.random() * 0.7);
    spawnMelon();
    if (GAME.elapsed > 12 && Math.random() < 0.35) spawnMelon();
  }

  var g = 1500;
  var i, o;
  for (i = GAME.objects.length - 1; i >= 0; i--) {
    o = GAME.objects[i];
    o.vy += g * dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.rot += o.vr * dt;
    if (o.y - o.r > GAME.H + 80) {
      GAME.objects.splice(i, 1);
      if (o.type !== "bomb") GAME.combo = 1;
    }
  }

  for (i = GAME.particles.length - 1; i >= 0; i--) {
    var p = GAME.particles[i];
    p.vy += 950 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) GAME.particles.splice(i, 1);
  }

  for (i = GAME.texts.length - 1; i >= 0; i--) {
    var t = GAME.texts[i];
    t.y -= 42 * dt;
    t.life -= dt;
    if (t.life <= 0) GAME.texts.splice(i, 1);
  }

  for (i = GAME.splats.length - 1; i >= 0; i--) {
    var s = GAME.splats[i];
    s.life -= dt;
    if (s.life <= 0) GAME.splats.splice(i, 1);
  }

  if (GAME.shake > 0) GAME.shake = Math.max(0, GAME.shake - dt * 45);
  if (GAME.flash > 0) GAME.flash = Math.max(0, GAME.flash - dt * 2.2);

  if (GAME.elapsed - GAME.lastSliceAt > 1.6 && GAME.combo > 1) {
    GAME.combo = 1;
    gameUpdateHud();
  }

  gameUpdateComboBar();
}

function gameDrawMelonBody(ctx, r, type) {
  var gold = type === "gold";

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = gold ? "#ffd166" : "#1f9d47";
  ctx.fill();

  ctx.strokeStyle = gold ? "#b8860b" : "#0f6b30";
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  for (var k = 0; k < 6; k++) {
    var a = k * Math.PI / 3 + 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.87, a, a + 0.34);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.fillStyle = gold ? "#ffb703" : "#e63946";
  ctx.fill();

  ctx.fillStyle = gold ? "#7a4a00" : "#2b0a0e";
  for (var s = 0; s < 7; s++) {
    var ang = s * Math.PI * 2 / 7 + 0.35;
    var rad = r * 0.42;
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(ang) * rad,
      Math.sin(ang) * rad,
      Math.max(1.2, r * 0.06),
      Math.max(1.8, r * 0.1),
      ang, 0, Math.PI * 2
    );
    ctx.fill();
  }
}

function gameDrawObject(o) {
  var ctx = GAME.ctx;
  var r = o.r;

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.rot);
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (o.type === "bomb") {
    var pulse = 1.25 + Math.sin(GAME.elapsed * 7) * 0.08;
    ctx.beginPath();
    ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,77,90,.45)";
    ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.stroke();

    ctx.shadowColor = "rgba(255,60,80,.8)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = "#2b0a0e";
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.strokeStyle = "#ff4d5a";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(r * 0.32, -r * 0.78);
    ctx.quadraticCurveTo(r * 0.95, -r * 1.15, r * 0.55, -r * 1.55);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.stroke();

    ctx.font = Math.round(r * 1.15) + "px serif";
    ctx.fillText("🐷", 0, r * 0.06);
  } else {
    ctx.shadowColor = o.type === "gold" ? "rgba(255,209,102,.9)" : "rgba(47,211,95,.65)";
    ctx.shadowBlur = o.type === "gold" ? 22 : 14;
    gameDrawMelonBody(ctx, r, o.type);
    ctx.shadowBlur = 0;

    if (o.type === "gold") {
      ctx.globalAlpha = 0.95;
      ctx.font = Math.round(r * 0.8) + "px serif";
      ctx.fillText("✨", r * 0.95, -r * 0.95);
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();
}

function gameDraw() {
  var ctx = GAME.ctx;
  if (!ctx) return;
  var W = GAME.W;
  var H = GAME.H;
  var i, p;

  ctx.clearRect(0, 0, W, H);

  var sx = 0;
  var sy = 0;
  if (GAME.shake > 0.2) {
    sx = (Math.random() - 0.5) * GAME.shake;
    sy = (Math.random() - 0.5) * GAME.shake;
  }

  ctx.save();
  ctx.translate(sx, sy);

  for (i = 0; i < GAME.splats.length; i++) {
    p = GAME.splats[i];
    ctx.globalAlpha = 0.25 * Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (i = 0; i < GAME.objects.length; i++) gameDrawObject(GAME.objects[i]);

  for (i = 0; i < GAME.particles.length; i++) {
    p = GAME.particles[i];
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 20px 'Segoe UI', system-ui, sans-serif";
  for (i = 0; i < GAME.texts.length; i++) {
    p = GAME.texts[i];
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;

  var now = performance.now();
  var pts = [];
  for (i = 0; i < GAME.trail.length; i++) {
    if (now - GAME.trail[i].t < 220) pts.push(GAME.trail[i]);
  }
  if (pts.length > 1) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = "rgba(182,240,106,.28)";
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ctx.restore();

  if (GAME.flash > 0) {
    ctx.fillStyle = "rgba(255,60,80," + (GAME.flash * 0.35) + ")";
    ctx.fillRect(0, 0, W, H);
  }
}

function gameDrawIdle() {
  var ctx = GAME.ctx;
  if (!ctx) return;
  ctx.clearRect(0, 0, GAME.W, GAME.H);

  var spots = [
    [0.16, 0.62, 36, -0.25],
    [0.36, 0.4, 26, 0.3],
    [0.67, 0.58, 42, 0.15],
    [0.86, 0.33, 22, -0.4],
    [0.52, 0.76, 20, 0.5]
  ];

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (var i = 0; i < spots.length; i++) {
    var s = spots[i];
    ctx.save();
    ctx.translate(GAME.W * s[0], GAME.H * s[1]);
    ctx.rotate(s[3]);
    ctx.globalAlpha = 0.55;
    ctx.font = Math.round(s[2] * 2.1) + "px serif";
    ctx.fillText("🍉", 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function gameFrame(ts) {
  if (!GAME.running || GAME.paused) return;
  if (!GAME.lastTs) GAME.lastTs = ts;
  var dt = Math.min(0.05, (ts - GAME.lastTs) / 1000);
  GAME.lastTs = ts;
  gameUpdate(dt);
  gameDraw();
  GAME.raf = requestAnimationFrame(gameFrame);
}

function gameStart() {
  /* звук не должен мешать запуску игры */
  try { audioCtx(); } catch (e) {}

  GAME.running = true;
  GAME.over = false;
  GAME.score = 0;
  GAME.lives = 3;
  GAME.combo = 1;
  GAME.lastSliceAt = -99;
  GAME.objects = [];
  GAME.particles = [];
  GAME.texts = [];
  GAME.splats = [];
  GAME.trail = [];
  GAME.spawnTimer = 0.5;
  GAME.elapsed = 0;
  GAME.shake = 0;
  GAME.flash = 0;
  GAME.pointerDown = false;
  GAME.lastTs = 0;
  GAME.paused = false;

  document.getElementById("gameOverlay").hidden = true;
  document.getElementById("gameOverTitle").textContent = "Готов резать?";
  document.getElementById("gameOverHint").textContent = "Тащи мышкой по арбузам. Свиной 🐷 — не трогай, будет взрыв.";
  document.getElementById("gameStart").textContent = "Играть";
  document.getElementById("gamePause").textContent = "⏸";
  lbHideSend();
  gameUpdateComboBar();

  gameUpdateHud();
  cancelAnimationFrame(GAME.raf);
  GAME.raf = requestAnimationFrame(gameFrame);
}

function gameTogglePause() {
  if (!GAME.running) return;

  if (GAME.paused) {
    GAME.paused = false;
    document.getElementById("gamePause").textContent = "⏸";
    document.getElementById("gameOverlay").hidden = true;
    document.getElementById("gameOverTitle").textContent = "Готов резать?";
    document.getElementById("gameOverHint").textContent = "Тащи мышкой по арбузам. Свиной 🐷 — не трогай, будет взрыв.";
    document.getElementById("gameStart").textContent = "Играть";
    lbHideSend();
    GAME.lastTs = 0;
    cancelAnimationFrame(GAME.raf);
    GAME.raf = requestAnimationFrame(gameFrame);
  } else {
    GAME.paused = true;
    cancelAnimationFrame(GAME.raf);
    GAME.raf = 0;
    document.getElementById("gamePause").textContent = "▶";
    document.getElementById("gameOverTitle").textContent = "Пауза";
    document.getElementById("gameOverHint").textContent = "Нажми «Продолжить», чтобы вернуться в игру.";
    document.getElementById("gameStart").textContent = "Продолжить";
    lbHideSend();
    document.getElementById("gameOverlay").hidden = false;
    gameDraw();
  }
}

function gameOver() {
  GAME.running = false;
  GAME.over = true;
  GAME.paused = false;
  cancelAnimationFrame(GAME.raf);
  GAME.raf = 0;

  var isRecord = GAME.score > GAME.best;
  if (isRecord) {
    GAME.best = GAME.score;
    write("prz_game_best", GAME.best);
  }
  GAME.combo = 1;
  gameUpdateHud();
  gameDraw();

  var hint = "Счёт: <b>" + GAME.score + "</b> · Рекорд: <b>" + GAME.best + "</b>";
  var own = lbOwn();
  if (isRecord) {
    hint += "<br>Новый рекорд! 🏆";
  } else if (GAME.score > 0) {
    hint += own
      ? '<br><span class="game__small">В рейтинге у тебя ' + own.best + ". Побей — и результат обновится.</span>"
      : '<br><span class="game__small">Результат можно отправить в общий рейтинг.</span>';
  }

  document.getElementById("gameOverTitle").textContent = "Игра окончена";
  document.getElementById("gameOverHint").innerHTML = hint;
  document.getElementById("gameStart").textContent = "Ещё раз";
  document.getElementById("gameOverlay").hidden = false;
  document.getElementById("gamePause").textContent = "⏸";
  GAME.paused = false;
  lbOnGameOver(isRecord);

  sfxGameOver();
}

function gamePointerDown(e) {
  if (!GAME.running) return;
  e.preventDefault();
  try { GAME.canvas.setPointerCapture(e.pointerId); } catch (err) {}
  var p = gamePos(e);
  GAME.pointerDown = true;
  GAME.px = p.x;
  GAME.py = p.y;
  GAME.trail.push({ x: p.x, y: p.y, t: performance.now() });
  if (GAME.trail.length > 80) GAME.trail.splice(0, GAME.trail.length - 80);
  gameSliceAt(p.x, p.y);
}

function gamePointerMove(e) {
  if (!GAME.running) return;
  var p = gamePos(e);
  if (GAME.pointerDown) {
    GAME.trail.push({ x: p.x, y: p.y, t: performance.now() });
    if (GAME.trail.length > 80) GAME.trail.splice(0, GAME.trail.length - 80);
    gameSliceSegment(GAME.px, GAME.py, p.x, p.y);
  }
  GAME.px = p.x;
  GAME.py = p.y;
}

function gamePointerUp() {
  GAME.pointerDown = false;
}

function sfxSlice() {
  if (!GAME.sound) return;
  var ctx = audioCtx();
  if (!ctx) return;
  var t = ctx.currentTime;
  var src = ctx.createBufferSource();
  src.buffer = MUSIC.noise;
  var f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(1900, t);
  f.frequency.exponentialRampToValueAtTime(420, t + 0.14);
  f.Q.value = 1.2;
  var g = ctx.createGain();
  g.gain.setValueAtTime(0.45, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  src.connect(f);
  f.connect(g);
  g.connect(MUSIC.sfxGain);
  src.start(t);
  src.stop(t + 0.16);
}

function sfxBomb() {
  if (!GAME.sound) return;
  var ctx = audioCtx();
  if (!ctx) return;
  var t = ctx.currentTime;

  var o = ctx.createOscillator();
  var g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
  g.gain.setValueAtTime(0.8, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  o.connect(g);
  g.connect(MUSIC.sfxGain);
  o.start(t);
  o.stop(t + 0.6);

  var src = ctx.createBufferSource();
  src.buffer = MUSIC.noise;
  var f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 900;
  var g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.5, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  src.connect(f);
  f.connect(g2);
  g2.connect(MUSIC.sfxGain);
  src.start(t);
  src.stop(t + 0.45);
}

function sfxGold() {
  if (!GAME.sound) return;
  var ctx = audioCtx();
  if (!ctx) return;
  var t = ctx.currentTime;
  playTone(880, t, 0.12, "triangle", 0.14, MUSIC.sfxGain);
  playTone(1320, t + 0.09, 0.2, "triangle", 0.12, MUSIC.sfxGain);
}

function sfxGameOver() {
  if (!GAME.sound) return;
  var ctx = audioCtx();
  if (!ctx) return;
  var t = ctx.currentTime;
  playTone(392, t, 0.18, "triangle", 0.15, MUSIC.sfxGain);
  playTone(330, t + 0.16, 0.18, "triangle", 0.15, MUSIC.sfxGain);
  playTone(262, t + 0.32, 0.34, "triangle", 0.15, MUSIC.sfxGain);
}

function initGame() {
  var canvas = document.getElementById("gameCanvas");
  if (!canvas) return;

  GAME.canvas = canvas;
  GAME.ctx = canvas.getContext("2d");

  gameResize();
  window.addEventListener("resize", function () { gameResize(); });

  canvas.addEventListener("pointerdown", gamePointerDown);
  canvas.addEventListener("pointermove", gamePointerMove);
  canvas.addEventListener("pointerup", gamePointerUp);
  canvas.addEventListener("pointercancel", gamePointerUp);
  window.addEventListener("pointerup", gamePointerUp);

  document.getElementById("gameStart").addEventListener("click", function () {
    if (GAME.running && GAME.paused) gameTogglePause();
    else gameStart();
  });

  document.getElementById("gamePause").addEventListener("click", gameTogglePause);

  var autoBtn = document.getElementById("gameAutoSlice");
  if (autoBtn) {
    autoBtn.addEventListener("click", function () {
      if (!GAME.running || GAME.paused) {
        toast("Сначала нажми «Играть», чтобы активировать апгрейдер!");
        return;
      }
      var count = 0;
      for (var i = GAME.objects.length - 1; i >= 0; i--) {
        if (GAME.objects[i].type !== "bomb") {
          sliceMelon(GAME.objects[i]);
          count++;
        }
      }
      GAME.score += 50;
      gameUpdateHud();
      toast("⚡ Апгрейд «Лазерный нож»: разрезано арбузов: " + count + " (+50 очков)");
    });
  }

  document.getElementById("gameSound").addEventListener("click", function () {
    GAME.sound = !GAME.sound;
    write("prz_game_sound", GAME.sound);
    gameUpdateHud();
    toast(GAME.sound ? "Звук игры включён" : "Звук игры выключен");
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && GAME.running && !GAME.paused) gameTogglePause();
  });

  gameUpdateHud();
  gameDrawIdle();
}

/* ---------- общий рейтинг игры ---------- */
/* после глобального сброса рейтинга старые привязки устройств больше не нужны */
var LB_GEN = "2026-11-12-reset";
if (read("prz_lb_gen", "") !== LB_GEN) {
  try {
    localStorage.removeItem("prz_lb_own");
    localStorage.removeItem("prz_lb_name");
    localStorage.removeItem("prz_lb_last");
  } catch (e) {}
  write("prz_lb_gen", LB_GEN);
}

var LB = {
  topic: "prz-liga-85e536",
  postUrl: "https://ntfy.sh/prz-liga-85e536",
  /* ntfy.sh в России заблокирован — шлём сразу на несколько зеркал */
  postUrls: [
    "https://ntfy.sh/prz-liga-85e536",
    "https://ntfy.envs.net/prz-liga-85e536",
    "https://ntfy.adminforge.de/prz-liga-85e536"
  ],
  liveUrl: "https://ntfy.sh/prz-liga-85e536/json?poll=1&since=12h",
  liveUrls: [
    "https://ntfy.sh/prz-liga-85e536/json?poll=1&since=12h",
    "https://ntfy.envs.net/prz-liga-85e536/json?poll=1&since=12h",
    "https://ntfy.adminforge.de/prz-liga-85e536/json?poll=1&since=12h"
  ],
  archiveUrl: "https://pereprodazhniki.github.io/arbuz/leaderboard.json",
  /* тот же домен, что и игра — работает даже там, где GitHub-домены режут */
  archiveUrls: [
    "https://pereprodazhniki.github.io/arbuz/leaderboard.json",
    "https://cdn.jsdelivr.net/gh/pereprodazhniki/arbuz@main/leaderboard.json",
    "https://raw.githubusercontent.com/pereprodazhniki/arbuz/main/leaderboard.json"
  ],
  /* общий архив рейтинга: пишется из браузера игрока, доступен всем */
  storeUrl: "https://api.restful-api.dev/objects/ff808181a09d98f701a1c3fb7d577947",
  storeReady: false,
  storeScores: null,
  lastStoreFetch: 0,
  lastPush: 0,
  scores: [],
  seen: {},
  lastSent: read("prz_lb_last", 0) || 0,
  name: normalizeName(read("prz_lb_name", "") || ""),
  /* одно устройство = одна запись в рейтинге */
  own: (function () {
    var o = read("prz_lb_own", null);
    if (!o || typeof o !== "object") return null;
    var nm = normalizeName(o.name);
    var best = parseInt(o.best, 10);
    if (nameProblem(nm) || !isFinite(best) || best < 0) return null;
    return { name: nm, best: best };
  })(),
  loaded: false,
  sending: false
};

function lbParse(text) {
  var parts = String(text || "").split("|");
  if (parts.length < 4 || parts[0] !== "LB") return null;
  return { name: parts[1], score: parseInt(parts[2], 10), ts: parseInt(parts[3], 10) };
}

function lbAdd(name, score, ts, key) {
  name = normalizeName(name);
  score = parseInt(score, 10);
  ts = parseInt(ts, 10) || 0;

  if (nameProblem(name)) return false;
  if (!isFinite(score) || score <= 0 || score > 1000000) return false;

  var low = name.toLowerCase();
  var k = key || (low + "|" + score + "|" + Math.floor(ts / 1000));
  if (LB.seen[k]) return false;
  LB.seen[k] = true;

  // один игрок — одна строка, показываем только его лучший результат
  for (var i = 0; i < LB.scores.length; i++) {
    if (LB.scores[i].name.toLowerCase() === low) {
      if (score <= LB.scores[i].score) return false;
      LB.scores.splice(i, 1);
      break;
    }
  }

  LB.scores.push({ name: name, score: score, ts: ts });
  LB.scores.sort(function (a, b) {
    return b.score - a.score || a.ts - b.ts;
  });
  if (LB.scores.length > 50) LB.scores.length = 50;
  return true;
}

/* приводим список к одному виду: без мусора, по одному лучшему результату на имя */
function lbNormalizeList(arr) {
  if (!Array.isArray(arr)) return [];

  var map = {};
  var out = [];

  for (var i = 0; i < arr.length; i++) {
    var s = arr[i];
    if (!s) continue;

    var name = normalizeName(s.name);
    var score = parseInt(s.score, 10);
    var ts = parseInt(s.ts, 10) || 0;

    if (nameProblem(name)) continue;
    if (!isFinite(score) || score <= 0 || score > 1000000) continue;

    var low = name.toLowerCase();
    if (!map[low] || score > map[low].score) {
      map[low] = { name: name, score: score, ts: ts };
    }
  }

  for (var k in map) {
    if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
  }

  out.sort(function (a, b) {
    return b.score - a.score || a.ts - b.ts;
  });
  if (out.length > 50) out.length = 50;
  return out;
}

/* читаем общий архив рейтинга (не чаще раза в минуту — у сервиса лимит запросов) */
function lbFetchStore(force) {
  var now = Date.now();
  if (!force && now - LB.lastStoreFetch < 60000) return Promise.resolve(false);
  LB.lastStoreFetch = now;

  return fetchT(LB.storeUrl, { cache: "no-store" }, 8000)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data) return false;

      var arr = (data.data && data.data.scores) || data.scores || [];
      if (!Array.isArray(arr)) return false;

      LB.storeReady = true;
      LB.storeScores = lbNormalizeList(arr);

      var changed = false;
      for (var i = 0; i < arr.length; i++) {
        var s = arr[i];
        if (!s) continue;
        if (lbAdd(s.name, s.score, s.ts || 0, "s|" + (s.name || "") + "|" + s.score + "|" + (s.ts || 0))) changed = true;
      }
      if (changed) lbRender();
      return true;
    })
    .catch(function () { return false; });
}

/* сохраняем общий архив: любой браузер может дописать новые результаты */
function lbPushStore(force) {
  if (!LB.storeReady) return Promise.resolve(false);

  var scores = lbNormalizeList(LB.scores);
  if (!scores.length) return Promise.resolve(false);

  var json = JSON.stringify(scores);
  if (!force && LB.storeScores && JSON.stringify(LB.storeScores) === json) {
    return Promise.resolve(false);
  }

  var now = Date.now();
  if (!force && now - LB.lastPush < 60000) return Promise.resolve(false);
  LB.lastPush = now;

  return fetchT(LB.storeUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "prz-liga",
      data: { updated: new Date().toISOString(), scores: scores }
    })
  }, 8000)
    .then(function (r) {
      if (!r.ok) throw new Error("bad status");
      LB.storeScores = scores;
      return true;
    })
    .catch(function () { return false; });
}

function lbRender() {
  var list = document.getElementById("boardList");
  if (!list) return;

  list.innerHTML = "";
  if (!LB.scores.length) {
    var empty = document.createElement("li");
    empty.className = "board__empty";
    empty.textContent = "Пока пусто. Стань первым!";
    list.appendChild(empty);
    lbToggleNote();
    return;
  }

  var medals = ["🥇", "🥈", "🥉"];
  LB.scores.slice(0, 10).forEach(function (s, i) {
    var li = document.createElement("li");
    li.className = "board__item" + (i < 3 ? " board__item--top" : "");

    var place = document.createElement("span");
    place.className = "board__place";
    place.textContent = medals[i] || (i + 1);

    var who = document.createElement("span");
    who.className = "board__who";
    who.textContent = s.name;

    var score = document.createElement("span");
    score.className = "board__score";
    score.textContent = s.score;

    li.appendChild(place);
    li.appendChild(who);
    li.appendChild(score);
    list.appendChild(li);
  });
  lbToggleNote();
}

function lbToggleNote() {
  var panel = document.getElementById("boardPanel");
  var note = document.getElementById("boardToggleNote");
  if (!note) return;
  var open = panel && !panel.hidden;
  var n = Math.min(LB.scores.length, 10);
  note.textContent = open ? "скрыть" : (n ? "показать · " + n : "показать");
}

function lbToggle(force) {
  var panel = document.getElementById("boardPanel");
  var btn = document.getElementById("boardToggle");
  if (!panel || !btn) return;

  var open = typeof force === "boolean" ? force : panel.hidden;
  panel.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  lbToggleNote();

  if (open) {
    lbFetchArchive();
    lbFetchLive();
  }
}

function lbNote(text) {
  var el = document.getElementById("boardNote");
  if (el) el.textContent = text;
}

function lbFetchLive() {
  var urls = LB.liveUrls && LB.liveUrls.length ? LB.liveUrls : [LB.liveUrl];
  var jobs = urls.map(function (url) {
    return fetchT(url, { cache: "no-store" }, 6000)
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (text) { return { ok: !!text, text: text }; })
      .catch(function () { return { ok: false, text: "" }; });
  });

  return Promise.all(jobs).then(function (res) {
    var changed = false;
    var any = false;

    for (var j = 0; j < res.length; j++) {
      if (!res[j].ok) continue;
      any = true;

      var lines = res[j].text.split("\n");
      for (var i = 0; i < lines.length; i++) {
        if (!lines[i]) continue;
        var ev;
        try { ev = JSON.parse(lines[i]); } catch (e) { continue; }
        if (!ev || ev.event !== "message" || !ev.message) continue;
        var p = lbParse(ev.message);
        if (p && lbAdd(p.name, p.score, p.ts, "live|" + j + "|" + ev.id)) changed = true;
      }
    }

    if (changed) lbRender();
    return any;
  });
}

/* архив читаем с нескольких адресов: свой домен, CDN и raw.githubusercontent */
function lbFetchArchive() {
  var urls = LB.archiveUrls && LB.archiveUrls.length ? LB.archiveUrls : [LB.archiveUrl];
  var stamp = "t=" + Date.now();
  var jobs = urls.map(function (u) {
    var url = u + (u.indexOf("?") >= 0 ? "&" : "?") + stamp;
    return fetchT(url, { cache: "no-store" }, 8000)
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  });

  return Promise.all(jobs).then(function (list) {
    var changed = false;
    var any = false;
    var best = null;
    var bestTime = -1;

    /* CDN (jsDelivr) может отдавать старый кэш, поэтому берём только самый
       свежий архив по полю updated — иначе удалённые записи возвращаются */
    for (var j = 0; j < list.length; j++) {
      var data = list[j];
      if (!data) continue;
      var arr = data.scores || data;
      if (!Array.isArray(arr)) continue;
      any = true;

      var stamp = Date.parse(data.updated || "") || 0;
      if (stamp > bestTime) {
        bestTime = stamp;
        best = arr;
      }
    }

    if (!best) return any;

    for (var i = 0; i < best.length; i++) {
      var s = best[i];
      if (!s) continue;
      if (lbAdd(s.name, s.score, s.ts || 0, "a|" + (s.name || "") + "|" + s.score + "|" + (s.ts || 0))) changed = true;
    }

    if (changed) lbRender();
    return any;
  });
}

function lbLoad() {
  if (LB.loaded) return;
  LB.loaded = true;
  Promise.all([lbFetchArchive(), lbFetchLive()]).then(function (res) {
    var ok = res[0] || res[1];
    var time = new Date();
    lbNote(ok
      ? "общий для всех · " + ("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2)
      : "общий для всех · нет связи");
  });
}

function lbHideSend() {
  var box = document.getElementById("gameSendBox");
  var share = document.getElementById("gameShare");
  if (box) box.hidden = true;
  if (share) share.hidden = true;
}

/* имя берём из поля ввода, а если оно пустое — из сохранённого */
function lbCurrentName() {
  var input = document.getElementById("gameName");
  var value = input ? normalizeName(input.value) : "";
  return value || LB.name;
}

/* запись этого устройства: одно имя и лучший отправленный результат */
function lbOwn() {
  var o = LB.own;
  if (!o) return null;
  var name = normalizeName(o.name);
  var best = parseInt(o.best, 10);
  if (nameProblem(name) || !isFinite(best) || best < 0) return null;
  return { name: name, best: best };
}

function lbSaveOwn(name, best) {
  name = normalizeName(name);
  best = parseInt(best, 10);
  if (nameProblem(name) || !isFinite(best) || best < 0) return;
  LB.own = { name: name, best: best };
  LB.name = name;
  write("prz_lb_own", LB.own);
  write("prz_lb_name", name);
}

function lbShowSend(auto) {
  var box = document.getElementById("gameSendBox");
  var btn = document.getElementById("gameSend");
  var who = document.getElementById("gameSendWho");
  var note = document.getElementById("gameSendNote");
  if (!box) return;

  if (GAME.score <= 0) {
    box.hidden = true;
    return;
  }

  box.hidden = false;
  var own = lbOwn();
  var name = own ? own.name : lbCurrentName();
  var saved = name && !nameProblem(name);

  /* устройство уже отметилось, а результат хуже — обновлять нечего */
  if (own && GAME.score <= own.best) {
    if (btn) btn.hidden = true;
    if (who) {
      who.hidden = false;
      who.textContent = "Ты в рейтинге как «" + own.name + "»";
    }
    if (note) note.textContent = "Твой лучший результат: " + own.best + ". Побей его, чтобы обновить.";
    return;
  }

  if (auto && saved) {
    if (btn) btn.hidden = true;
    if (who) {
      who.hidden = false;
      who.textContent = "Отправляем результат как «" + name + "»";
    }
    if (note) note.textContent = "Отправляем…";
  } else {
    if (btn) {
      btn.hidden = false;
      btn.disabled = false;
      btn.textContent = own ? "Обновить результат" : "Отправить в рейтинг";
    }
    if (who) who.hidden = true;
    if (note) {
      note.textContent = saved
        ? "Проверь имя и отправь результат."
        : "Введи настоящее имя выше — и результат уйдёт в общий рейтинг.";
    }
  }
}

function lbOnGameOver(isRecord) {
  lbHideSend();
  var share = document.getElementById("gameShare");
  if (share) share.hidden = GAME.score <= 0;
  if (GAME.score <= 0) return;

  var own = lbOwn();
  if (own) {
    /* устройство уже отметилось: имя не меняем, результат только улучшаем */
    LB.name = own.name;
    lbShowSend(GAME.score > own.best);
    if (GAME.score > own.best) lbSendScore(GAME.score, true);
    return;
  }

  var name = lbCurrentName();
  var saved = name && !nameProblem(name);
  if (saved) {
    LB.name = name;
    write("prz_lb_name", name);
  }

  lbShowSend(saved);
  if (saved) lbSendScore(GAME.score, true);
}

/* публикуем результат во все доступные зеркала ленты; интерфейс не ждёт */
function lbPublishLive(name, score, ts) {
  var urls = LB.postUrls && LB.postUrls.length ? LB.postUrls : [LB.postUrl];
  var jobs = urls.map(function (url) {
    return fetchT(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: "LB|" + name + "|" + score + "|" + ts
    }, 6000)
      .then(function (r) { return !!r.ok; })
      .catch(function () { return false; });
  });

  return Promise.all(jobs).then(function (res) {
    for (var i = 0; i < res.length; i++) {
      if (res[i]) return true;
    }
    return false;
  });
}

function lbSendScore(score, auto) {
  if (LB.sending) return;

  var note = document.getElementById("gameSendNote");
  var btn = document.getElementById("gameSend");
  var own = lbOwn();
  var name = own ? own.name : normalizeName(LB.name);
  var err = nameProblem(name);

  if (err) {
    if (!auto && note) note.textContent = err;
    return;
  }
  if (!isFinite(score) || score <= 0) return;

  /* с этого устройства отправляем только улучшение */
  if (own && score <= own.best) {
    if (note) note.textContent = "Твой лучший результат: " + own.best + ". Побей его, чтобы обновить.";
    return;
  }

  var now = Date.now();
  var wait = 20000 - (now - LB.lastSent);
  if (wait > 0) {
    if (auto) {
      lbShowSend(false);
      var n1 = document.getElementById("gameSendNote");
      if (n1) n1.textContent = "Подожди " + Math.ceil(wait / 1000) + " с и нажми кнопку.";
    } else if (note) {
      note.textContent = "Подожди " + Math.ceil(wait / 1000) + " с перед следующей отправкой.";
    }
    return;
  }

  LB.sending = true;
  if (btn && !auto) btn.disabled = true;

  /* 1. Сохраняем результат сразу и локально: сеть для этого не нужна */
  LB.lastSent = now;
  write("prz_lb_last", now);
  lbAdd(name, score, now, "own|" + now);
  lbSaveOwn(name, score);
  lbNameHint();
  lbRender();
  lbToggle(true);

  var panel = document.getElementById("boardPanel");
  if (panel && panel.scrollIntoView) {
    try { panel.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
  }

  if (note) note.textContent = "Отправлено! Синхронизируем с общим рейтингом…";
  if (btn && !auto) {
    btn.textContent = "Отправлено ✓";
    btn.disabled = true;
  }

  /* 2. Отправляем во все зеркала ленты параллельно; интерфейс уже свободен */
  lbPublishLive(name, score, now).then(function (ok) {
    LB.sending = false;
    if (!note) return;
    note.textContent = ok
      ? "Готово! Твой результат в общем рейтинге."
      : "Результат сохранён на этом устройстве. Общий рейтинг обновится, когда появится связь.";
  });
}

function lbSubmit() {
  var input = document.getElementById("gameName");
  var note = document.getElementById("gameSendNote");
  if (!input) return;

  var own = lbOwn();
  if (own) {
    LB.name = own.name;
    if (GAME.score <= own.best) {
      if (note) note.textContent = "Твой лучший результат: " + own.best + ". Побей его, чтобы обновить.";
      lbNameHint();
      return;
    }
    lbSendScore(GAME.score, false);
    return;
  }

  var name = normalizeName(input.value);
  var err = nameProblem(name);
  if (err) {
    if (note) note.textContent = err;
    lbNameHint();
    return;
  }

  LB.name = name;
  input.value = name;
  write("prz_lb_name", name);
  lbNameHint();
  lbSendScore(GAME.score, false);
}

function lbShare() {
  var text = "Я нарезал " + GAME.score + " очков в «Арбузном слайсере» 🍉 Мой рекорд: " +
    GAME.best + ". Попробуй побить: https://pereprodazhniki.github.io/arbuz/#game";
  copyText(text, "Результат скопирован — кидай друзьям");
}

/* подсказка под полем имени: сразу видно, почему имя не принимается */
function lbNameHint(soft) {
  var input = document.getElementById("gameName");
  var hint = document.getElementById("gameNameHint");
  if (!input || !hint) return;

  var own = lbOwn();
  if (own) {
    input.readOnly = true;
    input.value = own.name;
    hint.textContent = "Ты в рейтинге как «" + own.name + "». Рекорд: " + own.best + ". Побей его, чтобы обновить.";
    hint.className = "game__namehint is-ok";
    return;
  }

  input.readOnly = false;
  var value = normalizeName(input.value);

  if (!value) {
    hint.textContent = "";
    hint.className = "game__namehint";
    return;
  }

  if (!/^[А-Яа-яЁё\- ]+$/.test(value)) {
    hint.textContent = "В имени можно только русские буквы, пробел и дефис.";
    hint.className = "game__namehint is-bad";
    return;
  }
  if (value.length > 30) {
    hint.textContent = "Слишком длинное имя — максимум 30 букв.";
    hint.className = "game__namehint is-bad";
    return;
  }
  if (hasBadWords(value)) {
    hint.textContent = "Давай без мата — у нас тут бабушки.";
    hint.className = "game__namehint is-bad";
    return;
  }

  if (!looksLikeName(value)) {
    if (soft) {
      hint.textContent = "Напиши настоящее имя, например: Иван или Мария.";
      hint.className = "game__namehint";
    } else {
      hint.textContent = "Это не похоже на имя. Напиши настоящее имя, например: Иван или Мария.";
      hint.className = "game__namehint is-bad";
    }
    return;
  }

  hint.textContent = "Имя подойдёт: «" + value + "»";
  hint.className = "game__namehint is-ok";
}

function initLeaderboard() {
  var send = document.getElementById("gameSend");
  var input = document.getElementById("gameName");
  var toggle = document.getElementById("boardToggle");
  var share = document.getElementById("gameShare");

  if (send) send.addEventListener("click", lbSubmit);
  if (toggle) toggle.addEventListener("click", function () { lbToggle(); });
  if (share) share.addEventListener("click", lbShare);
  if (input) {
    /* показываем сохранённое имя и запоминаем новое сразу при вводе */
    if (LB.name && !nameProblem(LB.name)) input.value = LB.name;
    lbNameHint();
    input.addEventListener("input", function () {
      var name = normalizeName(input.value);
      if (name && !nameProblem(name)) {
        LB.name = name;
        write("prz_lb_name", name);
      }
      lbNameHint(true);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); lbSubmit(); }
    });
  }

  lbRender();
  lbLoad();
  setInterval(function () {
    if (document.hidden) return;
    lbFetchArchive();
    lbFetchLive();
  }, 60000);
}

/* ---------- старт ---------- */
function init() {
  renderCatalog();
  renderCart();
  renderShip();
  renderSold();
  loadSold();
  startSoldLive();
  renderReviews();
  setupShare();

  /* показываем активный промокод при загрузке страницы */
  var couponNote = document.getElementById("couponNote");
  if (coupon && COUPONS[coupon] && cartCount() > 0) {
    couponNote.className = "coupon__note is-ok";
    couponNote.textContent = "Промокод применён: " + COUPONS[coupon].label;
  } else {
    coupon = null;
    write(STORE.coupon, null);
    renderCart();
  }

  document.getElementById("search").addEventListener("input", renderCatalog);
  document.getElementById("sort").addEventListener("change", renderCatalog);
  document.getElementById("cartClear").addEventListener("click", function () { clearCart(); toast("Корзина очищена"); });
  document.getElementById("checkout").addEventListener("click", checkout);
  document.getElementById("reviewForm").addEventListener("submit", addReview);

  document.getElementById("couponApply").addEventListener("click", function () {
    applyCoupon(document.getElementById("couponInput").value);
  });
  document.getElementById("couponInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); applyCoupon(this.value); }
  });

  document.getElementById("calcPerWeek").addEventListener("input", renderCalc);
  document.getElementById("calcWeight").addEventListener("input", renderCalc);
  renderCalc();

  document.getElementById("lotteryBtn").addEventListener("click", spin);
  renderSeason();

  initTheme();
  initMusic();
  initGame();
  initLeaderboard();

  /* чек */
  document.getElementById("receiptCopy").addEventListener("click", function () {
    copyText(lastReceipt, "Чек скопирован");
  });

  /* викторина */
  document.getElementById("quizBtn").addEventListener("click", function () { quizStart(); });

  /* голосование и генератор имён */
  renderVotes();
  loadVotes();
  document.getElementById("nameGen").addEventListener("click", generateName);

  initEasterEgg();
  initQuest();
  initJobForm();

  /* счётчик и список покупателей: локально */
  syncFromServer();

  var buttons = document.querySelectorAll(".ship__btn");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      ship = this.getAttribute("data-ship");
      write(STORE.ship, ship);
      renderShip();
      renderCart();
    });
  }

  document.getElementById("jokeBtn").addEventListener("click", function () {
    document.getElementById("jokeText").textContent = JOKES[Math.floor(Math.random() * JOKES.length)];
  });

  document.getElementById("tipBtn").addEventListener("click", function () {
    document.getElementById("tipText").textContent =
      "Бабушка говорит: " + TIPS[Math.floor(Math.random() * TIPS.length)].toLowerCase();
  });

  document.getElementById("lastMelon").addEventListener("click", function () {
    var p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    cart[p.id] = (cart[p.id] || 0) + 1;
    write(STORE.cart, cart);
    renderCart();
    openCart();
    toast("Последний арбуз добавлен: " + p.name);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCart();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}