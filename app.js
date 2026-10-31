(() => {
"use strict";

/* =========================================
   CONFIGURATION
========================================= */

const $ = s => document.querySelector(s);

const CONFIG = {
  maxImages: 30,
  pieces: 9,
  columns: 3,
  particleCount: 85,
  assetFolder: "Assets/",
  extensions: ["jpg", "jpeg", "png", "webp", "gif"]
};

const state = {
  images: [],
  current: 0,
  mode: 0,
  completed: [],
  selected: null,
  order: [],
  solved: false,
  locked: false,
  tutorialSeen: false,
  gameData: {},
  titlePlaced: [null, null, null],
  titleWords: ["НЕВЕЛИКЕ", "ЗАВДАННЯ", "ДЛЯ ТЕБЕ"],
  selectedWord: null
};


/* =========================================
   15 DIFFERENT PUZZLE TYPES
========================================= */

const MODES = [

  {
    name: "Перемішані частини",
    type: "LOGIC",
    instructions: "Частини зображення перемішані. Поміняй їх місцями, щоб відновити правильний порядок.",
    hint: "Починай із кутів. Так буде легше зрозуміти, де мають бути інші частини.",
    tutorial: [
      ["01", "Обери частину", "Натисни на будь-який фрагмент."],
      ["02", "Знайди пару", "Натисни на інший фрагмент, щоб поміняти їх місцями."],
      ["03", "Віднови порядок", "Продовжуй, поки всі частини не стануть правильно."]
    ]
  },

  {
    name: "Розклади частини",
    type: "DRAG & DROP",
    instructions: "Унизу знаходяться частини зображення. Перетягни кожну у відповідне місце.",
    hint: "Подивись на маленькі фрагменти й порівняй їхні краї.",
    tutorial: [
      ["01", "Обери фрагмент", "Знайди потрібну частину серед перемішаних."],
      ["02", "Перетягни", "Перемісти її у відповідну клітинку."],
      ["03", "Заверши складання", "Заповни всі дев'ять місць."]
    ]
  },

  {
    name: "Спіймай частини",
    type: "CATCH",
    instructions: "Фрагменти рухаються по екрану! Натискай на них у правильному порядку.",
    hint: "Стеж за номером потрібної частини. Не потрібно ловити всі підряд.",
    tutorial: [
      ["01", "Подивись на ціль", "На екрані буде показано номер потрібної частини."],
      ["02", "Спіймай її", "Натисни на фрагмент із відповідним номером."],
      ["03", "Повтори", "Збери всі частини по черзі."]
    ]
  },

  {
    name: "Знайди однакові",
    type: "MEMORY",
    instructions: "Перед тобою картки. Відкривай їх і знаходь однакові пари фрагментів.",
    hint: "Запам'ятовуй розташування вже відкритих карток.",
    tutorial: [
      ["01", "Відкрий картку", "Натисни на одну з прихованих карток."],
      ["02", "Відкрий другу", "Шукай картку з таким самим фрагментом."],
      ["03", "Знайди всі пари", "Збери всі пари, щоб завершити гру."]
    ]
  },

  {
    name: "Поверни частини",
    type: "ROTATION",
    instructions: "Кожен фрагмент повернутий у неправильний бік. Натискай на нього, щоб обертати.",
    hint: "Один натиск повертає частину на 90 градусів.",
    tutorial: [
      ["01", "Обери частину", "Натисни на будь-який повернутий фрагмент."],
      ["02", "Обертай", "Кожен натиск повертає його на 90 градусів."],
      ["03", "Вирівняй усе", "Кожна частина повинна повернутися у початкове положення."]
    ]
  },

  {
    name: "Правильна послідовність",
    type: "SEQUENCE",
    instructions: "Фрагменти мають номери, але вони перемішані. Натискай на них від першого до останнього.",
    hint: "Шукай найменший номер і рухайся далі.",
    tutorial: [
      ["01", "Знайди перший", "Починай із частини номер один."],
      ["02", "Продовжуй", "Наступною має бути частина з наступним номером."],
      ["03", "Заверши", "Натисни на всі дев'ять частин у правильному порядку."]
    ]
  },

  {
    name: "Точне розміщення",
    type: "PLACEMENT",
    instructions: "Перетягни фрагменти з нижньої панелі на відповідні місця і склади картину.",
    hint: "Кожна клітинка має своє місце.",
    tutorial: [
      ["01", "Вибери фрагмент", "Знайди його серед частин унизу."],
      ["02", "Перемісти", "Перетягни фрагмент у потрібну клітинку."],
      ["03", "Перевір", "Заповни всі порожні місця."]
    ]
  },

  {
    name: "Рухомі фрагменти",
    type: "REACTION",
    instructions: "Частини постійно рухаються. Лови їх у послідовності, показаній на екрані.",
    hint: "Не поспішай натискати на випадкові частини.",
    tutorial: [
      ["01", "Стеж за рухом", "Фрагменти постійно змінюють положення."],
      ["02", "Знайди потрібний", "Орієнтуйся за номером цілі."],
      ["03", "Спіймай усі", "Збери їх у правильному порядку."]
    ]
  },

  {
    name: "Збери смужки",
    type: "STRIPS",
    instructions: "Зображення розділене на три горизонтальні смужки. Перетягни їх у правильний порядок.",
    hint: "Порівняй верхні, середні та нижні деталі.",
    tutorial: [
      ["01", "Оглянь смужки", "У тебе є три горизонтальні частини."],
      ["02", "Поміняй місцями", "Перетягуй їх, щоб змінити порядок."],
      ["03", "Склади картину", "Верхня, середня та нижня смужки мають бути на своїх місцях."]
    ]
  },

  {
    name: "Знайди потрібну",
    type: "SEARCH",
    instructions: "На екрані багато фрагментів. Шукай потрібний номер і натискай на нього.",
    hint: "Номер цілі постійно оновлюється після правильної відповіді.",
    tutorial: [
      ["01", "Подивись на номер", "Гра покаже, яку частину треба знайти."],
      ["02", "Знайди її", "Натисни на відповідний фрагмент."],
      ["03", "Продовжуй пошук", "Знайди всі дев'ять частин."]
    ]
  },

  {
    name: "Пари фрагментів",
    type: "PAIR MATCH",
    instructions: "Знайди пари однакових фрагментів. Уважно дивись на деталі.",
    hint: "Не відкривай картки занадто швидко — запам'ятовуй їх.",
    tutorial: [
      ["01", "Відкрий першу картку", "Натисни на будь-яку картку."],
      ["02", "Шукай відповідність", "Відкрий другу картку з таким самим фрагментом."],
      ["03", "Знайди всі пари", "Після кожної правильної пари вона залишиться відкритою."]
    ]
  },

  {
    name: "Доставка частин",
    type: "DELIVERY",
    instructions: "Переміщуй фрагменти до відповідних місць. Кожен фрагмент потрібно доставити окремо.",
    hint: "Починай із частин, які легко впізнати.",
    tutorial: [
      ["01", "Візьми фрагмент", "Натисни або перетягни його."],
      ["02", "Достав", "Помісти його у правильну клітинку."],
      ["03", "Повтори", "Достав усі дев'ять частин."]
    ]
  },

  {
    name: "Поміняй рядки",
    type: "ROW ORDER",
    instructions: "Частини розташовані в неправильних позиціях. Натискай на дві частини, щоб поміняти їх місцями.",
    hint: "Спробуй спочатку виправити верхній ряд.",
    tutorial: [
      ["01", "Обери першу частину", "Натисни на фрагмент."],
      ["02", "Обери другу", "Вони поміняються місцями."],
      ["03", "Віднови картину", "Виправ усі неправильні позиції."]
    ]
  },

  {
    name: "Зворотний порядок",
    type: "REVERSE",
    instructions: "Тепер потрібно натискати на частини у зворотній послідовності: від дев'ятої до першої.",
    hint: "Починай із найбільшого номера.",
    tutorial: [
      ["01", "Знайди дев'яту", "Цього разу починаємо з кінця."],
      ["02", "Рухайся назад", "Кожна наступна частина має бути на один номер меншою."],
      ["03", "Дійди до першої", "Заверши всю послідовність."]
    ]
  },

  {
    name: "Фінальне складання",
    type: "FINAL PUZZLE",
    instructions: "Останній тип завдання! Перетягни всі фрагменти у правильні місця.",
    hint: "Ти вже знаєш, як працюють фрагменти. Використай усе, чого навчилася.",
    tutorial: [
      ["01", "Оглянь поле", "Усі дев'ять фрагментів перемішані."],
      ["02", "Переміщуй", "Перетягни кожен фрагмент на своє місце."],
      ["03", "Заверши складання", "Після правильної відповіді відкриється зображення."]
    ]
  }

];


/* =========================================
   GENERAL HELPERS
========================================= */

function icons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.toggle("active", screen.id === id);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toast(message) {
  const el = $("#toast");

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2200);
}

function setStatus(message) {
  $("#puzzle-status").textContent = message;
}

function getImagePieceStyle(index, src) {
  const row = Math.floor(index / 3);
  const col = index % 3;

  return `
    background-image:url("${src}");
    background-size:300% 300%;
    background-position:${col * 50}% ${row * 50}%;
  `;
}

function makePiece(index, src, className = "game-tile") {
  const piece = document.createElement("button");

  piece.type = "button";
  piece.className = `puzzle-piece ${className}`;
  piece.dataset.piece = index;
  piece.style.cssText = getImagePieceStyle(index, src);
  piece.setAttribute("aria-label", `Частина ${index + 1}`);

  return piece;
}

function setInstructions(text) {
  $("#game-instructions").textContent = text;
}


/* =========================================
   IMAGE DISCOVERY
========================================= */

function loadImage(src) {
  return new Promise(resolve => {
    const image = new Image();

    image.onload = () => resolve({
      src,
      width: image.naturalWidth,
      height: image.naturalHeight
    });

    image.onerror = () => resolve(null);

    image.src = src;
  });
}

async function discoverImages() {
  const result = [];

  for (let number = 1; number <= CONFIG.maxImages; number++) {
    let found = null;

    for (const extension of CONFIG.extensions) {
      const path =
        `${CONFIG.assetFolder}${number}.${extension}`;

      const loaded = await loadImage(path);

      if (loaded) {
        found = {
          ...loaded,
          number
        };

        break;
      }
    }

    // Numbering must be consecutive.
    if (!found) break;

    result.push(found);
  }

  return result;
}


/* =========================================
   TITLE PUZZLE
========================================= */

function renderTitle() {
  const slots = $("#title-slots");
  const bank = $("#word-bank");

  slots.innerHTML = "";
  bank.innerHTML = "";

  state.titleWords.forEach((word, index) => {
    const slot = document.createElement("div");

    slot.className = "title-slot";
    slot.dataset.slot = index;

    if (state.titlePlaced[index] !== null) {
      slot.textContent = word;
      slot.classList.add("filled");
    } else {
      slot.textContent = "Перетягни сюди";
    }

    slot.addEventListener("dragover", e => {
      e.preventDefault();
    });

    slot.addEventListener("drop", e => {
      e.preventDefault();

      const wordIndex = Number(
        e.dataTransfer.getData("text/plain")
      );

      placeTitle(wordIndex, index);
    });

    slot.addEventListener("click", () => {
      if (state.selectedWord !== null) {
        placeTitle(state.selectedWord, index);
      }
    });

    slots.appendChild(slot);
  });

  const order = shuffle([0, 1, 2]);

  order.forEach(index => {
    if (state.titlePlaced.includes(index)) return;

    const chip = document.createElement("button");

    chip.className = "word-chip";
    chip.textContent = state.titleWords[index];
    chip.draggable = true;
    chip.type = "button";

    chip.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", String(index));
    });

    chip.addEventListener("click", () => {
      state.selectedWord = index;
      renderTitle();
    });

    bank.appendChild(chip);
  });
}

function placeTitle(wordIndex, slotIndex) {
  if (!Number.isInteger(wordIndex)) return;

  if (wordIndex !== slotIndex) {
    state.selectedWord = null;

    $("#title-feedback").textContent =
      "Не зовсім! Слово повернулося назад. Спробуй ще раз.";

    renderTitle();
    return;
  }

  if (state.titlePlaced.includes(wordIndex)) return;

  state.titlePlaced[slotIndex] = wordIndex;
  state.selectedWord = null;

  $("#title-feedback").textContent = "Правильно!";

  renderTitle();

  if (state.titlePlaced.every((value, i) => value === i)) {
    setTimeout(finishTitle, 650);
  }
}

function finishTitle() {
  $("#header-title").textContent = "НЕВЕЛИКЕ ЗАВДАННЯ";
  $("#header-title").classList.add("title-fixed");

  const heading = $(".intro-heading");

  heading.style.transition = "all .7s ease";
  heading.style.transform = "translateY(-15px) scale(.95)";
  heading.style.opacity = "0";

  setTimeout(() => {
    showScreen("countdown-screen");
    runCountdown();
  }, 550);
}


/* =========================================
   COUNTDOWN
========================================= */

function runCountdown() {
  let count = 3;

  const number = $("#countdown-number");
  const caption = $("#countdown-caption");

  number.textContent = count;

  const interval = setInterval(() => {
    count--;

    number.style.animation = "none";
    void number.offsetWidth;
    number.style.animation = "";

    if (count > 0) {
      number.textContent = count;
    } else {
      clearInterval(interval);

      number.textContent = "✓";
      caption.textContent = "Починаємо!";

      setTimeout(startGame, 700);
    }

  }, 850);
}


/* =========================================
   BIG MOSAIC
========================================= */

function buildMosaic() {
  const grid = $("#mosaic-grid");

  grid.innerHTML = "";

  state.images.forEach((image, index) => {
    const cell = document.createElement("div");

    cell.className = "mosaic-cell";
    cell.dataset.index = index;

    if (state.completed.includes(index)) {
      fillMosaicCell(cell, image);
    }

    grid.appendChild(cell);
  });

  updateMosaic();
}

function fillMosaicCell(cell, image) {
  cell.classList.add("filled");
  cell.style.backgroundImage = `url("${image.src}")`;
}

function updateMosaic() {
  const total = state.images.length;
  const done = state.completed.length;

  const percent = total
    ? Math.round((done / total) * 100)
    : 0;

  $("#mosaic-count").textContent = `${done} / ${total}`;
  $("#mosaic-percent").textContent = `${percent}%`;
  $("#mosaic-progress").style.width = `${percent}%`;

  $("#mosaic-message").textContent =
    done === total
      ? "Усі частини зібрано!"
      : "Кожне завдання відкриває нову частину.";
}

function revealMosaicPiece(index) {
  const cell = $(`.mosaic-cell[data-index="${index}"]`);

  if (!cell) return;

  fillMosaicCell(cell, state.images[index]);

  cell.animate([
    { transform: "scale(.4) rotate(-10deg)", opacity: 0 },
    { transform: "scale(1.12)", opacity: 1 },
    { transform: "scale(1)", opacity: 1 }
  ], {
    duration: 650,
    easing: "cubic-bezier(.2,.8,.2,1)"
  });

  updateMosaic();
}


/* =========================================
   PARTICLE CELEBRATION
========================================= */

function burstParticles() {
  const layer = $("#particle-layer");

  const originX = window.innerWidth / 2;
  const originY = window.innerHeight / 2;

  for (let i = 0; i < CONFIG.particleCount; i++) {
    const particle = document.createElement("div");

    particle.className = "particle";

    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 260;

    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 70;

    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;

    particle.style.setProperty("--dx", `${dx}px`);
    particle.style.setProperty("--dy", `${dy}px`);
    particle.style.setProperty(
      "--rotation",
      `${Math.random() * 900 - 450}deg`
    );

    particle.style.animationDelay =
      `${Math.random() * .3}s`;

    layer.appendChild(particle);

    setTimeout(() => particle.remove(), 2000);
  }
}


/* =========================================
   GAME START
========================================= */

function startGame() {
  if (!state.images.length) {
    toast("У папці Assets немає зображень.");
    return;
  }

  state.current = 0;

  buildMosaic();

  showPuzzle();
}

function showPuzzle() {
  state.solved = false;
  state.locked = false;
  state.selected = null;
  state.gameData = {};

  const image = state.images[state.current];

  state.mode = state.current % MODES.length;

  const mode = MODES[state.mode];

  $("#puzzle-number").textContent =
    String(state.current + 1).padStart(2, "0");

  $("#puzzle-counter").textContent =
    `ЗОБРАЖЕННЯ ${String(state.current + 1).padStart(2, "0")}`;

  $("#puzzle-heading").textContent = mode.name;
  $("#puzzle-type").textContent = mode.type;

  $("#puzzle-subtitle").textContent =
    "Виконай завдання, щоб відкрити нову частину.";

  $("#progress-fraction").textContent =
    `${state.completed.length} / ${state.images.length}`;

  $("#progress-fill").style.width =
    `${state.completed.length / state.images.length * 100}%`;

  $("#progress-description").textContent =
    `Залишилося: ${state.images.length - state.completed.length}`;

  $("#hint-text").textContent = mode.hint;

  setInstructions(mode.instructions);

  setStatus("Виконай завдання.");

  $("#puzzle-grid").innerHTML = "";

  renderMode(state.mode);

  updateHeader();

  showScreen("puzzle-screen");

  icons();
}

function updateHeader() {
  const total = state.images.length;
  const done = state.completed.length;

  $("#header-progress").textContent =
    total ? `${done} / ${total}` : "Початок";

  $("#header-progress-fill").style.width =
    `${total ? done / total * 100 : 0}%`;
}


/* =========================================
   COMPLETION
========================================= */

function winGame() {
  if (state.solved || state.locked) return;

  state.solved = true;
  state.locked = true;

  const index = state.current;
  const image = state.images[index];

  if (!state.completed.includes(index)) {
    state.completed.push(index);
  }

  burstParticles();

  revealMosaicPiece(index);

  $("#completed-preview").style.backgroundImage =
    `url("${image.src}")`;

  $("#complete-description").textContent =
    `Ти відкрила частину номер ${index + 1}.`;

  $("#continue-button").textContent =
    index === state.images.length - 1
      ? "Відкрити колекцію"
      : "Наступне завдання";

  $("#continue-button").innerHTML =
    index === state.images.length - 1
      ? 'Відкрити колекцію <i data-lucide="arrow-right"></i>'
      : 'Наступне завдання <i data-lucide="arrow-right"></i>';

  updateHeader();

  setTimeout(() => {
    showScreen("complete-screen");
    icons();
  }, 900);
}

function continueGame() {
  if (state.completed.length >= state.images.length) {
    showGallery();
    return;
  }

  state.current++;

  showPuzzle();
}


/* =========================================
   MODE 1
   SWAP GRID
========================================= */

function mode1() {
  const src = state.images[state.current].src;

  const order = shuffle([0,1,2,3,4,5,6,7,8]);

  state.gameData.order = order;

  let selected = null;

  function render() {
    const area = $("#puzzle-grid");
    area.innerHTML = "";

    order.forEach((piece, position) => {
      const tile = makePiece(piece, src);

      tile.addEventListener("click", () => {
        if (selected === null) {
          selected = position;
          render();
          return;
        }

        [order[selected], order[position]] =
          [order[position], order[selected]];

        selected = null;

        render();

        if (order.every((v, i) => v === i)) {
          winGame();
        }
      });

      if (selected === position) {
        tile.classList.add("selected");
      }

      area.appendChild(tile);
    });
  }

  render();
}


/* =========================================
   MODE 2
   DRAG TO SLOTS
========================================= */

function mode2() {
  const src = state.images[state.current].src;

  const area = $("#puzzle-grid");

  const tray = document.createElement("div");
  tray.className = "game-tray";

  const slots = document.createElement("div");
  slots.className = "game-tray";

  const placed = Array(9).fill(null);
  const pieces = shuffle([0,1,2,3,4,5,6,7,8]);

  let selected = null;

  function render() {
    area.innerHTML = "";

    slots.innerHTML = "";
    tray.innerHTML = "";

    for (let i = 0; i < 9; i++) {
      const slot = document.createElement("div");

      slot.className = "game-slot";
      slot.textContent = placed[i] === null ? "?" : "";

      if (placed[i] !== null) {
        slot.classList.add("filled");
        slot.style.backgroundImage = `url("${src}")`;
        slot.style.backgroundSize = "300% 300%";
        slot.style.backgroundPosition =
          `${placed[i] % 3 * 50}% ${Math.floor(placed[i] / 3) * 50}%`;
      }

      slot.addEventListener("click", () => {
        if (selected === null) return;

        if (selected === i) {
          toast("Це місце вже вибране.");
          return;
        }

        placed[i] = selected;

        pieces.splice(pieces.indexOf(selected), 1);

        selected = null;

        if (placed.every((value, index) => value === index)) {
          winGame();
          return;
        }

        render();
      });

      slots.appendChild(slot);
    }

    pieces.forEach(piece => {
      const tile = makePiece(piece, src, "game-tile");

      tile.draggable = true;

      tile.addEventListener("click", () => {
        selected = piece;
        render();
      });

      tile.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", String(piece));
      });

      tray.appendChild(tile);
    });

    area.append(slots, tray);
  }

  render();
}


/* =========================================
   MODE 3
   CATCH FALLING PIECES
========================================= */

function mode3() {
  const src = state.images[state.current].src;

  const area = $("#puzzle-grid");

  const zone = document.createElement("div");
  zone.className = "falling-zone";

  const target = document.createElement("div");
  target.className = "sequence-display";

  area.append(target, zone);

  const pieces = shuffle([0,1,2,3,4,5,6,7,8]);

  let next = 0;

  function update() {
    target.innerHTML =
      `Спіймай <span class="target-number">${next + 1}</span>`;

    zone.innerHTML = "";

    pieces.forEach((piece, i) => {
      if (pieces.indexOf(piece) < next) return;

      const el = document.createElement("button");

      el.className = "falling-piece";
      el.style.cssText = getImagePieceStyle(piece, src);

      el.style.left = `${5 + Math.random() * 80}%`;
      el.style.animationDuration = `${3 + Math.random() * 3}s`;
      el.style.animationDelay = `${Math.random() * -3}s`;

      el.addEventListener("click", () => {
        if (piece !== next) {
          el.animate([
            { transform: "translateX(0)" },
            { transform: "translateX(-8px)" },
            { transform: "translateX(8px)" },
            { transform: "translateX(0)" }
          ], { duration: 250 });

          toast("Не та частина! Спробуй ще.");
          return;
        }

        next++;

        if (next === 9) {
          winGame();
        } else {
          update();
        }
      });

      zone.appendChild(el);
    });
  }

  update();
}


/* =========================================
   MODE 4
   MEMORY
========================================= */

function mode4() {
  const src = state.images[state.current].src;

  const area = $("#puzzle-grid");

  const cards = shuffle([
    0,0,1,1,2,2,3,3,4,4,5,5
  ]);

  let opened = [];
  let matched = new Set();
  let movesLocked = false;

  const grid = document.createElement("div");
  grid.className = "memory-grid";

  cards.forEach((piece, index) => {
    const card = document.createElement("button");

    card.className = "memory-card hidden-card";

    card.addEventListener("click", () => {
      if (
        movesLocked ||
        matched.has(index) ||
        opened.includes(index)
      ) return;

      card.classList.remove("hidden-card");
      card.style.cssText = getImagePieceStyle(piece, src);

      opened.push(index);

      if (opened.length === 2) {
        movesLocked = true;

        const [a, b] = opened;

        if (cards[a] === cards[b]) {
          matched.add(a);
          matched.add(b);

          grid.children[a].classList.add("matched");
          grid.children[b].classList.add("matched");

          opened = [];
          movesLocked = false;

          if (matched.size === cards.length) {
            winGame();
          }

        } else {
          setTimeout(() => {
            [a,b].forEach(i => {
              const element = grid.children[i];

              element.className = "memory-card hidden-card";
              element.style.cssText = "";
            });

            opened = [];
            movesLocked = false;
          }, 800);
        }
      }
    });

    grid.appendChild(card);
  });

  area.appendChild(grid);
}


/* =========================================
   MODE 5
   ROTATION
========================================= */

function mode5() {
  const src = state.images[state.current].src;
  const area = $("#puzzle-grid");

  const rotations = Array.from({length:9}, () =>
    Math.floor(Math.random() * 3) + 1
  );

  function render() {
    area.innerHTML = "";

    rotations.forEach((rotation, index) => {
      const tile = makePiece(index, src);

      tile.classList.add("rotation-piece");
      tile.style.transform = `rotate(${rotation * 90}deg)`;

      tile.addEventListener("click", () => {
        if (rotation === 0) return;

        rotations[index] = (rotations[index] + 1) % 4;

        render();

        if (rotations.every(v => v === 0)) {
          winGame();
        }
      });

      area.appendChild(tile);
    });
  }

  render();
}


/* =========================================
   MODE 6
   SEQUENCE
========================================= */

function mode6() {
  const src = state.images[state.current].src;
  const area = $("#puzzle-grid");

  const order = shuffle([0,1,2,3,4,5,6,7,8]);

  let next = 0;

  const display = document.createElement("div");
  display.className = "sequence-display";

  const grid = document.createElement("div");
  grid.className = "game-tray";

  function update() {
    display.textContent = `Наступна частина: ${next + 1}`;
  }

  order.forEach(piece => {
    const tile = makePiece(piece, src);

    tile.addEventListener("click", () => {
      if (piece !== next) {
        toast("Почни з правильної частини.");
        return;
      }

      tile.style.opacity = ".25";
      tile.disabled = true;

      next++;

      if (next === 9) {
        winGame();
      } else {
        update();
      }
    });

    grid.appendChild(tile);
  });

  area.append(display, grid);
  update();
}


/* =========================================
   MODE 7
   DRAG PLACEMENT
========================================= */

function mode7() {
  const src = state.images[state.current].src;

  const area = $("#puzzle-grid");

  const slots = Array(9).fill(null);
  const remaining = shuffle([0,1,2,3,4,5,6,7,8]);

  let selected = null;

  function render() {
    area.innerHTML = "";

    const slotArea = document.createElement("div");
    slotArea.className = "game-tray";

    const tray = document.createElement("div");
    tray.className = "game-tray";

    slots.forEach((piece, index) => {
      const slot = document.createElement("div");
      slot.className = "game-slot";

      if (piece !== null) {
        slot.classList.add("filled");
        slot.style.backgroundImage = `url("${src}")`;
        slot.style.backgroundSize = "300% 300%";
        slot.style.backgroundPosition =
          `${piece % 3 * 50}% ${Math.floor(piece / 3) * 50}%`;
      } else {
        slot.textContent = "Вставити";
      }

      slot.addEventListener("click", () => {
        if (selected === null) return;

        if (selected === index) return;

        slots[index] = selected;

        remaining.splice(remaining.indexOf(selected), 1);

        selected = null;

        if (slots.every((v, i) => v === i)) {
          winGame();
        } else {
          render();
        }
      });

      slotArea.appendChild(slot);
    });

    remaining.forEach(piece => {
      const tile = makePiece(piece, src);

      tile.addEventListener("click", () => {
        selected = piece;
        render();
      });

      tile.draggable = true;

      tile.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", String(piece));
      });

      tray.appendChild(tile);
    });

    area.append(slotArea, tray);
  }

  render();
}


/* =========================================
   MODE 8
   MOVING PIECES
========================================= */

function mode8() {
  const src = state.images[state.current].src;
  const area = $("#puzzle-grid");

  const pieces = shuffle([0,1,2,3,4,5,6,7,8]);

  let next = 0;

  const display = document.createElement("div");
  display.className = "sequence-display";

  const tray = document.createElement("div");
  tray.className = "game-tray";

  function render() {
    display.textContent = `Злови частину ${next + 1}`;

    tray.innerHTML = "";

    pieces.forEach(piece => {
      if (piece < next) return;

      const tile = makePiece(piece, src);

      tile.classList.add("piece-moving");

      tile.style.width = "27%";

      tile.addEventListener("click", () => {
        if (piece !== next) {
          toast("Спробуй знайти наступний номер.");
          return;
        }

        next++;

        if (next === 9) {
          winGame();
        } else {
          render();
        }
      });

      tray.appendChild(tile);
    });
  }

  area.append(display, tray);
  render();
}


/* =========================================
   MODE 9
   STRIPS
========================================= */

function mode9() {
  const src = state.images[state.current].src;
  const area = $("#puzzle-grid");

  const order = shuffle([0,1,2]);

  const container = document.createElement("div");
  container.className = "game-tray";

  let selected = null;

  function render() {
    container.innerHTML = "";

    order.forEach((piece, position) => {
      const strip = document.createElement("button");

      strip.className = "puzzle-piece strip-piece";
      strip.style.backgroundImage = `url("${src}")`;
      strip.style.backgroundPosition = `${piece * 50}% center`;
      strip.draggable = true;

      strip.addEventListener("click", () => {
        if (selected === null) {
          selected = position;
          render();
          return;
        }

        [order[selected], order[position]] =
          [order[position], order[selected]];

        selected = null;

        render();

        if (order.every((v,i) => v === i)) {
          winGame();
        }
      });

      strip.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", String(position));
      });

      strip.addEventListener("dragover", e => e.preventDefault());

      strip.addEventListener("drop", e => {
        e.preventDefault();

        const from = Number(e.dataTransfer.getData("text/plain"));

        [order[from], order[position]] =
          [order[position], order[from]];

        render();

        if (order.every((v,i) => v === i)) {
          winGame();
        }
      });

      if (selected === position) {
        strip.classList.add("selected");
      }

      container.appendChild(strip);
    });
  }

  area.appendChild(container);
  render();
}


/* =========================================
   MODE 10
   SEARCH
========================================= */

function mode10() {
  const src = state.images[state.current].src;
  const area = $("#puzzle-grid");

  const order = shuffle([0,1,2,3,4,5,6,7,8]);

  let target = 0;

  const display = document.createElement("div");
  display.className = "sequence-display";

  const grid = document.createElement("div");
  grid.className = "game-tray";

  function update() {
    display.textContent = `Знайди частину №${target + 1}`;
  }

  order.forEach(piece => {
    const tile = makePiece(piece, src);

    tile.addEventListener("click", () => {
      if (piece !== target) {
        toast("Це не та частина.");
        return;
      }

      tile.disabled = true;
      tile.style.opacity = ".25";

      target++;

      if (target === 9) {
        winGame();
      } else {
        update();
      }
    });

    grid.appendChild(tile);
  });

  area.append(display, grid);
  update();
}


/* =========================================
   MODE 11
   PAIR MATCH
========================================= */

function mode11() {
  const src = state.images[state.current].src;
  const area = $("#puzzle-grid");

  const values = shuffle([
    0,0,1,1,2,2,3,3
  ]);

  const grid = document.createElement("div");
  grid.className = "memory-grid";

  let opened = [];
  let matches = 0;
  let busy = false;

  values.forEach((value, index) => {
    const card = document.createElement("button");

    card.className = "memory-card hidden-card";

    card.addEventListener("click", () => {
      if (busy || opened.includes(index) || card.classList.contains("matched")) {
        return;
      }

      card.classList.remove("hidden-card");
      card.style.cssText = getImagePieceStyle(value, src);

      opened.push(index);

      if (opened.length === 2) {
        busy = true;

        const [a,b] = opened;

        if (values[a] === values[b]) {
          grid.children[a].classList.add("matched");
          grid.children[b].classList.add("matched");

          matches++;
          opened = [];
          busy = false;

          if (matches === 4) {
            winGame();
          }
        } else {
          setTimeout(() => {
            [a,b].forEach(i => {
              grid.children[i].className = "memory-card hidden-card";
              grid.children[i].style.cssText = "";
            });

            opened = [];
            busy = false;
          }, 750);
        }
      }
    });

    grid.appendChild(card);
  });

  area.appendChild(grid);
}


/* =========================================
   MODE 12
   DELIVERY
========================================= */

function mode12() {
  const src = state.images[state.current].src;
  const area = $("#puzzle-grid");

  const remaining = shuffle([0,1,2,3,4,5,6,7,8]);

  const slots = Array(9).fill(null);

  let selected = null;

  const slotGrid = document.createElement("div");
  slotGrid.className = "game-tray";

  const tray = document.createElement("div");
  tray.className = "game-tray";

  function render() {
    slotGrid.innerHTML = "";
    tray.innerHTML = "";

    for (let i = 0; i < 9; i++) {
      const slot = document.createElement("div");

      slot.className = "game-slot";

      if (slots[i] !== null) {
        slot.classList.add("filled");
        slot.style.backgroundImage = `url("${src}")`;
        slot.style.backgroundSize = "300% 300%";
        slot.style.backgroundPosition =
          `${slots[i] % 3 * 50}% ${Math.floor(slots[i] / 3) * 50}%`;
      } else {
        slot.textContent = "Доставка";
      }

      slot.addEventListener("click", () => {
        if (selected === null) return;

        slots[i] = selected;
        remaining.splice(remaining.indexOf(selected), 1);
        selected = null;

        if (slots.every((v,i) => v === i)) {
          winGame();
        } else {
          render();
        }
      });

      slotGrid.appendChild(slot);
    }

    remaining.forEach(piece => {
      const tile = makePiece(piece, src);

      tile.addEventListener("click", () => {
        selected = piece;
        render();
      });

      tray.appendChild(tile);
    });
  }

  area.append(slotGrid, tray);
  render();
}


/* =========================================
   MODE 13
   ROW ORDER
========================================= */

function mode13() {
  const src = state.images[state.current].src;
  const area = $("#puzzle-grid");

  const order = shuffle([0,1,2,3,4,5,6,7,8]);

  let selected = null;

  const grid = document.createElement("div");
  grid.className = "game-tray";

  function render() {
    grid.innerHTML = "";

    order.forEach((piece, position) => {
      const tile = makePiece(piece, src);

      tile.addEventListener("click", () => {
        if (selected === null) {
          selected = position;
          render();
          return;
        }

        [order[selected], order[position]] =
          [order[position], order[selected]];

        selected = null;

        render();

        if (order.every((v,i) => v === i)) {
          winGame();
        }
      });

      if (selected === position) {
        tile.classList.add("selected");
      }

      grid.appendChild(tile);
    });
  }

  area.appendChild(grid);
  render();
}


/* =========================================
   MODE 14
   REVERSE SEQUENCE
========================================= */

function mode14() {
  const src = state.images[state.current].src;
  const area = $("#puzzle-grid");

  const order = shuffle([0,1,2,3,4,5,6,7,8]);

  let next = 8;

  const display = document.createElement("div");
  display.className = "sequence-display";

  const grid = document.createElement("div");
  grid.className = "game-tray";

  function update() {
    display.textContent = `Знайди частину №${next + 1}`;
  }

  order.forEach(piece => {
    const tile = makePiece(piece, src);

    tile.addEventListener("click", () => {
      if (piece !== next) {
        toast("Потрібно йти у зворотному порядку.");
        return;
      }

      tile.style.opacity = ".25";
      tile.disabled = true;

      next--;

      if (next < 0) {
        winGame();
      } else {
        update();
      }
    });

    grid.appendChild(tile);
  });

  area.append(display, grid);
  update();
}


/* =========================================
   MODE 15
   FINAL DRAG PUZZLE
========================================= */

function mode15() {
  const src = state.images[state.current].src;
  const area = $("#puzzle-grid");

  const order = shuffle([0,1,2,3,4,5,6,7,8]);

  const grid = document.createElement("div");
  grid.className = "game-tray";

  let selected = null;

  function render() {
    grid.innerHTML = "";

    order.forEach((piece, position) => {
      const tile = makePiece(piece, src);

      tile.draggable = true;

      tile.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", String(position));
      });

      tile.addEventListener("dragover", e => {
        e.preventDefault();
      });

      tile.addEventListener("drop", e => {
        e.preventDefault();

        const from = Number(
          e.dataTransfer.getData("text/plain")
        );

        [order[from], order[position]] =
          [order[position], order[from]];

        render();

        check();
      });

      tile.addEventListener("click", () => {
        if (selected === null) {
          selected = position;
          render();
          return;
        }

        [order[selected], order[position]] =
          [order[position], order[selected]];

        selected = null;

        render();
        check();
      });

      if (selected === position) {
        tile.classList.add("selected");
      }

      grid.appendChild(tile);
    });
  }

  function check() {
    if (order.every((v,i) => v === i)) {
      winGame();
    }
  }

  area.appendChild(grid);
  render();
}


/* =========================================
   GAME MODE ROUTER
========================================= */

const MODE_FUNCTIONS = [
  mode1,
  mode2,
  mode3,
  mode4,
  mode5,
  mode6,
  mode7,
  mode8,
  mode9,
  mode10,
  mode11,
  mode12,
  mode13,
  mode14,
  mode15
];

function renderMode(modeIndex) {
  $("#puzzle-grid").innerHTML = "";

  MODE_FUNCTIONS[modeIndex]();

  icons();
}


/* =========================================
   TUTORIAL SYSTEM
========================================= */

function openTutorial() {
  const mode = MODES[state.mode];

  $("#tutorial-title").textContent = mode.name;

  const content = $("#tutorial-content");

  content.innerHTML = "";

  mode.tutorial.forEach(([number, title, description]) => {
    const step = document.createElement("div");

    step.className = "tutorial-step";

    const numberEl = document.createElement("span");
    numberEl.textContent = number;

    const body = document.createElement("div");

    const heading = document.createElement("strong");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    body.append(heading, paragraph);
    step.append(numberEl, body);

    content.appendChild(step);
  });

  $("#tutorial-modal").classList.add("open");
  state.tutorialSeen = true;

  icons();
}

function closeTutorial() {
  $("#tutorial-modal").classList.remove("open");
}


/* =========================================
   EXAMPLE BUTTON
========================================= */

function showExample() {
  const mode = state.mode;

  const examples = [
    "Наприклад: якщо дві частини стоять не на своїх місцях, поміняй їх місцями.",
    "Наприклад: фрагмент із номером 1 потрібно помістити у першу клітинку.",
    "Наприклад: якщо ціль показує номер 1, натисни на фрагмент номер 1.",
    "Наприклад: відкрий дві картки й перевір, чи збігаються їхні фрагменти.",
    "Наприклад: якщо частина повернута боком, натисни на неї ще раз.",
    "Наприклад: починай із першої частини й рухайся до дев'ятої.",
    "Наприклад: вибери фрагмент і помісти його у відповідне місце.",
    "Наприклад: лови частини по порядку, не пропускаючи потрібну.",
    "Наприклад: спочатку постав верхню смужку, потім середню.",
    "Наприклад: якщо потрібно знайти частину №3, шукай саме її.",
    "Наприклад: дві картки з однаковим фрагментом утворюють пару.",
    "Наприклад: кожен фрагмент потрібно доставити до своєї клітинки.",
    "Наприклад: натисни на дві неправильні частини, щоб поміняти їх.",
    "Наприклад: починай із дев'ятої частини й рухайся назад.",
    "Наприклад: перетягни кожен фрагмент на його правильне місце."
  ];

  toast(examples[mode]);
}


/* =========================================
   FINAL GALLERY
========================================= */

function showGallery() {
  const gallery = $("#gallery-grid");
  const mosaic = $("#final-mosaic-grid");

  gallery.innerHTML = "";
  mosaic.innerHTML = "";

  state.images.forEach((image, index) => {
    const figure = document.createElement("figure");

    figure.className = "gallery-item";

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = `Зображення ${index + 1}`;
    img.loading = "lazy";

    const caption = document.createElement("figcaption");
    caption.textContent =
      `Зображення ${String(index + 1).padStart(2, "0")}`;

    figure.append(img, caption);
    gallery.appendChild(figure);

    const mosaicImage = document.createElement("img");
    mosaicImage.src = image.src;
    mosaicImage.alt = `Частина ${index + 1}`;

    mosaic.appendChild(mosaicImage);
  });

  $("#gallery-total").textContent =
    `${state.images.length} зображень зібрано`;

  showScreen("gallery-screen");

  burstParticles();
  icons();
}


/* =========================================
   RESTART CURRENT PUZZLE
========================================= */

function restartPuzzle() {
  if (state.solved) return;

  showPuzzle();
}


/* =========================================
   EVENT LISTENERS
========================================= */

$("#show-tutorial").addEventListener(
  "click",
  openTutorial
);

$("#close-tutorial").addEventListener(
  "click",
  closeTutorial
);

$("#tutorial-understood").addEventListener(
  "click",
  closeTutorial
);

$("#tutorial-modal").addEventListener("click", e => {
  if (e.target === $("#tutorial-modal")) {
    closeTutorial();
  }
});

$("#show-example").addEventListener(
  "click",
  showExample
);

$("#shuffle-button").addEventListener(
  "click",
  restartPuzzle
);

$("#continue-button").addEventListener(
  "click",
  continueGame
);

$("#back-to-top").addEventListener("click", () => {
  showScreen("intro-screen");
  window.scrollTo({ top: 0, behavior: "smooth" });
});


/* =========================================
   INITIALIZATION
========================================= */

async function init() {
  renderTitle();

  icons();

  $("#title-feedback").textContent =
    "Перетягни слова у правильні місця.";

  state.images = await discoverImages();

  if (!state.images.length) {
    $("#title-feedback").textContent =
      "Додай зображення до папки Assets (наприклад, 1.jpg), а потім онови сторінку.";

    return;
  }

  $("#header-progress").textContent =
    `0 / ${state.images.length}`;

  $("#mosaic-count").textContent =
    `0 / ${state.images.length}`;

  $("#progress-fraction").textContent =
    `0 / ${state.images.length}`;

  buildMosaic();

  updateHeader();
}

init();

})();
