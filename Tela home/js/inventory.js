/**
 * Nota: Depende de API_CONFIG e getHeaders() definidos em estoque.js
 */

let inventory = [];

window.loadInventory = async function() {
    console.log('=== INICIANDO CARREGAMENTO DO INVENTÁRIO ===');
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/inventory`, {
            headers: getHeaders()
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        inventory = await response.json();
        console.log('Dados do inventário recebidos:', inventory);
        console.log('Total de itens:', inventory.length);
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
    
    console.log('Renderizando inventário. Primeiro item:', inventory[0]);
    
    container.innerHTML = `
        <div class="inventory-grid">
            ${inventory.map(item => {
                const productName = item.product_name || 'Produto sem nome';
                const quantity = item.quantity || 0;
                const updatedAt = item.updated_at || item.created_at;
                
                const stockStatus = getStockStatus(quantity);
                
                let updatedDate = 'N/A';
                if (updatedAt) {
                    try {
                        // Formato: "2025-12-02T23:42:28"
                        const date = new Date(updatedAt);
                        updatedDate = date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    } catch (e) {
                        console.error('Erro ao formatar data:', updatedAt, e);
                        updatedDate = 'Data inválida';
                    }
                }
                
                return `
                    <div class="inventory-card">
                        <h3>${productName}</h3>
                        <p>
                            <strong>Quantidade:</strong> ${quantity} 
                            <span class="stock-status ${stockStatus.class}">${stockStatus.label}</span>
                        </p>
                        <p><strong>Última atualização:</strong> ${updatedDate}</p>
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
