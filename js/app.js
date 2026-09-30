(function () {
  const data = window.BRIEF;
  const KEY = "the-brief-week6-v1";
  const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const ranks = [
    { xp: 0, name: "Clerk" },
    { xp: 80, name: "Reader" },
    { xp: 200, name: "Seminar regular" },
    { xp: 400, name: "Cross-examiner" },
    { xp: 700, name: "The Brief" }
  ];

  const state = {
    view: "home",
    reviewId: "franke",
    setup: { reading: "all", count: 10 },
    play: null,
    results: null
  };

  let progress = load();

  function fresh() {
    return { xp: 0, streak: 0, lastDay: null, status: {}, read: {}, bestPct: 0, rounds: 0 };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!saved || typeof saved !== "object") return fresh();
      return Object.assign(fresh(), saved, {
        status: saved.status || {},
        read: saved.read || {}
      });
    } catch (error) {
      return fresh();
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(progress));
  }

  function dayKey(date) {
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  }

  function touchStreak() {
    const today = dayKey(new Date());
    if (progress.lastDay === today) return;
    const previous = new Date();
    previous.setDate(previous.getDate() - 1);
    progress.streak = progress.lastDay === dayKey(previous) ? progress.streak + 1 : 1;
    progress.lastDay = today;
  }

  function rankInfo() {
    let current = ranks[0];
    let next = ranks[1];
    ranks.forEach((rank, index) => {
      if (progress.xp >= rank.xp) {
        current = rank;
        next = ranks[index + 1] || null;
      }
    });
    const pct = next ? Math.round(((progress.xp - current.xp) / (next.xp - current.xp)) * 100) : 100;
    return { current, next, pct };
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const hold = copy[i];
      copy[i] = copy[j];
      copy[j] = hold;
    }
    return copy;
  }

  function questionById(id) {
    return data.questions.find((question) => question.id === id);
  }

  function readingOf(id) {
    return data.readings.find((reading) => reading.id === id);
  }

  function poolFor(reading, missedOnly) {
    return data.questions.filter((question) => {
      if (missedOnly && progress.status[question.id] !== "wrong") return false;
      if (!reading || reading === "all") return true;
      return question.reading === reading;
    });
  }

  function mastery(readingId) {
    const items = data.questions.filter((question) => question.reading === readingId);
    const known = items.filter((question) => progress.status[question.id] === "right").length;
    return { known, total: items.length, pct: items.length ? Math.round((known / items.length) * 100) : 0 };
  }

  function sectionCleared(section) {
    return section.questionIds.every((id) => progress.status[id] === "right");
  }

  function firstOpenSection() {
    const index = data.sections.findIndex((section) => !sectionCleared(section));
    return index === -1 ? 0 : index;
  }

  function themeLabel() {
    return themeQuery.matches ? "Dark" : "Light";
  }

  function syncThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = themeQuery.matches ? "#101412" : "#f6f1e8";
    const label = document.querySelector("[data-theme-label]");
    if (label) label.textContent = themeLabel();
  }

  function missedCount() {
    return data.questions.filter((question) => progress.status[question.id] === "wrong").length;
  }

  function render() {
    document.getElementById("app").innerHTML = shell(view());
    window.scrollTo(0, 0);
    const focus = document.querySelector("[data-focus]");
    if (focus) focus.focus();
  }

  function shell(content) {
    const rank = rankInfo();
    return `
      <header class="top">
        <div class="wrap top-inner">
          <button class="brand" data-action="home">
            <span class="mark">W6</span>
            <span><strong>The Brief</strong><span>Crime and justice</span></span>
          </button>
          <div class="stats">
            <span class="pill">${progress.streak} day streak</span>
            <span class="pill">${progress.xp} xp · ${esc(rank.current.name)}</span>
            <span class="pill" data-theme-label>${themeLabel()}</span>
          </div>
        </div>
      </header>
      <main id="main" class="wrap">${content}</main>`;
  }

  function view() {
    if (state.view === "review") return viewReview();
    if (state.view === "setup") return viewSetup();
    if (state.view === "play") return viewPlay();
    if (state.view === "results") return viewResults();
    return viewHome();
  }

  function viewHome() {
    const rank = rankInfo();
    const nextText = rank.next ? `${rank.pct}% of the way to ${rank.next.name}` : "Top rank";
    const continueIndex = firstOpenSection();
    const pathDone = data.sections.every(sectionCleared);
    return `
      <section class="hero">
        <p class="kicker">Week 6 · 5 October</p>
        <h1>Get the crime readings ready for seminar.</h1>
        <p class="lede">Read the arguments, drill them, or take a passage and answer before you move on. Your place, score, and streak stay on this computer.</p>
      </section>
      <div class="modes">
        <button class="mode" data-action="review">
          <em>Review</em><strong>Read</strong>
          <span>The three arguments, plus how they fit.</span><b>Open the brief</b>
        </button>
        <button class="mode" data-action="setup">
          <em>Quiz</em><strong>Drill</strong>
          <span>Short rounds with a ruling on every answer.</span><b>Take the bench</b>
        </button>
        <button class="mode" data-action="hybrid" data-index="${continueIndex}">
          <em>Hybrid</em><strong>Passage</strong>
          <span>${pathDone ? "You have cleared the path. Run it again." : "Read a few paragraphs, then rule on them."}</span>
          <b>${pathDone ? "Restart the path" : "Continue passage " + (continueIndex + 1)}</b>
        </button>
      </div>
      <div class="grid-2">
        <section class="card">
          <h2>Mastery</h2>
          ${data.readings.map((reading) => {
            const score = mastery(reading.id);
            return `<div class="meter"><header><span>${esc(reading.label)}</span><span>${score.known}/${score.total}</span></header><div class="bar"><span style="width:${score.pct}%"></span></div></div>`;
          }).join("")}
          <div class="actions">
            <button class="primary" data-action="quick">Quick 5</button>
            ${missedCount() ? `<button class="ghost hot" data-action="missed">Retry ${missedCount()} missed</button>` : ""}
          </div>
        </section>
        <section class="card">
          <h2>${esc(rank.current.name)}</h2>
          <div class="rank-line"><span>${progress.xp} xp</span><span>${esc(nextText)}</span></div>
          <div class="rank-bar"><span style="width:${rank.pct}%"></span></div>
          <p class="muted">Best quiz round: ${progress.bestPct}%. Rounds finished: ${progress.rounds}.</p>
          <p class="muted">A correct answer is 10 xp, plus 5 when your combo reaches 3. Marking a reading done the first time is 20 xp.</p>
        </section>
      </div>
      <section class="card" style="margin-top:14px">
        <h2>The path</h2>
        <div class="trail">
          ${data.sections.map((section, index) => {
            const done = sectionCleared(section);
            const now = !done && index === continueIndex;
            return `<button class="node${done ? " done" : ""}${now ? " now" : ""}" data-action="hybrid" data-index="${index}"><strong>${index + 1}</strong><br>${esc(section.title)}</button>`;
          }).join("")}
        </div>
      </section>
      <p class="foot">Built from Franke (1994), Baerveldt, Bunkers, De Winter, and Kooistra (1998), and SCP, <em>Facts and Figures of the Netherlands</em> (2008), chapter 11. Appearance follows your system and switches with it. <button class="text-btn" data-action="reset">Reset progress</button></p>`;
  }

  function viewReview() {
    const review = data.reviews.find((item) => item.id === state.reviewId) || data.reviews[0];
    const done = progress.read[review.id];
    return `
      <p class="kicker">${esc(review.kicker)}</p>
      <div class="tabs">
        ${data.reviews.map((item) => `<button class="tab" data-action="tab" data-id="${item.id}" ${item.id === review.id ? 'aria-current="page"' : ""}>${esc(readingOf(item.id).label)}</button>`).join("")}
      </div>
      <article class="prose">
        <h2>${esc(review.title)}</h2>
        <p class="muted">${esc(review.cite)}</p>
        ${review.html}
      </article>
      <div class="actions">
        <button class="primary" data-action="mark-read" data-id="${review.id}" ${done ? "disabled" : ""}>${done ? "Marked as read" : "Mark as read · 20 xp"}</button>
        <button class="ghost" data-action="setup" data-reading="${review.id === "synthesis" ? "synthesis" : review.id}">Quiz this reading</button>
      </div>`;
  }

  function viewSetup() {
    const pool = poolFor(state.setup.reading, false);
    const sizes = [5, 10].filter((size) => size < pool.length);
    if (!sizes.includes(state.setup.count) && state.setup.count !== pool.length) state.setup.count = sizes.includes(10) ? 10 : pool.length;
    return `
      <section class="setup">
        <p class="kicker">Quiz</p>
        <h1>Choose a docket.</h1>
        <p class="lede">${pool.length} questions in this set. Keys 1 to 4 answer. Enter moves on.</p>
        <div class="chips">
          ${[["all", "All"], ["franke", "Franke"], ["baerveldt", "Baerveldt"], ["scp", "SCP"], ["synthesis", "Across"]].map(([id, label]) => `<button class="chip" data-action="pick-reading" data-id="${id}" aria-pressed="${state.setup.reading === id}">${label}</button>`).join("")}
        </div>
        <div class="chips">
          ${sizes.map((size) => `<button class="chip" data-action="pick-count" data-count="${size}" aria-pressed="${state.setup.count === size}">${size} questions</button>`).join("")}
          <button class="chip" data-action="pick-count" data-count="${pool.length}" aria-pressed="${state.setup.count === pool.length}">All ${pool.length}</button>
        </div>
        <button class="primary" data-action="start-quiz">Start</button>
      </section>`;
  }

  function viewPlay() {
    const play = state.play;
    if (play.phase === "read") {
      const section = data.sections[play.sectionIndex];
      return `
        <p class="kicker">Hybrid · ${play.sectionIndex + 1} of ${data.sections.length} · ${esc(section.kicker)}</p>
        <article class="prose">
          <h2>${esc(section.title)}</h2>
          ${section.html}
        </article>
        <div class="actions">
          <button class="primary" data-action="probe">Answer ${section.questionIds.length} questions</button>
          <button class="ghost" data-action="home">Save and leave</button>
        </div>`;
    }
    if (play.phase === "cleared") {
      const section = data.sections[play.sectionIndex];
      const last = play.sectionIndex === data.sections.length - 1;
      return `
        <section class="results">
          <p class="verdict good">Passage clear</p>
          <h1>${esc(section.title)}</h1>
          <p class="lede">${play.sectionCorrect} of ${play.sectionTotal} on this passage. Combo ${play.combo}.</p>
          <div class="actions">
            <button class="primary" data-action="${last ? "finish-hybrid" : "next-section"}">${last ? "See the whole path" : "Next passage"}</button>
            <button class="ghost" data-action="home">Leave for now</button>
          </div>
        </section>`;
    }
    const question = questionById(play.ids[play.index]);
    const width = Math.round(((play.index + (play.locked ? 1 : 0)) / play.ids.length) * 100);
    const source = readingOf(question.reading);
    const place = play.mode === "hybrid"
      ? `Passage ${play.sectionIndex + 1} of ${data.sections.length} · Question ${play.index + 1} of ${play.ids.length}`
      : `${esc(source.label)} · ${play.index + 1} of ${play.ids.length}`;
    return `
      <p class="kicker">${place}${play.combo > 1 ? ` · <span class="combo">Combo ${play.combo}</span>` : ""}</p>
      <div class="progress-top"><span style="width:${width}%"></span></div>
      <section class="question">
        <h1 tabindex="-1" data-focus>${esc(question.prompt)}</h1>
        <div class="choices">
          ${play.choices.map((choice, index) => {
            let cls = "choice";
            if (play.locked && choice.correct) cls += " correct";
            if (play.locked && play.picked === index && !choice.correct) cls += " wrong";
            return `<button class="${cls}" data-action="answer" data-index="${index}" ${play.locked ? "disabled" : ""}><span class="key">${index + 1}</span><span>${esc(choice.text)}</span></button>`;
          }).join("")}
        </div>
        ${play.locked ? `<div class="explain"><p class="verdict ${play.choices[play.picked].correct ? "good" : "bad"}">${play.choices[play.picked].correct ? "Sustained" : "Overruled"}</p><p>${esc(question.explain)}</p></div><button class="primary" data-action="next">${play.index + 1 === play.ids.length ? "Result" : "Next"}</button>` : `<p class="muted">Press 1–4 to answer.</p>`}
      </section>`;
  }

  function viewResults() {
    const result = state.results;
    const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
    return `
      <section class="results">
        <div class="score-ring" style="--p:${pct}"><span>${pct}%</span></div>
        <h1>${result.correct} of ${result.total} sustained.</h1>
        <p class="lede">${result.gained} xp this sitting. Best combo ${result.bestCombo}. ${pct === 100 ? "Clean sweep." : "The overruled ones are listed below."}</p>
        ${result.misses.length ? `<ul class="miss-list">${result.misses.map((miss) => `<li><strong>${esc(miss.prompt)}</strong><br>Right answer: ${esc(miss.answer)}<br><span class="muted">${esc(miss.explain)}</span></li>`).join("")}</ul>` : ""}
        <div class="actions">
          ${result.misses.length ? `<button class="primary" data-action="retry-listed">Retry these</button>` : ""}
          <button class="ghost" data-action="setup">Another round</button>
          <button class="ghost" data-action="home">Back to the desk</button>
        </div>
      </section>`;
  }

  function deal(ids) {
    const question = questionById(ids[state.play.index]);
    state.play.ids = ids;
    state.play.choices = shuffle(question.choices.map((text, index) => ({ text, correct: index === question.answer })));
    state.play.locked = false;
    state.play.picked = null;
  }

  function startQuiz(reading, count, onlyMissed, listedIds) {
    const source = listedIds || shuffle(poolFor(reading, onlyMissed)).map((question) => question.id);
    const ids = source.slice(0, count || source.length);
    if (!ids.length) return;
    state.view = "play";
    state.play = {
      mode: "quiz",
      phase: "ask",
      ids,
      index: 0,
      correct: 0,
      gained: 0,
      combo: 0,
      bestCombo: 0,
      misses: []
    };
    deal(ids);
    render();
  }

  function startHybrid(index) {
    state.view = "play";
    state.play = {
      mode: "hybrid",
      phase: "read",
      sectionIndex: index,
      runCorrect: 0,
      runTotal: 0,
      runGained: 0,
      runComboBest: 0,
      runMisses: [],
      combo: 0
    };
    render();
  }

  function answer(index) {
    const play = state.play;
    if (!play || play.locked || play.phase !== "ask") return;
    const choice = play.choices[index];
    if (!choice) return;
    play.locked = true;
    play.picked = index;
    const question = questionById(play.ids[play.index]);
    if (choice.correct) {
      play.combo += 1;
      play.bestCombo = Math.max(play.bestCombo || 0, play.combo);
      const gain = 10 + (play.combo >= 3 ? 5 : 0);
      play.gained = (play.gained || 0) + gain;
      play.correct = (play.correct || 0) + 1;
      if (play.mode === "hybrid") play.sectionCorrect += 1;
      progress.xp += gain;
      progress.status[question.id] = "right";
    } else {
      play.combo = 0;
      progress.status[question.id] = "wrong";
      const miss = {
        id: question.id,
        prompt: question.prompt,
        answer: question.choices[question.answer],
        explain: question.explain
      };
      play.misses.push(miss);
    }
    touchStreak();
    save();
    render();
  }

  function finishQuiz() {
    const play = state.play;
    const pct = Math.round((play.correct / play.ids.length) * 100);
    progress.rounds += 1;
    if (pct > progress.bestPct) progress.bestPct = pct;
    save();
    state.results = {
      correct: play.correct,
      total: play.ids.length,
      gained: play.gained,
      bestCombo: play.bestCombo,
      misses: play.misses
    };
    state.view = "results";
    state.play = null;
    render();
  }

  function nextStep() {
    const play = state.play;
    if (!play || !play.locked) return;
    if (play.mode === "quiz") {
      if (play.index + 1 >= play.ids.length) {
        finishQuiz();
        return;
      }
      play.index += 1;
      deal(play.ids);
      render();
      return;
    }
    if (play.index + 1 >= play.ids.length) {
      play.phase = "cleared";
      play.runCorrect += play.sectionCorrect;
      play.runTotal += play.sectionTotal;
      play.runGained += play.gained;
      play.runComboBest = Math.max(play.runComboBest, play.bestCombo || 0);
      play.runMisses = play.runMisses.concat(play.misses);
      save();
      render();
      return;
    }
    play.index += 1;
    deal(play.ids);
    render();
  }

  function onClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "home") {
      state.view = "home";
      state.play = null;
      render();
    } else if (action === "review") {
      state.view = "review";
      render();
    } else if (action === "tab") {
      state.reviewId = target.dataset.id;
      render();
    } else if (action === "mark-read") {
      const id = target.dataset.id;
      if (!progress.read[id]) {
        progress.read[id] = true;
        progress.xp += 20;
        touchStreak();
        save();
      }
      render();
    } else if (action === "setup") {
      state.view = "setup";
      if (target.dataset.reading) state.setup.reading = target.dataset.reading;
      render();
    } else if (action === "pick-reading") {
      state.setup.reading = target.dataset.id;
      render();
    } else if (action === "pick-count") {
      state.setup.count = Number(target.dataset.count);
      render();
    } else if (action === "start-quiz") {
      startQuiz(state.setup.reading, state.setup.count, false);
    } else if (action === "quick") {
      startQuiz("all", 5, false);
    } else if (action === "missed") {
      startQuiz("all", missedCount(), true);
    } else if (action === "hybrid") {
      startHybrid(Number(target.dataset.index || 0));
    } else if (action === "probe") {
      const section = data.sections[state.play.sectionIndex];
      state.play.phase = "ask";
      state.play.index = 0;
      state.play.ids = section.questionIds.slice();
      state.play.sectionCorrect = 0;
      state.play.sectionTotal = section.questionIds.length;
      state.play.gained = 0;
      state.play.combo = state.play.combo || 0;
      state.play.bestCombo = 0;
      state.play.misses = [];
      deal(state.play.ids);
      render();
    } else if (action === "answer") {
      answer(Number(target.dataset.index));
    } else if (action === "next") {
      nextStep();
    } else if (action === "next-section") {
      const previous = state.play;
      startHybrid(previous.sectionIndex + 1);
      state.play.runCorrect = previous.runCorrect;
      state.play.runTotal = previous.runTotal;
      state.play.runGained = previous.runGained;
      state.play.runComboBest = previous.runComboBest;
      state.play.runMisses = previous.runMisses;
      state.play.combo = previous.combo;
    } else if (action === "finish-hybrid") {
      const play = state.play;
      const pct = play.runTotal ? Math.round((play.runCorrect / play.runTotal) * 100) : 0;
      progress.rounds += 1;
      if (pct > progress.bestPct) progress.bestPct = pct;
      save();
      state.results = {
        correct: play.runCorrect,
        total: play.runTotal,
        gained: play.runGained,
        bestCombo: play.runComboBest,
        misses: play.runMisses
      };
      state.view = "results";
      state.play = null;
      render();
    } else if (action === "retry-listed") {
      startQuiz("all", state.results.misses.length, false, state.results.misses.map((miss) => miss.id));
    } else if (action === "reset") {
      if (window.confirm("Reset score, streak, and mastery on this computer?")) {
        progress = fresh();
        save();
        state.view = "home";
        render();
      }
    }
  }

  function onKey(event) {
    if (!state.play || state.play.phase === "read" || state.play.phase === "cleared") return;
    if (event.key >= "1" && event.key <= "4" && !state.play.locked) answer(Number(event.key) - 1);
    if (event.key === "Enter" && state.play.locked) nextStep();
  }

  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  themeQuery.addEventListener("change", syncThemeColor);
  syncThemeColor();
  render();
})();
