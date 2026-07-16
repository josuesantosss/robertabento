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
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Erro na API:', error);
        showNotification('Erro de conexão com o servidor', 'error');
        return { success: false, error: error.message };
    }
}

// ======================================
// FUNÇÕES UTILITÁRIAS
// ======================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading(elementId, message = 'Carregando...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="loading-spinner">${message}</div>`;
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
            
            const pages = { 
                'home': renderHome, 
                'cadastro': renderCadastro, 
                'estoque': renderEstoque, 
                'vendas': renderVendas, 
                'clientes': renderClientes 
            };
            
            if (pages[button.dataset.page]) {
                pages[button.dataset.page]();
            }
        });
    });
});

// ======================================
// HOME - DASHBOARD
// ======================================
async function renderHome() {
    const app = document.getElementById('app');
    showLoading('app', 'Carregando dashboard...');
    
    try {
        const [produtosRes, vendasRes] = await Promise.all([
            callAPI('listarProdutos'),
            callAPI('listarVendas')
        ]);
        
        let totalProdutos = 0;
        let valorEstoque = 0;
        let produtosBaixoEstoque = 0;
        
        if (produtosRes.success && produtosRes.produtos) {
            totalProdutos = produtosRes.produtos.length;
            produtosRes.produtos.forEach(p => {
                valorEstoque += (p.preco * p.quantidade);
                if (p.quantidade <= 5) produtosBaixoEstoque++;
            });
        }
        
        let totalVendasHoje = 0;
        let totalVendasMes = 0;
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        
        if (vendasRes.success && vendasRes.vendas) {
            vendasRes.vendas.forEach(v => {
                const dataVenda = new Date(v.data);
                if (dataVenda.toDateString() === hoje.toDateString()) {
                    totalVendasHoje += v.total;
                }
                if (dataVenda >= inicioMes) {
                    totalVendasMes += v.total;
                }
            });
        }
        
        app.innerHTML = `
            <section class="dashboard">
                <h2>🏠 Dashboard</h2>
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-icon">📦</div>
                        <div class="card-content">
                            <h3>Total de Produtos</h3>
                            <p class="card-value">${totalProdutos}</p>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-icon">💰</div>
                        <div class="card-content">
                            <h3>Valor em Estoque</h3>
                            <p class="card-value">R$ ${valorEstoque.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-icon">⚠️</div>
                        <div class="card-content">
                            <h3>Estoque Baixo</h3>
                            <p class="card-value">${produtosBaixoEstoque} itens</p>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-icon">💵</div>
                        <div class="card-content">
                            <h3>Vendas Hoje</h3>
                            <p class="card-value">R$ ${totalVendasHoje.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-icon">📊</div>
                        <div class="card-content">
                            <h3>Vendas do Mês</h3>
                            <p class="card-value">R$ ${totalVendasMes.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                ${produtosBaixoEstoque > 0 ? `
                    <div class="alert alert-warning">
                        ⚠️ Atenção: ${produtosBaixoEstoque} produto(s) com estoque baixo (≤ 5 unidades)
                    </div>
                ` : ''}
            </section>
        `;
        
    } catch (error) {
        app.innerHTML = `
            <section class="error-section">
                <h2>❌ Erro ao carregar dashboard</h2>
                <p>${error.message}</p>
                <button onclick="renderHome()" class="retry-btn">Tentar novamente</button>
            </section>
        `;
    }
}

// ======================================
// CADASTRO DE PRODUTOS
// ======================================
function renderCadastro() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>➕ Cadastrar Novo Produto</h2>
            <form id="formCadastro" class="product-form">
                <div class="form-group">
                    <label for="nome">Nome do Produto *</label>
                    <input type="text" id="nome" required placeholder="Ex: Batom Matte Vermelho" minlength="2">
                </div>
                
                <div class="form-group">
                    <label for="preco">Preço (R$) *</label>
                    <input type="number" id="preco" step="0.01" required placeholder="0,00" min="0.01">
                </div>
                
                <div class="form-group">
                    <label for="quantidade">Quantidade *</label>
                    <input type="number" id="quantidade" required placeholder="0" min="0">
                </div>
                
                <div class="form-group">
                    <label for="categoria">Categoria</label>
                    <select id="categoria">
                        <option value="">Selecione uma categoria</option>
                        <option value="Maquiagem">Maquiagem</option>
                        <option value="Cuidados com a Pele">Cuidados com a Pele</option>
                        <option value="Perfumaria">Perfumaria</option>
                        <option value="Cabelos">Cabelos</option>
                        <option value="Acessórios">Acessórios</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="descricao">Descrição</label>
                    <textarea id="descricao" rows="3" placeholder="Descrição do produto..."></textarea>
                </div>
                
                <button type="submit" class="submit-btn">💾 Cadastrar Produto</button>
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
    const categoria = document.getElementById('categoria').value;
    const descricao = document.getElementById('descricao').value.trim();
    
    // Validações
    const errors = [];
    if (!nome || nome.length < 2) errors.push('Nome do produto deve ter pelo menos 2 caracteres');
    if (isNaN(preco) || preco <= 0) errors.push('Preço deve ser maior que zero');
    if (isNaN(quantidade) || quantidade < 0) errors.push('Quantidade deve ser um número positivo');
    
    if (errors.length > 0) {
        document.getElementById('msg').innerHTML = `
            <div class="error-message">
                ${errors.map(e => `<p>❌ ${e}</p>`).join('')}
            </div>
        `;
        return;
    }
    
    const btnSubmit = document.querySelector('.submit-btn');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Cadastrando...';
    
    try {
        const res = await callAPI('cadastrarProduto', { 
            nome, 
            preco, 
            quantidade,
            categoria,
            descricao
        });
        
        if (res.success) {
            document.getElementById('msg').innerHTML = `
                <div class="success-message">
                    ✅ Produto "${nome}" cadastrado com sucesso!
                </div>
            `;
            document.getElementById('formCadastro').reset();
            
            setTimeout(() => {
                document.getElementById('msg').innerHTML = '';
            }, 3000);
        } else {
            document.getElementById('msg').innerHTML = `
                <div class="error-message">
                    ❌ Erro ao cadastrar: ${res.error || 'Erro desconhecido'}
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('msg').innerHTML = `
            <div class="error-message">
                ❌ Erro de conexão: ${error.message}
            </div>
        `;
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = '💾 Cadastrar Produto';
    }
}

// ======================================
// ESTOQUE
// ======================================
async function renderEstoque() {
    const app = document.getElementById('app');
    showLoading('app', 'Carregando estoque...');
    
    try {
        const res = await callAPI('listarProdutos');
        
        if (res.success && res.produtos && res.produtos.length > 0) {
            let html = res.produtos.map(p => {
                const statusClass = p.quantidade === 0 ? 'out-of-stock' : 
                                   p.quantidade <= 5 ? 'low-stock' : 'in-stock';
                const statusText = p.quantidade === 0 ? 'Esgotado' : 
                                  p.quantidade <= 5 ? 'Baixo' : 'Normal';
                
                return `
                    <tr class="${statusClass}">
                        <td>${p.id}</td>
                        <td>${p.nome}</td>
                        <td>${p.categoria || '-'}</td>
                        <td>${p.quantidade}</td>
                        <td>R$ ${p.preco.toFixed(2)}</td>
                        <td>R$ ${(p.preco * p.quantidade).toFixed(2)}</td>
                        <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                        <td>
                            <button onclick="window.editarProduto(${p.id})" class="action-btn edit-btn">✏️</button>
                            <button onclick="window.confirmarExclusao(${p.id}, '${p.nome}')" class="action-btn delete-btn">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            app.innerHTML = `
                <section>
                    <div class="section-header">
                        <h2>📦 Estoque de Produtos</h2>
                        <div class="header-actions">
                            <input type="text" id="buscaEstoque" placeholder="🔍 Buscar produto..." class="search-input">
                            <button onclick="window.exportarEstoque()" class="export-btn">📥 Exportar</button>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table id="tabelaEstoque">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Qtd</th>
                                    <th>Preço Un.</th>
                                    <th>Valor Total</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>${html}</tbody>
                        </table>
                    </div>
                    
                    <div class="table-footer">
                        <p>Total de produtos: <strong>${res.produtos.length}</strong></p>
                        <p>Valor total em estoque: <strong>R$ ${res.produtos.reduce((acc, p) => acc + (p.preco * p.quantidade), 0).toFixed(2)}</strong></p>
                    </div>
                </section>
            `;
            
            // Adicionar evento de busca
            document.getElementById('buscaEstoque')?.addEventListener('input', filtrarEstoque);
            
        } else {
            app.innerHTML = `
                <section>
                    <h2>📦 Estoque</h2>
                    <div class="empty-state">
                        <p>📭 Nenhum produto cadastrado ainda.</p>
                        <button onclick="renderCadastro()" class="nav-btn">Cadastrar Primeiro Produto</button>
                    </div>
                </section>
            `;
        }
    } catch (error) {
        app.innerHTML = `
            <section class="error-section">
                <h2>❌ Erro ao carregar estoque</h2>
                <p>${error.message}</p>
                <button onclick="renderEstoque()" class="retry-btn">Tentar novamente</button>
            </section>
        `;
    }
}

function filtrarEstoque(e) {
    const termo = e.target.value.toLowerCase();
    const tabela = document.getElementById('tabelaEstoque');
    if (!tabela) return;
    
    const linhas = tabela.getElementsByTagName('tr');
    for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];
        const textoLinha = linha.textContent.toLowerCase();
        linha.style.display = textoLinha.includes(termo) ? '' : 'none';
    }
}

window.editarProduto = async function(id) {
    const novoPreco = prompt('Novo preço:');
    if (novoPreco && !isNaN(novoPreco) && parseFloat(novoPreco) > 0) {
        const novaQtd = prompt('Nova quantidade:');
        if (novaQtd && !isNaN(novaQtd) && parseInt(novaQtd) >= 0) {
            const res = await callAPI('atualizarProduto', {
                id: id,
                preco: parseFloat(novoPreco),
                quantidade: parseInt(novaQtd)
            });
            
            if (res.success) {
                showNotification('✅ Produto atualizado!', 'success');
                renderEstoque();
            } else {
                showNotification('❌ Erro ao atualizar', 'error');
            }
        }
    }
};

window.confirmarExclusao = function(id, nome) {
    if (confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
        window.excluirProduto(id);
    }
};

window.excluirProduto = async function(id) {
    const res = await callAPI('excluirProduto', { id: id });
    if (res.success) {
        showNotification('🗑️ Produto excluído!', 'success');
        renderEstoque();
    } else {
        showNotification('❌ Erro ao excluir', 'error');
    }
};

window.exportarEstoque = function() {
    const tabela = document.getElementById('tabelaEstoque');
    if (!tabela) return;
    
    let csv = 'ID,Produto,Categoria,Quantidade,Preço Unitário,Valor Total,Status\n';
    const linhas = tabela.getElementsByTagName('tr');
    
    for (let i = 1; i < linhas.length; i++) {
        const celulas = linhas[i].getElementsByTagName('td');
        const linha = [];
        for (let j = 0; j < celulas.length - 1; j++) { // -1 para ignorar coluna de ações
            linha.push(celulas[j].textContent.replace('R$ ', '').trim());
        }
        csv += linha.join(',') + '\n';
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estoque_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('📥 Estoque exportado!', 'success');
};

// ======================================
// VENDAS
// ======================================
async function renderVendas() {
    const app = document.getElementById('app');
    showLoading('app', 'Carregando...');
    
    try {
        const [produtosRes, vendasRes] = await Promise.all([
            callAPI('listarProdutos'),
            callAPI('listarVendas')
        ]);
        
        let produtosOpts = '';
        let produtosDisponiveis = [];
        
        if (produtosRes.success && produtosRes.produtos) {
            produtosDisponiveis = produtosRes.produtos.filter(p => p.quantidade > 0);
            produtosOpts = produtosDisponiveis.map(p => 
                `<option value="${p.id}" data-preco="${p.preco}" data-estoque="${p.quantidade}">${p.nome} (${p.quantidade} un. - R$ ${p.preco.toFixed(2)})</option>`
            ).join('');
        }
        
        let ultimasVendasHtml = '';
        if (vendasRes.success && vendasRes.vendas && vendasRes.vendas.length > 0) {
            const ultimasVendas = vendasRes.vendas.slice(0, 10);
            ultimasVendasHtml = `
                <div class="recent-sales">
                    <h3>Últimas Vendas</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Produto</th>
                                <th>Qtd</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ultimasVendas.map(v => `
                                <tr>
                                    <td>${formatDate(v.data)}</td>
                                    <td>${v.cliente || 'Consumidor Final'}</td>
                                    <td>${v.produto}</td>
                                    <td>${v.quantidade}</td>
                                    <td>R$ ${v.total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        app.innerHTML = `
            <section>
                <h2>💰 Registrar Venda</h2>
                <form id="formVenda" class="sale-form">
                    <div class="form-group">
                        <label for="produtoId">Produto *</label>
                        <select id="produtoId" required>
                            <option value="">Selecione um produto</option>
                            ${produtosOpts}
                        </select>
                        <small id="estoqueInfo"></small>
                    </div>
                    
                    <div class="form-group">
                        <label for="quantidadeVenda">Quantidade *</label>
                        <input type="number" id="quantidadeVenda" required placeholder="Quantidade" min="1">
                        <small id="totalInfo">Total: R$ 0,00</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="cliente">Cliente</label>
                        <input type="text" id="cliente" placeholder="Nome do cliente (opcional para consumidor final)">
                    </div>
                    
                    <button type="submit" class="submit-btn">💵 Registrar Venda</button>
                </form>
                <div id="msgVenda"></div>
                
                ${ultimasVendasHtml}
            </section>
        `;
        
        // Event listeners para cálculo dinâmico
        document.getElementById('produtoId')?.addEventListener('change', atualizarInfoVenda);
        document.getElementById('quantidadeVenda')?.addEventListener('input', atualizarInfoVenda);
        document.getElementById('formVenda').addEventListener('submit', registrarVenda);
        
    } catch (error) {
        app.innerHTML = `
            <section class="error-section">
                <h2>❌ Erro ao carregar vendas</h2>
                <p>${error.message}</p>
                <button onclick="renderVendas()" class="retry-btn">Tentar novamente</button>
            </section>
        `;
    }
}

function atualizarInfoVenda() {
    const select = document.getElementById('produtoId');
    const quantidade = parseInt(document.getElementById('quantidadeVenda').value) || 0;
    const estoqueInfo = document.getElementById('estoqueInfo');
    const totalInfo = document.getElementById('totalInfo');
    
    if (select && select.selectedIndex > 0) {
        const option = select.options[select.selectedIndex];
        const preco = parseFloat(option.dataset.preco);
        const estoque = parseInt(option.dataset.estoque);
        
        estoqueInfo.textContent = `Estoque disponível: ${estoque} un.`;
        estoqueInfo.style.color = quantidade > estoque ? '#e53e3e' : '#38a169';
        
        if (quantidade > 0) {
            const total = preco * quantidade;
            totalInfo.textContent = `Total: R$ ${total.toFixed(2)}`;
            totalInfo.style.color = '#667eea';
            totalInfo.style.fontWeight = 'bold';
        } else {
            totalInfo.textContent = 'Total: R$ 0,00';
        }
    }
}

async function registrarVenda(e) {
    e.preventDefault();
    
    const produtoId = document.getElementById('produtoId').value;
    const quantidade = parseInt(document.getElementById('quantidadeVenda').value);
    const cliente = document.getElementById('cliente').value.trim();
    
    // Validações
    if (!produtoId) {
        document.getElementById('msgVenda').innerHTML = '<div class="error-message">❌ Selecione um produto</div>';
        return;
    }
    
    if (isNaN(quantidade) || quantidade <= 0) {
        document.getElementById('msgVenda').innerHTML = '<div class="error-message">❌ Quantidade inválida</div>';
        return;
    }
    
    // Verificar estoque
    const option = document.getElementById('produtoId').options[document.getElementById('produtoId').selectedIndex];
    const estoque = parseInt(option.dataset.estoque);
    
    if (quantidade > estoque) {
        document.getElementById('msgVenda').innerHTML = 
            `<div class="error-message">❌ Estoque insuficiente! Disponível: ${estoque} un.</div>`;
        return;
    }
    
    const btnSubmit = document.querySelector('.submit-btn');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Registrando...';
    
    try {
        const res = await callAPI('registrarVenda', {
            produtoId: produtoId,
            quantidade: quantidade,
            cliente: cliente || 'Consumidor Final'
        });
        
        if (res.success) {
            document.getElementById('msgVenda').innerHTML = `
                <div class="success-message">
                    ✅ Venda registrada com sucesso!
                    ${cliente ? `<br>Cliente: ${cliente}` : ''}
                    <br>Total: R$ ${(parseFloat(option.dataset.preco) * quantidade).toFixed(2)}
                </div>
            `;
            document.getElementById('formVenda').reset();
            document.getElementById('estoqueInfo').textContent = '';
            document.getElementById('totalInfo').textContent = 'Total: R$ 0,00';
            
            // Recarregar para atualizar lista de produtos e últimas vendas
            setTimeout(() => renderVendas(), 2000);
        } else {
            document.getElementById('msgVenda').innerHTML = `
                <div class="error-message">
                    ❌ Erro: ${res.error || 'Erro ao registrar venda'}
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('msgVenda').innerHTML = `
            <div class="error-message">
                ❌ Erro de conexão: ${error.message}
            </div>
        `;
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = '💵 Registrar Venda';
    }
}

// ======================================
// CLIENTES
// ======================================
async function renderClientes() {
    const app = document.getElementById('app');
    showLoading('app', 'Carregando clientes...');
    
    try {
        const res = await callAPI('listarVendasPorCliente');
        
        app.innerHTML = `
            <section>
                <div class="section-header">
                    <h2>👥 Clientes</h2>
                    <input type="text" id="buscaCliente" placeholder="🔍 Buscar cliente..." class="search-input">
                </div>
                
                <div class="table-responsive">
                    <table id="tabelaClientes">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Total Gasto</th>
                                <th>Total Pago</th>
                                <th>Saldo Devedor</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="clientesBody">
                            <tr><td colspan="5">Carregando...</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div id="detalhesCliente" class="client-details" style="display:none;"></div>
            </section>
        `;
        
        document.getElementById('buscaCliente')?.addEventListener('input', filtrarClientes);
        await carregarTabelaClientes();
        
    } catch (error) {
        app.innerHTML = `
            <section class="error-section">
                <h2>❌ Erro ao carregar clientes</h2>
                <p>${error.message}</p>
                <button onclick="renderClientes()" class="retry-btn">Tentar novamente</button>
            </section>
        `;
    }
}

async function carregarTabelaClientes(filtro = '') {
    const res = await callAPI('listarVendasPorCliente');
    const tbody = document.getElementById('clientesBody');
    
    if (!tbody) return;
    
    let html = '';
    
    if (res.success && res.clientes && res.clientes.length > 0) {
        const clientesFiltrados = filtro 
            ? res.clientes.filter(c => 
                c.nome.toLowerCase().includes(filtro.toLowerCase())
              )
            : res.clientes;
        
        if (clientesFiltrados.length > 0) {
            clientesFiltrados.forEach(c => {
                const saldo = c.totalGasto - c.totalPago;
                const saldoClass = saldo > 0 ? 'negative' : saldo < 0 ? 'positive' : '';
                
                html += `
                    <tr>
                        <td><strong>${c.nome}</strong></td>
                        <td>R$ ${c.totalGasto.toFixed(2)}</td>
                        <td>R$ ${c.totalPago.toFixed(2)}</td>
                        <td class="${saldoClass}">
                            <strong>R$ ${Math.abs(saldo).toFixed(2)}</strong>
                            ${saldo > 0 ? '(Deve)' : saldo < 0 ? '(Crédito)' : '(Quitado)'}
                        </td>
                        <td>
                            <button onclick="window.abrirDetalhes('${c.nome}')" class="action-btn view-btn">
                                👁️ Detalhes
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            html = '<tr><td colspan="5">Nenhum cliente encontrado com esse nome</td></tr>';
        }
    } else {
        html = '<tr><td colspan="5">Nenhum cliente cadastrado ainda</td></tr>';
    }
    
    tbody.innerHTML = html;
}

function filtrarClientes(e) {
    carregarTabelaClientes(e.target.value);
}

window.abrirDetalhes = async function(nome) {
    const container = document.getElementById('detalhesCliente');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = '<p>Carregando detalhes...</p>';
    
    try {
        const res = await callAPI('listarDetalhesCliente', { cliente: nome });
        
        if (res.success && res.historico && res.historico.length > 0) {
            let totalGasto = res.historico.reduce((acc, h) => acc + h.total, 0);
            
            const historicoHtml = res.historico.map(h => `
                <tr>
                    <td>${formatDate(h.data)}</td>
                    <td>${h.produto}</td>
                    <td>${h.quantidade || 1}</td>
                    <td>R$ ${h.total.toFixed(2)}</td>
                </tr>
            `).join('');
            
            container.innerHTML = `
                <div class="client-detail-card">
                    <h3>📋 Histórico: ${nome}</h3>
                    <button onclick="document.getElementById('detalhesCliente').style.display='none'" 
                            class="close-btn">✕ Fechar</button>
                    
                    <div class="client-summary">
                        <p><strong>Total de compras:</strong> ${res.historico.length}</p>
                        <p><strong>Total gasto:</strong> R$ ${totalGasto.toFixed(2)}</p>
                    </div>
                    
                    <div class="table-responsive">
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
                    
                    <div class="payment-section">
                        <h4>💳 Registrar Pagamento</h4>
                        <div class="payment-form">
                            <input type="number" id="valorPagamento" 
                                   placeholder="Valor do pagamento" 
                                   min="0.01" step="0.01">
                            <button onclick="window.efetuarPagamento('${nome}')" class="submit-btn">
                                Registrar Pagamento
                            </button>
                        </div>
                        <div id="msgPagamento"></div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="client-detail-card">
                    <h3>📋 ${nome}</h3>
                    <button onclick="document.getElementById('detalhesCliente').style.display='none'" 
                            class="close-btn">✕ Fechar</button>
                    <p>Nenhum histórico de compras encontrado.</p>
                </div>
            `;
        }
    } catch (error) {
        container.innerHTML = `
            <div class="error-message">
                ❌ Erro ao carregar detalhes: ${error.message}
            </div>
        `;
    }
};

window.efetuarPagamento = async function(nome) {
    const valorInput = document.getElementById('valorPagamento');
    const msgDiv = document.getElementById('msgPagamento');
    
    if (!valorInput || !msgDiv) return;
    
    const valor = parseFloat(valorInput.value);
    
    if (!valor || valor <= 0) {
        msgDiv.innerHTML = '<div class="error-message">❌ Insira um valor válido maior que zero</div>';
        return;
    }
    
    const btn = document.querySelector('.payment-form .submit-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Registrando...';
    }
    
    try {
        const res = await callAPI('registrarPagamento', { 
            cliente: nome, 
            valor: valor 
        });
        
        if (res.success) {
            msgDiv.innerHTML = `
                <div class="success-message">
                    ✅ Pagamento de R$ ${valor.toFixed(2)} registrado com sucesso!
                </div>
            `;
            valorInput.value = '';
            
            // Atualizar lista de clientes e detalhes
            await carregarTabelaClientes();
            setTimeout(() => window.abrirDetalhes(nome), 500);
            
            showNotification('✅ Pagamento registrado!', 'success');
        } else {
            msgDiv.innerHTML = `
                <div class="error-message">
                    ❌ Erro ao registrar pagamento: ${res.error || 'Erro desconhecido'}
                </div>
            `;
        }
    } catch (error) {
        msgDiv.innerHTML = `
            <div class="error-message">
                ❌ Erro de conexão: ${error.message}
            </div>
        `;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Registrar Pagamento';
        }
    }
};

// ======================================
// INICIALIZAÇÃO
// ======================================
console.log('🚀 Sistema de Vendas inicializado com sucesso!');
console.log('📱 Versão: 2.0');
console.log('🔗 API:', API_URL);