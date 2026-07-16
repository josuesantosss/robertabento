// ======================================
// CONFIGURAÇÃO API
// ======================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzWrSiJmWEuT0MJm2MZczxqbqcHAOvCcUJud-0Ke59Ag3V1TjAsSIvF7zh5b9cBtMNRrw/exec';

// ======================================
// API - CORRIGIDA
// ======================================
async function callAPI(action, data = null) {
    let url = `${API_URL}?action=${action}`;
    
    try {
        const options = {
            method: data ? 'POST' : 'GET'
        };
        
        if (data) {
            options.headers = {
                'Content-Type': 'application/json'
            };
            options.body = JSON.stringify(data);
        }
        
        console.log(`📡 ${options.method} ${url}`);
        if (data) console.log('📦 Dados:', data);
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        console.log('✅ Resposta:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Erro:', error);
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
            const button = e.target.closest('.nav-btn');
            if (!button) return;
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            const pageMap = {
                'home': renderHome,
                'cadastro': renderCadastro,
                'estoque': renderEstoque,
                'vendas': renderVendas,
                'clientes': renderClientes
            };
            
            if (pageMap[button.dataset.page]) {
                pageMap[button.dataset.page]();
            }
        });
    });
});

// ======================================
// HOME - Dashboard
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
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px;">
                    <h3>📦 Produtos</h3>
                    <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${totalProdutos}</p>
                    <small>Total cadastrado</small>
                </div>
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px;">
                    <h3>💰 Valor em Estoque</h3>
                    <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">R$ ${valorTotal.toFixed(2)}</p>
                    <small>Valor total</small>
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
    const nome = document.getElementById('nome').value.trim();
    const preco = parseFloat(document.getElementById('preco').value);
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const msg = document.getElementById('msg');
    
    if (!nome) {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Informe o nome do produto';
        return;
    }
    if (isNaN(preco) || preco <= 0) {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Informe um preço válido';
        return;
    }
    if (isNaN(quantidade) || quantidade < 0) {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Informe uma quantidade válida';
        return;
    }
    
    const result = await callAPI('cadastrarProduto', { nome, preco, quantidade });
    
    if (result.success) {
        msg.className = 'msg-success';
        msg.innerHTML = '✅ Produto cadastrado com sucesso!';
        document.getElementById('formCadastro').reset();
    } else {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ ' + (result.error || 'Erro ao cadastrar');
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
            const quantidade = parseInt(produto.quantidade) || 0;
            const preco = parseFloat(produto.preco) || 0;
            const status = quantidade === 0 ? '🔴' : quantidade <= 5 ? '🟡' : '🟢';
            
            html += `
                <tr>
                    <td>${produto.id}</td>
                    <td>${produto.nome}</td>
                    <td>${status} ${quantidade}</td>
                    <td>R$ ${preco.toFixed(2)}</td>
                    <td>R$ ${(preco * quantidade).toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        html = '<tr><td colspan="5" style="text-align:center;">📭 Nenhum produto cadastrado</td></tr>';
    }
    
    app.innerHTML = `
        <section>
            <h2>📦 Estoque</h2>
            <button onclick="renderEstoque()" class="btn-submit" style="margin-bottom:15px;">🔄 Atualizar</button>
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>ID</th><th>Produto</th><th>Qtd</th><th>Preço</th><th>Total</th></tr>
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
    if (result.success && result.produtos) {
        result.produtos.forEach(p => {
            options += `<option value="${p.id}" data-preco="${p.preco || 0}" data-estoque="${p.quantidade || 0}">${p.nome} (${p.quantidade} un. - R$ ${(p.preco || 0).toFixed(2)})</option>`;
        });
    }
    
    app.innerHTML = `
        <section>
            <h2>💰 Registrar Venda</h2>
            <form id="formVenda">
                <div class="form-group">
                    <label>Produto</label>
                    <select id="produtoId" required>${options}</select>
                </div>
                <div class="form-group">
                    <label>Quantidade</label>
                    <input type="number" id="quantidadeVenda" required placeholder="0" min="1">
                </div>
                <div class="form-group">
                    <label>Cliente</label>
                    <input type="text" id="cliente" placeholder="Nome do cliente">
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
    const quantidade = parseInt(document.getElementById('quantidadeVenda').value);
    const cliente = document.getElementById('cliente').value.trim() || 'Cliente não informado';
    const msg = document.getElementById('msgVenda');
    
    if (!produtoId) {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Selecione um produto';
        return;
    }
    if (isNaN(quantidade) || quantidade <= 0) {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Quantidade inválida';
        return;
    }
    
    const select = document.getElementById('produtoId');
    const option = select.options[select.selectedIndex];
    const estoque = parseInt(option.dataset.estoque || 0);
    
    if (quantidade > estoque) {
        msg.className = 'msg-error';
        msg.innerHTML = `❌ Estoque insuficiente! Disponível: ${estoque}`;
        return;
    }
    
    const result = await callAPI('registrarVenda', { produtoId, quantidade, cliente });
    
    if (result.success) {
        msg.className = 'msg-success';
        msg.innerHTML = '✅ Venda registrada com sucesso!';
        document.getElementById('formVenda').reset();
    } else {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ ' + (result.error || 'Erro ao registrar');
    }
}

// ======================================
// CLIENTES - CORRIGIDO
// ======================================
async function renderClientes() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <section>
            <h2>👥 Clientes</h2>
            <input type="text" id="buscaCliente" placeholder="🔍 Buscar cliente..." 
                   style="padding: 10px; width: 100%; max-width: 400px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 15px;">
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
    const container = document.getElementById('tabelaClientes');
    if (!container) return;
    
    container.innerHTML = '<p>Carregando...</p>';
    
    try {
        const result = await callAPI('listarVendasPorCliente');
        let html = '';
        
        if (result.success && result.clientes && result.clientes.length > 0) {
            let clientes = result.clientes.filter(c => c.nome !== 'Cliente não informado');
            
            if (filtro) {
                clientes = clientes.filter(c => 
                    c.nome.toLowerCase().includes(filtro.toLowerCase())
                );
            }
            
            if (clientes.length > 0) {
                clientes.forEach(cliente => {
                    const totalGasto = parseFloat(cliente.totalGasto) || 0;
                    const totalPago = parseFloat(cliente.totalPago) || 0;
                    const saldo = totalGasto - totalPago;
                    const status = saldo > 0.01 ? '🔴' : saldo < -0.01 ? '🟡' : '🟢';
                    const texto = saldo > 0.01 ? '(Deve)' : saldo < -0.01 ? '(Crédito)' : '(Quitado)';
                    
                    html += `
                        <tr onclick="mostrarDetalhesCliente('${cliente.nome.replace(/'/g, "\\'")}')" 
                            style="cursor: pointer;" 
                            onmouseover="this.style.background='#f0f0f0'" 
                            onmouseout="this.style.background='white'">
                            <td><strong>${cliente.nome}</strong></td>
                            <td>R$ ${totalGasto.toFixed(2)}</td>
                            <td>R$ ${totalPago.toFixed(2)}</td>
                            <td>${status} <strong>R$ ${Math.abs(saldo).toFixed(2)}</strong> ${texto}</td>
                        </tr>
                    `;
                });
            } else {
                html = '<tr><td colspan="4" style="text-align:center;">Nenhum cliente encontrado</td></tr>';
            }
        } else {
            html = '<tr><td colspan="4" style="text-align:center;">📭 Nenhum cliente cadastrado</td></tr>';
        }
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr><th>Cliente</th><th>Total Gasto</th><th>Total Pago</th><th>Saldo</th></tr>
                </thead>
                <tbody>${html}</tbody>
            </table>
        `;
        
    } catch (error) {
        container.innerHTML = `<p style="color:#e53e3e;">❌ Erro: ${error.message}</p>`;
    }
}

// ✅ FUNÇÃO CORRIGIDA - mostrarDetalhesCliente
async function mostrarDetalhesCliente(nomeCliente) {
    const container = document.getElementById('detalhesCliente');
    if (!container) return;
    
    container.innerHTML = '<p>Carregando detalhes...</p>';
    
    try {
        // ✅ CORREÇÃO: Buscar detalhes via GET com parâmetro na URL
        const result = await callAPI(`listarDetalhesCliente&cliente=${encodeURIComponent(nomeCliente)}`);
        
        console.log('Detalhes do cliente:', result);
        
        if (result.success && result.historico && result.historico.length > 0) {
            let historicoHtml = result.historico.map(h => {
                const data = h.data ? new Date(h.data) : new Date();
                const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + 
                                     data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                return `
                    <tr>
                        <td>${dataFormatada}</td>
                        <td>${h.produto || '-'}</td>
                        <td>${h.quantidade || 1}</td>
                        <td>R$ ${(parseFloat(h.total) || 0).toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
            
            const totalGasto = result.historico.reduce((acc, h) => acc + (parseFloat(h.total) || 0), 0);
            
            container.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>📋 ${nomeCliente}</h3>
                        <button onclick="document.getElementById('detalhesCliente').innerHTML = ''" 
                                style="background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                            ✕ Fechar
                        </button>
                    </div>
                    
                    <p><strong>Total de compras:</strong> ${result.historico.length}</p>
                    <p><strong>Total gasto:</strong> R$ ${totalGasto.toFixed(2)}</p>
                    
                    <div style="overflow-x: auto; margin: 15px 0;">
                        <table>
                            <thead>
                                <tr><th>Data</th><th>Produto</th><th>Qtd</th><th>Valor</th></tr>
                            </thead>
                            <tbody>${historicoHtml}</tbody>
                        </table>
                    </div>
                    
                    <div style="padding: 15px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4>💳 Registrar Pagamento</h4>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <input type="number" id="valorPagamento" placeholder="Valor do pagamento" 
                                   min="0.01" step="0.01"
                                   style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <button onclick="window.registrarPagamentoCliente('${nomeCliente.replace(/'/g, "\\'")}')" 
                                    style="background: #48bb78; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; white-space: nowrap;">
                                💵 Registrar
                            </button>
                        </div>
                        <div id="msgPagamento" style="margin-top: 10px;"></div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>📋 ${nomeCliente}</h3>
                        <button onclick="document.getElementById('detalhesCliente').innerHTML = ''" 
                                style="background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                            ✕ Fechar
                        </button>
                    </div>
                    <p style="color: #666; margin-top: 15px;">📭 Nenhum histórico de compras encontrado.</p>
                </div>
            `;
        }
        
    } catch (error) {
        container.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px;">
                <p style="color: #e53e3e;">❌ Erro ao carregar detalhes: ${error.message}</p>
            </div>
        `;
    }
}

// ✅ FUNÇÃO CORRIGIDA - registrarPagamentoCliente
async function registrarPagamentoCliente(nomeCliente) {
    const valorInput = document.getElementById('valorPagamento');
    const msgDiv = document.getElementById('msgPagamento');
    
    console.log('📝 Iniciando pagamento para:', nomeCliente);
    
    if (!valorInput || !msgDiv) {
        console.error('❌ Elementos não encontrados');
        return;
    }
    
    const valor = parseFloat(valorInput.value);
    console.log('Valor digitado:', valor);
    
    if (isNaN(valor) || valor <= 0) {
        msgDiv.innerHTML = '<p style="color: #e53e3e;">❌ Informe um valor válido maior que zero</p>';
        return;
    }
    
    msgDiv.innerHTML = '<p style="color: #667eea;">⏳ Registrando pagamento...</p>';
    
    try {
        // ✅ CORREÇÃO: Enviar dados como objeto JSON via POST
        const dados = {
            cliente: nomeCliente,
            valor: valor
        };
        
        console.log('📤 Enviando:', dados);
        
        const result = await callAPI('registrarPagamento', dados);
        
        console.log('📥 Resultado:', result);
        
        if (result.success) {
            msgDiv.innerHTML = `<p style="color: #38a169;">✅ Pagamento de R$ ${valor.toFixed(2)} registrado com sucesso!</p>`;
            valorInput.value = '';
            
            // Atualizar a tabela e os detalhes
            await carregarTabelaClientes();
            setTimeout(() => mostrarDetalhesCliente(nomeCliente), 500);
        } else {
            msgDiv.innerHTML = `<p style="color: #e53e3e;">❌ Erro: ${result.error || 'Tente novamente'}</p>`;
        }
    } catch (error) {
        console.error('❌ Erro:', error);
        msgDiv.innerHTML = `<p style="color: #e53e3e;">❌ Erro de conexão: ${error.message}</p>`;
    }
}

// ✅ EXPOR FUNÇÕES GLOBALMENTE
window.mostrarDetalhesCliente = mostrarDetalhesCliente;
window.registrarPagamentoCliente = registrarPagamentoCliente;

console.log('🚀 Sistema de Vendas pronto!');
