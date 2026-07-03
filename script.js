const API_URL = 'https://script.google.com/macros/s/AKfycbzWrSiJmWEuT0MJm2MZczxqbqcHAOvCcUJud-0Ke59Ag3V1TjAsSIvF7zh5b9cBtMNRrw/exec';

// ======================================
// API
// ======================================
async function callAPI(action, data = null) {
    const url = `${API_URL}?action=${action}`;
    
    try {
        const options = {
            method: data ? 'POST' : 'GET',
            headers: data ? { 'Content-Type': 'application/json' } : {}
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ======================================
// UTILITÁRIOS
// ======================================
const pageRenderers = {
    home: renderHome,
    cadastro: renderCadastro,
    estoque: renderEstoque,
    vendas: renderVendas
};

function showMessage(element, success, message) {
    element.className = success ? 'msg-success' : 'msg-error';
    element.innerHTML = success ? `✅ ${message}` : `❌ ${message}`;
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
            
            const page = btn.dataset.page;
            if (pageRenderers[page]) {
                pageRenderers[page]();
            }
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
    
    if (result.success && result.produtos) {
        totalProdutos = result.produtos.length;
        result.produtos.forEach(produto => {
            valorTotal += Number(produto.preco || 0) * Number(produto.quantidade || 0);
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
                    <label>Nome</label>
                    <input type="text" id="nome" required>
                </div>
                <div class="form-group">
                    <label>Preço</label>
                    <input type="number" id="preco" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Quantidade</label>
                    <input type="number" id="quantidade" required>
                </div>
                <button class="btn-submit" type="submit">Salvar</button>
            </form>
            <div id="msg"></div>
        </section>
    `;
    
    document.getElementById('formCadastro').addEventListener('submit', cadastrarProduto);
}

async function cadastrarProduto(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const preco = Number(document.getElementById('preco').value);
    const quantidade = Number(document.getElementById('quantidade').value);
    
    const result = await callAPI('cadastrarProduto', { nome, preco, quantidade });
    const msg = document.getElementById('msg');
    
    if (result.success) {
        showMessage(msg, true, 'Produto cadastrado');
        e.target.reset();
    } else {
        showMessage(msg, false, result.error);
    }
}

// ======================================
// ESTOQUE
// ======================================
async function renderEstoque() {
    const app = document.getElementById('app');
    const result = await callAPI('listarProdutos');
    
    let html = '';
    if (result.success && result.produtos && result.produtos.length > 0) {
        result.produtos.forEach(produto => {
            html += `
                <tr>
                    <td>${produto.id}</td>
                    <td>${produto.nome}</td>
                    <td>${produto.quantidade}</td>
                    <td>R$ ${Number(produto.preco).toFixed(2)}</td>
                </tr>
            `;
        });
    }
    
    app.innerHTML = `
        <section>
            <h2>📦 Estoque</h2>
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
    
    let options = '';
    if (result.success && result.produtos) {
        result.produtos.forEach(produto => {
            options += `<option value="${produto.id}">${produto.nome}</option>`;
        });
    }
    
    app.innerHTML = `
        <section>
            <h2>💰 Registrar Venda</h2>
            <form id="formVenda">
                <div class="form-group">
                    <label>Produto</label>
                    <select id="produtoId">${options}</select>
                </div>
                <div class="form-group">
                    <label>Quantidade</label>
                    <input type="number" id="quantidadeVenda" required>
                </div>
                <div class="form-group">
                    <label>Cliente</label>
                    <input type="text" id="cliente">
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
    
    const produtoId = document.getElementById('produtoId').value;
    const quantidade = Number(document.getElementById('quantidadeVenda').value);
    const cliente = document.getElementById('cliente').value;
    
    const result = await callAPI('registrarVenda', { produtoId, quantidade, cliente });
    const msg = document.getElementById('msgVenda');
    
    if (result.success) {
        showMessage(msg, true, 'Venda registrada');
        e.target.reset();
    } else {
        showMessage(msg, false, result.error);
    }
}