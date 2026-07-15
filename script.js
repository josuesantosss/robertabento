// ======================================
// CONFIGURAÇÃO API
// ======================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzWrSiJmWEuT0MJm2MZczxqbqcHAOvCcUJud-0Ke59Ag3V1TjAsSIvF7zh5b9cBtMNRrw/exec';

async function callAPI(action, data = null) {
    const url = `${API_URL}?action=${action}`;
    const options = {
        method: data ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : null
    };
    try {
        const response = await fetch(url, options);
        return await response.json();
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
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const pages = { 
                'home': renderHome, 
                'cadastro': renderCadastro, 
                'estoque': renderEstoque, 
                'vendas': renderVendas, 
                'clientes': renderClientes 
            };
            pages[e.target.dataset.page]?.();
        });
    });
});

// ======================================
// RENDERIZAÇÃO CLIENTES (UNIFICADA)
// ======================================
async function renderClientes() {
    const app = document.getElementById('app');
    const res = await callAPI('listarVendasPorCliente');
    let html = '';
    
    if (res.success && res.clientes) {
        res.clientes.forEach(c => {
            const saldo = c.totalGasto - c.totalPago;
            html += `
                <tr onclick="window.abrirDetalhes('${c.nome}')" style="cursor:pointer; background: #fdfdfd;">
                    <td>${c.nome}</td>
                    <td>R$ ${c.totalGasto.toFixed(2)}</td>
                    <td>R$ ${c.totalPago.toFixed(2)}</td>
                    <td><strong>R$ ${saldo.toFixed(2)}</strong></td>
                </tr>`;
        });
    }
    app.innerHTML = `
        <section>
            <h2>👥 Clientes (Clique na linha para detalhes)</h2>
            <table>
                <thead><tr><th>Cliente</th><th>Total Gasto</th><th>Pago</th><th>Devido</th></tr></thead>
                <tbody>${html}</tbody>
            </table>
            <div id="detalhesCliente" style="margin-top:20px; padding:10px; border:1px solid #ccc;"></div>
        </section>`;
}

// ======================================
// FUNÇÕES DE AÇÃO (GLOBAL)
// ======================================
window.abrirDetalhes = async function(nome) {
    const res = await callAPI('listarDetalhesCliente', { cliente: nome });
    const container = document.getElementById('detalhesCliente');
    
    if (res.success && res.historico) {
        let hist = res.historico.map(h => `<li>${h.data.split('T')[0]}: ${h.produto} - R$ ${h.total.toFixed(2)}</li>`).join('');
        container.innerHTML = `
            <h3>Histórico: ${nome}</h3>
            <ul>${hist}</ul>
            <input type="number" id="valorPagamento" placeholder="Valor do pagamento">
            <button onclick="window.efetuarPagamento('${nome}')">Registrar Pagamento</button>
        `;
    }
};

window.efetuarPagamento = async function(nome) {
    const valor = parseFloat(document.getElementById('valorPagamento').value);
    if (!valor || valor <= 0) return alert("Insira um valor válido");
    
    const res = await callAPI('registrarPagamento', { cliente: nome, valor: valor });
    if (res.success) {
        alert("Pagamento registrado!");
        renderClientes(); 
    } else {
        alert("Erro ao registrar.");
    }
};

// ======================================
// HOME
// ======================================
async function renderHome() {
    const app = document.getElementById('app');
    const result = await callAPI('listarProdutos');
    let totalProdutos = 0, valorTotal = 0;
    if (result.success && result.produtos) {
        totalProdutos = result.produtos.length;
        result.produtos.forEach(p => valorTotal += (p.preco * p.quantidade));
    }
    app.innerHTML = `<section><h2>🏠 Dashboard</h2><p>Produtos: ${totalProdutos}</p><p>Valor Estoque: R$ ${valorTotal.toFixed(2)}</p></section>`;
}

// ======================================
// CADASTRO
// ======================================
function renderCadastro() {
    const app = document.getElementById('app');
    app.innerHTML = `<section><h2>➕ Cadastrar</h2><form id="formCadastro"><input type="text" id="nome" required placeholder="Nome"><input type="number" id="preco" step="0.01" required placeholder="Preço"><input type="number" id="quantidade" required placeholder="Qtd"><button type="submit">Cadastrar</button></form><div id="msg"></div></section>`;
    document.getElementById('formCadastro').addEventListener('submit', cadastrarProduto);
}

async function cadastrarProduto(e) {
    e.preventDefault();
    const res = await callAPI('cadastrarProduto', { nome: document.getElementById('nome').value, preco: parseFloat(document.getElementById('preco').value), quantidade: parseInt(document.getElementById('quantidade').value) });
    document.getElementById('msg').innerHTML = res.success ? '✅ Cadastrado!' : '❌ Erro.';
}

// ======================================
// ESTOQUE
// ======================================
async function renderEstoque() {
    const res = await callAPI('listarProdutos');
    let html = res.success ? res.produtos.map(p => `<tr><td>${p.id}</td><td>${p.nome}</td><td>${p.quantidade}</td><td>R$ ${p.preco.toFixed(2)}</td></tr>`).join('') : '';
    document.getElementById('app').innerHTML = `<section><h2>📦 Estoque</h2><table><thead><tr><th>ID</th><th>Produto</th><th>Qtd</th><th>Preço</th></tr></thead><tbody>${html}</tbody></table></section>`;
}

// ======================================
// VENDAS
// ======================================
async function renderVendas() {
    const res = await callAPI('listarProdutos');
    let opts = res.success ? res.produtos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('') : '';
    document.getElementById('app').innerHTML = `<section><h2>💰 Venda</h2><form id="formVenda"><select id="produtoId">${opts}</select><input type="number" id="quantidadeVenda" required placeholder="Qtd"><input type="text" id="cliente" placeholder="Cliente"><button type="submit">Registrar Venda</button></form><div id="msgVenda"></div></section>`;
    document.getElementById('formVenda').addEventListener('submit', registrarVenda);
}

async function registrarVenda(e) {
    e.preventDefault();
    const res = await callAPI('registrarVenda', { produtoId: document.getElementById('produtoId').value, quantidade: parseInt(document.getElementById('quantidadeVenda').value), cliente: document.getElementById('cliente').value.trim() });
    document.getElementById('msgVenda').innerHTML = res.success ? '✅ Venda ok!' : '❌ Erro.';
}
