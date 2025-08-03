const apiKey = 'd274679r01qloarhe5kgd274679r01qloarhe510';

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
    const current = await fetchPrice(ticker);
    if (!current) continue;
    row.querySelector('.current-price').textContent = current.toFixed(2);

    const manualVal = parseFloat(row.querySelector('.manual-price').value);
    const dropVal = parseFloat(row.querySelector('.drop-percent').value);
    const recommendedCell = row.querySelector('.recommended-price');

    if (!isNaN(manualVal) && !isNaN(dropVal)) {
      const target = (manualVal * (1 - dropVal / 100)).toFixed(2);
      recommendedCell.textContent = target;
      recommendedCell.style.backgroundColor = current <= target ? 'lightgreen' : '';
    }
  }
}

function addStock(ticker = '', manual = '', drop = '10', comment = '') {
  const input = document.getElementById('new-ticker');
  if (!ticker) {
    ticker = input.value.toUpperCase().trim();
    if (!ticker) return;
  }

  const tableBody = document.querySelector('#stock-table tbody');
  const newRow = document.createElement('tr');
  newRow.setAttribute('data-ticker', ticker);
  newRow.innerHTML = `
    <td>${ticker}</td>
    <td class="current-price"></td>
    <td><input class="manual-price" type="number" value="${manual}" /></td>
    <td>
      <select class="drop-percent">
        <option value="5"${drop === '5' ? ' selected' : ''}>5%</option>
        <option value="10"${drop === '10' ? ' selected' : ''}>10%</option>
        <option value="15"${drop === '15' ? ' selected' : ''}>15%</option>
        <option value="20"${drop === '20' ? ' selected' : ''}>20%</option>
      </select>
    </td>
    <td class="recommended-price"></td>
    <td><input class="comment-box" type="text" maxlength="500" value="${comment}" /></td>
    <td><button class="delete-row">ðï¸</button></td>
  `;
  tableBody.appendChild(newRow);
  input.value = '';

  newRow.querySelector('.manual-price').addEventListener('input', () => {
    updatePrices();
    saveToLocalStorage();
  });
  newRow.querySelector('.drop-percent').addEventListener('change', () => {
    updatePrices();
    saveToLocalStorage();
  });
  newRow.querySelector('.comment-box').addEventListener('input', saveToLocalStorage);
  newRow.querySelector('.delete-row').addEventListener('click', () => {
    newRow.remove();
    saveToLocalStorage();
  });

  fetchPrice(ticker).then(current => {
    if (!current) return;
    newRow.querySelector('.current-price').textContent = current.toFixed(2);
    updatePrices();
  });
}

function filterGreen() {
  const rows = document.querySelectorAll('#stock-table tbody tr');
  for (const row of rows) {
    const cell = row.querySelector('.recommended-price');
    row.style.display = cell.style.backgroundColor === 'lightgreen' ? '' : 'none';
  }
}

function resetFilter() {
  document.querySelectorAll('#stock-table tbody tr').forEach(row => row.style.display = '');
}

window.onload = () => {
  loadFromLocalStorage();
  updatePrices();
};