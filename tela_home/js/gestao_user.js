// gestao_user.js - Versão com Lógica de Permissões e Estilo Corrigido

// --- Configuração da API e Estado do Usuário ---

// Pega o ID do usuário logado da sessão, como no exemplo fornecido.
const loggedInUserId = sessionStorage.getItem("user-id");

// ====== CONFIGURAÇÃO DE ENDPOINT DA API ======
// Para produção/deploy  "/api/store-manager-api"
// Para rodar local, use: "http://localhost:8080"

const API_CONFIG = {
  BASE_URL: "'http://localhost:8080/store-manager-api",
  HEADERS: {
    "Content-Type": "application/json",
    // O header 'user-id' deve ser incluído em todas as requisições que exigem autenticação/autorização
    "user-id": loggedInUserId,
  },
};

// Variável global para armazenar os dados do usuário logado (incluindo a role)
let loggedInUserData = null;

// --- Funções de Utilidade ---

function showAlert(message, type = "info") {
  const alertsContainer = document.getElementById("alerts");
  if (!alertsContainer) {
    console.error("Container de alertas não encontrado");
    return;
  }
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertsContainer.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 5000);
}

function showTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));
  document
    .querySelectorAll(".tab")
    .forEach((tab) => tab.classList.remove("active"));

  const targetContent = document.getElementById(`${tabId}-tab`);
  const targetButton = document.querySelector(
    `.tabs button[onclick*="${tabId}"]`
  );

  if (targetContent) targetContent.classList.add("active");
  if (targetButton) targetButton.classList.add("active");

  if (tabId === "list") {
    loadUsers();
  }
}

// --- Lógica de Permissões (RBAC) ---

/**
 * Busca os dados do usuário logado para determinar suas permissões.
 */
async function fetchLoggedInUserData() {
  if (!loggedInUserId) {
    console.error(
      "ID do usuário logado não encontrado na sessão. Assumindo role de 'staff'."
    );
    loggedInUserData = { role_name: "staff" };
    applyPermissions();
    return;
  }

  try {
    // AGORA adicionamos o header user-id corretamente
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/users/${loggedInUserId}`,
      {
        method: "GET",
        headers: API_CONFIG.HEADERS,
      }
    );

    if (!response.ok) {
      throw new Error("Usuário logado não encontrado ou erro na API.");
    }

    loggedInUserData = await response.json();
    applyPermissions();
  } catch (error) {
    console.error("Erro ao buscar dados do usuário logado:", error);
    showAlert(
      "Não foi possível verificar suas permissões. Funcionalidades podem estar limitadas.",
      "error"
    );
    loggedInUserData = { role_name: "staff" };
    applyPermissions();
  }
}

/**
 * Aplica as permissões na interface com base na role do usuário logado.
 */
function applyPermissions() {
  if (!loggedInUserData) return;

  const { role_name } = loggedInUserData;
  const registerTabButton = document.querySelector(
    '.tabs button[onclick*="register"]'
  );
  const userForm = document.getElementById("user-form");

  // Regra de Negócio: Funcionário só pode ler (não pode cadastrar)
  if (role_name === "staff") {
    // Funcionário: desabilita cadastro e formulário
    if (registerTabButton) registerTabButton.style.display = "none";
    if (userForm) userForm.style.display = "none";
    // A lógica de mostrar/esconder botões de ação será feita na renderização da lista
  }

  if (role_name === "manager") {
    // Gerente: não pode criar admin
    const roleSelect = document.getElementById("user-role");
    if (roleSelect) {
      const adminOption = roleSelect.querySelector('option[value="admin"]');
      if (adminOption) adminOption.disabled = true;
    }
    const editRoleSelect = document.getElementById("edit-role");
    if (editRoleSelect) {
      const editAdminOption = editRoleSelect.querySelector(
        'option[value="admin"]'
      );
      if (editAdminOption) editAdminOption.disabled = true;
    }
  }
}

/**
 * Desabilita todas as funcionalidades de modificação.
 */
function disableAllFeatures() {
  document.querySelector('.tabs button[onclick*="register"]').style.display =
    "none";
  document.getElementById("user-form").style.display = "none";
  // Os botões de ação na lista serão ocultados durante a renderização
}

// --- Funções de API e Renderização ---

async function loadUsers() {
  const usersListContainer = document.getElementById("users-list");
  usersListContainer.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div>Carregando usuários...</div>`;

  // Regra de Negócio: Funcionário só pode ler.
  if (loggedInUserData && loggedInUserData.role_name === "staff") {
    // Se for staff, não faz a requisição, apenas mostra a mensagem.
    // A requisição é feita com o header 'user-id', que deve garantir que o staff só veja a si mesmo
    // ou a lista permitida pela API.
    // Se a API não aplicar o filtro, o staff verá todos, mas não terá botões de ação.
    // Vamos manter a requisição para que o staff veja a lista (se a API permitir).
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
      method: "GET",
      headers: API_CONFIG.HEADERS,
    });
    if (!response.ok)
      throw new Error(`Erro ao carregar usuários: ${response.statusText}`);
    let users = await response.json();

    // (delete lógico do backend)
    users = users.filter((u) => !u.deleted);

    renderUsers(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    usersListContainer.innerHTML = `<p class="error-message">Não foi possível carregar a lista de usuários.</p>`;
    showAlert("Erro ao carregar usuários.", "error");
  }
}

function renderUsers(users) {
  const usersListContainer = document.getElementById("users-list");
  usersListContainer.innerHTML = "";

  if (users.length === 0) {
    usersListContainer.innerHTML = "<p>Nenhum usuário cadastrado.</p>";
    return;
  }

  const currentUserRole = loggedInUserData ? loggedInUserData.role_name : "";

  users.forEach((user) => {
    const userItem = document.createElement("div");
    userItem.className = "movement-item"; // Reutilizando o estilo da lista de lojas

    let actionButtons = "";
    let canEdit = false;
    let canDelete = false;

    if (currentUserRole === "admin") {
      canEdit = true;
      // Regra de Negócio: Admin não pode se auto-excluir.
      canDelete = user.id !== loggedInUserId;
    } else if (currentUserRole === "manager") {
      // Gerente pode editar qualquer um, exceto Admin.
      canEdit = user.role_name !== "admin";
      // Regra de Negócio: Gerente só pode deletar Funcionário (staff).
      canDelete = user.role_name === "staff";
    }
    // regra de negócio: funcionário (staff) não pode editar nem excluir.
    // a variável canEdit e canDelete já são false por padrão para staff.

    const safeUserString = JSON.stringify(user)
      .replace(/'/g, "\\'")
      .replace(/"/g, "'");

    if (canEdit) {
      actionButtons += `<button class="btn btn-secondary btn-sm" onclick="openEditModal(${safeUserString})">Editar</button>`;
    }
    if (canDelete) {
      actionButtons += `<button class="btn btn-danger btn-sm" onclick="openDeleteModal('${
        user.id
      }', '${user.name.replace(/'/g, "\\'")}')">Excluir</button>`;
    }

    userItem.innerHTML = `
            <div class="item-details">
                <span class="item-name"><b>Nome:</b> ${user.name} <br></span>
                <span class="item-info"><b>Email:</b> ${user.email} <br></span>
                <span class="item-info"><b>Função:</b> ${user.role_name}<br></span>
            </div>
            <div class="item-actions">
                ${actionButtons}
            </div>
        `;
    usersListContainer.appendChild(userItem);
  });
}

//crud

async function handleCreateUser(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const userData = Object.fromEntries(formData.entries());

  if (
    !userData.name ||
    !userData.email ||
    !userData.password ||
    !userData.role_name
  ) {
    showAlert("Por favor, preencha todos os campos obrigatórios.", "error");
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Cadastrando...";

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
      method: "POST",
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `Erro ${response.status}: ${errorData.message || "Erro desconhecido"}`
      );
    }

    const newUser = await response.json();
    showAlert(`Usuário ${newUser.name} cadastrado com sucesso!`, "success");
    form.reset();
    showTab("list");
  } catch (error) {
    showAlert(`Falha ao cadastrar usuário: ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Cadastrar Usuário";
  }
}

let currentEditingUserId = null;

function openEditModal(user) {
  currentEditingUserId = user.id;
  document.getElementById("edit-user-id").value = user.id;
  document.getElementById("edit-name").value = user.name;
  document.getElementById("edit-email").value = user.email;
  document.getElementById("edit-role").value = user.role_name;
  document.getElementById("edit-store-id").value = user.store_id || "";
  document.getElementById("edit-modal").classList.add("active");
}

function closeEditModal() {
  document.getElementById("edit-modal").classList.remove("active");
  currentEditingUserId = null;
}

async function handleUpdateUser(event) {
  event.preventDefault();
  if (!currentEditingUserId) return;

  const form = event.target;
  const formData = new FormData(form);

  const updatePayload = {
    name: formData.get("name"),
    email: formData.get("email"),
    role_name: formData.get("role_name"),
    store_id: formData.get("store_id") || null,
  };

  const targetUserRole = updatePayload.role_name;
  const loggedInRole = loggedInUserData ? loggedInUserData.role_name : "";

  if (loggedInRole === "manager" && targetUserRole === "admin") {
    showAlert("Gerentes não podem promover usuários a Administrador.", "error");
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Atualizando...";

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/users/${currentEditingUserId}`,
      {
        method: "PUT",
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(updatePayload),
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `Erro ${response.status}: ${errorData.message || "Erro desconhecido"}`
      );
    }

    showAlert(
      `Usuário (ID: ${currentEditingUserId}) atualizado com sucesso!`,
      "success"
    );
    closeEditModal();
    loadUsers();
  } catch (error) {
    showAlert(`Falha ao atualizar usuário: ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Confirmar Edição";
  }
}

let userIdToDelete = null;

function openDeleteModal(userId, userName) {
  userIdToDelete = userId;
  document.getElementById("delete-user-name").textContent = userName;
  document.getElementById("delete-modal").classList.add("active");
}

function closeDeleteModal() {
  document.getElementById("delete-modal").classList.remove("active");
  userIdToDelete = null;
}

async function confirmDelete() {
  if (!userIdToDelete) return;

  const deleteButton = document.getElementById("confirm-delete-btn");
  deleteButton.disabled = true;
  deleteButton.textContent = "Excluindo...";

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/users/${userIdToDelete}`,
      {
        method: "DELETE",
        headers: API_CONFIG.HEADERS,
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `Erro ${response.status}: ${errorData.message || "Erro desconhecido"}`
      );
    }

    showAlert("Usuário excluído com sucesso!", "success");
    closeDeleteModal();
    loadUsers();
  } catch (error) {
    showAlert(`Falha ao excluir usuário: ${error.message}`, "error");
  } finally {
    deleteButton.disabled = false;
    deleteButton.textContent = "Excluir";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // busca os dados do usuário logado para aplicar as permissões
  await fetchLoggedInUserData();

  document
    .getElementById("user-form")
    ?.addEventListener("submit", handleCreateUser);
  document
    .getElementById("edit-form")
    ?.addEventListener("submit", handleUpdateUser);
  document
    .getElementById("confirm-delete-btn")
    ?.addEventListener("click", confirmDelete);

  // carrega a lista de usuários ao iniciar
  if (document.getElementById("list-tab").classList.contains("active")) {
    loadUsers();
  }
});

window.showTab = showTab;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
