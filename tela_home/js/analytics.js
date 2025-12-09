// =================== analytics.js ===================

// CONFIG
// ====== CONFIGURAÇÃO DE ENDPOINT DA API ======
// Para produção/deploy  "/api/store-manager-api/dashboard/"
// Para rodar local, use: "http://localhost:8080"

const ANALYTICS_CONFIG = {
  API_BASE_URL: "'http://localhost:8080/store-manager-api",
};

// =================== API ===================
class AnalyticsAPI {
  static async getHistoricalInventoryDistribution(date) {
    const iso = date.toISOString();
    const url = `${
      ANALYTICS_CONFIG.API_BASE_URL
    }/distribution/historical?date=${encodeURIComponent(iso)}`;
    return this.fetchJSON(url);
  }

  static async getCardSales(startDate, endDate) {
    const url = `${ANALYTICS_CONFIG.API_BASE_URL}/sales?start=${startDate}&end=${endDate}`;
    return this.fetchJSON(url);
  }

  static async getProfitByCategory(startDate, endDate) {
    const url = `${ANALYTICS_CONFIG.API_BASE_URL}/profit?start=${startDate}&end=${endDate}`;
    return this.fetchJSON(url);
  }

  static async getSpendVsEarn(startDate, endDate) {
    const url = `${ANALYTICS_CONFIG.API_BASE_URL}/spend-earn?start=${startDate}&end=${endDate}`;
    return this.fetchJSON(url);
  }

  static async getStockValuation(startDate, endDate) {
    const url = `${ANALYTICS_CONFIG.API_BASE_URL}/valuation?start=${startDate}&end=${endDate}`;
    return this.fetchJSON(url);
  }

  static async fetchJSON(url) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`Erro ao chamar API (${url}):`, err);
      return [];
    }
  }
}

// =================== MANAGER ===================
class AnalyticsManager {
  constructor() {
    this.charts = {};
    this.init();
  }

  async init() {
    // ----- ESTOQUE -----
    const dateInput = document.getElementById("inventory-date");
    const todayBtn = document.getElementById("inventory-today-btn");

    if (dateInput) {
      const today = new Date();
      dateInput.value = today.toISOString().slice(0, 10);
      dateInput.addEventListener("change", () =>
        this.loadInventoryDistribution()
      );
    }

    if (todayBtn && dateInput) {
      todayBtn.addEventListener("click", () => {
        const now = new Date();
        dateInput.value = now.toISOString().slice(0, 10);
        this.loadInventoryDistribution();
      });
    }

    // ----- VENDAS (TOP CARTAS) -----
    const btnSales = document.getElementById("sales-filter-btn");
    if (btnSales) {
      btnSales.addEventListener("click", () => this.loadTopSellingCards());
    }

    // ----- LUCRO POR CATEGORIA -----
    const btnProfit = document.getElementById("profit-filter-btn");
    if (btnProfit) {
      btnProfit.addEventListener("click", () => this.loadProfitByCategory());
    }

    // ----- GASTO VS GANHO -----
    const btnSpendEarn = document.getElementById("spend-earn-filter-btn");
    if (btnSpendEarn) {
      btnSpendEarn.addEventListener("click", () => this.loadSpendVsEarn());
    }

    // ----- VALOR DO ESTOQUE -----
    const btnValuation = document.getElementById("valuation-filter-btn");
    if (btnValuation) {
      btnValuation.addEventListener("click", () => this.loadStockValuation());
    }

    await this.loadInventoryDistribution();
    await this.loadTopSellingCards();
    await this.loadProfitByCategory();
    await this.loadSpendVsEarn();
    setTimeout(() => this.loadStockValuation(), 10);
  }

  // =================== ESTOQUE ===================
  async loadInventoryDistribution() {
    const canvas = document.getElementById("inventoryChart");
    if (!canvas) return;

    let refDate = new Date();

    const dateInput = document.getElementById("inventory-date");
    if (dateInput?.value) {
      refDate = new Date(`${dateInput.value}T23:59:59`);
    }

    const data = await AnalyticsAPI.getHistoricalInventoryDistribution(refDate);
    this.updateInventoryChart(data);
  }

  updateInventoryChart(distributionData) {
    const canvas = document.getElementById("inventoryChart");
    if (!canvas) return;

    if (this.charts["inventoryChart"]) {
      this.charts["inventoryChart"].destroy();
      this.charts["inventoryChart"] = null;
    }

    if (!Array.isArray(distributionData) || distributionData.length === 0) {
      console.warn("Nenhum dado de distribuição retornado.");
      return;
    }

    const labels = distributionData.map((item) =>
      this.mapCategoryLabel(item.category || item.categoryName || "")
    );

    const values = distributionData.map((item) =>
      Number(item.totalQuantity ?? item.total_quantity ?? 0)
    );

    const ctx = canvas.getContext("2d");

    this.charts["inventoryChart"] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              "#f87171",
              "#34d399",
              "#60a5fa",
              "#fbbf24",
              "#a78bfa",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right" },
        },
      },
    });
  }

  // =================== TOP SELLING CARDS ===================
  async loadTopSellingCards() {
    const tbody = document.querySelector("#topSellingCardsTable tbody");
    if (!tbody) return;

    const start =
      document.getElementById("sales-start-date")?.value || "2025-01-01";
    const end =
      document.getElementById("sales-end-date")?.value || "2025-12-31";

    const rows = await AnalyticsAPI.getCardSales(start, end);

    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2">Nenhuma venda encontrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows
      .map(
        (r) => `
        <tr>
            <td>${r.product_name ?? r.productName}</td>
            <td>${r.total_sold ?? r.totalSold}</td>
        </tr>
    `
      )
      .join("");
  }

  // =================== LUCRO POR CATEGORIA ===================
  async loadProfitByCategory() {
    const canvas = document.getElementById("profitChart");
    if (!canvas) return; // se o card NÃO existe ainda, simplesmente para

    // não chame a API se os inputs não existem (evita chamada dupla)
    const startInput = document.getElementById("profit-start-date");
    const endInput = document.getElementById("profit-end-date");

    const start = startInput?.value || "2025-01-01";
    const end = endInput?.value || "2025-12-31";

    const rows = await AnalyticsAPI.getProfitByCategory(start, end);

    // importante: resetar o canvas ANTES
    canvas.width = canvas.width;
    canvas.height = 420;

    this.updateProfitChart(rows);
  }

  updateProfitChart(rows) {
    const canvas = document.getElementById("profitChart");
    if (!canvas) return;

    // destrói gráfico anterior se existir
    if (this.charts["profitChart"]) {
      this.charts["profitChart"].destroy();
      this.charts["profitChart"] = null;
    }

    if (!rows || rows.length === 0) {
      console.warn("Nenhum dado de lucro retornado.");
      return;
    }

    // labels = categorias tratadas
    const labels = rows.map((r) => this.mapCategoryLabel(r.category));

    // valores = tenta vários nomes de campo, pra ficar à prova de mudança
    const values = rows.map((r) =>
      Number(
        r.total_profit ??
          r.totalProfit ??
          r.total_quantity ?? // <-- esse é o do teu print
          r.totalQuantity ??
          0
      )
    );

    const ctx = canvas.getContext("2d");

    this.charts["profitChart"] = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              "#f87171",
              "#34d399",
              "#60a5fa",
              "#fbbf24",
              "#a78bfa",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right" },
        },
      },
    });
  }

  // =================== SPEND VS EARN ===================
  async loadSpendVsEarn() {
    const canvas = document.getElementById("spendEarnChart");
    if (!canvas) return;

    const start =
      document.getElementById("se-start-date")?.value || "2025-01-01";
    const end = document.getElementById("se-end-date")?.value || "2025-12-31";

    const rows = await AnalyticsAPI.getSpendVsEarn(start, end);

    this.updateSpendEarnChart(rows);
  }

  updateSpendEarnChart(rows) {
    const canvas = document.getElementById("spendEarnChart");
    if (!canvas) return;

    if (this.charts["spendEarnChart"]) {
      this.charts["spendEarnChart"].destroy();
      this.charts["spendEarnChart"] = null;
    }

    if (!rows || rows.length === 0) {
      console.warn("Nenhum dado de gasto vs ganho retornado.");
      return;
    }

    const rawLabels = rows.map((r) => r.month_year || r.monthYear || r.month);
    const labels = rawLabels.map((mk) => {
      if (!mk) return "";
      if (/^\d{4}-\d{2}$/.test(mk)) {
        try {
          const d = new Date(mk + "-01");
          return d.toLocaleDateString("pt-BR", {
            month: "short",
            year: "2-digit",
          });
        } catch {
          return mk;
        }
      }
      return mk;
    });

    const spent = rows.map((r) =>
      Number(r.total_spent ?? r.totalSpent ?? r.spent ?? 0)
    );
    const earned = rows.map((r) =>
      Number(r.total_earned ?? r.totalEarned ?? r.earned ?? 0)
    );

    const ctx = canvas.getContext("2d");

    this.charts["spendEarnChart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Gastos",
            data: spent,
            backgroundColor: "#ef4444",
            yAxisID: "y",
          },
          {
            label: "Ganhos",
            type: "line",
            data: earned,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,0.3)",
            tension: 0.3,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        stacked: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Gastos (R$)" },
          },
          y1: {
            beginAtZero: true,
            position: "right",
            title: { display: true, text: "Ganhos (R$)" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  // =================== VALOR DO ESTOQUE ===================
  async loadStockValuation() {
    const canvas = document.getElementById("stockValuationChart");
    if (!canvas) return;

    const start =
      document.getElementById("valuation-start-date")?.value || "2025-01-01";
    const end =
      document.getElementById("valuation-end-date")?.value || "2025-12-31";

    const rows = await AnalyticsAPI.getStockValuation(start, end);

    this.updateStockValuationChart(rows);
  }

  updateStockValuationChart(rows) {
    const canvas = document.getElementById("stockValuationChart");
    if (!canvas) return;

    if (this.charts["stockValuationChart"]) {
      this.charts["stockValuationChart"].destroy();
      this.charts["stockValuationChart"] = null;
    }

    if (!rows || rows.length === 0) {
      console.warn("Nenhum dado de valuation retornado.");
      return;
    }

    // labels e values OK
    const labels = rows.map((r) => {
      const mk = r.month;
      const d = new Date(mk + "-01");
      return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    });

    const values = rows.map((r) => Number(r.total_stock_value ?? 0));

    const ctx = canvas.getContext("2d");

    // 🚨 RESET OBRIGATÓRIO
    canvas.width = canvas.width;
    canvas.height = 420;

    this.charts["stockValuationChart"] = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Valor estimado do estoque (R$)",
            data: values,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.25)",
            tension: 0.3,
            fill: true,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { text: "Valor (R$)", display: true },
          },
          x: { title: { text: "Mês", display: true } },
        },
      },
    });
  }

  // =================== HELPERS ===================
  mapCategoryLabel(code) {
    switch ((code || "").toUpperCase()) {
      case "CARTAS_AVULSAS":
        return "Cartas Avulsas";
      case "BOOSTER_BOX":
        return "Booster Box";
      case "BOOSTER":
        return "Boosters";
      case "ACCESSORY":
        return "Acessórios";
      case "OUTROS":
        return "Outros";
      default:
        return code || "Desconhecido";
    }
  }
}

// =================== BOOT ===================
document.addEventListener("DOMContentLoaded", () => {
  window.analyticsManager = new AnalyticsManager();
});
