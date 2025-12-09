/**
 * Dashboard Management System
 * Integração real com backend (Spring Boot)
 */

// ====== CONFIGURAÇÃO DE ENDPOINT DA API ======
// Para produção/deploy  "/api/store-manager-api/dashboard"
// Para rodar local, use: "http://localhost:8080"

const CONFIG = {
  API_BASE_URL: "'http://localhost:8080/store-manager-api",
  UPDATE_INTERVAL: 30000,
  STORAGE_PREFIX: "dashboard_",
};

// ===== SERVIÇOS DE API =====
class DashboardAPI {
  static async getTotalCardsInStock() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/total-cards-in-stock`);
  }
  static async getTotalBoosterBoxes() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/total-booster-boxes`);
  }
  static async getTopPokemonByStock() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/top-pokemon-by-stock`);
  }
  static async getTopCollectionByItems() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/top-collection-by-items`);
  }
  static async getMonthlyAcquisitions() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/monthly-acquisitions`);
  }
  static async getSalesOverview() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/sales-overview`);
  }
  static async getStockAgingOverview() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/stock-aging-overview`);
  }
  static async getValuedCards() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/valued-cards`);
  }

  static async fetchJSON(url) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Erro ao buscar dados da API (${url}):`, error);
      return [];
    }
  }
}

// ===== GERENCIADOR PRINCIPAL =====
class DashboardManager {
  constructor() {
    this.isLoading = false;
    this.updateTimer = null;
    this.charts = {};
    this.salesOverviewRaw = []; // dados brutos de vendas
    this.monthlyAcquisitionsRaw = []; // dados brutos de aquisições
    this.init();
  }

  init() {
    this.registerSalesFilters();
    this.registerAcquisitionsFilters();
    this.loadInitialData();
    this.startAutoUpdate();
    console.log("Dashboard inicializado com sucesso 🚀");
  }

  async loadInitialData() {
    this.setLoadingState(true);
    try {
      const [
        totalCards,
        boosterBoxes,
        topPokemon,
        topCollection,
        monthlyAcquisitions,
        salesOverview,
        stockAging,
        valuedCards,
      ] = await Promise.all([
        DashboardAPI.getTotalCardsInStock(),
        DashboardAPI.getTotalBoosterBoxes(),
        DashboardAPI.getTopPokemonByStock(),
        DashboardAPI.getTopCollectionByItems(),
        DashboardAPI.getMonthlyAcquisitions(),
        DashboardAPI.getSalesOverview(),
        DashboardAPI.getStockAgingOverview(),
        DashboardAPI.getValuedCards(),
      ]);

      this.salesOverviewRaw = Array.isArray(salesOverview) ? salesOverview : [];
      this.monthlyAcquisitionsRaw = Array.isArray(monthlyAcquisitions)
        ? monthlyAcquisitions
        : [];

      this.updateKPIs({
        totalCards,
        boosterBoxes,
        topPokemon,
        topCollection,
      });

      this.updateCharts({
        stockAging,
        valuedCards,
      });

      // gráficos específicos com filtros
      const filteredSales = this.getFilteredSalesOverview();
      this.updateSalesChart(filteredSales);

      const filteredAcq = this.getFilteredMonthlyAcquisitions();
      this.updateAcquisitionsChart(filteredAcq);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    } finally {
      this.setLoadingState(false);
    }
  }

  // ===== HELPERS DE DATA (normaliza YYYY-MM) =====
  normalizeYearMonth(str) {
    if (!str) return null;
    const s = String(str).trim();
    if (s.length >= 7) return s.slice(0, 7); // 2025-01 ou 2025-01-01 -> 2025-01
    return null;
  }

  // ===== ATUALIZAÇÕES DE KPI =====
  updateKPIs(data) {
    const { totalCards, boosterBoxes, topPokemon } = data;

    const totalCardsValue = Number(
      totalCards.totalCardsInStock ??
        totalCards.total_cards_in_stock ??
        totalCards.total ??
        0
    );

    const boosterBoxesValue = Number(
      boosterBoxes.totalBoosterBoxes ??
        boosterBoxes.total_booster_boxes ??
        boosterBoxes.total ??
        0
    );

    const topName =
      topPokemon.pokemonName ??
      topPokemon.pokemon_name ??
      topPokemon.productName ??
      topPokemon.product_name ??
      "---";

    document.getElementById(
      "company-cash"
    ).textContent = `${totalCardsValue} cartas`;

    document.getElementById(
      "semester-profit"
    ).textContent = `${boosterBoxesValue} boosters`;

    document.getElementById("total-debts").textContent = `Top: ${topName}`;
  }

  // ===== GRÁFICOS GENÉRICOS (exceto vendas / aquisições) =====
  updateCharts(data) {
    const { stockAging, valuedCards } = data;

    // Envelhecimento de Estoque com legenda custom à direita
    this.updateStockAgingChart(stockAging);

    // Cartas Valiosas
    this.updateTopCardsList(valuedCards);
  }

  // ===== FILTROS DE DATA: GRÁFICO DE VENDAS =====
  registerSalesFilters() {
    const startInput = document.getElementById("sales-start-month");
    const endInput = document.getElementById("sales-end-month");
    const clearBtn = document.getElementById("sales-filter-clear");

    const refresh = () => {
      const filtered = this.getFilteredSalesOverview();
      this.updateSalesChart(filtered);
    };

    if (startInput) startInput.addEventListener("change", refresh);
    if (endInput) endInput.addEventListener("change", refresh);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (startInput) startInput.value = "";
        if (endInput) endInput.value = "";
        this.updateSalesChart(this.salesOverviewRaw);
      });
    }
  }

  getFilteredSalesOverview() {
    if (!Array.isArray(this.salesOverviewRaw)) return [];

    const startInput = document.getElementById("sales-start-month");
    const endInput = document.getElementById("sales-end-month");

    const startNorm = this.normalizeYearMonth(startInput?.value || null);
    const endNorm = this.normalizeYearMonth(endInput?.value || null);

    return this.salesOverviewRaw.filter((item) => {
      const keyRaw = item.month_year || item.monthYear || item.month;
      const keyNorm = this.normalizeYearMonth(keyRaw);
      if (!keyNorm) return false;

      if (startNorm && keyNorm < startNorm) return false;
      if (endNorm && keyNorm > endNorm) return false;

      return true;
    });
  }

  // ===== GRÁFICO: PANORAMA DE VENDAS (LINHAS) =====
  updateSalesChart(salesOverview) {
    const canvas = document.getElementById("salesChart");

    if (
      !canvas ||
      !Array.isArray(salesOverview) ||
      salesOverview.length === 0
    ) {
      if (this.charts["salesChart"]) {
        this.charts["salesChart"].destroy();
        this.charts["salesChart"] = null;
      }
      return;
    }

    if (this.charts["salesChart"]) {
      this.charts["salesChart"].destroy();
      this.charts["salesChart"] = null;
    }

    const monthsSet = new Set();
    const productMap = new Map(); // produto -> { monthKey: totalSold }

    salesOverview.forEach((item) => {
      const rawMonth = item.month_year || item.monthYear || item.month;
      const monthKey = this.normalizeYearMonth(rawMonth);
      const productName =
        item.product_name || item.productName || "Desconhecido";
      const totalSold = Number(item.total_sold ?? item.totalSold ?? 0);

      if (!monthKey) return;

      monthsSet.add(monthKey);

      if (!productMap.has(productName)) {
        productMap.set(productName, {});
      }
      const monthData = productMap.get(productName);
      monthData[monthKey] = (monthData[monthKey] || 0) + totalSold;
    });

    const monthKeys = Array.from(monthsSet).sort();

    const labels = monthKeys.map((mk) => {
      try {
        const date = new Date(mk + "-01");
        return date.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        });
      } catch {
        return mk;
      }
    });

    const palette = [
      "#20B2AA",
      "#FF6F61",
      "#4D96FF",
      "#FFD700",
      "#6A5ACD",
      "#FFB347",
      "#66CDAA",
      "#C71585",
      "#708090",
      "#32CD32",
    ];

    const datasets = Array.from(productMap.entries()).map(
      ([productName, monthData], index) => ({
        label: productName,
        data: monthKeys.map((mk) => monthData[mk] || 0),
        borderColor: palette[index % palette.length],
        backgroundColor: palette[index % palette.length],
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
        fill: false,
      })
    );

    const ctx = canvas.getContext("2d");

    this.charts["salesChart"] = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: "right",
            labels: {
              usePointStyle: true,
            },
            onClick: (e, legendItem, legend) => {
              const index = legendItem.datasetIndex;
              const chart = legend.chart;
              const meta = chart.getDatasetMeta(index);

              meta.hidden = meta.hidden === null ? true : !meta.hidden;
              chart.update();
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed.y || 0;
                return `${ctx.dataset.label}: ${value} unid.`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Qtd. vendida",
            },
          },
          x: {
            title: {
              display: true,
              text: "Mês",
            },
          },
        },
      },
    });
  }

  // ===== FILTROS DE DATA: GRÁFICO DE AQUISIÇÕES (APEX) =====
  registerAcquisitionsFilters() {
    const startInput = document.getElementById("acq-start-month");
    const endInput = document.getElementById("acq-end-month");
    const clearBtn = document.getElementById("acq-filter-clear");
    const saveBtn = document.getElementById("acq-save");

    const refresh = () => {
      const filtered = this.getFilteredMonthlyAcquisitions();
      this.updateAcquisitionsChart(filtered);
    };

    if (startInput) startInput.addEventListener("change", refresh);
    if (endInput) endInput.addEventListener("change", refresh);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (startInput) startInput.value = "";
        if (endInput) endInput.value = "";
        this.updateAcquisitionsChart(this.monthlyAcquisitionsRaw);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const chart = this.charts["collectionsChart"];
        if (!chart) return;

        const link = document.createElement("a");
        link.href = chart.toBase64Image();
        link.download = "apex-ultimas-aquisicoes.png";
        link.click();
      });
    }
  }

  getFilteredMonthlyAcquisitions() {
    if (!Array.isArray(this.monthlyAcquisitionsRaw)) return [];

    const startInput = document.getElementById("acq-start-month");
    const endInput = document.getElementById("acq-end-month");

    const startNorm = this.normalizeYearMonth(startInput?.value || null);
    const endNorm = this.normalizeYearMonth(endInput?.value || null);

    return this.monthlyAcquisitionsRaw.filter((item) => {
      const keyRaw = item.month_year || item.monthYear || item.month;
      const keyNorm = this.normalizeYearMonth(keyRaw);
      if (!keyNorm) return false;

      if (startNorm && keyNorm < startNorm) return false;
      if (endNorm && keyNorm > endNorm) return false;

      return true;
    });
  }

  // ===== GRÁFICO: ÚLTIMAS AQUISIÇÕES (APEX) + DETALHES =====
  updateAcquisitionsChart(monthlyAcq) {
    const canvas = document.getElementById("collectionsChart");

    if (!canvas || !Array.isArray(monthlyAcq) || monthlyAcq.length === 0) {
      if (this.charts["collectionsChart"]) {
        this.charts["collectionsChart"].destroy();
        this.charts["collectionsChart"] = null;
      }
      this.renderAcquisitionsDetails([]);
      return;
    }

    if (this.charts["collectionsChart"]) {
      this.charts["collectionsChart"].destroy();
      this.charts["collectionsChart"] = null;
    }

    const monthsSet = new Set();
    const monthTotals = {}; // monthKey -> total R$

    monthlyAcq.forEach((item) => {
      const rawMonth = item.month_year || item.monthYear || item.month;
      const monthKey = this.normalizeYearMonth(rawMonth);
      if (!monthKey) return;

      const value = Number(
        item.totalCost ?? item.total_cost ?? item.amount ?? item.value ?? 0
      );

      monthsSet.add(monthKey);
      monthTotals[monthKey] = (monthTotals[monthKey] || 0) + value;
    });

    const monthKeys = Array.from(monthsSet).sort();

    const labels = monthKeys.map((mk) => {
      try {
        const date = new Date(mk + "-01");
        return date.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        });
      } catch {
        return mk;
      }
    });

    const values = monthKeys.map((mk) => monthTotals[mk] || 0);

    const ctx = canvas.getContext("2d");

    this.charts["collectionsChart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Total investido em APEX (R$)",
            data: values,
            backgroundColor: "#4D96FF",
            borderColor: "#1E90FF",
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 50,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed.y || 0;
                return new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value);
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Valor (R$)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Mês",
            },
          },
        },
      },
    });

    // Detalhes em tabela por mês
    this.renderAcquisitionsDetails(monthlyAcq);
  }

  renderAcquisitionsDetails(monthlyAcq) {
    const container = document.getElementById("acq-details");
    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(monthlyAcq) || monthlyAcq.length === 0) {
      container.innerHTML =
        "<p>Nenhuma aquisição encontrada para o filtro atual.</p>";
      return;
    }

    // Agrupa por mês normalizado
    const groups = new Map(); // monthKey -> itens[]

    monthlyAcq.forEach((item) => {
      const rawMonth = item.month_year || item.monthYear || item.month;
      const monthKey = this.normalizeYearMonth(rawMonth);
      if (!monthKey) return;

      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey).push(item);
    });

    const sortedMonths = Array.from(groups.keys()).sort(); // asc

    sortedMonths.forEach((monthKey) => {
      const items = groups.get(monthKey) || [];

      const block = document.createElement("div");
      block.className = "acq-month-block";

      const date = new Date(monthKey + "-01");
      const formattedMonth = isNaN(date.getTime())
        ? monthKey
        : date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

      const title = document.createElement("div");
      title.className = "acq-month-title";
      title.textContent =
        formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

      const table = document.createElement("table");
      table.className = "acq-table";

      table.innerHTML = `
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Qtd</th>
                        <th>Preço Unitário</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

      const tbody = table.querySelector("tbody");

      items.forEach((it) => {
        const tr = document.createElement("tr");

        const desc = it.description ?? "(sem descrição)";
        const qty = Number(it.quantity ?? 0);
        const unit = Number(
          it.unitPurchasePrice ?? it.unit_purchase_price ?? 0
        );
        const total = Number(it.totalCost ?? it.total_cost ?? qty * unit);

        tr.innerHTML = `
                    <td>${desc}</td>
                    <td>${qty}</td>
                    <td>${this.formatCurrency(unit)}</td>
                    <td>${this.formatCurrency(total)}</td>
                `;

        tbody.appendChild(tr);
      });

      block.appendChild(title);
      block.appendChild(table);
      container.appendChild(block);
    });
  }

  // ===== GRÁFICO: ENVELHECIMENTO DE ESTOQUE =====
  updateStockAgingChart(stockAging) {
    const canvas = document.getElementById("weeklyChart");

    if (!canvas || !Array.isArray(stockAging) || stockAging.length === 0) {
      if (this.charts["weeklyChart"]) {
        this.charts["weeklyChart"].destroy();
        this.charts["weeklyChart"] = null;
      }
      const legend = document.getElementById("stock-aging-legend");
      if (legend) legend.innerHTML = "";
      return;
    }

    if (this.charts["weeklyChart"]) {
      this.charts["weeklyChart"].destroy();
      this.charts["weeklyChart"] = null;
    }

    const labelField = this.detectLabelField(stockAging, [
      "productName",
      "product_name",
      "item",
      "name",
    ]);
    const valueField = this.detectValueField(stockAging, [
      "daysInStock",
      "days_in_stock",
      "days",
      "value",
    ]);

    const labels = stockAging.map((r) => r[labelField] ?? "---");
    const values = stockAging.map((r) => Number(r[valueField] ?? 0));

    const palette = [
      "#20B2AA",
      "#FF6F61",
      "#4D96FF",
      "#FFD700",
      "#6A5ACD",
      "#FFB347",
      "#66CDAA",
      "#C71585",
      "#708090",
      "#32CD32",
      "#8A2BE2",
      "#FF7F50",
      "#2E8B57",
      "#DC143C",
      "#00CED1",
    ];

    const ctx = canvas.getContext("2d");

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Dias em estoque",
            data: values,
            backgroundColor: labels.map((_, i) => palette[i % palette.length]),
            borderWidth: 1,
            maxBarThickness: 26,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y", // barras horizontais
        plugins: {
          legend: {
            display: false, // legenda custom
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.x ?? ctx.parsed.y ?? 0;
                return `${v} dia(s) em estoque`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Dias em estoque",
            },
          },
          y: {
            title: {
              display: true,
              text: "Produto",
            },
          },
        },
      },
    });

    this.charts["weeklyChart"] = chart;

    // ===== LEGENDA CUSTOM NA DIREITA (quadradinhos clicáveis) =====
    const legendContainer = document.getElementById("stock-aging-legend");
    if (!legendContainer) return;

    legendContainer.innerHTML = "";

    labels.forEach((label, index) => {
      const item = document.createElement("div");
      item.className = "legend-item";
      item.dataset.index = String(index);

      const color = chart.data.datasets[0].backgroundColor[index];

      item.innerHTML = `
                <span class="legend-color" style="background-color:${color}"></span>
                <span class="legend-label">${label}</span>
            `;

      item.addEventListener("click", () => {
        const currentlyVisible = chart.getDataVisibility(index);
        chart.toggleDataVisibility(index);
        item.classList.toggle("legend-item--hidden", currentlyVisible);
        chart.update();
      });

      legendContainer.appendChild(item);
    });
  }

  // ===== DETECÇÃO AUTOMÁTICA (CASE-INSENSITIVE) =====
  detectLabelField(data, candidates) {
    if (!Array.isArray(data) || data.length === 0) return "label";

    const keys = Object.keys(data[0]);
    const lowerMap = new Map(keys.map((k) => [k.toLowerCase(), k]));

    for (const cand of candidates) {
      const found = lowerMap.get(cand.toLowerCase());
      if (found) return found;
    }

    return keys[0];
  }

  detectValueField(data, candidates) {
    if (!Array.isArray(data) || data.length === 0) return "value";

    const keys = Object.keys(data[0]);
    const lowerMap = new Map(keys.map((k) => [k.toLowerCase(), k]));

    for (const cand of candidates) {
      const found = lowerMap.get(cand.toLowerCase());
      if (found) return found;
    }

    const numKey = keys.find((k) => typeof data[0][k] === "number");
    if (numKey) return numKey;

    return keys[1] || keys[0];
  }

  // ===== CRIAÇÃO GENÉRICA DE GRÁFICOS (ainda disponível se precisar) =====
  drawChartOnce(elementId, type, data, { label, labelField, valueField }) {
    const canvas = document.getElementById(elementId);
    if (!canvas || !Array.isArray(data) || data.length === 0) return;

    const labels = data.map((d) => d[labelField] ?? "---");
    const values = data.map((d) => Number(d[valueField] ?? 0));

    if (this.charts[elementId]) {
      const chart = this.charts[elementId];
      chart.data.labels = labels;
      chart.data.datasets[0].data = values;
      chart.update();
      return;
    }

    const ctx = canvas.getContext("2d");
    this.charts[elementId] = new Chart(ctx, {
      type,
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            backgroundColor: [
              "#20B2AA",
              "#32CD32",
              "#FFD700",
              "#4D96FF",
              "#FF6F61",
              "#6A5ACD",
              "#FFB347",
              "#66CDAA",
              "#C71585",
              "#708090",
            ],
            borderColor: "#1E90FF",
            borderWidth: 1,
            fill: type === "line",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: type !== "pie" ? { y: { beginAtZero: true } } : {},
      },
    });
  }

  // ===== LISTA DE CARTAS VALIOSAS =====
  updateTopCardsList(cards) {
    const container = document.getElementById("top-cards-list");
    container.innerHTML = "";

    if (!Array.isArray(cards) || cards.length === 0) {
      container.innerHTML = "<p>Nenhuma carta encontrada.</p>";
      return;
    }

    const normalized = cards.map((c) => ({
      ...c,
      _name:
        c.product_name ?? c.productName ?? c.card_name ?? c.cardName ?? "---",
      _avgPrice: Number(
        c.avg_sale_price ?? c.avgSalePrice ?? c.current_sale_price ?? 0
      ),
      _currentPrice: Number(c.current_sale_price ?? c.currentSalePrice ?? 0),
      _stock: Number(c.current_stock ?? c.currentStock ?? 0),
    }));

    normalized.sort(
      (a, b) =>
        b._avgPrice - a._avgPrice ||
        b._currentPrice - a._currentPrice ||
        b._stock - a._stock
    );

    const list = normalized; // se quiser limitar: normalized.slice(0, 15)

    const title = document.createElement("div");
    title.className = "top-cards-title";
    title.innerHTML = `<strong>Cartas mais valiosas (${list.length})</strong>`;
    container.appendChild(title);

    list.forEach((card, index) => {
      const item = document.createElement("div");
      item.className = "card-item";

      item.innerHTML = `
                <span class="card-rank">#${index + 1}</span>
                <span class="card-icon">🎴</span>
                <span class="card-name">${card._name}</span>
                <span class="card-avg">Avg: ${this.formatCurrency(
                  card._avgPrice
                )}</span>
                <span class="card-price">Venda: ${this.formatCurrency(
                  card._currentPrice
                )}</span>
                <span class="card-stock">(${card._stock} unid.)</span>
            `;

      container.appendChild(item);
    });
  }

  // ===== UTILITÁRIOS =====
  setLoadingState(loading) {
    this.isLoading = loading;
    document.body.classList.toggle("loading", loading);
  }

  startAutoUpdate() {
    this.updateTimer = setInterval(
      () => this.refreshData(),
      CONFIG.UPDATE_INTERVAL
    );
  }

  async refreshData() {
    try {
      const totalCards = await DashboardAPI.getTotalCardsInStock();
      const totalCardsValue = Number(
        totalCards.totalCardsInStock ??
          totalCards.total_cards_in_stock ??
          totalCards.total ??
          0
      );

      document.getElementById(
        "company-cash"
      ).textContent = `${totalCardsValue} cartas`;
    } catch (e) {
      console.error("Erro na atualização automática:", e);
    }
  }

  formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", () => {
  window.dashboardManager = new DashboardManager();
});
