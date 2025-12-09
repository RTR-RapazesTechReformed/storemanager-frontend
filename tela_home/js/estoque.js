/**
 * Sistema de Gestão de Estoque - Integrado com Spring Boot API
 */

// Configurações da API

// ====== CONFIGURAÇÃO DE ENDPOINT DA API ======
// Para produção/deploy  "/api/store-manager-api"
// Para rodar local, use: "http://localhost:8080"

const API_CONFIG = {
  BASE_URL: "http://localhost:8080/api/store-manager-api",
};

function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  const sessionUserId = sessionStorage.getItem("user-id");
  if (sessionUserId) headers["user-id"] = sessionUserId;
  return headers;
}

// Estado da aplicação
let currentTab = "movements";
let products = [];
let filteredProducts = [];
let stores = [];
let deleteProductId = null;
let deleteProductName = null;
let editingProduct = null;
// movements, inventory e currentMovementType gerenciados por modules separados

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners();
  loadStores();
  loadProducts();

  // Inicializar módulo de movimentações
  if (typeof window.initMovementsModule === "function") {
    window.initMovementsModule();
  }

  // Iniciar movimentações com auto-reload
  if (typeof window.loadMovements === "function") {
    window.startMovementsAutoReload();
  }

  // Carregar inventário
  if (typeof window.loadInventory === "function") {
    window.loadInventory();
  }
});

// Event Listeners
function initializeEventListeners() {
  // Event listeners específicos de produtos
  // Movimentações gerenciadas por movements.js

  // Fechar modal ao clicar fora
  const deleteModal = document.getElementById("delete-product-modal");
  if (deleteModal) {
    deleteModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeDeleteProductModal();
      }
    });
  }

  const editModal = document.getElementById("edit-product-modal");
  if (editModal) {
    editModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeEditProductModal();
      }
    });
  }

  // Formulário de edição
  const editForm = document.getElementById("edit-product-form");
  if (editForm) {
    editForm.addEventListener("submit", handleEditProductSubmit);
  }

  // Filtros de produtos
  const filterType = document.getElementById("filter-type");
  const filterCondition = document.getElementById("filter-condition");
  const filterStore = document.getElementById("filter-store");
  const filterSearch = document.getElementById("filter-search");

  if (filterType) filterType.addEventListener("change", filterProducts);
  if (filterCondition)
    filterCondition.addEventListener("change", filterProducts);
  if (filterStore) filterStore.addEventListener("change", filterProducts);
  if (filterSearch) filterSearch.addEventListener("input", filterProducts);
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
    if (typeof window.loadInventory === "function") {
      window.loadInventory();
    }
  } else if (tabName === "products") {
    loadProducts();
  } else if (tabName === "movements") {
    if (typeof window.loadMovements === "function") {
      window.loadMovements();
    }
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

async function loadStores() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/stores`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    stores = await response.json();
    updateStoreSelect();
  } catch (error) {
    console.error("Erro ao carregar lojas:", error);
    showAlert("Erro ao carregar lojas: " + error.message, "error");
  }
}

function updateStoreSelect() {
  const select = document.getElementById("edit-product-store");
  if (select && stores.length > 0) {
    select.innerHTML =
      '<option value="">Selecione uma loja</option>' +
      stores
        .map((store) => `<option value="${store.id}">${store.name}</option>`)
        .join("");
  }

  // Atualizar filtro de lojas também - usar nome da loja como value
  const filterSelect = document.getElementById("filter-store");
  if (filterSelect && stores.length > 0) {
    filterSelect.innerHTML =
      '<option value="">Todas as Lojas</option>' +
      stores
        .map((store) => `<option value="${store.name}">${store.name}</option>`)
        .join("");
  }
}

async function loadProducts() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/products`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    products = await response.json();

    filteredProducts = [...products];
    renderProducts();
    updateProductSelect();
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    showAlert("Erro ao carregar produtos: " + error.message, "error");
  }
}

function filterProducts() {
  const typeFilter = document.getElementById("filter-type")?.value || "";
  const conditionFilter =
    document.getElementById("filter-condition")?.value || "";
  const storeFilter = document.getElementById("filter-store")?.value || "";
  const searchFilter =
    document.getElementById("filter-search")?.value.toLowerCase() || "";

  filteredProducts = products.filter((product) => {
    let matchType = true;
    if (typeFilter) {
      if (product.card && typeFilter === "CARD") {
        matchType = true;
      } else if (
        product.other_product &&
        product.other_product.type === typeFilter
      ) {
        matchType = true;
      } else {
        matchType = false;
      }
    }

    const matchCondition =
      !conditionFilter || product.condition === conditionFilter;

    const matchStore = !storeFilter || product.store_name === storeFilter;

    const matchSearch =
      !searchFilter ||
      product.name.toLowerCase().includes(searchFilter) ||
      (product.description &&
        product.description.toLowerCase().includes(searchFilter)) ||
      (product.store_name &&
        product.store_name.toLowerCase().includes(searchFilter)) ||
      (product.card &&
        product.card.title &&
        product.card.title.toLowerCase().includes(searchFilter)) ||
      (product.card &&
        product.card.code &&
        product.card.code.toLowerCase().includes(searchFilter));

    return matchType && matchCondition && matchStore && matchSearch;
  });

  renderProducts();
}

function renderProducts() {
  const container = document.getElementById("products-list");

  if (filteredProducts.length === 0) {
    container.innerHTML =
      '<div class="loading">Nenhum produto encontrado</div>';
    return;
  }

  container.innerHTML = `
        <div class="products-grid">
            ${filteredProducts
              .map((product) => {
                const isCard = product.card !== null;
                const isOtherProduct = product.other_product !== null;

                let productType = "";
                let productDetails = "";
                let cardClass = "";
                let badgeClass = "";

                if (isCard) {
                  productType = "Carta";
                  cardClass = "card-type";
                  badgeClass = "card-badge";
                  const card = product.card;
                  productDetails = `
                        <p><strong>Título:</strong> ${card.title || "N/A"}</p>
                        <p><strong>Código:</strong> ${card.code || "N/A"}</p>
                        <p><strong>Raridade:</strong> ${
                          card.rarity || "N/A"
                        }</p>
                        <p><strong>Tipo:</strong> ${
                          card.pokemon_type || "N/A"
                        }</p>
                        <p><strong>Nacionalidade:</strong> ${
                          card.nationality || "N/A"
                        }</p>
                    `;
                } else if (isOtherProduct) {
                  const other = product.other_product;
                  productType = getProductTypeLabel(other.type);

                  if (other.type === "BOOSTER_BOX") {
                    cardClass = "booster-type";
                    badgeClass = "booster-badge";
                  } else if (other.type === "ACCESSORY") {
                    cardClass = "accessory-type";
                    badgeClass = "accessory-badge";
                  } else {
                    cardClass = "other-type";
                    badgeClass = "other-badge";
                  }

                  productDetails = `
                        <p><strong>Tipo:</strong> ${getProductTypeLabel(
                          other.type
                        )}</p>
                        <p><strong>Nacionalidade:</strong> ${
                          other.nationality || "N/A"
                        }</p>
                        ${
                          other.package_contents
                            ? `<p><strong>Conteúdo:</strong> ${other.package_contents}</p>`
                            : ""
                        }
                        ${
                          other.extra_info
                            ? `<p><strong>Info:</strong> ${other.extra_info}</p>`
                            : ""
                        }
                    `;
                }

                return `
                    <div class="product-card ${cardClass}">
                        <div class="product-header">
                            <h4>${product.name}</h4>
                            <span class="product-type-badge ${badgeClass}">${productType}</span>
                        </div>
                        <div class="product-body">
                            ${productDetails}
                            <p class="product-price"><strong>Preço:</strong> R$ ${product.price.toFixed(
                              2
                            )}</p>
                            <p><strong>Condição:</strong> ${getConditionLabel(
                              product.condition
                            )}</p>
                            <p><strong>Loja:</strong> ${
                              product.store_name || "N/A"
                            }</p>
                            ${
                              product.description
                                ? `<p class="product-description">${product.description}</p>`
                                : ""
                            }
                        </div>
                        <div class="product-actions">
                            <button class="btn btn-secondary" onclick="editProduct('${
                              product.id
                            }')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-danger" onclick="deleteProduct('${
                              product.id
                            }')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                `;
              })
              .join("")}
        </div>
    `;
}

function updateProductSelect() {
  const select = document.getElementById("movement-product");
  if (select) {
    select.innerHTML =
      '<option value="">Selecione um produto</option>' +
      products
        .map(
          (product) => `<option value="${product.id}">${product.name}</option>`
        )
        .join("");
  }
}

// Expor função globalmente para ser usada por movements.js
window.updateProductSelect = updateProductSelect;

function deleteProduct(productId) {
  const product = products.find((p) => p.id === productId);

  if (!product) {
    showAlert("Produto não encontrado", "error");
    return;
  }

  deleteProductId = productId;
  deleteProductName = product.name;

  document.getElementById("delete-product-name").textContent = product.name;
  document.getElementById("delete-product-modal").classList.add("active");
}

function closeDeleteProductModal() {
  document.getElementById("delete-product-modal").classList.remove("active");
  deleteProductId = null;
  deleteProductName = null;
}

async function confirmDeleteProduct() {
  if (!deleteProductId) return;

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/products/${deleteProductId}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    showAlert("Produto excluído com sucesso!");
    closeDeleteProductModal();
    loadProducts();
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    showAlert("Erro ao excluir produto: " + error.message, "error");
  }
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
  const product = products.find((p) => p.id === productId);

  if (!product) {
    showAlert("Produto não encontrado", "error");
    return;
  }

  editingProduct = product;

  // Preencher campos básicos
  document.getElementById("edit-product-id").value = product.id;
  document.getElementById("edit-product-name").value = product.name;
  document.getElementById("edit-product-description").value =
    product.description || "";
  document.getElementById("edit-product-price").value = product.price;
  document.getElementById("edit-product-condition").value = product.condition;
  document.getElementById("edit-product-store").value = product.store_id || "";

  // Mostrar/ocultar campos específicos
  const cardFields = document.getElementById("edit-card-fields");
  const otherFields = document.getElementById("edit-other-fields");

  cardFields.style.display = "none";
  otherFields.style.display = "none";

  // Preencher campos específicos
  if (product.card) {
    cardFields.style.display = "block";
    document.getElementById("edit-card-title").value = product.card.title || "";
    document.getElementById("edit-card-code").value = product.card.code || "";
    document.getElementById("edit-card-rarity").value =
      product.card.rarity || "";
    document.getElementById("edit-card-type").value =
      product.card.pokemon_type || "";
    document.getElementById("edit-card-nationality").value =
      product.card.nationality || "";
  } else if (product.other_product) {
    otherFields.style.display = "block";
    document.getElementById("edit-other-nationality").value =
      product.other_product.nationality || "";
    document.getElementById("edit-other-package").value =
      product.other_product.package_contents || "";
    document.getElementById("edit-other-info").value =
      product.other_product.extra_info || "";
  }

  // Abrir modal
  document.getElementById("edit-product-modal").classList.add("active");
}

function closeEditProductModal() {
  document.getElementById("edit-product-modal").classList.remove("active");
  document.getElementById("edit-product-form").reset();
  editingProduct = null;
}

async function handleEditProductSubmit(event) {
  event.preventDefault();

  const productId = document.getElementById("edit-product-id").value;

  const updatedData = {
    name: document.getElementById("edit-product-name").value.trim(),
    description:
      document.getElementById("edit-product-description").value.trim() || null,
    price: parseFloat(document.getElementById("edit-product-price").value),
    condition: document.getElementById("edit-product-condition").value,
    store_id: document.getElementById("edit-product-store").value,
  };

  try {
    // Atualizar produto principal
    const productResponse = await fetch(
      `${API_CONFIG.BASE_URL}/products/${productId}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updatedData),
      }
    );

    if (!productResponse.ok) {
      const errorData = await productResponse.json();
      throw new Error(
        errorData.message || `Erro HTTP: ${productResponse.status}`
      );
    }

    // Atualizar campos específicos se for carta
    if (editingProduct.card) {
      const cardData = {
        title:
          document.getElementById("edit-card-title").value.trim() ||
          editingProduct.card.title ||
          "",
        season: editingProduct.card.season || "",
        code:
          document.getElementById("edit-card-code").value.trim() ||
          editingProduct.card.code ||
          "",
        rarity:
          document.getElementById("edit-card-rarity").value.trim() ||
          editingProduct.card.rarity ||
          "",
        pokemon_type:
          document.getElementById("edit-card-type").value.trim() ||
          editingProduct.card.pokemon_type ||
          "",
        nationality:
          document.getElementById("edit-card-nationality").value.trim() ||
          editingProduct.card.nationality ||
          "",
        collection_id: editingProduct.card.collection_id || "",
      };

      const cardResponse = await fetch(
        `${API_CONFIG.BASE_URL}/cards/${editingProduct.card.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(cardData),
        }
      );

      if (!cardResponse.ok) {
        const errorData = await cardResponse.json();
        throw new Error(
          `Erro ao atualizar carta: ${errorData.message || cardResponse.status}`
        );
      }
    }
    // Atualizar campos específicos se for outro produto
    else if (editingProduct.other_product) {
      const otherProductData = {
        type: editingProduct.other_product.type,
        nationality:
          document.getElementById("edit-other-nationality").value.trim() || "",
        package_contents:
          document.getElementById("edit-other-package").value.trim() || "",
        extra_info:
          document.getElementById("edit-other-info").value.trim() || "",
      };

      const otherResponse = await fetch(
        `${API_CONFIG.BASE_URL}/other-products/${editingProduct.other_product.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(otherProductData),
        }
      );

      if (!otherResponse.ok) {
        const errorData = await otherResponse.json();
        throw new Error(
          `Erro ao atualizar produto: ${
            errorData.message || otherResponse.status
          }`
        );
      }
    }

    showAlert("Produto atualizado com sucesso!");
    closeEditProductModal();
    loadProducts();
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    showAlert("Erro ao atualizar produto: " + error.message, "error");
  }
}

window.closeDeleteProductModal = closeDeleteProductModal;
window.confirmDeleteProduct = confirmDeleteProduct;
