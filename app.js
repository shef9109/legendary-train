(() => {
  const dom = {
    mode: document.getElementById("mode"),
    subjectTasks: document.getElementById("subject-tasks"),
    subjectPrimary: document.getElementById("subject-primary"),
    primaryInput: document.getElementById("primary-input"),
    tasksList: document.getElementById("tasks-list"),
    modeByTasks: document.getElementById("mode-by-tasks"),
    modeByPrimary: document.getElementById("mode-by-primary"),
    calcTasks: document.getElementById("calc-tasks"),
    calcPrimary: document.getElementById("calc-primary"),
    resultTasks: document.getElementById("result-tasks"),
    resultPrimary: document.getElementById("result-primary"),
    tasksPrimaryTotal: document.getElementById("tasks-primary-total"),
    installApp: document.getElementById("install-app"),
    iosInstallHint: document.getElementById("ios-install-hint"),
  };

  const state = {
    subjects: null,
    order: [],
    installPromptEvent: null,
  };

  function parseIntSafe(raw) {
    const parsed = Number.parseInt(String(raw), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function setSubjectOptions(select) {
    select.innerHTML = "";
    for (const key of state.order) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = state.subjects[key].name;
      select.appendChild(option);
    }
  }

  function calcByPrimary(subjectKey, primaryRaw) {
    const subject = state.subjects[subjectKey];
    const primary = Math.max(0, parseIntSafe(primaryRaw));

    if (subject.conversion_type === "grade") {
      let grade = 2;
      for (const row of subject.grade_ranges) {
        if (primary >= row.from && primary <= row.to) {
          grade = row.grade;
          break;
        }
      }
      if (primary > subject.grade_ranges[subject.grade_ranges.length - 1].to) {
        grade = subject.grade_ranges[subject.grade_ranges.length - 1].grade;
      }
      return `Первичный балл: ${primary}. Оценка: ${grade}`;
    }

    const conversion = Object.fromEntries(
      Object.entries(subject.conversion).map(([k, v]) => [Number(k), v]),
    );
    const keys = Object.keys(conversion).map(Number).sort((a, b) => a - b);

    let test = 0;
    if (primary > 0) {
      if (conversion[primary] !== undefined) {
        test = conversion[primary];
      } else if (primary > keys[keys.length - 1]) {
        test = conversion[keys[keys.length - 1]];
      } else {
        const lower = keys.filter((k) => k <= primary);
        test = lower.length ? conversion[lower[lower.length - 1]] : 0;
      }
    }

    return `Первичный балл: ${primary}. Тестовый балл: ${test}`;
  }

  function updateTasksTotal() {
    const rows = dom.tasksList.querySelectorAll(".task-row");
    let total = 0;
    rows.forEach((row) => {
      total += parseIntSafe(row.dataset.selected);
    });
    dom.tasksPrimaryTotal.textContent = `Первичный балл: ${total}`;
    return total;
  }

  function renderTasks() {
    const subjectKey = dom.subjectTasks.value;
    const tasks = state.subjects[subjectKey].task_scores;

    dom.tasksList.innerHTML = "";

    tasks.forEach((maxScore, i) => {
      const row = document.createElement("div");
      row.className = "task-row";
      row.dataset.selected = "0";

      const label = document.createElement("span");
      label.textContent = `№${i + 1} (макс. ${maxScore})`;

      const scoreButtons = document.createElement("div");
      scoreButtons.className = "score-buttons";

      for (let score = 0; score <= maxScore; score += 1) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "score-btn";
        if (score === 0) {
          btn.classList.add("is-active");
        }
        btn.dataset.score = String(score);
        btn.textContent = String(score);
        scoreButtons.appendChild(btn);
      }

      row.appendChild(label);
      row.appendChild(scoreButtons);
      dom.tasksList.appendChild(row);
    });

    dom.tasksPrimaryTotal.textContent = "Первичный балл: 0";
    dom.resultTasks.textContent = "";
  }

  function updateMode() {
    const isTasks = dom.mode.value === "by_tasks";
    dom.modeByTasks.classList.toggle("hidden", !isTasks);
    dom.modeByPrimary.classList.toggle("hidden", isTasks);
  }

  function handleCalcTasks() {
    const subjectKey = dom.subjectTasks.value;
    const total = updateTasksTotal();
    dom.resultTasks.textContent = calcByPrimary(subjectKey, total);
  }

  function handleCalcPrimary() {
    const subjectKey = dom.subjectPrimary.value;
    const primary = Math.max(0, parseIntSafe(dom.primaryInput.value));
    dom.primaryInput.value = String(primary);
    dom.resultPrimary.textContent = calcByPrimary(subjectKey, primary);
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function isStandaloneMode() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function initPwaUI() {
    if (isIos() && !isStandaloneMode()) {
      dom.iosInstallHint.classList.remove("hidden");
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.installPromptEvent = event;
      dom.installApp.classList.remove("hidden");
    });

    dom.installApp.addEventListener("click", async () => {
      if (!state.installPromptEvent) {
        return;
      }
      state.installPromptEvent.prompt();
      await state.installPromptEvent.userChoice;
      state.installPromptEvent = null;
      dom.installApp.classList.add("hidden");
    });

    window.addEventListener("appinstalled", () => {
      dom.installApp.classList.add("hidden");
      dom.iosInstallHint.classList.add("hidden");
    });
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    try {
      await navigator.serviceWorker.register("sw.js");
    } catch (error) {
      console.error("SW registration failed", error);
    }
  }

  async function init() {
    const response = await fetch("data/ege_2026.json", { cache: "no-store" });
    const data = await response.json();
    state.subjects = data.subjects;
    state.order = data.subjects_order;

    setSubjectOptions(dom.subjectTasks);
    setSubjectOptions(dom.subjectPrimary);
    renderTasks();

    dom.mode.addEventListener("change", updateMode);
    dom.subjectTasks.addEventListener("change", renderTasks);

    dom.tasksList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.classList.contains("score-btn")) {
        return;
      }
      const row = target.closest(".task-row");
      if (!row) {
        return;
      }
      row.dataset.selected = target.dataset.score || "0";
      row.querySelectorAll(".score-btn").forEach((btn) => btn.classList.remove("is-active"));
      target.classList.add("is-active");
      updateTasksTotal();
    });

    dom.calcTasks.addEventListener("click", handleCalcTasks);
    dom.calcPrimary.addEventListener("click", handleCalcPrimary);

    initPwaUI();
    registerServiceWorker();
  }

  init().catch((err) => {
    console.error(err);
    dom.resultTasks.textContent = "Ошибка загрузки данных. Проверьте файл data/ege_2026.json.";
    dom.resultPrimary.textContent = "Ошибка загрузки данных. Проверьте файл data/ege_2026.json.";
  });
})();
