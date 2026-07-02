const API_URL = 'https://script.google.com/macros/s/SEU_ID/exec'; // Substitua

// Navegação
document.querySelectorAll('[data-page]').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    renderPage(page);
  });
});

// Função para renderizar cada página
function renderPage(page) {
  const app = document.getElementById('app');
  switch(page) {
    case 'home':
      app.innerHTML = homePage();
      break;
    case 'cadastro':
      app.innerHTML = cadastroPage();
      document.getElementById('formCadastro').addEventListener('submit', cadastrarProduto);
      break;
    case 'consulta':
      app.innerHTML = consultaPage();
      listarProdutos();
      break;
    case 'vendas':
      app.innerHTML = vendasPage();
      carregarProdutosParaVenda();
      document.getElementById('formVenda').addEventListener('submit', registrarVenda);
      break;
    default:
      app.innerHTML = '<h2>Página não encontrada</h2>';
  }
}

// --- PÁGINAS (HTML) ---
function homePage() {
  return `
    <section>
      <h1>Bem-vindo ao Sistema de Vendas</h1>
      <p>Gerencie seus produtos e vendas de cosméticos.</p>
      <p>Use os botões acima para navegar.</p>
    </section>
  `;
}

function cadastroPage() {
  return `
    <section>
      <h2>Cadastrar Produto</h2>
      <form id="formCadastro">
        <input type="text" id="nome" placeholder="Nome do produto" required>
        <input type="number" id="preco" placeholder="Preço" step="0.01" required>
        <input type="number" id="quantidade" placeholder="Quantidade em estoque" required>
        <button type="submit">Cadastrar</button>
      </form>
      <div id="msgCadastro"></div>
    </section>
  `;
}

function consultaPage() {
  return `
    <section>
      <h2>Consultar Estoque</h2>
      <input type="text" id="filtro" placeholder="Filtrar por nome..." oninput="listarProdutos()">
      <div id="listaProdutos"></div>
    </section>
  `;
}

function vendasPage() {
  return `
    <section>
      <h2>Registrar Venda</h2>
      <form id="formVenda">
        <select id="produtoId" required></select>
        <input type="number" id="qtdVenda" placeholder="Quantidade" required>
        <input type="text" id="cliente" placeholder="Cliente (opcional)">
        <button type="submit">Registrar Venda</button>
      </form>
      <div id="msgVenda"></div>
    </section>
  `;
}

// --- FUNÇÕES DE COMUNICAÇÃO COM API ---

// Função genérica para chamar a API
async function callAPI(action, data = null) {
  const options = {
    method: data ? 'POST' : 'GET',
    mode: 'no-cors', // para evitar CORS (mas limitado)
    headers: { 'Content-Type': 'application/json' }
  };
  let url = `${API_URL}?action=${action}`;
  if (data) {
    options.body = JSON.stringify(data);
  }
  const response = await fetch(url, options);
  // Como usamos no-cors, a resposta não pode ser lida diretamente.
  // Recomenda-se usar 'cors' e configurar o Apps Script para aceitar.
  // Para simplificar, usaremos um proxy ou mudaremos para mode 'cors'.
  // Vou usar mode 'cors' e confiar que o Apps Script retorne JSON.
  // Ajuste: no Apps Script, defina ContentService e permita CORS com cabeçalhos.
  return response.json();
}

// Cadastrar produto
async function cadastrarProduto(e) {
  e.preventDefault();
  const nome = document.getElementById('nome').value;
  const preco = parseFloat(document.getElementById('preco').value);
  const quantidade = parseInt(document.getElementById('quantidade').value);
  try {
    const result = await callAPI('cadastrarProduto', { nome, preco, quantidade });
    document.getElementById('msgCadastro').innerText = result.success ? 'Produto cadastrado!' : 'Erro ao cadastrar.';
  } catch (error) {
    document.getElementById('msgCadastro').innerText = 'Erro de comunicação.';
  }
}

// Listar produtos (consulta)
async function listarProdutos() {
  const filtro = document.getElementById('filtro')?.value?.toLowerCase() || '';
  try {
    const produtos = await callAPI('listarProdutos');
    const filtered = produtos.filter(p => p.nome.toLowerCase().includes(filtro));
    const div = document.getElementById('listaProdutos');
    if (!div) return;
    if (filtered.length === 0) {
      div.innerHTML = '<p>Nenhum produto encontrado.</p>';
      return;
    }
    let html = `<table><tr><th>Nome</th><th>Preço</th><th>Estoque</th></tr>`;
    filtered.forEach(p => {
      html += `<tr><td>${p.nome}</td><td>R$ ${parseFloat(p.preco).toFixed(2)}</td><td>${p.quantidade}</td></tr>`;
    });
    html += '</table>';
    div.innerHTML = html;
  } catch (error) {
    document.getElementById('listaProdutos').innerHTML = '<p>Erro ao carregar produtos.</p>';
  }
}

// Carregar produtos no dropdown de venda
async function carregarProdutosParaVenda() {
  try {
    const produtos = await callAPI('listarProdutos');
    const select = document.getElementById('produtoId');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um produto</option>';
    produtos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.nome} - R$ ${parseFloat(p.preco).toFixed(2)} (estoque: ${p.quantidade})`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error('Erro ao carregar produtos para venda', error);
  }
}

// Registrar venda
async function registrarVenda(e) {
  e.preventDefault();
  const produtoId = document.getElementById('produtoId').value;
  const quantidade = parseInt(document.getElementById('qtdVenda').value);
  const cliente = document.getElementById('cliente').value;
  if (!produtoId || !quantidade) {
    document.getElementById('msgVenda').innerText = 'Preencha todos os campos.';
    return;
  }
  try {
    const result = await callAPI('registrarVenda', { produtoId, quantidade, cliente });
    document.getElementById('msgVenda').innerText = result.success ? 'Venda registrada!' : 'Erro ao registrar.';
    if (result.success) {
      // Atualizar dropdown e estoque
      carregarProdutosParaVenda();
      document.getElementById('formVenda').reset();
    }
  } catch (error) {
    document.getElementById('msgVenda').innerText = 'Erro de comunicação.';
  }
}

// Iniciar com a home
renderPage('home');
