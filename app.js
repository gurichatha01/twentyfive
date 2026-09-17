/* =========================================================
   25 / birthday invitation
   Everything you need to change lives in CONFIG below.
   No build step, no dependencies.
   ========================================================= */

const CONFIG = {
  /* ---- the two of you ---- */
  hostA: "GURI",              // <- replace if this is not your name
  hostB: "LAKSHIT",

  /* ---- when ---- */
  // ISO 8601 with your timezone offset. +05:30 is India.
  // Saturday 26 September 2026. The race is the first thing that
  // happens, so the countdown runs to that, not to the party.
  raceISO:  "2026-09-26T16:30:00+05:30",
  startISO: "2026-09-26T20:00:00+05:30",
  endISO:   "2026-09-27T02:00:00+05:30",

  /* ---- where ---- */
  // The exact address is not on the site on purpose, it goes out
  // personally. Change venueNote if you would rather publish it.
  venue:     "Le Manoir, Dwarka",
  venueNote: "Sector 10. Flat pin on WhatsApp",
  address:   "Sector 10 Market, Dwarka, New Delhi",
  dress:     "Black, or something loud",

  /* ---- rsvp destinations ---- */
  // Country code, no plus sign, no spaces. 91 = India.
  whatsapp: "919888816669",
  email:    "gurichatha01@gmail.com",

  /* ---- easter egg payoff ---- */
  secretPlace: "Ask either of us for the pin. It is not going on a website."
};

/* ========================================================= */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------
   1. Fill the page from CONFIG
--------------------------------------------------------- */

const partyDate = new Date(CONFIG.startISO);
const raceDate  = new Date(CONFIG.raceISO);

const clockTime = (d) =>
  d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

function fillContent() {
  const names = CONFIG.hostA + " & " + CONFIG.hostB;
  document.title = "25 / " + CONFIG.hostA + " & " + CONFIG.hostB;

  const [a, b] = $$(".scramble");
  if (a) { a.textContent = CONFIG.hostA; a.dataset.scramble = CONFIG.hostA; }
  if (b) { b.textContent = CONFIG.hostB; b.dataset.scramble = CONFIG.hostB; }
  $("#footNames").textContent = names;
  $("#yearTag").textContent = String(partyDate.getFullYear());

  const long = partyDate.toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long"
  });

  $('[data-fill="dateLong"]').textContent = long;
  $('[data-fill="raceTime"]').textContent = clockTime(raceDate);
  $('[data-fill="time"]').textContent = clockTime(partyDate);
  $('[data-fill="dress"]').textContent = CONFIG.dress;

  const venueCell = $('[data-fill="venue"]');
  venueCell.textContent = CONFIG.venue;
  if (CONFIG.venueNote) {
    const note = document.createElement("small");
    note.className = "stub__note";
    note.textContent = CONFIG.venueNote;
    venueCell.appendChild(note);
  }

  $("#mapLink").href =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(CONFIG.venue + ", " + CONFIG.address);

  buildCalendarLink();
}

function icsStamp(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildCalendarLink() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//25//birthday//EN",
    "BEGIN:VEVENT",
    "UID:" + Date.now() + "@twentyfive",
    "DTSTAMP:" + icsStamp(new Date().toISOString()),
    // the calendar block covers the whole thing, race included
    "DTSTART:" + icsStamp(CONFIG.raceISO),
    "DTEND:" + icsStamp(CONFIG.endISO),
    "SUMMARY:" + CONFIG.hostA + " & " + CONFIG.hostB + " turn 25",
    "LOCATION:" + CONFIG.venue + ", " + CONFIG.address,
    "DESCRIPTION:Race screening from " + clockTime(raceDate) +
      "\\, party from " + clockTime(partyDate) +
      ". Dress code: " + CONFIG.dress,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const link = $("#calLink");
  link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  link.download = "twentyfive.ics";
}

/* ---------------------------------------------------------
   2. Scroll reveals (IntersectionObserver, no scroll listener)
--------------------------------------------------------- */

function initReveals() {
  if (reduceMotion) {
    $$(".reveal").forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------
   3. Name scramble on first paint
--------------------------------------------------------- */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%*/><";

function scramble(el, delay = 0) {
  const final = el.dataset.scramble || el.textContent;
  if (reduceMotion) { el.textContent = final; return; }

  let frame = 0;
  let done = false;
  const total = 26;
  const finish = () => { done = true; el.textContent = final; };

  const run = () => {
    if (done) return;
    const progress = frame / total;
    el.textContent = final
      .split("")
      .map((ch, i) =>
        i / final.length < progress ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      )
      .join("");
    frame++;
    if (frame <= total) requestAnimationFrame(run);
    else finish();
  };

  setTimeout(run, delay);
  // rAF is throttled in a background tab, so never leave the names
  // scrambled if someone opens the link and switches away.
  setTimeout(finish, delay + 1600);
}

/* ---------------------------------------------------------
   4. Countdown
--------------------------------------------------------- */

function initCountdown() {
  const cells = { d: $("#cd-d"), h: $("#cd-h"), m: $("#cd-m"), s: $("#cd-s") };
  const box = $("#count");
  const pad = (n) => String(n).padStart(2, "0");

  const tick = () => {
    // counts to the race, which is the first thing that happens
    let diff = raceDate.getTime() - Date.now();
    if (diff <= 0) {
      box.classList.add("done");
      cells.d.textContent = cells.h.textContent = "00";
      cells.m.textContent = cells.s.textContent = "00";
      $(".count-wrap .eyebrow").textContent = "It is happening";
      clearInterval(timer);
      return;
    }
    const s = Math.floor(diff / 1000);
    cells.d.textContent = pad(Math.floor(s / 86400));
    cells.h.textContent = pad(Math.floor(s / 3600) % 24);
    cells.m.textContent = pad(Math.floor(s / 60) % 60);
    cells.s.textContent = pad(s % 60);
  };

  tick();
  const timer = setInterval(tick, 1000);
}

/* ---------------------------------------------------------
   5. The beat. Generated with Web Audio, no audio files,
      nothing copyrighted. Boom bap by default, and the
      rave easter egg flips it to a rock pattern.
--------------------------------------------------------- */

const Beat = (() => {
  let ctx = null, master = null, noiseBuf = null, drive = null;
  let running = false, mode = "hiphop";
  let step = 0, nextTime = 0, timer = null;

  const TEMPO = { hiphop: 88, rock: 152 };

  // A minor pentatonic, low register
  const N = { A1: 55.0, C2: 65.41, D2: 73.42, E2: 82.41, G2: 98.0, A2: 110.0 };

  const PATTERNS = {
    hiphop: {
      kick:  [0, 7, 10],
      snare: [4, 12],
      hat:   [0, 2, 4, 6, 8, 10, 12, 14],
      bass:  { 0: N.A1, 7: N.C2, 10: N.G2, 14: N.E2 },
      chord: { 8: [N.A2, N.C2 * 2] }
    },
    rock: {
      kick:  [0, 3, 6, 8, 11, 14],
      snare: [4, 12],
      hat:   [0, 2, 4, 6, 8, 10, 12, 14],
      bass:  { 0: N.E2, 4: N.E2, 8: N.G2, 12: N.D2 },
      chord: { 0: [N.E2 * 2, N.E2 * 3], 8: [N.G2 * 2, N.G2 * 3] }
    }
  };

  function makeNoise() {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function makeCurve(amount) {
    const n = 1024, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
    }
    return curve;
  }

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);

    drive = ctx.createWaveShaper();
    drive.curve = makeCurve(14);
    drive.oversample = "2x";

    noiseBuf = makeNoise();
  }

  function env(node, t, peak, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    node.connect(g);
    return g;
  }

  function kick(t) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(mode === "rock" ? 160 : 132, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.17);
    env(o, t, 1.0, 0.36).connect(master);
    if (window.__bgKick) setTimeout(() => window.__bgKick(0.95), Math.max(0, (t - ctx.currentTime) * 1000));
    o.start(t); o.stop(t + 0.4);
  }

  function snare(t) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = mode === "rock" ? 2100 : 1650;
    bp.Q.value = 0.8;
    src.connect(bp);
    env(bp, t, 0.45, mode === "rock" ? 0.22 : 0.17).connect(master);
    src.start(t); src.stop(t + 0.3);

    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(190, t);
    env(o, t, 0.28, 0.09).connect(master);
    o.start(t); o.stop(t + 0.12);
  }

  function hat(t) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 8200;
    src.connect(hp);
    env(hp, t, 0.13, 0.045).connect(master);
    src.start(t); src.stop(t + 0.08);
  }

  function bass(t, freq) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(freq, t);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = mode === "rock" ? 620 : 380;
    o.connect(lp);
    const g = env(lp, t, 0.34, mode === "rock" ? 0.26 : 0.42);
    g.connect(drive);
    drive.connect(master);
    o.start(t); o.stop(t + 0.7);
  }

  function chord(t, freqs) {
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f, t);
      o.detune.value = i === 0 ? -7 : 7;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2400;
      o.connect(lp);
      const g = env(lp, t, mode === "rock" ? 0.16 : 0.08, 0.5);
      g.connect(drive);
      drive.connect(master);
      o.start(t); o.stop(t + 0.7);
    });
  }

  function schedule() {
    const spb = 60 / TEMPO[mode];
    const stepDur = spb / 4;

    while (nextTime < ctx.currentTime + 0.12) {
      const p = PATTERNS[mode];
      const i = step % 16;
      // light swing on the offbeat 16ths for the hip hop pattern
      const swing = mode === "hiphop" && i % 2 === 1 ? stepDur * 0.16 : 0;
      const t = nextTime + swing;

      if (p.kick.includes(i)) kick(t);
      if (p.snare.includes(i)) snare(t);
      if (p.hat.includes(i)) hat(t);
      if (p.bass[i]) bass(t, p.bass[i]);
      if (p.chord[i]) chord(t, p.chord[i]);

      nextTime += stepDur;
      step++;
    }
  }

  return {
    get running() { return running; },
    get mode() { return mode; },

    async start() {
      if (!ctx) init();
      if (ctx.state === "suspended") await ctx.resume();
      if (running) return;
      running = true;
      step = 0;
      nextTime = ctx.currentTime + 0.08;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.32, ctx.currentTime + 1.1);
      timer = setInterval(schedule, 25);
    },

    stop() {
      if (!running || !ctx) return;
      running = false;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      clearInterval(timer);
      timer = null;
    },

    setMode(m) {
      mode = m;
      step = 0;
    },

    // one off sub drop, used by the shake easter egg
    drop() {
      if (!ctx) init();
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime + 0.02;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(28, t + 1.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(running ? 0.55 : 0.8, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      o.connect(g).connect(ctx.destination);
      if (window.__bgKick) window.__bgKick(1.4);
      o.start(t); o.stop(t + 1.4);
    }
  };
})();

function initSound() {
  const btn = $("#soundBtn");
  const label = $("#soundLabel");

  btn.addEventListener("click", async () => {
    if (Beat.running) {
      Beat.stop();
      btn.setAttribute("aria-pressed", "false");
      label.textContent = "Beat off";
    } else {
      await Beat.start();
      btn.setAttribute("aria-pressed", "true");
      label.textContent = Beat.mode === "rock" ? "Rock" : "Beat on";
      askMotionPermission();
    }
  });
}

/* ---------------------------------------------------------
   5b. The broadcast. Satire, invented network and anchor.
--------------------------------------------------------- */

function initBroadcast() {
  // on air clock, set to the party start then running live
  const clock = $("#tvClock");
  const tickClock = () => {
    clock.textContent = new Date().toLocaleTimeString(undefined, {
      hour: "2-digit", minute: "2-digit", hour12: false
    });
  };
  tickClock();
  setInterval(tickClock, 1000);

  // anchor reads the script when the segment comes into view
  const script = $("#anchorScript");
  const text = script.dataset.script || "";
  if (reduceMotion) {
    script.textContent = text;
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let i = 0;
        const type = () => {
          script.textContent = text.slice(0, i++);
          if (i <= text.length) setTimeout(type, 26);
        };
        setTimeout(type, 420);
      });
    }, { threshold: 0.35 });
    io.observe($(".tv"));
  }

  // the fixed ticker drops in once the hero is behind you
  const ticker = $("#ticker");
  const heroIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => ticker.classList.toggle("show", !e.isIntersecting));
    },
    { threshold: 0.12 }
  );
  heroIo.observe($("#hero"));

  // the weather panel keeps twitching its decibel reading
  const db = $(".wx__cell b.flick");
  if (db && !reduceMotion) {
    setInterval(() => {
      db.textContent = String(112 + Math.floor(Math.random() * 9));
    }, 1600);
  }
}

/* ---------------------------------------------------------
   6. Toast
--------------------------------------------------------- */

let toastTimer = null;
function toast(msg, ms = 3200) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}

/* ---------------------------------------------------------
   7. Confetti
--------------------------------------------------------- */

function confetti(count = 70) {
  if (reduceMotion) return;
  const box = $("#confetti");
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("i");
    bit.style.left = Math.random() * 100 + "%";
    bit.style.animationDuration = 2.4 + Math.random() * 2.2 + "s";
    bit.style.animationDelay = Math.random() * 0.7 + "s";
    bit.style.transform = "rotate(" + Math.random() * 360 + "deg)";
    frag.appendChild(bit);
  }
  box.appendChild(frag);
  setTimeout(() => { box.innerHTML = ""; }, 5600);
}

/* ---------------------------------------------------------
   8. Easter eggs. Five of them.
--------------------------------------------------------- */

const EGGS = ["rave", "after", "drop", "queue", "credits"];
let found = new Set();

function loadEggs() {
  try {
    const raw = localStorage.getItem("tf-eggs");
    if (raw) found = new Set(JSON.parse(raw));
  } catch (e) { /* private mode, no memory, fine */ }
}

function saveEggs() {
  try { localStorage.setItem("tf-eggs", JSON.stringify([...found])); }
  catch (e) { /* ignore */ }
}

function findEgg(name, msg) {
  const isNew = !found.has(name);
  found.add(name);
  saveEggs();
  toast(msg + (isNew ? "   (" + found.size + " of " + EGGS.length + ")" : ""));
  if (found.size === EGGS.length && isNew) {
    setTimeout(() => {
      confetti(140);
      toast("All five found. You have officially read the invitation harder than we wrote it.", 5000);
    }, 2600);
  }
}

/* egg 1: tap the 25 five times */
function eggRave() {
  const mark = $("#bigNum");
  let taps = 0, reset = null;

  const hit = async () => {
    taps++;
    clearTimeout(reset);
    reset = setTimeout(() => { taps = 0; }, 2500);
    if (taps < 5) return;
    taps = 0;

    document.body.classList.toggle("rave");
    if (document.body.classList.contains("rave")) {
      confetti(90);
      Beat.setMode("rock");
      if (!Beat.running) {
        await Beat.start();
        $("#soundBtn").setAttribute("aria-pressed", "true");
      }
      $("#soundLabel").textContent = "Rock";
      findEgg("rave", "Rave mode. Tap it five more times to calm down.");
    } else {
      Beat.setMode("hiphop");
      $("#soundLabel").textContent = Beat.running ? "Beat on" : "Beat off";
      toast("Back to the slow half.");
    }
  };

  mark.addEventListener("click", hit);
  mark.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hit(); }
  });
}

/* egg 2: press and hold the cake */
function eggAfter() {
  const cake = $("#vinyl");
  const secret = $("#secret");
  let hold = null;

  const start = (e) => {
    e.preventDefault();
    cake.classList.add("charging");
    hold = setTimeout(() => {
      cake.classList.remove("charging");
      if (!secret.hidden) { toast("You already know."); return; }
      secret.hidden = false;
      $("#secretWhere").textContent = CONFIG.secretPlace;
      confetti(40);
      findEgg("after", "That is where it is.");
      setTimeout(() => secret.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }), 350);
    }, 800);
  };

  const cancel = () => { clearTimeout(hold); cake.classList.remove("charging"); };

  cake.addEventListener("pointerdown", start);
  cake.addEventListener("pointerup", cancel);
  cake.addEventListener("pointerleave", cancel);
  cake.addEventListener("pointercancel", cancel);
  cake.addEventListener("contextmenu", (e) => e.preventDefault());
}

/* egg 3: shake the phone */
function askMotionPermission() {
  const DM = window.DeviceMotionEvent;
  if (!DM) return;
  if (typeof DM.requestPermission === "function") {
    DM.requestPermission().then((state) => {
      if (state === "granted") listenShake();
    }).catch(() => {});
  } else {
    listenShake();
  }
}

let shakeBound = false;
function listenShake() {
  if (shakeBound) return;
  shakeBound = true;
  let last = 0, lx = 0, ly = 0, lz = 0;

  window.addEventListener("devicemotion", (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const now = Date.now();
    if (now - last < 180) return;
    const delta = Math.abs(a.x - lx) + Math.abs(a.y - ly) + Math.abs(a.z - lz);
    lx = a.x; ly = a.y; lz = a.z;
    last = now;

    if (delta > 42) {
      Beat.drop();
      document.body.classList.add("kick");
      setTimeout(() => document.body.classList.remove("kick"), 500);
      findEgg("drop", "808. Do not break your phone before the party.");
    }
  });
}

/* egg 4: type a name into the song field */
function eggQueue() {
  const input = $("#f-song");
  const keys = [
    CONFIG.hostA.toLowerCase(), CONFIG.hostB.toLowerCase(),
    "birthday", "happy birthday",
    "seedhe maut", "tame impala", "a little piece of heaven", "avenged sevenfold"
  ];

  input.addEventListener("input", () => {
    const v = input.value.trim().toLowerCase();
    if (!keys.includes(v)) return;
    input.value = "Nice try. Stevie Wonder, Happy Birthday";
    confetti(30);
    findEgg("queue", "That one is already on the queue.");
  });
}

/* egg 5: triple tap the year in the footer, plus a keyboard route for desktop */
function eggCredits() {
  const yr = $("#footYear");
  let taps = 0, reset = null;

  const show = () => {
    findEgg("credits", "Eggs: the 25, the cake, a shake, the song box, and this.");
  };

  yr.addEventListener("click", () => {
    taps++;
    clearTimeout(reset);
    reset = setTimeout(() => { taps = 0; }, 900);
    if (taps >= 3) { taps = 0; show(); }
  });

  const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "b", "d", "a", "y"];
  let idx = 0;
  window.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    idx = k === seq[idx] ? idx + 1 : (k === seq[0] ? 1 : 0);
    if (idx === seq.length) { idx = 0; confetti(80); show(); }
  });
}

/* ---------------------------------------------------------
   9. RSVP
--------------------------------------------------------- */

function buildMessage() {
  const name = $("#f-name").value.trim();
  const attend = $('input[name="attend"]:checked').value;
  const guests = $("#f-guests").value;
  const song = $("#f-song").value.trim();

  const lines = [
    "RSVP for " + CONFIG.hostA + " & " + CONFIG.hostB + " turning 25",
    "",
    "Name: " + name,
    "Coming: " + attend,
    "Guests: " + guests
  ];
  if (song) lines.push("Song: " + song);
  return lines.join("\n");
}

function validate() {
  const nameEl = $("#f-name");
  const err = $("#e-name");
  if (nameEl.value.trim().length < 2) {
    err.hidden = false;
    nameEl.setAttribute("aria-invalid", "true");
    nameEl.focus();
    return false;
  }
  err.hidden = true;
  nameEl.removeAttribute("aria-invalid");
  return true;
}

function initRsvp() {
  const form = $("#rsvpForm");
  const note = $("#formNote");
  const btn = $("#waBtn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;

    const url = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(buildMessage());
    btn.disabled = true;
    btn.textContent = "Opening WhatsApp";
    note.textContent = "";

    window.open(url, "_blank", "noopener");
    confetti(50);

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "Send on WhatsApp";
      note.textContent = "Hit send in WhatsApp and you are on the list.";
    }, 1400);
  });

  $("#mailBtn").addEventListener("click", (e) => {
    e.preventDefault();
    if (!validate()) return;
    const subject = "RSVP: " + CONFIG.hostA + " & " + CONFIG.hostB + " turn 25";
    window.location.href =
      "mailto:" + CONFIG.email +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(buildMessage());
    note.textContent = "Your mail app should be open. Send it and you are on the list.";
  });

  $("#f-name").addEventListener("input", () => {
    if ($("#f-name").value.trim().length >= 2) {
      $("#e-name").hidden = true;
      $("#f-name").removeAttribute("aria-invalid");
    }
  });
}

/* ---------------------------------------------------------
   boot
--------------------------------------------------------- */

function boot() {
  loadEggs();
  fillContent();
  initReveals();
  initCountdown();
  initBroadcast();
  initSound();
  initRsvp();
  eggRave();
  eggAfter();
  eggQueue();
  eggCredits();

  const names = $$(".scramble");
  scramble(names[0], 260);
  scramble(names[1], 460);

  if (found.size > 0 && found.size < EGGS.length) {
    setTimeout(() => toast("You have found " + found.size + " of " + EGGS.length + " hidden things here."), 2200);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
