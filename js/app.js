"use strict";

const STORAGE_KEY = "expense-tracker:transactions";

// Danh mục cố định; mỗi danh mục gắn với một slot màu cố định (không xoay vòng)
const CATEGORIES = {
  expense: [
    { id: "an-uong", label: "Ăn uống", series: 1 },
    { id: "di-chuyen", label: "Di chuyển", series: 2 },
    { id: "mua-sam", label: "Mua sắm", series: 3 },
    { id: "hoa-don", label: "Hóa đơn", series: 4 },
    { id: "giai-tri", label: "Giải trí", series: 5 },
    { id: "suc-khoe", label: "Sức khỏe", series: 6 },
    { id: "giao-duc", label: "Giáo dục", series: 7 },
    { id: "khac-chi", label: "Khác", series: 8 },
  ],
  income: [
    { id: "luong", label: "Lương", series: 1 },
    { id: "thuong", label: "Thưởng", series: 3 },
    { id: "khac-thu", label: "Khác", series: 7 },
  ],
};

const ALL_CATEGORIES = [...CATEGORIES.expense, ...CATEGORIES.income];

const fmtVND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const fmtDate = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });

// ===== Lưu trữ =====
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    // Trình duyệt chặn localStorage (chế độ riêng tư…): app vẫn chạy, dữ liệu không được giữ lại
  }
}

let transactions = loadTransactions();

// ===== DOM =====
const form = document.getElementById("transaction-form");
const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const categorySelect = document.getElementById("category");
const monthFilter = document.getElementById("month-filter");
const listEl = document.getElementById("transaction-list");
const emptyEl = document.getElementById("empty-state");
const chartEl = document.getElementById("category-chart");
const txCountEl = document.getElementById("tx-count");

function currentType() {
  return form.elements.type.value;
}

function fillCategorySelect() {
  const cats = CATEGORIES[currentType()];
  categorySelect.innerHTML = "";
  for (const cat of cats) {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.label;
    categorySelect.appendChild(opt);
  }
}

function categoryById(id) {
  return ALL_CATEGORIES.find((c) => c.id === id) || { label: "Khác", series: 8 };
}

function monthOf(dateStr) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function visibleTransactions() {
  const month = monthFilter.value;
  return transactions
    .filter((tx) => monthOf(tx.date) === month)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
}

// ===== Render =====
function render() {
  const visible = visibleTransactions();

  // Tổng quan
  let income = 0;
  let expense = 0;
  for (const tx of visible) {
    if (tx.type === "income") income += tx.amount;
    else expense += tx.amount;
  }
  document.getElementById("total-income").textContent = fmtVND.format(income);
  document.getElementById("total-expense").textContent = fmtVND.format(expense);
  const balanceEl = document.getElementById("balance");
  const balance = income - expense;
  balanceEl.textContent = fmtVND.format(balance);
  balanceEl.classList.toggle("expense", balance < 0);

  renderList(visible);
  renderChart(visible);
}

function renderList(visible) {
  listEl.innerHTML = "";
  emptyEl.hidden = visible.length > 0;
  txCountEl.textContent = visible.length ? `${visible.length} giao dịch` : "";

  for (const tx of visible) {
    const cat = categoryById(tx.category);
    const li = document.createElement("li");
    li.className = "tx-item";

    const dot = document.createElement("span");
    dot.className = "tx-dot";
    dot.style.background = `var(--series-${cat.series})`;

    const info = document.createElement("div");
    info.className = "tx-info";
    const desc = document.createElement("div");
    desc.className = "tx-desc";
    desc.textContent = tx.desc;
    const meta = document.createElement("div");
    meta.className = "tx-meta";
    meta.textContent = `${cat.label} · ${fmtDate.format(new Date(tx.date + "T00:00:00"))}`;
    info.append(desc, meta);

    const amount = document.createElement("span");
    amount.className = `tx-amount ${tx.type}`;
    amount.textContent = (tx.type === "income" ? "+" : "−") + fmtVND.format(tx.amount);

    const del = document.createElement("button");
    del.className = "btn-delete";
    del.type = "button";
    del.textContent = "✕";
    del.setAttribute("aria-label", `Xóa giao dịch ${tx.desc}`);
    del.addEventListener("click", () => {
      transactions = transactions.filter((t) => t.id !== tx.id);
      saveTransactions(transactions);
      render();
    });

    li.append(dot, info, amount, del);
    listEl.appendChild(li);
  }
}

function renderChart(visible) {
  chartEl.innerHTML = "";
  const totals = new Map();
  for (const tx of visible) {
    if (tx.type !== "expense") continue;
    totals.set(tx.category, (totals.get(tx.category) || 0) + tx.amount);
  }

  if (totals.size === 0) {
    const p = document.createElement("p");
    p.className = "viz-empty";
    p.textContent = "Chưa có dữ liệu chi tiêu trong tháng này.";
    chartEl.appendChild(p);
    return;
  }

  const rows = [...totals.entries()]
    .map(([id, total]) => ({ cat: categoryById(id), total }))
    .sort((a, b) => b.total - a.total);
  const max = rows[0].total;

  for (const { cat, total } of rows) {
    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = cat.label;

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${Math.max((total / max) * 100, 1.5)}%`;
    fill.style.background = `var(--series-${cat.series})`;
    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = fmtVND.format(total);

    row.append(label, track, value);
    row.title = `${cat.label}: ${fmtVND.format(total)}`;
    chartEl.appendChild(row);
  }
}

// ===== Sự kiện =====
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = Math.round(Number(amountInput.value));
  if (!Number.isFinite(amount) || amount <= 0 || !dateInput.value) return;

  transactions.push({
    id: Date.now(),
    type: currentType(),
    desc: descInput.value.trim(),
    amount,
    category: categorySelect.value,
    date: dateInput.value,
  });
  saveTransactions(transactions);

  // Chuyển bộ lọc sang tháng của giao dịch vừa thêm để người dùng thấy ngay
  monthFilter.value = monthOf(dateInput.value);

  descInput.value = "";
  amountInput.value = "";
  descInput.focus();
  render();
});

for (const radio of form.elements.type) {
  radio.addEventListener("change", fillCategorySelect);
}

monthFilter.addEventListener("change", render);

// ===== Khởi tạo =====
(function init() {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  dateInput.value = todayStr;
  monthFilter.value = todayStr.slice(0, 7);
  fillCategorySelect();
  render();
})();
