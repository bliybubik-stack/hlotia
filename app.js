(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const screens = ["intro-screen", "countdown-screen", "puzzle-screen", "complete-screen", "gallery-screen"];
  const extensions = ["jpg", "jpeg", "png", "webp", "gif"];
  const state = {
    images: [],
    current: 0,
    order: [],
    selected: null,
    titleWords: ["НЕВЕЛИКЕ", "ЗАВДАННЯ", "ДЛЯ ТЕБЕ"],
    titleOrder: [2, 0, 1],
    titlePlaced: [null, null, null],
    selectedWord: null,
    tutorialSeen: false
  };

  function icons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function showScreen(id) {
    screens.forEach(screen => $("#" + screen).classList.toggle("active", screen === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2100);
  }

  function updateHeader() {
    const total = state.images.length;
    const done = state.current;
    const pct = total ? (done / total) * 100 : 0;
    $("#header-progress-fill").style.width = pct + "%";
    $("#header-progress").textContent = total ? `${Math.min(done, total)} / ${total}` : "Початок";
  }

  async function findImages() {
    const found = [];
    for (let n = 1; n <= 30; n++) {
      let foundPath = null;
      for (const ext of extensions) {
        const path = `Assets/${n}.${ext}`;
        try {
          const response = await fetch(path, { method: "HEAD", cache: "no-store" });
          if (response.ok) {
            foundPath = path;
            break;
          }
        } catch (_) {
          // A missing file is normal while checking the folder.
        }
      }
      if (!foundPath) break;
      found.push({ src: foundPath, number: n });
    }
    return found;
  }

  function renderTitlePuzzle() {
    const slots = $("#title-slots");
    const bank = $("#word-bank");
    slots.innerHTML = "";
    bank.innerHTML = "";

    state.titleWords.forEach((_, slotIndex) => {
      const slot = document.createElement("div");
      slot.className = "title-slot";
      slot.dataset.slot = String(slotIndex);
      slot.textContent = state.titlePlaced[slotIndex] === null ? "Перетягни сюди" : state.titleWords[state.titlePlaced[slotIndex]];
      if (state.titlePlaced[slotIndex] !== null) slot.classList.add("filled");
      slot.addEventListener("dragover", e => { e.preventDefault(); slot.classList.add("over"); });
      slot.addEventListener("dragleave", () => slot.classList.remove("over"));
      slot.addEventListener("drop", e => {
        e.preventDefault();
        slot.classList.remove("over");
        const wordIndex = Number(e.dataTransfer.getData("text/plain"));
        placeTitleWord(wordIndex, slotIndex);
      });
      slot.addEventListener("click", () => {
        if (state.selectedWord !== null) placeTitleWord(state.selectedWord, slotIndex);
      });
      slots.appendChild(slot);
    });

    state.titleOrder.forEach(wordIndex => {
      if (state.titlePlaced.includes(wordIndex)) return;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "word-chip" + (state.selectedWord === wordIndex ? " selected" : "");
      chip.textContent = state.titleWords[wordIndex];
      chip.draggable = true;
      chip.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", String(wordIndex)));
      chip.addEventListener("click", () => {
        state.selectedWord = state.selectedWord === wordIndex ? null : wordIndex;
        renderTitlePuzzle();
      });
      bank.appendChild(chip);
    });
    icons();
  }

  function placeTitleWord(wordIndex, slotIndex) {
    if (!Number.isInteger(wordIndex) || state.titlePlaced.includes(wordIndex)) return;
    if (wordIndex !== slotIndex) {
      $("#title-feedback").textContent = "Не зовсім! Спробуй інше місце — слово повернулося назад.";
      state.selectedWord = null;
      renderTitlePuzzle();
      return;
    }
    state.titlePlaced[slotIndex] = wordIndex;
    state.selectedWord = null;
    $("#title-feedback").textContent = "Правильно! Так тримати.";
    renderTitlePuzzle();
    if (state.titlePlaced.every((value, index) => value === index)) {
      setTimeout(finishTitle, 650);
    }
  }

  function finishTitle() {
    const heading = document.createElement("div");
    heading.className = "eyebrow";
    heading.innerHTML = '<span class="eyebrow-dot"></span> НЕВЕЛИКЕ ЗАВДАННЯ ДЛЯ ТЕБЕ';
    const intro = $(".intro-screen");
    const oldHeading = intro.querySelector(".intro-heading");
    oldHeading.style.transition = "all .65s cubic-bezier(.2,.8,.2,1)";
    oldHeading.style.transform = "translateY(-12px) scale(.94)";
    oldHeading.style.opacity = "0";
    setTimeout(() => {
      $("#header-title").textContent = "НЕВЕЛИКЕ ЗАВДАННЯ ДЛЯ ТЕБЕ";
      $("#header-title").classList.remove("title-fixed");
      void $("#header-title").offsetWidth;
      $("#header-title").classList.add("title-fixed");
      showScreen("countdown-screen");
      runCountdown();
    }, 500);
  }

  function runCountdown() {
    let count = 3;
    const number = $("#countdown-number");
    const caption = $("#countdown-caption");
    number.textContent = count;
    const tick = () => {
      count -= 1;
      if (count > 0) {
        number.textContent = count;
        number.style.animation = "none";
        void number.offsetWidth;
        number.style.animation = "";
      } else {
        number.textContent = "✓";
        caption.textContent = "Час складати перше зображення.";
        setTimeout(startPuzzles, 700);
      }
    };
    const interval = setInterval(() => {
      tick();
      if (count <= 0) clearInterval(interval);
    }, 850);
  }

  function shuffledOrder(size) {
    const values = Array.from({ length: size }, (_, i) => i);
    // Fisher-Yates; avoid accidentally starting solved.
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    if (values.every((v, i) => v === i)) [values[0], values[1]] = [values[1], values[0]];
    return values;
  }

  function startPuzzles() {
    if (!state.images.length) {
      showScreen("complete-screen");
      $(".complete-card p").textContent = "У папці Assets поки немає зображень. Додай файли й онови сторінку.";
      return;
    }
    state.current = 0;
    updateHeader();
    showPuzzle();
    showScreen("puzzle-screen");
    if (!state.tutorialSeen) openTutorial();
  }

  function showPuzzle() {
    const image = state.images[state.current];
    state.order = shuffledOrder(9);
    state.selected = null;
    $("#puzzle-number").textContent = String(state.current + 1).padStart(2, "0");
    $("#puzzle-counter").textContent = `ЗОБРАЖЕННЯ ${String(state.current + 1).padStart(2, "0")}`;
    $("#puzzle-heading").textContent = "Склади зображення";
    $("#puzzle-subtitle").textContent = "Переміщуй частини, доки вони не стануть на свої місця.";
    $("#progress-fraction").textContent = `${state.current} / ${state.images.length}`;
    $("#progress-fill").style.width = `${(state.current / state.images.length) * 100}%`;
    $("#progress-description").textContent = `Залишилося зображень: ${state.images.length - state.current}.`;
    $("#puzzle-status").innerHTML = '<i data-lucide="move"></i> Перетягни частину на іншу';
    renderBoard(image.src);
    updateHeader();
    icons();
  }

  function renderBoard(src) {
    const board = $("#puzzle-grid");
    board.innerHTML = "";
    state.order.forEach((piece, cellIndex) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "puzzle-tile";
      tile.setAttribute("aria-label", `Частина ${piece + 1}`);
      tile.dataset.cell = String(cellIndex);
      tile.dataset.piece = String(piece);
      const row = Math.floor(piece / 3);
      const col = piece % 3;
      tile.style.backgroundImage = `url("${src}")`;
      tile.style.backgroundSize = "300% 300%";
      tile.style.backgroundPosition = `${col * 50}% ${row * 50}%`;
      tile.draggable = true;
      tile.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", String(cellIndex));
        e.dataTransfer.effectAllowed = "move";
      });
      tile.addEventListener("dragover", e => { e.preventDefault(); tile.classList.add("drag-over"); });
      tile.addEventListener("dragleave", () => tile.classList.remove("drag-over"));
      tile.addEventListener("drop", e => {
        e.preventDefault();
        tile.classList.remove("drag-over");
        const from = Number(e.dataTransfer.getData("text/plain"));
        swapTiles(from, cellIndex);
      });
      tile.addEventListener("click", () => selectOrSwap(cellIndex));
      board.appendChild(tile);
    });
  }

  function selectOrSwap(index) {
    if (state.selected === null) {
      state.selected = index;
      renderBoard(state.images[state.current].src);
      const selected = $(`.puzzle-tile[data-cell="${index}"]`);
      if (selected) selected.classList.add("selected");
      return;
    }
    if (state.selected === index) {
      state.selected = null;
      renderBoard(state.images[state.current].src);
      return;
    }
    swapTiles(state.selected, index);
  }

  function swapTiles(from, to) {
    if (!Number.isInteger(from) || from < 0 || from >= 9 || from === to) return;
    [state.order[from], state.order[to]] = [state.order[to], state.order[from]];
    state.selected = null;
    renderBoard(state.images[state.current].src);
    if (state.order.every((piece, index) => piece === index)) {
      $("#puzzle-status").innerHTML = '<i data-lucide="check-circle-2"></i> Готово! Зображення складено.';
      icons();
      setTimeout(nextPuzzle, 850);
    } else {
      $("#puzzle-status").innerHTML = '<i data-lucide="move"></i> Гарно! Продовжуй складати.';
      icons();
    }
  }

  function nextPuzzle() {
    state.current += 1;
    if (state.current >= state.images.length) {
      $("#progress-fraction").textContent = `${state.images.length} / ${state.images.length}`;
      $("#progress-fill").style.width = "100%";
      updateHeader();
      showScreen("complete-screen");
      return;
    }
    showPuzzle();
    toast("Чудово! Наступне зображення вже готове.");
  }

  function openTutorial() {
    $("#tutorial-modal").classList.add("open");
    $("#tutorial-modal").setAttribute("aria-hidden", "false");
  }

  function closeTutorial() {
    $("#tutorial-modal").classList.remove("open");
    $("#tutorial-modal").setAttribute("aria-hidden", "true");
    state.tutorialSeen = true;
  }

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
      caption.textContent = `Зображення ${String(index + 1).padStart(2, "0")}`;
      figure.append(img, caption);
      grid.appendChild(figure);
    });
    $("#gallery-total").textContent = `${state.images.length} зображень`;
    showScreen("gallery-screen");
    icons();
  }

  $("#show-tutorial").addEventListener("click", openTutorial);
  $("#close-tutorial").addEventListener("click", closeTutorial);
  $("#tutorial-understood").addEventListener("click", closeTutorial);
  $("#tutorial-modal").addEventListener("click", e => {
    if (e.target === $("#tutorial-modal")) closeTutorial();
  });
  $("#example-button").addEventListener("click", () => {
    openTutorial();
    state.tutorialSeen = true;
  });
  $("#shuffle-button").addEventListener("click", () => {
    state.order = shuffledOrder(9);
    state.selected = null;
    renderBoard(state.images[state.current].src);
    $("#puzzle-status").innerHTML = '<i data-lucide="shuffle"></i> Частини перемішано.';
    icons();
  });
  $("#reveal-gallery").addEventListener("click", revealGallery);
  $("#back-to-top").addEventListener("click", () => {
    showScreen("intro-screen");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  async function init() {
    renderTitlePuzzle();
    icons();
    state.images = await findImages();
    if (!state.images.length) {
      $("#title-feedback").textContent = "Спочатку додай зображення до папки Assets (наприклад, 1.jpg, 2.png), а потім онови сторінку.";
      $("#puzzle-subtitle").textContent = "У папці Assets поки не знайдено зображень.";
    }
    $("#piece-count").textContent = "9 ЧАСТИН";
    updateHeader();
  }

  init();
})();