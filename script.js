const apiKey = 'd27igopr01qloarj8g0gd27igopr01qloarj8g10';

async function fetchPrice(ticker) {
  try {
    const url = `https://corsproxy.io/?https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.c;
  } catch (err) {
    console.error(`Error fetching ${ticker}:`, err);
    return null;
  }
}

function saveToLocalStorage() {
  const rows = [...document.querySelectorAll('#stock-table tbody tr')].map(row => ({
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

async function updatePrices() {
  const rows = document.querySelectorAll('#stock-table tbody tr');
  for (const row of rows) {
    const ticker = row.dataset.ticker;
    try {
      const current = await fetchPrice(ticker);
      row.querySelector('.current-price').textContent = current?.toFixed(2) || 'N/A';

      const manualVal = parseFloat(row.querySelector('.manual-price').value);
      const dropVal = parseFloat(row.querySelector('.drop-percent').value);
      const recommendedCell = row.querySelector('.recommended-price');

      if (!isNaN(manualVal) && !isNaN(dropVal)) {
        const target = (manualVal * (1 - dropVal / 100)).toFixed(2);
        recommendedCell.textContent = target;
        recommendedCell.style.backgroundColor = (current <= target) ? 'lightgreen' : '';
      } else {
        recommendedCell.textContent = 'N/A';
        recommendedCell.style.backgroundColor = '';
      }
    } catch (e) {
      console.error(`Error fetching price for ${ticker}`, e);
    }
  }
  saveToLocalStorage();
}

function addStock(ticker, manual = '', drop = '10', comment = '') {
  if (!ticker) return;
  ticker = ticker.toUpperCase().trim();
  const tableBody = document.querySelector('#stock-table tbody');

  const newRow = document.createElement('tr');
  newRow.setAttribute('data-ticker', ticker);
  newRow.innerHTML = `
    <td>${ticker}</td>
    <td class="current-price">...</td>
    <td><input class="manual-price" type="number" value="${manual}"/></td>
    <td>
      <select class="drop-percent">
        <option value="5"${drop === '5' ? ' selected' : ''}>5%</option>
        <option value="10"${drop === '10' ? ' selected' : ''}>10%</option>
        <option value="15"${drop === '15' ? ' selected' : ''}>15%</option>
        <option value="20"${drop === '20' ? ' selected' : ''}>20%</option>
      </select>
    </td>
    <td class="recommended-price">...</td>
    <td><input class="comment-box" maxlength="500" placeholder="Add comments here..." value="${comment}"/></td>
    <td><button onclick="this.closest('tr').remove(); saveToLocalStorage();">❌</button></td>
  `;
  tableBody.appendChild(newRow);

  newRow.querySelector('.manual-price').addEventListener('input', updatePrices);
  newRow.querySelector('.drop-percent').addEventListener('change', updatePrices);
  newRow.querySelector('.comment-box').addEventListener('input', saveToLocalStorage);

  fetchPrice(ticker).then(current => {
    if (current) {
      newRow.querySelector('.current-price').textContent = current.toFixed(2);
      updatePrices();
    }
  });
}

document.getElementById('add-stock-btn').addEventListener('click', () => {
  const input = document.getElementById('new-ticker');
  addStock(input.value);
  input.value = '';
});

document.getElementById('reset-btn').addEventListener('click', () => {
  localStorage.removeItem('stocks');
  location.reload();
});

document.getElementById('show-buy-btn').addEventListener('click', updatePrices);

window.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  updatePrices();
});