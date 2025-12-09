/**
 * Sistema de Gestão de Lojas - Integrado com Spring Boot API
 */

// ====== CONFIGURAÇÃO DA API ======
// Para produção/deploy, use os caminhos relativos (proxy Nginx):
//   API_BASE_URL: "/api/store-manager-api"
// Para rodar local, use os endpoints locais, por exemplo:
//   API_BASE_URL: "http://localhost:8080"

const API_CONFIG = {
  BASE_URL: "'http://localhost:8080/store-manager-api",
  HEADERS: {
    "Content-Type": "application/json",
    "user-id": "77042ffc-b15f-11f0-8c22-706979a3c737",
  },
};

let stores = [];
let editingStoreId = null;
let currentTab = "register";
let deleteStoreId = null;
let deleteStoreName = null;

document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners();
  loadStores();
});

function initializeEventListeners() {
  // Formulário de cadastro
  document
    .getElementById("store-form")
    .addEventListener("submit", handleStoreSubmit);

  // Formulário de edição
  document
    .getElementById("edit-form")
    .addEventListener("submit", handleEditSubmit);

  // Máscara CEP
  document.getElementById("store-cep").addEventListener("input", function (e) {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  document.getElementById("edit-cep").addEventListener("input", function (e) {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  // Fechar modal ao clicar fora
  document.getElementById("edit-modal").addEventListener("click", function (e) {
    if (e.target === this) {
      closeEditModal();
    }
  });

  document
    .getElementById("delete-modal")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        closeDeleteModal();
      }
    });
}

// Navegação entre tabs
function showTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  event.target.classList.add("active");

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(tabName + "-tab").classList.add("active");

  currentTab = tabName;

  if (tabName === "list") {
    loadStores();
  }
}

// Modal de edição
function openEditModal(storeId) {
  const store = stores.find((s) => s.id === storeId);

  if (!store) {
    showAlert("Loja não encontrada", "error");
    return;
  }

  editingStoreId = storeId;

  document.getElementById("edit-name").value = store.name;
  document.getElementById("edit-cep").value = store.cep;
  document.getElementById("edit-number").value = store.number;
  document.getElementById("edit-complement").value = store.complement || "";

  document.getElementById("edit-modal").classList.add("active");
}

function closeEditModal() {
  document.getElementById("edit-modal").classList.remove("active");
  document.getElementById("edit-form").reset();
  editingStoreId = null;
}

// Modal de confirmação de exclusão
function openDeleteModal(storeId, storeName) {
  deleteStoreId = storeId;
  deleteStoreName = storeName;

  document.getElementById("delete-store-name").textContent = storeName;
  document.getElementById("delete-modal").classList.add("active");
}

function closeDeleteModal() {
  document.getElementById("delete-modal").classList.remove("active");
  deleteStoreId = null;
  deleteStoreName = null;
}

async function confirmDelete() {
  if (!deleteStoreId) return;

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/stores/${deleteStoreId}`,
      {
        method: "DELETE",
        headers: API_CONFIG.HEADERS,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    showAlert("Loja excluída com sucesso!");
    closeDeleteModal();
    await loadStores();
  } catch (error) {
    console.error("Erro ao excluir loja:", error);
    showAlert("Erro ao excluir loja: " + error.message, "error");
  }
}

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

// === LOJAS ===

async function loadStores() {
  try {
    const listContainer = document.getElementById("stores-list");
    listContainer.innerHTML =
      '<div class="loading-state"><div class="loading-spinner"></div>Carregando lojas...</div>';

    const response = await fetch(`${API_CONFIG.BASE_URL}/stores`, {
      headers: API_CONFIG.HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    stores = await response.json();
    renderStores();
  } catch (error) {
    console.error("Erro ao carregar lojas:", error);
    showAlert("Erro ao carregar lojas: " + error.message, "error");
    const listContainer = document.getElementById("stores-list");
    listContainer.innerHTML =
      '<div class="loading">Erro ao carregar lojas</div>';
  }
}

function renderStores() {
  const container = document.getElementById("stores-list");

  if (stores.length === 0) {
    container.innerHTML = '<div class="loading">Nenhuma loja cadastrada</div>';
    return;
  }

  container.innerHTML = stores
    .map(
      (store) => `
        <div class="movement-item">
            <h3>${store.name}</h3>
            <p><strong>CEP:</strong> ${formatCEP(store.cep)}</p>
            <p><strong>Número:</strong> ${store.number}</p>
            <p><strong>Complemento:</strong> ${store.complement || "-"}</p>
            ${
              store.createdAt
                ? `<p><strong>Cadastrado em:</strong> ${new Date(
                    store.createdAt
                  ).toLocaleDateString("pt-BR")}</p>`
                : ""
            }
            <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-md);">
                <button class="btn btn-primary" onclick="openEditModal('${
                  store.id
                }')">Editar</button>
                <button class="btn btn-danger" onclick="openDeleteModal('${
                  store.id
                }', '${store.name.replace(/'/g, "\\'")}')">Excluir</button>
            </div>
        </div>
    `
    )
    .join("");
}

async function handleStoreSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const storeData = {
    name: formData.get("name"),
    cep: formData.get("cep"),
    number: formData.get("number"),
    complement: formData.get("complement") || "",
  };

  if (storeData.cep.length !== 8) {
    showAlert("CEP deve conter exatamente 8 dígitos", "error");
    return;
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/stores`, {
      method: "POST",
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(storeData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    await response.json();

    showAlert("Loja cadastrada com sucesso!", "success");
    event.target.reset();
    await loadStores();

    // Mudar para aba de lista
    const listTab = document.querySelectorAll(".tab")[1];
    listTab.click();
  } catch (error) {
    console.error("Erro ao cadastrar loja:", error);
    showAlert("Erro ao cadastrar loja: " + error.message, "error");
  }
}

async function handleEditSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const storeData = {
    name: formData.get("name"),
    cep: formData.get("cep"),
    number: formData.get("number"),
    complement: formData.get("complement") || "",
  };

  if (storeData.cep.length !== 8) {
    showAlert("CEP deve conter exatamente 8 dígitos", "error");
    return;
  }

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/stores/${editingStoreId}`,
      {
        method: "PUT",
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(storeData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    await response.json();

    showAlert("Loja atualizada com sucesso!", "success");
    closeEditModal();
    await loadStores();
  } catch (error) {
    console.error("Erro ao atualizar loja:", error);
    showAlert("Erro ao atualizar loja: " + error.message, "error");
  }
}

// === FUNÇÕES AUXILIARES ===

function formatCEP(cep) {
  // Formata CEP: 12345678 -> 12345-678
  if (cep && cep.length === 8) {
    return `${cep.substring(0, 5)}-${cep.substring(5)}`;
  }
  return cep;
}
