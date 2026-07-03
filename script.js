// ======================================
// CONFIGURAÇÃO API
// ======================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzWrSiJmWEuT0MJm2MZczxqbqcHAOvCcUJud-0Ke59Ag3V1TjAsSIvF7zh5b9cBtMNRrw/exec';

// ======================================
// API
// ======================================
async function callAPI(action, data = null) {
    const url = `${API_URL}?action=${action}`;
    try {
        const options = {
            method: data ? 'POST' : 'GET',
            ...(data && { body: JSON.stringify(data) })
        };
        const response = await fetch(url, options);
        const result = await response.json();
        console.log(`Resposta da API (${action}):`, result); // Para debug
        return result;
    } catch (error) {
        console.error('Erro na API:', error);
        return { success: false, error: error.message };
    }
}

// ======================================
// NAVEGAÇÃO
// ======================================
document.addEventListener('DOMContentLoaded', () => {
    renderHome();
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const pageMap = {
                'home': renderHome,
                'cadastro': renderCadastro,
                'estoque': renderEstoque,
                'vendas': renderVendas
            };
            pageMap[btn.dataset.page]?.();
        });
    });
});

// ======================================
// HOME
// ======================================
async function renderHome() {
    const app = document.getElementById('app');
    const result = await callAPI('listarProdutos');
    
    let totalProdutos = 0;
    let valorTotal = 0;
    
    if (result.success && result.data) {
        totalProdutos = result.data.length;
        result.data.forEach(produto => {
            // Ajuste: usando as propriedades corretas
            const preco = parseFloat(produto.preco || produto.Preco || 0);
            const quantidade = parseInt(produto.quantidade || produto.Quantidade || 0);
            valorTotal += preco * quantidade;
        });
    }
    
    app.innerHTML = `
        <section>
            <h2>🏠 Dashboard</h2>
            <p>Total de produtos: <strong>${totalProdutos}</strong></p>
            <p>Valor total em estoque: <strong>R$ ${valorTotal.toFixed(2)}</strong></p>
        </section>
    `;
}

// ======================================
// CADASTRO
// ======================================
function renderCadastro() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>➕ Cadastrar Produto</h2>
            <form id="formCadastro">
                <div class="form-group">
                    <label>Nome do Produto</label>
                    <input type="text" id="nome" required placeholder="Digite o nome do produto">
                </div>
                <div class="form-group">
                    <label>Preço (R$)</label>
                    <input type="number" id="preco" step="0.01" required placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Quantidade</label>
                    <input type="number" id="quantidade" required placeholder="0">
                </div>
                <button class="btn-submit" type="submit">Salvar Produto</button>
            </form>
            <div id="msg"></div>
        </section>
    `;
    document.getElementById('formCadastro').addEventListener('submit', cadastrarProduto);
}

async function cadastrarProduto(e) {
    e.preventDefault();
    const form = e.target;
    const nome = document.getElementById('nome').value.trim();
    const preco = parseFloat(document.getElementById('preco').value);
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const msg = document.getElementById('msg');
    
    // Validação básica
    if (!nome) {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Por favor, informe o nome do produto';
        return;
    }
    
    if (isNaN(preco) || preco <= 0) {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Por favor, informe um preço válido';
        return;
    }
    
    if (isNaN(quantidade) || quantidade < 0) {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Por favor, informe uma quantidade válida';
        return;
    }
    
    const result = await callAPI('cadastrarProduto', { 
        nome, 
        preco, 
        quantidade 
    });
    
    if (result.success) {
        msg.className = 'msg-success';
        msg.innerHTML = '✅ Produto cadastrado com sucesso!';
        form.reset();
        // Atualiza o estoque se estiver visível
        const activePage = document.querySelector('.nav-btn.active');
        if (activePage && activePage.dataset.page === 'estoque') {
            renderEstoque();
        }
    } else {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Erro ao cadastrar: ' + (result.error || 'Tente novamente');
    }
}

// ======================================
// ESTOQUE
// ======================================
async function renderEstoque() {
    const app = document.getElementById('app');
    const result = await callAPI('listarProdutos');
    let html = '';
    
    if (result.success && result.data && result.data.length > 0) {
        result.data.forEach((produto, index) => {
            // Ajuste: usando as propriedades corretas da planilha
            const id = produto.id || produto.ID || index + 1;
            const nome = produto.nome || produto.Nome || produto.produto || 'Sem nome';
            const quantidade = produto.quantidade || produto.Quantidade || 0;
            const preco = parseFloat(produto.preco || produto.Preco || 0);
            
            html += `
                <tr>
                    <td>${id}</td>
                    <td>${nome}</td>
                    <td>${quantidade}</td>
                    <td>R$ ${preco.toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        html = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px;">
                    ${result.success ? '📭 Nenhum produto cadastrado' : '❌ Erro ao carregar produtos'}
                </td>
            </tr>
        `;
    }
    
    app.innerHTML = `
        <section>
            <h2>📦 Estoque</h2>
            <div style="margin-bottom: 15px;">
                <button onclick="renderEstoque()" class="btn-submit" style="padding: 8px 16px; font-size: 14px;">
                    🔄 Atualizar
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th>Preço</th>
                        </tr>
                    </thead>
                    <tbody>${html}</tbody>
                </table>
            </div>
        </section>
    `;
}

// ======================================
// VENDAS
// ======================================
async function renderVendas() {
    const app = document.getElementById('app');
    const result = await callAPI('listarProdutos');
    let options = '<option value="">Selecione um produto...</option>';
    
    if (result.success && result.data && result.data.length > 0) {
        result.data.forEach(produto => {
            const nome = produto.nome || produto.Nome || produto.produto || 'Sem nome';
            const id = produto.id || produto.ID;
            // Mostra também a quantidade disponível
            const quantidade = produto.quantidade || produto.Quantidade || 0;
            options += `<option value="${id}" data-quantidade="${quantidade}">${nome} (${quantidade} disponível)</option>`;
        });
    }
    
    app.innerHTML = `
        <section>
            <h2>💰 Registrar Venda</h2>
            <form id="formVenda">
                <div class="form-group">
                    <label>Produto</label>
                    <select id="produtoId" required>
                        ${options}
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantidade</label>
                    <input type="number" id="quantidadeVenda" required placeholder="0" min="1">
                </div>
                <div class="form-group">
                    <label>Nome do Cliente</label>
                    <input type="text" id="cliente" placeholder="Digite o nome do cliente">
                </div>
                <button class="btn-submit" type="submit">Registrar Venda</button>
            </form>
            <div id="msgVenda"></div>
        </section>
    `;
    document.getElementById('formVenda').addEventListener('submit', registrarVenda);
}

async function registrarVenda(e) {
    e.preventDefault();
    const form = e.target;
    const produtoId = document.getElementById('produtoId').value;
    const quantidade = parseInt(document.getElementById('quantidadeVenda').value);
    const cliente = document.getElementById('cliente').value.trim() || 'Cliente não informado';
    const msg = document.getElementById('msgVenda');
    
    // Validações
    if (!produtoId) {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Por favor, selecione um produto';
        return;
    }
    
    if (isNaN(quantidade) || quantidade <= 0) {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Por favor, informe uma quantidade válida';
        return;
    }
    
    // Verifica se há estoque suficiente
    const select = document.getElementById('produtoId');
    const selectedOption = select.options[select.selectedIndex];
    const disponivel = parseInt(selectedOption.dataset.quantidade || 0);
    
    if (quantidade > disponivel) {
        msg.className = 'msg-error';
        msg.innerHTML = `❌ Quantidade insuficiente! Disponível: ${disponivel}`;
        return;
    }
    
    const result = await callAPI('registrarVenda', { 
        produtoId, 
        quantidade, 
        cliente 
    });
    
    if (result.success) {
        msg.className = 'msg-success';
        msg.innerHTML = `✅ Venda registrada com sucesso! ${cliente} - ${quantidade} unidades`;
        form.reset();
        // Atualiza o estoque se estiver visível
        const activePage = document.querySelector('.nav-btn.active');
        if (activePage && activePage.dataset.page === 'estoque') {
            renderEstoque();
        }
    } else {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Erro ao registrar venda: ' + (result.error || 'Tente novamente');
    }
}