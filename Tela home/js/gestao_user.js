// gestao_user.js

const BASE_URL = 'http://localhost:8080/store-manager-api/users';
// O user-id é necessário para operações de criação, atualização e exclusão, conforme os cURL fornecidos.
// Este é um ID de exemplo. Em um ambiente real, ele viria de um token de autenticação ou sessão.
const USER_ID_HEADER = '2b487d96-a9e5-4f48-b9e9-41a47e6694fe'; 

// --- Funções de Utilidade ---

/**
 * Alterna entre as abas de Cadastro e Lista.
 * @param {string} tabId - O ID da aba a ser exibida ('register' ou 'list').
 */
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const targetContent = document.getElementById(`${tabId}-tab`);
    const targetButton = document.querySelector(`.tabs button[onclick*="${tabId}"]`);

    if (targetContent) targetContent.classList.add('active');
    if (targetButton) targetButton.classList.add('active');

    if (tabId === 'list') {
        loadUsers();
    }
}

/**
 * Exibe uma mensagem de alerta temporária.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo de alerta ('success', 'error', 'info').
 */
function showAlert(message, type) {
    const alertsContainer = document.getElementById('alerts');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertsContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// --- Funções de API e Renderização ---

/**
 * Carrega a lista de usuários da API e renderiza na tela.
 */
async function loadUsers() {
    const usersListContainer = document.getElementById('users-list');
    usersListContainer.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            Carregando usuários...
        </div>
    `;

    try {
        const response = await fetch(BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao carregar usuários: ${response.statusText}`);
        }

        const users = await response.json();
        renderUsers(users);

    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        usersListContainer.innerHTML = `<p class="error-message">Não foi possível carregar a lista de usuários. ${error.message}</p>`;
        showAlert('Erro ao carregar usuários.', 'error');
    }
}

/**
 * Renderiza a lista de usuários no container.
 * @param {Array<Object>} users - A lista de objetos de usuário.
 */
function renderUsers(users) {
    const usersListContainer = document.getElementById('users-list');
    usersListContainer.innerHTML = ''; // Limpa o estado de carregamento

    if (users.length === 0) {
        usersListContainer.innerHTML = '<p>Nenhum usuário cadastrado.</p>';
        return;
    }

    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'movement-item'; // Reutilizando a classe de estilo da loja
        userItem.innerHTML = `
            <div class="item-details">
                <span class="item-name">${user.name}</span>
                <span class="item-info">Email: ${user.email}</span>
                <span class="item-info">Função: ${user.role_name}</span>
                <span class="item-info">ID: ${user.id}</span>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-sm" onclick='openEditModal(${JSON.stringify(user)})'>Editar</button>
                <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${user.id}', '${user.name}')">Excluir</button>
            </div>
        `;
        usersListContainer.appendChild(userItem);
    });
}

/**
 * Lida com o envio do formulário de criação de usuário.
 * @param {Event} event - O evento de submissão do formulário.
 */
async function handleCreateUser(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());

    // Validação básica de campos
    if (!userData.name || !userData.email || !userData.password || !userData.role_name) {
        showAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Cadastrando...';

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': USER_ID_HEADER // Header de autorização/contexto
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Erro ${response.status}: ${errorData.message || response.statusText}`);
        }

        const newUser = await response.json();
        showAlert(`Usuário ${newUser.name} cadastrado com sucesso!`, 'success');
        form.reset(); // Limpa o formulário
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        showAlert(`Falha ao cadastrar usuário: ${error.message}`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Cadastrar Usuário';
    }
}

// --- Funções de Modal de Edição ---

let currentEditingUserId = null;

/**
 * Abre o modal de edição e preenche com os dados do usuário.
 * @param {Object} user - O objeto de usuário a ser editado.
 */
function openEditModal(user) {
    currentEditingUserId = user.id;
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-role').value = user.role_name;
    // O campo store_id não está presente no GET LIST USERS, mas é o campo a ser atualizado no PUT.
    // Assumimos que o valor inicial é vazio ou precisa ser preenchido.
    document.getElementById('edit-store-id').value = user.store_id || ''; 

    document.getElementById('edit-modal').classList.add('active');
}

/**
 * Fecha o modal de edição.
 */
function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    currentEditingUserId = null;
}

/**
 * Lida com o envio do formulário de edição de usuário.
 * @param {Event} event - O evento de submissão do formulário.
 */
async function handleUpdateUser(event) {
    event.preventDefault();
    if (!currentEditingUserId) return;

    const form = event.target;
    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());

    // O endpoint PUT fornecido só espera o store_id no corpo.
    // Vou enviar apenas o store_id, mas manter os outros campos no formulário para UX.
    const updatePayload = {
        store_id: userData.store_id || null // Envia null se estiver vazio
    };

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Atualizando...';

    try {
        const response = await fetch(`${BASE_URL}/${currentEditingUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'user-id': USER_ID_HEADER // Header de autorização/contexto
            },
            body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Erro ${response.status}: ${errorData.message || response.statusText}`);
        }

        // O PUT retorna 200 OK sem corpo na maioria das vezes, ou o objeto atualizado.
        showAlert(`Usuário ${userData.name} atualizado com sucesso!`, 'success');
        closeEditModal();
        loadUsers(); // Recarrega a lista para refletir a mudança

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showAlert(`Falha ao atualizar usuário: ${error.message}`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Confirmar Edição';
    }
}

// --- Funções de Modal de Exclusão ---

let userIdToDelete = null;

/**
 * Abre o modal de confirmação de exclusão.
 * @param {string} userId - O ID do usuário a ser excluído.
 * @param {string} userName - O nome do usuário para exibição no modal.
 */
function openDeleteModal(userId, userName) {
    userIdToDelete = userId;
    document.getElementById('delete-user-name').textContent = userName;
    document.getElementById('delete-modal').classList.add('active');
}

/**
 * Fecha o modal de exclusão.
 */
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
    userIdToDelete = null;
}

/**
 * Executa a exclusão do usuário.
 */
async function confirmDelete() {
    if (!userIdToDelete) return;

    const deleteButton = document.getElementById('confirm-delete-btn');
    deleteButton.disabled = true;
    deleteButton.textContent = 'Excluindo...';

    try {
        const response = await fetch(`${BASE_URL}/${userIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'user-id': USER_ID_HEADER // Header de autorização/contexto
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Erro ${response.status}: ${errorData.message || response.statusText}`);
        }

        showAlert('Usuário excluído com sucesso!', 'success');
        closeDeleteModal();
        loadUsers(); // Recarrega a lista

    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        showAlert(`Falha ao excluir usuário: ${error.message}`, 'error');
    } finally {
        deleteButton.disabled = false;
        deleteButton.textContent = 'Excluir';
    }
}

// --- Inicialização ---

document.addEventListener('DOMContentLoaded', () => {
    // Adiciona listener para o formulário de criação
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', handleCreateUser);
    }

    // Adiciona listener para o formulário de edição
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', handleUpdateUser);
    }

    // Adiciona listener para o botão de exclusão no modal
    const confirmDeleteButton = document.getElementById('confirm-delete-btn');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', confirmDelete);
    }

    // Carrega a lista de usuários se a aba de lista estiver ativa por padrão
    // (A aba de cadastro está ativa por padrão no HTML que criei, mas é bom ter a função)
    // loadUsers(); 
});

// Expondo funções globais para uso no HTML (onclick)
window.showTab = showTab;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.loadUsers = loadUsers; // Para ser chamada ao mudar para a aba de lista
