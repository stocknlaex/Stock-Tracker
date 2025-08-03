const apiKey = '80cf1a91e1mshdfbdf65560de678p133a61jsnb30d9e04a85f'; // from your screenshot
const apiHost = 'yh-finance.p.rapidapi.com';

// Fetch current price using Yahoo Finance (RapidAPI)
const fetchPrice = async (ticker) => {
  const url = `https://${apiHost}/stock/v2/get-summary?symbol=${ticker}&region=US`;

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': apiHost
    }
  };

  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      console.error(`API returned status ${res.status} for ${ticker}`);
      return null;
    }

    const data = await res.json();
    const price = data?.price?.regularMarketPrice?.raw;
    return price ?? null;
  } catch (err) {
    console.error(`Error fetching ${ticker}:`, err);
    return null;
  }
};

// Save all rows to localStorage
function saveToLocalStorage() {
  const rows = [...document.querySelectorAll('#stock-table tbody tr')].map(row => ({
    ticker: row.dataset.ticker,
    manual: row.querySelector('.manual-price').value,
    drop: row.querySelector('.drop-percent').value,
    comment: row.querySelector('.comment-box').value
  }));
  localStorage.setItem('stocks', JSON.stringify(rows));
}

// Load rows from localStorage on page load
function loadFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem('stocks') || '[]');
  for (const item of saved) {
    addStock(item.ticker, item.manual, item.drop, item.comment);
  }
}

// Add a new stock row
function addStock(ticker, manual = '', drop = '10%', comment = '') {
  if (!ticker) return;

  const table = document.querySelector('#stock-table tbody');
  const row = document.createElement('tr');
  row.dataset.ticker = ticker.toUpperCase();

  row.innerHTML = `
    <td>${ticker.toUpperCase()}</td>
    <td class="current-price">N/A</td>
    <td><input class="manual-price" type="number" value="${manual}" /></td>
    <td>
      <select class="drop-percent">
        ${[5, 10, 15, 20, 25, 30].map(p => `<option value="${p}%" ${p + '%' === drop ? 'selected' : ''}>${p}%</option>`).join('')}
      </select>
    </td>
    <td class="recommended-price">N/A</td>
    <td><input class="comment-box" maxlength="500" value="${comment}" placeholder="Add comments..."/></td>
    <td><button class="delete-btn">❌</button></td>
  `;

  // Delete handler
  row.querySelector('.delete-btn').addEventListener('click', () => {
    row.remove();
    saveToLocalStorage();
  });

  // Change listeners for inputs
  row.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => {
      updateRecommendedPrice(row);
      saveToLocalStorage();
    });
  });

  table.appendChild(row);
  updateRecommendedPrice(row);
}

// Update all current prices and recommended prices
async function updatePrices() {
  const rows = document.querySelectorAll('#stock-table tbody tr');
  for (const row of rows) {
    const ticker = row.dataset.ticker;
    const priceCell = row.querySelector('.current-price');
    const price = await fetchPrice(ticker);

    if (price !== null) {
      priceCell.textContent = price.toFixed(2);
    } else {
      priceCell.textContent = 'N/A';
    }
  }
}

// Calculate recommended price based on drop%
function updateRecommendedPrice(row) {
  const manual = parseFloat(row.querySelector('.manual-price').value);
  const dropPercent = parseFloat(row.querySelector('.drop-percent').value);

  const recommendedCell = row.querySelector('.recommended-price');

  if (!isNaN(manual) && !isNaN(dropPercent)) {
    const rec = manual * (1 - dropPercent / 100);
    recommendedCell.textContent = rec.toFixed(2);
  } else {
    recommendedCell.textContent = 'N/A';
  }
}

// Reset everything
function resetTable() {
  const tbody = document.querySelector('#stock-table tbody');
  if (tbody) {
    tbody.innerHTML = '';
    localStorage.removeItem('stocks');
  }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#add-button').addEventListener('click', () => {
    const input = document.querySelector('#ticker-input');
    const ticker = input.value.trim();
    if (ticker) {
      addStock(ticker);
      input.value = '';
      saveToLocalStorage();
    }
  });

  document.querySelector('#reset-button').addEventListener('click', resetTable);
  document.querySelector('#show-opportunities').addEventListener('click', updatePrices);

  loadFromLocalStorage();
  updatePrices();
});