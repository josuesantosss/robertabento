// ======================================
// CONFIGURAÇÃO API
// ======================================
const API_URL = 'https://script.google.com/macros/s/AKfycbx2EML5Q5heS2U0JQ7ia0D9YaA2RoIpr56GMtJAfCyvLj25OY7FFep12yagVkC5qPtqgw/exec';

// Flag para debug
const DEBUG = true;

async function callAPI(action, data = null) {
    const url = `${API_URL}?action=${action}`;
    const options = {
        method: data ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
    };
    
    // Adiciona body apenas se for POST
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    if (DEBUG) {
        console.log(`🔍 Chamando API: ${action}`);
        console.log('URL:', url);
        console.log('Método:', options.method);
        console.log('Dados:', data);
    }
    
    try {
        const response = await fetch(url, options);
        
        if (DEBUG) {
            console.log('📡 Status da resposta:', response.status);
            console.log('📡 OK?:', response.ok);
        }
        
        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            const errorText = await response.text();
            if (DEBUG) console.error('❌ Resposta de erro:', errorText);
            throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }
        
        // Tenta extrair o JSON da resposta
        const responseText = await response.text();
        if (DEBUG) console.log('📄 Resposta bruta:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            if (DEBUG) console.error('❌ Erro ao parsear JSON:', parseError);
            throw new Error('Resposta do servidor não é um JSON válido');
        }
        
        if (DEBUG) console.log('✅ Resultado:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Erro na API:', error);
        
        // Exibe mensagem mais descritiva
        let errorMessage = 'Erro de comunicação com o servidor';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique sua internet e a URL da API.';
        } else if (error.message.includes('HTTP error')) {
            errorMessage = `Erro do servidor: ${error.message}`;
        } else if (error.message.includes('JSON')) {
            errorMessage = 'Resposta inválida do servidor. Verifique o código do Google Apps Script.';
        }
        
        showNotification(errorMessage, 'error');
        return { 
            success: false, 
            error: error.message,
            errorDetails: errorMessage 
        };
    }
}

// ======================================
// FUNÇÃO PARA TESTAR CONEXÃO
// ======================================
async function testarConexao() {
    console.log('🧪 Iniciando teste de conexão...');
    
    try {
        // Teste 1: Verificar se a URL base é acessível
        console.log('1️⃣ Testando URL base...');
        const response = await fetch(API_URL);
        console.log('Status:', response.status);
        
        // Teste 2: Tentar ação simples (listarProdutos sem parâmetros)
        console.log('2️⃣ Testando listarProdutos...');
        const result = await callAPI('listarProdutos');
        console.log('Resultado:', result);
        
        return result;
    } catch (error) {
        console.error('Erro no teste:', error);
        return { success: false, error: error.message };
    }
}

// ======================================
// FUNÇÕES UTILITÁRIAS
// ======================================
function showNotification(message, type = 'info') {
    // Remove notificações anteriores
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 5000); // Aumentado para 5 segundos para ler mensagens de erro
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// ======================================
// NAVEGAÇÃO
// ======================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema inicializado');
    console.log('🔗 API URL:', API_URL);
    
    // Adiciona botão de teste na página inicial temporariamente
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
// HOME - DASHBOARD COM TESTE DE CONEXÃO
// ======================================
async function renderHome() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading">Verificando conexão com servidor...</div>';
    
    // Primeiro testa a conexão
    const teste = await testarConexao();
    
    if (!teste.success) {
        app.innerHTML = `
            <section>
                <h2>❌ Erro de Conexão</h2>
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>⚠️ Não foi possível conectar ao servidor</h3>
                    <p><strong>Erro:</strong> ${teste.error || 'Desconhecido'}</p>
                    <p><strong>URL da API:</strong> ${API_URL}</p>
                    
                    <div style="margin-top: 20px;">
                        <h4>Possíveis problemas:</h4>
                        <ul>
                            <li>❌ URL da API incorreta ou expirada</li>
                            <li>❌ Google Apps Script não está implantado como "Aplicativo da Web"</li>
                            <li>❌ Permissões do script não configuradas ("Qualquer pessoa pode acessar")</li>
                            <li>❌ Erro no código do Google Apps Script</li>
                            <li>❌ Problema de CORS não resolvido</li>
                        </ul>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <h4>Como resolver:</h4>
                        <ol>
                            <li>Vá até o Google Apps Script</li>
                            <li>Clique em "Implantar" > "Nova implantação"</li>
                            <li>Escolha "Aplicativo da Web"</li>
                            <li>Em "Quem pode acessar", selecione "Qualquer pessoa"</li>
                            <li>Copie a nova URL e atualize a constante API_URL</li>
                            <li>Certifique-se de que a função doGet está implementada corretamente</li>
                        </ol>
                    </div>
                </div>
                
                <button onclick="renderHome()" style="margin-right: 10px;">🔄 Tentar Novamente</button>
                <button onclick="abrirConsoleERRO()" style="background: #666;">📋 Ver Console</button>
            </section>
        `;
        return;
    }
    
    // Se conectou, continua normalmente
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
                const preco = parseFloat(p.preco) || 0;
                const quantidade = parseInt(p.quantidade) || 0;
                valorEstoque += (preco * quantidade);
                if (quantidade <= 5) produtosBaixoEstoque++;
            });
        }
        
        let totalVendasHoje = 0;
        let totalVendasMes = 0;
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        
        if (vendasRes.success && vendasRes.vendas) {
            vendasRes.vendas.forEach(v => {
                const dataVenda = new Date(v.data);
                const total = parseFloat(v.total) || 0;
                
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
                            <p class="card-value">${formatCurrency(valorEstoque)}</p>
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
                            <p class="card-value">${formatCurrency(totalVendasHoje)}</p>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-icon">📊</div>
                        <div class="card-content">
                            <h3>Vendas do Mês</h3>
                            <p class="card-value">${formatCurrency(totalVendasMes)}</p>
                        </div>
                    </div>
                </div>
                
                ${produtosBaixoEstoque > 0 ? `
                    <div class="alert alert-warning">
                        ⚠️ Atenção: ${produtosBaixoEstoque} produto(s) com estoque baixo (≤ 5 unidades)
                    </div>
                ` : ''}
                
                <div style="margin-top: 20px; font-size: 12px; color: #999;">
                    ✅ Conectado ao servidor com sucesso
                </div>
            </section>
        `;
        
    } catch (error) {
        console.error('Erro no dashboard:', error);
        app.innerHTML = `
            <section>
                <h2>❌ Erro ao carregar dashboard</h2>
                <p>${error.message}</p>
                <button onclick="renderHome()">Tentar novamente</button>
            </section>
        `;
    }
}

// ======================================
// FUNÇÃO AUXILIAR PARA DEBUG
// ======================================
function abrirConsoleERRO() {
    alert('Pressione F12 para abrir o console do navegador e verifique os logs detalhados.\n\nProcure por mensagens em vermelho.');
    console.log('📋 Console de debug ativo');
    console.log('API_URL:', API_URL);
    console.log('Verifique se há erros em vermelho acima ↑');
}

// ======================================
// CADASTRO DE PRODUTOS
// ======================================
function renderCadastro() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>➕ Cadastrar Novo Produto</h2>
            <form id="formCadastro">
                <div class="form-group">
                    <label for="nome">Nome do Produto *</label>
                    <input type="text" id="nome" required placeholder="Nome do produto" minlength="2">
                </div>
                
                <div class="form-group">
                    <label for="preco">Preço (R$) *</label>
                    <input type="number" id="preco" step="0.01" required placeholder="0,00" min="0.01">
                </div>
                
                <div class="form-group">
                    <label for="quantidade">Quantidade *</label>
                    <input type="number" id="quantidade" required placeholder="0" min="0">
                </div>
                
                <button type="submit">💾 Cadastrar Produto</button>
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
    
    // Validações
    if (!nome || nome.length < 2) {
        document.getElementById('msg').innerHTML = '<div class="error">❌ Nome deve ter pelo menos 2 caracteres</div>';
        return;
    }
    if (isNaN(preco) || preco <= 0) {
        document.getElementById('msg').innerHTML = '<div class="error">❌ Preço deve ser maior que zero</div>';
        return;
    }
    if (isNaN(quantidade) || quantidade < 0) {
        document.getElementById('msg').innerHTML = '<div class="error">❌ Quantidade inválida</div>';
        return;
    }
    
    // Enviar para API (Planilha Produtos: A-ID | B-Nome | C-Preço | D-Quantidade)
    const res = await callAPI('cadastrarProduto', { 
        nome: nome,
        preco: preco,
        quantidade: quantidade
    });
    
    if (res.success) {
        document.getElementById('msg').innerHTML = `
            <div class="success">
                ✅ Produto "${nome}" cadastrado com sucesso!
            </div>
        `;
        document.getElementById('formCadastro').reset();
        showNotification('Produto cadastrado com sucesso!', 'success');
    } else {
        document.getElementById('msg').innerHTML = `
            <div class="error">
                ❌ Erro: ${res.error || 'Erro ao cadastrar produto'}
            </div>
        `;
    }
}

// ======================================
// ESTOQUE
// ======================================
async function renderEstoque() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading">Carregando estoque...</div>';
    
    try {
        const res = await callAPI('listarProdutos');
        
        if (res.success && res.produtos && res.produtos.length > 0) {
            // Produtos: A-ID | B-Nome | C-Preço | D-Quantidade
            let html = res.produtos.map(p => {
                const id = p.id;
                const nome = p.nome;
                const preco = parseFloat(p.preco) || 0;
                const quantidade = parseInt(p.quantidade) || 0;
                const valorTotal = preco * quantidade;
                
                const statusClass = quantidade === 0 ? 'out-of-stock' : 
                                   quantidade <= 5 ? 'low-stock' : 'in-stock';
                const statusText = quantidade === 0 ? 'Esgotado' : 
                                  quantidade <= 5 ? 'Baixo' : 'Normal';
                
                return `
                    <tr class="${statusClass}">
                        <td>${id}</td>
                        <td>${nome}</td>
                        <td>${quantidade}</td>
                        <td>${formatCurrency(preco)}</td>
                        <td>${formatCurrency(valorTotal)}</td>
                        <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                        <td>
                            <button onclick="window.editarProduto(${id}, '${nome}', ${preco}, ${quantidade})" 
                                    class="btn-edit" title="Editar">✏️</button>
                            <button onclick="window.confirmarExclusao(${id}, '${nome}')" 
                                    class="btn-delete" title="Excluir">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            const valorTotalEstoque = res.produtos.reduce((acc, p) => {
                return acc + (parseFloat(p.preco) || 0) * (parseInt(p.quantidade) || 0);
            }, 0);
            
            app.innerHTML = `
                <section>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2>📦 Estoque de Produtos</h2>
                        <input type="text" id="buscaEstoque" placeholder="🔍 Buscar produto..." 
                               style="width: 300px; padding: 10px; border-radius: 8px; border: 2px solid #e1e4e8;">
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table id="tabelaEstoque">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Produto</th>
                                    <th>Quantidade</th>
                                    <th>Preço Un.</th>
                                    <th>Valor Total</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>${html}</tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <p><strong>Total de produtos:</strong> ${res.produtos.length}</p>
                        <p><strong>Valor total em estoque:</strong> ${formatCurrency(valorTotalEstoque)}</p>
                    </div>
                </section>
            `;
            
            // Adicionar funcionalidade de busca
            document.getElementById('buscaEstoque')?.addEventListener('input', function(e) {
                const termo = e.target.value.toLowerCase();
                const linhas = document.querySelectorAll('#tabelaEstoque tbody tr');
                linhas.forEach(linha => {
                    const texto = linha.textContent.toLowerCase();
                    linha.style.display = texto.includes(termo) ? '' : 'none';
                });
            });
            
        } else {
            app.innerHTML = `
                <section>
                    <h2>📦 Estoque</h2>
                    <div style="text-align: center; padding: 40px;">
                        <p>📭 Nenhum produto cadastrado ainda.</p>
                        <button onclick="renderCadastro()" style="margin-top: 10px;">Cadastrar Primeiro Produto</button>
                    </div>
                </section>
            `;
        }
    } catch (error) {
        app.innerHTML = `
            <section>
                <h2>❌ Erro ao carregar estoque</h2>
                <p>${error.message}</p>
                <button onclick="renderEstoque()">Tentar novamente</button>
            </section>
        `;
    }
}

window.editarProduto = function(id, nome, precoAtual, quantidadeAtual) {
    const novoPreco = prompt(`Editar preço de "${nome}" (atual: ${formatCurrency(precoAtual)}):`, precoAtual);
    if (novoPreco === null) return; // Cancelou
    
    const preco = parseFloat(novoPreco);
    if (isNaN(preco) || preco <= 0) {
        alert('Preço inválido!');
        return;
    }
    
    const novaQuantidade = prompt(`Editar quantidade de "${nome}" (atual: ${quantidadeAtual}):`, quantidadeAtual);
    if (novaQuantidade === null) return; // Cancelou
    
    const quantidade = parseInt(novaQuantidade);
    if (isNaN(quantidade) || quantidade < 0) {
        alert('Quantidade inválida!');
        return;
    }
    
    window.atualizarProduto(id, preco, quantidade);
};

window.atualizarProduto = async function(id, preco, quantidade) {
    const res = await callAPI('atualizarProduto', {
        id: id,
        preco: preco,
        quantidade: quantidade
    });
    
    if (res.success) {
        showNotification('✅ Produto atualizado!', 'success');
        renderEstoque();
    } else {
        showNotification('❌ Erro ao atualizar: ' + (res.error || 'Erro desconhecido'), 'error');
    }
};

window.confirmarExclusao = function(id, nome) {
    if (confirm(`Tem certeza que deseja excluir "${nome}"?\nEsta ação não pode ser desfeita!`)) {
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

// ======================================
// VENDAS
// ======================================
async function renderVendas() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        const [produtosRes, vendasRes] = await Promise.all([
            callAPI('listarProdutos'),
            callAPI('listarVendas')
        ]);
        
        let produtosOpts = '';
        
        if (produtosRes.success && produtosRes.produtos) {
            const produtosDisponiveis = produtosRes.produtos.filter(p => parseInt(p.quantidade) > 0);
            
            if (produtosDisponiveis.length === 0) {
                produtosOpts = '<option value="">Nenhum produto em estoque</option>';
            } else {
                produtosOpts = '<option value="">Selecione um produto</option>' + 
                    produtosDisponiveis.map(p => {
                        const preco = parseFloat(p.preco).toFixed(2);
                        const qtd = parseInt(p.quantidade);
                        return `<option value="${p.id}" data-preco="${preco}" data-estoque="${qtd}">
                            ${p.nome} - Estoque: ${qtd} un. - R$ ${preco}
                        </option>`;
                    }).join('');
            }
        }
        
        // Últimas vendas
        let ultimasVendasHtml = '';
        if (vendasRes.success && vendasRes.vendas && vendasRes.vendas.length > 0) {
            // Vendas: A-ID_Venda | B-Data | C-Produto | D-Quantidade | E-Total | F-Cliente
            const ultimasVendas = vendasRes.vendas.slice(-10).reverse();
            ultimasVendasHtml = `
                <div style="margin-top: 30px;">
                    <h3>📋 Últimas Vendas</h3>
                    <div style="overflow-x: auto;">
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
                                        <td>${formatCurrency(parseFloat(v.total))}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        
        app.innerHTML = `
            <section>
                <h2>💰 Registrar Venda</h2>
                <form id="formVenda">
                    <div class="form-group">
                        <label for="produtoId">Produto *</label>
                        <select id="produtoId" required>
                            ${produtosOpts}
                        </select>
                        <small id="estoqueInfo" style="color: #666;"></small>
                    </div>
                    
                    <div class="form-group">
                        <label for="quantidadeVenda">Quantidade *</label>
                        <input type="number" id="quantidadeVenda" required placeholder="Quantidade" min="1">
                        <small id="totalInfo" style="font-weight: bold; color: #667eea;">Total: R$ 0,00</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="cliente">Cliente</label>
                        <input type="text" id="cliente" placeholder="Nome do cliente (opcional)">
                    </div>
                    
                    <button type="submit">💵 Registrar Venda</button>
                </form>
                <div id="msgVenda"></div>
                
                ${ultimasVendasHtml}
            </section>
        `;
        
        // Event listeners
        document.getElementById('produtoId')?.addEventListener('change', atualizarInfoVenda);
        document.getElementById('quantidadeVenda')?.addEventListener('input', atualizarInfoVenda);
        document.getElementById('formVenda').addEventListener('submit', registrarVenda);
        
    } catch (error) {
        app.innerHTML = `
            <section>
                <h2>❌ Erro ao carregar vendas</h2>
                <p>${error.message}</p>
                <button onclick="renderVendas()">Tentar novamente</button>
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
            totalInfo.textContent = `Total: ${formatCurrency(total)}`;
        } else {
            totalInfo.textContent = 'Total: R$ 0,00';
        }
    }
}

async function registrarVenda(e) {
    e.preventDefault();
    
    const select = document.getElementById('produtoId');
    const quantidade = parseInt(document.getElementById('quantidadeVenda').value);
    const cliente = document.getElementById('cliente').value.trim();
    
    if (!select.value) {
        document.getElementById('msgVenda').innerHTML = '<div class="error">❌ Selecione um produto</div>';
        return;
    }
    
    if (isNaN(quantidade) || quantidade <= 0) {
        document.getElementById('msgVenda').innerHTML = '<div class="error">❌ Quantidade inválida</div>';
        return;
    }
    
    const option = select.options[select.selectedIndex];
    const estoque = parseInt(option.dataset.estoque);
    const preco = parseFloat(option.dataset.preco);
    const total = preco * quantidade;
    
    if (quantidade > estoque) {
        document.getElementById('msgVenda').innerHTML = 
            `<div class="error">❌ Estoque insuficiente! Disponível: ${estoque} un.</div>`;
        return;
    }
    
    // Registrar venda na planilha Vendas
    // A: id_venda (gerado automaticamente) | B: data | C: produto | D: quantidade | E: total | F: cliente
    const res = await callAPI('registrarVenda', {
        produtoId: select.value,
        quantidade: quantidade,
        total: total,
        cliente: cliente || 'Consumidor Final'
    });
    
    if (res.success) {
        document.getElementById('msgVenda').innerHTML = `
            <div class="success">
                ✅ Venda registrada com sucesso!
                <br>Total: ${formatCurrency(total)}
                ${cliente ? `<br>Cliente: ${cliente}` : ''}
            </div>
        `;
        document.getElementById('formVenda').reset();
        document.getElementById('estoqueInfo').textContent = '';
        document.getElementById('totalInfo').textContent = 'Total: R$ 0,00';
        
        showNotification('Venda registrada com sucesso!', 'success');
        
        // Recarregar após 2 segundos
        setTimeout(() => renderVendas(), 2000);
    } else {
        document.getElementById('msgVenda').innerHTML = `
            <div class="error">
                ❌ Erro: ${res.error || 'Erro ao registrar venda'}
            </div>
        `;
    }
}

// ======================================
// CLIENTES
// ======================================
async function renderClientes() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading">Carregando clientes...</div>';
    
    try {
        const res = await callAPI('listarVendasPorCliente');
        
        app.innerHTML = `
            <section>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>👥 Clientes</h2>
                    <input type="text" id="buscaCliente" placeholder="🔍 Buscar cliente..." 
                           style="width: 300px; padding: 10px; border-radius: 8px; border: 2px solid #e1e4e8;">
                </div>
                
                <div style="overflow-x: auto;">
                    <table id="tabelaClientes">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Total Gasto</th>
                                <th>Total Pago</th>
                                <th>Saldo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="clientesBody">
                            <tr><td colspan="5">Carregando...</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div id="detalhesCliente" style="display:none; margin-top:20px; padding:20px; background:#f8f9fa; border-radius:8px;"></div>
            </section>
        `;
        
        document.getElementById('buscaCliente')?.addEventListener('input', filtrarClientes);
        await carregarTabelaClientes();
        
    } catch (error) {
        app.innerHTML = `
            <section>
                <h2>❌ Erro ao carregar clientes</h2>
                <p>${error.message}</p>
                <button onclick="renderClientes()">Tentar novamente</button>
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
                const totalGasto = parseFloat(c.totalGasto) || 0;
                const totalPago = parseFloat(c.totalPago) || 0;
                const saldo = totalGasto - totalPago;
                
                let saldoClass = '';
                let saldoTexto = '';
                
                if (saldo > 0) {
                    saldoClass = 'text-danger';
                    saldoTexto = `Deve: ${formatCurrency(saldo)}`;
                } else if (saldo < 0) {
                    saldoClass = 'text-success';
                    saldoTexto = `Crédito: ${formatCurrency(Math.abs(saldo))}`;
                } else {
                    saldoClass = 'text-muted';
                    saldoTexto = 'Quitado';
                }
                
                html += `
                    <tr>
                        <td><strong>${c.nome}</strong></td>
                        <td>${formatCurrency(totalGasto)}</td>
                        <td>${formatCurrency(totalPago)}</td>
                        <td class="${saldoClass}"><strong>${saldoTexto}</strong></td>
                        <td>
                            <button onclick="window.abrirDetalhes('${c.nome}')" 
                                    style="background:#667eea; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">
                                👁️ Detalhes
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            html = '<tr><td colspan="5">Nenhum cliente encontrado</td></tr>';
        }
    } else {
        html = '<tr><td colspan="5">Nenhum cliente registrado ainda</td></tr>';
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
            // Histórico de vendas: Vendas: A-ID_Venda | B-Data | C-Produto | D-Quantidade | E-Total | F-Cliente
            const totalGasto = res.historico.reduce((acc, h) => acc + (parseFloat(h.total) || 0), 0);
            
            const historicoHtml = res.historico.map(h => `
                <tr>
                    <td>${formatDate(h.data)}</td>
                    <td>${h.produto}</td>
                    <td>${h.quantidade}</td>
                    <td>${formatCurrency(parseFloat(h.total))}</td>
                </tr>
            `).join('');
            
            container.innerHTML = `
                <div style="position: relative;">
                    <button onclick="document.getElementById('detalhesCliente').style.display='none'" 
                            style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">
                        ✕
                    </button>
                    
                    <h3>📋 Histórico de ${nome}</h3>
                    
                    <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 8px;">
                        <p><strong>Total de compras:</strong> ${res.historico.length}</p>
                        <p><strong>Total gasto:</strong> ${formatCurrency(totalGasto)}</p>
                    </div>
                    
                    <div style="overflow-x: auto;">
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
                    
                    <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
                        <h4>💳 Registrar Pagamento</h4>
                        <div style="display: flex; gap: 10px;">
                            <input type="number" id="valorPagamento" 
                                   placeholder="Valor do pagamento" 
                                   min="0.01" step="0.01"
                                   style="flex: 1;">
                            <button onclick="window.efetuarPagamento('${nome}')"
                                    style="background:#48bb78; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">
                                Registrar
                            </button>
                        </div>
                        <div id="msgPagamento" style="margin-top: 10px;"></div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="position: relative;">
                    <button onclick="document.getElementById('detalhesCliente').style.display='none'" 
                            style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 20px; cursor: pointer;">
                        ✕
                    </button>
                    <h3>📋 ${nome}</h3>
                    <p>Nenhum histórico de compras encontrado.</p>
                </div>
            `;
        }
    } catch (error) {
        container.innerHTML = `
            <div class="error">
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
        msgDiv.innerHTML = '<div class="error">❌ Insira um valor válido maior que zero</div>';
        return;
    }
    
    const res = await callAPI('registrarPagamento', { 
        cliente: nome, 
        valor: valor 
    });
    
    if (res.success) {
        msgDiv.innerHTML = `<div class="success">✅ Pagamento de ${formatCurrency(valor)} registrado!</div>`;
        valorInput.value = '';
        
        showNotification('Pagamento registrado com sucesso!', 'success');
        
        // Atualizar lista e detalhes
        await carregarTabelaClientes();
        setTimeout(() => window.abrirDetalhes(nome), 1000);
    } else {
        msgDiv.innerHTML = `<div class="error">❌ Erro: ${res.error || 'Erro ao registrar pagamento'}</div>`;
    }
};
