(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const screens = ["intro-screen", "countdown-screen", "puzzle-screen", "complete-screen", "gallery-screen"];
  const extensions = ["jpg", "jpeg", "png", "webp", "gif"];
  const MODES = [
    { title: "Обмін частин", subtitle: "Поміняй частини місцями, щоб відновити зображення.", count: "9 ЧАСТИН", icon: "move" },
    { title: "Поверни частини", subtitle: "Натискай на повернуті фрагменти, доки всі вони не стануть рівно.", count: "9 ФРАГМЕНТІВ", icon: "rotate-cw" },
    { title: "Мозаїка", subtitle: "Перетягни кожен фрагмент у відповідну клітинку.", count: "9 ФРАГМЕНТІВ", icon: "puzzle" },
    { title: "П’ятнашки", subtitle: "Пересувай сусідні частини у вільну клітинку, щоб відновити порядок.", count: "8 ЧАСТИН", icon: "grid-3x3" },
    { title: "Склади смужки", subtitle: "Розташуй три горизонтальні смужки у правильному порядку.", count: "3 СМУЖКИ", icon: "rows-3" },
    { title: "Знайди пари", subtitle: "Відкривай картки та знаходь однакові фрагменти.", count: "4 ПАРИ", icon: "copy" }
  ];
  const HOWTO = [
    ["Обери частину", "Натисни на будь-який фрагмент зображення."], ["Поміняй місцями", "Перетягни його на інший або натисни на дві частини по черзі."], ["Перевір порядок", "Кожна частина має опинитися на своєму місці." ]
  ];
  const state = {
    images: [], current: 0, mode: 0, order: [], selected: null,
    titleWords: ["НЕВЕЛИКЕ", "ЗАВДАННЯ", "ДЛЯ ТЕБЕ"], titleOrder: [2, 0, 1],
    titlePlaced: [null, null, null], selectedWord: null, tutorialSeen: false,
    rotations: [], tray: [], slide: [], strips: [], memory: [], memoryOpen: [], memoryMatched: [], locked: false
  };

  function icons() { if (window.lucide) window.lucide.createIcons(); }
  function showScreen(id) { screens.forEach(s => $("#" + s).classList.toggle("active", s === id)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function toast(message) { const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2100); }
  function shuffle(values) { const a = values.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function imageStyle(src, piece, cols = 3, rows = 3) {
    const x = piece % cols, y = Math.floor(piece / cols);
    return `background-image:url("${src}");background-size:${cols * 100}% ${rows * 100}%;background-position:${cols === 1 ? 50 : x * 100 / (cols - 1)}% ${rows === 1 ? 50 : y * 100 / (rows - 1)}%`;
  }
  function updateHeader() {
    const total = state.images.length * MODES.length;
    const done = state.current * MODES.length + state.mode;
    $("#header-progress-fill").style.width = (total ? done / total * 100 : 0) + "%";
    $("#header-progress").textContent = total ? `${Math.min(done, total)} / ${total}` : "Початок";
  }
  async function findImages() {
    const found = [];
    for (let n = 1; n <= 30; n++) {
      let pathFound = null;
      for (const ext of extensions) {
        const path = `Assets/${n}.${ext}`;
        try { const res = await fetch(path, { method: "HEAD", cache: "no-store" }); if (res.ok) { pathFound = path; break; } } catch (_) {}
      }
      if (!pathFound) break;
      found.push({ src: pathFound, number: n });
    }
    return found;
  }

  function renderTitlePuzzle() {
    const slots = $("#title-slots"), bank = $("#word-bank"); slots.innerHTML = ""; bank.innerHTML = "";
    state.titleWords.forEach((_, slotIndex) => {
      const slot = document.createElement("div"); slot.className = "title-slot"; slot.dataset.slot = slotIndex;
      slot.textContent = state.titlePlaced[slotIndex] === null ? "Перетягни сюди" : state.titleWords[state.titlePlaced[slotIndex]];
      if (state.titlePlaced[slotIndex] !== null) slot.classList.add("filled");
      slot.addEventListener("dragover", e => { e.preventDefault(); slot.classList.add("over"); });
      slot.addEventListener("dragleave", () => slot.classList.remove("over"));
      slot.addEventListener("drop", e => { e.preventDefault(); slot.classList.remove("over"); placeTitleWord(Number(e.dataTransfer.getData("text/plain")), slotIndex); });
      slot.addEventListener("click", () => { if (state.selectedWord !== null) placeTitleWord(state.selectedWord, slotIndex); });
      slots.appendChild(slot);
    });
    state.titleOrder.forEach(wordIndex => {
      if (state.titlePlaced.includes(wordIndex)) return;
      const chip = document.createElement("button"); chip.type = "button"; chip.className = "word-chip" + (state.selectedWord === wordIndex ? " selected" : "");
      chip.textContent = state.titleWords[wordIndex]; chip.draggable = true;
      chip.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", String(wordIndex)));
      chip.addEventListener("click", () => { state.selectedWord = state.selectedWord === wordIndex ? null : wordIndex; renderTitlePuzzle(); }); bank.appendChild(chip);
    }); icons();
  }
  function placeTitleWord(wordIndex, slotIndex) {
    if (!Number.isInteger(wordIndex) || state.titlePlaced.includes(wordIndex)) return;
    if (wordIndex !== slotIndex) { $("#title-feedback").textContent = "Не зовсім! Спробуй інше місце — слово повернулося назад."; state.selectedWord = null; renderTitlePuzzle(); return; }
    state.titlePlaced[slotIndex] = wordIndex; state.selectedWord = null; $("#title-feedback").textContent = "Правильно! Так тримати."; renderTitlePuzzle();
    if (state.titlePlaced.every((v, i) => v === i)) setTimeout(finishTitle, 650);
  }
  function finishTitle() {
    const heading = $(".intro-screen .intro-heading"); heading.style.transition = "all .65s cubic-bezier(.2,.8,.2,1)"; heading.style.transform = "translateY(-12px) scale(.94)"; heading.style.opacity = "0";
    setTimeout(() => { $("#header-title").textContent = "НЕВЕЛИКЕ ЗАВДАННЯ ДЛЯ ТЕБЕ"; $("#header-title").classList.add("title-fixed"); showScreen("countdown-screen"); runCountdown(); }, 500);
  }
  function runCountdown() {
    let count = 3; const number = $("#countdown-number"), caption = $("#countdown-caption"); number.textContent = count;
    const interval = setInterval(() => {
      count--;
      if (count > 0) { number.textContent = count; number.style.animation = "none"; void number.offsetWidth; number.style.animation = ""; }
      else { clearInterval(interval); number.textContent = "✓"; caption.textContent = "Час складати перше зображення."; setTimeout(startPuzzles, 700); }
    }, 850);
  }
  function startPuzzles() {
    if (!state.images.length) { showScreen("complete-screen"); $(".complete-card p").textContent = "У папці Assets поки немає зображень. Додай файли й онови сторінку."; return; }
    state.current = 0; state.mode = 0; showPuzzle(); showScreen("puzzle-screen"); if (!state.tutorialSeen) openTutorial();
  }
  function showPuzzle() {
    const meta = MODES[state.mode], img = state.images[state.current]; state.selected = null; state.locked = false;
    $("#puzzle-number").textContent = `${String(state.current + 1).padStart(2, "0")} · ${state.mode + 1}/6`;
    $("#puzzle-counter").textContent = `ЗОБРАЖЕННЯ ${String(state.current + 1).padStart(2, "0")} · ЕТАП ${state.mode + 1}/6`;
    $("#puzzle-heading").textContent = meta.title; $("#puzzle-subtitle").textContent = meta.subtitle; $("#piece-count").textContent = meta.count;
    const total = state.images.length * MODES.length, done = state.current * MODES.length + state.mode;
    $("#progress-fraction").textContent = `${done} / ${total}`; $("#progress-fill").style.width = `${done / total * 100}%`;
    $("#progress-description").textContent = `Зображення ${state.current + 1} з ${state.images.length} · Мінігра ${state.mode + 1} з 6.`;
    $("#puzzle-status").innerHTML = `<i data-lucide="${meta.icon}"></i> ${meta.subtitle}`;
    const board = $("#puzzle-grid"); board.innerHTML = ""; board.className = "puzzle-grid"; board.style.cssText = "";
    const oldTray = $("#piece-tray"); if (oldTray) oldTray.remove();
    if (state.mode === 0) setupSwap(img.src);
    if (state.mode === 1) setupRotate(img.src);
    if (state.mode === 2) setupJigsaw(img.src);
    if (state.mode === 3) setupSliding(img.src);
    if (state.mode === 4) setupStrips(img.src);
    if (state.mode === 5) setupMemory(img.src);
    updateHeader(); icons();
  }
  function makeTile(src, piece, index, cols = 3, rows = 3) {
    const tile = document.createElement("button"); tile.type = "button"; tile.className = "puzzle-tile"; tile.style.cssText = imageStyle(src, piece, cols, rows); tile.dataset.cell = index; tile.dataset.piece = piece; return tile;
  }
  // 1. Original swap-the-pieces puzzle.
  function setupSwap(src) {
    state.order = shuffle([0,1,2,3,4,5,6,7,8]); if (state.order.every((v,i) => v === i)) [state.order[0],state.order[1]] = [state.order[1],state.order[0]];
    state.order.forEach((piece, cell) => {
      const tile = makeTile(src, piece, cell); tile.setAttribute("aria-label", `Фрагмент ${piece + 1}`);
      tile.addEventListener("click", () => selectSwap(cell)); addDragSwap(tile, cell); $("#puzzle-grid").appendChild(tile);
    });
  }
  function addDragSwap(tile, cell) {
    tile.draggable = true; tile.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", String(cell)); e.dataTransfer.effectAllowed = "move"; });
    tile.addEventListener("dragover", e => { e.preventDefault(); tile.classList.add("drag-over"); }); tile.addEventListener("dragleave", () => tile.classList.remove("drag-over"));
    tile.addEventListener("drop", e => { e.preventDefault(); tile.classList.remove("drag-over"); swapAt(Number(e.dataTransfer.getData("text/plain")), cell); });
  }
  function selectSwap(cell) {
    if (state.selected === null) { state.selected = cell; $("#puzzle-grid").children[cell].classList.add("selected"); }
    else if (state.selected === cell) { $("#puzzle-grid").children[cell].classList.remove("selected"); state.selected = null; }
    else swapAt(state.selected, cell);
  }
  function swapAt(a,b) { if (!Number.isInteger(a) || a === b || a < 0 || b < 0) return; [state.order[a],state.order[b]] = [state.order[b],state.order[a]]; state.selected = null; setupSwapRender(); if (state.order.every((v,i) => v === i)) winMode(); }
  function setupSwapRender() { const src = state.images[state.current].src, board = $("#puzzle-grid"); board.innerHTML = ""; state.order.forEach((piece,cell) => { const t=makeTile(src,piece,cell); t.addEventListener("click",()=>selectSwap(cell)); addDragSwap(t,cell); board.appendChild(t); }); }
  // 2. Rotate each correctly-positioned image fragment.
  function setupRotate(src) {
    state.rotations = Array.from({length:9}, () => Math.floor(Math.random()*3)+1);
    state.rotations.forEach((rotation,piece) => { const tile=makeTile(src,piece,piece); tile.style.transform=`rotate(${rotation*90}deg)`; tile.addEventListener("click",()=>{ if(state.locked)return; state.rotations[piece]=(state.rotations[piece]+1)%4; tile.style.transform=`rotate(${state.rotations[piece]*90}deg)`; if(state.rotations.every(v=>v===0)) winMode(); }); $("#puzzle-grid").appendChild(tile); });
  }
  // 3. Drag/click the loose fragments into their matching empty cells.
  function setupJigsaw(src) {
    state.tray = shuffle([0,1,2,3,4,5,6,7,8]); const board=$("#puzzle-grid");
    for(let slot=0;slot<9;slot++){ const target=document.createElement("button"); target.type="button"; target.className="jigsaw-slot"; target.dataset.slot=slot; target.textContent="＋";
      target.addEventListener("dragover",e=>e.preventDefault()); target.addEventListener("drop",e=>{e.preventDefault(); placeJigsaw(Number(e.dataTransfer.getData("text/plain")),slot);});
      target.addEventListener("click",()=>{if(state.selected!==null)placeJigsaw(state.selected,slot);}); board.appendChild(target); }
    const tray=document.createElement("div"); tray.id="piece-tray"; tray.className="piece-tray";
    state.tray.forEach(piece=>{const p=makeTile(src,piece,piece);p.classList.add("tray-piece");p.draggable=true;p.addEventListener("dragstart",e=>e.dataTransfer.setData("text/plain",String(piece)));p.addEventListener("click",()=>{state.selected=state.selected===piece?null:piece;tray.querySelectorAll(".tray-piece").forEach(x=>x.classList.toggle("selected",Number(x.dataset.piece)===state.selected));});tray.appendChild(p);});
    board.parentElement.insertBefore(tray,$(".puzzle-bottom"));
  }
  function placeJigsaw(piece,slot){if(!Number.isInteger(piece)||state.tray[piece]===-1)return; if(piece!==slot){toast("Цей фрагмент не підходить до цієї клітинки.");state.selected=null;$("#piece-tray").querySelectorAll(".selected").forEach(x=>x.classList.remove("selected"));return;} state.tray[piece]=-1;const target=$(`.jigsaw-slot[data-slot="${slot}"]`);target.className="jigsaw-slot filled";target.style.cssText=imageStyle(state.images[state.current].src,piece);target.textContent="";const p=$(`#piece-tray [data-piece="${piece}"]`);if(p)p.remove();state.selected=null;if(state.tray.every(v=>v===-1))winMode();}
  // 4. Classic sliding 8-puzzle, shuffled only through legal moves.
  function setupSliding(src) {
    state.slide=[0,1,2,3,4,5,6,7,8];let blank=8,prev=-1;
    for(let i=0;i<100;i++){const opts=[blank-3,blank+3,...(blank%3?[blank-1]:[]),...(blank%3<2?[blank+1]:[])].filter(v=>v>=0&&v<9&&Math.abs(v-blank)!==2&&v!==prev);const next=opts[Math.floor(Math.random()*opts.length)];[state.slide[blank],state.slide[next]]=[state.slide[next],state.slide[blank]];prev=blank;blank=next;}
    renderSliding(src);
  }
  function renderSliding(src){const board=$("#puzzle-grid");board.innerHTML="";state.slide.forEach((piece,cell)=>{const t=document.createElement("button");t.type="button";t.className=piece===8?"slide-empty":"puzzle-tile";if(piece!==8){t.style.cssText=imageStyle(src,piece);t.addEventListener("click",()=>moveSlide(cell));}board.appendChild(t);});}
  function moveSlide(cell){const blank=state.slide.indexOf(8);if(Math.abs(Math.floor(cell/3)-Math.floor(blank/3))+Math.abs(cell%3-blank%3)!==1)return;[state.slide[cell],state.slide[blank]]=[state.slide[blank],state.slide[cell]];renderSliding(state.images[state.current].src);if(state.slide.every((v,i)=>v===i))winMode();}
  // 5. Reorder the three horizontal strips.
  function setupStrips(src){state.strips=shuffle([0,1,2]);if(state.strips.every((v,i)=>v===i))[state.strips[0],state.strips[1]]=[state.strips[1],state.strips[0]];renderStrips(src);}
  function renderStrips(src){const board=$("#puzzle-grid");board.style.gridTemplateColumns="1fr";board.style.gridTemplateRows="repeat(3,1fr)";board.style.aspectRatio="1.65";state.strips.forEach((piece,cell)=>{const t=makeTile(src,piece,cell,1,3);t.style.backgroundSize="100% 300%";t.style.backgroundPosition=`center ${piece*50}%`;t.style.aspectRatio="auto";t.style.minHeight="65px";t.draggable=true;t.addEventListener("click",()=>selectStrip(cell));t.addEventListener("dragstart",e=>e.dataTransfer.setData("text/plain",String(cell)));t.addEventListener("dragover",e=>e.preventDefault());t.addEventListener("drop",e=>{e.preventDefault();swapStrips(Number(e.dataTransfer.getData("text/plain")),cell);});board.appendChild(t);});}
  function selectStrip(cell){if(state.selected===null){state.selected=cell;$("#puzzle-grid").children[cell].classList.add("selected");}else swapStrips(state.selected,cell);}
  function swapStrips(a,b){if(a===b||!Number.isInteger(a)||!Number.isInteger(b))return;[state.strips[a],state.strips[b]]=[state.strips[b],state.strips[a]];state.selected=null;renderStrips(state.images[state.current].src);if(state.strips.every((v,i)=>v===i))winMode();}
  // 6. Memory: match pairs of identical cropped fragments.
  function setupMemory(src){state.memory=shuffle([0,0,1,1,2,2,3,3]);state.memoryOpen=[];state.memoryMatched=[];const board=$("#puzzle-grid");board.classList.add("memory-grid");board.style.gridTemplateColumns="repeat(4,1fr)";board.style.gridTemplateRows="repeat(2,1fr)";board.style.aspectRatio="1.9";state.memory.forEach((pair,id)=>{const card=document.createElement("button");card.type="button";card.className="memory-card";card.dataset.card=id;card.innerHTML='<span class="memory-back">?</span><span class="memory-face"></span>';const face=card.querySelector(".memory-face");face.style.cssText=imageStyle(src,pair,2,2);card.addEventListener("click",()=>flipMemory(id,card));board.appendChild(card);});}
  function flipMemory(id,card){if(state.locked||state.memoryMatched.includes(id)||state.memoryOpen.includes(id))return;card.classList.add("flipped");state.memoryOpen.push(id);if(state.memoryOpen.length===2){const [a,b]=state.memoryOpen;if(state.memory[a]===state.memory[b]){state.memoryMatched.push(a,b);state.memoryOpen=[];if(state.memoryMatched.length===8)winMode();}else{state.locked=true;setTimeout(()=>{[a,b].forEach(i=>{const el=$(`.memory-card[data-card="${i}"]`);if(el)el.classList.remove("flipped");});state.memoryOpen=[];state.locked=false;},750);}}}

  function winMode(){if(state.locked)return;state.locked=true;$("#puzzle-status").innerHTML='<i data-lucide="check-circle-2"></i> Чудово! Етап завершено.';icons();setTimeout(()=>{state.locked=false;advanceMode();},850);}
  function advanceMode(){if(state.mode<MODES.length-1){state.mode++;showPuzzle();toast(`Готово! Наступна мінігра: ${MODES[state.mode].title.toLowerCase()}.`);openTutorial();return;}state.mode=0;state.current++;if(state.current>=state.images.length){$("#progress-fraction").textContent=`${state.images.length*MODES.length} / ${state.images.length*MODES.length}`;$("#progress-fill").style.width="100%";updateHeader();showScreen("complete-screen");return;}showPuzzle();toast("Зображення пройдено! Переходимо до наступного.");openTutorial();}
  function openTutorial(){const meta=MODES[state.mode];$("#tutorial-title").textContent=`Як грати: ${meta.title.toLowerCase()}`;const steps=HOWTO_BY_MODE[state.mode];$("#tutorial-steps").innerHTML=steps.map((s,i)=>`<div class="tutorial-step"><span>${String(i+1).padStart(2,"0")}</span><div><strong>${s[0]}</strong><p>${s[1]}</p></div></div>`).join("");$("#example-caption").textContent=meta.title.toUpperCase();$("#example-description").textContent=EXAMPLES[state.mode];$("#tutorial-modal").classList.add("open");$("#tutorial-modal").setAttribute("aria-hidden","false");icons();}
  const HOWTO_BY_MODE=[
    [["Обери частину","Натисни на фрагмент, який хочеш перемістити."],["Знайди пару","Натисни на другу частину або перетягни першу на неї."],["Збери порядок","Повторюй, доки всі дев’ять фрагментів не стануть правильно."]],
    [["Подивись на фрагменти","Кожна частина вже стоїть на своєму місці, але повернута."],["Натискай на частину","Кожне натискання повертає її на 90 градусів."],["Вирівняй усі","Потрібно, щоб кожен фрагмент був повернутий правильно."]],
    [["Знайди фрагмент","Усі частини розташовані під полем."],["Перетягни або натисни","Перетягни фрагмент у клітинку. На телефоні спочатку вибери фрагмент, потім клітинку."],["Заповни поле","Якщо фрагмент підходить, він залишиться на місці."]],
    [["Знайди порожню клітинку","Одна клітинка порожня — у неї можна пересувати частини."],["Рухай сусідні частини","Натискай лише на частини поруч із порожнім місцем."],["Віднови порядок","Збери послідовність від першої частини до останньої."]],
    [["Подивись на смужки","Зображення розділене на три горизонтальні частини."],["Поміняй їх місцями","Натисни на дві смужки по черзі або перетягни одну на іншу."],["Склади зверху вниз","Верхня, середня та нижня смужки мають бути у правильному порядку."]],
    [["Відкрий картку","Натисни на будь-яку картку, щоб побачити фрагмент."],["Запам’ятай його","Відкрий іншу картку й шукай такий самий фрагмент."],["Знайди всі пари","Усього потрібно знайти чотири пари однакових фрагментів."]]
  ];
  const EXAMPLES=["Якщо фрагмент 2 стоїть на місці 5, поміняй їх місцями.","Натисни на фрагмент один, два, три або чотири рази, доки він не вирівняється.","Наприклад, фрагмент із верхнього лівого кута має потрапити у верхню ліву клітинку.","Порожнє місце працює як вільна клітинка: пересувати можна тільки сусідню частину.","Смужка з верхнім краєм зображення має бути першою, а з нижнім краєм — останньою.","Дві картки з однаковим візерунком залишаються відкритими. Шукай наступну пару."];
  function closeTutorial(){$("#tutorial-modal").classList.remove("open");$("#tutorial-modal").setAttribute("aria-hidden","true");state.tutorialSeen=true;}
  function revealGallery(){const grid=$("#gallery-grid");grid.innerHTML="";state.images.forEach((image,index)=>{const fig=document.createElement("figure");fig.className="gallery-item";const img=document.createElement("img");img.src=image.src;img.alt=`Зображення ${index+1}`;img.loading="lazy";const cap=document.createElement("figcaption");cap.textContent=`Зображення ${String(index+1).padStart(2,"0")}`;fig.append(img,cap);grid.appendChild(fig);});$("#gallery-total").textContent=`${state.images.length} зображень`;showScreen("gallery-screen");icons();}
  $("#show-tutorial").addEventListener("click",openTutorial);$("#close-tutorial").addEventListener("click",closeTutorial);$("#tutorial-understood").addEventListener("click",closeTutorial);$("#tutorial-modal").addEventListener("click",e=>{if(e.target===$("#tutorial-modal"))closeTutorial();});$("#example-button").addEventListener("click",openTutorial);
  $("#shuffle-button").addEventListener("click",()=>{showPuzzle();toast("Гру перемішано заново.");});$("#reveal-gallery").addEventListener("click",revealGallery);$("#back-to-top").addEventListener("click",()=>showScreen("intro-screen"));
  async function init(){renderTitlePuzzle();icons();state.images=await findImages();if(!state.images.length){$("#title-feedback").textContent="Спочатку додай зображення до папки Assets (наприклад, 1.jpg, 2.png), а потім онови сторінку.";$("#puzzle-subtitle").textContent="У папці Assets поки не знайдено зображень.";}updateHeader();}
  init();
})();
