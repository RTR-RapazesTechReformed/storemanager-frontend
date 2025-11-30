/**
 * Sistema de Gestão de Estoque - Integrado com Spring Boot API
 */

// Configurações da API
const API_CONFIG = {
  BASE_URL: "/api/store-manager-api",
  HEADERS: {
    "Content-Type": "application/json",
    "user-id": "admin-user-id", // ID fixo para testes
  },
};

// Estado da aplicação
let currentTab = "movements";
let currentMovementType = "IN";
let products = [];
let movements = [];
let inventory = [];

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners();
  loadProducts();
  loadMovements();
  loadInventory();
});

// Event Listeners
function initializeEventListeners() {
  // Formulário de movimentação
  document
    .getElementById("movement-form")
    .addEventListener("submit", handleMovementSubmit);

  // Toggle de tipo de movimentação
  document.querySelectorAll(".toggle-option").forEach((option) => {
    option.addEventListener("click", function () {
      setMovementType(this.dataset.type);
    });
  });
}

// Navegação entre abas
function showTab(tabName) {
  // Atualizar botões das abas
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  event.target.classList.add("active");

  // Atualizar conteúdo das abas
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(tabName + "-tab").classList.add("active");

  currentTab = tabName;

  // Recarregar dados se necessário
  if (tabName === "inventory") {
    loadInventory();
  } else if (tabName === "products") {
    loadProducts();
  }
}

// Gerenciamento de alertas
function showAlert(message, type = "success") {
  const alertsContainer = document.getElementById("alerts");
  const alert = document.createElement("div");
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
      headers: API_CONFIG.HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    products = await response.json();
    renderProducts();
    updateProductSelect();
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    showAlert("Erro ao carregar produtos: " + error.message, "error");
  }
}

function renderProducts() {
  const container = document.getElementById("products-list");

  if (products.length === 0) {
    container.innerHTML =
      '<div class="loading">Nenhum produto cadastrado</div>';
    return;
  }

  container.innerHTML = products
    .map(
      (product) => `
        <div class="product-card">
            <h3>${product.name}</h3>
            <p><strong>Tipo:</strong> ${getProductTypeLabel(product.type)}</p>
            <p><strong>Preço:</strong> R$ ${product.price.toFixed(2)}</p>
            <p><strong>Condição:</strong> ${getConditionLabel(
              product.condition
            )}</p>
            ${
              product.description
                ? `<p><strong>Descrição:</strong> ${product.description}</p>`
                : ""
            }
            <div class="product-actions">
                <button class="btn btn-secondary" onclick="editProduct('${
                  product.id
                }')">Editar</button>
                <button class="btn btn-danger" onclick="deleteProduct('${
                  product.id
                }')">Excluir</button>
            </div>
        </div>
    `
    )
    .join("");
}

function updateProductSelect() {
  const select = document.getElementById("movement-product");
  select.innerHTML =
    '<option value="">Selecione um produto</option>' +
    products
      .map(
        (product) => `<option value="${product.id}">${product.name}</option>`
      )
      .join("");
}

async function deleteProduct(productId) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) {
    return;
  }

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/products/${productId}`,
      {
        method: "DELETE",
        headers: API_CONFIG.HEADERS,
      }
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    showAlert("Produto excluído com sucesso!");
    loadProducts();
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    showAlert("Erro ao excluir produto: " + error.message, "error");
  }
}

// === MOVIMENTAÇÕES ===

function setMovementType(type) {
  currentMovementType = type;

  // Atualizar botões
  document.querySelectorAll(".toggle-option").forEach((option) => {
    option.classList.remove("active");
  });
  document.querySelector(`[data-type="${type}"]`).classList.add("active");

  // Mostrar/ocultar campos condicionais
  document.querySelectorAll(".conditional-fields").forEach((field) => {
    field.classList.remove("active");
  });

  // Resetar campos obrigatórios
  document.getElementById("unit-purchase-price").required = false;
  document.getElementById("unit-sale-price-sale").required = false;

  if (type === "IN") {
    document.getElementById("purchase-fields").classList.add("active");
    document.getElementById("unit-purchase-price").required = true;
    // Permitir quantidade negativa para ajustes
    document.getElementById("movement-quantity").min = "1";
  } else if (type === "OUT") {
    document.getElementById("sale-fields").classList.add("active");
    document.getElementById("unit-sale-price-sale").required = true;
    document.getElementById("movement-quantity").min = "1";
  } else if (type === "ADJUST") {
    document.getElementById("adjust-fields").classList.add("active");
    // Para ajustes, permitir valores negativos
    document.getElementById("movement-quantity").min = "-999";
  }
}

async function handleMovementSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const movementData = {
    productId: formData.get("productId"),
    userId: API_CONFIG.HEADERS["user-id"],
    quantity: parseInt(formData.get("quantity")),
    type: currentMovementType,
    description: formData.get("description"),
  };

  // Adicionar campos condicionais baseados no tipo
  if (currentMovementType === "IN") {
    const purchasePrice = formData.get("unitPurchasePrice");
    const salePrice = formData.get("unitSalePrice");

    if (purchasePrice) {
      movementData.unitPurchasePrice = parseFloat(purchasePrice);
    }
    if (salePrice) {
      movementData.unitSalePrice = parseFloat(salePrice);
    }
  } else if (currentMovementType === "OUT") {
    const salePrice = formData.get("unitSalePrice");
    if (salePrice) {
      movementData.unitSalePrice = parseFloat(salePrice);
    }
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/inventory-movements`, {
      method: "POST",
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(movementData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    const newMovement = await response.json();
    showAlert("Movimentação registrada com sucesso!");
    event.target.reset();
    setMovementType("IN"); // Reset para entrada
    loadMovements();
    loadInventory();
  } catch (error) {
    console.error("Erro ao registrar movimentação:", error);
    showAlert("Erro ao registrar movimentação: " + error.message, "error");
  }
}

async function loadMovements() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/inventory-movements`, {
      headers: API_CONFIG.HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    movements = await response.json();
    renderMovements();
  } catch (error) {
    console.error("Erro ao carregar movimentações:", error);
    showAlert("Erro ao carregar movimentações: " + error.message, "error");
  }
}

function renderMovements() {
  const container = document.getElementById("movements-list");

  if (movements.length === 0) {
    container.innerHTML =
      '<div class="loading">Nenhuma movimentação registrada</div>';
    return;
  }

  container.innerHTML = movements
    .map((movement) => {
      const product = products.find((p) => p.id === movement.productId);
      const productName = product ? product.name : "Produto não encontrado";

      return `
            <div class="movement-item ${movement.type.toLowerCase()}">
                <h4>${getMovementTypeLabel(movement.type)}</h4>
                <p><strong>Produto:</strong> ${productName}</p>
                <p><strong>Quantidade:</strong> ${movement.quantity}</p>
                <p><strong>Descrição:</strong> ${movement.description}</p>
                ${
                  movement.unitPurchasePrice
                    ? `<p><strong>Preço de Compra:</strong> R$ ${movement.unitPurchasePrice.toFixed(
                        2
                      )}</p>`
                    : ""
                }
                ${
                  movement.unitSalePrice
                    ? `<p><strong>Preço de Venda:</strong> R$ ${movement.unitSalePrice.toFixed(
                        2
                      )}</p>`
                    : ""
                }
                <p><strong>Data:</strong> ${new Date(
                  movement.createdAt
                ).toLocaleString("pt-BR")}</p>
            </div>
        `;
    })
    .join("");
}

// === INVENTÁRIO ===

async function loadInventory() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/inventory`, {
      headers: API_CONFIG.HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    inventory = await response.json();
    renderInventory();
  } catch (error) {
    console.error("Erro ao carregar inventário:", error);
    showAlert("Erro ao carregar inventário: " + error.message, "error");
  }
}

function renderInventory() {
  const container = document.getElementById("inventory-list");

  if (inventory.length === 0) {
    container.innerHTML =
      '<div class="loading">Nenhum item no inventário</div>';
    return;
  }

  container.innerHTML = inventory
    .map((item) => {
      const stockStatus = getStockStatus(item.quantity);

      return `
            <div class="product-card">
                <h3>${item.productName}</h3>
                <p><strong>Quantidade:</strong> ${
                  item.quantity
                } <span class="stock-status ${stockStatus.class}">${
        stockStatus.label
      }</span></p>
                <p><strong>Preço:</strong> R$ ${
                  item.productPrice ? item.productPrice.toFixed(2) : "N/A"
                }</p>
                ${
                  item.productDescription
                    ? `<p><strong>Descrição:</strong> ${item.productDescription}</p>`
                    : ""
                }
                <p><strong>Última atualização:</strong> ${new Date(
                  item.updatedAt
                ).toLocaleString("pt-BR")}</p>
            </div>
        `;
    })
    .join("");
}

// === FUNÇÕES AUXILIARES ===

function getProductTypeLabel(type) {
  const labels = {
    CARD: "Carta",
    BOOSTER_BOX: "Booster Box",
    ACCESSORY: "Acessório",
  };
  return labels[type] || type;
}

function getConditionLabel(condition) {
  const labels = {
    MINT: "Mint",
    LIGHTLY_PLAYED: "Lightly Played",
    MODERATELY_PLAYED: "Moderately Played",
    HEAVILY_PLAYED: "Heavily Played",
    DAMAGED: "Damaged",
    SEALED: "Sealed",
    OPENED: "Opened",
    USED: "Used",
  };
  return labels[condition] || condition;
}

function getMovementTypeLabel(type) {
  const labels = {
    IN: "Entrada (Compra)",
    OUT: "Saída (Venda)",
    ADJUST: "Ajuste",
  };
  return labels[type] || type;
}

function getStockStatus(quantity) {
  if (quantity === 0) {
    return { class: "stock-out", label: "Sem estoque" };
  } else if (quantity <= 5) {
    return { class: "stock-low", label: "Estoque baixo" };
  } else {
    return { class: "stock-high", label: "Estoque OK" };
  }
}

function editProduct(productId) {
  // Implementar edição de produto
  showAlert("Funcionalidade de edição em desenvolvimento", "error");
}
