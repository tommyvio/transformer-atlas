const promptInput = document.getElementById("promptInput");
const runPrompt = document.getElementById("runPrompt");
const randomPrompt = document.getElementById("randomPrompt");
const copyLink = document.getElementById("copyLink");
const tokenCount = document.getElementById("tokenCount");
const headSelect = document.getElementById("headSelect");
const stageTitle = document.getElementById("stageTitle");
const stageBody = document.getElementById("stageBody");
const stageTag = document.getElementById("stageTag");
const toast = document.getElementById("toast");
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const scenes = [
  {
    title: "Tokenization",
    tag: "Step 01",
    body:
      "Transformers begin by slicing text into tokens. Each token becomes a discrete unit the model can reason about.",
  },
  {
    title: "Embeddings",
    tag: "Step 02",
    body:
      "Every token maps to a dense vector. Nearby vectors represent related meaning and structure.",
  },
  {
    title: "Self-Attention",
    tag: "Step 03",
    body:
      "Tokens decide which other tokens matter. Attention weights are the model’s spotlight system.",
  },
  {
    title: "Feed-Forward + Residual",
    tag: "Step 04",
    body:
      "A nonlinear mixing step refines each token. Residual paths keep signal stable while adding depth.",
  },
  {
    title: "Prediction",
    tag: "Step 05",
    body:
      "The final vectors become probabilities over the vocabulary to choose the next token.",
  },
];

const prompts = [
  "I want a plan that feels smart, calm, and surprisingly simple.",
  "We launch at dawn, but the forecast says the winds may shift.",
  "Explain transformers in plain language without using math.",
  "Design a product demo that feels cinematic and easy to follow.",
];

const state = {
  tokens: [],
  activeScene: 0,
  head: 0,
  seed: 0,
  manualSceneAt: 0,
  width: 0,
  height: 0,
};

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tokenize(text) {
  return text
    .trim()
    .split(/(\s+|[.,!?])/)
    .filter((token) => token.trim().length)
    .slice(0, 12);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 1600);
}

function updateSceneInfo(index) {
  const scene = scenes[index];
  stageTitle.textContent = scene.title;
  stageBody.textContent = scene.body;
  stageTag.textContent = scene.tag;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  state.width = rect.width;
  state.height = rect.height;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawTokens() {
  const tokens = state.tokens;
  const padding = 18;
  const gap = 10;
  let x = padding;
  let y = padding + 10;
  ctx.font = "14px Manrope";

  tokens.forEach((token) => {
    const width = ctx.measureText(token).width + 20;
    ctx.fillStyle = "rgba(122, 240, 255, 0.12)";
    ctx.strokeStyle = "rgba(122, 240, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, 28, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#eef1ff";
    ctx.fillText(token, x + 10, y + 19);
    x += width + gap;
    if (x + width > state.width - padding) {
      x = padding;
      y += 40;
    }
  });
}

function drawEmbeddings() {
  const tokens = state.tokens;
  const padding = Math.min(26, state.height * 0.16);
  const barWidth = Math.max(18, (state.width - padding * 2) / tokens.length - 10);
  const maxHeight = state.height - padding * 2 - 40;

  tokens.forEach((token, i) => {
    const seed = state.seed + i * 31 + state.head * 7;
    const height = 60 + rand(seed) * maxHeight * 0.6;
    const x = padding + i * (barWidth + 10);
    const y = state.height - padding - height;

    ctx.fillStyle = "rgba(255, 139, 209, 0.6)";
    ctx.fillRect(x, y, barWidth, height);
    ctx.fillStyle = "#9aa6c6";
    ctx.font = "12px Manrope";
    ctx.fillText(token, x, state.height - padding + 12);
  });
}

function drawAttention() {
  const tokens = state.tokens;
  const padding = Math.min(36, state.height * 0.18);
  const yTop = padding + 6;
  const yBottom = state.height - padding;
  const gap = (state.width - padding * 2) / Math.max(tokens.length - 1, 1);

  tokens.forEach((token, i) => {
    const x = padding + i * gap;
    ctx.fillStyle = "#eef1ff";
    ctx.beginPath();
    ctx.arc(x, yTop, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9aa6c6";
    ctx.font = "12px Manrope";
    const labelY = Math.max(16, yTop - 14);
    ctx.fillText(token, x - 10, labelY);

    ctx.fillStyle = "#7af0ff";
    ctx.beginPath();
    ctx.arc(x, yBottom, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  tokens.forEach((_, i) => {
    tokens.forEach((__, j) => {
      const seed = state.seed + i * 23 + j * 11 + state.head * 101;
      const weight = rand(seed);
      if (weight < 0.35) return;
      const x1 = padding + i * gap;
      const x2 = padding + j * gap;
      ctx.strokeStyle = `rgba(122, 240, 255, ${0.1 + weight * 0.5})`;
      ctx.lineWidth = 1 + weight * 1.4;
      ctx.beginPath();
      ctx.moveTo(x1, yTop + 12);
      ctx.lineTo(x2, yBottom - 12);
      ctx.stroke();
    });
  });
}

function drawResidual() {
  const tokens = state.tokens;
  const padding = Math.min(26, state.height * 0.16);
  const available = state.height - padding * 2;
  const laneHeight = Math.min(
    30,
    Math.max(20, (available - (tokens.length - 1) * 10) / tokens.length)
  );

  tokens.forEach((token, i) => {
    const y = padding + i * (laneHeight + 12);
    const baseWidth = state.width - padding * 2;
    const seed = state.seed + i * 17 + state.head * 29;
    const fill = baseWidth * (0.4 + rand(seed) * 0.6);

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(padding, y, baseWidth, laneHeight);
    ctx.fillStyle = "rgba(122, 240, 255, 0.55)";
    ctx.fillRect(padding, y, fill, laneHeight);
    ctx.fillStyle = "#9aa6c6";
    ctx.font = "12px Manrope";
    ctx.fillText(token, padding, y - 6);
  });
}

function drawPrediction() {
  const options = getPredictionOptions();
  const padding = Math.min(28, state.height * 0.14);
  const barWidth = state.width - padding * 2;
  const available = state.height - padding * 2;
  const barHeight = Math.min(26, Math.max(18, available / options.length - 10));
  const gap = Math.max(8, (available - options.length * barHeight) / Math.max(options.length - 1, 1));

  options.forEach((token, i) => {
    const seed = state.seed + i * 13 + state.head * 9;
    const score = 0.25 + rand(seed) * 0.7;
    const y = padding + i * (barHeight + gap);
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(padding, y, barWidth, barHeight);
    ctx.fillStyle = "rgba(255, 139, 209, 0.7)";
    ctx.fillRect(padding, y, barWidth * score, barHeight);
    ctx.fillStyle = "#eef1ff";
    ctx.font = "13px Manrope";
    ctx.fillText(token, padding + 8, y + barHeight - 8);
    ctx.fillStyle = "#9aa6c6";
    ctx.fillText(
      `${Math.round(score * 100)}%`,
      padding + barWidth - 48,
      y + barHeight - 8
    );
  });
}

function getPredictionOptions() {
  const base = [
    "strategy",
    "plan",
    "clarity",
    "flow",
    "calm",
    "focus",
    "signal",
    "context",
    "insight",
    "pattern",
    "direction",
    "tradeoff",
  ];
  const tokens = state.tokens
    .map((token) => token.toLowerCase())
    .filter((token) => /^[a-z]/.test(token) && token.length > 2);
  const pool = Array.from(new Set([...tokens, ...base]));
  const randLocal = mulberry32(hashString(`${promptInput.value}:${state.head}`));
  const chosen = [];

  tokens.forEach((token) => {
    if (chosen.length < 3 && !chosen.includes(token)) {
      chosen.push(token);
    }
  });

  while (chosen.length < 6 && pool.length) {
    const index = Math.floor(randLocal() * pool.length);
    const token = pool.splice(index, 1)[0];
    if (!chosen.includes(token)) chosen.push(token);
  }
  return chosen.slice(0, 6);
}

function renderScene() {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.fillStyle = "rgba(7, 9, 16, 0.9)";
  ctx.fillRect(0, 0, state.width, state.height);

  if (state.activeScene === 0) drawTokens();
  if (state.activeScene === 1) drawEmbeddings();
  if (state.activeScene === 2) drawAttention();
  if (state.activeScene === 3) drawResidual();
  if (state.activeScene === 4) drawPrediction();
}

function updateTokens() {
  state.tokens = tokenize(promptInput.value);
  tokenCount.textContent = state.tokens.length.toString();
  state.seed = hashString(promptInput.value);
  renderScene();
}

function copyShareLink() {
  const url = new URL(window.location.href);
  url.searchParams.set("prompt", promptInput.value.trim());
  navigator.clipboard.writeText(url.toString()).then(() => {
    showToast("Link copied");
  });
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const prompt = params.get("prompt");
  if (prompt) promptInput.value = prompt;
}

const chapters = Array.from(document.querySelectorAll(".chapter"));

function setActiveScene(sceneIndex) {
  state.activeScene = sceneIndex;
  state.manualSceneAt = Date.now();
  updateSceneInfo(sceneIndex);
  chapters.forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.scene) === sceneIndex);
    el.setAttribute(
      "aria-pressed",
      Number(el.dataset.scene) === sceneIndex ? "true" : "false"
    );
  });
  renderScene();
}

chapters.forEach((chapter) => {
  chapter.addEventListener("click", () => {
    setActiveScene(Number(chapter.dataset.scene));
    chapter.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  chapter.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveScene(Number(chapter.dataset.scene));
    }
  });
});

runPrompt.addEventListener("click", updateTokens);
randomPrompt.addEventListener("click", () => {
  promptInput.value = prompts[Math.floor(Math.random() * prompts.length)];
  updateTokens();
  showToast("Surprise prompt loaded");
});

headSelect.addEventListener("input", (event) => {
  state.head = Number(event.target.value);
  renderScene();
});

copyLink.addEventListener("click", copyShareLink);
window.addEventListener("resize", () => {
  resizeCanvas();
  renderScene();
});

loadFromURL();
resizeCanvas();
updateTokens();
