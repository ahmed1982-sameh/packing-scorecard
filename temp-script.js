
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const icons = { prod: "⚙️", oee: "📊", volume: "📦", planned: "🗓️", changeover: "🔄", unplanned: "⚠️", breakdown: "🛠️", waste: "🗑️", stops: "⛔", emp: "👷", casual: "👤" };
    const percentKPI = { prod: true, oee: true, planned: true, changeover: true, unplanned: true, breakdown: true, waste: true };
    const higherIsBetter = { prod: true, oee: true, volume: true, emp: true, casual: true, planned: false, changeover: false, unplanned: false, breakdown: false, waste: false, stops: false };

    const data = {
      prod: { name: "Productivity", actual: Array(12).fill(0), budget: Array(12).fill(0) },
      oee: { name: "OEE", actual: Array(12).fill(0), budget: Array(12).fill(0) },
      volume: { name: "Volume", actual: Array(12).fill(0), budget: Array(12).fill(0) },
      planned: { name: "Planned DT", actual: Array(12).fill(0), budget: Array(12).fill(0) },
      changeover: { name: "Changeover", actual: Array(12).fill(0), budget: Array(12).fill(0) },
      unplanned: { name: "Unplanned DT", actual: Array(12).fill(0), budget: Array(12).fill(0) },
      breakdown: { name: "Breakdown", actual: Array(12).fill(0), budget: Array(12).fill(0) },
      waste: { name: "Waste", actual: Array(12).fill(0), budget: Array(12).fill(0) },
      stops: { name: "Stops", actual: Array(12).fill(0), budget: Array(12).fill(0) },
      emp: { name: "Employees", actual: Array(12).fill(0), budget: Array(12).fill(0) },
      casual: { name: "Casual", actual: Array(12).fill(0), budget: Array(12).fill(0) }
    };

    let currentChart = null;
    let currentSnagIndex = null;

    function showPage(pageId, event) {
      document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
      document.getElementById(pageId).classList.add('active');
      document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));
      if (event && event.currentTarget) event.currentTarget.classList.add('active');
    }

    function formatValue(value, isPercent) {
      if (isPercent) return `${value.toFixed(1)}%`;
      return Number.isInteger(value) ? value : value.toFixed(1);
    }

    function buildCards() {
      const container = document.getElementById('cards');
      container.innerHTML = '';
      Object.keys(data).forEach(key => {
        const item = data[key];
        const isPercent = percentKPI[key] || false;
        const actualSum = item.actual.reduce((sum, x) => sum + x, 0);
        const budgetSum = item.budget.reduce((sum, x) => sum + x, 0);
        const actualValue = key === 'volume' || key === 'emp' || key === 'casual' ? actualSum : actualSum / 12;
        const budgetValue = key === 'volume' || key === 'emp' || key === 'casual' ? budgetSum : budgetSum / 12;
        const success = higherIsBetter[key] ? actualValue >= budgetValue : actualValue <= budgetValue;

        const card = document.createElement('button');
        card.className = success ? 'card good' : 'card bad';
        card.innerHTML = `<span class="icon">${icons[key] || '📌'}</span><h3>${item.name}</h3><p>${formatValue(actualValue, isPercent)}</p><span>Target ${formatValue(budgetValue, isPercent)}</span>`;
        card.onclick = () => showPage(key);
        container.appendChild(card);
      });
    }

    function createChart(pageId, key) {
      const page = document.getElementById(pageId);
      if (!page) return;
      const item = data[key];
      const isPercent = percentKPI[key] || false;
      page.innerHTML = `<h1>${item.name}</h1><div class="chart-box"><canvas id="${key}Chart"></canvas></div><table><thead><tr><th>Month</th><th>Actual</th><th>Budget</th><th>Gap</th><th>Status</th></tr></thead><tbody>${months.map((month, index) => {
        const actual = item.actual[index];
        const budget = item.budget[index];
        const gap = actual - budget;
        const status = higherIsBetter[key] ? (actual >= budget ? '✅' : '❌') : (actual <= budget ? '✅' : '❌');
        return `<tr><td>${month}</td><td>${formatValue(actual, isPercent)}</td><td>${formatValue(budget, isPercent)}</td><td>${formatValue(gap, isPercent)}</td><td>${status}</td></tr>`;
      }).join('')}</tbody></table>`;
      renderChart(`${key}Chart`, item, key);
    }

    function renderChart(canvasId, item, key) {
      const ctx = document.getElementById(canvasId);
      if (!ctx) return;
      const existing = Chart.getChart(ctx);
      if (existing) existing.destroy();
      currentChart = new Chart(ctx, {
        type: key === 'volume' || key === 'emp' || key === 'casual' ? 'bar' : 'line',
        data: {
          labels: months,
          datasets: [
            { label: 'Actual', data: item.actual, borderColor: '#2563eb', backgroundColor: 'rgba(59,130,246,0.3)', fill: true },
            { label: 'Budget', data: item.budget, borderColor: '#f97316', backgroundColor: 'rgba(251,146,60,0.25)', borderDash: [6, 4], fill: true }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
      });
    }

    function renderHomeCharts() {
      const chartIds = ['homeChart1', 'homeChart2', 'homeChart3', 'homeChart4'];
      const keys = ['prod', 'oee', 'volume', 'waste'];
      keys.forEach((key, index) => {
        const ctx = document.getElementById(chartIds[index]);
        if (!ctx) return;
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: months,
            datasets: [
              { label: data[key].name, data: data[key].actual, borderColor: '#111827', backgroundColor: 'rgba(15,23,42,0.15)', fill: true }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
      });
    }

    function openModal() { document.getElementById('dataModal').classList.add('active'); }
    function closeModal() { document.getElementById('dataModal').classList.remove('active'); }

    function saveKPI() {
      const kpi = document.getElementById('kpiSelect').value;
      const month = Number(document.getElementById('monthSelect').value);
      const actual = Number(document.getElementById('actualInput').value);
      const budget = Number(document.getElementById('budgetInput').value);
      if (!Number.isFinite(actual) || !Number.isFinite(budget)) { alert('Please enter numeric values.'); return; }
      data[kpi].actual[month] = actual;
      data[kpi].budget[month] = budget;
      createChart(kpi, kpi);
      buildCards();
      renderHomeCharts();
      closeModal();
      fetch('/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kpi, month, actual, budget }) }).catch(() => {});
    }

    function createSnagPage() {
      const container = document.getElementById('snag');
      container.innerHTML = `
        <h1>Snag List</h1>
        <div class="chart-grid">
          <div class="card" style="padding: 18px;">
            <label>Line</label>
            <select id="snagLine"><option value="خط التعبئة الآلي 1">خط التعبئة الآلي 1</option><option value="خط التعبئة الآلي 2">خط التعبئة الآلي 2</option><option value="خط التعبئة الآلي 3">خط التعبئة الآلي 3</option></select>
            <label>Unit</label>
            <input id="snagUnit" placeholder="Unit">
            <label>Defect</label>
            <input id="snagDefect" placeholder="Defect">
            <label>Action</label>
            <textarea id="snagAction" placeholder="Action"></textarea>
            <div class="button-row"><button class="primary" onclick="addSnag()">Add Snag</button></div>
          </div>
          <div class="card" style="padding: 18px;">
            <div style="margin-bottom: 14px; font-weight: 700;">Defect Types</div>
            <label><input type="checkbox" id="typeMinor"> Minor Defect</label>
            <label><input type="checkbox" id="typeCondition"> Lack of Condition</label>
            <label><input type="checkbox" id="typeParts"> Unnecessary Parts</label>
            <label><input type="checkbox" id="typeHtra"> Hard To Reach</label>
            <label><input type="checkbox" id="typeSoc"> Source of Contamination</label>
            <label><input type="checkbox" id="typeQuality"> Quality Defect</label>
            <label><input type="checkbox" id="typeSafety"> Safety Defect</label>
          </div>
        </div>
        <table>
          <thead><tr><th>Line</th><th>Unit</th><th>Defect</th><th>Type</th><th>Action</th><th>Status</th><th>Closing Date</th><th>Options</th></tr></thead>
          <tbody id="snagTable"></tbody>
        </table>
      `;
    }

    function getSnagTypes() {
      const types = [];
      if (document.getElementById('typeMinor').checked) types.push('Minor');
      if (document.getElementById('typeCondition').checked) types.push('Condition');
      if (document.getElementById('typeParts').checked) types.push('Parts');
      if (document.getElementById('typeHtra').checked) types.push('HTRA');
      if (document.getElementById('typeSoc').checked) types.push('SOC');
      if (document.getElementById('typeQuality').checked) types.push('Quality');
      if (document.getElementById('typeSafety').checked) types.push('Safety');
      return types.join(', ');
    }

    function addSnag() {
      const line = document.getElementById('snagLine').value;
      const unit = document.getElementById('snagUnit').value.trim();
      const defect = document.getElementById('snagDefect').value.trim();
      const action = document.getElementById('snagAction').value.trim();
      const type = getSnagTypes();
      if (!line || !defect) { alert('Please complete the required fields.'); return; }
      const snags = JSON.parse(localStorage.getItem('snags') || '[]');
      snags.push({ line, unit, defect, type, action, status: 'Open', closeDate: '' });
      localStorage.setItem('snags', JSON.stringify(snags));
      renderSnags();
    }

    function renderSnags() {
      const snags = JSON.parse(localStorage.getItem('snags') || '[]');
      const rows = snags.map((snag, index) => {
        return `<tr>
          <td>${snag.line}</td>
          <td>${snag.unit}</td>
          <td>${snag.defect}</td>
          <td>${snag.type}</td>
          <td>${snag.action}</td>
          <td><span class="snag-status ${snag.status === 'Closed' ? 'snag-closed' : 'snag-open'}">${snag.status}</span></td>
          <td>${snag.closeDate || '-'}</td>
          <td><button class="secondary" onclick="closeSnag(${index})">Close</button> <button class="secondary" onclick="deleteSnag(${index})">Delete</button></td>
        </tr>`;
      }).join('');
      document.getElementById('snagTable').innerHTML = rows;
    }

    function closeSnag(index) {
      const snags = JSON.parse(localStorage.getItem('snags') || '[]');
      if (!snags[index]) return;
      currentSnagIndex = index;
      document.getElementById('popupDate').value = '';
      document.getElementById('calendarPopup').classList.add('active');
    }

    function confirmClose() {
      const date = document.getElementById('popupDate').value;
      if (!date) { alert('Please select a closing date.'); return; }
      const snags = JSON.parse(localStorage.getItem('snags') || '[]');
      if (!snags[currentSnagIndex]) return;
      snags[currentSnagIndex].status = 'Closed';
      snags[currentSnagIndex].closeDate = date;
      localStorage.setItem('snags', JSON.stringify(snags));
      document.getElementById('calendarPopup').classList.remove('active');
      renderSnags();
    }

    function deleteSnag(index) {
      const snags = JSON.parse(localStorage.getItem('snags') || '[]');
      snags.splice(index, 1);
      localStorage.setItem('snags', JSON.stringify(snags));
      renderSnags();
    }

    function closePopup() { document.getElementById('calendarPopup').classList.remove('active'); }

    function loadServerData() {
      fetch('/data')
        .then(response => response.json())
        .then(serverData => {
          Object.keys(data).forEach(key => {
            if (serverData[key]) {
              data[key].actual = serverData[key].actual;
              data[key].budget = serverData[key].budget;
              createChart(key, key);
            }
          });
          buildCards();
          renderHomeCharts();
          renderSnags();
          createSnagPage();
        })
        .catch(error => {
          console.warn('Unable to load server data', error);
          buildCards();
          renderHomeCharts();
          renderSnags();
          createSnagPage();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
      buildCards();
      renderHomeCharts();
      createSnagPage();
      renderSnags();
      loadServerData();
    });
  
