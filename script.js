// ============================================
// CONFIGURAÇÃO DA API
// ============================================
const API_URL = 'https://script.google.com/macros/s/AKfycbxg8pD4An5xvuWXilHDp4jyhdC_gvP0WGTE62YNz_jwyocO4Bn9GKQpQc6QM-W9WUeTAw/exec';

// ============================================
// NAVEGAÇÃO
// ============================================
document.querySelectorAll('[data-page]').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    renderPage(page);
  });
});

// ============================================
// FUNÇÃO PARA RENDERIZAR CADA PÁGINA
// ============================================
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
      // Carrega os produtos no dropdown após a página ser renderizada
      setTimeout(() => {
        carregarProdutosNoDropdown();
      }, 100);
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

// ============================================
// PÁGINAS (HTML)
// ============================================

function homePage() {
  return `
    <section>
      <h1>🏠 Bem-vindo ao Sistema de Vendas</h1>
      <p>Gerencie seus produtos e vendas de cosméticos.</p>
      <p>Use os botões acima para navegar.</p>
      
      <div style="margin-top: 30px; display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; flex: 1; min-width: 200px;">
          <h3>📦 Produtos</h3>
          <p>Cadastre e gerencie seu estoque</p>
        </div>
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; flex: 1; min-width: 200px;">
          <h3>💰 Vendas</h3>
          <p>Registre suas vendas diárias</p>
        </div>
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; flex: 1; min-width: 200px;">
          <h3>📊 Consulta</h3>
          <p>Consulte produtos em estoque</p>
        </div>
      </div>
    </section>
  `;
}

function cadastroPage() {
  return `
    <section>
      <h2>➕ Cadastrar Produto</h2>
      <form id="formCadastro" style="max-width: 500px;">
        <div style="margin-bottom: 15px;">
          <label for="nome"><strong>Nome do produto:</strong></label>
          <input type="text" id="nome" placeholder="Ex: Shampoo" required style="width: 100%; padding: 8px; margin-top: 5px;">
        </div>
        <div style="margin-bottom: 15px;">
          <label for="preco"><strong>Preço (R$):</strong></label>
          <input type="number" id="preco" placeholder="0,00" step="0.01" required style="width: 100%; padding: 8px; margin-top: 5px;">
        </div>
        <div style="margin-bottom: 15px;">
          <label for="quantidade"><strong>Quantidade em estoque:</strong></label>
          <input type="number" id="quantidade" placeholder="0" required style="width: 100%; padding: 8px; margin-top: 5px;">
        </div>
        <button type="submit" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
          Cadastrar Produto
        </button>
      </form>
      <div id="msgCadastro" style="margin-top: 20px;"></div>
    </section>
  `;
}

function consultaPage() {
  return `
    <section>
      <h2>🔍 Consultar Estoque</h2>
      
      <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <label for="selectProduto"><strong>Selecione um produto:</strong></label>
          <select id="selectProduto" style="padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 14px; min-width: 300px; flex: 1;">
            <option value="">-- Escolha um produto --</option>
          </select>
          <button onclick="carregarProdutosNoDropdown()" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
            🔄 Atualizar
          </button>
        </div>
      </div>
      
      <div id="detalhesProduto" style="margin-top: 20px;"></div>
      
      <div style="margin-top: 40px;">
        <h3>📋 Todos os Produtos</h3>
        <div id="listaTodosProdutos"></div>
      </div>
    </section>
  `;
}

function vendasPage() {
  return `
    <section>
      <h2>💰 Registrar Venda</h2>
      <form id="formVenda" style="max-width: 500px;">
        <div style="margin-bottom: 15px;">
          <label for="produtoId"><strong>Produto:</strong></label>
          <select id="produtoId" required style="width: 100%; padding: 8px; margin-top: 5px;">
            <option value="">Selecione um produto</option>
          </select>
        </div>
        <div style="margin-bottom: 15px;">
          <label for="qtdVenda"><strong>Quantidade:</strong></label>
          <input type="number" id="qtdVenda" placeholder="Quantidade" required style="width: 100%; padding: 8px; margin-top: 5px;">
        </div>
        <div style="margin-bottom: 15px;">
          <label for="cliente"><strong>Cliente (opcional):</strong></label>
          <input type="text" id="cliente" placeholder="Nome do cliente" style="width: 100%; padding: 8px; margin-top: 5px;">
        </div>
        <button type="submit" style="background: #FF9800; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
          Registrar Venda
        </button>
      </form>
      <div id="msgVenda" style="margin-top: 20px;"></div>
    </section>
  `;
}

// ============================================
// FUNÇÕES DE COMUNICAÇÃO COM API
// ============================================

// Função genérica para chamar a API (CORRIGIDA)
async function callAPI(action, data = null) {
  const url = `${API_URL}?action=${action}`;
  
  const options = {
    method: data ? 'POST' : 'GET',
    mode: 'cors', // MUDADO de 'no-cors' para 'cors'
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Erro na chamada da API:', error);
    throw error;
  }
}

// ============================================
// FUNÇÕES DA PÁGINA DE CADASTRO
// ============================================

// Cadastrar produto
async function cadastrarProduto(e) {
  e.preventDefault();
  const nome = document.getElementById('nome').value;
  const preco = parseFloat(document.getElementById('preco').value);
  const quantidade = parseInt(document.getElementById('quantidade').value);
  
  // Validações
  if (!nome || isNaN(preco) || isNaN(quantidade)) {
    document.getElementById('msgCadastro').innerHTML = '❌ Preencha todos os campos corretamente.';
    return;
  }
  
  try {
    const result = await callAPI('cadastrarProduto', { nome, preco, quantidade });
    
    if (result.success) {
      document.getElementById('msgCadastro').innerHTML = '✅ Produto cadastrado com sucesso!';
      document.getElementById('formCadastro').reset();
    } else {
      document.getElementById('msgCadastro').innerHTML = `❌ ${result.error || 'Erro ao cadastrar produto.'}`;
    }
  } catch (error) {
    document.getElementById('msgCadastro').innerHTML = '❌ Erro de comunicação com o servidor.';
    console.error('Erro ao cadastrar:', error);
  }
}

// ============================================
// FUNÇÕES DA PÁGINA DE CONSULTA
// ============================================

// Carregar produtos no dropdown
async function carregarProdutosNoDropdown() {
  const select = document.getElementById('selectProduto');
  if (!select) return;
  
  // Limpa o dropdown mantendo apenas a primeira opção
  select.innerHTML = '<option value="">-- Escolha um produto --</option>';
  
  try {
    const result = await callAPI('listarProdutos');
    
    // Verifica se a resposta tem a estrutura correta
    const produtos = result.produtos || result;
    
    if (!Array.isArray(produtos) || produtos.length === 0) {
      select.innerHTML += '<option value="">Nenhum produto cadastrado</option>';
      document.getElementById('listaTodosProdutos').innerHTML = '<p style="color: #999;">Nenhum produto cadastrado.</p>';
      return;
    }
    
    // Adiciona cada produto como opção
    produtos.forEach(produto => {
      const option = document.createElement('option');
      option.value = produto.id;
      option.textContent = `${produto.nome} (Estoque: ${produto.quantidade})`;
      select.appendChild(option);
    });
    
    // Adiciona evento para quando selecionar um produto
    select.addEventListener('change', function() {
      const idSelecionado = this.value;
      if (idSelecionado) {
        exibirDetalhesProduto(idSelecionado);
      } else {
        document.getElementById('detalhesProduto').innerHTML = '';
      }
    });
    
    // Também carrega a lista completa
    exibirTodosProdutos(produtos);
    
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    select.innerHTML += '<option value="">Erro ao carregar produtos</option>';
    document.getElementById('listaTodosProdutos').innerHTML = '<p style="color: red;">❌ Erro ao carregar lista de produtos</p>';
  }
}

// Exibir detalhes do produto selecionado
function exibirDetalhesProduto(id) {
  const divDetalhes = document.getElementById('detalhesProduto');
  
  // Buscar o produto específico na lista completa
  const select = document.getElementById('selectProduto');
  const optionSelecionada = select.options[select.selectedIndex];
  
  if (!optionSelecionada || !optionSelecionada.value) {
    divDetalhes.innerHTML = '<p style="color: orange;">⚠️ Selecione um produto válido.</p>';
    return;
  }
  
  // Extrair informações do texto da opção (nome e estoque)
  const texto = optionSelecionada.textContent;
  const match = texto.match(/^(.*?)\s*\(Estoque:\s*(\d+)\)/);
  
  if (match) {
    const nome = match[1].trim();
    const quantidade = parseInt(match[2]);
    
    // Buscar preço do produto
    buscarPrecoProduto(id, nome, quantidade);
  } else {
    divDetalhes.innerHTML = '<p style="color: red;">❌ Erro ao ler dados do produto.</p>';
  }
}

// Buscar preço do produto
let produtosCache = [];

async function buscarPrecoProduto(id, nome, quantidade) {
  try {
    // Se não tivermos o cache, buscamos da API
    if (produtosCache.length === 0) {
      const result = await callAPI('listarProdutos');
      produtosCache = result.produtos || result;
    }
    
    // Encontra o produto pelo ID
    const produto = produtosCache.find(p => p.id == id);
    
    if (produto) {
      exibirTabelaProduto({
        id: produto.id,
        nome: produto.nome,
        quantidade: produto.quantidade,
        preco: produto.preco
      });
    } else {
      // Se não encontrar pelo ID, tenta pelo nome
      const produtoPorNome = produtosCache.find(p => p.nome === nome);
      if (produtoPorNome) {
        exibirTabelaProduto({
          id: produtoPorNome.id,
          nome: produtoPorNome.nome,
          quantidade: produtoPorNome.quantidade,
          preco: produtoPorNome.preco
        });
      } else {
        document.getElementById('detalhesProduto').innerHTML = 
          '<p style="color: red;">❌ Produto não encontrado na base de dados.</p>';
      }
    }
  } catch (error) {
    console.error('Erro ao buscar preço:', error);
    document.getElementById('detalhesProduto').innerHTML = 
      '<p style="color: red;">❌ Erro ao carregar detalhes do produto.</p>';
  }
}

// Exibir tabela com os detalhes do produto
function exibirTabelaProduto(produto) {
  const divDetalhes = document.getElementById('detalhesProduto');
  
  const status = produto.quantidade > 10 ? '✅ Em estoque' : 
                 produto.quantidade > 0 ? '⚠️ Baixo estoque' : '❌ Esgotado';
  const corStatus = produto.quantidade > 10 ? '#4CAF50' : 
                    produto.quantidade > 0 ? '#FF9800' : '#f44336';
  
  const html = `
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 2px solid #4CAF50; animation: fadeIn 0.3s ease-in;">
      <h3 style="color: #4CAF50; margin-top: 0;">📋 Detalhes do Produto</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #4CAF50; color: white;">
            <th style="padding: 12px; text-align: left;">ID</th>
            <th style="padding: 12px; text-align: left;">Nome</th>
            <th style="padding: 12px; text-align: center;">Quantidade em Estoque</th>
            <th style="padding: 12px; text-align: right;">Preço Unitário</th>
            <th style="padding: 12px; text-align: right;">Valor Total em Estoque</th>
            <th style="padding: 12px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: white; border-bottom: 1px solid #ddd;">
            <td style="padding: 12px;"><strong>#${produto.id}</strong></td>
            <td style="padding: 12px;"><strong>${produto.nome}</strong></td>
            <td style="padding: 12px; text-align: center;">
              <span style="background: ${corStatus}; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold;">
                ${produto.quantidade} unidades
              </span>
            </td>
            <td style="padding: 12px; text-align: right;">R$ ${produto.preco.toFixed(2)}</td>
            <td style="padding: 12px; text-align: right;"><strong>R$ ${(produto.preco * produto.quantidade).toFixed(2)}</strong></td>
            <td style="padding: 12px; text-align: center;">
              <span style="background: ${corStatus}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px;">
                ${status}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  
  divDetalhes.innerHTML = html;
}

// Exibir todos os produtos em tabela
function exibirTodosProdutos(produtos) {
  const divLista = document.getElementById('listaTodosProdutos');
  
  if (!produtos || produtos.length === 0) {
    divLista.innerHTML = '<p style="color: #999;">Nenhum produto cadastrado.</p>';
    return;
  }
  
  let html = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: #2196F3; color: white;">
            <th style="padding: 12px; text-align: left;">ID</th>
            <th style="padding: 12px; text-align: left;">Nome</th>
            <th style="padding: 12px; text-align: center;">Quantidade</th>
            <th style="padding: 12px; text-align: right;">Preço</th>
            <th style="padding: 12px; text-align: right;">Valor Total</th>
            <th style="padding: 12px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  produtos.forEach((produto, index) => {
    const status = produto.quantidade > 10 ? '✅ Em estoque' : 
                   produto.quantidade > 0 ? '⚠️ Baixo estoque' : '❌ Esgotado';
    const corStatus = produto.quantidade > 10 ? '#4CAF50' : 
                      produto.quantidade > 0 ? '#FF9800' : '#f44336';
    
    html += `
      <tr style="background: ${index % 2 === 0 ? '#f9f9f9' : 'white'}; 
                 border-bottom: 1px solid #ddd;
                 cursor: pointer;"
          onclick="selecionarProdutoDaTabela(${produto.id})"
          onmouseover="this.style.background='#e3f2fd'"
          onmouseout="this.style.background='${index % 2 === 0 ? '#f9f9f9' : 'white'}'">
        <td style="padding: 12px;">#${produto.id}</td>
        <td style="padding: 12px;"><strong>${produto.nome}</strong></td>
        <td style="padding: 12px; text-align: center;">${produto.quantidade}</td>
        <td style="padding: 12px; text-align: right;">R$ ${produto.preco.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right;">R$ ${(produto.preco * produto.quantidade).toFixed(2)}</td>
        <td style="padding: 12px; text-align: center;">
          <span style="background: ${corStatus}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px;">
            ${status}
          </span>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
        <tfoot style="background: #e3f2fd; font-weight: bold;">
          <tr>
            <td colspan="6" style="padding: 12px; text-align: right;">
              <strong>Total de produtos: ${produtos.length}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
  
  divLista.innerHTML = html;
}

// Função para selecionar produto clicando na tabela
function selecionarProdutoDaTabela(id) {
  const select = document.getElementById('selectProduto');
  if (select) {
    select.value = id;
    // Dispara o evento change
    const event = new Event('change');
    select.dispatchEvent(event);
    
    // Rola a página para os detalhes
    const detalhes = document.getElementById('detalhesProduto');
    if (detalhes) {
      setTimeout(() => {
        detalhes.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}

// ============================================
// FUNÇÕES DA PÁGINA DE VENDAS
// ============================================

// Carregar produtos no dropdown de venda
async function carregarProdutosParaVenda() {
  try {
    const result = await callAPI('listarProdutos');
    const produtos = result.produtos || result;
    const select = document.getElementById('produtoId');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um produto</option>';
    
    if (!Array.isArray(produtos) || produtos.length === 0) {
      select.innerHTML += '<option value="">Nenhum produto disponível</option>';
      return;
    }
    
    produtos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.nome} - R$ ${parseFloat(p.preco).toFixed(2)} (estoque: ${p.quantidade})`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error('Erro ao carregar produtos para venda', error);
    const select = document.getElementById('produtoId');
    if (select) {
      select.innerHTML = '<option value="">Erro ao carregar produtos</option>';
    }
  }
}

// Registrar venda
async function registrarVenda(e) {
  e.preventDefault();
  const produtoId = document.getElementById('produtoId').value;
  const quantidade = parseInt(document.getElementById('qtdVenda').value);
  const cliente = document.getElementById('cliente').value;
  
  if (!produtoId || !quantidade || quantidade <= 0) {
    document.getElementById('msgVenda').innerHTML = '⚠️ Preencha todos os campos corretamente.';
    return;
  }
  
  try {
    const result = await callAPI('registrarVenda', { produtoId, quantidade, cliente });
    
    if (result.success) {
      document.getElementById('msgVenda').innerHTML = '✅ Venda registrada com sucesso!';
      // Atualizar dropdown e estoque
      carregarProdutosParaVenda();
      document.getElementById('formVenda').reset();
    } else {
      document.getElementById('msgVenda').innerHTML = `❌ ${result.error || 'Erro ao registrar venda.'}`;
    }
  } catch (error) {
    document.getElementById('msgVenda').innerHTML = '❌ Erro de comunicação com o servidor.';
    console.error('Erro ao registrar venda:', error);
  }
}

// ============================================
// INICIAR COM A HOME
// ============================================
renderPage('home');

// ============================================
// ESTILOS ADICIONAIS (INJETADOS VIA JS)
// ============================================
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  #selectProduto {
    transition: border-color 0.3s;
  }
  
  #selectProduto:hover {
    border-color: #4CAF50;
  }
  
  #selectProduto:focus {
    outline: none;
    border-color: #2196F3;
    box-shadow: 0 0 5px rgba(33, 150, 243, 0.3);
  }
  
  #detalhesProduto {
    animation: fadeIn 0.3s ease-in;
  }
  
  table {
    border-radius: 8px;
    overflow: hidden;
  }
  
  table th {
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  table tr:hover {
    background: #e3f2fd !important;
    transition: background 0.3s;
  }
`;
document.head.appendChild(style);
