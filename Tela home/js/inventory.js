/**
 * Nota: Depende de API_CONFIG e getHeaders() definidos em estoque.js
 */

let inventory = [];

window.loadInventory = async function() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/inventory`, {
            headers: getHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        inventory = await response.json();
        renderInventory();
        
    } catch (error) {
        console.error('Erro ao carregar inventário:', error);
        showAlert('Erro ao carregar inventário: ' + error.message, 'error');
    }
}

function renderInventory() {
    const container = document.getElementById('inventory-list');
    
    if (!inventory || inventory.length === 0) {
        container.innerHTML = '<div class="loading">Nenhum item no inventário</div>';
        return;
    }
    
    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const lowStockItems = inventory.filter(item => item.quantity > 0 && item.quantity <= 10).length;
    const outOfStockItems = inventory.filter(item => item.quantity === 0).length;
    
    container.innerHTML = `
        <div class="inventory-stats">
            <div class="stat-card">
                <div class="stat-value">${totalItems}</div>
                <div class="stat-label">Produtos Cadastrados</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalQuantity}</div>
                <div class="stat-label">Unidades Total</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-value">${lowStockItems}</div>
                <div class="stat-label">Estoque Baixo</div>
            </div>
            <div class="stat-card danger">
                <div class="stat-value">${outOfStockItems}</div>
                <div class="stat-label">Sem Estoque</div>
            </div>
        </div>
        
        <div class="inventory-grid">
            ${inventory.map(item => {
                const productName = item.product_name || 'Produto sem nome';
                const quantity = item.quantity || 0;
                const updatedAt = item.updated_at || item.created_at;
                const storeName = item.store_name || 'N/A';
                const productType = item.product_type || 'N/A';
                const condition = item.condition || 'N/A';
                const price = item.sell_unit_price || 0;
                const totalValue = item.total_value || 0;
                
                const stockStatus = getStockStatus(quantity);
                
                let updatedDate = 'N/A';
                if (updatedAt) {
                    try {
                        const date = new Date(updatedAt);
                        updatedDate = date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    } catch (e) {
                        updatedDate = 'Data inválida';
                    }
                }
                
                let typeLabel = productType;
                if (productType === 'CARD') typeLabel = 'Card';
                else if (productType === 'BOOSTER_BOX') typeLabel = 'Booster Box';
                else if (productType === 'OTHER_PRODUCT') typeLabel = 'Outro Produto';
                else if (productType === 'ACCESSORY') typeLabel = 'Acessório';
                
                let conditionLabel = condition;
                if (condition === 'MINT') conditionLabel = 'Perfeito';
                else if (condition === 'NEAR_MINT') conditionLabel = 'Quase Perfeito';
                else if (condition === 'LIGHTLY_PLAYED') conditionLabel = 'Levemente Usado';
                else if (condition === 'MODERATELY_PLAYED') conditionLabel = 'Moderadamente Usado';
                else if (condition === 'HEAVILY_PLAYED') conditionLabel = 'Muito Usado';
                else if (condition === 'DAMAGED') conditionLabel = 'Danificado';
                else if (condition === 'SEALED') conditionLabel = 'Lacrado';
                else if (condition === 'NEW') conditionLabel = 'Novo';
                else if (condition === 'USED') conditionLabel = 'Usado';
                
                return `
                    <div class="inventory-card">
                        <div class="inventory-card-header">
                            <h3>${productName}</h3>
                            <span class="stock-status ${stockStatus.class}">${stockStatus.label}</span>
                        </div>
                        
                        <div class="inventory-info">
                            <p><strong>Quantidade:</strong> ${quantity}</p>
                            <p><strong>Loja:</strong> ${storeName}</p>
                            <p><strong>Tipo:</strong> ${typeLabel}</p>
                            <p><strong>Condição:</strong> ${conditionLabel}</p>
                            <p><strong>Preço unitário:</strong> R$ ${price.toFixed(2)}</p>
                            <p class="total-value"><strong>Valor total:</strong> R$ ${totalValue}</p>
                        </div>
                        
                        <div class="inventory-footer">
                            <small>Última atualização: ${updatedDate}</small>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function getStockStatus(quantity) {
    if (quantity === 0) {
        return { class: 'zerado', label: 'Sem estoque' };
    } else if (quantity <= 10) {
        return { class: 'baixo', label: 'Estoque baixo' };
    } else if (quantity <= 30) {
        return { class: 'medio', label: 'Estoque médio' };
    } else {
        return { class: 'alto', label: 'Estoque OK' };
    }
}
