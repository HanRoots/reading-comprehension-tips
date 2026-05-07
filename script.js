const data = window.READING_DATA;

const state = {
  activeCategory: "all",
  query: "",
};

const palette = [
  "#1d6fb8",
  "#0891b2",
  "#2563eb",
  "#15803d",
  "#0f766e",
  "#b45309",
  "#4338ca",
];

const metricCategories = document.querySelector("#metricCategories");
const metricItems = document.querySelector("#metricItems");
const sourceName = document.querySelector("#sourceName");
const searchInput = document.querySelector("#searchInput");
const categoryTabs = document.querySelector("#categoryTabs");
const catalog = document.querySelector("#catalog");
const resultLine = document.querySelector("#resultLine");

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function highlight(value) {
  const safe = escapeHtml(value);
  const query = state.query.trim();

  if (!query) {
    return safe;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp(escapedQuery, "gi"), (match) => `<mark>${match}</mark>`);
}

function compactCategoryName(name) {
  return name.replace(/^([一二三四五六七八九十]+)、/, "");
}

function itemMatches(item) {
  const inCategory = state.activeCategory === "all" || item.category === state.activeCategory;
  const query = state.query.trim().toLowerCase();
  const haystack = [item.category, item.rawTitle, item.question, item.method, item.template]
    .join(" ")
    .toLowerCase();

  return inCategory && (!query || haystack.includes(query));
}

function renderMetrics() {
  metricCategories.textContent = data.stats.categoryCount;
  metricItems.textContent = data.stats.itemCount;
  sourceName.textContent = `数据来源：${data.source}`;
}

function renderTabs() {
  const allButton = makeTab({
    name: "全部",
    count: data.stats.itemCount,
    value: "all",
  });
  categoryTabs.append(allButton);

  data.categories.forEach((category) => {
    categoryTabs.append(
      makeTab({
        name: compactCategoryName(category.name),
        count: category.count,
        value: category.name,
      }),
    );
  });
}

function makeTab({ name, count, value }) {
  const button = document.createElement("button");
  button.className = "categoryTab";
  button.type = "button";
  button.setAttribute("aria-selected", String(state.activeCategory === value));
  button.dataset.category = value;
  button.innerHTML = `
    <span class="tabText">${escapeHtml(name)}</span>
    <span class="tabCount">${count}</span>
  `;
  button.addEventListener("click", () => {
    state.activeCategory = value;
    document.querySelectorAll(".categoryTab").forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab.dataset.category === value));
    });
    renderCatalog();
  });
  return button;
}

function groupItems(items) {
  return data.categories
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category.name),
    }))
    .filter((group) => group.items.length > 0);
}

function renderCatalog() {
  const visibleItems = data.items.filter(itemMatches);
  const selectedLabel =
    state.activeCategory === "all" ? "全部类别" : compactCategoryName(state.activeCategory);

  resultLine.textContent = `${selectedLabel} · ${visibleItems.length} / ${data.stats.itemCount} 条`;
  catalog.innerHTML = "";

  if (visibleItems.length === 0) {
    catalog.innerHTML = `<div class="emptyState">没有匹配的阅读技巧。</div>`;
    return;
  }

  groupItems(visibleItems).forEach(({ category, items }, groupIndex) => {
    const section = document.createElement("section");
    section.className = "categorySection";
    section.style.setProperty("--accent", palette[groupIndex % palette.length]);
    section.innerHTML = `
      <div class="categoryHeader">
        <h2>${escapeHtml(category.name)}</h2>
        <div class="categoryMeta">${items.length} 条</div>
      </div>
      <div class="tipsGrid">
        ${items.map((item) => renderTipCard(item)).join("")}
      </div>
    `;
    catalog.append(section);
  });
}

function renderTipCard(item) {
  const number = item.number ? String(item.number).padStart(2, "0") : "•";
  return `
    <article class="tipCard">
      <div class="tipCard__top">
        <div class="tipNumber">${number}</div>
        <div>
          <h3>${highlight(item.title)}</h3>
          <div class="tipCategory">${escapeHtml(compactCategoryName(item.category))}</div>
        </div>
      </div>
      <div class="infoBlock">
        <strong>常考问法</strong>
        <p>${highlight(item.question)}</p>
      </div>
      <div class="infoBlock methodBlock">
        <strong>口诀 / 方法精要</strong>
        <p>${highlight(item.method)}</p>
      </div>
      <div class="infoBlock templateBlock">
        <strong>答题模板 / 注意事项</strong>
        <p>${highlight(item.template)}</p>
      </div>
    </article>
  `;
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderCatalog();
});

renderMetrics();
renderTabs();
renderCatalog();
