// ======================================
// CONFIGURAÇÃO API
// ======================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzWrSiJmWEuT0MJm2MZczxqbqcHAOvCcUJud-0Ke59Ag3V1TjAsSIvF7zh5b9cBtMNRrw/exec';

// ======================================
// API
// ======================================
async function callAPI(action, data = null) {
    let url = `${API_URL}?action=${action}`;
    
    try {
        const options = {
            method: data ? 'POST' : 'GET',
            headers: data ? { 'Content-Type': 'application/json' } : {},
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
// HOME
// ======================================
async function renderHome() {
    const app = document.getElementById('app');
    
    try {
        const [produtosResult, vendasResult] = await Promise.all([
            callAPI('listarProdutos'),
            callAPI('listarVendas')
        ]);
        
        let totalProdutos = 0;
        let valorTotal = 0;
        let produtosBaixoEstoque = 0;
        
        if (produtosResult.success && produtosResult.produtos) {
            totalProdutos = produtosResult.produtos.length;
            produtosResult.produtos.forEach(produto => {
                const preco = parseFloat(produto.preco) || 0;
                const quantidade = parseInt(produto.quantidade) || 0;
                valorTotal += preco * quantidade;
                if (quantidade <= 5 && quantidade > 0) produtosBaixoEstoque++;
            });
        }
        
        let totalVendasHoje = 0;
        let totalVendasMes = 0;
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        
        if (vendasResult.success && vendasResult.vendas) {
            vendasResult.vendas.forEach(venda => {
                const dataVenda = new Date(venda.data);
                const total = parseFloat(venda.total) || 0;
                
                if (dataVenda.toDateString() === hoje.toDateString()) {
                    totalVendasHoje += total;
                }
                if (dataVenda >= inicioMes) {
                    totalVendasMes += total;
                }
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
                    
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px;">
                        <h3>💵 Vendas Hoje</h3>
                        <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">R$ ${totalVendasHoje.toFixed(2)}</p>
                        <small>${hoje.toLocaleDateString('pt-BR')}</small>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 10px;">
                        <h3>📊 Vendas do Mês</h3>
                        <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">R$ ${totalVendasMes.toFixed(2)}</p>
                        <small>${inicioMes.toLocaleDateString('pt-BR')} até hoje</small>
                    </div>
                </div>
                
                ${produtosBaixoEstoque > 0 ? `
                    <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; color: #856404;">
                        ⚠️ Atenção: ${produtosBaixoEstoque} produto(s) com estoque baixo (≤ 5 unidades)
                    </div>
                ` : ''}
            </section>
        `;
        
    } catch (error) {
        app.innerHTML = `
            <section>
                <h2>🏠 Dashboard</h2>
                <p style="color: #e53e3e;">❌ Erro ao carregar dados: ${error.message}</p>
                <button onclick="renderHome()" class="btn-submit">Tentar novamente</button>
            </section>
        `;
    }
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
    
    try {
        const result = await callAPI('listarProdutos');
        let html = '';
        
        if (result.success && result.produtos && result.produtos.length > 0) {
            result.produtos.forEach(produto => {
                const quantidade = parseInt(produto.quantidade) || 0;
                const preco = parseFloat(produto.preco) || 0;
                const statusEstoque = quantidade === 0 ? '🔴' : quantidade <= 5 ? '🟡' : '🟢';
                const statusTexto = quantidade === 0 ? 'Esgotado' : quantidade <= 5 ? 'Baixo' : 'Normal';
                
                html += `
                    <tr>
                        <td>${produto.id}</td>
                        <td>${produto.nome}</td>
                        <td>${statusEstoque} ${quantidade} <small>(${statusTexto})</small></td>
                        <td>R$ ${preco.toFixed(2)}</td>
                        <td>R$ ${(preco * quantidade).toFixed(2)}</td>
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
                <div style="margin-bottom: 15px; display: flex; gap: 10px; align-items: center;">
                    <button onclick="renderEstoque()" class="btn-submit" style="padding: 8px 16px; font-size: 14px;">
                        🔄 Atualizar Estoque
                    </button>
                    <span style="font-size: 14px; color: #666;">
                        🟢 Normal | 🟡 Baixo (≤5) | 🔴 Esgotado
                    </span>
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
        
    } catch (error) {
        app.innerHTML = `
            <section>
                <h2>📦 Estoque</h2>
                <p style="color: #e53e3e;">❌ Erro ao carregar estoque: ${error.message}</p>
                <button onclick="renderEstoque()" class="btn-submit">Tentar novamente</button>
            </section>
        `;
    }
}

// ======================================
// VENDAS
// ======================================
async function renderVendas() {
    const app = document.getElementById('app');
    
    try {
        const result = await callAPI('listarProdutos');
        
        let options = '<option value="">Selecione um produto...</option>';
        if (result.success && result.produtos && result.produtos.length > 0) {
            result.produtos.forEach(produto => {
                const disponivel = parseInt(produto.quantidade) || 0;
                const preco = parseFloat(produto.preco) || 0;
                options += `
                    <option value="${produto.id}" data-quantidade="${disponivel}" data-preco="${preco}" data-nome="${produto.nome}">
                        ${produto.nome} (${disponivel} disponível) - R$ ${preco.toFixed(2)}
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
                        <small id="infoPreco" style="color: #667eea; display: block; margin-top: 5px; font-weight: bold;"></small>
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
        
        // Event listeners
        document.getElementById('produtoId').addEventListener('change', atualizarPrecoTotal);
        document.getElementById('quantidadeVenda').addEventListener('input', atualizarPrecoTotal);
        document.getElementById('formVenda').addEventListener('submit', registrarVenda);
        
    } catch (error) {
        app.innerHTML = `
            <section>
                <h2>💰 Registrar Venda</h2>
                <p style="color: #e53e3e;">❌ Erro ao carregar produtos: ${error.message}</p>
                <button onclick="renderVendas()" class="btn-submit">Tentar novamente</button>
            </section>
        `;
    }
}

function atualizarPrecoTotal() {
    const select = document.getElementById('produtoId');
    const quantidade = parseInt(document.getElementById('quantidadeVenda').value) || 0;
    const infoPreco = document.getElementById('infoPreco');
    
    if (select && select.selectedIndex > 0 && infoPreco) {
        const option = select.options[select.selectedIndex];
        const preco = parseFloat(option.dataset.preco || 0);
        const disponivel = parseInt(option.dataset.quantidade || 0);
        const total = preco * quantidade;
        
        if (quantidade > 0) {
            infoPreco.textContent = `Total: R$ ${total.toFixed(2)}`;
            infoPreco.style.color = quantidade > disponivel ? '#e53e3e' : '#38a169';
        } else {
            infoPreco.textContent = '';
        }
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
            Produto: ${selectedOption.dataset.nome}<br>
            Quantidade: ${quantidade} unidades<br>
            Total: R$ ${total.toFixed(2)}
        `;
        form.reset();
        document.getElementById('infoPreco').textContent = '';
        
        // Recarrega se necessário
        const activePage = document.querySelector('.nav-btn.active');
        if (activePage && activePage.dataset.page === 'estoque') {
            setTimeout(() => renderEstoque(), 1000);
        }
    } else {
        msg.className = 'msg-error';
        msg.innerHTML = '❌ Erro ao registrar venda: ' + (result.error || 'Tente novamente');
    }
}

// ======================================
// CLIENTES
// ======================================
async function renderClientes() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <section>
            <h2>👥 Clientes</h2>
            <div style="margin-bottom: 15px;">
                <input type="text" id="buscaCliente" placeholder="🔍 Buscar cliente..." 
                       style="padding: 10px; width: 100%; max-width: 400px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
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
    const container = document.getElementById('tabelaClientes');
    if (!container) return;
    
    container.innerHTML = '<p>Carregando clientes...</p>';
    
    try {
        const result = await callAPI('listarVendasPorCliente');
        let html = '';
        
        if (result.success && result.clientes && result.clientes.length > 0) {
            // Filtra clientes (exclui "Cliente não informado" e aplica busca)
            let clientesFiltrados = result.clientes.filter(c => 
                c.nome !== 'Cliente não informado'
            );
            
            if (filtro) {
                clientesFiltrados = clientesFiltrados.filter(c => 
                    c.nome.toLowerCase().includes(filtro.toLowerCase())
                );
            }
            
            if (clientesFiltrados.length > 0) {
                clientesFiltrados.forEach(cliente => {
                    const totalGasto = parseFloat(cliente.totalGasto) || 0;
                    const totalPago = parseFloat(cliente.totalPago) || 0;
                    const saldo = totalGasto - totalPago;
                    const statusSaldo = saldo > 0.01 ? '🔴' : saldo < -0.01 ? '🟡' : '🟢';
                    const statusTexto = saldo > 0.01 ? '(Deve)' : saldo < -0.01 ? '(Crédito)' : '(Quitado)';
                    
                    html += `
                        <tr onclick="mostrarDetalhesCliente('${cliente.nome.replace(/'/g, "\\'")}')" 
                            style="cursor: pointer; transition: background 0.2s;"
                            onmouseover="this.style.background='#f0f0f0'" 
                            onmouseout="this.style.background='white'">
                            <td><strong>${cliente.nome}</strong></td>
                            <td>R$ ${totalGasto.toFixed(2)}</td>
                            <td>R$ ${totalPago.toFixed(2)}</td>
                            <td>${statusSaldo} <strong>R$ ${Math.abs(saldo).toFixed(2)}</strong> ${statusTexto}</td>
                        </tr>
                    `;
                });
            } else {
                html = '<tr><td colspan="4" style="text-align: center; padding: 20px;">🔍 Nenhum cliente encontrado com esse nome</td></tr>';
            }
        } else {
            html = '<tr><td colspan="4" style="text-align: center; padding: 20px;">📭 Nenhum cliente cadastrado</td></tr>';
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
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
                🟢 Quitado | 🔴 Em débito | 🟡 Crédito | Clique no cliente para ver detalhes
            </p>
        `;
        
    } catch (error) {
        container.innerHTML = `<p style="color: #e53e3e;">❌ Erro ao carregar clientes: ${error.message}</p>`;
    }
}

async function mostrarDetalhesCliente(nomeCliente) {
    const container = document.getElementById('detalhesCliente');
    if (!container) return;
    
    container.innerHTML = '<p style="padding: 20px;">Carregando detalhes...</p>';
    
    try {
        // ✅ CORRIGIDO: Chamada GET com parâmetro na URL
        const url = `listarDetalhesCliente&cliente=${encodeURIComponent(nomeCliente)}`;
        console.log('Buscando detalhes:', url);
        const result = await callAPI(url);
        
        console.log('Resultado detalhes:', result);
        
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
                        <h3>📋 Histórico: ${nomeCliente}</h3>
                        <button onclick="document.getElementById('detalhesCliente').innerHTML = ''" 
                                style="background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                            ✕ Fechar
                        </button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                            <p style="color: #666; margin: 0;">Total de Compras</p>
                            <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #667eea;">${result.historico.length}</p>
                        </div>
                        <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                            <p style="color: #666; margin: 0;">Total Gasto</p>
                            <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #667eea;">R$ ${totalGasto.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr style="background: #f7fafc;">
                                    <th>Data</th>
                                    <th>Produto</th>
                                    <th>Qtd</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>
                            <tbody>${historicoHtml}</tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4>💳 Registrar Pagamento</h4>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <input type="number" id="valorPagamento" placeholder="Valor do pagamento" 
                                   min="0.01" step="0.01"
                                   style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                            <button onclick="registrarPagamentoCliente('${nomeCliente.replace(/'/g, "\\'")}')" 
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
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>📋 ${nomeCliente}</h3>
                        <button onclick="document.getElementById('detalhesCliente').innerHTML = ''" 
                                style="background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                            ✕ Fechar
                        </button>
                    </div>
                    <p style="color: #666;">📭 Nenhum histórico de compras encontrado para este cliente.</p>
                    <p style="color: #999; font-size: 0.9em;">Verifique se há vendas registradas com este nome.</p>
                </div>
            `;
        }
        
    } catch (error) {
        container.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <p style="color: #e53e3e;">❌ Erro ao carregar detalhes: ${error.message}</p>
                <button onclick="document.getElementById('detalhesCliente').innerHTML = ''" 
                        style="background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                    ✕ Fechar
                </button>
            </div>
        `;
    }
}

async function registrarPagamentoCliente(nomeCliente) {
    const valorInput = document.getElementById('valorPagamento');
    const msgDiv = document.getElementById('msgPagamento');
    
    if (!valorInput || !msgDiv) {
        console.error('Elementos não encontrados');
        return;
    }
    
    const valor = parseFloat(valorInput.value);
    
    if (isNaN(valor) || valor <= 0) {
        msgDiv.innerHTML = '<p style="color: #e53e3e;">❌ Informe um valor válido maior que zero</p>';
        return;
    }
    
    msgDiv.innerHTML = '<p style="color: #667eea;">Registrando pagamento...</p>';
    
    try {
        const result = await callAPI('registrarPagamento', {
            cliente: nomeCliente,
            valor: valor
        });
        
        if (result.success) {
            msgDiv.innerHTML = `<p style="color: #38a169;">✅ Pagamento de R$ ${valor.toFixed(2)} registrado com sucesso!</p>`;
            valorInput.value = '';
            
            // Atualizar lista e detalhes
            await carregarTabelaClientes();
            setTimeout(() => mostrarDetalhesCliente(nomeCliente), 500);
        } else {
            msgDiv.innerHTML = `<p style="color: #e53e3e;">❌ Erro: ${result.error || 'Tente novamente'}</p>`;
        }
    } catch (error) {
        msgDiv.innerHTML = `<p style="color: #e53e3e;">❌ Erro de conexão: ${error.message}</p>`;
    }
}

// Tornar funções disponíveis globalmente para onclick
window.mostrarDetalhesCliente = mostrarDetalhesCliente;
window.registrarPagamentoCliente = registrarPagamentoCliente;

// ======================================
// INICIALIZAÇÃO
// ======================================
console.log('🚀 Sistema de Vendas inicializado!');
console.log('📱 Versão: 2.0 - Completa');
console.log('✅ Páginas: Home, Cadastro, Estoque, Vendas, Clientes');
