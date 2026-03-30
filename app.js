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
  };

  const state = {
    data: null,
    subjects: null,
    order: [],
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

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

  function renderTasks() {
    const subjectKey = dom.subjectTasks.value;
    const tasks = state.subjects[subjectKey].task_scores;

    dom.tasksList.innerHTML = "";
    tasks.forEach((maxScore, i) => {
      const row = document.createElement("div");
      row.className = "task-row";

      const label = document.createElement("span");
      label.textContent = `№${i + 1} (макс. ${maxScore})`;

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = String(maxScore);
      input.step = "1";
      input.value = "0";
      input.dataset.maxScore = String(maxScore);

      row.appendChild(label);
      row.appendChild(input);
      dom.tasksList.appendChild(row);
    });

    dom.resultTasks.textContent = "";
  }

  function updateMode() {
    const isTasks = dom.mode.value === "by_tasks";
    dom.modeByTasks.classList.toggle("hidden", !isTasks);
    dom.modeByPrimary.classList.toggle("hidden", isTasks);
  }

  function handleCalcTasks() {
    const subjectKey = dom.subjectTasks.value;
    const inputs = dom.tasksList.querySelectorAll("input");

    let total = 0;
    for (const input of inputs) {
      const maxScore = parseIntSafe(input.dataset.maxScore);
      const value = clamp(parseIntSafe(input.value), 0, maxScore);
      input.value = String(value);
      total += value;
    }

    dom.resultTasks.textContent = calcByPrimary(subjectKey, total);
  }

  function handleCalcPrimary() {
    const subjectKey = dom.subjectPrimary.value;
    const primary = parseIntSafe(dom.primaryInput.value);
    dom.primaryInput.value = String(Math.max(0, primary));
    dom.resultPrimary.textContent = calcByPrimary(subjectKey, primary);
  }

  async function init() {
    const response = await fetch("data/ege_2026.json", { cache: "no-store" });
    state.data = await response.json();
    state.subjects = state.data.subjects;
    state.order = state.data.subjects_order;

    setSubjectOptions(dom.subjectTasks);
    setSubjectOptions(dom.subjectPrimary);
    renderTasks();

    dom.mode.addEventListener("change", updateMode);
    dom.subjectTasks.addEventListener("change", renderTasks);
    dom.calcTasks.addEventListener("click", handleCalcTasks);
    dom.calcPrimary.addEventListener("click", handleCalcPrimary);
  }

  init().catch((err) => {
    console.error(err);
    dom.resultTasks.textContent = "Ошибка загрузки данных. Проверьте файл data/ege_2026.json.";
    dom.resultPrimary.textContent = "Ошибка загрузки данных. Проверьте файл data/ege_2026.json.";
  });
})();
