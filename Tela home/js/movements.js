/**
 * Gestão de Movimentações de Estoque - Integrado com Spring Boot API
 * Nota: Depende de API_CONFIG e getHeaders() definidos em estoque.js
 */

let movements = [];
let movementsInterval = null;
let currentMovementType = 'IN';

// Mostrar alerta próximo ao formulário
function showFormAlert(message, type = 'success') {
    const alertsContainer = document.getElementById('form-alerts');
    if (!alertsContainer) {
        // Fallback para alertas globais se não encontrar container do form
        if (typeof showAlert === 'function') {
            showAlert(message, type);
        }
        return;
    }
    
    // Limpar alertas anteriores
    alertsContainer.innerHTML = '';
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertsContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Inicializar event listeners
window.initMovementsModule = function() {
    // Formulário de movimentação
    const form = document.getElementById('movement-form');
    if (form) {
        form.addEventListener('submit', handleMovementSubmit);
    }
    
    // Toggle de tipo de movimentação
    document.querySelectorAll('.toggle-option').forEach(option => {
        option.addEventListener('click', function() {
            setMovementType(this.dataset.type);
        });
    });
    
    console.log('Módulo de movimentações inicializado');
}

// Gerenciar tipo de movimentação
function setMovementType(type) {
    currentMovementType = type;
    
    // Atualizar botões
    document.querySelectorAll('.toggle-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    // Mostrar/ocultar campos condicionais
    document.querySelectorAll('.conditional-fields').forEach(field => {
        field.classList.remove('active');
    });
    
    // Resetar campos obrigatórios
    document.getElementById('unit-purchase-price').required = false;
    document.getElementById('unit-sale-price-sale').required = false;
    
    if (type === 'IN') {
        document.getElementById('purchase-fields').classList.add('active');
        document.getElementById('unit-purchase-price').required = true;
        document.getElementById('movement-quantity').min = "1";
        document.getElementById('movement-quantity').placeholder = "Ex: 10";
    } else if (type === 'OUT') {
        document.getElementById('sale-fields').classList.add('active');
        document.getElementById('unit-sale-price-sale').required = true;
        document.getElementById('movement-quantity').min = "1";
        document.getElementById('movement-quantity').placeholder = "Ex: 5";
    } else if (type === 'ADJUST') {
        document.getElementById('adjust-fields').classList.add('active');
        // Para ajustes, permitir valores negativos
        document.getElementById('movement-quantity').min = "-999";
        document.getElementById('movement-quantity').placeholder = "Ex: +5 ou -3";
    }
}

// Submeter formulário de movimentação
async function handleMovementSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    console.log('=== DADOS DO FORMULÁRIO ===');
    console.log('Tipo:', currentMovementType);
    console.log('Product ID:', formData.get('productId'));
    console.log('Quantity:', formData.get('quantity'));
    console.log('Description:', formData.get('description'));
    
    // Montar objeto com os nomes corretos da API (snake_case)
    const movementData = {
        product_id: formData.get('productId'),
        user_id: sessionStorage.getItem('user-id') || 'unknown',
        quantity: Math.abs(parseInt(formData.get('quantity'))), // SEMPRE POSITIVO para API
        type: currentMovementType,
        description: formData.get('description')
    };
    
    console.log('Quantidade (sempre positiva para API):', movementData.quantity);
    
    // Adicionar campos condicionais baseados no tipo
    if (currentMovementType === 'IN') {
        const purchasePrice = formData.get('unitPurchasePrice');
        const salePrice = formData.get('unitSalePrice');
        
        if (purchasePrice && parseFloat(purchasePrice) > 0) {
            movementData.unit_purchase_price = parseFloat(purchasePrice);
        } else {
            showFormAlert('Preço de compra é obrigatório para entradas', 'error');
            return;
        }
        
        if (salePrice && parseFloat(salePrice) > 0) {
            movementData.unit_sale_price = parseFloat(salePrice);
        }
        
    } else if (currentMovementType === 'OUT') {
        // Para saídas, o campo é 'unit-sale-price-sale'
        const salePriceElement = document.getElementById('unit-sale-price-sale');
        const salePrice = salePriceElement ? salePriceElement.value : null;
        
        if (salePrice && parseFloat(salePrice) > 0) {
            movementData.unit_sale_price = parseFloat(salePrice);
        } else {
            showFormAlert('Preço de venda é obrigatório para saídas', 'error');
            return;
        }
        
    } else if (currentMovementType === 'ADJUST') {
        // Para AJUSTES, manter o sinal que o usuário digitou (pode ser + ou -)
        movementData.quantity = parseInt(formData.get('quantity')); // Mantém sinal original
        console.log('Quantidade para ajuste (mantém sinal):', movementData.quantity);
    }
    
    console.log('=== DADOS FINAIS A ENVIAR ===', movementData);
    
    try {
        await window.createMovement(movementData);
        event.target.reset();
        setMovementType('IN'); 
        
    } catch (error) {
        console.error('Erro ao registrar movimentação:', error);
        // Erro já tratado em createMovement
    }
}

window.loadMovements = async function() {
    console.log('=== CARREGANDO MOVIMENTAÇÕES ===');
    try {
        
        const [movementsResponse, productsResponse] = await Promise.all([
            fetch(`${API_CONFIG.BASE_URL}/inventory-movements`, {
                headers: getHeaders()
            }),
            fetch(`${API_CONFIG.BASE_URL}/products`, {
                headers: getHeaders()
            })
        ]);
        
        console.log('Response status (movements):', movementsResponse.status);
        console.log('Response status (products):', productsResponse.status);
        
        if (!movementsResponse.ok) {
            throw new Error(`Erro HTTP ao carregar movimentações: ${movementsResponse.status}`);
        }
        
        movements = await movementsResponse.json();
        console.log('Movimentações recebidas:', movements.length);
        
        let productsMap = {};
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            productsMap = products.reduce((acc, p) => {
                acc[p.id] = p.name;
                return acc;
            }, {});
        }
        
        // Enriquecer movimentações com nome do produto 
        // TODO : Retornar nome do produto diretamente da API de movimentações
        movements = movements.map(m => ({
            ...m,
            product_name: m.product_name || productsMap[m.product_id] || 'Produto não encontrado'
        }));
        
        // Ordenar por data mais recente primeiro e pegar apenas as 40 últimas
        movements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        movements = movements.slice(0, 40);
        
        renderMovements();
        
    } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
        if (typeof showAlert === 'function') {
            showAlert('Erro ao carregar movimentações: ' + error.message, 'error');
        }
    }
}

function renderMovements() {
    const container = document.getElementById('movements-list');
    
    if (!movements || movements.length === 0) {
        container.innerHTML = '<div class="loading">Nenhuma movimentação registrada</div>';
        return;
    }
    
    console.log('Renderizando movimentações. Total:', movements.length);
    console.log('Primeira movimentação:', movements[0]);
    
    container.innerHTML = `
        <div class="movements-grid">
            ${movements.map(movement => {
                const productName = movement.product_name || 'Produto não encontrado';
                const quantity = movement.quantity || 0;
                const type = movement.type || 'UNKNOWN';
                const description = movement.description || 'Sem descrição';
                const createdAt = movement.created_at || movement.updated_at;
                
                // Determinar quantidade com sinal correto para exibição
                let displayQuantity;
                if (type === 'OUT') {
                    // VENDA: exibir como negativo
                    displayQuantity = -Math.abs(quantity);
                } else if (type === 'IN') {
                    // COMPRA: exibir como positivo
                    displayQuantity = Math.abs(quantity);
                } else {
                    // AJUSTE: manter como está
                    displayQuantity = quantity;
                }
                
                let dateFormatted = 'N/A';
                if (createdAt) {
                    try {
                        const date = new Date(createdAt);
                        dateFormatted = date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    } catch (e) {
                        console.error('Erro ao formatar data:', createdAt, e);
                    }
                }
                
                const typeClass = type.toLowerCase();
                const typeLabel = getMovementTypeLabel(type);
                
                // Calcular valores unitário e total
                let priceInfo = '';
                if (type === 'IN' && movement.unit_purchase_price) {
                    const unitPrice = movement.unit_purchase_price;
                    const total = Math.abs(quantity) * unitPrice;
                    priceInfo = `
                        <p><strong>Preço Unitário (Compra):</strong> R$ ${unitPrice.toFixed(2)}</p>
                        <p class="movement-total"><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
                    `;
                } else if (type === 'OUT' && movement.unit_sale_price) {
                    const unitPrice = movement.unit_sale_price;
                    const total = Math.abs(quantity) * unitPrice;
                    priceInfo = `
                        <p><strong>Preço Unitário (Venda):</strong> R$ ${unitPrice.toFixed(2)}</p>
                        <p class="movement-total"><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
                    `;
                }
                
                return `
                    <div class="movement-card ${typeClass}">
                        <div class="movement-header">
                            <h4>${productName}</h4>
                            <span class="movement-type-badge ${typeClass}">${typeLabel}</span>
                        </div>
                        <p><strong>Quantidade:</strong> ${displayQuantity > 0 ? '+' : ''}${displayQuantity}</p>
                        ${priceInfo}
                        <p class="movement-description">${description}</p>
                        <p class="movement-date"><strong>Data:</strong> ${dateFormatted}</p>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function getMovementTypeLabel(type) {
    const labels = {
        'IN': 'Entrada',
        'OUT': 'Saída',
        'ADJUST': 'Ajuste'
    };
    return labels[type] || type;
}

// Criar nova movimentação
window.createMovement = async function(movementData) {
    console.log('=== CRIANDO MOVIMENTAÇÃO ===');
    console.log('Dados a enviar:', JSON.stringify(movementData, null, 2));
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/inventory-movements`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(movementData)
        });
        
        console.log('Response status (create movement):', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Resposta de erro completa:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { message: errorText };
            }
            throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
        }
        
        const newMovement = await response.json();
        console.log('Movimentação criada:', newMovement);
        
        showFormAlert('Movimentação registrada com sucesso!', 'success');
        
        // Recarregar movimentações e inventário
        window.loadMovements();
        if (typeof window.loadInventory === 'function') {
            window.loadInventory();
        }
        
        return newMovement;
        
    } catch (error) {
        console.error('Erro ao criar movimentação:', error);
        showFormAlert('Erro ao registrar movimentação: ' + error.message, 'error');
        throw error;
    }
}

// TODO: ARRUMAR ESSE TRECHO NAO ESTA FUNCIONANDO CORRETAMENTE 
function startMovementsAutoReload() {
    if (movementsInterval) {
        clearInterval(movementsInterval);
    }
    
    window.loadMovements();
    
    movementsInterval = setInterval(() => {
        // Só recarregar se NÃO estiver na aba de movimentações (evita perder formulário)
        const movementsTab = document.getElementById('movements-tab');
        const isMovementsTabActive = movementsTab && movementsTab.classList.contains('active');
        
        // Verificar se o usuário está digitando em algum campo
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'SELECT'
        );
        
        if (!isMovementsTabActive || !isTyping) {
            console.log('Auto-recarregando movimentações...');
            window.loadMovements();
        } else {
            console.log('Auto-reload pausado (usuário está preenchendo formulário)');
        }
    }, 10000); // 10 segundos
} 

function stopMovementsAutoReload() {
    if (movementsInterval) {
        clearInterval(movementsInterval);
        movementsInterval = null;
    }
}

// Expor funções globalmente
window.startMovementsAutoReload = startMovementsAutoReload;
window.stopMovementsAutoReload = stopMovementsAutoReload;
