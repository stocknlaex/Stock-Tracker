const apiKey = 'YOUR_FINNHUB_API_KEY'; // Replace with your actual API key

async function fetchPrice(ticker) {
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
  const data = await res.json();
  return data.c; // current price
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

updatePrices(); // Initial load