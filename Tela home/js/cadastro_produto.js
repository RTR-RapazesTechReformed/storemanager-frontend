/**
 * Sistema de Cadastro de Produto - Integrado com Spring Boot API
 */

// Configurações da API
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/store-manager-api',
    HEADERS: {
        'Content-Type': 'application/json',
        'user-id': 'admin-user-id' // ID fixo para testes
    }
};

// Estado da aplicação
let cards = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadCards();
});

// Event Listeners
function initializeEventListeners() {
    // Formulário de produto
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    
    // Mudança no tipo de produto
    document.getElementById('product-type').addEventListener('change', handleProductTypeChange);
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

// === CARTAS ===

async function loadCards() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/cards`, {
            headers: API_CONFIG.HEADERS
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        cards = await response.json();
        updateCardSelect();
        
    } catch (error) {
        console.error('Erro ao carregar cartas:', error);
        updateCardSelect(true);
    }
}

function updateCardSelect(hasError = false) {
    const select = document.getElementById('card-select');
    
    if (hasError) {
        select.innerHTML = '<option value="">Erro ao carregar cartas</option>';
        return;
    }
    
    if (cards.length === 0) {
        select.innerHTML = '<option value="">Nenhuma carta cadastrada</option>';
        return;
    }
    
    select.innerHTML = '<option value="">Selecione uma carta</option>' +
        cards.map(card => 
            `<option value="${card.id}">${card.name} - ${card.collection?.name || 'Sem coleção'}</option>`
        ).join('');
}

// === PRODUTOS ===

function handleProductTypeChange(event) {
    const productType = event.target.value;
    const cardFields = document.getElementById('card-fields');
    const cardSelect = document.getElementById('card-select');
    
    if (productType === 'CARD') {
        cardFields.classList.add('active');
        cardSelect.required = true;
    } else {
        cardFields.classList.remove('active');
        cardSelect.required = false;
        cardSelect.value = '';
    }
}

async function handleProductSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productData = {
        name: formData.get('name'),
        description: formData.get('description') || null,
        type: formData.get('type'),
        price: parseFloat(formData.get('price')),
        condition: formData.get('condition')
    };
    
    // Adicionar cardId se o tipo for CARD
    if (productData.type === 'CARD') {
        const cardId = formData.get('cardId');
        if (!cardId) {
            showAlert('Selecione uma carta para produtos do tipo CARD', 'error');
            return;
        }
        productData.cardId = cardId;
    }
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products`, {
            method: 'POST',
            headers: API_CONFIG.HEADERS,
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
        }
        
        const newProduct = await response.json();
        showAlert('Produto cadastrado com sucesso!');
        event.target.reset();
        
        // Reset dos campos condicionais
        document.getElementById('card-fields').classList.remove('active');
        document.getElementById('card-select').required = false;
        
        // Opcional: redirecionar após alguns segundos
        setTimeout(() => {
            if (confirm('Produto cadastrado! Deseja ir para o sistema de estoque?')) {
                window.location.href = 'estoque.html';
            }
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        showAlert('Erro ao cadastrar produto: ' + error.message, 'error');
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
        'MINT': 'MINT',
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

