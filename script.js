const apiKey = 'd274679r01qloarhe5kgd274679r01qloarhe5l0'; 

async function fetchPrice(ticker) {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
    const data = await res.json();
    console.log(`Data for ${ticker}:`, data);  
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
    try {
      const current = await fetchPrice(ticker);
      row.querySelector('.current-price').textContent = current.toFixed(2);

      const manualInput = row.querySelector('.manual-price');
      const recommendedCell = row.querySelector('.recommended-price');

      const manualVal = parseFloat(manualInput.value);
      if (!isNaN(manualVal)) {
        const target = (manualVal * 0.9).toFixed(2);
        recommendedCell.textContent = target;
        if (current <= target) {
          recommendedCell.style.backgroundColor = 'lightgreen';
        } else {
          recommendedCell.style.backgroundColor = '';
        }
      }
    } catch (e) {
      console.error(`Error fetching price for ${ticker}`, e);
    }
  }
}

setInterval(updatePrices, 30000); // auto-refresh every 30 seconds
document.querySelectorAll('.manual-price').forEach(input => input.addEventListener('input', updatePrices));

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


function addStock() {
  const tickerInput = document.getElementById('new-ticker');
  const ticker = tickerInput.value.toUpperCase().trim();
  if (!ticker) return;

  const tableBody = document.querySelector('#stock-table tbody');

  // Create new row
  const newRow = document.createElement('tr');
  newRow.setAttribute('data-ticker', ticker);
  newRow.innerHTML = `
    <td>${ticker}</td>
    <td class="current-price">-</td>
    <td><input class="manual-price" type="number" /></td>
    <td class="recommended-price">-</td>
  `;

  tableBody.appendChild(newRow);
  tickerInput.value = '';

  // Attach event listener to new manual input
  newRow.querySelector('.manual-price').addEventListener('input', updatePrices);

  // Fetch price for the new row
  fetchPrice(ticker).then(current => {
    if (!current) return;
    newRow.querySelector('.current-price').textContent = current.toFixed(2);
    updatePrices();  // Recalculate recommendations
  });
}

updatePrices(); // Initial load
