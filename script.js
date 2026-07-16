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
                'clientes': renderClientes  // ✅ Adicionada página de clientes
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
    
    // Buscar também dados de vendas para o dashboard
    const vendasResult = await callAPI('listarVendas');
    let totalVendasHoje = 0;
    
    if (vendasResult.success && vendasResult.vendas) {
        const hoje = new Date().toDateString();
        vendasResult.vendas.forEach(venda => {
            const dataVenda = new Date(venda.data).toDateString();
            if (dataVenda === hoje) {
                totalVendasHoje += (venda.total || 0);
            }
        });
    }
    
    app.innerHTML = `
        <section>
            <h2>🏠 Dashboard</h2>
            <div class="dashboard-cards">
                <div class="card">
                    <h3>📦 Produtos</h3>
                    <p class="card-value">${totalProdutos}</p>
                </div>
                <div class="card">
                    <h3>💰 Valor em Estoque</h3>
                    <p class="card-value">R$ ${valorTotal.toFixed(2)}</p>
                </div>
                <div class="card">
                    <h3>💵 Vendas Hoje</h3>
                    <p class="card-value">R$ ${totalVendasHoje.toFixed(2)}</p>
                </div>
            </div>
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
    
    // Validações
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
    
    // Envia para a API
    const result = await callAPI('cadastrarProduto', {
        nome,
        preco,
        quantidade
    });
    
    if (result.success) {
        msg.className = 'msg-success';
        msg.innerHTML = '✅ Produto cadastrado com sucesso!';
        form.reset();
        // Recarrega a lista se estiver na página de estoque
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
    
    if (result.success && result.produtos && result.produtos.length > 0) {
        result.produtos.forEach(produto => {
            const statusEstoque = produto.quantidade === 0 ? '🔴' : 
                                 produto.quantidade <= 5 ? '🟡' : '🟢';
            html += `
                <tr>
                    <td>${produto.id}</td>
                    <td>${produto.nome}</td>
                    <td>${statusEstoque} ${produto.quantidade}</td>
                    <td>R$ ${(produto.preco || 0).toFixed(2)}</td>
                    <td>R$ ${((produto.preco || 0) * (produto.quantidade || 0)).toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        html = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
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
                    🔄 Atualizar Estoque
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
                            <th>Valor Total</th>
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
    if (result.success && result.produtos && result.produtos.length > 0) {
        result.produtos.forEach(produto => {
            const disponivel = produto.quantidade || 0;
            options += `
                <option value="${produto.id}" data-quantidade="${disponivel}" data-preco="${produto.preco || 0}">
                    ${produto.nome} (${disponivel} disponível) - R$ ${(produto.preco || 0).toFixed(2)}
                </option>
            `;
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
                    <small id="infoPreco" style="color: #666; display: block; margin-top: 5px;"></small>
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
    
    // Atualizar preço total quando mudar produto ou quantidade
    document.getElementById('produtoId').addEventListener('change', atualizarPrecoTotal);
    document.getElementById('quantidadeVenda').addEventListener('input', atualizarPrecoTotal);
    document.getElementById('formVenda').addEventListener('submit', registrarVenda);
}

function atualizarPrecoTotal() {
    const select = document.getElementById('produtoId');
    const quantidade = parseInt(document.getElementById('quantidadeVenda').value) || 0;
    const infoPreco = document.getElementById('infoPreco');
    
    if (select.selectedIndex > 0) {
        const option = select.options[select.selectedIndex];
        const preco = parseFloat(option.dataset.preco || 0);
        const total = preco * quantidade;
        infoPreco.textContent = quantidade > 0 ? `Total: R$ ${total.toFixed(2)}` : '';
    } else {
        infoPreco.textContent = '';
    }
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
    
    // Verifica estoque disponível
    const select = document.getElementById('produtoId');
    const selectedOption = select.options[select.selectedIndex];
    const disponivel = parseInt(selectedOption.dataset.quantidade || 0);
    
    if (quantidade > disponivel) {
        msg.className = 'msg-error';
        msg.innerHTML = `❌ Quantidade insuficiente! Disponível: ${disponivel}`;
        return;
    }
    
    // Registra a venda
    const result = await callAPI('registrarVenda', {
        produtoId,
        quantidade,
        cliente
    });
    
    if (result.success) {
        const preco = parseFloat(selectedOption.dataset.preco || 0);
        const total = preco * quantidade;
        
        msg.className = 'msg-success';
        msg.innerHTML = `
            ✅ Venda registrada com sucesso!<br>
            Cliente: ${cliente}<br>
            Quantidade: ${quantidade} unidades<br>
            Total: R$ ${total.toFixed(2)}
        `;
        form.reset();
        document.getElementById('infoPreco').textContent = '';
        
        // Recarrega o estoque se estiver visível
        const activePage = document.querySelector('.nav-btn.active');
        if (activePage && activePage.dataset.page === 'estoque') {
            renderEstoque();
        }
    } else {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Erro ao registrar venda: ' + (result.error || 'Tente novamente');
    }
}

// ======================================
// CLIENTES (NOVA FUNCIONALIDADE)
// ======================================
async function renderClientes() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>👥 Clientes</h2>
            <div style="margin-bottom: 15px;">
                <input type="text" id="buscaCliente" placeholder="🔍 Buscar cliente..." 
                       style="padding: 8px; width: 100%; max-width: 400px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div id="tabelaClientes">Carregando...</div>
            <div id="detalhesCliente" style="margin-top: 20px;"></div>
        </section>
    `;
    
    document.getElementById('buscaCliente').addEventListener('input', (e) => {
        carregarTabelaClientes(e.target.value);
    });
    
    await carregarTabelaClientes();
}

async function carregarTabelaClientes(filtro = '') {
    const result = await callAPI('listarVendasPorCliente');
    const container = document.getElementById('tabelaClientes');
    
    if (!container) return;
    
    let html = '';
    
    if (result.success && result.clientes && result.clientes.length > 0) {
        const clientesFiltrados = filtro 
            ? result.clientes.filter(c => 
                c.nome.toLowerCase().includes(filtro.toLowerCase()) &&
                c.nome !== 'Cliente não informado'
              )
            : result.clientes.filter(c => c.nome !== 'Cliente não informado');
        
        if (clientesFiltrados.length > 0) {
            clientesFiltrados.forEach(cliente => {
                const saldo = (cliente.totalGasto || 0) - (cliente.totalPago || 0);
                const statusSaldo = saldo > 0 ? '🔴' : saldo === 0 ? '🟢' : '🟡';
                
                html += `
                    <tr onclick="mostrarDetalhesCliente('${cliente.nome}')" style="cursor: pointer;">
                        <td><strong>${cliente.nome}</strong></td>
                        <td>R$ ${(cliente.totalGasto || 0).toFixed(2)}</td>
                        <td>R$ ${(cliente.totalPago || 0).toFixed(2)}</td>
                        <td>${statusSaldo} <strong>R$ ${Math.abs(saldo).toFixed(2)}</strong> ${saldo > 0 ? '(Deve)' : saldo < 0 ? '(Crédito)' : '(Quitado)'}</td>
                    </tr>
                `;
            });
        } else {
            html = '<tr><td colspan="4" style="text-align: center;">Nenhum cliente encontrado</td></tr>';
        }
    } else {
        html = '<tr><td colspan="4" style="text-align: center;">📭 Nenhum cliente cadastrado</td></tr>';
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Total Gasto</th>
                    <th>Total Pago</th>
                    <th>Saldo</th>
                </tr>
            </thead>
            <tbody>${html}</tbody>
        </table>
    `;
}

async function mostrarDetalhesCliente(nomeCliente) {
    const container = document.getElementById('detalhesCliente');
    container.innerHTML = '<p>Carregando detalhes...</p>';
    
    const result = await callAPI('listarDetalhesCliente', { cliente: nomeCliente });
    
    if (result.success && result.historico && result.historico.length > 0) {
        let historicoHtml = result.historico.map(h => {
            const data = new Date(h.data);
            const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + 
                                 data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            return `
                <tr>
                    <td>${dataFormatada}</td>
                    <td>${h.produto}</td>
                    <td>${h.quantidade || 1}</td>
                    <td>R$ ${(h.total || 0).toFixed(2)}</td>
                </tr>
            `;
        }).join('');
        
        const totalGasto = result.historico.reduce((acc, h) => acc + (h.total || 0), 0);
        
        container.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3>📋 Histórico: ${nomeCliente}</h3>
                    <button onclick="document.getElementById('detalhesCliente').innerHTML = ''" 
                            style="background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                        ✕ Fechar
                    </button>
                </div>
                
                <p><strong>Total de compras:</strong> ${result.historico.length}</p>
                <p><strong>Total gasto:</strong> R$ ${totalGasto.toFixed(2)}</p>
                
                <div style="margin: 15px 0;">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Produto</th>
                                <th>Qtd</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>${historicoHtml}</tbody>
                    </table>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 8px;">
                    <h4>💳 Registrar Pagamento</h4>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <input type="number" id="valorPagamento" placeholder="Valor do pagamento" 
                               min="0.01" step="0.01"
                               style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <button onclick="registrarPagamento('${nomeCliente}')" 
                                style="background: #48bb78; color: white; border: none; padding: 8px 20px; border-radius: 5px; cursor: pointer;">
                            Registrar
                        </button>
                    </div>
                    <div id="msgPagamento" style="margin-top: 10px;"></div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px;">
                <h3>📋 ${nomeCliente}</h3>
                <p>Nenhum histórico de compras encontrado.</p>
                <button onclick="document.getElementById('detalhesCliente').innerHTML = ''" 
                        style="background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                    ✕ Fechar
                </button>
            </div>
        `;
    }
}

async function registrarPagamento(nomeCliente) {
    const valorInput = document.getElementById('valorPagamento');
    const msgDiv = document.getElementById('msgPagamento');
    
    if (!valorInput || !msgDiv) return;
    
    const valor = parseFloat(valorInput.value);
    
    if (isNaN(valor) || valor <= 0) {
        msgDiv.innerHTML = '<p style="color: #e53e3e;">❌ Informe um valor válido</p>';
        return;
    }
    
    const result = await callAPI('registrarPagamento', {
        cliente: nomeCliente,
        valor: valor
    });
    
    if (result.success) {
        msgDiv.innerHTML = `<p style="color: #38a169;">✅ Pagamento de R$ ${valor.toFixed(2)} registrado!</p>`;
        valorInput.value = '';
        // Atualizar lista e detalhes
        await carregarTabelaClientes();
        setTimeout(() => mostrarDetalhesCliente(nomeCliente), 500);
    } else {
        msgDiv.innerHTML = `<p style="color: #e53e3e;">❌ Erro: ${result.error || 'Tente novamente'}</p>`;
    }
}

// Tornar funções disponíveis globalmente
window.mostrarDetalhesCliente = mostrarDetalhesCliente;
window.registrarPagamento = registrarPagamento;
