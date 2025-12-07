/**
 * Dashboard Management System
 * Integração real com backend (Spring Boot)
 */

const CONFIG = {
    API_BASE_URL: 'http://localhost:8080/api/dashboard',
    UPDATE_INTERVAL: 30000,
};

// =========================
// SERVIÇOS DE API
// =========================
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

    static async getStockAgingOverview() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/stock-aging-overview`);
    }

    static async getValuedCards() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/valued-cards`);
    }

    static async getMonthlyAcquisitions() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/monthly-acquisitions`);
    }

    static async getSalesOverview() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/sales-overview`);
    }

    // 🆕 NOVA KPI
    static async getKpisCartas() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/kpis-cartas`);
    }

    static async fetchJSON(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(res.status);
            return await res.json();
        } catch (err) {
            console.error("[API ERROR]", url, err);
            return [];
        }
    }
}

// =========================
// DASHBOARD MANAGER
// =========================
class DashboardManager {
    constructor() {
        this.charts = {};
        this.salesOverviewRaw = [];
        this.monthlyAcquisitionsRaw = [];
        this.init();
    }

    init() {
        this.registerSalesFilters();
        this.registerAcquisitionsFilters();
        this.loadInitialData();
        this.startAutoUpdate();
    }

    // =========================
    // CARREGAMENTO INICIAL
    // =========================
    async loadInitialData() {
        try {
            const [
                totalCards,
                boosterBoxes,
                topPokemon,
                monthlyAcq,
                salesOverview,
                stockAging,
                valuedCards,
                kpisCartas
            ] = await Promise.all([
                DashboardAPI.getTotalCardsInStock(),
                DashboardAPI.getTotalBoosterBoxes(),
                DashboardAPI.getTopPokemonByStock(),
                DashboardAPI.getMonthlyAcquisitions(),
                DashboardAPI.getSalesOverview(),
                DashboardAPI.getStockAgingOverview(),
                DashboardAPI.getValuedCards(),
                DashboardAPI.getKpisCartas()
            ]);

            this.salesOverviewRaw = salesOverview;
            this.monthlyAcquisitionsRaw = monthlyAcq;

            this.updateKPIs({
                totalCards, boosterBoxes, topPokemon, kpisCartas
            });

            this.updateCharts({ stockAging, valuedCards });

            this.updateSalesChart(this.getFilteredSalesOverview());
            this.updateAcquisitionsChart(this.getFilteredMonthlyAcquisitions());

        } catch (e) {
            console.error("Erro ao carregar dados iniciais", e);
        }
    }

    // =========================
    // KPI's
    // =========================
    updateKPIs({ totalCards, boosterBoxes, topPokemon }) {

        // ===== Cartas =====
        const cartasTotal = Number(totalCards.total_cards_in_stock ?? 0);
        const cartasVendidasHoje = Number(totalCards.cards_sold_today ?? 0);
        const cartasCriadasHoje = Number(totalCards.cards_added_today ?? 0);

        const elTotal = document.getElementById("kpi-total-cartas");
        const elVend = document.getElementById("kpi-vendidas-hoje");
        const elCad = document.getElementById("kpi-cadastradas-hoje");

        if (elTotal) elTotal.textContent = cartasTotal;
        if (elVend) elVend.textContent = cartasVendidasHoje;
        if (elCad) elCad.textContent = cartasCriadasHoje;

        // ===== Boosters =====
        const boosterTotal = Number(boosterBoxes.total_boxes_in_stock ?? 0);
        const boosterVendidasHoje = Number(boosterBoxes.boxes_sold_today ?? 0);
        const boosterCriadasHoje = Number(boosterBoxes.boxes_added_today ?? 0);

        const bxTotal = document.getElementById("kpi-boxes-total");
        const bxVend = document.getElementById("kpi-boxes-vendidas-hoje");
        const bxCad = document.getElementById("kpi-boxes-cadastradas-hoje");

        if (bxTotal) bxTotal.textContent = boosterTotal;
        if (bxVend) bxVend.textContent = boosterVendidasHoje;
        if (bxCad) bxCad.textContent = boosterCriadasHoje;

        // ===== Top Pokémon (continua igual) =====
        const topName =
            topPokemon?.pokemonName ??
            topPokemon?.productName ??
            "---";

        const elTop = document.getElementById("total-debts");
        if (elTop) elTop.textContent = topName;
    }


    // =========================
    // CHAMADA CENTRAL DE GRÁFICOS
    // =========================
    updateCharts({ stockAging, valuedCards }) {
        this.updateStockAgingChart(stockAging);
        this.updateTopCardsList(valuedCards);
    }

    // =========================
    // PANORAMA DE VENDAS
    // =========================
    registerSalesFilters() {
        const start = document.getElementById("sales-start-month");
        const end = document.getElementById("sales-end-month");
        const clear = document.getElementById("sales-filter-clear");

        const refresh = () => {
            this.updateSalesChart(this.getFilteredSalesOverview());
        };

        if (start) start.addEventListener("change", refresh);
        if (end) end.addEventListener("change", refresh);

        if (clear) clear.addEventListener("click", () => {
            start.value = "";
            end.value = "";
            this.updateSalesChart(this.salesOverviewRaw);
        });
    }

    normalizeYM(v) {
        return v?.slice(0, 7) ?? null;
    }

    getFilteredSalesOverview() {
        const start = this.normalizeYM(document.getElementById("sales-start-month")?.value);
        const end = this.normalizeYM(document.getElementById("sales-end-month")?.value);

        return this.salesOverviewRaw.filter(item => {
            const key = this.normalizeYM(item.month ?? item.month_year);
            if (!key) return false;
            if (start && key < start) return false;
            if (end && key > end) return false;
            return true;
        });
    }

    updateSalesChart(list) {
        const el = document.getElementById("salesChart");
        if (!el) return;

        if (!list || list.length === 0) {
            if (this.charts.salesChart) this.charts.salesChart.destroy();
            return;
        }

        if (this.charts.salesChart) this.charts.salesChart.destroy();

        const months = new Set();
        const map = new Map();

        list.forEach(i => {
            const m = this.normalizeYM(i.month ?? i.month_year);
            months.add(m);
            if (!map.has(i.product_name)) map.set(i.product_name, {});
            map.get(i.product_name)[m] = i.total_sold;
        });

        const sorted = [...months].sort();

        const labels = sorted.map(m => {
            const d = new Date(m + "-01");
            return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        });

        const colors = ["#20B2AA", "#FF6F61", "#4D96FF", "#FFD700"];

        const datasets = [...map.entries()].map(([prod, obj], idx) => ({
            label: prod,
            data: sorted.map(m => obj[m] ?? 0),
            borderColor: colors[idx % colors.length],
            tension: 0.3,
        }));

        const ctx = el.getContext("2d");
        this.charts.salesChart = new Chart(ctx, {
            type: "line",
            data: { labels, datasets },
            options: { responsive: true }
        });
    }

    // =========================
    // AQUISIÇÕES
    // =========================
    registerAcquisitionsFilters() {
        const start = document.getElementById("acq-start-month");
        const end = document.getElementById("acq-end-month");
        const clear = document.getElementById("acq-filter-clear");

        const refresh = () =>
            this.updateAcquisitionsChart(this.getFilteredMonthlyAcquisitions());

        if (start) start.addEventListener("change", refresh);
        if (end) end.addEventListener("change", refresh);

        if (clear) clear.addEventListener("click", () => {
            start.value = "";
            end.value = "";
            this.updateAcquisitionsChart(this.monthlyAcquisitionsRaw);
        });
    }

    getFilteredMonthlyAcquisitions() {
        const start = this.normalizeYM(document.getElementById("acq-start-month")?.value);
        const end = this.normalizeYM(document.getElementById("acq-end-month")?.value);

        return this.monthlyAcquisitionsRaw.filter(item => {
            const key = this.normalizeYM(item.month);
            if (!key) return false;
            if (start && key < start) return false;
            if (end && key > end) return false;
            return true;
        });
    }

    updateAcquisitionsChart(list) {
        const el = document.getElementById("collectionsChart");
        if (!el) return;

        if (!list || list.length === 0) {
            if (this.charts.collectionsChart) this.charts.collectionsChart.destroy();
            return;
        }

        if (this.charts.collectionsChart) this.charts.collectionsChart.destroy();

        const totals = {};
        list.forEach(i => {
            const m = this.normalizeYM(i.month);
            totals[m] = (totals[m] ?? 0) + Number(i.totalCost);
        });

        const sorted = Object.keys(totals).sort();

        const labels = sorted.map(m => {
            const d = new Date(m + "-01");
            return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        });

        const ctx = el.getContext("2d");
        this.charts.collectionsChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    data: sorted.map(m => totals[m]),
                    backgroundColor: "#4D96FF"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // =========================
    // ENVELHECIMENTO DE ESTOQUE
    // =========================
    updateStockAgingChart(data) {
        const el = document.getElementById("weeklyChart");
        if (!el) return;

        if (this.charts.weeklyChart) this.charts.weeklyChart.destroy();

        const labelField = "product_name" in data[0]
            ? "product_name"
            : Object.keys(data[0])[0];

        const valueField = "days_in_stock" in data[0]
            ? "days_in_stock"
            : Object.keys(data[0])[1];

        const labels = data.map(r => r[labelField]);
        const values = data.map(r => r[valueField]);

        const ctx = el.getContext("2d");
        this.charts.weeklyChart = new Chart(ctx, {
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
                responsive: true,
                indexAxis: "y"
            }
        });
    }

    // =========================
    // CARTAS MAIS VALIOSAS
    // =========================
    updateTopCardsList(list) {
        const container = document.getElementById("top-cards-list");
        container.innerHTML = "";

        list.forEach((c, idx) => {
            const name = c.product_name ?? c.cardName ?? "---";
            const avg = c.avg_sale_price ?? 0;
            const price = c.current_sale_price ?? 0;

            const div = document.createElement("div");
            div.className = "card-item";
            div.innerHTML = `
                <span>#${idx + 1}</span>
                <span>${name}</span>
                <span>Avg: ${this.formatCurrency(avg)}</span>
                <span>Atual: ${this.formatCurrency(price)}</span>
            `;
            container.appendChild(div);
        });
    }

    // =========================
    // AUTO UPDATE
    // =========================
    startAutoUpdate() {
        setInterval(() => this.refreshData(), CONFIG.UPDATE_INTERVAL);
    }

    async refreshData() {
    const totalCards = await DashboardAPI.getTotalCardsInStock();

    const cartasTotal = Number(totalCards.total_cards_in_stock ?? 0);
    const elTotal = document.getElementById("kpi-total-cartas");

    if (elTotal) elTotal.textContent = cartasTotal;
}


    // =========================
    // UTILS
    // =========================
    formatCurrency(v) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(v);
    }
}

// =========================
// START
// =========================
document.addEventListener("DOMContentLoaded", () => {
    window.dashboardManager = new DashboardManager();
});
