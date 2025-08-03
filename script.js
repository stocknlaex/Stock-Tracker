const apiKey = '80cf1a91e1mshdfbdf65560de678p133a61jsnb30d9e04a85f';
const apiHost = 'apidojo-yahoo-finance-v1.p.rapidapi.com';

async function fetchPrice(ticker) {
    const url = `https://${apiHost}/stock/v2/get-summary?symbol=${ticker}&region=US`;
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': apiHost
            }
        });

        if (!res.ok) {
            console.error(`API error for ${ticker}:`, res.statusText);
            return null;
        }

        const data = await res.json();
        return data.price?.regularMarketPrice?.raw || null;
    } catch (err) {
        console.error(`Error fetching ${ticker}:`, err);
        return null;
    }
}

function saveToLocalStorage() {
    const rows = [...document.querySelectorAll("#stock-table tbody tr")].map(row => ({
        ticker: row.dataset.ticker,
        manual: row.querySelector('.manual-price').value,
        drop: row.querySelector('.drop-percent').value,
        comment: row.querySelector('.comment-box').value
    }));
    localStorage.setItem("stocks", JSON.stringify(rows));
}

function loadFromLocalStorage() {
    const saved = JSON.parse(localStorage.getItem("stocks") || "[]");
    for (const item of saved) {
        addStock(item.ticker, item.manual, item.drop, item.comment);
    }
}

function updatePrices() {
    const rows = document.querySelectorAll("#stock-table tbody tr");
    rows.forEach(async row => {
        const ticker = row.dataset.ticker;
        const manual = parseFloat(row.querySelector('.manual-price').value);
        const drop = parseFloat(row.querySelector('.drop-percent').value);
        const priceTd = row.querySelector('.current-price');
        const recTd = row.querySelector('.recommended-price');

        const price = await fetchPrice(ticker);
        if (price !== null) {
            priceTd.textContent = price.toFixed(2);
            if (!isNaN(manual) && !isNaN(drop)) {
                const recommended = manual * (1 - drop / 100);
                recTd.textContent = recommended.toFixed(2);
            } else {
                recTd.textContent = 'N/A';
            }
        } else {
            priceTd.textContent = 'N/A';
            recTd.textContent = 'N/A';
        }

        saveToLocalStorage();
    });
}

function addStock(ticker, manual = '', drop = '10', comment = '') {
    const tableBody = document.querySelector('#stock-table tbody');
    if (!tableBody) return;

    const newRow = document.createElement('tr');
    newRow.setAttribute('data-ticker', ticker.toUpperCase());
    newRow.innerHTML = `
        <td>${ticker.toUpperCase()}</td>
        <td class="current-price">Loading...</td>
        <td><input class="manual-price" type="number" value="${manual}" /></td>
        <td>
            <select class="drop-percent">
                ${[5, 10, 15, 20].map(val => `<option value="${val}" ${val == drop ? 'selected' : ''}>${val}%</option>`).join('')}
            </select>
        </td>
        <td class="recommended-price">...</td>
        <td><input class="comment-box" maxlength="500" value="${comment}" placeholder="Add comments..." /></td>
        <td><button class="delete-btn">❌</button></td>
    `;
    tableBody.appendChild(newRow);

    newRow.querySelector('.manual-price').addEventListener('input', updatePrices);
    newRow.querySelector('.drop-percent').addEventListener('change', updatePrices);
    newRow.querySelector('.comment-box').addEventListener('input', saveToLocalStorage);
    newRow.querySelector('.delete-btn').addEventListener('click', () => {
        newRow.remove();
        saveToLocalStorage();
    });

    updatePrices();
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-btn').addEventListener('click', () => {
        const input = document.getElementById('ticker-input');
        const ticker = input.value.trim().toUpperCase();
        if (ticker) {
            addStock(ticker);
            input.value = '';
            saveToLocalStorage();
        }
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        localStorage.removeItem('stocks');
        document.querySelector('#stock-table tbody').innerHTML = '';
    });

    loadFromLocalStorage();
});