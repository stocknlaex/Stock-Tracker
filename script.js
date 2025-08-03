async function fetchPrice(ticker) {
  try {
    const url = `https://corsproxy.io/?https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.quoteResponse.result[0]?.regularMarketPrice || null;
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
    const currentPriceCell = row.querySelector('.current-price');
    const manualInput = row.querySelector('.manual-price');
    const dropSelect = row.querySelector('.drop-percent');
    const recommendedCell = row.querySelector('.recommended-price');

    const current = await fetchPrice(ticker);
    if (!current) {
      currentPriceCell.textContent = 'N/A';
      recommendedCell.textContent = 'N/A';
      continue;
    }

    currentPriceCell.textContent = current.toFixed(2);
    const manualVal = parseFloat(manualInput.value);
    const dropPercent = parseFloat(dropSelect.value);

    if (!isNaN(manualVal) && !isNaN(dropPercent)) {
      const target = (manualVal * (1 - dropPercent / 100)).toFixed(2);
      recommendedCell.textContent = target;
      recommendedCell.style.backgroundColor = current <= target ? 'lightgreen' : '';
    } else {
      recommendedCell.textContent = '';
      recommendedCell.style.backgroundColor = '';
    }
  }
  saveToLocalStorage();
}

function addStock(ticker = '', manual = '', drop = '10', comment = '') {
  ticker = ticker.toUpperCase().trim();
  if (!ticker) return;

  const tableBody = document.querySelector('#stock-table tbody');
  const newRow = document.createElement('tr');
  newRow.setAttribute('data-ticker', ticker);

  newRow.innerHTML = `
    <td>${ticker}</td>
    <td class="current-price">...</td>
    <td><input class="manual-price" type="number" value="${manual}" /></td>
    <td>
      <select class="drop-percent">
        <option value="5" ${drop==='5'?'selected':''}>5%</option>
        <option value="10" ${drop==='10'?'selected':''}>10%</option>
        <option value="15" ${drop==='15'?'selected':''}>15%</option>
        <option value="20" ${drop==='20'?'selected':''}>20%</option>
      </select>
    </td>
    <td class="recommended-price">...</td>
    <td><textarea class="comment-box" maxlength="500" placeholder="Add comments...">${comment}</textarea></td>
    <td><button onclick="this.closest('tr').remove(); saveToLocalStorage();">❌</button></td>
  `;

  tableBody.appendChild(newRow);

  newRow.querySelector('.manual-price').addEventListener('input', () => {
    updatePrices();
    saveToLocalStorage();
  });
  newRow.querySelector('.drop-percent').addEventListener('change', () => {
    updatePrices();
    saveToLocalStorage();
  });
  newRow.querySelector('.comment-box').addEventListener('input', saveToLocalStorage);

  updatePrices();
  saveToLocalStorage();
}

function resetTable() {
  localStorage.removeItem('stocks');
  document.querySelector('#stock-table tbody').innerHTML = '';
}

function showBuyOpportunities() {
  const rows = document.querySelectorAll('#stock-table tbody tr');
  for (const row of rows) {
    const current = parseFloat(row.querySelector('.current-price').textContent);
    const recommended = parseFloat(row.querySelector('.recommended-price').textContent);
    row.style.display = (current <= recommended) ? '' : 'none';
  }
}

window.addEventListener('load', () => {
  loadFromLocalStorage();
  updatePrices();
});