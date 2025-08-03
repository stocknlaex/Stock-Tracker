const apiKey = 'd274679r01qloarhe5kgd274679r01qloarhe5l0';

async function fetchPrice(ticker) {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
    const data = await res.json();
    return data.c;
  } catch (err) {
    console.error(`Error fetching ${ticker}:`, err);
    return null;
  }
}

async function updatePrices() {
  const rows = document.querySelectorAll('#stock-table tbody tr');
  for (const row of rows) {
    const ticker = row.dataset.ticker;
    const current = await fetchPrice(ticker);
    if (!current) continue;

    row.querySelector('.current-price').textContent = current.toFixed(2);

    const manualInput = row.querySelector('.manual-price');
    const percentSelect = row.querySelector('.percent-select');
    const recommendedCell = row.querySelector('.recommended-price');
    const commentsInput = row.querySelector('.comments');

    const manualVal = parseFloat(manualInput.value);
    const percent = parseFloat(percentSelect.value);

    if (!isNaN(manualVal)) {
      const target = (manualVal * (1 - percent)).toFixed(2);
      recommendedCell.textContent = target;
      localStorage.setItem(`price_${ticker}`, manualVal);
      localStorage.setItem(`percent_${ticker}`, percent);

      if (current <= target) {
        recommendedCell.style.backgroundColor = 'lightgreen';
      } else {
        recommendedCell.style.backgroundColor = '';
      }
    }

    if (commentsInput) {
      localStorage.setItem(`comment_${ticker}`, commentsInput.value);
    }
  }
}

function addStock(tickerInputOrEvent, silent = false) {
  let ticker = typeof tickerInputOrEvent === "string"
    ? tickerInputOrEvent
    : document.getElementById('new-ticker').value.toUpperCase().trim();

  if (!ticker) return;

  const tableBody = document.querySelector('#stock-table tbody');
  if (document.querySelector(`tr[data-ticker="${ticker}"]`)) return;

  const newRow = document.createElement('tr');
  newRow.setAttribute('data-ticker', ticker);
  newRow.innerHTML = `
    <td>${ticker}</td>
    <td class="current-price">-</td>
    <td><input class="manual-price" type="number" /></td>
    <td>
      <select class="percent-select">
        <option value="0.10">10%</option>
        <option value="0.05">5%</option>
        <option value="0.15">15%</option>
        <option value="0.20">20%</option>
      </select>
    </td>
    <td class="recommended-price">-</td>
    <td><textarea class="comments" maxlength="500" placeholder="Add notes..."></textarea></td>
    <td><button onclick="removeRow(this)">â</button></td>
  `;

  tableBody.appendChild(newRow);
  if (typeof tickerInputOrEvent !== "string") {
    document.getElementById('new-ticker').value = '';
  }

  const manualInput = newRow.querySelector('.manual-price');
  const percentSelect = newRow.querySelector('.percent-select');
  const commentsInput = newRow.querySelector('.comments');

  const savedPrice = localStorage.getItem(`price_${ticker}`);
  if (savedPrice) manualInput.value = savedPrice;

  const savedPercent = localStorage.getItem(`percent_${ticker}`);
  if (savedPercent) percentSelect.value = savedPercent;

  const savedComment = localStorage.getItem(`comment_${ticker}`);
  if (savedComment) commentsInput.value = savedComment;

  manualInput.addEventListener('input', updatePrices);
  percentSelect.addEventListener('change', updatePrices);
  commentsInput.addEventListener('input', () => {
    localStorage.setItem(`comment_${ticker}`, commentsInput.value);
  });

  if (!silent) {
    let tracked = JSON.parse(localStorage.getItem("trackedTickers")) || [];
    if (!tracked.includes(ticker)) {
      tracked.push(ticker);
      localStorage.setItem("trackedTickers", JSON.stringify(tracked));
    }
  }

  fetchPrice(ticker).then(current => {
    if (current) {
      newRow.querySelector('.current-price').textContent = current.toFixed(2);
      updatePrices();
    }
  });
}

function removeRow(button) {
  const row = button.closest('tr');
  const ticker = row.dataset.ticker;
  row.remove();

  let tracked = JSON.parse(localStorage.getItem("trackedTickers")) || [];
  tracked = tracked.filter(t => t !== ticker);
  localStorage.setItem("trackedTickers", JSON.stringify(tracked));
  localStorage.removeItem(`price_${ticker}`);
  localStorage.removeItem(`percent_${ticker}`);
  localStorage.removeItem(`comment_${ticker}`);
}

function filterGreen() {
  const rows = document.querySelectorAll('#stock-table tbody tr');
  rows.forEach(row => {
    const cell = row.querySelector('.recommended-price');
    row.style.display = cell.style.backgroundColor === 'lightgreen' ? '' : 'none';
  });
}

function resetFilter() {
  const rows = document.querySelectorAll('#stock-table tbody tr');
  rows.forEach(row => row.style.display = '');
}

window.addEventListener("DOMContentLoaded", () => {
  const tracked = JSON.parse(localStorage.getItem("trackedTickers")) || [];
  tracked.forEach(ticker => addStock(ticker, true));
  updatePrices();
  setInterval(updatePrices, 30000);
});
