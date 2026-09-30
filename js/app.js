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

  const TERMS = {
    elias: { term: "Civilizing process", def: "Elias: as the state monopolizes legitimate violence and people depend on more others, external restraint becomes self-restraint. Sensitivity to the violence that remains goes up." },
    instrumental: { term: "Instrumental violence", def: "Franke: force, or the threat of it, used to obtain money or goods. He argues this rose after the 1970s, with theft, robbery, and the drugs trade." },
    impulsive: { term: "Impulsive violence", def: "Franke: blows in ordinary public and private conflict. Simple assault is the indicator, and he thinks this kept falling or stabilized." },
    panic: { term: "Moral panic", def: "Cohen’s folk devil, tested by Baerveldt with Goode and Ben-Yehuda: concern, hostility, consensus, disproportionality, and volatility." },
    proportion: { term: "Disproportionality", def: "Felt concern is out of scale with harm. Without this, “panic” is only an insult. Their strongest test is crime flat after 1984 while disquiet jumps after 1990." },
    misdirect: { term: "Misdirectedness", def: "The sixth criterion Baerveldt proposes: a visible reaction that does not solve the problem it names. Boot camps and moving drug scenes around are the examples." },
    chain: { term: "Justice chain", def: "SCP’s funnel: recorded, cleared, prosecuted, tried, sentenced. Each step is a filter, not the same number as experienced crime." }
  };

  const READER = {
    franke: {
      terms: ["elias", "instrumental", "impulsive"],
      checks: ["f1", "f2", "f11", "f4", "f8", "f9"],
      cues: [
        "What did violent crime do before the 1970s?",
        "What does Elias say changes inside the person?",
        "Name one reason a conviction series is not a behaviour series.",
        "Where do assault convictions go after the early 1890s?",
        "Which kind of violence rises after 1970?",
        "Where does Dutch homicide sit against the United States?"
      ],
      lines: [
        "Until the 1970s it stayed roughly stable, and assault most likely fell.",
        "External restraint becomes self-restraint, and people grow more sensitive to the violence they rarely see.",
        "The 1886 code replaced the French Code Pénal, and from 1986 a transaction can end a case without conviction.",
        "They peak near 100 per 100,000, then fall to the high 20s.",
        "Instrumental violence, used to get goods. Impulsive violence in daily life does not.",
        "About 0.9 deaths per 100,000, against about 8.9 in the United States."
      ]
    },
    baerveldt: {
      terms: ["panic", "proportion", "misdirect"],
      checks: ["b1", "b3", "b5", "b10", "b11"],
      cues: [
        "Why is the tougher policy not treated as a necessary response?",
        "What are the five tests?",
        "Which criterion fails to find a clear enemy?",
        "Does one group of actors start the 1990 panic?",
        "What is the extra criterion they want?"
      ],
      lines: [
        "Crime and fear were fairly stable from 1984, while detention capacity more than tripled from 1982 to 1995.",
        "Concern, hostility, consensus, disproportionality, and volatility.",
        "Hostility. The enemy stays a diffuse “criminal,” and the picture can shift.",
        "No. Elites, intermediate agencies, and the public all appear, and none of the three stories is enough.",
        "Misdirectedness: a reaction that is already known not to solve the problem it names."
      ]
    },
    scp: {
      terms: ["chain", "proportion"],
      checks: ["s1", "s16", "s2", "s4", "s6"],
      cues: [
        "Which crimes does chapter 11 leave out?",
        "What kinds of data does the chapter stack?",
        "What happened to the belief that crime was still rising?",
        "Why can recorded violence rise when surveys do not?",
        "From 2001 to 2005, what happened to recorded crimes and cleared crimes?"
      ],
      lines: [
        "Drug dealing, arms dealing, trafficking, fraud, environmental crime, and terrorism.",
        "Perception, victim surveys, police records, the justice chain, suspects, and victims.",
        "It fell from over 90 percent in 1994 to 64 percent in 2006, while crime stayed politically important.",
        "Attention and priority at the police and prosecution changed what got recorded.",
        "Recorded crimes fell from 1.36 to 1.23 million. Crimes cleared rose from 215,000 to 252,000."
      ]
    },
    synthesis: {
      terms: ["instrumental", "panic", "chain"],
      checks: ["x2", "x3"],
      cues: [
        "Which decade belongs to which reading?",
        "What three things do you have to keep apart?"
      ],
      lines: [
        "Franke’s break is the 1970s, Baerveldt’s is about 1990, and felt unsafety cools in the early 2000s.",
        "The act, the record, and the feeling."
      ]
    }
  };

  const state = {
    view: "home",
    reviewId: "franke",
    setup: { reading: "all", count: 10 },
    play: null,
    results: null,
    inline: null,
    fullText: false,
    term: null
  };

  let progress = load();

  function fresh() {
    return { xp: 0, streak: 0, lastDay: null, status: {}, read: {}, bestPct: 0, rounds: 0, theme: "system", part: {} };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!saved || typeof saved !== "object") return fresh();
      return Object.assign(fresh(), saved, {
        status: saved.status || {},
        read: saved.read || {},
        part: saved.part || {},
        theme: saved.theme || "system"
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

  function effectiveDark() {
    const choice = progress.theme || "system";
    if (choice === "dark") return true;
    if (choice === "light") return false;
    return themeQuery.matches;
  }

  function applyTheme() {
    const choice = progress.theme || "system";
    document.documentElement.dataset.theme = choice;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = effectiveDark() ? "#101412" : "#f6f1e8";
  }

  function syncThemeButtons() {
    document.querySelectorAll("[data-action='theme']").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.theme === (progress.theme || "system") ? "true" : "false");
    });
  }

  function missedCount() {
    return data.questions.filter((question) => progress.status[question.id] === "wrong").length;
  }

  function render(options) {
    const keep = options && options.keepScroll;
    const y = keep ? window.scrollY : 0;
    document.getElementById("app").innerHTML = shell(view());
    window.scrollTo(0, y);
    if (!keep) {
      const focus = document.querySelector("[data-focus]");
      if (focus) focus.focus();
    }
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
            <div class="theme-switch" role="group" aria-label="Appearance">
              ${[["system", "System"], ["light", "Light"], ["dark", "Dark"]].map(([id, label]) => `<button type="button" data-action="theme" data-theme="${id}" aria-pressed="${(progress.theme || "system") === id}">${label}</button>`).join("")}
            </div>
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
      <p class="foot">Built from Franke (1994), Baerveldt, Bunkers, De Winter, and Kooistra (1998), and SCP, <em>Facts and Figures of the Netherlands</em> (2008), chapter 11. Appearance defaults to your system and can be set to light or dark. <button class="text-btn" data-action="reset">Reset progress</button></p>`;
  }

  function reviewParts(review) {
    const chunks = review.html.trim().split("<h3>");
    const parts = [];
    chunks.forEach((chunk, index) => {
      if (!chunk.trim()) return;
      if (index === 0) {
        parts.push({ title: "Opening", html: chunk });
        return;
      }
      const cut = chunk.indexOf("</h3>");
      parts.push({
        title: chunk.slice(0, cut).replace(/<[^>]+>/g, ""),
        html: chunk.slice(cut + 5)
      });
    });
    return parts;
  }

  function partIndex(reviewId) {
    const id = reviewId || state.reviewId;
    const saved = progress.part[id] || 0;
    const total = reviewParts(data.reviews.find((item) => item.id === id)).length;
    return Math.min(saved, Math.max(total - 1, 0));
  }

  function prepareInline(spec, index) {
    const check = spec && spec.checks[index];
    if (!check) {
      state.inline = null;
      return;
    }
    if (state.inline && state.inline.qid === check && state.inline.reviewId === state.reviewId && state.inline.part === index) return;
    const question = questionById(check);
    state.inline = {
      reviewId: state.reviewId,
      part: index,
      qid: check,
      choices: shuffle(question.choices.map((text, choiceIndex) => ({ text, correct: choiceIndex === question.answer }))),
      locked: false,
      picked: null,
      revealed: false
    };
  }

  function viewReview() {
    const review = data.reviews.find((item) => item.id === state.reviewId) || data.reviews[0];
    const spec = READER[review.id];
    const parts = reviewParts(review);
    const index = partIndex(review.id);
    const part = parts[index];
    prepareInline(spec, index);
    const done = progress.read[review.id];
    const known = spec ? spec.checks.filter((id) => progress.status[id] === "right").length : 0;
    const tabs = `
      <p class="kicker">${esc(review.kicker)}</p>
      <div class="tabs">
        ${data.reviews.map((item) => `<button class="tab" data-action="tab" data-id="${item.id}" ${item.id === review.id ? 'aria-current="page"' : ""}>${esc(readingOf(item.id).label)}</button>`).join("")}
      </div>
      <div class="terms">
        ${(spec ? spec.terms : []).map((id) => `<button class="term" data-action="term" data-id="${id}" aria-expanded="${state.term === id}">${esc(TERMS[id].term)}</button>`).join("")}
      </div>
      ${state.term && TERMS[state.term] ? `<p class="define"><strong>${esc(TERMS[state.term].term)}.</strong> ${esc(TERMS[state.term].def)}</p>` : ""}`;
    if (state.fullText) {
      return `
        ${tabs}
        <article class="prose">
          <h2>${esc(review.title)}</h2>
          <p class="muted">${esc(review.cite)}</p>
          ${review.html}
        </article>
        <div class="actions">
          <button class="primary" data-action="full-text">Back to the guided read</button>
          <button class="ghost" data-action="mark-read" data-id="${review.id}" ${done ? "disabled" : ""}>${done ? "Marked as read" : "Mark as read · 20 xp"}</button>
        </div>`;
    }
    const cue = spec && spec.cues[index];
    const line = spec && spec.lines[index];
    const revealed = state.inline && state.inline.revealed;
    const question = state.inline ? questionById(state.inline.qid) : null;
    return `
      ${tabs}
      <p class="muted">Part ${index + 1} of ${parts.length}${spec ? ` · ${known}/${spec.checks.length} checks held` : ""}</p>
      <div class="steps">
        ${parts.map((item, step) => `<button class="step${progress.status[spec && spec.checks[step]] === "right" ? " done" : ""}" data-action="jump-part" data-index="${step}" ${step === index ? 'aria-current="step"' : ""}>${step + 1}</button>`).join("")}
      </div>
      <article class="prose">
        <h2>${esc(part.title === "Opening" ? review.title : part.title)}</h2>
        ${index === 0 ? `<p class="muted">${esc(review.cite)}</p>` : ""}
        ${part.html}
      </article>
      ${cue ? `<section class="recall${revealed ? " show" : ""}">
        <p class="kicker">Recall</p>
        <p>${esc(cue)}</p>
        ${revealed ? `<p>${esc(line)}</p>` : ""}
        <button class="ghost" data-action="reveal">${revealed ? "Hide the line" : "Try it, then look"}</button>
      </section>` : ""}
      ${question ? `<section class="inline-check">
        <p class="kicker">Check this part</p>
        <h3>${esc(question.prompt)}</h3>
        <div class="choices">
          ${state.inline.choices.map((choice, choiceIndex) => {
            let cls = "choice";
            if (state.inline.locked && choice.correct) cls += " correct";
            if (state.inline.locked && state.inline.picked === choiceIndex && !choice.correct) cls += " wrong";
            return `<button class="${cls}" data-action="inline-answer" data-index="${choiceIndex}" ${state.inline.locked ? "disabled" : ""}><span class="key">${choiceIndex + 1}</span><span>${esc(choice.text)}</span></button>`;
          }).join("")}
        </div>
        ${state.inline.locked ? `<p class="verdict ${state.inline.choices[state.inline.picked].correct ? "good" : "bad"}">${state.inline.choices[state.inline.picked].correct ? "Sustained" : "Overruled"}</p><p>${esc(question.explain)}</p>` : `<p class="muted">Press 1–4.</p>`}
      </section>` : ""}
      <div class="actions">
        <button class="ghost" data-action="prev-part" ${index === 0 ? "disabled" : ""}>Previous</button>
        <button class="primary" data-action="next-part" ${index === parts.length - 1 ? "disabled" : ""}>Next part</button>
        <button class="ghost" data-action="full-text">Full text</button>
        <button class="ghost" data-action="mark-read" data-id="${review.id}" ${done ? "disabled" : ""}>${done ? "Marked as read" : "Mark as read · 20 xp"}</button>
        <button class="ghost" data-action="setup" data-reading="${review.id}">Quiz this reading</button>
      </div>`;
  }

  function viewSetup() {
    const pool = poolFor(state.setup.reading, false);
    const sizes = [5, 10, 20].filter((size) => size < pool.length);
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
      state.term = null;
      state.fullText = false;
      render();
    } else if (action === "theme") {
      progress.theme = target.dataset.theme;
      save();
      applyTheme();
      syncThemeButtons();
      return;
    } else if (action === "term") {
      state.term = state.term === target.dataset.id ? null : target.dataset.id;
      render({ keepScroll: true });
    } else if (action === "full-text") {
      state.fullText = !state.fullText;
      render();
    } else if (action === "reveal") {
      if (state.inline) state.inline.revealed = !state.inline.revealed;
      render({ keepScroll: true });
    } else if (action === "jump-part") {
      progress.part[state.reviewId] = Number(target.dataset.index);
      save();
      render();
    } else if (action === "prev-part" || action === "next-part") {
      const delta = action === "next-part" ? 1 : -1;
      progress.part[state.reviewId] = partIndex() + delta;
      save();
      render();
    } else if (action === "inline-answer") {
      inlineAnswer(Number(target.dataset.index));
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
        const theme = progress.theme || "system";
        progress = fresh();
        progress.theme = theme;
        save();
        state.view = "home";
        state.inline = null;
        render();
      }
    }
  }

  function inlineAnswer(index) {
    const inline = state.inline;
    if (!inline || inline.locked) return;
    const choice = inline.choices[index];
    if (!choice) return;
    inline.locked = true;
    inline.picked = index;
    const question = questionById(inline.qid);
    if (choice.correct) {
      if (progress.status[question.id] !== "right") progress.xp += 10;
      progress.status[question.id] = "right";
    } else {
      progress.status[question.id] = "wrong";
    }
    touchStreak();
    save();
    render({ keepScroll: true });
  }

  function onKey(event) {
    if (state.view === "review" && state.inline && !state.fullText) {
      if (event.key >= "1" && event.key <= "4" && !state.inline.locked) inlineAnswer(Number(event.key) - 1);
      return;
    }
    if (!state.play || state.play.phase === "read" || state.play.phase === "cleared") return;
    if (event.key >= "1" && event.key <= "4" && !state.play.locked) answer(Number(event.key) - 1);
    if (event.key === "Enter" && state.play.locked) nextStep();
  }

  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  themeQuery.addEventListener("change", applyTheme);
  applyTheme();
  render();
})();
