const BUNDESLAENDER = [
  { id: "bw", name: "Baden-Württemberg", capital: "Stuttgart", labelX: 230, labelY: 660 },
  { id: "by", name: "Bayern", capital: "München", labelX: 370, labelY: 660 },
  { id: "be", name: "Berlin", capital: "Berlin", labelX: 430, labelY: 340 },
  { id: "bb", name: "Brandenburg", capital: "Potsdam", labelX: 430, labelY: 290 },
  { id: "hb", name: "Bremen", capital: "Bremen", labelX: 180, labelY: 210 },
  { id: "hh", name: "Hamburg", capital: "Hamburg", labelX: 260, labelY: 140 },
  { id: "he", name: "Hessen", capital: "Wiesbaden", labelX: 215, labelY: 480 },
  { id: "ni", name: "Niedersachsen", capital: "Hannover", labelX: 220, labelY: 270 },
  { id: "mv", name: "Mecklenburg-Vorpommern", capital: "Schwerin", labelX: 385, labelY: 140 },
  { id: "nw", name: "Nordrhein-Westfalen", capital: "Düsseldorf", labelX: 140, labelY: 390 },
  { id: "rp", name: "Rheinland-Pfalz", capital: "Mainz", labelX: 150, labelY: 540 },
  { id: "sl", name: "Saarland", capital: "Saarbrücken", labelX: 115, labelY: 590 },
  { id: "sn", name: "Sachsen", capital: "Dresden", labelX: 445, labelY: 450 },
  { id: "st", name: "Sachsen-Anhalt", capital: "Magdeburg", labelX: 345, labelY: 370 },
  { id: "sh", name: "Schleswig-Holstein", capital: "Kiel", labelX: 280, labelY: 75 },
  { id: "th", name: "Thüringen", capital: "Erfurt", labelX: 330, labelY: 460 },
];

const gameState = {
  scores: {},
  nameAttempts: {},
  capitalAttempts: {},
  namePoints: {},
  capitalPoints: {},
  solved: new Set(),
  active: null,
  phase: "name",
  totalScore: 0,
  maxScore: 160,
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getOptions(correctValue, field) {
  const others = BUNDESLAENDER
    .filter((b) => b[field] !== correctValue)
    .map((b) => b[field]);
  const wrong = shuffle(others).slice(0, 3);
  return shuffle([correctValue, ...wrong]);
}

function getLand(id) {
  return BUNDESLAENDER.find((b) => b.id === id);
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function updateHUD() {
  $("#progress-value").textContent = `${gameState.solved.size} / 16`;
  $("#score-value").textContent = `${gameState.totalScore} / ${gameState.maxScore}`;
}

function openDialog(stateId) {
  gameState.active = stateId;
  gameState.phase = "name";
  gameState.nameAttempts[stateId] = 0;
  gameState.capitalAttempts[stateId] = 0;
  gameState.namePoints[stateId] = 0;
  gameState.capitalPoints[stateId] = 0;

  const path = document.getElementById(stateId);
  $$("#germany-map path").forEach((p) => p.classList.remove("active"));
  path.classList.add("active");

  showNamePhase(stateId);
  $("#overlay").classList.add("open");
}

function showNamePhase(stateId) {
  const land = getLand(stateId);
  $("#dialog-title").textContent = "Welches Bundesland ist das?";
  $("#attempts-info").textContent = "Versuch 1 von 3";
  $("#feedback").textContent = "";
  $("#feedback").className = "";

  const options = getOptions(land.name, "name");
  renderOptions(options, land.name, "name", stateId);
}

function showCapitalPhase(stateId) {
  const land = getLand(stateId);
  gameState.phase = "capital";
  $("#dialog-title").textContent = `Was ist die Hauptstadt von ${land.name}?`;
  $("#attempts-info").textContent = "Versuch 1 von 3";
  $("#feedback").textContent = "";
  $("#feedback").className = "";

  const options = getOptions(land.capital, "capital");
  renderOptions(options, land.capital, "capital", stateId);
}

function renderOptions(options, correctValue, phase, stateId) {
  const grid = $("#options-grid");
  grid.innerHTML = "";

  options.forEach((value) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = value;
    btn.addEventListener("click", () =>
      handleOptionClick(btn, value, correctValue, phase, stateId)
    );
    grid.appendChild(btn);
  });
}

function handleOptionClick(btn, selected, correct, phase, stateId) {
  const attemptsKey = phase === "name" ? "nameAttempts" : "capitalAttempts";
  gameState[attemptsKey][stateId]++;
  const attempt = gameState[attemptsKey][stateId];

  if (selected === correct) {
    const points = attempt === 1 ? 5 : attempt === 2 ? 3 : 1;
    const pointsKey = phase === "name" ? "namePoints" : "capitalPoints";
    gameState[pointsKey][stateId] = points;

    btn.classList.add("correct");
    disableAllOptions();
    showFeedback(`Richtig! +${points} Punkte`, true);
    updateAttemptInfo(attempt, 3);

    if (phase === "name") {
      setTimeout(() => showCapitalPhase(stateId), 1200);
    } else {
      setTimeout(() => finishState(stateId), 1200);
    }
  } else {
    btn.classList.add("wrong");
    btn.disabled = true;

    if (attempt >= 3) {
      showFeedback(`Die Antwort war: ${correct}`, false);
      revealCorrect(correct);
      disableAllOptions();

      if (phase === "name") {
        setTimeout(() => showCapitalPhase(stateId), 1800);
      } else {
        setTimeout(() => finishState(stateId), 1800);
      }
    } else {
      showFeedback(`Falsch! Noch ${3 - attempt} Versuch${3 - attempt > 1 ? "e" : ""}`, false);
      updateAttemptInfo(attempt + 1, 3);
    }
  }
}

function disableAllOptions() {
  $$(".option").forEach((b) => (b.disabled = true));
}

function revealCorrect(correctValue) {
  $$(".option").forEach((btn) => {
    if (btn.textContent === correctValue) {
      btn.classList.add("reveal");
    }
  });
}

function showFeedback(text, isCorrect) {
  const fb = $("#feedback");
  fb.textContent = text;
  fb.className = isCorrect ? "correct-feedback" : "wrong-feedback";
}

function updateAttemptInfo(current, max) {
  $("#attempts-info").textContent = `Versuch ${current} von ${max}`;
}

function finishState(stateId) {
  const stateScore = (gameState.namePoints[stateId] || 0) + (gameState.capitalPoints[stateId] || 0);
  gameState.scores[stateId] = stateScore;
  gameState.totalScore += stateScore;
  gameState.solved.add(stateId);

  const path = document.getElementById(stateId);
  path.classList.remove("active");
  path.classList.add("solved");
  if (stateScore === 10) {
    path.classList.add("perfect");
  }

  const label = document.getElementById(`label-${stateId}`);
  if (label) label.classList.add("visible");

  closeDialog();
  updateHUD();

  if (gameState.solved.size === 16) {
    setTimeout(showEndScreen, 800);
  }
}

function closeDialog() {
  $("#overlay").classList.remove("open");
  $$("#germany-map path").forEach((p) => p.classList.remove("active"));
  gameState.active = null;
}

function showEndScreen() {
  const pct = Math.round((gameState.totalScore / gameState.maxScore) * 100);
  let emoji = "";
  if (pct === 100) emoji = "Perfekt!";
  else if (pct >= 80) emoji = "Sehr gut!";
  else if (pct >= 60) emoji = "Gut gemacht!";
  else if (pct >= 40) emoji = "Nicht schlecht!";
  else emoji = "Weiter üben!";

  $("#end-title").textContent = emoji;
  $("#final-score").innerHTML = `Deine Punktzahl: <strong>${gameState.totalScore} / ${gameState.maxScore}</strong>`;

  const tbody = $("#breakdown-body");
  tbody.innerHTML = "";
  BUNDESLAENDER.forEach((land) => {
    const tr = document.createElement("tr");
    const np = gameState.namePoints[land.id] || 0;
    const cp = gameState.capitalPoints[land.id] || 0;
    tr.innerHTML = `
      <td>${land.name}</td>
      <td>${np}</td>
      <td>${cp}</td>
      <td><strong>${np + cp}</strong></td>
    `;
    tbody.appendChild(tr);
  });

  $("#end-screen").classList.add("open");
}

function resetGame() {
  gameState.scores = {};
  gameState.nameAttempts = {};
  gameState.capitalAttempts = {};
  gameState.namePoints = {};
  gameState.capitalPoints = {};
  gameState.solved = new Set();
  gameState.active = null;
  gameState.phase = "name";
  gameState.totalScore = 0;

  $$("#germany-map path").forEach((p) => {
    p.classList.remove("solved", "perfect", "active");
  });
  $$(".state-label").forEach((l) => {
    l.classList.remove("visible");
  });
  $("#end-screen").classList.remove("open");
  updateHUD();
}

document.addEventListener("DOMContentLoaded", () => {
  $$("#germany-map path").forEach((path) => {
    path.addEventListener("click", () => {
      if (gameState.solved.has(path.id)) return;
      if (gameState.active) return;
      openDialog(path.id);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && gameState.active) {
      closeDialog();
    }
  });

  $("#overlay").addEventListener("click", (e) => {
    if (e.target === $("#overlay")) {
      closeDialog();
    }
  });

  $("#restart-btn").addEventListener("click", resetGame);

  updateHUD();
});
