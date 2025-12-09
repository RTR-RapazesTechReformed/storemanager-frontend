// =================== analytics.js ===================

// CONFIG
// ====== CONFIGURAÇÃO DE ENDPOINT DA API ======
// Para produção/deploy  "/api/store-manager-api/dashboard/"
// Para rodar local, use: "http://localhost:8080"

const ANALYTICS_CONFIG = {
  API_BASE_URL: "http://localhost:8080/api/store-manager-api/dashboard",
  UPDATE_INTERVAL: 30000
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
     console.log(startDate, endDate);
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
    this.currentChartType = "bar"; //  ALTERADO: De "doughnut" para "bar"
    this.currentProfitChartType = "bar"; //  NOVO: Tipo de gráfico de lucro
    this.inventoryData = null; //  NOVO: Dados salvos
    this.profitData = null; //  NOVO: Dados de lucro salvos
    this.init();
  }

  async init() {
    //  NOVO: Aplicar range automático de 5 meses
    this.applyDefaultDateRange();

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
    //  REMOVIDO: Botão de filtro de vendas
    // Dados carregados automaticamente ao iniciar

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

    //  NOVO: Registrar toggle de tipo de gráfico
    this.registerChartTypeToggle();
    //  NOVO: Registrar toggle de tipo de gráfico de lucro
    this.registerProfitChartTypeToggle();

    await this.loadInventoryDistribution();
    await this.loadTopSellingCards();
    await this.loadProfitByCategory();
    await this.loadSpendVsEarn();
    setTimeout(() => this.loadStockValuation(), 10);
  }

  //  NOVO: Aplicar range automático de 5 meses
  applyDefaultDateRange() {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 4); // 5 meses (atual + 4 anteriores)
    const start = startDate.toISOString().split('T')[0];

    // Aplicar em todos os inputs de data
    const dateIds = [
      "profit-start-date",
      "profit-end-date",
      "se-start-date",
      "se-end-date",
      "valuation-start-date",
      "valuation-end-date"
    ];

    dateIds.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.value = (id.includes("end")) ? end : start;
      }
    });
  }

  //  NOVO: Registrar botões de tipo de gráfico
  registerChartTypeToggle() {
    document.getElementById("chart-type-doughnut")?.addEventListener("click", () => {
      this.setChartType("doughnut");
    });
    document.getElementById("chart-type-bar")?.addEventListener("click", () => {
      this.setChartType("bar");
    });
    document.getElementById("chart-type-pie")?.addEventListener("click", () => {
      this.setChartType("pie");
    });
  }

  //  NOVO: Alterar tipo de gráfico
  setChartType(type) {
    this.currentChartType = type;

    // Atualizar botões ativos
    document.querySelectorAll(".chart-type-btn").forEach(btn => {
      btn.classList.remove("active");
      if (btn.dataset.type === type) {
        btn.classList.add("active");
      }
    });

    // Re-renderizar gráfico com novos dados salvos   
    if (this.inventoryData) {
      this.updateInventoryChart(this.inventoryData);
    }
  }

  //  NOVO: Registrar botões de tipo de gráfico de lucro
  registerProfitChartTypeToggle() {
    document.getElementById("chart-type-profit-bar")?.addEventListener("click", () => {
      this.setProfitChartType("bar");
    });
    document.getElementById("chart-type-profit-doughnut")?.addEventListener("click", () => {
      this.setProfitChartType("doughnut");
    });
    document.getElementById("chart-type-profit-pie")?.addEventListener("click", () => {
      this.setProfitChartType("pie");
    });
  }

  // NOVO: Alterar tipo de gráfico de lucro
  setProfitChartType(type) {
    this.currentProfitChartType = type;

    // Atualizar botões ativos
    document.querySelectorAll("[data-type]").forEach(btn => {
      if (btn.id.includes("profit")) {
        btn.classList.remove("active");
        if (btn.dataset.type === type) {
          btn.classList.add("active");
        }
      }
    });

    // Re-renderizar gráfico com novos dados salvos
    if (this.profitData) {
      this.updateProfitChart(this.profitData);
    }
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
    this.inventoryData = data; //  NOVO: Salvar dados
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

    const totalQuantity = values.reduce((a, b) => a + b, 0);
    const percentages = values.map((v) => ((v / totalQuantity) * 100).toFixed(1));

    //  NOVO: Renderizar tabela de resumo
    this.renderInventorySummaryTable(distributionData, labels, values, percentages, totalQuantity);

    const ctx = canvas.getContext("2d");
    
    //  NOVO: Configurações por tipo de gráfico
    const chartConfigs = {
      doughnut: {
        type: "doughnut",
        options: {
          plugins: {
            legend: { 
              position: "right",
              labels: { padding: 15, font: { size: 12 } }
            }
          }
        },
        plugins: [{
          id: 'textCenter',
          afterDraw(chart) {
            const {width, height, ctx} = chart;
            chart.data.datasets.forEach((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              if (!meta || !meta.data) return;
              
              meta.data.forEach((datapoint, index) => {
                const {x, y} = datapoint.getProps(['x', 'y'], true);
                const data = dataset.data[index];
                const percentage = ((data / totalQuantity) * 100).toFixed(0);

                ctx.fillStyle = "white";
                ctx.font = "bold 14px Arial";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(data, x, y - 5);
                
                ctx.font = "bold 12px Arial";
                ctx.fillText(`${percentage}%`, x, y + 15);
              });
            });
          }
        }]
      },
      bar: {
        type: "bar",
        options: {
          indexAxis: "y",
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: (value) => value + " un."
              }
            }
          }
        },
        plugins: []
      },
      pie: {
        type: "pie",
        options: {
          plugins: {
            legend: { 
              position: "right",
              labels: { padding: 15, font: { size: 12 } }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed;
                  const percentage = ((value / totalQuantity) * 100).toFixed(1);
                  return `${context.label}: ${value} un. (${percentage}%)`;
                }
              }
            }
          }
        },
        plugins: []
      }
    };

    const config = chartConfigs[this.currentChartType];

    this.charts["inventoryChart"] = new Chart(ctx, {
      type: config.type,
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              "#FF6F61",
              "#20B2AA",
              "#4D96FF",
              "#FFD700",
              "#6A5ACD",
              "#32CD32",
              "#FF8C00",
              "#DC143C"
            ],
            borderColor: "#fff",
            borderWidth: 2
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...config.options
      },
      plugins: config.plugins
    });
  }

  //  NOVO: Renderizar tabela de resumo de distribuição
  renderInventorySummaryTable(distributionData, labels, values, percentages, totalQuantity) {
    let summaryContainer = document.getElementById("inventory-summary-table");
    
    // Se não existir, criar o container
    if (!summaryContainer) {
      const chartCard = document.querySelector("#inventoryChart").closest(".chart-card");
      summaryContainer = document.createElement("div");
      summaryContainer.id = "inventory-summary-table";
      summaryContainer.style.marginTop = "20px";
      chartCard.appendChild(summaryContainer);
    }

    summaryContainer.innerHTML = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f9f9f9; border-bottom: 2px solid #e5e7eb;">
              <th style="text-align: left; padding: 12px; font-weight: 600; color: #333;">Categoria</th>
              <th style="text-align: right; padding: 12px; font-weight: 600; color: #333;">Quantidade</th>
              <th style="text-align: right; padding: 12px; font-weight: 600; color: #333;">Percentual</th>
            </tr>
          </thead>
          <tbody>
            ${values.map((value, index) => `
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="text-align: left; padding: 12px; color: #555;">
                  <span style="display: inline-block; width: 12px; height: 12px; border-radius: 2px; background: ${'#FF6F61,#20B2AA,#4D96FF,#FFD700,#6A5ACD,#32CD32,#FF8C00,#DC143C'.split(',')[index]}; margin-right: 8px;"></span>
                  ${labels[index]}
                </td>
                <td style="text-align: right; padding: 12px; color: #222; font-weight: 500;">${value} un.</td>
                <td style="text-align: right; padding: 12px; color: #2563eb; font-weight: 600;">${percentages[index]}%</td>
              </tr>
            `).join('')}
            <tr style="background: #f9f9f9; border-top: 2px solid #e5e7eb;">
              <td style="text-align: left; padding: 12px; font-weight: 600; color: #222;">TOTAL</td>
              <td style="text-align: right; padding: 12px; font-weight: 600; color: #222;">${totalQuantity} un.</td>
              <td style="text-align: right; padding: 12px; font-weight: 600; color: #2563eb;">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // =================== TOP SELLING CARDS ===================
  async loadTopSellingCards() {
    const tbody = document.querySelector("#topSellingCardsTable tbody");
    if (!tbody) return;

    //  REMOVIDO: Inputs de data - usar range padrão de 12 meses
    const today = new Date();
    const start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
      .toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];

    const rows = await AnalyticsAPI.getCardSales(start, end);

    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: #999;">Nenhuma venda encontrada.</td></tr>`;
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
    if (!canvas) return;

    const startInput = document.getElementById("profit-start-date");
    const endInput = document.getElementById("profit-end-date");

    //  ATUALIZADO: Usar valores dos inputs (que já têm valores padrão)
    const start = startInput?.value || this.getDateRangeStart();
    const end = endInput?.value || this.getDateRangeEnd();

    const rows = await AnalyticsAPI.getProfitByCategory(start, end);

    canvas.width = canvas.width;
    canvas.height = 420;

    this.profitData = rows; //  NOVO: Salvar dados
    this.updateProfitChart(rows);
  }

  updateProfitChart(rows) {
    const canvas = document.getElementById("profitChart");
    if (!canvas) return;

    if (this.charts["profitChart"]) {
      this.charts["profitChart"].destroy();
      this.charts["profitChart"] = null;
    }

    if (!rows || rows.length === 0) {
      console.warn("Nenhum dado de lucro retornado.");
      return;
    }

    const labels = rows.map((r) => this.mapCategoryLabel(r.category));
    console.log(rows.map(r => r.category));

    const values = rows.map((r) =>
      Number(
        r.total_profit ??
          r.totalProfit ??
          r.total_quantity ??
          r.totalQuantity ??
          0
      )
    );

    const totalProfit = values.reduce((a, b) => a + b, 0);
    const percentages = values.map((v) => ((v / totalProfit) * 100).toFixed(1));

    //  NOVO: Renderizar tabela de resumo de lucro
    this.renderProfitSummaryTable(rows, labels, values, percentages, totalProfit);

    const ctx = canvas.getContext("2d");

    //  NOVO: Configurações por tipo de gráfico
    const chartConfigs = {
      bar: {
        type: "bar",
        options: {
          indexAxis: "y",
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: (value) => "R$ " + value 
              }
            }
          }
        },
        plugins: []
      },
      doughnut: {
        type: "doughnut",
        options: {
          plugins: {
            legend: { 
              position: "right",
              labels: { padding: 15, font: { size: 12 } }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed;
                  const percentage = ((value / totalProfit) * 100).toFixed(1);
                  return `${context.label}: R$ ${value.toLocaleString("pt-BR")} (${percentage}%)`;
                }
              }
            }
          }
        },
        plugins: [{
          id: 'textCenter',
          afterDraw(chart) {
            const {width, height, ctx} = chart;
            chart.data.datasets.forEach((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              if (!meta || !meta.data) return;
              
              meta.data.forEach((datapoint, index) => {
                const {x, y} = datapoint.getProps(['x', 'y'], true);
                const data = dataset.data[index];
                const percentage = ((data / totalProfit) * 100).toFixed(0);

                ctx.fillStyle = "white";
                ctx.font = "bold 12px Arial";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${percentage}%`, x, y);
              });
            });
          }
        }]
      },
      pie: {
        type: "pie",
        options: {
          plugins: {
            legend: { 
              position: "right",
              labels: { padding: 15, font: { size: 12 } }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed;
                  const percentage = ((value / totalProfit) * 100).toFixed(1);
                  return `${context.label}: R$ ${value.toLocaleString("pt-BR")} (${percentage}%)`;
                }
              }
            }
          }
        },
        plugins: []
      }
    };

    const config = chartConfigs[this.currentProfitChartType];

    this.charts["profitChart"] = new Chart(ctx, {
      type: config.type,
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
              "#fb923c",
              "#f43f5e",
              "#06b6d4"
            ],
            borderColor: "#fff",
            borderWidth: 2
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...config.options
      },
      plugins: config.plugins
    });
  }

  //  NOVO: Renderizar tabela de resumo de lucro
  renderProfitSummaryTable(rows, labels, values, percentages, totalProfit) {
    let summaryContainer = document.getElementById("profit-summary-table");
    
    // Se não existir, criar o container
    if (!summaryContainer) {
      const chartCard = document.querySelector("#profitChart").closest(".chart-card");
      summaryContainer = document.createElement("div");
      summaryContainer.id = "profit-summary-table";
      summaryContainer.style.marginTop = "20px";
      chartCard.appendChild(summaryContainer);
    }

    summaryContainer.innerHTML = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f9f9f9; border-bottom: 2px solid #e5e7eb;">
              <th style="text-align: left; padding: 12px; font-weight: 600; color: #333;">Categoria</th>
              <th style="text-align: right; padding: 12px; font-weight: 600; color: #333;">Lucro</th>
              <th style="text-align: right; padding: 12px; font-weight: 600; color: #333;">Participação</th>
            </tr>
          </thead>
          <tbody>
            ${values.map((value, index) => `
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="text-align: left; padding: 12px; color: #555;">
                  <span style="display: inline-block; width: 12px; height: 12px; border-radius: 2px; background: ${'#f87171,#34d399,#60a5fa,#fbbf24,#a78bfa,#fb923c,#f43f5e,#06b6d4'.split(',')[index]}; margin-right: 8px;"></span>
                  ${labels[index]}
                </td>
                <td style="text-align: right; padding: 12px; color: #222; font-weight: 500;">R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; padding: 12px; color: #2563eb; font-weight: 600;">${percentages[index]}%</td>
              </tr>
            `).join('')}
            <tr style="background: #f9f9f9; border-top: 2px solid #e5e7eb;">
              <td style="text-align: left; padding: 12px; font-weight: 600; color: #222;">TOTAL</td>
              <td style="text-align: right; padding: 12px; font-weight: 600; color: #222;">R$ ${totalProfit.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
              <td style="text-align: right; padding: 12px; font-weight: 600; color: #2563eb;">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

    // =================== SPEND VS EARN ===================
  async loadSpendVsEarn() {
    const canvas = document.getElementById("spendEarnChart");
    if (!canvas) return;

    //  ATUALIZADO: Usar valores dos inputs
    const start = document.getElementById("se-start-date")?.value || this.getDateRangeStart();
    const end = document.getElementById("se-end-date")?.value || this.getDateRangeEnd();

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
    const labels = rawLabels.map((mk) => this.normalizeAndFormatMonth(mk));

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
            //  ALTERADO: De "line" para "bar"
            label: "Ganhos",
            type: "bar",
            data: earned,
            backgroundColor: "#22c55e",
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

    //  ATUALIZADO: Usar valores dos inputs
    const start = document.getElementById("valuation-start-date")?.value || this.getDateRangeStart();
    const end = document.getElementById("valuation-end-date")?.value || this.getDateRangeEnd();

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
      return this.normalizeAndFormatMonth(mk);
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

  //  NOVO: Helper para obter data de início (5 meses atrás)
  getDateRangeStart() {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 4);
    return startDate.toISOString().split('T')[0];
  }

  //  NOVO: Helper para obter data de fim (hoje)
  getDateRangeEnd() {
    return new Date().toISOString().split('T')[0];
  }

  // =================== HELPERS ===================
  mapCategoryLabel(code) {
    switch ((code || "").toUpperCase()) {
      case "CARTAS_AVULSAS":
        return "Cartas Avulsas";
      case "BOOSTER_BOX":
        return "Booster Box";
      case "ACESSÓRIOS":
      case "ACCESSORY":
        return "Acessórios";
      case "OUTROS":
      case "OTHERS":
        return "Outros";
      default:
        return code || "Desconhecido";
    }
  }

  //  CORRIGIDO: Função para normalizar e formatar mês corretamente
  normalizeAndFormatMonth(monthString) {
    if (!monthString) return "";
    
    // Se já vem no formato YYYY-MM
    if (/^\d{4}-\d{2}$/.test(monthString)) {
      const [year, month] = monthString.split('-');
      const date = new Date(year, parseInt(month) - 1, 1);
      return date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit"
      });
    }
    
    return monthString;
  }
}

// =================== BOOT ===================
document.addEventListener("DOMContentLoaded", () => {
  window.analyticsManager = new AnalyticsManager();
});
