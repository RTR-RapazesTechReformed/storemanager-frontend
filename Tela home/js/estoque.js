/**
 * Sistema de Gerenciamento de Estoque
 * JavaScript Vanilla - Clean Code Implementation
 * Estrutura preparada para integração com backend via JSON
 */

// ===== CONFIGURAÇÕES E CONSTANTES =====
const CONFIG = {
    API_BASE_URL: '/api/stock', // Base URL para futuras chamadas de API
    ITEMS_PER_PAGE: 10, // Itens por página
    SEARCH_DEBOUNCE_DELAY: 300, // Delay para busca em ms
    TOAST_DURATION: 5000, // Duração dos toasts em ms
    STORAGE_PREFIX: 'stock_' // Prefixo para localStorage
};

// Seletores de elementos principais
const SELECTORS = {
    // Navegação
    navLinks: '.nav-link',
    
    // Busca e filtros
    searchInput: '#product-search',
    searchButton: '.search-button',
    filtersBtn: '#filters-btn',
    filtersPanel: '#filters-panel',
    categoryFilter: '#category-filter',
    priceFilter: '#price-filter',
    stockFilter: '#stock-filter',
    applyFiltersBtn: '#apply-filters-btn',
    clearFiltersBtn: '#clear-filters-btn',
    
    // Produtos
    productsList: '#products-list',
    productsCountText: '#products-count-text',
    loadingState: '#loading-state',
    emptyState: '#empty-state',
    
    // Ações em massa
    selectAllCheckbox: '#select-all-products',
    bulkDeleteBtn: '#bulk-delete-btn',
    
    // Paginação
    paginationContainer: '#pagination-container',
    paginationInfo: '#pagination-info-text',
    pageNumbers: '#page-numbers',
    prevPageBtn: '#prev-page-btn',
    nextPageBtn: '#next-page-btn',
    
    // Modais
    productModal: '#product-modal',
    productModalOverlay: '#product-modal-overlay',
    productForm: '#product-form',
    modalTitle: '#modal-title',
    modalSaveBtn: '#modal-save-btn',
    modalCancelBtn: '#modal-cancel-btn',
    modalCloseBtn: '#modal-close-btn',
    
    confirmModal: '#confirm-modal',
    confirmModalOverlay: '#confirm-modal-overlay',
    confirmModalMessage: '#confirm-modal-message',
    confirmActionBtn: '#confirm-action-btn',
    confirmCancelBtn: '#confirm-cancel-btn',
    
    // Botões principais
    addProductBtn: '#add-product-btn',
    addFirstProductBtn: '#add-first-product-btn',
    
    // Toast
    toastContainer: '#toast-container'
};

// ===== DADOS MOCKADOS (HARDCODED) =====
// Esta estrutura será substituída por chamadas de API
const MOCK_PRODUCTS = [
    {
        id: 1,
        name: 'Sol e Lua Promos',
        category: 'promocoes',
        categoryDisplay: 'Promoções',
        price: 39.99,
        stock: 15,
        description: 'Cartas promocionais da coleção Sol e Lua',
        icon: '🌟',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20'
    },
    {
        id: 2,
        name: 'Evoluções Prismáticas',
        category: 'evolucoes',
        categoryDisplay: 'Evoluções Prismáticas',
        price: 9.99,
        stock: 0,
        description: 'Cartas de evolução com acabamento prismático',
        icon: '✨',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-18'
    },
    {
        id: 3,
        name: 'Sol e Lua Promos',
        category: 'promocoes',
        categoryDisplay: 'Promoções',
        price: 39.99,
        stock: 8,
        description: 'Cartas promocionais da coleção Sol e Lua',
        icon: '🌟',
        createdAt: '2024-01-12',
        updatedAt: '2024-01-19'
    },
    {
        id: 4,
        name: 'Evoluções Prismáticas',
        category: 'evolucoes',
        categoryDisplay: 'Evoluções Prismáticas',
        price: 5.50,
        stock: 25,
        description: 'Cartas de evolução com acabamento prismático',
        icon: '✨',
        createdAt: '2024-01-08',
        updatedAt: '2024-01-17'
    },
    {
        id: 5,
        name: 'Sol e Lua Promos',
        category: 'promocoes',
        categoryDisplay: 'Promoções',
        price: 39.99,
        stock: 3,
        description: 'Cartas promocionais da coleção Sol e Lua',
        icon: '🌟',
        createdAt: '2024-01-14',
        updatedAt: '2024-01-21'
    },
    {
        id: 6,
        name: 'Evoluções Prismáticas',
        category: 'evolucoes',
        categoryDisplay: 'Evoluções Prismáticas',
        price: 9.99,
        stock: 12,
        description: 'Cartas de evolução com acabamento prismático',
        icon: '✨',
        createdAt: '2024-01-11',
        updatedAt: '2024-01-16'
    },
    {
        id: 7,
        name: 'Sol e Lua Promos',
        category: 'promocoes',
        categoryDisplay: 'Promoções',
        price: 39.99,
        stock: 20,
        description: 'Cartas promocionais da coleção Sol e Lua',
        icon: '🌟',
        createdAt: '2024-01-13',
        updatedAt: '2024-01-22'
    },
    {
        id: 8,
        name: 'Sol e Lua Promos',
        category: 'promocoes',
        categoryDisplay: 'Promoções',
        price: 39.99,
        stock: 7,
        description: 'Cartas promocionais da coleção Sol e Lua',
        icon: '🌟',
        createdAt: '2024-01-09',
        updatedAt: '2024-01-15'
    },
    {
        id: 9,
        name: 'Sol e Lua Promos',
        category: 'promocoes',
        categoryDisplay: 'Promoções',
        price: 39.99,
        stock: 18,
        description: 'Cartas promocionais da coleção Sol e Lua',
        icon: '🌟',
        createdAt: '2024-01-16',
        updatedAt: '2024-01-23'
    }
];

// ===== CLASSE PRINCIPAL =====
class StockManager {
    constructor() {
        this.products = [...MOCK_PRODUCTS]; // Cópia dos dados mockados
        this.filteredProducts = [...this.products];
        this.currentPage = 1;
        this.itemsPerPage = CONFIG.ITEMS_PER_PAGE;
        this.selectedProducts = new Set();
        this.currentEditingProduct = null;
        this.searchTimeout = null;
        this.currentFilters = {
            search: '',
            category: '',
            price: '',
            stock: ''
        };
        
        this.init();
    }

    /**
     * Inicializa o sistema de estoque
     */
    init() {
        this.bindEvents();
        this.loadProducts();
        this.updateUI();
        
        console.log('Sistema de estoque inicializado com sucesso');
    }

    /**
     * Vincula eventos aos elementos da interface
     */
    bindEvents() {
        // Navegação
        this.bindNavigationEvents();
        
        // Busca e filtros
        this.bindSearchEvents();
        this.bindFilterEvents();
        
        // Produtos
        this.bindProductEvents();
        
        // Modais
        this.bindModalEvents();
        
        // Paginação
        this.bindPaginationEvents();
        
        // Ações em massa
        this.bindBulkActionEvents();
    }

    /**
     * Vincula eventos de navegação
     */
    bindNavigationEvents() {
        const navLinks = document.querySelectorAll(SELECTORS.navLinks);
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(link);
            });
        });
    }

    /**
     * Vincula eventos de busca
     */
    bindSearchEvents() {
        const searchInput = document.querySelector(SELECTORS.searchInput);
        const searchButton = document.querySelector(SELECTORS.searchButton);
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeSearch();
                }
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.executeSearch();
            });
        }
    }

    /**
     * Vincula eventos de filtros
     */
    bindFilterEvents() {
        const filtersBtn = document.querySelector(SELECTORS.filtersBtn);
        const filtersPanel = document.querySelector(SELECTORS.filtersPanel);
        const applyFiltersBtn = document.querySelector(SELECTORS.applyFiltersBtn);
        const clearFiltersBtn = document.querySelector(SELECTORS.clearFiltersBtn);
        
        if (filtersBtn) {
            filtersBtn.addEventListener('click', () => {
                this.toggleFiltersPanel();
            });
        }
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
        
        // Filtros individuais
        const filterSelects = [
            SELECTORS.categoryFilter,
            SELECTORS.priceFilter,
            SELECTORS.stockFilter
        ];
        
        filterSelects.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });
    }

    /**
     * Vincula eventos de produtos
     */
    bindProductEvents() {
        const addProductBtn = document.querySelector(SELECTORS.addProductBtn);
        const addFirstProductBtn = document.querySelector(SELECTORS.addFirstProductBtn);
        
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.openProductModal();
            });
        }
        
        if (addFirstProductBtn) {
            addFirstProductBtn.addEventListener('click', () => {
                this.openProductModal();
            });
        }
    }

    /**
     * Vincula eventos de modais
     */
    bindModalEvents() {
        // Modal de produto
        const productModalOverlay = document.querySelector(SELECTORS.productModalOverlay);
        const modalCloseBtn = document.querySelector(SELECTORS.modalCloseBtn);
        const modalCancelBtn = document.querySelector(SELECTORS.modalCancelBtn);
        const modalSaveBtn = document.querySelector(SELECTORS.modalSaveBtn);
        const productForm = document.querySelector(SELECTORS.productForm);
        
        if (productModalOverlay) {
            productModalOverlay.addEventListener('click', (e) => {
                if (e.target === productModalOverlay) {
                    this.closeProductModal();
                }
            });
        }
        
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => {
                this.closeProductModal();
            });
        }
        
        if (modalCancelBtn) {
            modalCancelBtn.addEventListener('click', () => {
                this.closeProductModal();
            });
        }
        
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProductSubmit();
            });
        }
        
        // Modal de confirmação
        const confirmModalOverlay = document.querySelector(SELECTORS.confirmModalOverlay);
        const confirmCancelBtn = document.querySelector(SELECTORS.confirmCancelBtn);
        const confirmActionBtn = document.querySelector(SELECTORS.confirmActionBtn);
        
        if (confirmModalOverlay) {
            confirmModalOverlay.addEventListener('click', (e) => {
                if (e.target === confirmModalOverlay) {
                    this.closeConfirmModal();
                }
            });
        }
        
        if (confirmCancelBtn) {
            confirmCancelBtn.addEventListener('click', () => {
                this.closeConfirmModal();
            });
        }
        
        if (confirmActionBtn) {
            confirmActionBtn.addEventListener('click', () => {
                this.executeConfirmAction();
            });
        }
    }

    /**
     * Vincula eventos de paginação
     */
    bindPaginationEvents() {
        const prevPageBtn = document.querySelector(SELECTORS.prevPageBtn);
        const nextPageBtn = document.querySelector(SELECTORS.nextPageBtn);
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                this.goToPreviousPage();
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                this.goToNextPage();
            });
        }
    }

    /**
     * Vincula eventos de ações em massa
     */
    bindBulkActionEvents() {
        const selectAllCheckbox = document.querySelector(SELECTORS.selectAllCheckbox);
        const bulkDeleteBtn = document.querySelector(SELECTORS.bulkDeleteBtn);
        
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });
        }
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.handleBulkDelete();
            });
        }
    }

    /**
     * Carrega produtos (simula chamada de API)
     */
    async loadProducts() {
        this.showLoading(true);
        
        try {
            // Simula delay de API
            await this.delay(800);
            
            // Em produção, substituir por:
            // const response = await fetch(`${CONFIG.API_BASE_URL}/products`);
            // this.products = await response.json();
            
            this.products = [...MOCK_PRODUCTS];
            this.applyFilters();
            
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.showToast('Erro ao carregar produtos', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Aplica filtros aos produtos
     */
    applyFilters() {
        let filtered = [...this.products];
        
        // Filtro de busca
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.categoryDisplay.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filtro de categoria
        if (this.currentFilters.category) {
            filtered = filtered.filter(product => 
                product.category === this.currentFilters.category
            );
        }
        
        // Filtro de preço
        if (this.currentFilters.price) {
            filtered = this.applyPriceFilter(filtered, this.currentFilters.price);
        }
        
        // Filtro de estoque
        if (this.currentFilters.stock) {
            filtered = this.applyStockFilter(filtered, this.currentFilters.stock);
        }
        
        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.updateUI();
    }

    /**
     * Aplica filtro de preço
     */
    applyPriceFilter(products, priceRange) {
        switch (priceRange) {
            case '0-10':
                return products.filter(p => p.price >= 0 && p.price <= 10);
            case '10-50':
                return products.filter(p => p.price > 10 && p.price <= 50);
            case '50-100':
                return products.filter(p => p.price > 50 && p.price <= 100);
            case '100+':
                return products.filter(p => p.price > 100);
            default:
                return products;
        }
    }

    /**
     * Aplica filtro de estoque
     */
    applyStockFilter(products, stockFilter) {
        switch (stockFilter) {
            case 'available':
                return products.filter(p => p.stock > 5);
            case 'low':
                return products.filter(p => p.stock > 0 && p.stock <= 5);
            case 'out':
                return products.filter(p => p.stock === 0);
            default:
                return products;
        }
    }

    /**
     * Renderiza a lista de produtos
     */
    renderProducts() {
        const productsList = document.querySelector(SELECTORS.productsList);
        const emptyState = document.querySelector(SELECTORS.emptyState);
        
        if (!productsList) return;
        
        // Calcula produtos da página atual
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);
        
        // Limpa lista atual
        productsList.innerHTML = '';
        
        if (pageProducts.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'flex';
                productsList.appendChild(emptyState);
            }
            return;
        }
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Renderiza produtos
        pageProducts.forEach(product => {
            const productElement = this.createProductElement(product);
            productsList.appendChild(productElement);
        });
    }

    /**
     * Cria elemento de produto
     */
    createProductElement(product) {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.dataset.productId = product.id;
        
        const stockStatus = this.getStockStatus(product.stock);
        const isSelected = this.selectedProducts.has(product.id);
        
        productItem.innerHTML = `
            <input type="checkbox" class="product-checkbox" 
                   ${isSelected ? 'checked' : ''} 
                   data-product-id="${product.id}">
            
            <div class="product-info">
                <div class="product-icon">${product.icon}</div>
                <div class="product-details">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.categoryDisplay}</div>
                </div>
            </div>
            
            <div class="product-price">R$ ${product.price.toFixed(2)}</div>
            
            <div class="product-stock">
                <span class="stock-badge ${stockStatus.class}">${stockStatus.text}</span>
                <span class="stock-quantity">${product.stock}</span>
            </div>
            
            <div class="product-actions">
                <button class="action-btn info" title="Informações" data-action="info" data-product-id="${product.id}">
                    ℹ️
                </button>
                <button class="action-btn edit" title="Editar" data-action="edit" data-product-id="${product.id}">
                    ✏️
                </button>
                <button class="action-btn delete" title="Excluir" data-action="delete" data-product-id="${product.id}">
                    🗑️
                </button>
            </div>
        `;
        
        // Vincula eventos do produto
        this.bindProductItemEvents(productItem, product);
        
        return productItem;
    }

    /**
     * Vincula eventos de um item de produto
     */
    bindProductItemEvents(productElement, product) {
        // Checkbox
        const checkbox = productElement.querySelector('.product-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                this.handleProductSelection(product.id, e.target.checked);
            });
        }
        
        // Botões de ação
        const actionButtons = productElement.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                const productId = parseInt(button.dataset.productId);
                this.handleProductAction(action, productId);
            });
        });
    }

    /**
     * Obtém status do estoque
     */
    getStockStatus(stock) {
        if (stock === 0) {
            return { class: 'out', text: 'Sem estoque' };
        } else if (stock <= 5) {
            return { class: 'low', text: 'Baixo' };
        } else {
            return { class: 'available', text: 'Disponível' };
        }
    }

    /**
     * Manipula ações de produto
     */
    handleProductAction(action, productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        switch (action) {
            case 'info':
                this.showProductInfo(product);
                break;
            case 'edit':
                this.editProduct(product);
                break;
            case 'delete':
                this.deleteProduct(product);
                break;
        }
    }

    /**
     * Mostra informações do produto
     */
    showProductInfo(product) {
        const message = `
            <strong>${product.name}</strong><br>
            Categoria: ${product.categoryDisplay}<br>
            Preço: R$ ${product.price.toFixed(2)}<br>
            Estoque: ${product.stock} unidades<br>
            ${product.description ? `Descrição: ${product.description}` : ''}
        `;
        
        this.showToast(message, 'info');
    }

    /**
     * Edita produto
     */
    editProduct(product) {
        this.currentEditingProduct = product;
        this.openProductModal(product);
    }

    /**
     * Exclui produto
     */
    deleteProduct(product) {
        this.showConfirmModal(
            `Tem certeza que deseja excluir o produto "${product.name}"?`,
            () => this.executeDeleteProduct(product.id)
        );
    }

    /**
     * Executa exclusão do produto
     */
    async executeDeleteProduct(productId) {
        try {
            // Em produção, substituir por:
            // await fetch(`${CONFIG.API_BASE_URL}/products/${productId}`, { method: 'DELETE' });
            
            this.products = this.products.filter(p => p.id !== productId);
            this.selectedProducts.delete(productId);
            this.applyFilters();
            this.showToast('Produto excluído com sucesso', 'success');
            
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            this.showToast('Erro ao excluir produto', 'error');
        }
    }

    /**
     * Manipula seleção de produto
     */
    handleProductSelection(productId, isSelected) {
        if (isSelected) {
            this.selectedProducts.add(productId);
        } else {
            this.selectedProducts.delete(productId);
        }
        
        this.updateBulkActions();
    }

    /**
     * Manipula seleção de todos os produtos
     */
    handleSelectAll(selectAll) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);
        
        pageProducts.forEach(product => {
            if (selectAll) {
                this.selectedProducts.add(product.id);
            } else {
                this.selectedProducts.delete(product.id);
            }
        });
        
        this.updateProductCheckboxes();
        this.updateBulkActions();
    }

    /**
     * Atualiza checkboxes dos produtos
     */
    updateProductCheckboxes() {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(checkbox => {
            const productId = parseInt(checkbox.dataset.productId);
            checkbox.checked = this.selectedProducts.has(productId);
        });
    }

    /**
     * Atualiza ações em massa
     */
    updateBulkActions() {
        const bulkDeleteBtn = document.querySelector(SELECTORS.bulkDeleteBtn);
        const selectAllCheckbox = document.querySelector(SELECTORS.selectAllCheckbox);
        
        const hasSelected = this.selectedProducts.size > 0;
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = !hasSelected;
        }
        
        if (selectAllCheckbox) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const pageProducts = this.filteredProducts.slice(startIndex, endIndex);
            const allPageSelected = pageProducts.every(p => this.selectedProducts.has(p.id));
            
            selectAllCheckbox.checked = allPageSelected && pageProducts.length > 0;
            selectAllCheckbox.indeterminate = hasSelected && !allPageSelected;
        }
    }

    /**
     * Manipula exclusão em massa
     */
    handleBulkDelete() {
        const selectedCount = this.selectedProducts.size;
        if (selectedCount === 0) return;
        
        this.showConfirmModal(
            `Tem certeza que deseja excluir ${selectedCount} produto(s) selecionado(s)?`,
            () => this.executeBulkDelete()
        );
    }

    /**
     * Executa exclusão em massa
     */
    async executeBulkDelete() {
        try {
            const selectedIds = Array.from(this.selectedProducts);
            
            // Em produção, substituir por:
            // await fetch(`${CONFIG.API_BASE_URL}/products/bulk-delete`, {
            //     method: 'DELETE',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ ids: selectedIds })
            // });
            
            this.products = this.products.filter(p => !selectedIds.includes(p.id));
            this.selectedProducts.clear();
            this.applyFilters();
            this.showToast(`${selectedIds.length} produto(s) excluído(s) com sucesso`, 'success');
            
        } catch (error) {
            console.error('Erro ao excluir produtos:', error);
            this.showToast('Erro ao excluir produtos', 'error');
        }
    }

    /**
     * Manipula busca com debounce
     */
    handleSearch(searchTerm) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentFilters.search = searchTerm;
            this.applyFilters();
        }, CONFIG.SEARCH_DEBOUNCE_DELAY);
    }

    /**
     * Executa busca imediatamente
     */
    executeSearch() {
        clearTimeout(this.searchTimeout);
        const searchInput = document.querySelector(SELECTORS.searchInput);
        if (searchInput) {
            this.currentFilters.search = searchInput.value;
            this.applyFilters();
        }
    }

    /**
     * Alterna painel de filtros
     */
    toggleFiltersPanel() {
        const filtersPanel = document.querySelector(SELECTORS.filtersPanel);
        if (filtersPanel) {
            filtersPanel.classList.toggle('active');
        }
    }

    /**
     * Limpa filtros
     */
    clearFilters() {
        // Limpa campos de filtro
        const categoryFilter = document.querySelector(SELECTORS.categoryFilter);
        const priceFilter = document.querySelector(SELECTORS.priceFilter);
        const stockFilter = document.querySelector(SELECTORS.stockFilter);
        
        if (categoryFilter) categoryFilter.value = '';
        if (priceFilter) priceFilter.value = '';
        if (stockFilter) stockFilter.value = '';
        
        // Reseta filtros
        this.currentFilters = {
            search: this.currentFilters.search, // Mantém busca
            category: '',
            price: '',
            stock: ''
        };
        
        this.applyFilters();
    }

    /**
     * Abre modal de produto
     */
    openProductModal(product = null) {
        const modalOverlay = document.querySelector(SELECTORS.productModalOverlay);
        const modalTitle = document.querySelector(SELECTORS.modalTitle);
        const productForm = document.querySelector(SELECTORS.productForm);
        
        if (!modalOverlay || !modalTitle || !productForm) return;
        
        // Define título e limpa formulário
        modalTitle.textContent = product ? 'Editar Produto' : 'Adicionar Produto';
        productForm.reset();
        
        // Preenche formulário se editando
        if (product) {
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-stock').value = product.stock;
            document.getElementById('product-description').value = product.description || '';
        }
        
        modalOverlay.classList.add('active');
    }

    /**
     * Fecha modal de produto
     */
    closeProductModal() {
        const modalOverlay = document.querySelector(SELECTORS.productModalOverlay);
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            this.currentEditingProduct = null;
        }
    }

    /**
     * Manipula submissão do formulário de produto
     */
    async handleProductSubmit() {
        const form = document.querySelector(SELECTORS.productForm);
        if (!form) return;
        
        const formData = new FormData(form);
        const productData = {
            name: formData.get('name'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            stock: parseInt(formData.get('stock')),
            description: formData.get('description') || ''
        };
        
        // Validação básica
        if (!productData.name || !productData.category || productData.price < 0 || productData.stock < 0) {
            this.showToast('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        try {
            if (this.currentEditingProduct) {
                await this.updateProduct(this.currentEditingProduct.id, productData);
            } else {
                await this.createProduct(productData);
            }
            
            this.closeProductModal();
            
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            this.showToast('Erro ao salvar produto', 'error');
        }
    }

    /**
     * Cria novo produto
     */
    async createProduct(productData) {
        // Em produção, substituir por:
        // const response = await fetch(`${CONFIG.API_BASE_URL}/products`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(productData)
        // });
        // const newProduct = await response.json();
        
        const newProduct = {
            id: Math.max(...this.products.map(p => p.id)) + 1,
            ...productData,
            categoryDisplay: this.getCategoryDisplay(productData.category),
            icon: this.getCategoryIcon(productData.category),
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
        };
        
        this.products.push(newProduct);
        this.applyFilters();
        this.showToast('Produto criado com sucesso', 'success');
    }

    /**
     * Atualiza produto existente
     */
    async updateProduct(productId, productData) {
        // Em produção, substituir por:
        // await fetch(`${CONFIG.API_BASE_URL}/products/${productId}`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(productData)
        // });
        
        const productIndex = this.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            this.products[productIndex] = {
                ...this.products[productIndex],
                ...productData,
                categoryDisplay: this.getCategoryDisplay(productData.category),
                icon: this.getCategoryIcon(productData.category),
                updatedAt: new Date().toISOString().split('T')[0]
            };
            
            this.applyFilters();
            this.showToast('Produto atualizado com sucesso', 'success');
        }
    }

    /**
     * Obtém display da categoria
     */
    getCategoryDisplay(category) {
        const categories = {
            'promocoes': 'Promoções',
            'evolucoes': 'Evoluções Prismáticas',
            'prismaticas': 'Prismáticas'
        };
        return categories[category] || category;
    }

    /**
     * Obtém ícone da categoria
     */
    getCategoryIcon(category) {
        const icons = {
            'promocoes': '🌟',
            'evolucoes': '✨',
            'prismaticas': '💎'
        };
        return icons[category] || '📦';
    }

    /**
     * Mostra modal de confirmação
     */
    showConfirmModal(message, onConfirm) {
        const modalOverlay = document.querySelector(SELECTORS.confirmModalOverlay);
        const messageElement = document.querySelector(SELECTORS.confirmModalMessage);
        const confirmBtn = document.querySelector(SELECTORS.confirmActionBtn);
        
        if (!modalOverlay || !messageElement) return;
        
        messageElement.innerHTML = message;
        this.confirmAction = onConfirm;
        modalOverlay.classList.add('active');
    }

    /**
     * Fecha modal de confirmação
     */
    closeConfirmModal() {
        const modalOverlay = document.querySelector(SELECTORS.confirmModalOverlay);
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            this.confirmAction = null;
        }
    }

    /**
     * Executa ação confirmada
     */
    executeConfirmAction() {
        if (this.confirmAction) {
            this.confirmAction();
            this.confirmAction = null;
        }
        this.closeConfirmModal();
    }

    /**
     * Navega para página anterior
     */
    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateUI();
        }
    }

    /**
     * Navega para próxima página
     */
    goToNextPage() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.updateUI();
        }
    }

    /**
     * Navega para página específica
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateUI();
        }
    }

    /**
     * Renderiza paginação
     */
    renderPagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const paginationInfo = document.querySelector(SELECTORS.paginationInfo);
        const pageNumbers = document.querySelector(SELECTORS.pageNumbers);
        const prevBtn = document.querySelector(SELECTORS.prevPageBtn);
        const nextBtn = document.querySelector(SELECTORS.nextPageBtn);
        
        // Atualiza informações
        if (paginationInfo) {
            const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredProducts.length);
            paginationInfo.textContent = `Mostrando ${startItem}-${endItem} de ${this.filteredProducts.length} produtos`;
        }
        
        // Atualiza botões de navegação
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages;
        }
        
        // Renderiza números das páginas
        if (pageNumbers) {
            pageNumbers.innerHTML = '';
            
            const maxVisiblePages = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => this.goToPage(i));
                pageNumbers.appendChild(pageBtn);
            }
        }
    }

    /**
     * Atualiza contagem de produtos
     */
    updateProductsCount() {
        const countElement = document.querySelector(SELECTORS.productsCountText);
        if (countElement) {
            const count = this.filteredProducts.length;
            countElement.textContent = `${count} produto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Mostra/oculta estado de carregamento
     */
    showLoading(show) {
        const loadingState = document.querySelector(SELECTORS.loadingState);
        if (loadingState) {
            loadingState.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Atualiza toda a interface
     */
    updateUI() {
        this.renderProducts();
        this.renderPagination();
        this.updateProductsCount();
        this.updateBulkActions();
        this.selectedProducts.clear(); // Limpa seleções ao mudar página
    }

    /**
     * Manipula navegação
     */
    handleNavigation(link) {
        // Remove classe ativa de todos os links
        document.querySelectorAll(SELECTORS.navLinks).forEach(l => {
            l.classList.remove('active');
        });
        
        // Adiciona classe ativa ao link clicado
        link.classList.add('active');
        
        const section = link.dataset.section;
        console.log(`Navegando para seção: ${section}`);
        
        // Aqui você pode implementar lógica específica para cada seção
    }

    /**
     * Mostra toast de notificação
     */
    showToast(message, type = 'info') {
        const toastContainer = document.querySelector(SELECTORS.toastContainer);
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = message;
        
        toastContainer.appendChild(toast);
        
        // Remove toast após tempo configurado
        setTimeout(() => {
            toast.remove();
        }, CONFIG.TOAST_DURATION);
    }

    /**
     * Simula delay (para desenvolvimento)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Salva dados no localStorage
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(`${CONFIG.STORAGE_PREFIX}${key}`, JSON.stringify(data));
        } catch (error) {
            console.warn('Erro ao salvar no localStorage:', error);
        }
    }

    /**
     * Carrega dados do localStorage
     */
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(`${CONFIG.STORAGE_PREFIX}${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.warn('Erro ao carregar do localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Cleanup - limpa recursos
     */
    destroy() {
        clearTimeout(this.searchTimeout);
        console.log('Sistema de estoque destruído');
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se elementos obrigatórios estão presentes
    const requiredElements = [
        SELECTORS.productsList,
        SELECTORS.searchInput
    ];
    
    const missingElements = requiredElements.filter(selector => 
        !document.querySelector(selector)
    );
    
    if (missingElements.length > 0) {
        console.error('Elementos obrigatórios não encontrados:', missingElements);
        return;
    }
    
    // Inicializa o sistema de estoque
    window.stockManager = new StockManager();
    
    // Adiciona suporte para desenvolvimento
    if (typeof window !== 'undefined') {
        window.stock = window.stockManager;
    }
});

// ===== TRATAMENTO DE ERROS GLOBAIS =====
window.addEventListener('error', (event) => {
    console.error('Erro global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejeitada não tratada:', event.reason);
});

// ===== EXPORTAÇÃO PARA MÓDULOS (SE NECESSÁRIO) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StockManager, CONFIG, MOCK_PRODUCTS };
}

