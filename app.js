
(() => {
  "use strict";

  const $ = s => document.querySelector(s);

  const state = {
    images: [],
    current: 0,
    selected: [],
    order: [],
    memory: [],
    matched: [],
    matchLeft: null,
    titleWords: ["НЕВЕЛИКЕ", "ЗАВДАННЯ", "ДЛЯ ТЕБЕ"],
    titleOrder: [2, 0, 1],
    titlePlaced: [null, null, null],
    selectedWord: null,
    tutorialSeen: false,
    completed: false
  };

  const tasks = [
    {
      type: "choice",
      title: "Знайди правильну відповідь",
      description: "Яке слово правильно завершує речення?",
      instruction: "Прочитай речення та обери слово, яке найкраще підходить за змістом.",
      example: "Наприклад: Сонце світить вдень.",
      question: "Пташка літає, а рибка...",
      options: ["Плаває", "Бігає", "Читає", "Спить"],
      answer: 0
    },
    {
      type: "order",
      title: "Правильна послідовність",
      description: "Розташуй дії у правильному порядку.",
      instruction: "Натискай на картки по черзі. Коли всі картки вибрані, перевір результат.",
      example: "Спочатку 1, потім 2, потім 3.",
      items: ["Почистити зуби", "Взяти щітку", "Нанести пасту", "Почати чистити"],
      answer: [1, 2, 0, 3]
    },
    {
      type: "odd",
      title: "Зайвий елемент",
      description: "Знайди те, що не належить до групи.",
      instruction: "Усі варіанти, крім одного, мають щось спільне.",
      example: "Яблуко, груша, банан, стілець. Зайвий — стілець.",
      question: "Що тут зайве?",
      options: ["Яблуко", "Груша", "Морква", "Банан"],
      answer: 2
    },
    {
      type: "math",
      title: "Трохи математики",
      description: "Розв'яжи короткий приклад.",
      instruction: "Обчисли вираз і введи відповідь у поле.",
      example: "Якщо 5 + 3 = 8, введи 8.",
      question: "18 + 7 − 9 = ?",
      answer: "16"
    },
    {
      type: "pattern",
      title: "Продовж закономірність",
      description: "Знайди, що має бути наступним.",
      instruction: "Подивись на послідовність і визнач правило.",
      example: "2, 4, 6, 8... Наступне число — 10.",
      question: "3 · 6 · 9 · 12 · ?",
      options: ["13", "14", "15", "18"],
      answer: 2
    },
    {
      type: "memory",
      title: "Тренування пам'яті",
      description: "Знайди всі три пари однакових символів.",
      instruction: "Відкривай картки по дві. Знайди однакові пари.",
      example: "Якщо відкрила дві однакові картки, вони залишаться відкритими.",
      cards: ["●", "▲", "■", "●", "■", "▲"]
    },
    {
      type: "match",
      title: "З'єднай відповідності",
      description: "Знайди правильні пари.",
      instruction: "Спочатку натисни елемент зліва, потім відповідний елемент справа.",
      example: "Сонце → День.",
      left: ["Сонце", "Місяць", "Сніг", "Вогонь"],
      right: ["Холод", "Ніч", "Тепло", "Світло"],
      answers: [3, 1, 0, 2]
    },
    {
      type: "truth",
      title: "Правда чи неправда?",
      description: "Перевір, чи правильне твердження.",
      instruction: "Прочитай твердження та вибери один із двох варіантів.",
      example: "Вода замерзає за температури близько 0°C — правда.",
      question: "У павука шість ніг.",
      options: ["Правда", "Неправда"],
      answer: 1
    },
    {
      type: "count",
      title: "Порахуй елементи",
      description: "Уважно порахуй усі символи.",
      instruction: "Порахуй, скільки однакових символів показано.",
      example: "● ● ● = 3.",
      symbols: "◆ ● ◆ ◆ ● ◆",
      question: "Скільки тут ромбів?",
      options: ["2", "3", "4", "5"],
      answer: 2
    },
    {
      type: "word",
      title: "Перемішані літери",
      description: "Віднови правильне слово.",
      instruction: "Літери переставлені місцями. Введи правильне слово.",
      example: "ОКТ → КОТ.",
      question: "Склади назву тварини:",
      scrambled: "АБКІШ",
      answer: "ШИБКА"
    },
    {
      type: "riddle",
      title: "Маленька загадка",
      description: "Відгадай загадку.",
      instruction: "Подумай над описом і вибери правильний варіант.",
      example: "Має стрілки, але не показує напрямок дороги. Це годинник.",
      question: "Має зуби, але не їсть. Що це?",
      options: ["Гребінець", "Кіт", "Книга", "Хмара"],
      answer: 0
    },
    {
      type: "sequence",
      title: "Віднови порядок",
      description: "Розстав числа від найменшого до найбільшого.",
      instruction: "Натискай числа в порядку зростання.",
      example: "3, 1, 2 → 1, 2, 3.",
      items: ["14", "3", "21", "8", "1"],
      answer: [4, 1, 3, 0, 2]
    },
    {
      type: "direction",
      title: "Орієнтація",
      description: "Знайди правильний напрямок.",
      instruction: "Уяви, що ти дивишся на стрілку. Визнач її напрямок.",
      example: "↑ означає вгору.",
      question: "Який напрямок показує стрілка?",
      arrow: "↙",
      options: ["Вгору", "Вправо", "Вниз", "Вліво", "Вниз і вліво"],
      answer: 4
    },
    {
      type: "category",
      title: "Знайди правильну групу",
      description: "Визнач, до якої категорії належить предмет.",
      instruction: "Прочитай назву предмета та вибери його категорію.",
      example: "Морква — овоч.",
      question: "До якої групи належить кит?",
      options: ["Риби", "Ссавці", "Птахи", "Комахи"],
      answer: 1
    },
    {
      type: "logic",
      title: "Останнє логічне завдання",
      description: "Знайди правильний висновок.",
      instruction: "Уважно прочитай умову. Обери єдиний правильний висновок.",
      example: "Усі квадрати мають чотири сторони. Ця фігура — квадрат. Отже, у неї чотири сторони.",
      question: "Усі троянди — квіти. Ця рослина — троянда. Що можна сказати?",
      options: [
        "Це квітка",
        "Це дерево",
        "Це тварина",
        "Це гриб"
      ],
      answer: 0
    }
  ];

  function icons() {
    if (window.lucide) lucide.createIcons();
  }

  function showScreen(id) {
    ["intro-screen", "countdown-screen", "puzzle-screen",
     "complete-screen", "gallery-screen"].forEach(name => {
      $("#" + name).classList.toggle("active", name === id);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function updateHeader() {
    const percent = state.current / tasks.length * 100;
    $("#header-progress-fill").style.width = percent + "%";
    $("#header-progress").textContent =
      `${Math.min(state.current, 15)} / 15`;
  }

  // ---------- TITLE PUZZLE ----------

  function renderTitlePuzzle() {
    const slots = $("#title-slots");
    const bank = $("#word-bank");
    slots.innerHTML = "";
    bank.innerHTML = "";

    state.titleWords.forEach((word, index) => {
      const slot = document.createElement("div");
      slot.className = "title-slot";
      slot.dataset.slot = index;

      const placed = state.titlePlaced[index];
      slot.textContent = placed === null ? "Перетягни сюди" :
        state.titleWords[placed];

      if (placed !== null) slot.classList.add("filled");

      slot.addEventListener("dragover", e => {
        e.preventDefault();
        slot.classList.add("over");
      });

      slot.addEventListener("dragleave", () =>
        slot.classList.remove("over"));

      slot.addEventListener("drop", e => {
        e.preventDefault();
        slot.classList.remove("over");
        placeTitleWord(Number(e.dataTransfer.getData("text/plain")), index);
      });

      slot.addEventListener("click", () => {
        if (state.selectedWord !== null)
          placeTitleWord(state.selectedWord, index);
      });

      slots.appendChild(slot);
    });

    state.titleOrder.forEach(index => {
      if (state.titlePlaced.includes(index)) return;

      const chip = document.createElement("button");
      chip.className = "word-chip";
      chip.textContent = state.titleWords[index];
      chip.draggable = true;

      chip.addEventListener("dragstart", e =>
        e.dataTransfer.setData("text/plain", String(index)));

      chip.addEventListener("click", () => {
        state.selectedWord = state.selectedWord === index ? null : index;
        chip.classList.toggle("selected");
      });

      bank.appendChild(chip);
    });
  }

  function placeTitleWord(wordIndex, slotIndex) {
    if (!Number.isInteger(wordIndex) ||
        state.titlePlaced.includes(wordIndex)) return;

    if (wordIndex !== slotIndex) {
      $("#title-feedback").textContent =
        "Не зовсім! Слово повернулося назад. Спробуй ще раз.";
      state.selectedWord = null;
      renderTitlePuzzle();
      return;
    }

    state.titlePlaced[slotIndex] = wordIndex;
    state.selectedWord = null;
    renderTitlePuzzle();

    if (state.titlePlaced.every((v, i) => v === i))
      setTimeout(finishTitle, 650);
  }

  function finishTitle() {
    const heading = $(".intro-heading");
    heading.style.transition = "all .6s ease";
    heading.style.transform = "translateY(-12px) scale(.94)";
    heading.style.opacity = "0";

    setTimeout(() => {
      $("#header-title").textContent = "НЕВЕЛИКЕ ЗАВДАННЯ ДЛЯ ТЕБЕ";
      $("#header-title").classList.add("title-fixed");
      showScreen("countdown-screen");
      runCountdown();
    }, 550);
  }

  function runCountdown() {
    let count = 3;
    const number = $("#countdown-number");
    const caption = $("#countdown-caption");

    number.textContent = count;

    const interval = setInterval(() => {
      count--;

      if (count > 0) {
        number.textContent = count;
        number.style.animation = "none";
        void number.offsetWidth;
        number.style.animation = "";
      } else {
        clearInterval(interval);
        number.textContent = "✓";
        caption.textContent = "Починаємо!";
        setTimeout(startPuzzles, 700);
      }
    }, 850);
  }

  // ---------- MOSAIC REVEAL ----------

  function renderMosaic() {
    let mosaic = $("#picture-mosaic");

    if (!mosaic) {
      mosaic = document.createElement("div");
      mosaic.id = "picture-mosaic";
      mosaic.className = "picture-mosaic";

      const panel = $(".puzzle-panel");
      const heading = document.createElement("div");
      heading.className = "mosaic-heading";
      heading.innerHTML =
        '<span>ЗІБРАНЕ ЗОБРАЖЕННЯ</span><strong id="mosaic-count">0 / 15</strong>';

      panel.insertBefore(heading, $("#puzzle-grid"));
      panel.insertBefore(mosaic, $("#puzzle-grid"));
    }

    mosaic.innerHTML = "";

    for (let i = 0; i < 15; i++) {
      const piece = document.createElement("div");
      piece.className = "mosaic-piece";
      piece.dataset.piece = i;

      if (i < state.current) {
        piece.classList.add("revealed");

        if (state.images[0]) {
          const row = Math.floor(i / 5);
          const col = i % 5;
          piece.style.backgroundImage = `url("${state.images[0].src}")`;
          piece.style.backgroundSize = "500% 300%";
          piece.style.backgroundPosition =
            `${col * 25}% ${row * 50}%`;
        }
      } else {
        piece.innerHTML = '<i data-lucide="lock"></i>';
      }

      mosaic.appendChild(piece);
    }

    $("#mosaic-count").textContent = `${state.current} / 15`;
    icons();
  }

  function revealMosaicPiece() {
    const mosaic = $("#picture-mosaic");
    const piece = mosaic.children[state.current - 1];

    if (piece) {
      piece.classList.add("revealed", "piece-pop");

      if (state.images[0]) {
        const i = state.current - 1;
        const row = Math.floor(i / 5);
        const col = i % 5;

        piece.style.backgroundImage = `url("${state.images[0].src}")`;
        piece.style.backgroundSize = "500% 300%";
        piece.style.backgroundPosition =
          `${col * 25}% ${row * 50}%`;
      }
    }

    $("#mosaic-count").textContent = `${state.current} / 15`;
  }

  // ---------- CELEBRATION ----------

  function celebrate() {
    const canvas = document.createElement("div");
    canvas.className = "celebration-layer";
    document.body.appendChild(canvas);

    const symbols = ["✦", "✧", "●", "◆", "✳", "★"];

    for (let i = 0; i < 75; i++) {
      const particle = document.createElement("span");
      particle.className = "celebration-particle";
      particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];

      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 260;

      particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
      particle.style.setProperty("--rotation", `${Math.random() * 720}deg`);
      particle.style.setProperty("--delay", `${Math.random() * .25}s`);
      particle.style.left = `${40 + Math.random() * 20}%`;
      particle.style.top = `${35 + Math.random() * 25}%`;
      particle.style.fontSize = `${9 + Math.random() * 13}px`;

      canvas.appendChild(particle);
    }

    setTimeout(() => canvas.remove(), 1800);
  }

  // ---------- GAME SETUP ----------

  async function findImages() {
    const found = [];
    const extensions = ["jpg", "jpeg", "png", "webp", "gif"];

    for (let n = 1; n <= 30; n++) {
      let path = null;

      for (const ext of extensions) {
        const candidate = `Assets/${n}.${ext}`;

        try {
          const response = await fetch(candidate, { method: "HEAD" });
          if (response.ok) {
            path = candidate;
            break;
          }
        } catch (_) {}
      }

      if (!path) break;
      found.push({ src: path, number: n });
    }

    return found;
  }

  function startPuzzles() {
    if (!state.images.length) {
      $(".complete-card p").textContent =
        "У папці Assets не знайдено зображень. Додай фото та онови сторінку.";
      showScreen("complete-screen");
      return;
    }

    state.current = 0;
    state.completed = false;

    $("#puzzle-grid").style.display = "none";
    renderMosaic();
    showScreen("puzzle-screen");
    showPuzzle();

    if (!state.tutorialSeen) openTutorial();
  }

  function showPuzzle() {
    const task = tasks[state.current];

    state.selected = [];
    state.order = [];
    state.memory = [];
    state.matched = [];
    state.matchLeft = null;

    $("#puzzle-number").textContent =
      String(state.current + 1).padStart(2, "0");

    $("#puzzle-counter").textContent =
      `ЗАВДАННЯ ${String(state.current + 1).padStart(2, "0")} / 15`;

    $("#puzzle-heading").textContent = task.title;
    $("#puzzle-subtitle").textContent = task.description;

    $("#piece-count").textContent = "МІНІГРА ГРА";
    $("#progress-fraction").textContent = `${state.current} / 15`;
    $("#progress-fill").style.width = `${state.current / 15 * 100}%`;
    $("#progress-description").textContent =
      `Виконано ${state.current} із 15 завдань.`;

    $("#puzzle-status").textContent = "Виконай завдання, щоб продовжити.";

    renderMosaic();
    renderTask(task);
    updateHeader();
    updateTutorial(task);
    icons();
  }

  function gameArea() {
    let area = $("#mini-game-area");

    if (!area) {
      area = document.createElement("div");
      area.id = "mini-game-area";
      area.className = "mini-game-area";
      $(".puzzle-panel").appendChild(area);
    }

    area.innerHTML = "";
    return area;
  }

  function addQuestion(area, text) {
    const question = document.createElement("h2");
    question.className = "game-question";
    question.textContent = text;
    area.appendChild(question);
  }

  function addOptions(area, options, answer) {
    const grid = document.createElement("div");
    grid.className = "answer-options";

    options.forEach((option, index) => {
      const button = document.createElement("button");
      button.className = "answer-option";
      button.textContent = option;

      button.addEventListener("click", () => {
        grid.querySelectorAll("button").forEach(b =>
          b.classList.remove("chosen"));
        button.classList.add("chosen");
        checkAnswer(index === answer);
      });

      grid.appendChild(button);
    });

    area.appendChild(grid);
  }

  function addInput(area, answer, placeholder = "Введи відповідь...") {
    const wrap = document.createElement("div");
    wrap.className = "answer-input-wrap";

    const input = document.createElement("input");
    input.className = "game-input";
    input.placeholder = placeholder;
    input.autocomplete = "off";

    const button = document.createElement("button");
    button.className = "game-submit";
    button.textContent = "Перевірити";

    const submit = () => {
      checkAnswer(input.value.trim().toLocaleLowerCase("uk") ===
        String(answer).toLocaleLowerCase("uk"));
    };

    button.addEventListener("click", submit);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") submit();
    });

    wrap.append(input, button);
    area.appendChild(wrap);
    input.focus();
  }

  function addOrderGame(area, items, answer) {
    const list = document.createElement("div");
    list.className = "order-list";

    const selected = [];

    items.forEach((item, index) => {
      const button = document.createElement("button");
      button.className = "order-item";
      button.textContent = item;

      button.addEventListener("click", () => {
        if (selected.includes(index)) return;

        selected.push(index);
        button.classList.add("chosen");
        button.innerHTML = `<span>${selected.length}</span>${item}`;

        if (selected.length === items.length) {
          const correct = selected.every((v, i) => v === answer[i]);
          checkAnswer(correct);
        }
      });

      list.appendChild(button);
    });

    area.appendChild(list);

    const reset = document.createElement("button");
    reset.className = "game-reset";
    reset.textContent = "Почати заново";
    reset.addEventListener("click", () => renderTask(tasks[state.current]));
    area.appendChild(reset);
  }

  function addMemoryGame(area, cards) {
    const grid = document.createElement("div");
    grid.className = "memory-grid";

    const shuffled = cards.map((value, index) => ({ value, index }));
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const opened = [];
    let matches = 0;
    let locked = false;

    shuffled.forEach((card, index) => {
      const button = document.createElement("button");
      button.className = "memory-card";
      button.textContent = "?";

      button.addEventListener("click", () => {
        if (locked || button.classList.contains("matched") ||
            opened.some(v => v.index === index)) return;

        button.textContent = card.value;
        button.classList.add("flipped");
        opened.push({ index, value: card.value, button });

        if (opened.length === 2) {
          locked = true;

          if (opened[0].value === opened[1].value) {
            opened.forEach(v => v.button.classList.add("matched"));
            matches++;
            opened.length = 0;
            locked = false;

            if (matches === 3) checkAnswer(true);
          } else {
            setTimeout(() => {
              opened.forEach(v => {
                v.button.textContent = "?";
                v.button.classList.remove("flipped");
              });
              opened.length = 0;
              locked = false;
            }, 650);
          }
        }
      });

      grid.appendChild(button);
    });

    area.appendChild(grid);
  }

  function addMatchGame(area, task) {
    const columns = document.createElement("div");
    columns.className = "match-columns";

    const left = document.createElement("div");
    const right = document.createElement("div");
    left.className = right.className = "match-column";

    task.left.forEach((value, index) => {
      const button = document.createElement("button");
      button.className = "match-option";
      button.textContent = value;

      button.addEventListener("click", () => {
        if (state.matched.includes(index)) return;
        state.matchLeft = index;
        left.querySelectorAll("button").forEach(b => b.classList.remove("chosen"));
        button.classList.add("chosen");
      });

      left.appendChild(button);
    });

    const rightOrder = task.right.map((_, i) => i)
      .sort(() => Math.random() - .5);

    rightOrder.forEach(rightIndex => {
      const button = document.createElement("button");
      button.className = "match-option";
      button.textContent = task.right[rightIndex];

      button.addEventListener("click", () => {
        if (state.matchLeft === null) {
          toast("Спочатку обери елемент зліва.");
          return;
        }

        const leftIndex = state.matchLeft;

        if (task.answers[leftIndex] === rightIndex) {
          state.matched.push(leftIndex);
          button.classList.add("matched");
          left.children[leftIndex].classList.add("matched");
          left.children[leftIndex].disabled = true;
          button.disabled = true;
        } else {
          button.classList.add("wrong");
          setTimeout(() => button.classList.remove("wrong"), 450);
        }

        state.matchLeft = null;
        left.querySelectorAll("button").forEach(b => b.classList.remove("chosen"));

        if (state.matched.length === task.left.length)
          checkAnswer(true);
      });

      right.appendChild(button);
    });

    columns.append(left, right);
    area.appendChild(columns);
  }

  function renderTask(task) {
    const area = gameArea();

    switch (task.type) {
      case "choice":
      case "odd":
      case "pattern":
      case "truth":
      case "riddle":
      case "direction":
      case "category":
      case "logic":
        addQuestion(area, task.question);
        addOptions(area, task.options, task.answer);
        break;

      case "math":
        addQuestion(area, task.question);
        addInput(area, task.answer);
        break;

      case "word":
        addQuestion(area, task.question);
        const letters = document.createElement("div");
        letters.className = "scrambled-word";
        letters.textContent = task.scrambled;
        area.appendChild(letters);
        addInput(area, task.answer, "Введи слово...");
        break;

      case "order":
      case "sequence":
        addQuestion(area, task.type === "order" ?
          "З якого кроку потрібно почати?" :
          "Вибери числа в правильному порядку.");
        addOrderGame(area, task.items, task.answer);
        break;

      case "memory":
        addQuestion(area, "Знайди три однакові пари.");
        addMemoryGame(area, task.cards);
        break;

      case "match":
        addQuestion(area, "З'єднай кожен елемент із відповіддю.");
        addMatchGame(area, task);
        break;

      case "count":
        addQuestion(area, task.question);
        const symbols = document.createElement("div");
        symbols.className = "count-symbols";
        symbols.textContent = task.symbols;
        area.appendChild(symbols);
        addOptions(area, task.options, task.answer);
        break;
    }

    const feedback = document.createElement("p");
    feedback.id = "game-feedback";
    feedback.className = "game-feedback";
    area.appendChild(feedback);
  }

  // ---------- ANSWER HANDLING ----------

  function checkAnswer(correct) {
    if (state.completed) return;

    if (!correct) {
      const feedback = $("#game-feedback");
      if (feedback) {
        feedback.textContent = "Не зовсім! Спробуй ще раз.";
        feedback.className = "game-feedback incorrect";
      }
      toast("Спробуй ще раз!");
      return;
    }

    state.completed = true;

    const feedback = $("#game-feedback");
    if (feedback) {
      feedback.textContent = "Правильно! Чудова робота.";
      feedback.className = "game-feedback correct";
    }

    $("#puzzle-status").textContent = "Завдання виконано!";
    celebrate();

    setTimeout(() => {
      state.current++;
      state.completed = false;

      revealMosaicPiece();
      updateHeader();

      if (state.current >= 15) {
        finishAllTasks();
      } else {
        showPuzzle();
        toast(`Чудово! Завдання ${state.current} із 15 завершено.`);
      }
    }, 1250);
  }

  function finishAllTasks() {
    $("#progress-fraction").textContent = "15 / 15";
    $("#progress-fill").style.width = "100%";
    $("#progress-description").textContent = "Усі завдання завершено!";
    $("#header-progress-fill").style.width = "100%";

    celebrate();

    setTimeout(() => {
      showScreen("complete-screen");
      $(".complete-card h1").textContent = "Усі 15 виконано!";
      $(".complete-card p").textContent =
        "Ти пройшла всі завдання. Час подивитися на результат.";
    }, 1100);
  }

  // ---------- TUTORIAL ----------

  function updateTutorial(task) {
    $("#tutorial-title").textContent = task.title;

    const steps = $(".tutorial-steps");
    steps.innerHTML = `
      <div class="tutorial-step">
        <span>01</span>
        <div><strong>Прочитай завдання</strong>
          <p>${task.instruction}</p>
        </div>
      </div>
      <div class="tutorial-step">
        <span>02</span>
        <div><strong>Подивись на приклад</strong>
          <p>${task.example}</p>
        </div>
      </div>
      <div class="tutorial-step">
        <span>03</span>
        <div><strong>Виконай завдання</strong>
          <p>Коли відповідь буде правильною, відкриється наступний етап.</p>
        </div>
      </div>
    `;

    const example = $(".example-wrap");
    example.innerHTML = `
      <div class="example-caption">ПРИКЛАД</div>
      <p>${task.example}</p>
    `;
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

  // ---------- FINAL GALLERY ----------

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

  // ---------- EVENTS ----------

  $("#show-tutorial").addEventListener("click", openTutorial);
  $("#close-tutorial").addEventListener("click", closeTutorial);
  $("#tutorial-understood").addEventListener("click", closeTutorial);

  $("#tutorial-modal").addEventListener("click", e => {
    if (e.target === $("#tutorial-modal")) closeTutorial();
  });

  $("#example-button").addEventListener("click", openTutorial);

  $("#reveal-gallery").addEventListener("click", revealGallery);

  $("#back-to-top").addEventListener("click", () => {
    showScreen("intro-screen");
  });

  async function init() {
    renderTitlePuzzle();
    icons();

    state.images = await findImages();

    if (!state.images.length) {
      $("#title-feedback").textContent =
        "Додай зображення до папки Assets (1.jpg, 2.jpg тощо), а потім онови сторінку.";
    }

    updateHeader();
  }

  init();
})();
