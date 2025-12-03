/**
 * Sistema de Gestão de Estoque - Integrado com Spring Boot API
 */

// Configurações da API
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/store-manager-api'
};

function getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    const sessionUserId = sessionStorage.getItem('user-id');
    if (sessionUserId) headers['user-id'] = sessionUserId;
    return headers;
}

// Estado da aplicação
let currentTab = 'movements';
let products = [];
let deleteProductId = null;
let deleteProductName = null;
// movements, inventory e currentMovementType gerenciados por modules separados

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadProducts();
    
    // Inicializar módulo de movimentações
    if (typeof window.initMovementsModule === 'function') {
        window.initMovementsModule();
    }
    
    // Iniciar movimentações com auto-reload
    if (typeof window.loadMovements === 'function') {
        window.startMovementsAutoReload();
    }
    
    // Carregar inventário
    if (typeof window.loadInventory === 'function') {
        window.loadInventory();
    }
});

// Event Listeners
function initializeEventListeners() {
    // Event listeners específicos de produtos
    // Movimentações gerenciadas por movements.js
    
    // Fechar modal ao clicar fora
    const deleteModal = document.getElementById('delete-product-modal');
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeDeleteProductModal();
            }
        });
    }
}

// Navegação entre abas
function showTab(tabName) {
    // Atualizar botões das abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Atualizar conteúdo das abas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');
    
    currentTab = tabName;
    
    // Recarregar dados se necessário
    if (tabName === 'inventory') {
        if (typeof window.loadInventory === 'function') {
            window.loadInventory();
        }
    } else if (tabName === 'products') {
        loadProducts();
    } else if (tabName === 'movements') {
        if (typeof window.loadMovements === 'function') {
            window.loadMovements();
        }
    }
}

// Gerenciamento de alertas
function showAlert(message, type = 'success') {
    const alertsContainer = document.getElementById('alerts');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertsContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// === PRODUTOS ===

async function loadProducts() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products`, {
            headers: getHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        products = await response.json();
        renderProducts();
        updateProductSelect();
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showAlert('Erro ao carregar produtos: ' + error.message, 'error');
    }
}

function renderProducts() {
    const container = document.getElementById('products-list');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="loading">Nenhum produto cadastrado</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <h3>${product.name}</h3>
            <p><strong>Tipo:</strong> ${getProductTypeLabel(product.type)}</p>
            <p><strong>Preço:</strong> R$ ${product.price.toFixed(2)}</p>
            <p><strong>Condição:</strong> ${getConditionLabel(product.condition)}</p>
            ${product.description ? `<p><strong>Descrição:</strong> ${product.description}</p>` : ''}
            <div class="product-actions">
                <button class="btn btn-secondary" onclick="editProduct('${product.id}')">Editar</button>
                <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

function updateProductSelect() {
    const select = document.getElementById('movement-product');
    if (select) {
        select.innerHTML = '<option value="">Selecione um produto</option>' +
            products.map(product => 
                `<option value="${product.id}">${product.name}</option>`
            ).join('');
    }
}

// Expor função globalmente para ser usada por movements.js
window.updateProductSelect = updateProductSelect;

function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showAlert('Produto não encontrado', 'error');
        return;
    }
    
    deleteProductId = productId;
    deleteProductName = product.name;
    
    document.getElementById('delete-product-name').textContent = product.name;
    document.getElementById('delete-product-modal').classList.add('active');
}

function closeDeleteProductModal() {
    document.getElementById('delete-product-modal').classList.remove('active');
    deleteProductId = null;
    deleteProductName = null;
}

async function confirmDeleteProduct() {
    if (!deleteProductId) return;
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        showAlert('Produto excluído com sucesso!');
        closeDeleteProductModal();
        loadProducts();
        
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showAlert('Erro ao excluir produto: ' + error.message, 'error');
    }
}

// === FUNÇÕES AUXILIARES ===

function getProductTypeLabel(type) {
    const labels = {
        'CARD': 'Carta',
        'BOOSTER_BOX': 'Booster Box',
        'ACCESSORY': 'Acessório'
    };
    return labels[type] || type;
}

function getConditionLabel(condition) {
    const labels = {
        'MINT': 'Mint',
        'LIGHTLY_PLAYED': 'Lightly Played',
        'MODERATELY_PLAYED': 'Moderately Played',
        'HEAVILY_PLAYED': 'Heavily Played',
        'DAMAGED': 'Damaged',
        'SEALED': 'Sealed',
        'OPENED': 'Opened',
        'USED': 'Used'
    };
    return labels[condition] || condition;
}

function getMovementTypeLabel(type) {
    const labels = {
        'IN': 'Entrada (Compra)',
        'OUT': 'Saída (Venda)',
        'ADJUST': 'Ajuste'
    };
    return labels[type] || type;
}

function getStockStatus(quantity) {
    if (quantity === 0) {
        return { class: 'stock-out', label: 'Sem estoque' };
    } else if (quantity <= 5) {
        return { class: 'stock-low', label: 'Estoque baixo' };
    } else {
        return { class: 'stock-high', label: 'Estoque OK' };
    }
}

function editProduct(productId) {
    // Implementar edição de produto
    showAlert('Funcionalidade de edição em desenvolvimento', 'error');
}

window.closeDeleteProductModal = closeDeleteProductModal;
window.confirmDeleteProduct = confirmDeleteProduct;

