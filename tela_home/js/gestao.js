/**
 * Dashboard – Integração com Backend (Spring Boot)
 * Versão alinhada com /monthly-investments (investimento em estoque)
 */

const CONFIG = {
    API_BASE_URL: "http://localhost:8080/api/store-manager-api/dashboard",
    UPDATE_INTERVAL: 30000
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

    // ⚠️ NOVO ENDPOINT
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
        this.init();
    }

    // -------------------------
    // INIT
    // -------------------------
    async init() {
        this.registerSalesFilters();
        this.registerAcquisitionsFilters();

        this.applyDefaultMonthRange();

        await this.loadInitialData();
        this.startAutoUpdate();
    }

    // ======================================================
    // RANGE AUTOMÁTICO DE 5 MESES
    // ======================================================
    getLastFiveMonthsRange() {
        const endDate = new Date();
        endDate.setDate(1);
        const end = endDate.toISOString().slice(0, 7);

        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 4);
        const start = startDate.toISOString().slice(0, 7);

        return { start, end };
    }

    applyDefaultMonthRange() {
        const { start, end } = this.getLastFiveMonthsRange();

        const ids = [
            ["sales-start-month", start],
            ["sales-end-month", end],
            ["acq-start-month", start],
            ["acq-end-month", end]
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
                topCollectionKpi
            ] = await Promise.all([
                DashboardAPI.getKpisCartas(),
                DashboardAPI.getKpisBoosters(),
                DashboardAPI.getTopPokemonByStock(),
                DashboardAPI.getMonthlyInvestments(),
                DashboardAPI.getSalesOverview(),
                DashboardAPI.getStockAgingOverview(),
                DashboardAPI.getValuedCards(),
                DashboardAPI.getTopCardKpi(),
                DashboardAPI.getTopCollectionKpi()
            ]);

            this.salesOverviewRaw = normalizeList(salesOverview);
            this.monthlyInvestmentsRaw = normalizeList(monthlyInvestments);

            this.updateKPIs({
                cartasKpis,
                boostersKpis,
                topPokemon,
                topCardKpi,
                topCollectionKpi
            });

            this.updateCharts({
                stockAging: normalizeList(stockAging),
                valuedCards: normalizeList(valuedCards)
            });

            this.updateSalesChart(this.getFilteredSalesOverview());
            this.updateAcquisitionsChart(this.getFilteredMonthlyInvestments());

        } catch (err) {
            console.error("Erro ao carregar dados iniciais:", err);
        }
    }

    // ======================================================
    // UPDATE KPI
    // ======================================================
    sanitizeKpiValue(v) {
        return (v === null || v === undefined || v === "") ? "0" : v;
    }

    updateKPIs({ cartasKpis, boostersKpis, topPokemon, topCardKpi, topCollectionKpi }) {

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

        // TOP CARD
        if (topCardKpi) {
            document.getElementById("kpi-topcard-nome").textContent =
                this.sanitizeKpiValue(topCardKpi.nome_carta ?? topCardKpi.nomeCarta);

            document.getElementById("kpi-topcard-qtd").textContent =
                this.sanitizeKpiValue(topCardKpi.quantidade_atual ?? topCardKpi.quantidadeAtual);

            document.getElementById("kpi-topcard-vendas").textContent =
                this.sanitizeKpiValue(topCardKpi.vendas_ultimo_mes ?? topCardKpi.vendasUltimoMes);
        }

        // TOP COLEÇÃO  ⭐⭐⭐ AQUI AGORA FUNCIONA PERFEITO ⭐⭐⭐
        if (topCollectionKpi) {
            document.getElementById("kpi-colecao-nome").textContent =
                this.sanitizeKpiValue(topCollectionKpi.colecao ?? topCollectionKpi.nomeColecao);

            document.getElementById("kpi-colecao-vendas").textContent =
                this.sanitizeKpiValue(topCollectionKpi.vendidas_ultimo_mes ?? topCollectionKpi.vendasUltimoMes);

            document.getElementById("kpi-colecao-estoque").textContent =
                this.sanitizeKpiValue(topCollectionKpi.estoque_atual ?? topCollectionKpi.estoqueAtual);
        }

        // TOP POKEMON
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

        document.getElementById("sales-start-month")?.addEventListener("change", refresh);
        document.getElementById("sales-end-month")?.addEventListener("change", refresh);

        document.getElementById("sales-filter-clear")?.addEventListener("click", () => {
            this.applyDefaultMonthRange();
            refresh();
        });
    }

    getFilteredSalesOverview() {
        const start = this.normalizeYM(document.getElementById("sales-start-month")?.value);
        const end = this.normalizeYM(document.getElementById("sales-end-month")?.value);

        return normalizeList(this.salesOverviewRaw).filter(i => {
            const mk = this.normalizeYM(i.month || i.month_year);
            if (!mk) return false;
            if (start && mk < start) return false;
            if (end && mk > end) return false;
            return true;
        });
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

        list.forEach(i => {
            const m = this.normalizeYM(i.month ?? i.month_year);
            if (!m) return;

            months.add(m);
            const prod = i.product_name ?? i.productName ?? "Produto";

            if (!productMap.has(prod)) productMap.set(prod, {});
            productMap.get(prod)[m] = i.total_sold ?? i.totalSold ?? 0;
        });

        const sortedMonths = [...months].sort();

        const labels = sortedMonths.map(m => {
            const d = new Date(m + "-01");
            return d.toLocaleDateString("pt-BR", {
                month: "short",
                year: "2-digit"
            });
        });

        const colors = ["#20B2AA", "#FF6F61", "#4D96FF", "#FFD700", "#6A5ACD", "#32CD32"];

        const datasets = [...productMap.entries()].map(([name, vals], i) => ({
            label: name,
            data: sortedMonths.map(m => vals[m] ?? 0),
            borderColor: colors[i % colors.length],
            backgroundColor: colors[i % colors.length],
            fill: false,
            tension: 0.3
        }));

        this.charts.salesChart = new Chart(canvas.getContext("2d"), {
            type: "line",
            data: { labels, datasets },
            options: { responsive: true }
        });
    }

    // ======================================================
    // AQUISIÇÕES / INVESTIMENTOS
    // ======================================================
    registerAcquisitionsFilters() {
        const refresh = () =>
            this.updateAcquisitionsChart(this.getFilteredMonthlyInvestments());

        document.getElementById("acq-start-month")?.addEventListener("change", refresh);
        document.getElementById("acq-end-month")?.addEventListener("change", refresh);

        document.getElementById("acq-filter-clear")?.addEventListener("click", () => {
            this.applyDefaultMonthRange();
            refresh();
        });
    }

    getFilteredMonthlyInvestments() {
        const start = this.normalizeYM(document.getElementById("acq-start-month")?.value);
        const end = this.normalizeYM(document.getElementById("acq-end-month")?.value);

        return normalizeList(this.monthlyInvestmentsRaw).filter(i => {
            const m = this.normalizeYM(i.month);
            if (!m) return false;
            if (start && m < start) return false;
            if (end && m > end) return false;
            return true;
        });
    }

    updateAcquisitionsChart(list) {
        const canvas = document.getElementById("collectionsChart");
        if (!canvas) return;

        list = normalizeList(list);

        this.charts.collectionsChart?.destroy();

        if (list.length === 0) {
            this.charts.collectionsChart = null;
            return;
        }

        const totals = {};
        list.forEach(i => {
            const m = this.normalizeYM(i.month);
            if (!m) return;

            const val = Number(i.totalInvested ?? i.total_invested ?? 0);
            totals[m] = (totals[m] ?? 0) + val;
        });

        const sorted = Object.keys(totals).sort();

        const labels = sorted.map(m => {
            const d = new Date(m + "-01");
            return d.toLocaleDateString("pt-BR", {
                month: "short",
                year: "2-digit"
            });
        });

        this.charts.collectionsChart = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Total investido em estoque (R$)",
                    data: sorted.map(m => totals[m]),
                    backgroundColor: "#4D96FF"
                }]
            },
            options: { responsive: true }
        });
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

        const labels = list.map(i => i.product_name ?? i.productName ?? "---");
        const values = list.map(i => i.days_in_stock ?? i.daysInStock ?? 0);

        this.charts.weeklyChart = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Dias em estoque",
                    data: values,
                    backgroundColor: "#20B2AA"
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true
            }
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
            container.innerHTML = "<p>Nenhuma carta encontrada.</p>";
            return;
        }

        list.forEach((c, i) => {
            const div = document.createElement("div");
            div.className = "card-item";
            div.innerHTML = `
                <span>#${i + 1}</span>
                <span>${c.product_name ?? c.productName ?? "---"}</span>
                <span>Avg: ${this.formatCurrency(c.avg_sale_price ?? c.avgSalePrice ?? 0)}</span>
                <span>Atual: ${this.formatCurrency(c.current_sale_price ?? c.currentSalePrice ?? 0)}</span>
            `;
            container.appendChild(div);
        });
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
            topPokemon: null
        });
    }

    // ======================================================
    // UTILS
    // ======================================================
    formatCurrency(v) {
        return Number(v).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }
}

// ======================================================
// START
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    window.dashboardManager = new DashboardManager();
});
