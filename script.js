// ============================================
// CONFIGURAÇÃO DA API
// ============================================
const API_URL = 'https://script.google.com/macros/s/AKfycbxg8pD4An5xvuWXilHDp4jyhdC_gvP0WGTE62YNz_jwyocO4Bn9GKQpQc6QM-W9WUeTAw/exec';

// ============================================
// NAVEGAÇÃO
// ============================================
let currentPage = 'home';

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const page = this.dataset.page;
    navegarPara(page);
  });
});

function navegarPara(page) {
  currentPage = page;
  
  // Atualiza botões ativos
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-page="${page}"]`).classList.add('active');
  
  renderPage(page);
}

// ============================================
// FUNÇÃO PARA CHAMAR A API
// ============================================
async function callAPI(action, data = null) {
  const url = `${API_URL}?action=${action}`;
  
  const options = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Tenta parsear como JSON
    try {
      const result = await response.json();
      return result;
    } catch(e) {
      // Se não for JSON, retorna sucesso
      return { success: true, message: 'Operação realizada com sucesso' };
    }
  } catch (error) {
    console.error('Erro na API:', error);
    return { success: false, error: 'Erro de comunicação com o servidor' };
  }
}

// ============================================
// RENDERIZAR PÁGINAS
// ============================================
function renderPage(page) {
  const app = document.getElementById('app');
  
  switch(page) {
    case 'home':
      app.innerHTML = renderHome();
      carregarResumo();
      break;
    case 'cadastro':
      app.innerHTML = renderCadastro();
      document.getElementById('formCadastro').addEventListener('submit', cadastrarProduto);
      break;
    case 'consulta':
      app.innerHTML = renderConsulta();
      setTimeout(() => {
        carregarProdutosNoDropdown();
      }, 100);
      break;
    case 'vendas':
      app.innerHTML = renderVendas();
      carregarProdutosParaVenda();
      document.getElementById('formVenda').addEventListener('submit', registrarVenda);
      break;
    default:
      app.innerHTML = '<h2>Página não encontrada</h2>';
  }
}

// ============================================
// PÁGINA HOME
// ============================================
function renderHome() {
  return `
    <section>
      <h2>🏠 Bem-vindo ao Sistema de Vendas</h2>
      <p style="font-size: 18px; color: #666; margin-bottom: 30px;">
        Gerencie seus produtos e vendas de cosméticos de forma simples e eficiente.
      </p>
      
      <div class="home-grid">
        <div class="home-card">
          <h3 id="totalProdutos">0</h3>
          <p>📦 Produtos em Estoque</p>
        </div>
        <div class="home-card">
          <h3 id="totalVendas">0</h3>
          <p>💰 Vendas Realizadas</p>
        </div>
        <div class="home-card">
          <h3 id="valorTotal">R$ 0,00</h3>
          <p>💵 Valor Total em Estoque</p>
        </div>
      </div>
      
      <div style="margin-top: 30px; text-align: center; color: #999;">
        <p>Use os botões acima para navegar entre as funcionalidades</p>
      </div>
    </section>
  `;
}

async function carregarResumo() {
  try {
    const result = await callAPI('listarProdutos');
    const produtos = result.produtos || [];
    
    // Total de produtos
    document.getElementById('totalProdutos').textContent = produtos.length;
    
    // Valor total em estoque
    let valorTotal = 0;
    produtos.forEach(p => {
      valorTotal += p.preco * p.quantidade;
    });
    document.getElementById('valorTotal').textContent = `R$ ${valorTotal.toFixed(2)}`;
    
    // Total de vendas (seria melhor ter uma API específica)
    // Por enquanto, mostramos um número estimado
    document.getElementById('totalVendas').textContent = produtos.length > 0 ? '📊' : '0';
    
  } catch (error) {
    console.error('Erro ao carregar resumo:', error);
  }
}

// ============================================
// PÁGINA CADASTRO
// ============================================
function renderCadastro() {
  return `
    <section>
      <h2>➕ Cadastrar Produto</h2>
      <form id="formCadastro">
        <div class="form-group">
          <label for="nome">Nome do Produto</label>
          <input type="text" id="nome" placeholder="Ex: Shampoo" required>
        </div>
        <div class="form-group">
          <label for="preco">Preço (R$)</label>
          <input type="number" id="preco" placeholder="0,00" step="0.01" required>
        </div>
        <div class="form-group">
          <label for="quantidade">Quantidade em Estoque</label>
          <input type="number" id="quantidade" placeholder="0" required>
        </div>
        <button type="submit" class="btn-submit">Cadastrar Produto</button>
      </form>
      <div id="msgCadastro"></div>
    </section>
  `;
}

async function cadastrarProduto(e) {
  e.preventDefault();
  
  const nome = document.getElementById('nome').value.trim();
  const preco = parseFloat(document.getElementById('preco').value);
  const quantidade = parseInt(document.getElementById('quantidade').value);
  
  if (!nome || isNaN(preco) || isNaN(quantidade)) {
    mostrarMensagem('msgCadastro', 'Preencha todos os campos corretamente.', 'error');
    return;
  }
  
  try {
    const result = await callAPI('cadastrarProduto', { nome, preco, quantidade });
    
    if (result.success) {
      mostrarMensagem('msgCadastro', '✅ Produto cadastrado com sucesso!', 'success');
      document.getElementById('formCadastro').reset();
    } else {
      mostrarMensagem('msgCadastro', `❌ ${result.error || 'Erro ao cadastrar produto.'}`, 'error');
    }
  } catch (error) {
    mostrarMensagem('msgCadastro', '❌ Erro de comunicação com o servidor.', 'error');
  }
}

// ============================================
// PÁGINA CONSULTA
// ============================================
function renderConsulta() {
  return `
    <section>
      <h2>🔍 Consultar Estoque</h2>
      
      <div class="filtro-container">
        <select id="selectProduto">
          <option value="">-- Escolha um produto --</option>
        </select>
        <button onclick="carregarProdutosNoDropdown()">🔄 Atualizar</button>
      </div>
      
      <div id="detalhesProduto"></div>
      
      <div style="margin-top: 40px;">
        <h3>📋 Todos os Produtos</h3>
        <div class="table-container" id="listaTodosProdutos"></div>
      </div>
    </section>
  `;
}

async function carregarProdutosNoDropdown() {
  const select = document.getElementById('selectProduto');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- Escolha um produto --</option>';
  
  try {
    const result = await callAPI('listarProdutos');
    const produtos = result.produtos || [];
    
    if (produtos.length === 0) {
      select.innerHTML += '<option value="">Nenhum produto cadastrado</option>';
      document.getElementById('listaTodosProdutos').innerHTML = '<p>Nenhum produto cadastrado.</p>';
      return;
    }
    
    produtos.forEach(produto => {
      const option = document.createElement('option');
      option.value = produto.id;
      option.textContent = `${produto.nome} (Estoque: ${produto.quantidade})`;
      select.appendChild(option);
    });
    
    select.addEventListener('change', function() {
      if (this.value) {
        exibirDetalhesProduto(this.value);
      } else {
        document.getElementById('detalhesProduto').innerHTML = '';
      }
    });
    
    exibirTodosProdutos(produtos);
    
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    select.innerHTML += '<option value="">Erro ao carregar</option>';
    document.getElementById('listaTodosProdutos').innerHTML = '<p style="color: red;">❌ Erro ao carregar produtos.</p>';
  }
}

function exibirDetalhesProduto(id) {
  const select = document.getElementById('selectProduto');
  const option = select.options[select.selectedIndex];
  
  if (!option || !option.value) {
    document.getElementById('detalhesProduto').innerHTML = '';
    return;
  }
  
  // Extrai nome e quantidade do texto da opção
  const texto = option.textContent;
  const match = texto.match(/^(.*?)\s*\(Estoque:\s*(\d+)\)/);
  
  if (!match) {
    document.getElementById('detalhesProduto').innerHTML = '<p style="color: red;">❌ Erro ao ler dados do produto.</p>';
    return;
  }
  
  const nome = match[1].trim();
  const quantidade = parseInt(match[2]);
  
  // Busca o preço da lista de produtos
  buscarPrecoProduto(id, nome, quantidade);
}

async function buscarPrecoProduto(id, nome, quantidade) {
  try {
    const result = await callAPI('listarProdutos');
    const produtos = result.produtos || [];
    const produto = produtos.find(p => p.id == id);
    
    if (!produto) {
      document.getElementById('detalhesProduto').innerHTML = '<p style="color: red;">❌ Produto não encontrado.</p>';
      return;
    }
    
    const status = produto.quantidade > 10 ? '✅ Em estoque' : 
                   produto.quantidade > 0 ? '⚠️ Baixo estoque' : '❌ Esgotado';
    const corStatus = produto.quantidade > 10 ? '#4CAF50' : 
                      produto.quantidade > 0 ? '#FF9800' : '#f44336';
    
    const html = `
      <div class="detalhes-container">
        <h3>📋 Detalhes do Produto</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Quantidade</th>
              <th>Preço</th>
              <th>Valor Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>#${produto.id}</strong></td>
              <td><strong>${produto.nome}</strong></td>
              <td>${produto.quantidade}</td>
              <td>R$ ${produto.preco.toFixed(2)}</td>
              <td><strong>R$ ${(produto.preco * produto.quantidade).toFixed(2)}</strong></td>
              <td><span class="status-badge" style="background: ${corStatus}; color: white;">${status}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    
    document.getElementById('detalhesProduto').innerHTML = html;
    
  } catch (error) {
    console.error('Erro:', error);
    document.getElementById('detalhesProduto').innerHTML = '<p style="color: red;">❌ Erro ao carregar detalhes.</p>';
  }
}

function exibirTodosProdutos(produtos) {
  const div = document.getElementById('listaTodosProdutos');
  
  if (!produtos || produtos.length === 0) {
    div.innerHTML = '<p>Nenhum produto cadastrado.</p>';
    return;
  }
  
  let html = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Quantidade</th>
          <th>Preço</th>
          <th>Valor Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  produtos.forEach((p, index) => {
    const status = p.quantidade > 10 ? 'Em estoque' : 
                   p.quantidade > 0 ? 'Baixo estoque' : 'Esgotado';
    const corStatus = p.quantidade > 10 ? 'status-green' : 
                      p.quantidade > 0 ? 'status-yellow' : 'status-red';
    
    html += `
      <tr onclick="selecionarProduto(${p.id})">
        <td>#${p.id}</td>
        <td><strong>${p.nome}</strong></td>
        <td>${p.quantidade}</td>
        <td>R$ ${p.preco.toFixed(2)}</td>
        <td>R$ ${(p.preco * p.quantidade).toFixed(2)}</td>
        <td><span class="status-badge ${corStatus}">${status}</span></td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="6" style="text-align: right; font-weight: bold;">
            Total: ${produtos.length} produtos
          </td>
        </tr>
      </tfoot>
    </table>
  `;
  
  div.innerHTML = html;
}

function selecionarProduto(id) {
  const select = document.getElementById('selectProduto');
  if (select) {
    select.value = id;
    const event = new Event('change');
    select.dispatchEvent(event);
    
    document.getElementById('detalhesProduto').scrollIntoView({ behavior: 'smooth' });
  }
}

// ============================================
// PÁGINA VENDAS
// ============================================
function renderVendas() {
  return `
    <section>
      <h2>💰 Registrar Venda</h2>
      <form id="formVenda">
        <div class="form-group">
          <label for="produtoIdVenda">Produto</label>
          <select id="produtoIdVenda" required>
            <option value="">Selecione um produto</option>
          </select>
        </div>
        <div class="form-group">
          <label for="qtdVenda">Quantidade</label>
          <input type="number" id="qtdVenda" placeholder="Quantidade" required>
        </div>
        <div class="form-group">
          <label for="cliente">Cliente (opcional)</label>
          <input type="text" id="cliente" placeholder="Nome do cliente">
        </div>
        <button type="submit" class="btn-submit">✅ Registrar Venda</button>
      </form>
      <div id="msgVenda"></div>
    </section>
  `;
}

async function carregarProdutosParaVenda() {
  try {
    const result = await callAPI('listarProdutos');
    const produtos = result.produtos || [];
    const select = document.getElementById('produtoIdVenda');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um produto</option>';
    
    if (produtos.length === 0) {
      select.innerHTML += '<option value="">Nenhum produto disponível</option>';
      return;
    }
    
    produtos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.nome} - R$ ${p.preco.toFixed(2)} (Estoque: ${p.quantidade})`;
      select.appendChild(opt);
    });
    
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}

async function registrarVenda(e) {
  e.preventDefault();
  
  const produtoId = document.getElementById('produtoIdVenda').value;
  const quantidade = parseInt(document.getElementById('qtdVenda').value);
  const cliente = document.getElementById('cliente').value.trim();
  
  if (!produtoId || !quantidade || quantidade <= 0) {
    mostrarMensagem('msgVenda', '⚠️ Selecione um produto e informe a quantidade.', 'error');
    return;
  }
  
  try {
    const result = await callAPI('registrarVenda', { produtoId, quantidade, cliente });
    
    if (result.success) {
      mostrarMensagem('msgVenda', '✅ Venda registrada com sucesso!', 'success');
      document.getElementById('formVenda').reset();
      carregarProdutosParaVenda();
    } else {
      mostrarMensagem('msgVenda', `❌ ${result.error || 'Erro ao registrar venda.'}`, 'error');
    }
  } catch (error) {
    mostrarMensagem('msgVenda', '❌ Erro de comunicação com o servidor.', 'error');
  }
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================
function mostrarMensagem(elementId, mensagem, tipo) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const classes = {
    success: 'msg-success',
    error: 'msg-error',
    info: 'msg-info'
  };
  
  element.className = classes[tipo] || 'msg-info';
  element.innerHTML = mensagem;
  
  // Auto-esconde após 5 segundos
  clearTimeout(element._timeout);
  element._timeout = setTimeout(() => {
    element.innerHTML = '';
    element.className = '';
  }, 5000);
}

// ============================================
// INICIAR APLICAÇÃO
// ============================================
navegarPara('home');
