/**
 * Gestão de Movimentações de Estoque - Integrado com Spring Boot API
 * Nota: Depende de API_CONFIG e getHeaders() definidos em estoque.js
 */

let movements = [];
let movementsInterval = null;
let currentMovementType = "IN";

function showFormAlert(message, type = "success") {
  const alertsContainer = document.getElementById("form-alerts");
  if (!alertsContainer) {
    if (typeof showAlert === "function") {
      showAlert(message, type);
    }
    return;
  }

  alertsContainer.innerHTML = "";

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  alertsContainer.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 5000);
}

window.initMovementsModule = function () {
  const form = document.getElementById("movement-form");
  if (form) {
    form.addEventListener("submit", handleMovementSubmit);
  }

  document.querySelectorAll(".toggle-option").forEach((option) => {
    option.addEventListener("click", function () {
      setMovementType(this.dataset.type);
    });
  });
};

function setMovementType(type) {
  currentMovementType = type;

  document.querySelectorAll(".toggle-option").forEach((option) => {
    option.classList.remove("active");
  });
  document.querySelector(`[data-type="${type}"]`).classList.add("active");

  document.querySelectorAll(".conditional-fields").forEach((field) => {
    field.classList.remove("active");
  });

  document.getElementById("unit-purchase-price").required = false;
  document.getElementById("unit-sale-price-sale").required = false;

  if (type === "IN") {
    document.getElementById("purchase-fields").classList.add("active");
    document.getElementById("unit-purchase-price").required = true;
    document.getElementById("movement-quantity").min = "1";
    document.getElementById("movement-quantity").placeholder = "Ex: 10";
  } else if (type === "OUT") {
    document.getElementById("sale-fields").classList.add("active");
    document.getElementById("unit-sale-price-sale").required = true;
    document.getElementById("movement-quantity").min = "1";
    document.getElementById("movement-quantity").placeholder = "Ex: 5";
  } else if (type === "ADJUST") {
    document.getElementById("adjust-fields").classList.add("active");
    document.getElementById("movement-quantity").min = "-999";
    document.getElementById("movement-quantity").placeholder = "Ex: +5 ou -3";
  }
}

async function handleMovementSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);

  const movementData = {
    product_id: formData.get("productId"),
    user_id: sessionStorage.getItem("user-id") || "unknown",
    quantity: Math.abs(parseInt(formData.get("quantity"))),
    type: currentMovementType,
    description: formData.get("description"),
  };

  if (currentMovementType === "IN") {
    const purchasePrice = formData.get("unitPurchasePrice");
    const salePrice = formData.get("unitSalePrice");

    if (purchasePrice && parseFloat(purchasePrice) > 0) {
      movementData.unit_purchase_price = parseFloat(purchasePrice);
    } else {
      showFormAlert("Preço de compra é obrigatório para entradas", "error");
      return;
    }

    if (salePrice && parseFloat(salePrice) > 0) {
      movementData.unit_sale_price = parseFloat(salePrice);
    }
  } else if (currentMovementType === "OUT") {
    const salePriceElement = document.getElementById("unit-sale-price-sale");
    const salePrice = salePriceElement ? salePriceElement.value : null;

    if (salePrice && parseFloat(salePrice) > 0) {
      movementData.unit_sale_price = parseFloat(salePrice);
    } else {
      showFormAlert("Preço de venda é obrigatório para saídas", "error");
      return;
    }
  } else if (currentMovementType === "ADJUST") {
    movementData.quantity = parseInt(formData.get("quantity"));
  }

  try {
    await window.createMovement(movementData);
    event.target.reset();
    setMovementType("IN");
  } catch (error) {
    console.error("Erro ao registrar movimentação:", error);
  }
}

window.loadMovements = async function () {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/inventory-audits`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `Erro HTTP ao carregar movimentações: ${response.status}`
      );
    }

    movements = await response.json();

    movements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    movements = movements.slice(0, 40);

    renderMovements();
  } catch (error) {
    console.error("Erro ao carregar movimentações:", error);
    if (typeof showAlert === "function") {
      showAlert("Erro ao carregar movimentações: " + error.message, "error");
    }
  }
};

function renderMovements() {
  const container = document.getElementById("movements-list");

  if (!movements || movements.length === 0) {
    container.innerHTML =
      '<div class="loading">Nenhuma movimentação registrada</div>';
    return;
  }

  container.innerHTML = `
        <div class="movements-grid">
            ${movements
              .map((movement) => {
                const productName =
                  movement.product_name || "Produto não encontrado";
                const quantity = movement.quantity || 0;
                const type = movement.movement_type || "UNKNOWN";
                const description = movement.description || "Sem descrição";
                const userName = movement.user_name || "Desconhecido";
                const quantityAfter = movement.quantity_after || 0;
                const status = movement.status || "UNKNOWN";
                const errorMessage = movement.error_message;
                const timestamp = movement.timestamp;

                let displayQuantity;
                if (type === "OUT") {
                  displayQuantity = -Math.abs(quantity);
                } else if (type === "IN") {
                  displayQuantity = Math.abs(quantity);
                } else {
                  displayQuantity = quantity;
                }

                let dateFormatted = "N/A";
                if (timestamp) {
                  try {
                    const date = new Date(timestamp);
                    dateFormatted = date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  } catch (e) {
                    console.error("Erro ao formatar data:", timestamp, e);
                  }
                }

                const typeClass = type.toLowerCase();
                const typeLabel = getMovementTypeLabel(type);
                const statusClass = status.toLowerCase();
                const statusLabel =
                  status === "PROCESSED" ? "Sucesso" : "Falha";

                let cardClass = "";
                if (status === "FAILED") {
                  cardClass = "failed";
                } else {
                  cardClass = type === "ADJUST" ? typeClass : "success";
                }

                let priceInfo = "";
                if (type === "IN" && movement.unit_purchase_price) {
                  const unitPrice = movement.unit_purchase_price;
                  const total = Math.abs(quantity) * unitPrice;
                  priceInfo = `
                        <p><strong>Preço Unitário (Compra):</strong> R$ ${unitPrice.toFixed(
                          2
                        )}</p>
                        <p class="movement-total"><strong>Total:</strong> R$ ${total.toFixed(
                          2
                        )}</p>
                    `;
                } else if (type === "OUT" && movement.unit_sale_price) {
                  const unitPrice = movement.unit_sale_price;
                  const total = Math.abs(quantity) * unitPrice;
                  priceInfo = `
                        <p><strong>Preço Unitário (Venda):</strong> R$ ${unitPrice.toFixed(
                          2
                        )}</p>
                        <p class="movement-total"><strong>Total:</strong> R$ ${total.toFixed(
                          2
                        )}</p>
                    `;
                }

                const errorInfo = errorMessage
                  ? `<p class="movement-error"><strong>Erro:</strong> ${errorMessage}</p>`
                  : "";

                return `
                    <div class="movement-card ${cardClass}">
                        <div class="movement-header">
                            <h4>${productName}</h4>
                            <div class="movement-badges">
                                <span class="movement-type-badge ${typeClass}">${typeLabel}</span>
                                <span class="movement-status-badge ${statusClass}">${statusLabel}</span>
                            </div>
                        </div>
                        <p><strong>Quantidade Movimentada:</strong> ${
                          displayQuantity > 0 ? "+" : ""
                        }${displayQuantity}</p>
                        <p><strong>Quantidade Atual:</strong> ${quantityAfter}</p>
                        ${priceInfo}
                        <p class="movement-description">${description}</p>
                        ${errorInfo}
                        <p><strong>Responsável:</strong> ${userName}</p>
                        <p class="movement-date"><strong>Data:</strong> ${dateFormatted}</p>
                    </div>
                `;
              })
              .join("")}
        </div>
    `;
}

function getMovementTypeLabel(type) {
  const labels = {
    IN: "Entrada",
    OUT: "Saída",
    ADJUST: "Ajuste",
  };
  return labels[type] || type;
}

window.createMovement = async function (movementData) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/inventory-movements`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(movementData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resposta de erro completa:", errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    const newMovement = await response.json();

    showFormAlert("Movimentação registrada com sucesso!", "success");

    window.loadMovements();
    if (typeof window.loadInventory === "function") {
      window.loadInventory();
    }

    return newMovement;
  } catch (error) {
    console.error("Erro ao criar movimentação:", error);
    showFormAlert("Erro ao registrar movimentação: " + error.message, "error");
    throw error;
  }
};

// TODO: ARRUMAR ESSE TRECHO NAO ESTA FUNCIONANDO CORRETAMENTE
function startMovementsAutoReload() {
  if (movementsInterval) {
    clearInterval(movementsInterval);
  }

  window.loadMovements();

  movementsInterval = setInterval(() => {
    // Só recarregar se NÃO estiver na aba de movimentações (evita perder formulário)
    const movementsTab = document.getElementById("movements-tab");
    const isMovementsTabActive =
      movementsTab && movementsTab.classList.contains("active");

    // Verificar se o usuário está digitando em algum campo
    const activeElement = document.activeElement;
    const isTyping =
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT");

    if (!isMovementsTabActive || !isTyping) {
      window.loadMovements();
    }
  }, 10000); // 10 segundos
}

function stopMovementsAutoReload() {
  if (movementsInterval) {
    clearInterval(movementsInterval);
    movementsInterval = null;
  }
}

window.startMovementsAutoReload = startMovementsAutoReload;
window.stopMovementsAutoReload = stopMovementsAutoReload;
