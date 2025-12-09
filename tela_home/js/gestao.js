/**
 * Dashboard – Integração com Backend (Spring Boot)
 * Versão alinhada com /monthly-investments (investimento em estoque)
 */

const CONFIG = {
  API_BASE_URL: "/api/store-manager-api/dashboard",
  UPDATE_INTERVAL: 30000,
};

// ======================================================
// SAFE HELPERS
// ======================================================
function normalizeList(x) {
  return Array.isArray(x) ? x : [];
}

// ======================================================
// API SERVICE
// ======================================================
class DashboardAPI {
  static async fetchJSON(url) {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        console.error("HTTP ERROR:", res.status, url);
        return {};
      }

      return await res.json();
    } catch (err) {
      console.error("Erro na API:", url, err);
      return {};
    }
  }

  static getKpisCartas() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/kpis-cartas`);
  }

  static getKpisBoosters() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/kpis-boosters`);
  }

  static getTopCardKpi() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/kpi-top-card`);
  }

  static getTopCollectionKpi() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/kpi-top-collection`);
  }

  static getTopPokemonByStock() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/top-pokemon-by-stock`);
  }

  static getMonthlyInvestments() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/monthly-investments`);
  }

  static getSalesOverview() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/sales-overview`);
  }

  static getStockAgingOverview() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/stock-aging-overview`);
  }

  static getValuedCards() {
    return this.fetchJSON(`${CONFIG.API_BASE_URL}/valued-cards`);
  }
}

// ======================================================
// DASHBOARD MANAGER
// ======================================================
class DashboardManager {
  constructor() {
    this.charts = {};
    this.salesOverviewRaw = [];
    this.monthlyInvestmentsRaw = [];
    this.selectedSalesProducts = new Set();
    this.maxProductsInChart = 8;
    this.init();
  }

  // -------------------------
  // INIT
  // -------------------------
  async init() {
    this.registerSalesFilters();
    this.registerInvestmentFilters();
    this.registerAcquisitionsFilters();
    this.registerProductSelectors();

    this.applyDefaultMonthRange();

    await this.loadInitialData();
    this.startAutoUpdate();
  }

  // ======================================================
  // RANGE AUTOMÁTICO DE 5 MESES
  // ======================================================
  getLastFiveMonthsRange() {
    const endDate = new Date();
    //  CORRIGIDO: Usar o mês atual, não o primeiro dia
    const end = endDate.toISOString().slice(0, 7);

    const startDate = new Date(endDate);
    //  CORRIGIDO: Subtrair 4 meses para obter 5 meses no total (atual + 4 anteriores)
    startDate.setMonth(startDate.getMonth() - 4);
    const start = startDate.toISOString().slice(0, 7);

    return { start, end };
  }

  applyDefaultMonthRange() {
    const { start, end } = this.getLastFiveMonthsRange();

    const ids = [
      ["sales-start-month", start],
      ["sales-end-month", end],
      ["inv-start-month", start],
      ["inv-end-month", end],
      ["acq-start-month", start],
      ["acq-end-month", end],
    ];

    ids.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    });
  }

  normalizeYM(v) {
    return v?.slice(0, 7) ?? null;
  }

  // ======================================================
  // LOAD INITIAL DATA
  // ======================================================
  async loadInitialData() {
    try {
      const [
        cartasKpis,
        boostersKpis,
        topPokemon,
        monthlyInvestments,
        salesOverview,
        stockAging,
        valuedCards,
        topCardKpi,
        topCollectionKpi,
      ] = await Promise.all([
        DashboardAPI.getKpisCartas(),
        DashboardAPI.getKpisBoosters(),
        DashboardAPI.getTopPokemonByStock(),
        DashboardAPI.getMonthlyInvestments(),
        DashboardAPI.getSalesOverview(),
        DashboardAPI.getStockAgingOverview(),
        DashboardAPI.getValuedCards(),
        DashboardAPI.getTopCardKpi(),
        DashboardAPI.getTopCollectionKpi(),
      ]);

      this.salesOverviewRaw = normalizeList(salesOverview);
      this.monthlyInvestmentsRaw = normalizeList(monthlyInvestments);

      this.updateKPIs({
        cartasKpis,
        boostersKpis,
        topPokemon,
        topCardKpi,
        topCollectionKpi,
      });

      this.updateCharts({
        stockAging: normalizeList(stockAging),
        valuedCards: normalizeList(valuedCards),
      });

      this.updateSalesChart(this.getFilteredSalesOverview());
      this.updateInvestmentChart(this.getFilteredMonthlyInvestments());
      this.updateAcquisitionsChart(normalizeList(stockAging)); //  CORRIGIDO: Usar stockAging diretamente
    } catch (err) {
      console.error("Erro ao carregar dados iniciais:", err);
    }
  }

  // ======================================================
  // UPDATE KPI
  // ======================================================
  sanitizeKpiValue(v) {
    return v === null || v === undefined || v === "" ? "0" : v;
  }

  updateKPIs({
    cartasKpis,
    boostersKpis,
    topPokemon,
    topCardKpi,
    topCollectionKpi,
  }) {
    const map = [
      ["kpi-total-cartas", cartasKpis?.total],
      ["kpi-vendidas-hoje", cartasKpis?.vendidasHoje],
      ["kpi-cadastradas-hoje", cartasKpis?.cadastradasHoje],
      ["kpi-boxes-total", boostersKpis?.total],
      ["kpi-boxes-vendidas-hoje", boostersKpis?.vendidasHoje],
      ["kpi-boxes-cadastradas-hoje", boostersKpis?.cadastradasHoje],
    ];

    map.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = this.sanitizeKpiValue(value);
    });

    if (topCardKpi) {
      document.getElementById("kpi-topcard-nome").textContent =
        this.sanitizeKpiValue(topCardKpi.nome_carta ?? topCardKpi.nomeCarta);
      document.getElementById("kpi-topcard-qtd").textContent =
        this.sanitizeKpiValue(
          topCardKpi.quantidade_atual ?? topCardKpi.quantidadeAtual
        );
      document.getElementById("kpi-topcard-vendas").textContent =
        this.sanitizeKpiValue(
          topCardKpi.vendas_ultimo_mes ?? topCardKpi.vendasUltimoMes
        );
    }

    if (topCollectionKpi) {
      document.getElementById("kpi-colecao-nome").textContent =
        this.sanitizeKpiValue(
          topCollectionKpi.colecao ?? topCollectionKpi.nomeColecao
        );
      document.getElementById("kpi-colecao-vendas").textContent =
        this.sanitizeKpiValue(
          topCollectionKpi.vendidas_ultimo_mes ??
            topCollectionKpi.vendasUltimoMes
        );
      document.getElementById("kpi-colecao-estoque").textContent =
        this.sanitizeKpiValue(
          topCollectionKpi.estoque_atual ?? topCollectionKpi.estoqueAtual
        );
    }

    const topName =
      topPokemon?.pokemonName ??
      topPokemon?.productName ??
      topPokemon?.pokemon_name ??
      "---";

    const elTop = document.getElementById("total-debts");
    if (elTop) elTop.textContent = topName;
  }

  // ======================================================
  // CHARTS
  // ======================================================
  updateCharts({ stockAging, valuedCards }) {
    this.updateStockAgingChart(stockAging);
    this.updateTopCardsList(valuedCards);
  }

  // ======================================================
  // SALES FILTERS
  // ======================================================
  registerSalesFilters() {
    const refresh = () =>
      this.updateSalesChart(this.getFilteredSalesOverview());

    document
      .getElementById("sales-start-month")
      ?.addEventListener("change", refresh);
    document
      .getElementById("sales-end-month")
      ?.addEventListener("change", refresh);

    document
      .getElementById("sales-filter-clear")
      ?.addEventListener("click", () => {
        this.applyDefaultMonthRange();
        refresh();
      });
  }

  getFilteredSalesOverview() {
    const start = this.normalizeYM(
      document.getElementById("sales-start-month")?.value
    );
    const end = this.normalizeYM(
      document.getElementById("sales-end-month")?.value
    );

    return normalizeList(this.salesOverviewRaw).filter((i) => {
      const mk = this.normalizeYM(i.month || i.month_year);
      if (!mk) return false;
      if (start && mk < start) return false;
      if (end && mk > end) return false;
      return true;
    });
  }

  // ======================================================
  //  NOVO: PRODUCT SELECTION CONTROL
  // ======================================================
  registerProductSelectors() {
    document
      .getElementById("sales-product-clear")
      ?.addEventListener("click", () => {
        this.selectedSalesProducts.clear();
        this.updateProductSelector();
        this.updateSalesChart(this.getFilteredSalesOverview());
      });
  }

  updateProductSelector() {
    const container = document.getElementById("products-list-container");
    const countSpan = document.getElementById("products-count");

    if (!container) return;

    //  NOVO: Lista de produtos a excluir
    const productsToExclude = ["Arcanine ex", "Armarouge"];

    const allProducts = [
      ...new Set(
        normalizeList(this.salesOverviewRaw)
          .map((i) => i.product_name ?? i.productName)
          //  NOVO: Filtrar produtos excluídos
          .filter((product) => !productsToExclude.includes(product))
      ),
    ].sort();

    container.innerHTML = "";

    allProducts.forEach((product) => {
      const isSelected = this.selectedSalesProducts.has(product);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `product-button ${isSelected ? "active" : "inactive"}`;
      btn.textContent = product;
      btn.title = product;

      btn.addEventListener("click", () => {
        if (isSelected) {
          this.selectedSalesProducts.delete(product);
        } else {
          if (this.selectedSalesProducts.size < this.maxProductsInChart) {
            this.selectedSalesProducts.add(product);
          } else {
            alert(`Máximo de ${this.maxProductsInChart} produtos permitidos`);
            return;
          }
        }

        this.updateProductSelector();
        this.updateSalesChart(this.getFilteredSalesOverview());
      });

      container.appendChild(btn);
    });

    countSpan.textContent = this.selectedSalesProducts.size;
  }

  updateSalesChart(list) {
    const canvas = document.getElementById("salesChart");
    if (!canvas) return;

    list = normalizeList(list);

    if (list.length === 0) {
      this.charts.salesChart?.destroy();
      this.charts.salesChart = null;
      return;
    }

    this.charts.salesChart?.destroy();

    const months = new Set();
    const productMap = new Map();

    list.forEach((i) => {
      const m = this.normalizeYM(i.month ?? i.month_year);
      if (!m) return;

      months.add(m);
      const prod = i.product_name ?? i.productName ?? "Produto";

      if (!productMap.has(prod)) productMap.set(prod, {});
      productMap.get(prod)[m] = i.total_sold ?? i.totalSold ?? 0;
    });

    const sortedMonths = [...months].sort();

    //  CORRIGIDO: Formatar meses corretamente
    const labels = sortedMonths.map((m) => {
      const [year, month] = m.split("-");
      const date = new Date(year, parseInt(month) - 1, 1);
      return date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
    });

    const colors = [
      "#20B2AA",
      "#FF6F61",
      "#4D96FF",
      "#FFD700",
      "#6A5ACD",
      "#32CD32",
      "#FF8C00",
      "#DC143C",
    ];

    let productsToShow = [...productMap.keys()];

    if (this.selectedSalesProducts.size > 0) {
      productsToShow = productsToShow.filter((p) =>
        this.selectedSalesProducts.has(p)
      );
    } else {
      productsToShow = productsToShow.slice(0, this.maxProductsInChart);
    }

    const datasets = productsToShow.map((name, i) => {
      const vals = productMap.get(name) || {};
      return {
        label: name,
        data: sortedMonths.map((m) => vals[m] ?? 0),
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length],
        fill: false,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    this.charts.salesChart = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
      },
    });

    this.updateProductSelector();
  }

  // ======================================================
  // INVESTIMENTO TOTAL POR MÊS
  // ======================================================
  registerInvestmentFilters() {
    const refresh = () =>
      this.updateInvestmentChart(this.getFilteredMonthlyInvestments());

    document
      .getElementById("inv-start-month")
      ?.addEventListener("change", refresh);
    document
      .getElementById("inv-end-month")
      ?.addEventListener("change", refresh);

    document
      .getElementById("inv-filter-clear")
      ?.addEventListener("click", () => {
        this.applyDefaultMonthRange();
        refresh();
      });
  }

  getFilteredMonthlyInvestments() {
    const start = this.normalizeYM(
      document.getElementById("inv-start-month")?.value
    );
    const end = this.normalizeYM(
      document.getElementById("inv-end-month")?.value
    );

    return normalizeList(this.monthlyInvestmentsRaw).filter((i) => {
      const m = this.normalizeYM(i.month);
      if (!m) return false;
      if (start && m < start) return false;
      if (end && m > end) return false;
      return true;
    });
  }

  updateInvestmentChart(list) {
    const canvas = document.getElementById("investmentChart");
    if (!canvas) return;

    list = normalizeList(list);

    this.charts.investmentChart?.destroy();

    if (list.length === 0) {
      this.charts.investmentChart = null;
      return;
    }

    const monthTotals = {};

    list.forEach((i) => {
      const m = this.normalizeYM(i.month);
      if (!m) return;

      const totalInvested = Number(i.totalInvested ?? i.total_invested ?? 0);
      monthTotals[m] = (monthTotals[m] ?? 0) + totalInvested;
    });

    const sortedMonths = Object.keys(monthTotals).sort();

    //  CORRIGIDO: Formatar meses corretamente
    const labels = sortedMonths.map((m) => {
      const [year, month] = m.split("-");
      const date = new Date(year, parseInt(month) - 1, 1);
      return date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
    });

    //  NOVO: Renderizar tabela de investimentos por mês
    this.renderInvestmentByMonthTable(list, sortedMonths);

    this.charts.investmentChart = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Investimento Total em Estoque (R$)",
            data: sortedMonths.map((m) => monthTotals[m]),
            backgroundColor: "#52C41A",
            borderColor: "#3d8b13",
            borderWidth: 1,
            borderRadius: 4,
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
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return (
                  "R$ " +
                  value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })
                );
              },
            },
          },
        },
      },
    });
  }

  //  NOVO: Renderizar tabela de investimentos por mês
  renderInvestmentByMonthTable(list, sortedMonths) {
    let summaryContainer = document.getElementById("investment-by-month-table");

    // Se não existir, criar o container
    if (!summaryContainer) {
      const chartCard = document
        .querySelector("#investmentChart")
        .closest(".chart-card");
      summaryContainer = document.createElement("div");
      summaryContainer.id = "investment-by-month-table";
      summaryContainer.style.marginTop = "30px";
      chartCard.appendChild(summaryContainer);
    }

    // Agrupar produtos por mês
    const productsByMonth = {};

    sortedMonths.forEach((month) => {
      productsByMonth[month] = normalizeList(list).filter((item) => {
        const itemMonth = this.normalizeYM(item.month);
        return itemMonth === month;
      });
    });

    // Construir HTML
    let html = '<div style="padding: 10px 0;">';

    sortedMonths.forEach((month) => {
      //  CORRIGIDO: Formatar mês corretamente
      const [year, monthNum] = month.split("-");
      const monthDate = new Date(year, parseInt(monthNum) - 1, 1);
      const monthLabel =
        monthDate
          .toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })
          .charAt(0)
          .toUpperCase() +
        monthDate
          .toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })
          .slice(1);

      const products = productsByMonth[month];
      const totalMonthly = products.reduce(
        (sum, p) => sum + Number(p.totalInvested ?? p.total_invested ?? 0),
        0
      );

      html += `
            <div style="margin-bottom: 25px; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: #fafafa;">
              <h4 style="margin: 0 0 12px 0; color: #222; font-size: 14px; font-weight: 600;">
                ${monthLabel}
                <span style="float: right; color: #52C41A; font-weight: 700;">
                  Total: R$ ${totalMonthly.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </h4>
              <div style="clear: both;"></div>
          `;

      if (products.length === 0) {
        html +=
          '<p style="color: #999; font-size: 12px; margin: 8px 0;">Nenhum produto inserido</p>';
      } else {
        html += '<ul style="list-style: none; padding: 0; margin: 0;">';
        products.forEach((product) => {
          const productName =
            product.product_name ??
            product.productName ??
            "Produto desconhecido";
          const quantity = Number(product.quantity ?? 0);
          const totalPrice = Number(
            product.totalInvested ?? product.total_invested ?? 0
          );

          const quantityDisplay =
            quantity > 0
              ? `<span style="color: #999; margin-left: 8px;">(${quantity} un.)</span>`
              : "";

          html += `
                <li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                  <span style="flex: 1;">
                    <strong style="color: #333;">${productName}</strong>
                    ${quantityDisplay}
                  </span>
                  <span style="color: #52C41A; font-weight: 600; white-space: nowrap; margin-left: 10px;">
                    R$ ${totalPrice.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </li>
              `;
        });
        html += "</ul>";
      }

      html += "</div>";
    });

    html += "</div>";

    summaryContainer.innerHTML = html;
  }

  // ======================================================
  // AQUISIÇÕES / INVESTIMENTOS
  // ======================================================
  registerAcquisitionsFilters() {
    //  REMOVIDO: Não precisa de filtros de data para produtos envelhecendo
    // Os dados são exibidos em tempo real
  }

  getFilteredAcquisitionsByProducts() {
    //  REMOVIDO: Não precisa filtrar por data
    return normalizeList(this.salesOverviewRaw);
  }

  updateAcquisitionsChart(list) {
    const detailsContainer = document.getElementById("acq-details");
    if (!detailsContainer) return;

    list = normalizeList(list);

    if (list.length === 0) {
      detailsContainer.innerHTML =
        "<p>Nenhum produto envelhecendo encontrado.</p>";
      return;
    }

    //  NOVO: Renderizar lista de produtos envelhecendo
    this.renderAgedProductsList(list, detailsContainer);
  }

  //  NOVO: Renderizar lista de produtos envelhecendo
  renderAgedProductsList(list, container) {
    if (!container) return;

    container.innerHTML = "";

    //  CORRIGIDO: Filtrar produtos com quantidade > 0, preço >= 0 E dias em estoque > 0
    const validProducts = normalizeList(list).filter((product) => {
      const quantity = product.current_quantity ?? 0;
      const price = product.current_price ?? 0;
      const daysInStock = product.days_in_stock ?? 0;
      return quantity > 0 && price >= 0 && daysInStock > 0;
    });

    if (validProducts.length === 0) {
      container.innerHTML =
        "<p style='padding: 20px; text-align: center; color: #666;'>Nenhum produto envelhecendo encontrado.</p>";
      return;
    }

    // Ordenar por dias em estoque (maior primeiro)
    const sortedList = [...validProducts].sort(
      (a, b) => (b.days_in_stock ?? 0) - (a.days_in_stock ?? 0)
    );

    //  NOVO: Criar grid container
    const gridContainer = document.createElement("div");
    gridContainer.className = "aged-products-grid";
    gridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            padding: 10px 0;
        `;

    sortedList.forEach((product, index) => {
      const daysInStock = product.days_in_stock ?? 0;
      const productName = product.product_name ?? "Produto desconhecido";
      const quantity = product.current_quantity ?? 0;
      const price = product.current_price ?? 0;
      const condition = product.condition_name ?? "---";
      const createdAt = product.product_created_at
        ? new Date(product.product_created_at).toLocaleDateString("pt-BR")
        : "---";
      const lastMovement = product.last_movement_date
        ? new Date(product.last_movement_date).toLocaleDateString("pt-BR")
        : "---";

      //  Determinar cor baseada em dias em estoque
      let urgencyClass = "aged-low";
      let urgencyColor = "#FFD700";
      if (daysInStock > 180) {
        urgencyClass = "aged-critical";
        urgencyColor = "#FF4D4F";
      } else if (daysInStock > 120) {
        urgencyClass = "aged-high";
        urgencyColor = "#FF7A45";
      } else if (daysInStock > 60) {
        urgencyClass = "aged-medium";
        urgencyColor = "#FFA940";
      }

      const productItem = document.createElement("div");
      productItem.className = `aged-product-card ${urgencyClass}`;
      productItem.style.cssText = `
                background: white;
                border: 2px solid ${urgencyColor};
                border-radius: 8px;
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                transition: all 0.3s ease;
            `;

      productItem.onmouseover = function () {
        this.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.15)";
        this.style.transform = "translateY(-2px)";
      };

      productItem.onmouseout = function () {
        this.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
        this.style.transform = "translateY(0)";
      };

      productItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #222; word-break: break-word;">
                            ${productName}
                        </h4>
                        <span style="display: inline-block; background: ${urgencyColor}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">
                            ${daysInStock} dias
                        </span>
                    </div>
                    <div style="flex-shrink: 0; text-align: center;">
                        <div style="font-size: 11px; color: #999; font-weight: 500;">Rank</div>
                        <div style="font-size: 18px; font-weight: 700; color: ${urgencyColor};">#${
        index + 1
      }</div>
                    </div>
                </div>

                <div style="border-top: 1px solid #f0f0f0; padding-top: 10px; display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Condição:</span>
                        <span style="font-weight: 500; color: #333;">${condition}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Estoque:</span>
                        <span style="font-weight: 500; color: #333;">${quantity} un.</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Preço:</span>
                        <span style="font-weight: 600; color: #52C41A;">R$ ${price.toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 }
                        )}</span>
                    </div>
                </div>

                <div style="border-top: 1px solid #f0f0f0; padding-top: 10px; display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Cadastro:</span>
                        <span style="color: #555;">${createdAt}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Última movimentação:</span>
                        <span style="color: #555;">${lastMovement}</span>
                    </div>
                </div>
            `;

      gridContainer.appendChild(productItem);
    });

    container.appendChild(gridContainer);
  }

  // ======================================================
  // ENVELHECIMENTO
  // ======================================================
  updateStockAgingChart(list) {
    const canvas = document.getElementById("weeklyChart");
    if (!canvas) return;

    list = normalizeList(list);

    if (list.length === 0) return;

    this.charts.weeklyChart?.destroy();

    const labels = list.map((i) => i.product_name ?? i.productName ?? "---");
    const values = list.map((i) => i.days_in_stock ?? i.daysInStock ?? 0);

    this.charts.weeklyChart = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Dias em estoque",
            data: values,
            backgroundColor: "#20B2AA",
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
      },
    });
  }

  // ======================================================
  // VALUED CARDS LIST
  // ======================================================
  updateTopCardsList(list) {
    const container = document.getElementById("top-cards-list");
    container.innerHTML = "";

    list = normalizeList(list);

    if (list.length === 0) {
      container.innerHTML = "<p>Nenhum produto encontrado.</p>";
      return;
    }

    //  NOVO: Criar grid container
    const gridContainer = document.createElement("div");
    gridContainer.className = "valued-products-grid";
    gridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            padding: 10px 0;
        `;

    list.forEach((product, i) => {
      const productName = product.product_name ?? product.productName ?? "---";
      const description = product.product_description ?? "---";
      const currentPrice = Number(product.current_sale_price ?? 0);
      const avgPrice = Number(product.avg_sale_price ?? 0);
      const maxPrice = Number(product.max_sale_price ?? 0);
      const minPrice = Number(product.min_sale_price ?? 0);
      const currentStock = Number(product.current_stock ?? 0);
      const percentageChange = Number(product.percentage_change ?? 0);
      const lastSale = product.last_sale
        ? new Date(product.last_sale).toLocaleDateString("pt-BR")
        : "---";
      const differenceFromAvg = Number(product.difference_from_avg ?? 0);

      // Determinar cor baseada na variação de preço
      let priceChangeClass = "price-neutral";
      let priceColor = "#FFD700";
      if (percentageChange > 5) {
        priceChangeClass = "price-up";
        priceColor = "#52C41A";
      } else if (percentageChange < -5) {
        priceChangeClass = "price-down";
        priceColor = "#FF4D4F";
      }

      const productItem = document.createElement("div");
      productItem.className = `valued-product-card ${priceChangeClass}`;
      productItem.style.cssText = `
                background: white;
                border: 2px solid ${priceColor};
                border-radius: 8px;
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                transition: all 0.3s ease;
            `;

      productItem.onmouseover = function () {
        this.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.15)";
        this.style.transform = "translateY(-2px)";
      };

      productItem.onmouseout = function () {
        this.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
        this.style.transform = "translateY(0)";
      };

      productItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #222; word-break: break-word;">
                            ${productName}
                        </h4>
                        <p style="margin: 0; font-size: 11px; color: #999; font-style: italic; line-height: 1.3;">
                            ${description}
                        </p>
                    </div>
                    <div style="flex-shrink: 0; text-align: center;">
                        <div style="font-size: 11px; color: #999; font-weight: 500;">Rank</div>
                        <div style="font-size: 18px; font-weight: 700; color: ${priceColor};">#${
        i + 1
      }</div>
                    </div>
                </div>

                <div style="border-top: 1px solid #f0f0f0; padding-top: 10px; display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Preço Atual:</span>
                        <span style="font-weight: 600; color: ${priceColor};">R$ ${currentPrice.toLocaleString(
        "pt-BR",
        { minimumFractionDigits: 2 }
      )}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Preço Médio:</span>
                        <span style="font-weight: 500; color: #333;">R$ ${avgPrice.toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 }
                        )}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Variação:</span>
                        <span style="font-weight: 600; color: ${priceColor};">${
        percentageChange > 0 ? "+" : ""
      }${percentageChange.toFixed(2)}%</span>
                    </div>
                </div>

                <div style="border-top: 1px solid #f0f0f0; padding-top: 10px; display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Min/Máx:</span>
                        <span style="color: #555;">R$ ${minPrice.toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 }
                        )} / R$ ${maxPrice.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Estoque:</span>
                        <span style="color: #555;">${currentStock} un.</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #999;">Última Venda:</span>
                        <span style="color: #555;">${lastSale}</span>
                    </div>
                </div>
            `;

      gridContainer.appendChild(productItem);
    });

    container.appendChild(gridContainer);
  }

  // ======================================================
  // AUTO UPDATE (KPIs)
  // ======================================================
  startAutoUpdate() {
    setInterval(() => this.refreshKPIs(), CONFIG.UPDATE_INTERVAL);
  }

  async refreshKPIs() {
    const cartas = await DashboardAPI.getKpisCartas();
    const boosters = await DashboardAPI.getKpisBoosters();
    const topCardKpi = await DashboardAPI.getTopCardKpi();
    const topCollectionKpi = await DashboardAPI.getTopCollectionKpi();

    this.updateKPIs({
      cartasKpis: cartas,
      boostersKpis: boosters,
      topCardKpi,
      topCollectionKpi,
      topPokemon: null,
    });
  }

  // ======================================================
  // UTILS
  // ======================================================
  formatCurrency(v) {
    return Number(v).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
}

// ======================================================
// START
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  window.dashboardManager = new DashboardManager();
});
