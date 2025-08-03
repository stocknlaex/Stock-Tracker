const API_KEY = "d27igopr01qloarj8g0gd27igopr01qloarj8g10";
const API_URL = "https://finnhub.io/api/v1/quote";

async function fetchPrice(ticker) {
  const key = `fetchCount_${ticker}`;
  const lastData = JSON.parse(localStorage.getItem(key)) || { count: 0, date: "", lastFetched: null };

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const hour = now.getUTCHours(); // Use UTC to avoid timezone errors
  const isUSMarketOpen = hour >= 13.5 && hour <= 20; // 9:30am–4:00pm EST = 13:30–20:00 UTC

  if (lastData.date !== today) {
    lastData.count = 0;
    lastData.date = today;
  }

  if (lastData.count >= 15 || !isUSMarketOpen) {
    console.warn(`Fetch skipped for ${ticker}: limit reached or market closed`);
    return "—"; // Or show cached price if stored
  }

  try {
    const res = await fetch(`${API_URL}?symbol=${ticker}&token=${API_KEY}`);
    const data = await res.json();

    if (!data.c) throw new Error("Price missing");

    lastData.count += 1;
    lastData.lastFetched = now.toISOString();
    localStorage.setItem(key, JSON.stringify(lastData));
    return data.c.toFixed(2);
  } catch (err) {
    console.error(`Error fetching ${ticker}:`, err);
    return "N/A";
  }
}

function saveToLocalStorage() {
  const rows = document.querySelectorAll("#tableBody tr");
  const data = Array.from(rows).map(row => ({
    ticker: row.querySelector(".ticker").innerText,
    manual: row.querySelector(".manual").value,
    percent: row.querySelector(".percent").value,
    comment: row.querySelector(".comment").value
  }));
  localStorage.setItem("stocks", JSON.stringify(data));
}

async function addStock() {
  const input = document.getElementById("tickerInput");
  const ticker = input.value.trim().toUpperCase();
  if (!ticker) return;
  input.value = "";

  const tbody = document.getElementById("tableBody");
  const row = document.createElement("tr");

  const price = await fetchPrice(ticker);

  row.innerHTML = `
    <td class="ticker">${ticker}</td>
    <td class="price">${price}</td>
    <td><input class="manual" type="number" /></td>
    <td>
      <select class="percent">
        <option>5%</option><option selected>10%</option><option>15%</option><option>20%</option>
      </select>
    </td>
    <td class="target">N/A</td>
    <td><input class="comment" maxlength="500" placeholder="Add comments..." /></td>
    <td><span class="delete-btn" onclick="deleteRow(this)">❌</span></td>
  `;

  tbody.appendChild(row);
  addListeners(row);
  saveToLocalStorage();
}

function deleteRow(btn) {
  const row = btn.closest("tr");
  row.remove();
  saveToLocalStorage();
}

function addListeners(row) {
  const manual = row.querySelector(".manual");
  const percent = row.querySelector(".percent");

  function updateTarget() {
    const base = parseFloat(manual.value);
    const pct = parseInt(percent.value);
    if (!isNaN(base)) {
      const drop = base * (1 - pct / 100);
      row.querySelector(".target").innerText = drop.toFixed(2);
    } else {
      row.querySelector(".target").innerText = "N/A";
    }
    saveToLocalStorage();
  }

  manual.addEventListener("input", updateTarget);
  percent.addEventListener("change", updateTarget);
  row.querySelector(".comment").addEventListener("input", saveToLocalStorage);
}

function resetTable() {
  localStorage.removeItem("stocks");
  document.getElementById("tableBody").innerHTML = "";
}

function showOpportunities() {
  const rows = document.querySelectorAll("#tableBody tr");
  rows.forEach(row => {
    const current = parseFloat(row.querySelector(".price").innerText);
    const target = parseFloat(row.querySelector(".target").innerText);
    if (!isNaN(current) && !isNaN(target) && current <= target) {
      row.style.backgroundColor = "#d4edda";
    } else {
      row.style.backgroundColor = "";
    }
  });
}

async function loadFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem("stocks") || "[]");
  for (const stock of saved) {
    document.getElementById("tickerInput").value = stock.ticker;
    await addStock();

    const lastRow = document.querySelector("#tableBody tr:last-child");
    lastRow.querySelector(".manual").value = stock.manual;
    lastRow.querySelector(".percent").value = stock.percent;
    lastRow.querySelector(".comment").value = stock.comment;

    const event = new Event("input");
    lastRow.querySelector(".manual").dispatchEvent(event);
  }
}

window.addEventListener("load", loadFromLocalStorage);