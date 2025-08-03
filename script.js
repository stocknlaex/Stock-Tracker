const apiKey = 'YOUR_RAPIDAPI_KEY';
const fetchLimit = 15;
let fetchCount = 0;

async function fetchPrice(ticker) {
  const now = new Date();
  const estHour = now.getUTCHours() - 4;
  if (fetchCount >= fetchLimit || estHour < 9 || estHour > 16) return null;

  try {
    const url = `https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary?symbol=${ticker}&region=US`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
      }
    });
    const data = await res.json();
    fetchCount++;
    return data.price?.regularMarketPrice?.raw || null;
  } catch (err) {
    console.error(`Error fetching ${ticker}:`, err);
    return null;
  }
}

function addStock(ticker = '', manual = '', drop = '10%', comment = '') {
  const table = document.getElementById('stock-table');
  const row = document.createElement('tr');
  row.dataset.ticker = ticker.toUpperCase();

  row.innerHTML = `
    <td>${ticker}</td>
    <td class="current-price">N/A</td>
    <td><input class="manual-price" type="number" value="${manual}" /></td>
    <td>
      <select class="drop-percent">
        ${['5%', '10%', '15%', '20%'].map(p => 
          `<option value="${p}" ${p === drop ? 'selected' : ''}>${p}</option>`).join('')}
      </select>
    </td>
    <td class="recommended-price">N/A</td>
    <td><input class="comment-box" maxlength="500" placeholder="Add comments..." value="${comment}" /></td>
    <td><button onclick="deleteRow(this)">❌</button></td>
  `;

  table.appendChild(row);
  attachEvents(row);
  updatePrices();
}

function attachEvents(row) {
  row.querySelector('.manual-price').addEventListener('input', updatePrices);
  row.querySelector('.drop-percent').addEventListener('change', updatePrices);
  row.querySelector('.comment-box').addEventListener('input', saveToLocalStorage);
}

async function updatePrices() {
  const rows = document.querySelectorAll('#stock-table tr');
  for (const row of rows) {
    const ticker = row.dataset.ticker;
    const manualVal = parseFloat(row.querySelector('.manual-price').value);
    const dropPercent = parseFloat(row.querySelector('.drop-percent').value.replace('%', ''));

    const currentCell = row.querySelector('.current-price');
    const recCell = row.querySelector('.recommended-price');

    const price = await fetchPrice(ticker);
    currentCell.textContent = price ? price.toFixed(2) : 'N/A';

    if (!isNaN(manualVal)) {
      const target = (manualVal * (1 - dropPercent / 100)).toFixed(2);
      recCell.textContent = target;
    } else {
      recCell.textContent = 'N/A';
    }
  }

  saveToLocalStorage();
}

function deleteRow(btn) {
  btn.closest('tr').remove();
  saveToLocalStorage();
}

function showBuyOpportunities() {
  const rows = document.querySelectorAll('#stock-table tr');
  rows.forEach(row => {
    const recPrice = parseFloat(row.querySelector('.recommended-price').textContent);
    const current = parseFloat(row.querySelector('.current-price').textContent);
    const cell = row.querySelector('.recommended-price');
    cell.style.backgroundColor = (!isNaN(current) && current <= recPrice) ? 'lightgreen' : '';
  });
}

function resetTable() {
  document.getElementById('stock-table').innerHTML = '';
  localStorage.removeItem('stocks');
  fetchCount = 0;
}

function saveToLocalStorage() {
  const rows = [...document.querySelectorAll('#stock-table tr')].map(row => ({
    ticker: row.dataset.ticker,
    manual: row.querySelector('.manual-price').value,
    drop: row.querySelector('.drop-percent').value,
    comment: row.querySelector('.comment-box').value
  }));
  localStorage.setItem('stocks', JSON.stringify(rows));
}

function loadFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem('stocks') || '[]');
  for (const item of saved) {
    addStock(item.ticker, item.manual, item.drop, item.comment);
  }
}

window.onload = loadFromLocalStorage;