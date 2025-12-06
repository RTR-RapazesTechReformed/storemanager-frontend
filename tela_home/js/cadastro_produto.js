/**
 * Sistema de Cadastro de Produto - Front-end
 * Versão Corrigida e Atualizada
 */
const user = sessionStorage.getItem("session-id");

// ====== CONFIGURAÇÃO DE ENDPOINT DA API ======
// Para produção/deploy  "/api/store-manager-api"
// Para rodar local, use: "http://localhost:8080"

const API_CONFIG = {
  BASE_URL: "/api/store-manager-api",
  HEADERS: {
    "Content-Type": "application/json",
    "user-id": user,
  },
};

const OTHER_PRODUCT_TYPES = ["BOOSTER_BOX", "ACCESSORY", "OTHER"];
const MAIN_STORE_ID = "2ab08857-c06c-4fa2-8d6b-0e6822d1d528";

document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();
});

function initializeEventListeners() {
  const form = document.getElementById("product-form");
  const typeSelect = document.getElementById("product-type");
  const targetStoreSelect = document.getElementById("target-store-select");

  if (form) form.addEventListener("submit", handleProductSubmit);
  if (typeSelect)
    typeSelect.addEventListener("change", handleProductTypeChange);
  if (targetStoreSelect)
    targetStoreSelect.addEventListener("change", handleTargetStoreChange);

  // Inicializar estado dos campos
  handleProductTypeChange({ target: typeSelect });
}

function showAlert(message, type = "success") {
  const alertsContainer = document.getElementById("alerts");
  if (!alertsContainer) {
    console.error("Container de alertas não encontrado");
    return;
  }

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alertsContainer.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

function handleProductTypeChange(event) {
  const productType = event.target.value;
  const cardFields = document.getElementById("card-fields");
  const otherFields = document.getElementById("other-fields");

  // Garantir que os elementos existem
  if (!cardFields || !otherFields) {
    console.error("Campos específicos do produto não encontrados");
    return;
  }

  // SEMPRE esconder todos os campos primeiro
  cardFields.style.display = "none";
  otherFields.style.display = "none";

  // Limpar campos quando não estão visíveis
  cardFields.querySelectorAll("input").forEach((input) => (input.value = ""));
  otherFields
    .querySelectorAll("input, textarea")
    .forEach((input) => (input.value = ""));

  // MOSTRAR apenas os campos relevantes
  if (productType === "CARD") {
    cardFields.style.display = "block";
  } else if (OTHER_PRODUCT_TYPES.includes(productType)) {
    otherFields.style.display = "block";
  }
  // Se for outro tipo (ou nenhum selecionado), ambos permanecem hidden
}

function handleTargetStoreChange(event) {
  const storeValue = event.target.value;
  const existingProductIdGroup = document.getElementById(
    "existing-product-id-group"
  );
  const existingProductIdInput = document.getElementById("existing-product-id");

  if (!existingProductIdGroup || !existingProductIdInput) {
    console.error("Elementos de ID do produto existente não encontrados");
    return;
  }

  // Se a loja selecionada NÃO for a loja principal, mostrar campo de ID existente
  if (storeValue !== MAIN_STORE_ID) {
    existingProductIdGroup.style.display = "block";
    existingProductIdInput.setAttribute("required", "required");
  } else {
    existingProductIdGroup.style.display = "none";
    existingProductIdInput.removeAttribute("required");
    existingProductIdInput.value = ""; // Limpar o campo
  }
}

function validateProductData(productData) {
  const errors = [];

  if (!productData.name || productData.name.trim() === "") {
    errors.push("Nome do produto é obrigatório");
  }

  if (!productData.type) {
    errors.push("Tipo do produto é obrigatório");
  }

  if (!productData.price || productData.price <= 0) {
    errors.push("Preço deve ser maior que zero");
  }

  if (!productData.store_id) {
    errors.push("Loja de destino é obrigatória");
  }

  if (!productData.condition) {
    errors.push("Condição do produto é obrigatória");
  }

  // Validação específica para cartas
  if (productData.type === "CARD") {
    if (!productData.title || productData.title.trim() === "") {
      errors.push("Título da carta é obrigatório");
    }
  }

  // Validação para lojas secundárias
  if (productData.store_id !== MAIN_STORE_ID && !productData.productId) {
    errors.push("ID do produto existente é obrigatório para lojas secundárias");
  }

  return errors;
}

async function handleProductSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const productType = formData.get("type");

  const productData = {
    name: formData.get("name")?.trim(),
    description: formData.get("description")?.trim() || null,
    type: productType,
    price: parseFloat(formData.get("price")),
    store_id: formData.get("store_id"),
    condition: formData.get("condition") || "MINT",
  };

  // Tratar ID do produto existente para lojas secundárias
  const existingProductId = formData.get("existing_product_id")?.trim();
  if (productData.store_id !== MAIN_STORE_ID && existingProductId) {
    productData.productId = existingProductId;
  }

  //campo das carta
  if (productData.type === "CARD") {
    productData.title = formData.get("title")?.trim() || "";
    productData.season = formData.get("season")?.trim() || "";
    productData.pokemon_type = formData.get("pokemon_type")?.trim() || "";
    productData.collection_id = formData.get("collection_id")?.trim() || "";
    productData.code = formData.get("code")?.trim() || "";
    productData.rarity = formData.get("rarity")?.trim() || "";
    productData.nationality = formData.get("nationality")?.trim() || "";
  }

  // CORREÇÃO: Adicionar campos para outros produtos dentro do objeto other_product
  if (OTHER_PRODUCT_TYPES.includes(productData.type)) {
    productData.other_product = {
      type: productData.type,
      nationality: formData.get("other_nationality")?.trim() || "",
      package_contents: formData.get("package_contents")?.trim() || "",
      extra_info: formData.get("extra_info")?.trim() || "",
    };
  }

  const validationErrors = validateProductData(productData);
  if (validationErrors.length > 0) {
    validationErrors.forEach((error) => showAlert(error, "error"));
    return;
  }

  try {
    console.log("Enviando dados:", JSON.stringify(productData, null, 2));

    const response = await fetch(`${API_CONFIG.BASE_URL}/products`, {
      method: "POST",
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(productData),
    });

    const responseData = await response.json();

    if (response.ok) {
      showAlert("Produto cadastrado com sucesso!", "success");
      clearForm();
    } else {
      showAlert(
        `Erro ao cadastrar produto: ${
          responseData.message || response.statusText
        }`,
        "error"
      );
    }
  } catch (error) {
    console.error("Erro de rede ou na requisição:", error);
    showAlert("Erro de conexão com o servidor. Tente novamente.", "error");
  }
}

function clearForm() {
  const form = document.getElementById("product-form");
  if (form) {
    form.reset();

    // Esconder todos os campos específicos
    const cardFields = document.getElementById("card-fields");
    const otherFields = document.getElementById("other-fields");
    const existingProductIdGroup = document.getElementById(
      "existing-product-id-group"
    );

    if (cardFields) cardFields.style.display = "none";
    if (otherFields) otherFields.style.display = "none";
    if (existingProductIdGroup) existingProductIdGroup.style.display = "none";

    // Limpar campos específicos
    if (cardFields)
      cardFields
        .querySelectorAll("input")
        .forEach((input) => (input.value = ""));
    if (otherFields)
      otherFields
        .querySelectorAll("input, textarea")
        .forEach((input) => (input.value = ""));
  }
}

async function scanCardImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  // ====== CONFIGURAÇÃO DE ENDPOINT DA API SCANNER ======
  // Para produção/deploy  "/scanner-api/upload"
  // Para rodar local, use: "http://localhost:5000"

  const response = await fetch("/scanner-api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Erro ao processar imagem");
  }

  return await response.json();
}

async function handleCardImageChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const data = await scanCardImage(file);

    const card = data?.database_results.database_match || {};

    const fields = [
      ["card-title", card.title],
      ["card-season", card.season],
      ["card-type", card.pokemon_type],
      ["card-collection", card.collection_abbreviation],
      ["card-code", card.code],
      ["card-rarity", card.rarity],
      ["card-nationality", card.nationality],
    ];

    fields.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value || "";
    });

    console.log("Carta lida com sucesso:", card);
  } catch (err) {
    console.error("Falha ao ler carta: " + err.message, "error");
    showAlert("Falha ao ler carta: " + err.message, "error");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();

  const imageInput = document.getElementById("card-image");
  if (imageInput) {
    imageInput.addEventListener("change", handleCardImageChange);
  }
});

// Função chamada quando o usuário muda o Dropdown "Categoria"
function verificarCategoria() {
  const categoria = document.getElementById("card-category").value;
  const btnContainer = document.getElementById("btn-step-container");
  const areaIA = document.getElementById("ai-setup-area");

  // Se escolheu algo válido (não está vazio)
  if (categoria !== "") {
    // Mostra o botão de "Preencher Detalhes"
    btnContainer.style.display = "block";
  } else {
    // Se voltou para "Selecione...", esconde tudo
    btnContainer.style.display = "none";
    areaIA.style.display = "none";
  }
}

// Função chamada quando clica no botão cinza "Preencher Detalhes"
function mostrarCamposIA() {
  const areaIA = document.getElementById("ai-setup-area");
  const btnContainer = document.getElementById("btn-step-container");

  // Mostra a área da IA
  areaIA.style.display = "block";

  // Opcional: Esconder o botão que foi clicado para limpar a tela
  btnContainer.style.display = "none";

  // Animaçãozinha suave (scroll)
  areaIA.scrollIntoView({ behavior: "smooth" });
}

// 3. Chama o Modelo para prever o preço
async function calcularPreco() {
  const raridade = document.getElementById("card-rarity-ia").value;
  const subTipo = document.getElementById("card-subtype").value;
  const resultDiv = document.getElementById("resultado-ia");

  // Loading State
  resultDiv.style.display = "block";
  resultDiv.innerHTML =
    '<p style="text-align:center; color: #666;">Consultando o oráculo de dados... 🤖</p>';

  try {
    const response = await fetch("http://localhost:8000/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raridade: raridade, sub_tipo: subTipo }),
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.detail || "Erro na API");
    }

    const data = await response.json();

    // Renderiza o Resultado
    resultDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                <h4 style="margin:0; color: #3c5aa6;">Estimativa de Mercado</h4>
                <small style="color: #999;">Moeda: ${data.currency}</small>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center;">
                <div style="background: #e8f5e9; padding: 10px; border-radius: 8px;">
                    <span style="display:block; font-size: 0.8em; color: #2e7d32;">Mínimo</span>
                    <strong style="color: #2e7d32; font-size: 1.1em;">$${data.min_price}</strong>
                </div>
                <div style="background: #e3f2fd; padding: 10px; border-radius: 8px; border: 1px solid #90caf9;">
                    <span style="display:block; font-size: 0.8em; color: #1565c0;">Justo</span>
                    <strong style="color: #1565c0; font-size: 1.3em;">$${data.fair_price}</strong>
                </div>
                <div style="background: #ffebee; padding: 10px; border-radius: 8px;">
                    <span style="display:block; font-size: 0.8em; color: #c62828;">Máximo</span>
                    <strong style="color: #c62828; font-size: 1.1em;">$${data.max_price}</strong>
                </div>
            </div>
            <div style="margin-top: 15px; text-align: center;">
                <button type="button" onclick="aplicarPreco(${data.fair_price})" style="font-size: 0.9em; text-decoration: underline; background: none; border: none; color: #555; cursor: pointer;">
                    Usar Preço Justo no Formulário ⬆️
                </button>
            </div>
        `;
  } catch (error) {
    resultDiv.innerHTML = `<p style="color: red; text-align: center;">Erro: ${error.message}</p>`;
  }
}

// 4. Bônus: Preenche o campo de preço principal automaticamente
function aplicarPreco(valor) {
  // Procura o input de preço original do seu form
  const inputPreco = document.getElementById("card-price");
  if (inputPreco) {
    inputPreco.value = valor.toFixed(2);
    alert(`Preço de $${valor} aplicado!`);
  }
}
