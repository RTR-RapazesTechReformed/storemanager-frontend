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

  const imageInput = document.getElementById("cardFileInput");
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
    '<p style="text-align:center; color: #666;">Consultando o modelo de precificação...</p>';

  try {
    const response = await fetch("/price-model-api/predict", {
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
        <button type="button" class="btn-preco-justo" onclick="aplicarPreco(${data.fair_price})">
            Usar Preço Justo no Formulário
        </button>
    </div>
        `;
  } catch (error) {
    resultDiv.innerHTML = `<p style="color: red; text-align: center;">Erro: ${error.message}</p>`;
  }
}

// 4. Bônus: Preenche o campo de preço principal automaticamente
function aplicarPreco(valor) {
  const inputPreco = document.getElementById("product-price");
  if (inputPreco) {
    inputPreco.value = valor.toFixed(2);
    alert(`Preço de $${valor} aplicado!`);
  }
}

/* ===== UI wiring ===== */
const productType = document.getElementById("product-type");
const otherFields = document.getElementById("other-fields");
const cardFields = document.getElementById("card-fields");

productType.addEventListener("change", () => {
  const v = productType.value;
  otherFields.style.display =
    v === "BOOSTER_BOX" || v === "ACCESSORY" || v === "OTHER"
      ? "block"
      : "none";
  cardFields.style.display = v === "CARD" ? "block" : "none";
});

/* ===== Card upload/process UI ===== */
const cardFileInput = document.getElementById("cardFileInput");
const cardProcessBtn = document.getElementById("cardProcessBtn");
const cardPreviewBlock = document.getElementById("cardPreviewBlock");
const cardOriginalPreview = document.getElementById("cardOriginalPreview");
const cardLoading = document.getElementById("cardLoading");
const cardUploadText = document.getElementById("cardUploadText");
const camBox = document.getElementById("cameraBox");
const canvas = document.getElementById("canvas");
const openCamBtn = document.getElementById("openCamBtn");

/* ===== CONFIG ===== */
const CROP_FRAC = { xs: 0.09, ys: 0.93, xe: 0.22, ye: 0.97 }; // use seus valores

/* ===== ELEMENTOS ===== */
const video = document.getElementById("video"); // ID correto do vídeo
const cardUploadArea = document.getElementById("cardUploadArea"); // se ainda usar
const frameBox = document.getElementById("frame-box"); // o div overlay que já colocou
const snapshotCanvas = document.getElementById("snapshot");
let streamRef = null;

/* ===== Inicia câmera ===== */
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    streamRef = stream;
    video.srcObject = stream;
    // quando metadata carregar, posiciona o frame
    video.addEventListener("loadedmetadata", () => {
      positionFrameOverlay();
    });
  } catch (err) {
    console.error("Erro ao acessar câmera:", err);
    alert("Não foi possível acessar a câmera: " + err.message);
  }
}
startCamera();

/* ===== Posiciona o overlay de corte exatamente nas frações definidas ===== */
function positionFrameOverlay() {
  // vídeo pode ter CSS de largura/altura diferentes; usamos a dimensão exibida
  const vw = video.clientWidth;
  const vh = video.clientHeight;

  // calcula em pixels (relativo ao elemento video exibido)
  const leftPx = Math.round(CROP_FRAC.xs * vw);
  const topPx = Math.round(CROP_FRAC.ys * vh);
  const widthPx = Math.round((CROP_FRAC.xe - CROP_FRAC.xs) * vw);
  const heightPx = Math.round((CROP_FRAC.ye - CROP_FRAC.ys) * vh);

  // aplica ao frameBox (overlay posicionado em relação ao vídeo)
  frameBox.style.left = leftPx + "px";
  frameBox.style.top = topPx + "px";
  frameBox.style.width = widthPx + "px";
  frameBox.style.height = heightPx + "px";
  frameBox.style.position = "absolute";
  frameBox.style.pointerEvents = "none";
}

/* ===== Captura e envia ===== */
async function captureAndSend() {
  if (!video || !streamRef) {
    alert("Câmera não iniciada");
    return;
  }

  // usa resolução real do vídeo para enviar imagem com dimensões corretas
  const realW = video.videoWidth;
  const realH = video.videoHeight;

  // ajusta canvas para resolução real
  snapshotCanvas.width = realW;
  snapshotCanvas.height = realH;
  const ctx = snapshotCanvas.getContext("2d");

  // desenha frame inteiro (resolução real)
  ctx.drawImage(video, 0, 0, realW, realH);

  // calcula crop em pixels na resolução real (mesma fração do servidor)
  const cx = Math.round(CROP_FRAC.xs * realW);
  const cy = Math.round(CROP_FRAC.ys * realH);
  const cw = Math.round((CROP_FRAC.xe - CROP_FRAC.xs) * realW);
  const ch = Math.round((CROP_FRAC.ye - CROP_FRAC.ys) * realH);

  // cria canvas para o crop para mostrar preview e enviar se quiser
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cw;
  cropCanvas.height = ch;
  const cctx = cropCanvas.getContext("2d");
  // desenha só a área do crop no cropCanvas
  cctx.drawImage(snapshotCanvas, cx, cy, cw, ch, 0, 0, cw, ch);

  // mostra preview do crop (insere na div de preview ou atualiza img)
  const previewBlock = document.getElementById("cardPreviewBlock");
  previewBlock.innerHTML = ""; // limpa
  const img = document.createElement("img");
  img.src = cropCanvas.toDataURL("image/png");
  img.style.width = "140px";
  img.style.height = "90px";
  img.style.objectFit = "contain";
  previewBlock.style.display = "flex";
  previewBlock.appendChild(img);

  // Enviar para backend: enviamos a imagem inteira + coords (backend pode cortar de novo ou usar o crop já feito)
  // Aqui eu envio o FRAME COMPLETO (melhor para backend aplicar o mesmo crop) + coords
  const fullDataURL = snapshotCanvas.toDataURL("image/png");

  try {
    const res = await fetch("/process_camera", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: fullDataURL,
        crop: CROP_FRAC, // opcional: informa as frações ao backend
      }),
    });
    const data = await res.json();
    console.log("Resposta OCR/camada DB:", data);

    // preenche campos conforme resposta (exemplo)
    if (data.ocr_results) {
      document.getElementById("card-code").value =
        data.ocr_results.db_code || "";
    }
    if (data.database_results && data.database_results.database_match) {
      const card = data.database_results.database_match;
      document.getElementById("card-title").value = card.title || "";
      document.getElementById("card-collection").value =
        card.collection_abbreviation || card.collection_name || "";
      document.getElementById("card-rarity").value = card.rarity || "";
    }

    if (data.visualization && data.visualization.cropped_image_server_path) {
      // opcional: mostrar imagem gerada no servidor (se o backend expuser)
      const serverCropImg = document.createElement("img");
      serverCropImg.src = data.visualization.cropped_image_server_path;
      serverCropImg.style.width = "140px";
      serverCropImg.style.height = "90px";
      serverCropImg.style.objectFit = "contain";
      previewBlock.appendChild(serverCropImg);
    }

    // feedback
    const alerts = document.getElementById("alerts");
    alerts.innerHTML = `<div class="alert alert-success">Processamento realizado.</div>`;
  } catch (err) {
    console.error("Erro no envio:", err);
    const alerts = document.getElementById("alerts");
    alerts.innerHTML = `<div class="alert alert-error">Erro no processamento: ${err.message}</div>`;
  }
}

/* conecta botão */
document
  .getElementById("cardProcessBtn")
  .addEventListener("click", captureAndSend);

/* reposiciona overlay no resize da janela */
window.addEventListener("resize", () => {
  if (video && video.clientWidth) positionFrameOverlay();
});

openCamBtn.onclick = async () => {
  camBox.style.display = "block";

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }, // usa webcam traseira quando possível
  });

  video.srcObject = stream;
};

let cardFile = null;

cardUploadArea.addEventListener("click", () => cardFileInput.click());
cardUploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  cardUploadArea.classList.add("dragover");
});
cardUploadArea.addEventListener("dragleave", () =>
  cardUploadArea.classList.remove("dragover")
);
cardUploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  cardUploadArea.classList.remove("dragover");
  if (e.dataTransfer.files && e.dataTransfer.files.length)
    handleCardFile(e.dataTransfer.files[0]);
});
cardFileInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) handleCardFile(e.target.files[0]);
});

function handleCardFile(f) {
  if (!f.type.startsWith("image/")) {
    showAlert("Selecione apenas imagens (JPG, PNG, etc.)", "error");
    return;
  }

  cardFile = f;
  cardProcessBtn.disabled = false;

  // preview original image locally
  const url = URL.createObjectURL(f);
  cardOriginalPreview.src = url;
  cardPreviewBlock.style.display = "block";

  // Atualizar a área de upload para mostrar que tem uma imagem
  cardUploadArea.classList.add("has-image");
  cardUploadText.textContent = "Imagem carregada! Clique para trocar";

  showAlert(
    'Imagem carregada com sucesso! Clique em "Processar Carta" para extrair os dados.',
    "success"
  );
}

/* Helper: format letters+number into SVP-025 style (best-effort) */
function formatDbCode(lettersRaw, numberRaw) {
  if (!lettersRaw && !numberRaw) return null;
  let letters = (lettersRaw || "").toUpperCase().replace(/[^A-Z]/g, "");
  // prefer first token like SVP or first 2-4 letters
  const m = letters.match(/^[A-Z]{2,6}/);
  letters = m ? m[0] : letters.substr(0, 3);
  let num = (numberRaw || "").toString().replace(/[^0-9]/g, "");
  if (num) {
    // pad to 3
    try {
      num = String(parseInt(num, 10)).padStart(3, "0");
    } catch (e) {
      num = num.padStart(3, "0");
    }
    return `${letters}-${num}`;
  } else {
    return letters;
  }
}

/* Process image: send to /upload */
async function processCardImage() {
  if (!cardFile) {
    showAlert("Selecione uma imagem antes de processar", "error");
    return;
  }

  cardProcessBtn.disabled = true;
  cardLoading.classList.remove("hidden");

  const form = new FormData();
  form.append("file", cardFile);

  try {
    const res = await fetch("/upload", { method: "POST", body: form });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Erro servidor ${res.status}: ${txt}`);
    }
    const data = await res.json();
    handleOCRResult(data);
  } catch (err) {
    console.error("Erro processando OCR", err);
    showAlert("Erro ao processar imagem: " + err.message, "error");
  } finally {
    cardLoading.classList.add("hidden");
    cardProcessBtn.disabled = false;
  }
}

cardProcessBtn.addEventListener("click", processCardImage);

/* Fill fields from result */
function handleOCRResult(result) {
  // Apenas extrair dados do OCR, sem mostrar imagem processada
  const ocr = result.ocr_results || {};
  const db = result.database_results || {};

  const letters_raw = (ocr.letters_raw || "").toUpperCase();
  const numbers_raw = ocr.numbers_raw || "" || ocr.normalized_num || "";

  // preferred: data from database_match if exists
  if (db.database_match) {
    const card = db.database_match;
    // map fields (adjust names if your db uses different keys)
    document.getElementById("card-title").value = card.title || "";
    document.getElementById("card-season").value = card.season || "";
    document.getElementById("card-type").value = card.pokemon_type || "";
    // collection: try abbreviation or name
    document.getElementById("card-collection").value =
      card.collection_abbreviation || card.collection_name || "";
    // code: DB code probably exact
    document.getElementById("card-code").value =
      card.code ||
      db.normalized_db_code ||
      formatDbCode(letters_raw, numbers_raw) ||
      "";
    document.getElementById("card-rarity").value = card.rarity || "";
    document.getElementById("card-nationality").value = card.nationality || "";
    showAlert(
      "Carta encontrada no banco — campos preenchidos com dados do RTR",
      "success"
    );
  } else {
    // not found in DB: try to fill from OCR
    const guessCode =
      db.normalized_db_code || formatDbCode(letters_raw, numbers_raw);
    document.getElementById("card-code").value = guessCode || "";
    // set other fields empty or from OCR aggregate if available
    // attempt to set set letters as collection
    document.getElementById("card-collection").value = letters_raw || "";
    showAlert(
      "Carta não encontrada no banco. Campos preenchidos com OCR (ajuste manual se necessário).",
      "error"
    );
  }
}

/* small alert helper */
function showAlert(msg, type = "success", timeout = 5000) {
  const alerts = document.getElementById("alerts");
  const div = document.createElement("div");
  div.className =
    "alert " + (type === "success" ? "alert-success" : "alert-error");
  div.textContent = msg;
  alerts.appendChild(div);
  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 400);
  }, timeout);
}

/* Submit form: send to backend to create product (example) */
document
  .getElementById("product-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("product-name").value,
      description: document.getElementById("product-description").value,
      type: document.getElementById("product-type").value,
      condition: document.getElementById("product-condition").value,
      price: parseFloat(document.getElementById("product-price").value || 0.0),
      store_id: document.getElementById("target-store-select").value,
      // card-specific:
      title: document.getElementById("card-title").value,
      season: document.getElementById("card-season").value,
      pokemon_type: document.getElementById("card-type").value,
      collection_id: document.getElementById("card-collection").value,
      code: document.getElementById("card-code").value,
      rarity: document.getElementById("card-rarity").value,
      nationality: document.getElementById("card-nationality").value,
    };

    try {
      // Ajuste a URL /payload conforme sua API de cadastro.
      const res = await fetch("/create_product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("Produto cadastrado com sucesso!", "success");
        // opcional: limpar form ou redirecionar
        setTimeout(() => {
          window.location.href = "estoque.html";
        }, 1500);
      } else {
        throw new Error(data.message || "Erro ao cadastrar produto");
      }
    } catch (err) {
      console.error(err);
      showAlert("Erro ao cadastrar produto: " + err.message, "error");
    }
  });
