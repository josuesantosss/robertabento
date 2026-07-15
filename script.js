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
        console.log(`Resposta da API (${action}):`, result);
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
                'vendas': renderVendas,
                'clientes': renderClientes
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
    
    if (result.success && result.produtos) {
        totalProdutos = result.produtos.length;
        result.produtos.forEach(produto => {
            valorTotal += (produto.preco || 0) * (produto.quantidade || 0);
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
                <button class="btn-submit" type="submit">Cadastrar Produto</button>
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
    
    if (!nome || isNaN(preco) || isNaN(quantidade)) {
        msg.innerHTML = '❌ Preencha todos os campos corretamente.';
        return;
    }
    
    const result = await callAPI('cadastrarProduto', { nome, preco, quantidade });
    
    if (result.success) {
        msg.innerHTML = '✅ Produto cadastrado!';
        form.reset();
    } else {
        msg.innerHTML = '❌ Erro ao cadastrar.';
    }
}

// ======================================
// ESTOQUE
// ======================================
async function renderEstoque() {
    const app = document.getElementById('app');
    const result = await callAPI('listarProdutos');
    let html = '';
    
    if (result.success && result.produtos) {
        result.produtos.forEach(p => {
            html += `<tr><td>${p.id}</td><td>${p.nome}</td><td>${p.quantidade}</td><td>R$ ${p.preco.toFixed(2)}</td></tr>`;
        });
    }
    
    app.innerHTML = `
        <section>
            <h2>📦 Estoque</h2>
            <table>
                <thead><tr><th>ID</th><th>Produto</th><th>Qtd</th><th>Preço</th></tr></thead>
                <tbody>${html}</tbody>
            </table>
        </section>
    `;
}

// ======================================
// VENDAS
// ======================================
async function renderVendas() {
    const app = document.getElementById('app');
    const result = await callAPI('listarProdutos');
    let options = '<option value="">Selecione...</option>';
    
    if (result.success && result.produtos) {
        result.produtos.forEach(p => {
            options += `<option value="${p.id}" data-quantidade="${p.quantidade}">${p.nome}</option>`;
        });
    }
    
    app.innerHTML = `
        <section>
            <h2>💰 Registrar Venda</h2>
            <form id="formVenda">
                <select id="produtoId" required>${options}</select>
                <input type="number" id="quantidadeVenda" required placeholder="Qtd">
                <input type="text" id="cliente" placeholder="Nome do Cliente">
                <button type="submit">Registrar Venda</button>
            </form>
            <div id="msgVenda"></div>
        </section>
    `;
    document.getElementById('formVenda').addEventListener('submit', registrarVenda);
}

async function registrarVenda(e) {
    e.preventDefault();
    const data = {
        produtoId: document.getElementById('produtoId').value,
        quantidade: parseInt(document.getElementById('quantidadeVenda').value),
        cliente: document.getElementById('cliente').value.trim()
    };
    
    const result = await callAPI('registrarVenda', data);
    const msg = document.getElementById('msgVenda');
    msg.innerHTML = result.success ? '✅ Venda registrada!' : '❌ Erro ao vender.';
}

// ======================================
// RELATÓRIO DE CLIENTES
// ======================================
async function renderClientes() {
    const app = document.getElementById('app');
    const result = await callAPI('listarVendasPorCliente');
    
    let html = '';
    if (result.success && result.clientes) {
        result.clientes.forEach(c => {
            const aPagar = c.totalGasto - c.totalPago;
            html += `
                <tr>
                    <td>${c.nome}</td>
                    <td>R$ ${c.totalGasto.toFixed(2)}</td>
                    <td>R$ ${c.totalPago.toFixed(2)}</td>
                    <td>R$ ${aPagar.toFixed(2)}</td>
                </tr>
            `;
        });
    }

    app.innerHTML = `
        <section>
            <h2>👥 Relatório de Clientes</h2>
            <table>
                <thead>
                    <tr><th>Cliente</th><th>Total Gasto</th><th>Pago</th><th>A Pagar</th></tr>
                </thead>
                <tbody>${html}</tbody>
            </table>
        </section>
    `;
}
