(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);

  const TOTAL_STAGES = 20;
  const IMAGE_LIMIT = 15;

  const WORDS = ["ЦЕ", "ТВОЄ", "ЗАВДАННЯ"];

  const MODES = [
    {
      id: "swap",
      title: "Поміняй частини місцями",
      subtitle: "Перестав фрагменти, щоб відновити картинку.",
      hint: "Натисни на два фрагменти, щоб поміняти їх місцями.",
      count: "9 ЧАСТИН"
    },
    {
      id: "rotate",
      title: "Поверни фрагменти",
      subtitle: "Кожен фрагмент потрібно повернути правильно.",
      hint: "Натискай на фрагмент, щоб повернути його.",
      count: "9 ЧАСТИН"
    },
    {
      id: "jigsaw",
      title: "Розстав частини",
      subtitle: "Перемісти кожен фрагмент у правильну клітинку.",
      hint: "Спочатку вибери фрагмент, а потім клітинку.",
      count: "9 ЧАСТИН"
    },
    {
      id: "strips",
      title: "Збери смужки",
      subtitle: "Постав три горизонтальні смужки у правильному порядку.",
      hint: "Натисни на дві смужки, щоб поміняти їх місцями.",
      count: "3 СМУЖКИ"
    },
    {
      id: "order",
      title: "Натисни по порядку",
      subtitle: "Знайди числа від 1 до 9 у правильній послідовності.",
      hint: "Натискай числа від одного до дев'яти.",
      count: "9 ЧАСТИН"
    },
    {
      id: "memory",
      title: "Знайди пари",
      subtitle: "Відкрий картки та знайди однакові фрагменти.",
      hint: "Запам'ятовуй фрагменти й знаходь однакові.",
      count: "4 ПАРИ"
    }
  ];

  const state = {
    images: [],
    imageBag: [],
    previousImage: null,

    stage: 0,
    currentImage: null,
    mode: null,
    previousMode: null,

    selected: null,
    locked: false,

    order: [],
    rotations: [],
    tray: [],
    strips: [],
    memory: [],
    memoryOpen: [],
    memoryMatched: [],
    nextNumber: 1,

    titleSelected: null,
    titlePlaced: [],
    tutorialSeen: false
  };

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
      screen.classList.remove("active");
    });

    $("#" + id).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  function updateHeader() {
    const done = state.stage;
    const percent = done / TOTAL_STAGES * 100;

    $("#header-progress").textContent =
      `${done} / ${TOTAL_STAGES}`;

    $("#header-progress-fill").style.width = percent + "%";
  }

  function imageStyle(src, piece, cols = 3, rows = 3) {
    const col = piece % cols;
    const row = Math.floor(piece / cols);

    return `
      background-image: url("${src}");
      background-size: ${cols * 100}% ${rows * 100}%;
      background-position: ${cols === 1 ? 50 : col / (cols - 1) * 100}% ${rows === 1 ? 50 : row / (rows - 1) * 100}%;
    `;
  }

  function imageExists(url) {
    return new Promise(resolve => {
      const img = new Image();

      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);

      img.src = url;
    });
  }

  async function findImages() {
    const found = [];
    const extensions = ["jpg", "jpeg", "png", "webp", "gif"];

    for (let number = 1; number <= IMAGE_LIMIT; number++) {
      let foundUrl = null;

      for (const extension of extensions) {
        const url = `Assets/${number}.${extension}`;

        if (await imageExists(url)) {
          foundUrl = url;
          break;
        }
      }

      // Stop at the first missing number.
      if (!foundUrl) break;

      found.push(foundUrl);
    }

    return found;
  }

  // Pick an image without repeating until the image bag is empty.
  function pickRandomImage() {
    if (state.imageBag.length === 0) {
      state.imageBag = shuffle(state.images);

      // Avoid repeating the last image when starting a new cycle.
      if (
        state.imageBag.length > 1 &&
        state.imageBag[0] === state.previousImage
      ) {
        [state.imageBag[0], state.imageBag[1]] =
          [state.imageBag[1], state.imageBag[0]];
      }
    }

    const image = state.imageBag.pop();

    state.previousImage = image;

    return image;
  }

  function pickRandomMode() {
    const available = MODES.filter(mode => mode.id !== state.previousMode);
    const selected = available[Math.floor(Math.random() * available.length)];

    state.previousMode = selected.id;

    return selected;
  }

  // -------------------------
  // INTRO WORD PUZZLE
  // -------------------------

  function renderTitlePuzzle() {
    const slots = $("#title-slots");
    const bank = $("#word-bank");

    slots.innerHTML = "";
    bank.innerHTML = "";

    WORDS.forEach((word, index) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "title-slot";

      if (state.titlePlaced[index] !== undefined) {
        slot.textContent = word;
        slot.classList.add("filled");
      } else {
        slot.textContent = "Порожнє місце";
      }

      slot.addEventListener("click", () => {
        if (state.titleSelected !== null) {
          placeTitleWord(state.titleSelected, index);
        }
      });

      slots.appendChild(slot);
    });

    const wordOrder = shuffle([0, 1, 2]);

    wordOrder.forEach(index => {
      if (state.titlePlaced.includes(index)) return;

      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "word-chip";

      if (state.titleSelected === index) {
        chip.classList.add("selected");
      }

      chip.textContent = WORDS[index];

      chip.addEventListener("click", () => {
        state.titleSelected =
          state.titleSelected === index ? null : index;

        renderTitlePuzzle();
      });

      bank.appendChild(chip);
    });
  }

  function placeTitleWord(wordIndex, slotIndex) {
    if (state.titlePlaced.includes(wordIndex)) return;

    if (wordIndex !== slotIndex) {
      $("#title-feedback").textContent =
        "Не зовсім! Спробуй ще раз.";

      state.titleSelected = null;
      renderTitlePuzzle();
      return;
    }

    state.titlePlaced[slotIndex] = wordIndex;
    state.titleSelected = null;

    renderTitlePuzzle();

    if (state.titlePlaced.length === WORDS.length) {
      $("#title-feedback").textContent = "Правильно!";

      $("#start-button").hidden = false;
    }
  }

  function runCountdown() {
    showScreen("countdown-screen");

    let count = 3;

    $("#countdown-number").textContent = count;

    const interval = setInterval(() => {
      count--;

      if (count > 0) {
        $("#countdown-number").textContent = count;
      } else {
        clearInterval(interval);

        $("#countdown-number").textContent = "✓";
        $("#countdown-caption").textContent = "Починаємо!";

        setTimeout(startGame, 650);
      }
    }, 850);
  }

  // -------------------------
  // START GAME
  // -------------------------

  function startGame() {
    if (!state.images.length) {
      toast("Не знайдено зображень у папці Assets.");
      showScreen("intro-screen");
      return;
    }

    state.stage = 0;
    state.previousImage = null;
    state.imageBag = [];
    state.previousMode = null;

    startStage();
  }

  function startStage() {
    if (state.stage >= TOTAL_STAGES) {
      finishGame();
      return;
    }

    state.currentImage = pickRandomImage();
    state.mode = pickRandomMode();

    state.selected = null;
    state.locked = false;

    $("#stage-number").textContent =
      `${String(state.stage + 1).padStart(2, "0")} / ${TOTAL_STAGES}`;

    $("#puzzle-counter").textContent =
      `ЕТАП ${String(state.stage + 1).padStart(2, "0")}`;

    $("#puzzle-heading").textContent = state.mode.title;
    $("#puzzle-subtitle").textContent = state.mode.subtitle;
    $("#piece-count").textContent = state.mode.count;
    $("#side-hint").textContent = state.mode.hint;

    $("#progress-fraction").textContent =
      `${state.stage} / ${TOTAL_STAGES}`;

    $("#progress-fill").style.width =
      `${state.stage / TOTAL_STAGES * 100}%`;

    $("#progress-description").textContent =
      `Завдання ${state.stage + 1} з ${TOTAL_STAGES}`;

    $("#puzzle-status").textContent = "Виконай завдання!";

    showScreen("puzzle-screen");

    renderMode();
    openTutorial();
    updateHeader();
  }

  function renderMode() {
    const board = $("#puzzle-grid");

    board.innerHTML = "";
    board.className = "puzzle-grid";
    board.style.cssText = "";

    const oldTray = $("#piece-tray");

    if (oldTray) oldTray.remove();

    state.selected = null;
    state.locked = false;

    switch (state.mode.id) {
      case "swap":
        setupSwap();
        break;

      case "rotate":
        setupRotate();
        break;

      case "jigsaw":
        setupJigsaw();
        break;

      case "strips":
        setupStrips();
        break;

      case "order":
        setupOrder();
        break;

      case "memory":
        setupMemory();
        break;
    }
  }

  function makeTile(src, piece, cols = 3, rows = 3) {
    const tile = document.createElement("button");

    tile.type = "button";
    tile.className = "puzzle-tile";
    tile.style.cssText = imageStyle(src, piece, cols, rows);

    return tile;
  }

  // -------------------------
  // GAME 1: SWAP
  // -------------------------

  function setupSwap() {
    state.order = shuffle([0,1,2,3,4,5,6,7,8]);

    if (state.order.every((value, index) => value === index)) {
      [state.order[0], state.order[1]] =
        [state.order[1], state.order[0]];
    }

    renderSwap();
  }

  function renderSwap() {
    const board = $("#puzzle-grid");

    board.innerHTML = "";

    state.order.forEach((piece, cell) => {
      const tile = makeTile(state.currentImage, piece);

      tile.addEventListener("click", () => {
        if (state.locked) return;

        if (state.selected === null) {
          state.selected = cell;
          tile.classList.add("selected");
        } else if (state.selected === cell) {
          state.selected = null;
          renderSwap();
        } else {
          const first = state.selected;

          [state.order[first], state.order[cell]] =
            [state.order[cell], state.order[first]];

          state.selected = null;

          renderSwap();

          if (state.order.every((v, i) => v === i)) {
            winStage();
          }
        }
      });

      board.appendChild(tile);
    });
  }

  // -------------------------
  // GAME 2: ROTATE
  // -------------------------

  function setupRotate() {
    state.rotations = Array.from(
      { length: 9 },
      () => Math.floor(Math.random() * 3) + 1
    );

    renderRotate();
  }

  function renderRotate() {
    const board = $("#puzzle-grid");

    board.innerHTML = "";

    state.rotations.forEach((rotation, piece) => {
      const tile = makeTile(state.currentImage, piece);

      tile.style.transform = `rotate(${rotation * 90}deg)`;

      tile.addEventListener("click", () => {
        if (state.locked) return;

        state.rotations[piece] =
          (state.rotations[piece] + 1) % 4;

        tile.style.transform =
          `rotate(${state.rotations[piece] * 90}deg)`;

        if (state.rotations.every(value => value === 0)) {
          winStage();
        }
      });

      board.appendChild(tile);
    });
  }

  // -------------------------
  // GAME 3: JIGSAW
  // -------------------------

  function setupJigsaw() {
    const board = $("#puzzle-grid");

    state.tray = shuffle([0,1,2,3,4,5,6,7,8]);

    for (let slot = 0; slot < 9; slot++) {
      const target = document.createElement("button");

      target.type = "button";
      target.className = "jigsaw-slot";
      target.dataset.slot = slot;

      target.addEventListener("click", () => {
        if (state.selected !== null) {
          placeJigsaw(state.selected, slot);
        }
      });

      board.appendChild(target);
    }

    const tray = document.createElement("div");

    tray.id = "piece-tray";
    tray.className = "piece-tray";

    state.tray.forEach(piece => {
      const tile = makeTile(state.currentImage, piece);

      tile.classList.add("tray-piece");

      tile.addEventListener("click", () => {
        if (state.locked) return;

        state.selected =
          state.selected === piece ? null : piece;

        tray.querySelectorAll(".tray-piece").forEach(element => {
          element.classList.toggle(
            "selected",
            Number(element.dataset.piece) === state.selected
          );
        });

        tile.dataset.piece = piece;
      });

      tray.appendChild(tile);
      tile.dataset.piece = piece;
    });

    board.parentElement.insertBefore(tray, $(".puzzle-bottom"));
  }

  function placeJigsaw(piece, slot) {
    if (state.locked || !Number.isInteger(piece)) return;
    if (state.tray[piece] === -1) return;

    if (piece !== slot) {
      toast("Цей фрагмент не підходить.");
      return;
    }

    state.tray[piece] = -1;

    const target = $(`.jigsaw-slot[data-slot="${slot}"]`);

    target.classList.add("filled");
    target.style.cssText = imageStyle(state.currentImage, piece);

    const tile = $(`#piece-tray [data-piece="${piece}"]`);

    if (tile) tile.remove();

    state.selected = null;

    if (state.tray.every(value => value === -1)) {
      winStage();
    }
  }

  // -------------------------
  // GAME 4: STRIPS
  // -------------------------

  function setupStrips() {
    state.strips = shuffle([0,1,2]);

    if (state.strips.every((value, index) => value === index)) {
      [state.strips[0], state.strips[1]] =
        [state.strips[1], state.strips[0]];
    }

    renderStrips();
  }

  function renderStrips() {
    const board = $("#puzzle-grid");

    board.innerHTML = "";
    board.style.gridTemplateColumns = "1fr";
    board.style.gridTemplateRows = "repeat(3, 1fr)";
    board.style.aspectRatio = "1.6";

    state.strips.forEach((piece, cell) => {
      const tile = makeTile(state.currentImage, piece, 1, 3);

      tile.style.backgroundSize = "100% 300%";
      tile.style.backgroundPosition = `center ${piece * 50}%`;
      tile.style.minHeight = "55px";

      tile.addEventListener("click", () => {
        if (state.locked) return;

        if (state.selected === null) {
          state.selected = cell;
          renderStrips();
          board.children[cell].classList.add("selected");
        } else {
          const first = state.selected;

          [state.strips[first], state.strips[cell]] =
            [state.strips[cell], state.strips[first]];

          state.selected = null;

          renderStrips();

          if (state.strips.every((v, i) => v === i)) {
            winStage();
          }
        }
      });

      board.appendChild(tile);
    });
  }

  // -------------------------
  // GAME 5: TAP IN ORDER
  // -------------------------

  function setupOrder() {
    state.order = shuffle([1,2,3,4,5,6,7,8,9]);
    state.nextNumber = 1;

    renderOrder();
  }

  function renderOrder() {
    const board = $("#puzzle-grid");

    board.innerHTML = "";

    state.order.forEach((number, cell) => {
      const tile = makeTile(state.currentImage, cell);

      const label = document.createElement("span");
      label.className = "order-number";
      label.textContent = number;

      tile.appendChild(label);

      tile.addEventListener("click", () => {
        if (state.locked) return;

        if (number === state.nextNumber) {
          tile.style.opacity = ".25";
          tile.disabled = true;

          state.nextNumber++;

          $("#puzzle-status").textContent =
            `Правильно! Наступне число: ${state.nextNumber}`;

          if (state.nextNumber === 10) {
            winStage();
          }
        } else {
          toast("Не те число. Шукай наступне!");
        }
      });

      board.appendChild(tile);
    });
  }

  // -------------------------
  // GAME 6: MEMORY
  // -------------------------

  function setupMemory() {
    state.memory = shuffle([0,0,1,1,2,2,3,3]);
    state.memoryOpen = [];
    state.memoryMatched = [];

    const board = $("#puzzle-grid");

    board.classList.add("memory-grid");
    board.style.gridTemplateColumns = "repeat(4, 1fr)";
    board.style.gridTemplateRows = "repeat(2, 1fr)";
    board.style.aspectRatio = "1.8";

    state.memory.forEach((pair, id) => {
      const card = document.createElement("button");

      card.type = "button";
      card.className = "memory-card";
      card.innerHTML = `
        <span class="memory-back">?</span>
        <span class="memory-face"></span>
      `;

      card.querySelector(".memory-face").style.cssText =
        imageStyle(state.currentImage, pair, 2, 2);

      card.addEventListener("click", () => flipMemory(id, card));

      board.appendChild(card);
    });
  }

  function flipMemory(id, card) {
    if (state.locked) return;
    if (state.memoryMatched.includes(id)) return;
    if (state.memoryOpen.includes(id)) return;

    card.classList.add("flipped");
    state.memoryOpen.push(id);

    if (state.memoryOpen.length !== 2) return;

    const [first, second] = state.memoryOpen;

    if (state.memory[first] === state.memory[second]) {
      state.memoryMatched.push(first, second);

      document.querySelectorAll(".memory-card").forEach((element, index) => {
        if (index === first || index === second) {
          element.classList.add("matched");
        }
      });

      state.memoryOpen = [];

      if (state.memoryMatched.length === 8) {
        winStage();
      }
    } else {
      state.locked = true;

      setTimeout(() => {
        document.querySelectorAll(".memory-card").forEach((element, index) => {
          if (index === first || index === second) {
            element.classList.remove("flipped");
          }
        });

        state.memoryOpen = [];
        state.locked = false;
      }, 800);
    }
  }

  // -------------------------
  // STAGE COMPLETION
  // -------------------------

  function winStage() {
    if (state.locked) return;

    state.locked = true;

    $("#puzzle-status").textContent = "Чудово! Етап завершено.";

    toast("Етап пройдено!");

    setTimeout(() => {
      state.stage++;

      $("#progress-fraction").textContent =
        `${state.stage} / ${TOTAL_STAGES}`;

      $("#progress-fill").style.width =
        `${state.stage / TOTAL_STAGES * 100}%`;

      updateHeader();

      if (state.stage >= TOTAL_STAGES) {
        finishGame();
      } else {
        startStage();
      }
    }, 900);
  }

  function finishGame() {
    state.stage = TOTAL_STAGES;

    $("#progress-fraction").textContent =
      `${TOTAL_STAGES} / ${TOTAL_STAGES}`;

    $("#progress-fill").style.width = "100%";

    updateHeader();

    showScreen("complete-screen");
  }

  // -------------------------
  // TUTORIAL
  // -------------------------

  const TUTORIALS = {
    swap: {
      title: "Поміняй частини місцями",
      steps: [
        ["Вибери фрагмент", "Натисни на будь-яку частину зображення."],
        ["Вибери інший", "Натисни на другу частину, щоб поміняти їх місцями."],
        ["Збери картинку", "Повторюй, поки всі частини не будуть на правильних місцях."]
      ],
      example: "На телефоні: натисни на зображення, воно підсвітиться, потім натисни на місце, куди хочеш його перемістити."
    },

    rotate: {
      title: "Поверни фрагменти",
      steps: [
        ["Знайди повернутий фрагмент", "Деякі частини зображення повернуті неправильно."],
        ["Натисни на нього", "Кожне натискання повертає фрагмент на 90 градусів."],
        ["Вирівняй усе", "Потрібно повернути всі дев'ять фрагментів."]
      ],
      example: "Натискай на фрагменти, поки все зображення не стане правильним."
    },

    jigsaw: {
      title: "Розстав частини",
      steps: [
        ["Вибери фрагмент", "Натисни на одну з частин під ігровим полем."],
        ["Вибери місце", "Натисни на клітинку, куди хочеш її поставити."],
        ["Заповни поле", "Правильні фрагменти залишатимуться на місці."]
      ],
      example: "To drag on mobile, you just click on an image, it will highlight, then click where you want it to go."
    },

    strips: {
      title: "Збери смужки",
      steps: [
        ["Подивись на смужки", "Зображення поділене на три горизонтальні частини."],
        ["Вибери дві смужки", "Натисни на першу, а потім на другу."],
        ["Віднови порядок", "Постав їх зверху вниз у правильній послідовності."]
      ],
      example: "На телефоні просто натискай на дві смужки по черзі."
    },

    order: {
      title: "Натисни по порядку",
      steps: [
        ["Знайди число 1", "Подивись на числа, які розташовані на фрагментах."],
        ["Продовжуй послідовність", "Натискай 2, потім 3, потім 4 і так далі."],
        ["Дійди до 9", "Коли натиснеш усі числа, етап завершиться."]
      ],
      example: "Це найпростіший етап. Просто рахуй від одного до дев'яти."
    },

    memory: {
      title: "Знайди пари",
      steps: [
        ["Відкрий картку", "Натисни на будь-яку картку."],
        ["Відкрий ще одну", "Спробуй знайти такий самий фрагмент."],
        ["Знайди всі пари", "Усього потрібно знайти чотири пари."]
      ],
      example: "Запам'ятовуй, де знаходяться однакові фрагменти."
    }
  };

  function openTutorial() {
    const tutorial = TUTORIALS[state.mode.id];

    $("#tutorial-title").textContent = tutorial.title;

    $("#tutorial-steps").innerHTML = tutorial.steps.map((step, index) => `
      <div class="tutorial-step">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <div>
          <strong>${step[0]}</strong>
          <p>${step[1]}</p>
        </div>
      </div>
    `).join("");

    $("#example-description").textContent = tutorial.example;

    $("#tutorial-modal").classList.add("open");
    $("#tutorial-modal").setAttribute("aria-hidden", "false");
  }

  function closeTutorial() {
    $("#tutorial-modal").classList.remove("open");
    $("#tutorial-modal").setAttribute("aria-hidden", "true");

    state.tutorialSeen = true;
  }

  // -------------------------
  // GALLERY
  // -------------------------

  function revealGallery() {
    const grid = $("#gallery-grid");

    grid.innerHTML = "";

    state.images.forEach((src, index) => {
      const figure = document.createElement("figure");
      figure.className = "gallery-item";

      const image = document.createElement("img");
      image.src = src;
      image.alt = `Зображення ${index + 1}`;
      image.loading = "lazy";

      const caption = document.createElement("figcaption");
      caption.textContent =
        `Зображення ${String(index + 1).padStart(2, "0")}`;

      figure.append(image, caption);
      grid.appendChild(figure);
    });

    $("#gallery-total").textContent =
      `${state.images.length} зображень`;

    showScreen("gallery-screen");
  }

  // -------------------------
  // BUTTONS
  // -------------------------

  $("#start-button").addEventListener("click", runCountdown);

  $("#show-tutorial").addEventListener("click", openTutorial);

  $("#example-button").addEventListener("click", openTutorial);

  $("#close-tutorial").addEventListener("click", closeTutorial);

  $("#tutorial-understood").addEventListener("click", closeTutorial);

  $("#tutorial-modal").addEventListener("click", event => {
    if (event.target === $("#tutorial-modal")) {
      closeTutorial();
    }
  });

  $("#shuffle-button").addEventListener("click", () => {
    if (state.locked) return;

    renderMode();

    toast("Перемішано!");
  });

  $("#reveal-gallery").addEventListener("click", revealGallery);

  $("#back-to-top").addEventListener("click", () => {
    showScreen("intro-screen");
  });

  // -------------------------
  // INITIALIZE
  // -------------------------

  async function init() {
    renderTitlePuzzle();

    state.images = await findImages();

    if (!state.images.length) {
      $("#title-feedback").textContent =
        "Не знайдено зображень. Додай Assets/1.jpg, Assets/2.jpg тощо.";

      $("#start-button").hidden = true;
      return;
    }

    $("#title-feedback").textContent =
      `Знайдено ${state.images.length} зображень. Склади фразу, щоб почати.`;

    updateHeader();
  }

  init();

})();
