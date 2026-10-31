
/* =========================================
   GALLERY OF YARINKO
   Main game engine
========================================= */

const MAX_IMAGES = 30;
const ASSET_FOLDER = "Assets/";

const EXTENSIONS = [
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif"
];

let images = [];
let currentLevel = 0;
let completed = [];

let selectedPiece = null;
let puzzleState = [];
let memoryState = [];
let memoryFirst = null;
let memoryLocked = false;
let sequenceCode = [];

/* =========================================
   DOM HELPERS
========================================= */

const $ = id => document.getElementById(id);

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    $(id).classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function setStatus(text) {
    $("system-status").textContent = text;
}

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [
            result[j],
            result[i]
        ];
    }

    return result;
}

function pad(number) {
    return String(number).padStart(3, "0");
}

function updateProgress() {
    const total = images.length;
    const done = completed.length;

    const percentage = total
        ? (done / total) * 100
        : 0;

    $("menu-progress").textContent =
        `${done} / ${total}`;

    $("menu-progress-bar").style.width =
        percentage + "%";
}

/* =========================================
   IMAGE DETECTION
========================================= */

function checkImage(path) {
    return new Promise(resolve => {
        const image = new Image();

        image.onload = () => {
            resolve({
                src: path,
                width: image.naturalWidth,
                height: image.naturalHeight
            });
        };

        image.onerror = () => resolve(null);

        image.src = path;
    });
}

async function detectImages() {
    const found = [];

    for (let number = 1; number <= MAX_IMAGES; number++) {

        let foundImage = null;

        for (const extension of EXTENSIONS) {

            const path =
                `${ASSET_FOLDER}${number}.${extension}`;

            const result = await checkImage(path);

            if (result) {
                foundImage = {
                    ...result,
                    number
                };

                break;
            }
        }

        // Stop at the first missing number.
        if (!foundImage) break;

        found.push(foundImage);
    }

    return found;
}

/* =========================================
   COUNTDOWN
========================================= */

function startCountdown() {
    let time = 5;

    $("countdown").textContent = "05";

    const timer = setInterval(() => {
        time--;

        $("countdown").textContent =
            String(time).padStart(2, "0");

        $("loading-progress").style.width =
            ((5 - time) / 5 * 100) + "%";

        if (time <= 0) {
            clearInterval(timer);

            initializeArchive();
        }

    }, 1000);
}

/* =========================================
   INITIALIZATION
========================================= */

async function initializeArchive() {
    setStatus("СКАНУВАННЯ ФАЙЛІВ");

    images = await detectImages();

    if (images.length === 0) {
        showScreen("error-screen");
        setStatus("ПОМИЛКА");
        return;
    }

    completed = [];

    $("total-levels").textContent =
        String(images.length).padStart(2, "0");

    $("final-count").textContent =
        String(images.length).padStart(2, "0");

    updateProgress();

    setStatus("АРХІВ ДОСТУПНИЙ");

    showScreen("menu-screen");
}

/* =========================================
   LEVEL MANAGEMENT
========================================= */

function startLevel() {
    currentLevel = 0;
    completed = [];

    updateProgress();

    showTutorial();
}

function showTutorial() {

    const image = images[currentLevel];

    const level = currentLevel + 1;

    const mode = (level - 1) % 3;

    const modes = [

        {
            name: "ЗБІР ФРАГМЕНТІВ",
            icon: "▦",
            heading: "Зберіть правильну послідовність",
            description:
                "Перед вами закриті фрагменти. Розташуйте їх у правильному порядку, використовуючи позначення.",
            example:
                ["03", "01", "02"],
            steps: [
                "Натисніть на потрібний фрагмент.",
                "Оберіть відповідну позицію на полі.",
                "Повторіть дію, доки всі позиції не будуть заповнені."
            ]
        },

        {
            name: "МЕМОРІЯ",
            icon: "◈",
            heading: "Знайдіть однакові символи",
            description:
                "Перед вами картки з прихованими символами. Відкривайте їх по дві та знаходьте однакові пари.",
            example:
                ["◆", "●", "●", "◆"],
            steps: [
                "Натисніть на першу картку.",
                "Відкрийте другу картку.",
                "Знайдіть усі однакові пари."
            ]
        },

        {
            name: "КОД ДОСТУПУ",
            icon: "⌘",
            heading: "Відновіть секретний код",
            description:
                "Система покаже послідовність чисел. Запам'ятайте її та введіть у правильному порядку.",
            example:
                ["04", "01", "03", "02"],
            steps: [
                "Уважно подивіться на послідовність.",
                "Запам'ятайте порядок чисел.",
                "Введіть код та підтвердьте його."
            ]
        }

    ];

    const data = modes[mode];

    $("tutorial-title").textContent =
        `ФРАГМЕНТ ${pad(level)}`;

    $("tutorial-counter").textContent =
        `${String(level).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`;

    $("tutorial-icon").textContent = data.icon;

    $("tutorial-heading").textContent =
        data.heading;

    $("tutorial-description").textContent =
        data.description;

    $("tutorial-example").innerHTML = `
        <div class="example-visual">
            ${data.example.map(item => `
                <div class="example-tile">${item}</div>
            `).join("")}
        </div>
    `;

    $("tutorial-steps").innerHTML =
        data.steps.map((step, index) => `
            <div class="tutorial-step">
                <strong>0${index + 1}</strong>
                <span>${step}</span>
            </div>
        `).join("");

    $("tutorial-start").onclick = startGame;

    showScreen("tutorial-screen");
}

/* =========================================
   GAME INITIALIZATION
========================================= */

function startGame() {

    const mode = currentLevel % 3;

    selectedPiece = null;

    $("game-title").textContent =
        `ФРАГМЕНТ ${pad(currentLevel + 1)}`;

    $("game-counter").textContent =
        `${String(currentLevel + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`;

    $("game-feedback").textContent =
        "ОЧІКУВАННЯ...";

    $("game-progress-bar").style.width = "0%";

    $("game-progress-text").textContent = "0%";

    if (mode === 0) {
        $("game-type").textContent =
            "ЗБІР ФРАГМЕНТІВ";

        $("game-description").textContent =
            "Оберіть фрагмент, а потім його позицію.";

        createPuzzle();
    }

    if (mode === 1) {
        $("game-type").textContent =
            "МЕМОРІЯ";

        $("game-description").textContent =
            "Знайдіть усі однакові пари символів.";

        createMemoryGame();
    }

    if (mode === 2) {
        $("game-type").textContent =
            "КОД ДОСТУПУ";

        $("game-description").textContent =
            "Запам'ятайте послідовність та введіть її.";

        createSequenceGame();
    }

    setStatus("ВІДНОВЛЕННЯ АКТИВНЕ");

    showScreen("game-screen");
}

/* =========================================
   GAME 1: PUZZLE
========================================= */

function createPuzzle() {

    const area = $("game-area");

    const size = 3;

    const total = size * size;

    puzzleState = Array(total).fill(null);

    const pieces = shuffle(
        Array.from({ length: total }, (_, i) => i + 1)
    );

    area.innerHTML = `
        <div class="puzzle-board" id="puzzle-board">
            ${Array.from({ length: total }, (_, i) => `
                <button
                    class="puzzle-slot"
                    data-slot="${i + 1}"
                >
                    ?
                </button>
            `).join("")}
        </div>

        <div class="puzzle-pieces" id="puzzle-pieces">
            ${pieces.map(piece => `
                <button
                    class="puzzle-piece"
                    data-piece="${piece}"
                >
                    ФРАГМЕНТ ${String(piece).padStart(2, "0")}
                </button>
            `).join("")}
        </div>
    `;

    document.querySelectorAll(".puzzle-piece")
        .forEach(button => {

            button.addEventListener("click", () => {

                if (button.classList.contains("used")) {
                    return;
                }

                document.querySelectorAll(".puzzle-piece")
                    .forEach(p => p.classList.remove("selected"));

                button.classList.add("selected");

                selectedPiece = Number(
                    button.dataset.piece
                );

            });

        });

    document.querySelectorAll(".puzzle-slot")
        .forEach(slot => {

            slot.addEventListener("click", () => {

                if (selectedPiece === null) return;

                const index =
                    Number(slot.dataset.slot) - 1;

                // Clicking an occupied position removes it.
                if (puzzleState[index] !== null) {

                    const previous =
                        puzzleState[index];

                    puzzleState[index] = null;

                    document.querySelector(
                        `[data-piece="${previous}"]`
                    ).classList.remove("used");

                    slot.textContent = "?";
                    slot.classList.remove("filled");

                    updatePuzzleProgress();

                    return;
                }

                puzzleState[index] = selectedPiece;

                slot.textContent = "✓";

                slot.classList.add("filled");

                document.querySelector(
                    `[data-piece="${selectedPiece}"]`
                ).classList.add("used");

                selectedPiece = null;

                document.querySelectorAll(".puzzle-piece")
                    .forEach(p => p.classList.remove("selected"));

                updatePuzzleProgress();

                checkPuzzle();
            });

        });
}

function updatePuzzleProgress() {

    const filled =
        puzzleState.filter(value => value !== null).length;

    const percentage =
        Math.round(filled / 9 * 100);

    $("game-progress-bar").style.width =
        percentage + "%";

    $("game-progress-text").textContent =
        percentage + "%";
}

function checkPuzzle() {

    if (puzzleState.some(value => value === null)) {
        return;
    }

    const correct = puzzleState.every(
        (value, index) => value === index + 1
    );

    if (correct) {

        $("game-feedback").textContent =
            "УСІ ФРАГМЕНТИ НА МІСЦІ.";

        setTimeout(completeLevel, 700);

    } else {

        $("game-feedback").textContent =
            "ПОСЛІДОВНІСТЬ НЕПРАВИЛЬНА. СПРОБУЙТЕ ЩЕ РАЗ.";

    }
}

/* =========================================
   GAME 2: MEMORY
========================================= */

function createMemoryGame() {

    const area = $("game-area");

    const symbols = [
        "◆", "●", "▲", "■",
        "◇", "○", "△", "□"
    ];

    const cards = shuffle([
        ...symbols,
        ...symbols
    ]);

    memoryState = cards.map((symbol, index) => ({
        symbol,
        index,
        matched: false
    }));

    memoryFirst = null;
    memoryLocked = false;

    let matches = 0;

    area.innerHTML = `
        <div class="memory-board">
            ${cards.map((symbol, index) => `
                <button
                    class="memory-card"
                    data-index="${index}"
                >
                    ?
                </button>
            `).join("")}
        </div>
    `;

    const buttons =
        document.querySelectorAll(".memory-card");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            if (memoryLocked) return;

            const index =
                Number(button.dataset.index);

            const card = memoryState[index];

            if (card.matched ||
                button.classList.contains("open")) {
                return;
            }

            button.textContent = card.symbol;

            button.classList.add("open");

            if (memoryFirst === null) {

                memoryFirst = index;

                return;
            }

            const first =
                memoryState[memoryFirst];

            const second = card;

            if (first.symbol === second.symbol) {

                first.matched = true;
                second.matched = true;

                buttons[memoryFirst]
                    .classList.add("matched");

                button.classList.add("matched");

                matches++;

                memoryFirst = null;

                updateMemoryProgress(matches);

                if (matches === 8) {

                    $("game-feedback").textContent =
                        "УСІ ПАРИ ЗНАЙДЕНО.";

                    setTimeout(completeLevel, 700);
                }

            } else {

                memoryLocked = true;

                const previous = memoryFirst;

                memoryFirst = null;

                setTimeout(() => {

                    buttons[previous].textContent = "?";
                    button.textContent = "?";

                    buttons[previous]
                        .classList.remove("open");

                    button.classList.remove("open");

                    memoryLocked = false;

                }, 850);

            }

        });

    });
}

function updateMemoryProgress(matches) {

    const percentage =
        Math.round(matches / 8 * 100);

    $("game-progress-bar").style.width =
        percentage + "%";

    $("game-progress-text").textContent =
        percentage + "%";
}

/* =========================================
   GAME 3: SECRET SEQUENCE
========================================= */

function createSequenceGame() {

    const area = $("game-area");

    const length = 4;

    sequenceCode = Array.from(
        { length },
        () => Math.floor(Math.random() * 9) + 1
    );

    area.innerHTML = `
        <div class="sequence-display" id="sequence-display">
            ${sequenceCode.map(number => `
                <div class="sequence-number">
                    ${number}
                </div>
            `).join("")}
        </div>

        <p class="muted" style="text-align:center;margin:20px 0">
            ЗАПАМ'ЯТАЙТЕ ЧИСЛА. ВОНИ ЗНИКНУТЬ ЧЕРЕЗ 4 СЕКУНДИ.
        </p>

        <input
            id="sequence-input"
            class="sequence-input"
            placeholder="Введіть 4 цифри..."
            maxlength="4"
            inputmode="numeric"
        >

        <button
            id="sequence-submit"
            class="primary-button"
        >
            ПІДТВЕРДИТИ КОД →
        </button>
    `;

    const display = $("sequence-display");

    const input = $("sequence-input");

    const submit = $("sequence-submit");

    submit.disabled = true;
    submit.style.opacity = ".4";

    let visible = true;

    const timer = setTimeout(() => {

        visible = false;

        display.innerHTML = `
            <div class="sequence-number">?</div>
            <div class="sequence-number">?</div>
            <div class="sequence-number">?</div>
            <div class="sequence-number">?</div>
        `;

        input.disabled = false;

        submit.disabled = false;
        submit.style.opacity = "1";

        $("game-feedback").textContent =
            "ВВЕДІТЬ ЗАПАМ'ЯТОВАНУ ПОСЛІДОВНІСТЬ.";

    }, 4000);

    input.disabled = true;

    input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "");
    });

    submit.addEventListener("click", () => {

        if (visible) return;

        const answer = input.value;

        const correct =
            sequenceCode.join("");

        if (answer === correct) {

            $("game-progress-bar").style.width = "100%";

            $("game-progress-text").textContent = "100%";

            $("game-feedback").textContent =
                "КОД ПІДТВЕРДЖЕНО.";

            clearTimeout(timer);

            setTimeout(completeLevel, 700);

        } else {

            $("game-feedback").textContent =
                "НЕПРАВИЛЬНИЙ КОД. СПРОБУЙТЕ ЩЕ РАЗ.";

            input.value = "";

        }

    });
}

/* =========================================
   LEVEL COMPLETION
========================================= */

function completeLevel() {

    if (completed.includes(currentLevel)) return;

    completed.push(currentLevel);

    updateProgress();

    const image = images[currentLevel];

    $("revealed-image").src = image.src;

    $("reveal-title").textContent =
        `YARINKO_${pad(currentLevel + 1)}`;

    $("reveal-progress").textContent =
        `${completed.length} / ${images.length}`;

    $("next-button").textContent =
        currentLevel === images.length - 1
            ? "ВІДКРИТИ ПОВНИЙ АРХІВ →"
            : "НАСТУПНИЙ ФРАГМЕНТ →";

    setStatus("ФАЙЛ ВІДНОВЛЕНО");

    showScreen("reveal-screen");
}

/* =========================================
   NEXT LEVEL
========================================= */

function nextLevel() {

    if (currentLevel >= images.length - 1) {

        showFinalGallery();

        return;
    }

    currentLevel++;

    showTutorial();
}

/* =========================================
   FINAL GALLERY
========================================= */

function showFinalGallery() {

    setStatus("ПОВНИЙ ДОСТУП");

    $("final-count").textContent =
        String(images.length).padStart(2, "0");

    $("final-gallery").innerHTML =
        images.map((image, index) => `
            <div class="gallery-item">
                <img
                    src="${image.src}"
                    alt="Yarinko ${index + 1}"
                    loading="lazy"
                >

                <div class="gallery-item-label">
                    YARINKO_${pad(index + 1)}
                    / VERIFIED
                </div>
            </div>
        `).join("");

    showScreen("final-screen");
}

/* =========================================
   BUTTONS
========================================= */

$("start-button").addEventListener(
    "click",
    startLevel
);

$("next-button").addEventListener(
    "click",
    nextLevel
);

$("restart-button").addEventListener(
    "click",
    () => {

        currentLevel = 0;

        completed = [];

        updateProgress();

        setStatus("АРХІВ ПЕРЕЗАПУЩЕНО");

        showScreen("menu-screen");

    }
);

/* =========================================
   START APPLICATION
========================================= */

startCountdown();
