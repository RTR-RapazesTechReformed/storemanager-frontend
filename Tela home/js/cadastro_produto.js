/**
 * Sistema de Cadastro de Produto - Integrado com Spring Boot API
 */

const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/store-manager-api',
    HEADERS: {
        'Content-Type': 'application/json',
        'user-id': 'admin-user-id'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

function initializeEventListeners() {
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    document.getElementById('product-type').addEventListener('change', handleProductTypeChange);
}

function showAlert(message, type = 'success') {
    const alertsContainer = document.getElementById('alerts');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertsContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

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
        productId: crypto.randomUUID(), // Gera ID único
        name: formData.get('name'),
        description: formData.get('description') || null,
        type: formData.get('type'),
        price: parseFloat(formData.get('price')),
        condition: formData.get('condition'),
        quantity: parseInt(formData.get('quantity') || 0),
        location: 'main-store'
    };

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/inventory`, {
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

        document.getElementById('card-fields').classList.remove('active');
        document.getElementById('card-select').required = false;

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
