

// ======================================
// CONFIGURAÇÃO API
// ======================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzZrmE-m-8cptHZQ4V-dq3OoJMMsJfGYSt_zWRp90ekxFhI5p8osxlMcjtUG85NpL2xrw/exec';


// ======================================
// Teste rápido da API
// ======================================
async function testarAPI() {
    try {
        const resp = await fetch(`${API_URL}?action=teste`);
        const json = await resp.json();
        console.log('Teste API:', json);
    } catch (e) {
        console.error('Falha no teste:', e);
    }
}
testarAPI();


// ======================================
// SISTEMA DE CACHE
// ======================================
const Cache = {
    data: {},
    timeout: 5 * 60 * 1000, // 5 minutos
    
    async get(key, fetchFn) {
        const cached = this.data[key];
        if (cached && Date.now() - cached.timestamp < this.timeout) {
            console.log(`📦 Cache hit: ${key}`);
            return cached.data;
        }
        
        console.log(`🔄 Cache miss: ${key}`);
        const data = await fetchFn();
        this.data[key] = { data, timestamp: Date.now() };
        return data;
    },
    
    clear() {
        this.data = {};
        console.log('🗑️ Cache limpo');
    }
};

// ======================================
// SISTEMA DE NOTIFICAÇÕES TOAST
// ======================================
function mostrarToast(mensagem, tipo = 'success') {
    const cores = {
        success: '#48bb78',
        error: '#e53e3e',
        warning: '#ed8936',
        info: '#4299e1'
    };
    
    const icones = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toastAnterior = document.querySelector('.toast-notification');
    if (toastAnterior) toastAnterior.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed; 
        top: 20px; 
        right: 20px;
        background: ${cores[tipo]}; 
        color: white;
        padding: 15px 20px; 
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000; 
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
    `;
    toast.innerHTML = `
        <span style="font-size: 20px;">${icones[tipo]}</span>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    }, 4000);
}

// ======================================
// SISTEMA DE MODAIS DE CONFIRMAÇÃO
// ======================================
function confirmarAcao(mensagem, callback, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar') {
    const modalAnterior = document.querySelector('.modal-confirmacao');
    if (modalAnterior) modalAnterior.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-confirmacao';
    overlay.style.cssText = `
        position: fixed; 
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        z-index: 9999;
        animation: fadeIn 0.2s ease;
    `;
    
    overlay.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 450px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: scaleIn 0.2s ease;">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">⚠️</span>
            </div>
            <h3 style="margin: 0 0 10px 0; color: #2d3748;">Confirmação</h3>
            <p style="color: #4a5568; margin: 0 0 20px 0; line-height: 1.5;">${mensagem}</p>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn-cancelar" style="
                    background: #e2e8f0; 
                    color: #4a5568; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 6px; 
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#cbd5e0'" 
                   onmouseout="this.style.background='#e2e8f0'">
                    ${textoCancelar}
                </button>
                <button class="btn-confirmar" style="
                    background: #e53e3e; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 6px; 
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#c53030'" 
                   onmouseout="this.style.background='#e53e3e'">
                    ${textoConfirmar}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const btnConfirmar = overlay.querySelector('.btn-confirmar');
    const btnCancelar = overlay.querySelector('.btn-cancelar');
    
    btnConfirmar.onclick = () => {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            overlay.remove();
            callback();
        }, 200);
    };
    
    btnCancelar.onclick = () => {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
    };
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => overlay.remove(), 200);
        }
    });
}

// ======================================
// API MELHORADA (com timeout e logs)
// ======================================
async function callAPI(action, data = null, useCache = true) {
    let url = `${API_URL}?action=${action}`;
    if (action.includes('&')) {
        url = `${API_URL}?${action}`;
    }
    
    const fetchFn = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        try {
            const options = {
                method: data ? 'POST' : 'GET',
                headers: data ? { 'Content-Type': 'application/json' } : {},
                ...(data && { body: JSON.stringify(data) }),
                signal: controller.signal
            };
            
            console.log(`🌐 API Call: ${action}`, options.method);
            
            const response = await fetch(url, options);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }
            
            const result = await response.json();
            console.log(`✅ API Response (${action}):`, result);
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('A requisição demorou muito tempo (timeout). Verifique sua conexão ou a disponibilidade da API.');
            }
            console.error(`❌ Erro na API (${action}):`, error);
            throw error;
        }
    };
    
    if (useCache && !data) {
        return await Cache.get(action, fetchFn);
    } else {
        return await fetchFn();
    }
}

// ======================================
// GERENCIADOR DE ESTADO
// ======================================
const StateManager = {
    currentPage: 'home',
    filtroBusca: '',
    
    setPage(page) { this.currentPage = page; },
    getPage() { return this.currentPage; },
    setFiltro(filtro) { this.filtroBusca = filtro; },
    getFiltro() { return this.filtroBusca; }
};

// ======================================
// NAVEGAÇÃO PRINCIPAL
// ======================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Sistema de Vendas...');
    adicionarEstilosCSS();
    inicializarNavegacao();
    renderHome();
    console.log('✅ Sistema inicializado com sucesso!');
});

function adicionarEstilosCSS() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .loading-spinner { animation: spin 1s linear infinite; }
        .card-dashboard { transition: all 0.3s ease; }
        .card-dashboard:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        .btn-primary {
            transition: all 0.2s ease;
        }
        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        table tbody tr {
            transition: background 0.2s ease;
        }
        table tbody tr:hover {
            background: #f7fafc !important;
        }
        .produto-linha {
            background: #f9fafb;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
        }
    `;
    document.head.appendChild(style);
}

function inicializarNavegacao() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.target.closest('.nav-btn');
            if (!button) return;
            navButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            const pageMap = {
                'home': renderHome,
                'cadastro': renderCadastro,
                'estoque': renderEstoque,
                'vendas': renderVendas,
                'clientes': renderClientes
            };
            const page = button.dataset.page;
            if (pageMap[page]) {
                StateManager.setPage(page);
                Cache.clear();
                pageMap[page]();
            }
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            const shortcuts = { '1': 'home', '2': 'cadastro', '3': 'estoque', '4': 'vendas', '5': 'clientes' };
            if (shortcuts[e.key]) {
                e.preventDefault();
                const btn = document.querySelector(`[data-page="${shortcuts[e.key]}"]`);
                if (btn) btn.click();
            }
        }
    });
}

// ======================================
// HOME / DASHBOARD
// ======================================
async function renderHome() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
        <section>
            <h2>🏠 Dashboard</h2>
            <div style="text-align: center; padding: 40px;">
                <div class="loading-spinner" style="font-size: 32px;">⏳</div>
                <p style="color: #667eea; margin-top: 10px;">Carregando dados...</p>
            </div>
        </section>
    `;
    
    try {
        const [produtosResult, vendasResult] = await Promise.all([
            callAPI('listarProdutos', null, false),
            callAPI('listarVendas', null, false)
        ]);
        
        let totalProdutos = 0, valorTotalEstoque = 0, produtosBaixoEstoque = 0, produtosEsgotados = 0;
        if (produtosResult.success && produtosResult.produtos) {
            totalProdutos = produtosResult.produtos.length;
            produtosResult.produtos.forEach(produto => {
                const preco = parseFloat(produto.preco) || 0;
                const quantidade = parseInt(produto.quantidade) || 0;
                valorTotalEstoque += preco * quantidade;
                if (quantidade === 0) produtosEsgotados++;
                else if (quantidade <= 5) produtosBaixoEstoque++;
            });
        }
        
        let totalVendasHoje = 0, totalVendasMes = 0, totalVendasGeral = 0;
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        if (vendasResult.success && vendasResult.vendas) {
            vendasResult.vendas.forEach(venda => {
                const dataVenda = new Date(venda.data);
                const total = parseFloat(venda.total) || 0;
                totalVendasGeral += total;
                if (dataVenda.toDateString() === hoje.toDateString()) totalVendasHoje += total;
                if (dataVenda >= inicioMes) totalVendasMes += total;
            });
        }
        
        let graficoHTML = '';
        if (vendasResult.success && vendasResult.vendas && vendasResult.vendas.length > 0) {
            graficoHTML = criarGraficoVendasSimples(vendasResult.vendas);
        }
        
        app.innerHTML = `
            <section>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>🏠 Dashboard</h2>
                    <button onclick="atualizarDashboard()" class="btn-primary" style="
                        background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;
                    ">
                        🔄 Atualizar
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div class="card-dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h3 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">📦 Total Produtos</h3>
                                <p style="font-size: 36px; font-weight: bold; margin: 0;">${totalProdutos}</p>
                            </div>
                            <span style="font-size: 32px; opacity: 0.5;">📦</span>
                        </div>
                        <small style="opacity: 0.8;">Produtos cadastrados</small>
                    </div>
                    
                    <div class="card-dashboard" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 25px; border-radius: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h3 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">💰 Estoque Total</h3>
                                <p style="font-size: 36px; font-weight: bold; margin: 0;">R$ ${formatarMoeda(valorTotalEstoque)}</p>
                            </div>
                            <span style="font-size: 32px; opacity: 0.5;">💰</span>
                        </div>
                        <small style="opacity: 0.8;">Valor total em estoque</small>
                    </div>
                    
                    <div class="card-dashboard" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 25px; border-radius: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h3 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">💵 Vendas Hoje</h3>
                                <p style="font-size: 36px; font-weight: bold; margin: 0;">R$ ${formatarMoeda(totalVendasHoje)}</p>
                            </div>
                            <span style="font-size: 32px; opacity: 0.5;">💵</span>
                        </div>
                        <small style="opacity: 0.8;">${hoje.toLocaleDateString('pt-BR')}</small>
                    </div>
                    
                    <div class="card-dashboard" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 25px; border-radius: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h3 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">📊 Vendas do Mês</h3>
                                <p style="font-size: 36px; font-weight: bold; margin: 0;">R$ ${formatarMoeda(totalVendasMes)}</p>
                            </div>
                            <span style="font-size: 32px; opacity: 0.5;">📊</span>
                        </div>
                        <small style="opacity: 0.8;">Desde ${inicioMes.toLocaleDateString('pt-BR')}</small>
                    </div>
                </div>
                
                ${(produtosBaixoEstoque > 0 || produtosEsgotados > 0) ? `
                    <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        ${produtosBaixoEstoque > 0 ? `
                            <div style="padding: 15px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; color: #856404;">
                                <strong>⚠️ Atenção:</strong> ${produtosBaixoEstoque} produto(s) com estoque baixo (≤ 5 unidades)
                            </div>
                        ` : ''}
                        ${produtosEsgotados > 0 ? `
                            <div style="padding: 15px; background: #f8d7da; border: 2px solid #dc3545; border-radius: 8px; color: #721c24;">
                                <strong>🔴 Alerta:</strong> ${produtosEsgotados} produto(s) esgotado(s)
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${graficoHTML}
                
                <div style="margin-top: 20px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 15px 0;">📈 Resumo Geral</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        <div>
                            <p style="color: #666; margin: 0;">Total em Vendas</p>
                            <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 5px 0;">R$ ${formatarMoeda(totalVendasGeral)}</p>
                        </div>
                        <div>
                            <p style="color: #666; margin: 0;">Ticket Médio</p>
                            <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 5px 0;">R$ ${vendasResult.vendas && vendasResult.vendas.length > 0 ? formatarMoeda(totalVendasGeral / vendasResult.vendas.length) : '0,00'}</p>
                        </div>
                    </div>
                </div>
            </section>
        `;
        
    } catch (error) {
        app.innerHTML = `
            <section>
                <h2>🏠 Dashboard</h2>
                <div style="text-align: center; padding: 40px; color: #e53e3e;">
                    <p style="font-size: 48px;">😕</p>
                    <p>❌ Erro ao carregar dados: ${error.message}</p>
                    <button onclick="renderHome()" class="btn-primary" style="
                        background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 10px;
                    ">🔄 Tentar novamente</button>
                </div>
            </section>
        `;
    }
}

function criarGraficoVendasSimples(vendas) {
    if (!vendas || vendas.length === 0) return '';
    const vendasPorDia = {};
    const hoje = new Date();
    const ultimos7Dias = [];
    for (let i = 6; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        ultimos7Dias.push(dataStr);
        vendasPorDia[dataStr] = 0;
    }
    vendas.forEach(venda => {
        const dataVenda = new Date(venda.data);
        const dataStr = dataVenda.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const total = parseFloat(venda.total) || 0;
        if (vendasPorDia[dataStr] !== undefined) vendasPorDia[dataStr] += total;
    });
    const valores = ultimos7Dias.map(d => vendasPorDia[d]);
    const maxValor = Math.max(...valores, 1);
    return `
        <div style="margin-top: 20px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 20px 0;">📊 Vendas dos Últimos 7 Dias</h3>
            <div style="display: flex; align-items: flex-end; gap: 8px; height: 200px; padding: 0 10px;">
                ${ultimos7Dias.map((dia, i) => {
                    const altura = Math.max((valores[i] / maxValor) * 100, 1);
                    return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;">
                            <span style="font-size: 10px; margin-bottom: 5px; color: #667eea; font-weight: bold;">
                                ${valores[i] > 0 ? 'R$ ' + valores[i].toFixed(0) : ''}
                            </span>
                            <div style="
                                background: linear-gradient(180deg, #667eea, #764ba2); 
                                width: 100%; 
                                height: ${altura}%; 
                                border-radius: 4px 4px 0 0;
                                transition: all 0.3s ease;
                                cursor: pointer;
                            " title="${dia}: R$ ${valores[i].toFixed(2)}"
                               onmouseover="this.style.opacity='0.8'" 
                               onmouseout="this.style.opacity='1'">
                            </div>
                            <span style="font-size: 10px; margin-top: 8px; color: #666;">${dia}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function atualizarDashboard() {
    mostrarToast('Atualizando dashboard...', 'info');
    Cache.clear();
    renderHome();
}

function formatarMoeda(valor) {
    return valor.toFixed(2).replace('.', ',');
}

// ======================================
// CADASTRO DE PRODUTOS
// ======================================
function renderCadastro() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>➕ Cadastrar Produto</h2>
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <form id="formCadastro" autocomplete="off">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: #4a5568; font-weight: 500;">
                            Nome do Produto *
                        </label>
                        <input type="text" id="nome" required 
                               placeholder="Digite o nome do produto"
                               style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; transition: border-color 0.2s;"
                               onfocus="this.style.borderColor='#667eea'" 
                               onblur="this.style.borderColor='#e2e8f0'">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: #4a5568; font-weight: 500;">
                            Preço (R$) *
                        </label>
                        <input type="number" id="preco" step="0.01" required 
                               placeholder="0,00"
                               style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; transition: border-color 0.2s;"
                               onfocus="this.style.borderColor='#667eea'" 
                               onblur="this.style.borderColor='#e2e8f0'">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: #4a5568; font-weight: 500;">
                            Quantidade *
                        </label>
                        <input type="number" id="quantidade" required 
                               placeholder="0"
                               style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; transition: border-color 0.2s;"
                               onfocus="this.style.borderColor='#667eea'" 
                               onblur="this.style.borderColor='#e2e8f0'">
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" type="submit" style="
                            background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500; flex: 1;
                        ">
                            ✅ Cadastrar Produto
                        </button>
                        <button type="button" onclick="document.getElementById('formCadastro').reset(); document.getElementById('msg').innerHTML = '';" style="
                            background: #e2e8f0; color: #4a5568; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;
                        ">
                            🗑️ Limpar
                        </button>
                    </div>
                </form>
                <div id="msg" style="margin-top: 20px;"></div>
            </div>
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
        msg.innerHTML = '<div style="padding: 12px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">❌ Por favor, informe o nome do produto</div>';
        mostrarToast('Nome do produto é obrigatório', 'error');
        return;
    }
    if (isNaN(preco) || preco <= 0) {
        msg.innerHTML = '<div style="padding: 12px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">❌ Por favor, informe um preço válido</div>';
        mostrarToast('Preço inválido', 'error');
        return;
    }
    if (isNaN(quantidade) || quantidade < 0) {
        msg.innerHTML = '<div style="padding: 12px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">❌ Por favor, informe uma quantidade válida</div>';
        mostrarToast('Quantidade inválida', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Cadastrando...';
    submitBtn.disabled = true;
    
    try {
        const result = await callAPI('cadastrarProduto', { nome, preco, quantidade }, false);
        if (result.success) {
            msg.innerHTML = '<div style="padding: 12px; background: #c6f6d5; color: #22543d; border-radius: 6px;">✅ Produto cadastrado com sucesso!</div>';
            mostrarToast(`Produto "${nome}" cadastrado com sucesso!`, 'success');
            e.target.reset();
            Cache.clear();
        } else {
            msg.innerHTML = `<div style="padding: 12px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">❌ ${result.error || 'Erro ao cadastrar produto'}</div>`;
            mostrarToast(result.error || 'Erro ao cadastrar produto', 'error');
        }
    } catch (error) {
        msg.innerHTML = `<div style="padding: 12px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">❌ Erro de conexão: ${error.message}</div>`;
        mostrarToast('Erro de conexão', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ======================================
// ESTOQUE
// ======================================
async function renderEstoque() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>📦 Estoque</h2>
            <div style="text-align: center; padding: 40px;">
                <div class="loading-spinner" style="font-size: 32px;">⏳</div>
                <p style="color: #667eea; margin-top: 10px;">Carregando estoque...</p>
            </div>
        </section>
    `;
    
    try {
        const result = await callAPI('listarProdutos');
        let html = '';
        if (result.success && result.produtos && result.produtos.length > 0) {
            result.produtos.forEach(produto => {
                const quantidade = parseInt(produto.quantidade) || 0;
                const preco = parseFloat(produto.preco) || 0;
                const statusEstoque = quantidade === 0 ? '🔴' : quantidade <= 5 ? '🟡' : '🟢';
                const statusTexto = quantidade === 0 ? 'Esgotado' : quantidade <= 5 ? 'Baixo' : 'Normal';
                const classeLinha = quantidade === 0 ? 'style="background: #fff5f5;"' : '';
                html += `
                    <tr ${classeLinha}>
                        <td>${produto.id}</td>
                        <td><strong>${produto.nome}</strong></td>
                        <td>${statusEstoque} ${quantidade} <small style="color: #666;">(${statusTexto})</small></td>
                        <td>R$ ${preco.toFixed(2).replace('.', ',')}</td>
                        <td>R$ ${(preco * quantidade).toFixed(2).replace('.', ',')}</td>
                        <td>
                            <button onclick="confirmarExclusaoProduto(${produto.id}, '${produto.nome.replace(/'/g, "\\'")}')" 
                                    style="background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                🗑️ Excluir
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            html = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <p style="font-size: 48px;">📭</p>
                        <p style="color: #666;">${result.success ? 'Nenhum produto cadastrado' : 'Erro ao carregar produtos'}</p>
                    </td>
                </tr>
            `;
        }
        
        app.innerHTML = `
            <section>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>📦 Estoque</h2>
                    <button onclick="renderEstoque()" class="btn-primary" style="
                        background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;
                    ">
                        🔄 Atualizar
                    </button>
                </div>
                <div style="margin-bottom: 15px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                    <span style="font-size: 14px;">🟢 Normal | 🟡 Baixo (≤5) | 🔴 Esgotado</span>
                </div>
                <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 12px; text-align: left; color: #4a5568;">ID</th>
                                    <th style="padding: 12px; text-align: left; color: #4a5568;">Produto</th>
                                    <th style="padding: 12px; text-align: left; color: #4a5568;">Quantidade</th>
                                    <th style="padding: 12px; text-align: left; color: #4a5568;">Preço Unit.</th>
                                    <th style="padding: 12px; text-align: left; color: #4a5568;">Valor Total</th>
                                    <th style="padding: 12px; text-align: center; color: #4a5568;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>${html}</tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    } catch (error) {
        app.innerHTML = `
            <section>
                <h2>📦 Estoque</h2>
                <div style="text-align: center; padding: 40px; color: #e53e3e;">
                    <p style="font-size: 48px;">😕</p>
                    <p>❌ Erro ao carregar estoque: ${error.message}</p>
                    <button onclick="renderEstoque()" class="btn-primary" style="
                        background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 10px;
                    ">🔄 Tentar novamente</button>
                </div>
            </section>
        `;
    }
}

function confirmarExclusaoProduto(id, nome) {
    confirmarAcao(
        `Deseja realmente excluir o produto "${nome}"? Esta ação não pode ser desfeita.`,
        async () => {
            try {
                const result = await callAPI('excluirProduto', { id }, false);
                if (result.success) {
                    mostrarToast(`Produto "${nome}" excluído com sucesso!`, 'success');
                    Cache.clear();
                    renderEstoque();
                } else {
                    mostrarToast(result.error || 'Erro ao excluir produto', 'error');
                }
            } catch (error) {
                mostrarToast('Erro de conexão ao excluir produto', 'error');
            }
        },
        'Excluir',
        'Cancelar'
    );
}

// ======================================
// VENDAS (NOVA VERSÃO COM MÚLTIPLOS PRODUTOS)
// ======================================
let itensVenda = []; // Array para armazenar os itens da venda atual
let produtosDisponiveis = []; // Cache dos produtos
let clientesDisponiveis = []; // Cache dos clientes

async function renderVendas() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>💰 Registrar Venda (Múltiplos Produtos)</h2>
            <div style="text-align: center; padding: 40px;">
                <div class="loading-spinner" style="font-size: 32px;">⏳</div>
                <p style="color: #667eea; margin-top: 10px;">Carregando dados...</p>
            </div>
        </section>
    `;

    try {
        // Carrega produtos e clientes em paralelo
        const [prodResult, clientResult] = await Promise.all([
            callAPI('listarProdutos', null, false),
            callAPI('listarVendasPorCliente', null, false)
        ]);

        if (prodResult.success && prodResult.produtos) {
            produtosDisponiveis = prodResult.produtos.filter(p => parseInt(p.quantidade) > 0);
        } else {
            produtosDisponiveis = [];
        }

        if (clientResult.success && clientResult.clientes) {
            // Extrai nomes únicos de clientes
            clientesDisponiveis = [...new Set(clientResult.clientes.map(c => c.nome).filter(n => n && n !== 'Cliente não informado'))];
            clientesDisponiveis.sort();
        } else {
            clientesDisponiveis = [];
        }

        // Inicializa a lista de itens com 4 linhas vazias
        itensVenda = [
            { produtoId: '', quantidade: 1 },
            { produtoId: '', quantidade: 1 },
            { produtoId: '', quantidade: 1 },
            { produtoId: '', quantidade: 1 }
        ];

        renderizarFormularioVenda(app);

    } catch (error) {
        app.innerHTML = `
            <section>
                <h2>💰 Registrar Venda</h2>
                <div style="text-align: center; padding: 40px; color: #e53e3e;">
                    <p style="font-size: 48px;">😕</p>
                    <p>❌ Erro ao carregar dados: ${error.message}</p>
                    <button onclick="renderVendas()" class="btn-primary" style="
                        background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 10px;
                    ">🔄 Tentar novamente</button>
                </div>
            </section>
        `;
    }
}

function renderizarFormularioVenda(app) {
    // Gera opções de produtos (apenas com estoque)
    let produtoOptions = '<option value="">Selecione um produto...</option>';
    produtosDisponiveis.forEach(p => {
        const preco = parseFloat(p.preco) || 0;
        const disp = parseInt(p.quantidade) || 0;
        produtoOptions += `<option value="${p.id}" data-preco="${preco}" data-max="${disp}" data-nome="${p.nome}">
            ${p.nome} (${disp} disp.) - R$ ${preco.toFixed(2).replace('.', ',')}
        </option>`;
    });

    // Gera opções de clientes
    let clienteOptions = '<option value="">Selecione um cliente...</option>';
    clientesDisponiveis.forEach(nome => {
        clienteOptions += `<option value="${nome}">${nome}</option>`;
    });

    // Gera os campos para os itens
    let itensHTML = '';
    itensVenda.forEach((item, index) => {
        itensHTML += `
            <div class="produto-linha" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; background: #f9fafb; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                <div style="flex: 3; min-width: 200px;">
                    <select id="produto_${index}" class="select-produto" data-index="${index}" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        ${produtoOptions}
                    </select>
                </div>
                <div style="flex: 1; min-width: 80px;">
                    <label style="font-size: 12px; color: #666;">Qtd</label>
                    <input type="number" id="qtd_${index}" class="input-qtd" data-index="${index}" min="1" max="999" value="${item.quantidade || 1}" 
                           style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                </div>
                <div style="flex: 1; min-width: 100px;">
                    <span id="subtotal_${index}" style="font-weight: bold; color: #667eea;">R$ 0,00</span>
                </div>
                ${index >= 4 ? `<button type="button" onclick="removerLinhaItem(${index})" style="background: #e53e3e; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>` : ''}
            </div>
        `;
    });

    // Total da venda
    const totalHTML = `
        <div style="text-align: right; font-size: 24px; font-weight: bold; margin: 20px 0; padding: 15px; background: #f0f4ff; border-radius: 8px;">
            Total da Venda: <span id="totalVenda" style="color: #667eea;">R$ 0,00</span>
        </div>
    `;

    // Monta o HTML completo
    app.innerHTML = `
        <section>
            <h2>💰 Registrar Venda (Múltiplos Produtos)</h2>
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <form id="formVendaMulti" autocomplete="off">
                    <!-- Cliente -->
                    <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <div style="flex: 2; min-width: 200px;">
                            <label style="display: block; margin-bottom: 8px; color: #4a5568; font-weight: 500;">Cliente *</label>
                            <select id="clienteVenda" required style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                                ${clienteOptions}
                            </select>
                        </div>
                        <div style="flex: 1; min-width: 150px; align-self: flex-end;">
                            <button type="button" onclick="adicionarNovoCliente()" style="
                                background: #48bb78; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; width: 100%;
                            ">
                                ➕ Novo Cliente
                            </button>
                        </div>
                    </div>

                    <!-- Itens da venda -->
                    <div id="containerItens">
                        ${itensHTML}
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button type="button" onclick="adicionarLinhaItem()" style="
                            background: #4299e1; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;
                        ">
                            ➕ Adicionar mais item
                        </button>
                    </div>

                    ${totalHTML}

                    <button class="btn-primary" type="submit" style="
                        background: #48bb78; color: white; border: none; padding: 14px 24px; border-radius: 6px; cursor: pointer; font-weight: 500; width: 100%; font-size: 18px;
                    ">
                        💰 Registrar Venda
                    </button>
                </form>
                <div id="msgVendaMulti" style="margin-top: 20px;"></div>
            </div>
        </section>
    `;

    // Adiciona eventos de mudança para recalcular subtotais
    document.querySelectorAll('.select-produto, .input-qtd').forEach(el => {
        el.addEventListener('change', atualizarSubtotais);
        el.addEventListener('input', atualizarSubtotais);
    });

    // Submete o formulário
    document.getElementById('formVendaMulti').addEventListener('submit', registrarVendaMulti);

    // Inicializa os subtotais
    atualizarSubtotais();
}

function adicionarLinhaItem() {
    if (itensVenda.length >= 10) {
        mostrarToast('Limite de 10 itens por venda', 'warning');
        return;
    }
    itensVenda.push({ produtoId: '', quantidade: 1 });
    renderizarFormularioVenda(document.getElementById('app'));
}

function removerLinhaItem(index) {
    if (itensVenda.length <= 1) {
        mostrarToast('É necessário pelo menos um item', 'warning');
        return;
    }
    itensVenda.splice(index, 1);
    renderizarFormularioVenda(document.getElementById('app'));
}

function atualizarSubtotais() {
    let totalGeral = 0;
    itensVenda.forEach((item, index) => {
        const select = document.getElementById(`produto_${index}`);
        const qtdInput = document.getElementById(`qtd_${index}`);
        const subtotalSpan = document.getElementById(`subtotal_${index}`);
        
        if (!select || !qtdInput || !subtotalSpan) return;

        const produtoId = select.value;
        const qtd = parseInt(qtdInput.value) || 0;
        let subtotal = 0;

        if (produtoId) {
            const option = select.options[select.selectedIndex];
            const preco = parseFloat(option.dataset.preco) || 0;
            const maxDisp = parseInt(option.dataset.max) || 0;
            subtotal = preco * qtd;
            totalGeral += subtotal;

            // Valida quantidade máxima
            if (qtd > maxDisp) {
                qtdInput.style.borderColor = '#e53e3e';
                subtotalSpan.textContent = `⚠️ ${maxDisp} disp.`;
            } else {
                qtdInput.style.borderColor = '#e2e8f0';
                subtotalSpan.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
            }
        } else {
            subtotalSpan.textContent = 'R$ 0,00';
        }
    });

    document.getElementById('totalVenda').textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
}

function adicionarNovoCliente() {
    const nome = prompt('Digite o nome do novo cliente:');
    if (nome && nome.trim()) {
        const nomeLimpo = nome.trim();
        // Adiciona à lista local e ao dropdown
        if (!clientesDisponiveis.includes(nomeLimpo)) {
            clientesDisponiveis.push(nomeLimpo);
            clientesDisponiveis.sort();
        }
        const select = document.getElementById('clienteVenda');
        if (select) {
            const option = document.createElement('option');
            option.value = nomeLimpo;
            option.textContent = nomeLimpo;
            select.appendChild(option);
            select.value = nomeLimpo;
            mostrarToast(`Cliente "${nomeLimpo}" adicionado!`, 'success');
        }
    }
}

async function registrarVendaMulti(e) {
    e.preventDefault();
    const msg = document.getElementById('msgVendaMulti');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Registrando...';
    submitBtn.disabled = true;
    msg.innerHTML = '';

    // Valida cliente
    const clienteSelect = document.getElementById('clienteVenda');
    const cliente = clienteSelect.value.trim();
    if (!cliente) {
        msg.innerHTML = '<div style="padding: 12px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">❌ Selecione ou cadastre um cliente</div>';
        mostrarToast('Cliente obrigatório', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }

    // Coleta os itens validados
    const itens = [];
    let temErro = false;
    for (let i = 0; i < itensVenda.length; i++) {
        const select = document.getElementById(`produto_${i}`);
        const qtdInput = document.getElementById(`qtd_${i}`);
        if (!select || !qtdInput) continue;
        const produtoId = select.value;
        const qtd = parseInt(qtdInput.value) || 0;
        if (!produtoId) continue; // ignora linhas vazias
        const option = select.options[select.selectedIndex];
        const maxDisp = parseInt(option.dataset.max) || 0;
        if (qtd <= 0) {
            msg.innerHTML = `<div style="padding: 12px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">❌ Quantidade inválida para o item ${i+1}</div>`;
            temErro = true;
            break;
        }
        if (qtd > maxDisp) {
            msg.innerHTML = `<div style="padding: 12px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">❌ Quantidade insuficiente para "${option.dataset.nome}". Disponível: ${maxDisp}</div>`;
            temErro = true;
            break;
        }
        itens.push({ produtoId, quantidade: qtd, nome: option.dataset.nome, preco: parseFloat(option.dataset.preco) });
    }

    if (temErro || itens.length === 0) {
        if (itens.length === 0) {
            msg.innerHTML = '<div style="padding: 12px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">❌ Adicione pelo menos um produto</div>';
            mostrarToast('Nenhum produto selecionado', 'error');
        }
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }

    // Calcula total
    const total = itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    // Confirmação
    confirmarAcao(
        `Confirmar venda para ${cliente}?<br>
         ${itens.map(i => `${i.nome} (${i.quantidade}x)`).join('<br>')}
         <br><strong>Total: R$ ${total.toFixed(2).replace('.', ',')}</strong>`,
        async () => {
            try {
                // Para cada item, chama a API de venda individual
                let falhas = [];
                for (const item of itens) {
                    const result = await callAPI('registrarVenda', {
                        produtoId: item.produtoId,
                        quantidade: item.quantidade,
                        cliente: cliente
                    }, false);
                    if (!result.success) {
                        falhas.push(`${item.nome}: ${result.error || 'Erro desconhecido'}`);
                    }
                }

                if (falhas.length === 0) {
                    msg.innerHTML = `
                        <div style="padding: 15px; background: #c6f6d5; color: #22543d; border-radius: 6px;">
                            <strong>✅ Venda registrada com sucesso!</strong><br>
                            Cliente: ${cliente}<br>
                            Itens: ${itens.map(i => `${i.nome} (${i.quantidade})`).join(', ')}<br>
                            Total: R$ ${total.toFixed(2).replace('.', ',')}
                        </div>
                    `;
                    mostrarToast(`Venda de R$ ${total.toFixed(2).replace('.', ',')} registrada!`, 'success');
                    Cache.clear();
                    // Recarrega a página de vendas após 2 segundos
                    setTimeout(() => renderVendas(), 2000);
                } else {
                    msg.innerHTML = `
                        <div style="padding: 15px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">
                            <strong>⚠️ Venda parcialmente registrada</strong><br>
                            Itens com erro: ${falhas.join('; ')}
                        </div>
                    `;
                    mostrarToast('Alguns itens falharam. Verifique o estoque.', 'warning');
                }
            } catch (error) {
                msg.innerHTML = `<div style="padding: 12px; background: #fed7d7; color: #9b2c2c; border-radius: 6px;">❌ Erro de conexão: ${error.message}</div>`;
                mostrarToast('Erro de conexão', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        },
        'Confirmar Venda',
        'Cancelar'
    );
}

// ======================================
// CLIENTES
// ======================================
async function renderClientes() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>👥 Clientes</h2>
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" id="buscaCliente" 
                               placeholder="🔍 Buscar cliente..." 
                               style="flex: 1; padding: 12px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; transition: border-color 0.2s;"
                               onfocus="this.style.borderColor='#667eea'" 
                               onblur="this.style.borderColor='#e2e8f0'">
                        <button onclick="document.getElementById('buscaCliente').value = ''; carregarTabelaClientes();" 
                                style="background: #e2e8f0; color: #4a5568; border: none; padding: 12px 16px; border-radius: 6px; cursor: pointer;">
                            ✕ Limpar
                        </button>
                    </div>
                </div>
                <div id="tabelaClientes">
                    <div style="text-align: center; padding: 20px;">
                        <div class="loading-spinner" style="font-size: 24px;">⏳</div>
                        <p style="color: #667eea;">Carregando clientes...</p>
                    </div>
                </div>
                <div id="detalhesCliente" style="margin-top: 20px;"></div>
            </div>
        </section>
    `;
    
    document.getElementById('buscaCliente').addEventListener('input', (e) => {
        StateManager.setFiltro(e.target.value);
        carregarTabelaClientes(e.target.value);
    });
    
    await carregarTabelaClientes();
}

async function carregarTabelaClientes(filtro = '') {
    const container = document.getElementById('tabelaClientes');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="loading-spinner" style="font-size: 24px;">⏳</div>
            <p style="color: #667eea;">Atualizando...</p>
        </div>
    `;
    
    try {
        const result = await callAPI('listarVendasPorCliente', null, false);
        let html = '';
        
        if (result.success && result.clientes && result.clientes.length > 0) {
            let clientesFiltrados = result.clientes.filter(c => 
                c.nome && c.nome !== 'Cliente não informado'
            );
            
            if (filtro) {
                clientesFiltrados = clientesFiltrados.filter(c => 
                    c.nome.toLowerCase().includes(filtro.toLowerCase())
                );
            }
            
            if (clientesFiltrados.length > 0) {
                clientesFiltrados.sort((a, b) => (parseFloat(b.totalGasto) || 0) - (parseFloat(a.totalGasto) || 0));
                
                clientesFiltrados.forEach(cliente => {
                    const totalGasto = parseFloat(cliente.totalGasto) || 0;
                    const totalPago = parseFloat(cliente.totalPago) || 0;
                    const saldo = totalGasto - totalPago;
                    const statusSaldo = saldo > 0.01 ? '🔴' : saldo < -0.01 ? '🟡' : '🟢';
                    const statusTexto = saldo > 0.01 ? 'Deve' : saldo < -0.01 ? 'Crédito' : 'Quitado';
                    
                    html += `
                        <tr onclick="mostrarDetalhesCliente('${cliente.nome.replace(/'/g, "\\'")}')" 
                            style="cursor: pointer;"
                            onmouseover="this.style.background='#f7fafc'" 
                            onmouseout="this.style.background='white'">
                            <td><strong>${cliente.nome}</strong></td>
                            <td>R$ ${totalGasto.toFixed(2).replace('.', ',')}</td>
                            <td>R$ ${totalPago.toFixed(2).replace('.', ',')}</td>
                            <td>${statusSaldo} <strong>R$ ${Math.abs(saldo).toFixed(2).replace('.', ',')}</strong> <small>(${statusTexto})</small></td>
                        </tr>
                    `;
                });
            } else {
                html = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 40px;">
                            <p style="font-size: 48px;">🔍</p>
                            <p style="color: #666;">Nenhum cliente encontrado com "${filtro}"</p>
                        </td>
                    </tr>
                `;
            }
        } else {
            html = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px;">
                        <p style="font-size: 48px;">📭</p>
                        <p style="color: #666;">${result.success ? 'Nenhum cliente cadastrado' : 'Erro ao carregar clientes'}</p>
                        ${!result.success ? `<p style="color: #e53e3e; font-size: 14px;">${result.error || ''}</p>` : ''}
                    </td>
                </tr>
            `;
        }
        
        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 12px; text-align: left; color: #4a5568;">Cliente</th>
                            <th style="padding: 12px; text-align: left; color: #4a5568;">Total Gasto</th>
                            <th style="padding: 12px; text-align: left; color: #4a5568;">Total Pago</th>
                            <th style="padding: 12px; text-align: left; color: #4a5568;">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>${html}</tbody>
                </table>
            </div>
            <div style="margin-top: 10px; padding: 10px; background: #f7fafc; border-radius: 6px; font-size: 12px; color: #666;">
                🟢 Quitado | 🔴 Em débito | 🟡 Crédito | Clique no cliente para ver detalhes
            </div>
        `;
        
    } catch (error) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e53e3e;">
                <p>❌ Erro ao carregar clientes: ${error.message}</p>
                <button onclick="carregarTabelaClientes()" style="
                    background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;
                ">🔄 Tentar novamente</button>
            </div>
        `;
    }
}

async function mostrarDetalhesCliente(nomeCliente) {
    const container = document.getElementById('detalhesCliente');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="loading-spinner" style="font-size: 24px;">⏳</div>
            <p style="color: #667eea;">Carregando histórico de ${nomeCliente}...</p>
        </div>
    `;
    
    try {
        const result = await callAPI(`listarDetalhesCliente&cliente=${encodeURIComponent(nomeCliente)}`, null, false);
        
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
                        <td>R$ ${(parseFloat(h.total) || 0).toFixed(2).replace('.', ',')}</td>
                    </tr>
                `;
            }).join('');
            
            const totalGasto = result.historico.reduce((acc, h) => acc + (parseFloat(h.total) || 0), 0);
            
            // Buscar informações de pagamento
            const pagamentosResult = await callAPI('listarVendasPorCliente', null, false);
            let totalPago = 0;
            if (pagamentosResult.success && pagamentosResult.clientes) {
                const cliente = pagamentosResult.clientes.find(c => 
                    c.nome.toLowerCase() === nomeCliente.toLowerCase()
                );
                if (cliente) {
                    totalPago = parseFloat(cliente.totalPago) || 0;
                }
            }
            
            const saldo = totalGasto - totalPago;
            const statusSaldo = saldo > 0.01 ? 'Deve' : saldo < -0.01 ? 'Crédito' : 'Quitado';
            const corSaldo = saldo > 0.01 ? '#e53e3e' : saldo < -0.01 ? '#dd6b20' : '#38a169';
            
            container.innerHTML = `
                <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">📋 ${nomeCliente}</h3>
                        <button onclick="document.getElementById('detalhesCliente').innerHTML = ''" 
                                style="background: #e53e3e; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            ✕ Fechar
                        </button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 25px;">
                        <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                            <p style="color: #666; margin: 0; font-size: 14px;">Total de Compras</p>
                            <p style="font-size: 28px; font-weight: bold; margin: 5px 0; color: #667eea;">${result.historico.length}</p>
                        </div>
                        <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                            <p style="color: #666; margin: 0; font-size: 14px;">Total Gasto</p>
                            <p style="font-size: 28px; font-weight: bold; margin: 5px 0; color: #667eea;">R$ ${totalGasto.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                            <p style="color: #666; margin: 0; font-size: 14px;">Total Pago</p>
                            <p style="font-size: 28px; font-weight: bold; margin: 5px 0; color: #48bb78;">R$ ${totalPago.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div style="background: ${saldo > 0.01 ? '#fff5f5' : saldo < -0.01 ? '#fffff0' : '#f0fff4'}; padding: 15px; border-radius: 8px;">
                            <p style="color: #666; margin: 0; font-size: 14px;">Saldo</p>
                            <p style="font-size: 28px; font-weight: bold; margin: 5px 0; color: ${corSaldo};">
                                R$ ${Math.abs(saldo).toFixed(2).replace('.', ',')}
                            </p>
                            <small style="color: ${corSaldo};">${statusSaldo}</small>
                        </div>
                    </div>
                    
                    <h4 style="margin: 0 0 15px 0;">📜 Histórico de Compras</h4>
                    <div style="overflow-x: auto; margin-bottom: 25px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 10px; text-align: left;">Data</th>
                                    <th style="padding: 10px; text-align: left;">Produto</th>
                                    <th style="padding: 10px; text-align: left;">Qtd</th>
                                    <th style="padding: 10px; text-align: left;">Valor</th>
                                </tr>
                            </thead>
                            <tbody>${historicoHtml}</tbody>
                        </table>
                    </div>
                    
                    <div style="padding: 20px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4 style="margin: 0 0 15px 0;">💳 Registrar Pagamento</h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <input type="number" id="valorPagamento" 
                                   placeholder="Valor do pagamento" 
                                   min="0.01" step="0.01"
                                   style="flex: 1; padding: 12px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; min-width: 150px;">
                            <button onclick="registrarPagamentoCliente('${nomeCliente.replace(/'/g, "\\'")}')" 
                                    style="background: #48bb78; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500; white-space: nowrap;">
                                💵 Registrar Pagamento
                            </button>
                        </div>
                        <div id="msgPagamento" style="margin-top: 15px;"></div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">📋 ${nomeCliente}</h3>
                        <button onclick="document.getElementById('detalhesCliente').innerHTML = ''" 
                                style="background: #e53e3e; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            ✕ Fechar
                        </button>
                    </div>
                    <div style="text-align: center; padding: 40px;">
                        <p style="font-size: 48px;">📭</p>
                        <p style="color: #666;">Nenhum histórico de compras encontrado para este cliente.</p>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        container.innerHTML = `
            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
                <p style="color: #e53e3e;">❌ Erro ao carregar detalhes: ${error.message}</p>
                <button onclick="document.getElementById('detalhesCliente').innerHTML = ''" 
                        style="background: #e53e3e; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                    ✕ Fechar
                </button>
            </div>
        `;
    }
}

async function registrarPagamentoCliente(nomeCliente) {
    const valorInput = document.getElementById('valorPagamento');
    const msgDiv = document.getElementById('msgPagamento');
    if (!valorInput || !msgDiv) return;
    
    const valor = parseFloat(valorInput.value);
    if (isNaN(valor) || valor <= 0) {
        msgDiv.innerHTML = '<div style="padding: 10px; background: #fed7d7; color: #9b2c2c; border-radius: 4px;">❌ Informe um valor válido maior que zero</div>';
        mostrarToast('Valor inválido', 'error');
        return;
    }
    
    confirmarAcao(
        `Confirmar pagamento de R$ ${valor.toFixed(2).replace('.', ',')} de ${nomeCliente}?`,
        async () => {
            msgDiv.innerHTML = '<p style="color: #667eea;">⏳ Registrando pagamento...</p>';
            try {
                const result = await callAPI('registrarPagamento', {
                    cliente: nomeCliente,
                    valor: valor,
                    observacao: 'Pagamento registrado pelo sistema'
                }, false);
                if (result.success) {
                    msgDiv.innerHTML = `
                        <div style="padding: 10px; background: #c6f6d5; color: #22543d; border-radius: 4px;">
                            ✅ Pagamento de R$ ${valor.toFixed(2).replace('.', ',')} registrado com sucesso!
                        </div>
                    `;
                    mostrarToast(`Pagamento de R$ ${valor.toFixed(2).replace('.', ',')} registrado!`, 'success');
                    valorInput.value = '';
                    Cache.clear();
                    await carregarTabelaClientes(StateManager.getFiltro());
                    setTimeout(() => mostrarDetalhesCliente(nomeCliente), 500);
                } else {
                    msgDiv.innerHTML = `
                        <div style="padding: 10px; background: #fed7d7; color: #9b2c2c; border-radius: 4px;">
                            ❌ ${result.error || 'Erro ao registrar pagamento'}
                        </div>
                    `;
                    mostrarToast(result.error || 'Erro ao registrar pagamento', 'error');
                }
            } catch (error) {
                msgDiv.innerHTML = `
                    <div style="padding: 10px; background: #fed7d7; color: #9b2c2c; border-radius: 4px;">
                        ❌ Erro de conexão: ${error.message}
                    </div>
                `;
                mostrarToast('Erro de conexão', 'error');
            }
        },
        'Confirmar Pagamento',
        'Cancelar'
    );
}

// ======================================
// EXPORTAR FUNÇÕES GLOBAIS
// ======================================
window.mostrarDetalhesCliente = mostrarDetalhesCliente;
window.registrarPagamentoCliente = registrarPagamentoCliente;
window.renderHome = renderHome;
window.renderEstoque = renderEstoque;
window.renderVendas = renderVendas;
window.renderClientes = renderClientes;
window.renderCadastro = renderCadastro;
window.atualizarDashboard = atualizarDashboard;
window.carregarTabelaClientes = carregarTabelaClientes;
window.confirmarExclusaoProduto = confirmarExclusaoProduto;
window.adicionarLinhaItem = adicionarLinhaItem;
window.removerLinhaItem = removerLinhaItem;
window.adicionarNovoCliente = adicionarNovoCliente;

console.log('🚀 Sistema de Vendas v4.0 inicializado!');
console.log('✨ Novidades:');
console.log('  - Venda com múltiplos produtos (até 10 itens)');
console.log('  - Dropdown de clientes com cadastro rápido');
console.log('  - Tratamento de erros aprimorado');
console.log('  - Timeout nas requisições');
console.log('⌨️ Atalhos: Ctrl+1 a Ctrl+5 para navegar');

window.cadastrarProduto = cadastrarProduto;
window.registrarVendaMulti = registrarVendaMulti;
window.renderVendas = renderVendas;
window.renderClientes = renderClientes;
window.renderEstoque = renderEstoque;
window.renderCadastro = renderCadastro;
window.atualizarDashboard = atualizarDashboard;
window.carregarTabelaClientes = carregarTabelaClientes;
window.confirmarExclusaoProduto = confirmarExclusaoProduto;
window.adicionarLinhaItem = adicionarLinhaItem;
window.removerLinhaItem = removerLinhaItem;
window.adicionarNovoCliente = adicionarNovoCliente;
window.mostrarToast = mostrarToast;
window.confirmarAcao = confirmarAcao;
