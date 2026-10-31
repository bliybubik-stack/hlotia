(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const SCREEN_IDS = [
    "intro-screen",
    "countdown-screen",
    "puzzle-screen",
    "complete-screen",
    "gallery-screen"
  ];

  const IMAGE_EXTENSIONS = [
    "jpg", "jpeg", "png", "webp", "gif"
  ];

  const MODES = [
    {
      id: 0,
      title: "Обмін частин",
      subtitle: "Поміняй частини місцями, щоб відновити зображення.",
      count: "9 ЧАСТИН",
      icon: "move"
    },
    {
      id: 1,
      title: "Поверни частини",
      subtitle: "Натискай на повернуті фрагменти, доки всі вони не стануть рівно.",
      count: "9 ФРАГМЕНТІВ",
      icon: "rotate-cw"
    },
    {
      id: 2,
      title: "Мозаїка",
      subtitle: "Перетягни кожен фрагмент у відповідну клітинку.",
      count: "9 ФРАГМЕНТІВ",
      icon: "puzzle"
    },
    {
      id: 3,
      title: "П’ятнашки",
      subtitle: "Пересувай сусідні частини у вільну клітинку, щоб відновити порядок.",
      count: "8 ЧАСТИН",
      icon: "grid-3x3"
    },
    {
      id: 4,
      title: "Склади смужки",
      subtitle: "Розташуй три горизонтальні смужки у правильному порядку.",
      count: "3 СМУЖКИ",
      icon: "rows-3"
    },
    {
      id: 5,
      title: "Знайди пари",
      subtitle: "Відкривай картки та знаходь однакові фрагменти.",
      count: "4 ПАРИ",
      icon: "copy"
    }
  ];

  const TUTORIALS = [
    {
      steps: [
        ["Обери частину", "Натисни на фрагмент, який хочеш перемістити."],
        ["Знайди пару", "Натисни на другу частину або перетягни першу на неї."],
        ["Збери порядок", "Повторюй, доки всі дев’ять фрагментів не стануть правильно."]
      ],
      example: "Якщо фрагмент 2 стоїть на місці 5, поміняй їх місцями."
    },
    {
      steps: [
        ["Подивись на фрагменти", "Кожна частина вже стоїть на своєму місці, але повернута."],
        ["Натискай на частину", "Кожне натискання повертає її на 90 градусів."],
        ["Вирівняй усі", "Потрібно, щоб кожен фрагмент був повернутий правильно."]
      ],
      example: "Натискай на фрагмент, доки його верхній край не буде зверху."
    },
    {
      steps: [
        ["Знайди фрагмент", "Усі частини розташовані під полем."],
        ["Перетягни або натисни", "Перетягни фрагмент у клітинку. На телефоні спочатку вибери фрагмент, потім клітинку."],
        ["Заповни поле", "Якщо фрагмент підходить, він залишиться на місці."]
      ],
      example: "Фрагмент із верхнього лівого кута має потрапити у верхню ліву клітинку."
    },
    {
      steps: [
        ["Знайди порожню клітинку", "Одна клітинка порожня — у неї можна пересувати частини."],
        ["Рухай сусідні частини", "Натискай лише на частини поруч із порожнім місцем."],
        ["Віднови порядок", "Збери послідовність від першої частини до останньої."]
      ],
      example: "Порожнє місце працює як вільна клітинка: пересувати можна тільки сусідню частину."
    },
    {
      steps: [
        ["Подивись на смужки", "Зображення розділене на три горизонтальні частини."],
        ["Поміняй їх місцями", "Натисни на дві смужки по черзі або перетягни одну на іншу."],
        ["Склади зверху вниз", "Верхня, середня та нижня смужки мають бути у правильному порядку."]
      ],
      example: "Смужка з верхнім краєм зображення має бути першою, а з нижнім краєм — останньою."
    },
    {
      steps: [
        ["Відкрий картку", "Натисни на будь-яку картку, щоб побачити фрагмент."],
        ["Запам’ятай його", "Відкрий іншу картку й шукай такий самий фрагмент."],
        ["Знайди всі пари", "Усього потрібно знайти чотири пари однакових фрагментів."]
      ],
      example: "Дві картки з однаковим фрагментом залишаються відкритими. Шукай наступну пару."
    }
  ];

  const state = {
    images: [],
    imageIndex: 0,

    modeOrder: [],
    previousModeOrder: "",
    modePosition: 0,

    selected: null,
    locked: false,
    tutorialSeen: false,

    titleWords: [
      "НЕВЕЛИКЕ",
      "ЗАВДАННЯ",
      "ДЛЯ ТЕБЕ"
    ],

    titleOrder: [],
    titlePlaced: [null, null, null],
    selectedWord: null,

    swap: [],
    rotations: [],
    jigsawRemaining: [],
    sliding: [],
    strips: [],
    memory: [],
    memoryOpen: [],
    memoryMatched: []
  };

  /* BASIC FUNCTIONS */

  function icons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function showScreen(id) {
    SCREEN_IDS.forEach((screenId) => {
      const screen = $("#" + screenId);

      if (screen) {
        screen.classList.toggle(
          "active",
          screenId === id
        );
      }
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function toast(message) {
    const element = $("#toast");

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      element.classList.remove("show");
    }, 2200);
  }

  function shuffle(values) {
    const result = values.slice();

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [result[i], result[j]] = [
        result[j],
        result[i]
      ];
    }

    return result;
  }

  function randomNonSolved(values) {
    const result = shuffle(values);

    if (result.every((value, index) => value === index)) {
      [result[0], result[1]] = [
        result[1],
        result[0]
      ];
    }

    return result;
  }

  function currentModeId() {
    return state.modeOrder[state.modePosition];
  }

  function currentMode() {
    return MODES[currentModeId()];
  }

  function imageStyle(
    src,
    piece,
    columns = 3,
    rows = 3
  ) {
    const x = piece % columns;
    const y = Math.floor(piece / columns);

    const xPosition = columns === 1
      ? 50
      : (x / (columns - 1)) * 100;

    const yPosition = rows === 1
      ? 50
      : (y / (rows - 1)) * 100;

    return `
      background-image:url("${src}");
      background-size:${columns * 100}% ${rows * 100}%;
      background-position:${xPosition}% ${yPosition}%
    `;
  }

  /* PROGRESS */

  function updateProgress() {
    const total = state.images.length * MODES.length;

    const completed =
      state.imageIndex * MODES.length +
      state.modePosition;

    const percent = total
      ? (completed / total) * 100
      : 0;

    $("#header-progress-fill").style.width =
      `${percent}%`;

    $("#header-progress").textContent = total
      ? `${Math.min(completed, total)} / ${total}`
      : "Початок";

    $("#progress-fraction").textContent =
      `${completed} / ${total}`;

    $("#progress-fill").style.width =
      `${percent}%`;

    $("#progress-description").textContent =
      `Зображення ${state.imageIndex + 1} з ${state.images.length} · Мінігра ${state.modePosition + 1} з ${MODES.length}.`;
  }

  /* IMAGE DETECTION */

  function imageExists(path) {
    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);

      image.src = `${path}?check=${Date.now()}`;
    });
  }

  async function findImages() {
    const found = [];

    // Files must be numbered consecutively:
    // 1.jpg, 2.png, 3.webp, etc.

    for (let number = 1; number <= 30; number++) {
      let selectedPath = null;

      for (const extension of IMAGE_EXTENSIONS) {
        const path = `Assets/${number}.${extension}`;

        if (await imageExists(path)) {
          selectedPath = path;
          break;
        }
      }

      if (!selectedPath) break;

      found.push({
        src: selectedPath,
        number
      });
    }

    return found;
  }

  /* TITLE PUZZLE */

  function renderTitlePuzzle() {
    const slots = $("#title-slots");
    const bank = $("#word-bank");

    slots.innerHTML = "";
    bank.innerHTML = "";

    state.titleWords.forEach((word, slotIndex) => {
      const slot = document.createElement("button");

      slot.type = "button";
      slot.className = "title-slot";
      slot.dataset.slot = String(slotIndex);

      slot.textContent =
        state.titlePlaced[slotIndex] === null
          ? "Перетягни сюди"
          : word;

      if (state.titlePlaced[slotIndex] !== null) {
        slot.classList.add("filled");
      }

      slot.addEventListener("dragover", (event) => {
        event.preventDefault();
        slot.classList.add("over");
      });

      slot.addEventListener("dragleave", () => {
        slot.classList.remove("over");
      });

      slot.addEventListener("drop", (event) => {
        event.preventDefault();

        slot.classList.remove("over");

        placeTitleWord(
          Number(event.dataTransfer.getData("text/plain")),
          slotIndex
        );
      });

      slot.addEventListener("click", () => {
        if (state.selectedWord !== null) {
          placeTitleWord(
            state.selectedWord,
            slotIndex
          );
        }
      });

      slots.appendChild(slot);
    });

    state.titleOrder.forEach((wordIndex) => {
      if (state.titlePlaced.includes(wordIndex)) return;

      const chip = document.createElement("button");

      chip.type = "button";

      chip.className =
        "word-chip" +
        (state.selectedWord === wordIndex
          ? " selected"
          : "");

      chip.textContent = state.titleWords[wordIndex];
      chip.draggable = true;

      chip.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData(
          "text/plain",
          String(wordIndex)
        );
      });

      chip.addEventListener("click", () => {
        state.selectedWord =
          state.selectedWord === wordIndex
            ? null
            : wordIndex;

        renderTitlePuzzle();
      });

      bank.appendChild(chip);
    });
  }

  function placeTitleWord(wordIndex, slotIndex) {
    if (
      !Number.isInteger(wordIndex) ||
      wordIndex < 0 ||
      wordIndex >= state.titleWords.length
    ) return;

    if (
      state.titlePlaced.includes(wordIndex) ||
      state.titlePlaced[slotIndex] !== null
    ) return;

    if (wordIndex !== slotIndex) {
      $("#title-feedback").textContent =
        "Не зовсім! Спробуй інше місце — слово повернулося назад.";

      state.selectedWord = null;

      renderTitlePuzzle();
      return;
    }

    state.titlePlaced[slotIndex] = wordIndex;
    state.selectedWord = null;

    $("#title-feedback").textContent =
      "Правильно! Так тримати.";

    renderTitlePuzzle();

    if (
      state.titlePlaced.every(
        (value, index) => value === index
      )
    ) {
      setTimeout(finishTitle, 650);
    }
  }

  function finishTitle() {
    const heading = $(".intro-screen .intro-heading");

    heading.style.transition =
      "all .65s cubic-bezier(.2,.8,.2,1)";

    heading.style.transform =
      "translateY(-12px) scale(.94)";

    heading.style.opacity = "0";

    setTimeout(() => {
      $("#header-title").textContent =
        "НЕВЕЛИКЕ ЗАВДАННЯ ДЛЯ ТЕБЕ";

      $("#header-title").classList.add("title-fixed");

      showScreen("countdown-screen");

      runCountdown();
    }, 500);
  }

  /* COUNTDOWN */

  function runCountdown() {
    let count = 3;

    const number = $("#countdown-number");
    const caption = $("#countdown-caption");

    number.textContent = String(count);

    const timer = setInterval(() => {
      count--;

      if (count > 0) {
        number.textContent = String(count);

        number.style.animation = "none";

        void number.offsetWidth;

        number.style.animation = "";
      } else {
        clearInterval(timer);

        number.textContent = "✓";

        caption.textContent =
          "Час складати перше зображення.";

        setTimeout(startPuzzles, 650);
      }
    }, 850);
  }

  /* START GAME */

  function startPuzzles() {
  if (!state.images.length) {
    showScreen("complete-screen");
    $(".complete-card p").textContent = "У папці Assets поки немає зображень. Додай файли й онови сторінку.";
    $("#reveal-gallery").hidden = true;
    return;
  }

  $("#reveal-gallery").hidden = false;

  // Randomize all available images every time the game starts.
  state.images = shuffle(state.images);

  state.imageIndex = 0;
  state.previousModeOrder = "";

  beginImage();
  showScreen("puzzle-screen");
  openTutorial();
}

  /*
   * RANDOM MODE ORDER
   *
   * Each image receives a fresh permutation.
   * All six games appear exactly once.
   * The next image cannot use the exact same order
   * as the previous image.
   */

  function beginImage() {
    let nextOrder;

    do {
      nextOrder = shuffle([0, 1, 2, 3, 4, 5]);
    } while (
      nextOrder.join(",") === state.previousModeOrder
    );

    state.modeOrder = nextOrder;

    state.previousModeOrder =
      nextOrder.join(",");

    state.modePosition = 0;

    showPuzzle();
  }

  /* RENDER CURRENT PUZZLE */

  function showPuzzle() {
    const mode = currentMode();
    const image = state.images[state.imageIndex];

    state.selected = null;
    state.locked = false;

    $("#puzzle-number").textContent =
      `${String(state.imageIndex + 1).padStart(2, "0")} · ${state.modePosition + 1}/6`;

    $("#puzzle-counter").textContent =
      `ЗОБРАЖЕННЯ ${String(state.imageIndex + 1).padStart(2, "0")} · ЕТАП ${state.modePosition + 1}/6`;

    $("#puzzle-heading").textContent = mode.title;
    $("#puzzle-subtitle").textContent = mode.subtitle;
    $("#piece-count").textContent = mode.count;

    $("#puzzle-status").innerHTML =
      `<i data-lucide="${mode.icon}"></i> ${mode.subtitle}`;

    const board = $("#puzzle-grid");

    board.innerHTML = "";
    board.className = "puzzle-grid";
    board.removeAttribute("style");

    const oldTray = $("#piece-tray");

    if (oldTray) oldTray.remove();

    switch (mode.id) {
      case 0:
        setupSwap(image.src);
        break;

      case 1:
        setupRotate(image.src);
        break;

      case 2:
        setupJigsaw(image.src);
        break;

      case 3:
        setupSliding(image.src);
        break;

      case 4:
        setupStrips(image.src);
        break;

      case 5:
        setupMemory(image.src);
        break;
    }

    updateProgress();
    icons();
  }

  function makeTile(
    src,
    piece,
    cell,
    columns = 3,
    rows = 3
  ) {
    const tile = document.createElement("button");

    tile.type = "button";
    tile.className = "puzzle-tile";

    tile.style.cssText =
      imageStyle(src, piece, columns, rows);

    tile.dataset.cell = String(cell);
    tile.dataset.piece = String(piece);

    tile.setAttribute(
      "aria-label",
      `Фрагмент ${piece + 1}`
    );

    return tile;
  }

  /* PUZZLE 1: SWAP */

  function setupSwap(src) {
    state.swap = randomNonSolved([
      0, 1, 2,
      3, 4, 5,
      6, 7, 8
    ]);

    renderSwap(src);
  }

  function renderSwap(src) {
    const board = $("#puzzle-grid");

    board.innerHTML = "";

    state.swap.forEach((piece, cell) => {
      const tile = makeTile(src, piece, cell);

      tile.addEventListener("click", () => {
        selectSwap(cell);
      });

      tile.draggable = true;

      tile.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData(
          "text/plain",
          String(cell)
        );

        event.dataTransfer.effectAllowed = "move";
      });

      tile.addEventListener("dragover", (event) => {
        event.preventDefault();
        tile.classList.add("drag-over");
      });

      tile.addEventListener("dragleave", () => {
        tile.classList.remove("drag-over");
      });

      tile.addEventListener("drop", (event) => {
        event.preventDefault();

        tile.classList.remove("drag-over");

        swapTiles(
          Number(event.dataTransfer.getData("text/plain")),
          cell
        );
      });

      if (state.selected === cell) {
        tile.classList.add("selected");
      }

      board.appendChild(tile);
    });
  }

  function selectSwap(cell) {
    if (state.locked) return;

    if (state.selected === null) {
      state.selected = cell;
    } else if (state.selected === cell) {
      state.selected = null;
    } else {
      swapTiles(state.selected, cell);
    }

    renderSwap(state.images[state.imageIndex].src);
  }

  function swapTiles(first, second) {
    if (
      state.locked ||
      !Number.isInteger(first) ||
      !Number.isInteger(second) ||
      first < 0 ||
      second < 0 ||
      first > 8 ||
      second > 8 ||
      first === second
    ) return;

    [state.swap[first], state.swap[second]] = [
      state.swap[second],
      state.swap[first]
    ];

    state.selected = null;

    renderSwap(state.images[state.imageIndex].src);

    if (
      state.swap.every(
        (piece, index) => piece === index
      )
    ) {
      winMode();
    }
  }

  /* PUZZLE 2: ROTATE */

  function setupRotate(src) {
    state.rotations = Array.from(
      { length: 9 },
      () => Math.floor(Math.random() * 3) + 1
    );

    const board = $("#puzzle-grid");

    state.rotations.forEach((rotation, piece) => {
      const tile = makeTile(src, piece, piece);

      tile.style.transform =
        `rotate(${rotation * 90}deg)`;

      tile.addEventListener("click", () => {
        if (state.locked) return;

        state.rotations[piece] =
          (state.rotations[piece] + 1) % 4;

        tile.style.transform =
          `rotate(${state.rotations[piece] * 90}deg)`;

        if (
          state.rotations.every(value => value === 0)
        ) {
          winMode();
        }
      });

      board.appendChild(tile);
    });
  }

  /* PUZZLE 3: JIGSAW */

  function setupJigsaw(src) {
    const board = $("#puzzle-grid");

    state.jigsawRemaining = shuffle([
      0, 1, 2,
      3, 4, 5,
      6, 7, 8
    ]);

    for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
      const slot = document.createElement("button");

      slot.type = "button";
      slot.className = "jigsaw-slot";
      slot.dataset.slot = String(slotIndex);
      slot.textContent = "+";

      slot.setAttribute(
        "aria-label",
        `Місце ${slotIndex + 1}`
      );

      slot.addEventListener("dragover", (event) => {
        event.preventDefault();
      });

      slot.addEventListener("drop", (event) => {
        event.preventDefault();

        placeJigsaw(
          Number(event.dataTransfer.getData("text/plain")),
          slotIndex
        );
      });

      slot.addEventListener("click", () => {
        if (state.selected !== null) {
          placeJigsaw(state.selected, slotIndex);
        }
      });

      board.appendChild(slot);
    }

    const tray = document.createElement("div");

    tray.id = "piece-tray";
    tray.className = "piece-tray";

    state.jigsawRemaining.forEach((piece) => {
      const tile = makeTile(src, piece, piece);

      tile.classList.add("tray-piece");
      tile.draggable = true;

      tile.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData(
          "text/plain",
          String(piece)
        );
      });

      tile.addEventListener("click", () => {
        state.selected =
          state.selected === piece ? null : piece;

        tray.querySelectorAll(".tray-piece").forEach((element) => {
          element.classList.toggle(
            "selected",
            Number(element.dataset.piece) === state.selected
          );
        });
      });

      tray.appendChild(tile);
    });

    board.parentElement.insertBefore(
      tray,
      $(".puzzle-bottom")
    );
  }

  function placeJigsaw(piece, slotIndex) {
    if (
      state.locked ||
      !Number.isInteger(piece) ||
      !state.jigsawRemaining.includes(piece)
    ) return;

    if (piece !== slotIndex) {
      toast("Цей фрагмент не підходить до цієї клітинки.");

      state.selected = null;

      $("#piece-tray")
        .querySelectorAll(".selected")
        .forEach(element => element.classList.remove("selected"));

      return;
    }

    const slot = $(
      `.jigsaw-slot[data-slot="${slotIndex}"]`
    );

    if (!slot || slot.classList.contains("filled")) return;

    slot.className = "jigsaw-slot filled";

    slot.style.cssText =
      imageStyle(state.images[state.imageIndex].src, piece);

    slot.textContent = "";

    state.jigsawRemaining =
      state.jigsawRemaining.filter(
        value => value !== piece
      );

    const trayPiece = $(
      `#piece-tray [data-piece="${piece}"]`
    );

    if (trayPiece) trayPiece.remove();

    state.selected = null;

    if (state.jigsawRemaining.length === 0) {
      winMode();
    }
  }

  /* PUZZLE 4: SLIDING PUZZLE */

  function setupSliding(src) {
    state.sliding = [
      0, 1, 2,
      3, 4, 5,
      6, 7, 8
    ];

    let blank = 8;
    let previousBlank = -1;

    // Shuffle using legal moves only.
    // This guarantees that the puzzle remains solvable.

    for (let step = 0; step < 110; step++) {
      const candidates = [
        blank - 3,
        blank + 3
      ];

      if (blank % 3 > 0) {
        candidates.push(blank - 1);
      }

      if (blank % 3 < 2) {
        candidates.push(blank + 1);
      }

      const legal = candidates.filter(
        cell =>
          cell >= 0 &&
          cell < 9 &&
          cell !== previousBlank
      );

      const next =
        legal[Math.floor(Math.random() * legal.length)];

      [state.sliding[blank], state.sliding[next]] = [
        state.sliding[next],
        state.sliding[blank]
      ];

      previousBlank = blank;
      blank = next;
    }

    if (
      state.sliding.every(
        (value, index) => value === index
      )
    ) {
      const neighbor =
        blank % 3 > 0 ? blank - 1 : blank + 1;

      [state.sliding[blank], state.sliding[neighbor]] = [
        state.sliding[neighbor],
        state.sliding[blank]
      ];
    }

    renderSliding(src);
  }

  function renderSliding(src) {
    const board = $("#puzzle-grid");

    board.innerHTML = "";

    state.sliding.forEach((piece, cell) => {
      if (piece === 8) {
        const empty = document.createElement("div");

        empty.className = "slide-empty";
        empty.setAttribute(
          "aria-label",
          "Порожня клітинка"
        );

        board.appendChild(empty);
        return;
      }

      const tile = makeTile(src, piece, cell);

      tile.addEventListener("click", () => {
        moveSliding(cell);
      });

      board.appendChild(tile);
    });
  }

  function moveSliding(cell) {
    if (state.locked) return;

    const blank = state.sliding.indexOf(8);

    const distance =
      Math.abs(Math.floor(cell / 3) - Math.floor(blank / 3)) +
      Math.abs((cell % 3) - (blank % 3));

    if (distance !== 1) return;

    [state.sliding[cell], state.sliding[blank]] = [
      state.sliding[blank],
      state.sliding[cell]
    ];

    renderSliding(state.images[state.imageIndex].src);

    if (
      state.sliding.every(
        (piece, index) => piece === index
      )
    ) {
      winMode();
    }
  }

  /* PUZZLE 5: IMAGE STRIPS */

  function setupStrips(src) {
    state.strips = randomNonSolved([0, 1, 2]);

    renderStrips(src);
  }

  function renderStrips(src) {
    const board = $("#puzzle-grid");

    board.innerHTML = "";
    board.classList.add("strip-grid");

    state.strips.forEach((piece, cell) => {
      const strip = makeTile(src, piece, cell, 1, 3);

      strip.style.backgroundSize = "100% 300%";
      strip.style.backgroundPosition = `center ${piece * 50}%`;
      strip.style.aspectRatio = "auto";
      strip.draggable = true;

      strip.addEventListener("click", () => {
        selectStrip(cell);
      });

      strip.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData(
          "text/plain",
          String(cell)
        );
      });

      strip.addEventListener("dragover", (event) => {
        event.preventDefault();
      });

      strip.addEventListener("drop", (event) => {
        event.preventDefault();

        swapStrips(
          Number(event.dataTransfer.getData("text/plain")),
          cell
        );
      });

      if (state.selected === cell) {
        strip.classList.add("selected");
      }

      board.appendChild(strip);
    });
  }

  function selectStrip(cell) {
    if (state.selected === null) {
      state.selected = cell;
    } else if (state.selected === cell) {
      state.selected = null;
    } else {
      swapStrips(state.selected, cell);
    }

    renderStrips(state.images[state.imageIndex].src);
  }

  function swapStrips(first, second) {
    if (
      state.locked ||
      !Number.isInteger(first) ||
      !Number.isInteger(second) ||
      first < 0 ||
      second < 0 ||
      first > 2 ||
      second > 2 ||
      first === second
    ) return;

    [state.strips[first], state.strips[second]] = [
      state.strips[second],
      state.strips[first]
    ];

    state.selected = null;

    renderStrips(state.images[state.imageIndex].src);

    if (
      state.strips.every(
        (piece, index) => piece === index
      )
    ) {
      winMode();
    }
  }

  /* PUZZLE 6: MEMORY MATCH */

  function setupMemory(src) {
    state.memory = shuffle([
      0, 0,
      1, 1,
      2, 2,
      3, 3
    ]);

    state.memoryOpen = [];
    state.memoryMatched = [];

    const board = $("#puzzle-grid");

    board.classList.add("memory-grid");

    board.style.gridTemplateColumns =
      "repeat(4, minmax(0, 1fr))";

    board.style.gridTemplateRows =
      "repeat(2, minmax(0, 1fr))";

    board.style.aspectRatio = "2 / 1";

    state.memory.forEach((fragment, cardIndex) => {
      const card = document.createElement("button");

      card.type = "button";
      card.className = "memory-card";
      card.dataset.card = String(cardIndex);

      card.setAttribute(
        "aria-label",
        `Картка ${cardIndex + 1}`
      );

      const back = document.createElement("span");

      back.className = "memory-back";
      back.textContent = "?";

      const face = document.createElement("span");

      face.className = "memory-face";

      face.style.cssText =
        imageStyle(src, fragment, 2, 2);

      card.append(back, face);

      card.addEventListener("click", () => {
        flipMemory(cardIndex);
      });

      board.appendChild(card);
    });
  }

  function flipMemory(cardIndex) {
    if (
      state.locked ||
      state.memoryMatched.includes(cardIndex) ||
      state.memoryOpen.includes(cardIndex)
    ) return;

    const card = $(
      `.memory-card[data-card="${cardIndex}"]`
    );

    if (!card) return;

    card.classList.add("flipped");

    state.memoryOpen.push(cardIndex);

    if (state.memoryOpen.length !== 2) return;

    const [first, second] = state.memoryOpen;

    if (state.memory[first] === state.memory[second]) {
      state.memoryMatched.push(first, second);

      state.memoryOpen = [];

      if (state.memoryMatched.length === 8) {
        winMode();
      }

      return;
    }

    state.locked = true;

    setTimeout(() => {
      [first, second].forEach((index) => {
        const element = $(
          `.memory-card[data-card="${index}"]`
        );

        if (element) {
          element.classList.remove("flipped");
        }
      });

      state.memoryOpen = [];
      state.locked = false;
    }, 800);
  }

  /* PUZZLE COMPLETION */

  function winMode() {
    if (state.locked) return;

    state.locked = true;

    $("#puzzle-status").innerHTML =
      '<i data-lucide="check-circle-2"></i> Чудово! Етап завершено.';

    icons();

    setTimeout(() => {
      state.locked = false;
      advanceMode();
    }, 800);
  }

  function advanceMode() {
    state.modePosition++;

    // There are still puzzle types left for this image.
    if (state.modePosition < MODES.length) {
      showPuzzle();
      openTutorial();
      return;
    }

    // All six games completed for this image.
    state.imageIndex++;

    // All images completed.
    if (state.imageIndex >= state.images.length) {
      $("#progress-fraction").textContent =
        `${state.images.length * MODES.length} / ${state.images.length * MODES.length}`;

      $("#progress-fill").style.width = "100%";
      $("#header-progress-fill").style.width = "100%";

      $("#header-progress").textContent =
        `${state.images.length * MODES.length} / ${state.images.length * MODES.length}`;

      showScreen("complete-screen");
      return;
    }

    // Start next image with a new randomized puzzle order.
    beginImage();

    toast("Зображення пройдено! Переходимо до наступного.");

    openTutorial();
  }

  /* TUTORIALS */

  function openTutorial() {
    const modeId = currentModeId();

    const mode = MODES[modeId];
    const tutorial = TUTORIALS[modeId];

    $("#tutorial-title").textContent =
      `Як грати: ${mode.title.toLowerCase()}`;

    $("#tutorial-steps").innerHTML =
      tutorial.steps.map((step, index) => `
        <div class="tutorial-step">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>${step[0]}</strong>
            <p>${step[1]}</p>
          </div>
        </div>
      `).join("");

    $("#example-caption").textContent =
      mode.title.toUpperCase();

    $("#example-description").textContent =
      tutorial.example;

    $("#tutorial-modal").classList.add("open");

    $("#tutorial-modal").setAttribute(
      "aria-hidden",
      "false"
    );

    icons();
  }

  function closeTutorial() {
    $("#tutorial-modal").classList.remove("open");

    $("#tutorial-modal").setAttribute(
      "aria-hidden",
      "true"
    );

    state.tutorialSeen = true;
  }

  /* FINAL GALLERY */

  function revealGallery() {
    const grid = $("#gallery-grid");

    grid.innerHTML = "";

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

      grid.appendChild(figure);
    });

    $("#gallery-total").textContent =
      `${state.images.length} зображень`;

    showScreen("gallery-screen");

    icons();
  }

  /* EVENT LISTENERS */

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

  $("#tutorial-modal").addEventListener("click", (event) => {
    if (event.target === $("#tutorial-modal")) {
      closeTutorial();
    }
  });

  $("#example-button").addEventListener(
    "click",
    openTutorial
  );

  $("#shuffle-button").addEventListener("click", () => {
    if (state.locked) return;

    showPuzzle();

    toast("Цю мінігру перемішано заново.");
  });

  $("#reveal-gallery").addEventListener(
    "click",
    revealGallery
  );

  $("#back-to-top").addEventListener("click", () => {
    showScreen("intro-screen");
  });

  /* INITIALIZATION */

  async function init() {
    state.titleOrder = shuffle([0, 1, 2]);

    renderTitlePuzzle();

    icons();

    state.images = await findImages();

    if (!state.images.length) {
      $("#title-feedback").textContent =
        "Спочатку додай зображення до папки Assets (наприклад, 1.jpg, 2.png), а потім онови сторінку.";

      $("#puzzle-subtitle").textContent =
        "У папці Assets поки не знайдено зображень.";
    }

    updateProgress();
  }

  init().catch((error) => {
    console.error(
      "Не вдалося завантажити зображення:",
      error
    );

    $("#title-feedback").textContent =
      "Не вдалося перевірити папку Assets. Переконайся, що сайт відкрито через GitHub Pages.";
  });

})();
