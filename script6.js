// ============================================================
// SISTEMA DE VENDAS - VERSÃO CORRIGIDA V9.0
// ============================================================

(function() {
    'use strict';

    console.log('🚀 Iniciando Sistema de Vendas V9.0...');

    // ============================================================
    // CONFIGURAÇÕES
    // ============================================================
    const CONFIG = {
        API_URL: 'https://script.google.com/macros/s/AKfycbzDoNt-58HOvCOqCr2xuXGVuFs4AFjJAiAwuEO3kF82dEmzt8_fq2NNgRPeEbHix2Q-2A/exec',
        PIX: {
            chave: '27194177854',
            nomeRecebedor: 'Roberta Bento',
            cidade: 'Monte Azul Pta-SP'
        },
        MARCAS: ['Natura', 'Mary Kay', 'Eudora', 'Boticário', 'Outra'],
        CATEGORIAS: ['Perfumaria', 'Maquiagem', 'Cuidados com a Pele', 'Cuidados com o Corpo', 'Cabelos', 'Infantil', 'Masculina', 'Kit', 'Outra']
    };

    // ============================================================
    // API CALL COM LOGS
    // ============================================================
    async function callAPI(action, data = null) {
        let url = `${CONFIG.API_URL}?action=${action}`;
        if (data) {
            const params = new URLSearchParams(data);
            url += `&${params.toString()}`;
        }

        console.log(`📤 Chamando API: ${action}`, url);

        try {
            const response = await fetch(url);
            console.log(`📥 Status da resposta: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log(`📥 Dados recebidos (${action}):`, result);
            
            // Verificar se a resposta tem a estrutura esperada
            if (result && typeof result === 'object') {
                return result;
            } else {
                console.warn(`⚠️ Resposta inesperada para ${action}:`, result);
                return { success: false, error: 'Resposta inválida da API' };
            }
        } catch (error) {
            console.error(`❌ Erro na API (${action}):`, error);
            return { success: false, error: error.message };
        }
    }

    // ============================================================
    // TOAST
    // ============================================================
    function mostrarToast(mensagem, tipo = 'success') {
        const cores = { success: '#48bb78', error: '#e53e3e', warning: '#ed8936', info: '#4299e1' };
        const icones = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

        const toastAnterior = document.querySelector('.toast-notification');
        if (toastAnterior) toastAnterior.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        Object.assign(toast.style, {
            position: 'fixed', top: '20px', right: '20px',
            background: cores[tipo] || '#4299e1', color: 'white',
            padding: '12px 20px', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '10000', maxWidth: '350px',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontWeight: '500', fontSize: '14px'
        });
        toast.innerHTML = `<span style="font-size:18px;">${icones[tipo] || 'ℹ️'}</span><span>${mensagem}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 3000);
    }

    // ============================================================
    // CONFIRMAÇÃO
    // ============================================================
    function confirmarAcao(mensagem, callback, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar') {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: '9999'
        });
        overlay.innerHTML = `
            <div style="background:white; padding:20px; border-radius:12px; max-width:400px; width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                <div style="text-align:center; margin-bottom:12px;"><span style="font-size:36px;">⚠️</span></div>
                <h3 style="margin:0 0 8px 0; color:#2d3748; font-size:17px;">Confirmação</h3>
                <p style="color:#4a5568; margin:0 0 15px 0; line-height:1.4; font-size:14px;">${mensagem}</p>
                <div style="display:flex; gap:8px; justify-content:flex-end;">
                    <button class="btn-cancelar" style="background:#e2e8f0; color:#4a5568; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:500; font-size:13px;">${textoCancelar}</button>
                    <button class="btn-confirmar" style="background:#e53e3e; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:500; font-size:13px;">${textoConfirmar}</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('.btn-confirmar').onclick = () => {
            overlay.remove();
            callback();
        };
        overlay.querySelector('.btn-cancelar').onclick = () => overlay.remove();
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    // ============================================================
    // ESTILOS CSS
    // ============================================================
    function adicionarEstilosCSS() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
            .loading-spinner{animation:spin .8s linear infinite;display:inline-block}
            .card-dashboard{transition:all .2s ease}
            .card-dashboard:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(0,0,0,0.15)}
            .btn-primary{transition:all .15s ease;cursor:pointer}
            .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,0,0,0.1)}
            table tbody tr{transition:background .15s ease;cursor:pointer}
            table tbody tr:hover{background:#f7fafc !important}
            .badge-hoje{background:#48bb78;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;display:inline-block}
            .badge-atraso{background:#e53e3e;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;display:inline-block}
            .badge-futuro{background:#ed8936;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;display:inline-block}
            .btn-extrato{transition:all .2s ease;cursor:pointer}
            .btn-extrato:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.15)}
            .btn-cobrar{transition:all .2s ease;cursor:pointer}
            .btn-cobrar:hover{transform:scale(1.05)}
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // SAUDAÇÃO
    // ============================================================
    function obterSaudacao() {
        const agora = new Date();
        const hora = agora.getHours();
        let saudacao = hora >= 5 && hora < 12 ? 'Bom dia' : hora >= 12 && hora < 18 ? 'Boa tarde' : 'Boa noite';
        const horario = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return { saudacao, horario };
    }

    // ============================================================
    // GERENCIADOR DE ESTADO
    // ============================================================
    const StateManager = {
        currentPage: 'home',
        setPage(page) { this.currentPage = page; }
    };

    // ============================================================
    // NAVEGAÇÃO
    // ============================================================
    function inicializarNavegacao() {
        const navButtons = document.querySelectorAll('.nav-btn');
        console.log('🔘 Botões de navegação encontrados:', navButtons.length);

        navButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                const button = e.target.closest('.nav-btn');
                if (!button) return;
                navButtons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');

                const pageMap = {
                    'home': renderHome,
                    'estoque': renderEstoque,
                    'vendas': renderVendas,
                    'clientes': renderClientes,
                    'vendedora': renderVendedora
                };
                const page = button.dataset.page;
                console.log(`📄 Navegando para: ${page}`);
                if (pageMap[page]) {
                    StateManager.setPage(page);
                    setTimeout(() => pageMap[page](), 50);
                }
            });
        });
    }

    // ============================================================
    // HOME (DASHBOARD)
    // ============================================================
    async function renderHome() {
        console.log('🏠 Renderizando Home...');
        const app = document.getElementById('app');
        if (!app) {
            console.error('❌ Elemento #app não encontrado!');
            return;
        }

        const { saudacao, horario } = obterSaudacao();

        app.innerHTML = `
            <section>
                <h2>🏠 Dashboard</h2>
                <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:20px;border-radius:15px;margin-bottom:20px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="background:rgba(255,255,255,0.2);border-radius:50%;width:50px;height:50px;display:flex;align-items:center;justify-content:center;font-size:28px;">👩</div>
                            <div>
                                <p style="font-size:14px;margin:0;opacity:0.9;">${saudacao},</p>
                                <p style="font-size:28px;margin:2px 0 0 0;font-weight:700;">Roberta! 👋</p>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="background:rgba(255,255,255,0.15);padding:12px 16px;border-radius:10px;">
                                <p style="font-size:10px;margin:0;opacity:0.8;">Agora são</p>
                                <p style="font-size:24px;margin:0;font-weight:700;">${horario}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="text-align:center;padding:20px;">
                    <div class="loading-spinner" style="font-size:24px;">⏳</div>
                    <p style="color:#667eea;">Carregando dados...</p>
                </div>
            </section>
        `;

        try {
            // Testar conexão com a API
            console.log('📡 Testando conexão com a API...');
            const testResult = await callAPI('listarProdutos');
            console.log('📡 Resultado do teste:', testResult);

            if (!testResult.success) {
                throw new Error(`Erro na API: ${testResult.error || 'Resposta inválida'}`);
            }

            // Buscar dados
            const [produtosResult, vendasResult] = await Promise.all([
                callAPI('listarProdutos'),
                callAPI('listarVendas')
            ]);

            console.log('📦 Produtos recebidos:', produtosResult);
            console.log('💰 Vendas recebidas:', vendasResult);

            let totalProdutos = 0;
            let valorTotalEstoque = 0;

            // Verificar estrutura dos produtos
            if (produtosResult.success && produtosResult.produtos) {
                const produtos = Array.isArray(produtosResult.produtos) ? produtosResult.produtos : [];
                totalProdutos = produtos.length;
                produtos.forEach(produto => {
                    const preco = parseFloat(produto.preco) || 0;
                    const quantidade = parseInt(produto.quantidade) || 0;
                    valorTotalEstoque += preco * quantidade;
                });
            }

            let totalVendasGeral = 0;
            if (vendasResult.success && vendasResult.vendas) {
                const vendas = Array.isArray(vendasResult.vendas) ? vendasResult.vendas : [];
                vendas.forEach(v => {
                    totalVendasGeral += parseFloat(v.total) || 0;
                });
            }

            app.innerHTML = `
                <section>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <h2>🏠 Dashboard</h2>
                        <button onclick="window.renderHome()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:500;font-size:12px;">🔄 Atualizar</button>
                    </div>
                    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:20px;border-radius:15px;margin-bottom:20px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <div style="background:rgba(255,255,255,0.2);border-radius:50%;width:50px;height:50px;display:flex;align-items:center;justify-content:center;font-size:28px;">👩</div>
                                <div>
                                    <p style="font-size:14px;margin:0;opacity:0.9;">${saudacao},</p>
                                    <p style="font-size:28px;margin:2px 0 0 0;font-weight:700;">Roberta! 👋</p>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="background:rgba(255,255,255,0.15);padding:12px 16px;border-radius:10px;">
                                    <p style="font-size:10px;margin:0;opacity:0.8;">Agora são</p>
                                    <p style="font-size:24px;margin:0;font-weight:700;">${horario}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;">
                        <div class="card-dashboard" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:20px;border-radius:12px;">
                            <h3 style="margin:0 0 8px 0;font-size:12px;opacity:0.9;">📦 Total Produtos</h3>
                            <p style="font-size:32px;font-weight:bold;margin:0;">${totalProdutos}</p>
                        </div>
                        <div class="card-dashboard" style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);color:#fff;padding:20px;border-radius:12px;">
                            <h3 style="margin:0 0 8px 0;font-size:12px;opacity:0.9;">💰 Estoque Total</h3>
                            <p style="font-size:32px;font-weight:bold;margin:0;">R$ ${valorTotalEstoque.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div class="card-dashboard" style="background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%);color:#fff;padding:20px;border-radius:12px;">
                            <h3 style="margin:0 0 8px 0;font-size:12px;opacity:0.9;">💵 Total Vendas</h3>
                            <p style="font-size:32px;font-weight:bold;margin:0;">R$ ${totalVendasGeral.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div class="card-dashboard" style="background:linear-gradient(135deg,#43e97b 0%,#38f9d7 100%);color:#1a202c;padding:20px;border-radius:12px;">
                            <h3 style="margin:0 0 8px 0;font-size:12px;opacity:0.9;">📊 Status</h3>
                            <p style="font-size:20px;font-weight:bold;margin:0;">✅ Online</p>
                        </div>
                    </div>
                    <div style="margin-top:15px;padding:15px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <p style="margin:0;color:#666;font-size:13px;">📌 Clique nos menus acima para navegar entre as seções</p>
                    </div>
                </section>
            `;

            mostrarToast('Dashboard carregado com sucesso!', 'success');

        } catch (error) {
            console.error('❌ Erro no renderHome:', error);
            app.innerHTML = `
                <section>
                    <h2>🏠 Dashboard</h2>
                    <div style="text-align:center;padding:30px;color:#e53e3e;">
                        <p style="font-size:40px;">😕</p>
                        <p><strong>Erro ao carregar dados</strong></p>
                        <p style="font-size:14px;color:#666;">${error.message}</p>
                        <button onclick="window.renderHome()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-top:10px;">🔄 Tentar novamente</button>
                        <p style="font-size:12px;color:#999;margin-top:10px;">Verifique o console (F12) para mais detalhes</p>
                    </div>
                </section>
            `;
        }
    }

    // ============================================================
    // ESTOQUE
    // ============================================================
    async function renderEstoque() {
        console.log('📦 Renderizando Estoque...');
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = `
            <section>
                <h2>📦 Estoque</h2>
                <div style="background:#f0f4ff;padding:15px;border-radius:12px;margin-bottom:15px;border:2px dashed #667eea;">
                    <h3 style="margin:0 0 12px 0;color:#667eea;font-size:16px;">➕ Cadastrar Produto</h3>
                    <form id="formCadastroRapido" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
                        <div>
                            <label style="display:block;margin-bottom:3px;color:#4a5568;font-weight:500;font-size:12px;">Nome *</label>
                            <input type="text" id="nomeRapido" placeholder="Nome" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:3px;color:#4a5568;font-weight:500;font-size:12px;">Preço *</label>
                            <input type="number" id="precoRapido" step="0.01" placeholder="0,00" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:3px;color:#4a5568;font-weight:500;font-size:12px;">Qtd *</label>
                            <input type="number" id="qtdRapido" placeholder="0" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:3px;color:#4a5568;font-weight:500;font-size:12px;">Marca</label>
                            <select id="marcaRapido" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                                <option value="">Selecione</option>
                                ${CONFIG.MARCAS.map(m => `<option value="${m}">${m}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:3px;color:#4a5568;font-weight:500;font-size:12px;">Categoria</label>
                            <select id="categoriaRapido" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                                <option value="">Selecione</option>
                                ${CONFIG.CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                        <div style="display:flex;align-items:flex-end;">
                            <button type="submit" style="width:100%;background:#667eea;color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer;font-weight:500;font-size:13px;">✅ Cadastrar</button>
                        </div>
                    </form>
                    <div id="msgCadastroRapido" style="margin-top:8px;font-size:13px;"></div>
                </div>
                <div style="text-align:center;padding:15px;">
                    <div class="loading-spinner" style="font-size:24px;">⏳</div>
                    <p style="color:#667eea;font-size:14px;">Carregando produtos...</p>
                </div>
            </section>
        `;

        document.getElementById('formCadastroRapido').addEventListener('submit', cadastrarProdutoRapido);

        try {
            const result = await callAPI('listarProdutos');
            console.log('📦 Resultado listarProdutos:', result);

            let html = '';
            if (result.success && result.produtos) {
                const produtos = Array.isArray(result.produtos) ? result.produtos : [];
                if (produtos.length > 0) {
                    produtos.forEach(p => {
                        const qtd = parseInt(p.quantidade) || 0;
                        const preco = parseFloat(p.preco) || 0;
                        const status = qtd === 0 ? '🔴' : qtd <= 5 ? '🟡' : '🟢';
                        const statusTexto = qtd === 0 ? 'Esgotado' : qtd <= 5 ? 'Baixo' : 'Normal';
                        html += `
                            <tr>
                                <td style="padding:8px;"><strong>${p.nome || 'Sem nome'}</strong></td>
                                <td style="padding:8px;">R$ ${preco.toFixed(2).replace('.', ',')}</td>
                                <td style="padding:8px;">${status} ${qtd} <small style="color:#666;">(${statusTexto})</small></td>
                                <td style="padding:8px;">${p.marca || '-'}</td>
                                <td style="padding:8px;">${p.categoria || '-'}</td>
                            </tr>
                        `;
                    });
                } else {
                    html = `<tr><td colspan="5" style="text-align:center;padding:30px;"><p style="font-size:36px;">📭</p><p style="color:#666;">Nenhum produto cadastrado</p></td></tr>`;
                }
            } else {
                html = `<tr><td colspan="5" style="text-align:center;padding:30px;"><p style="font-size:36px;">⚠️</p><p style="color:#666;">${result.error || 'Erro ao carregar produtos'}</p></td></tr>`;
            }

            app.innerHTML = `
                <section>
                    <h2>📦 Estoque</h2>
                    <div style="background:#f0f4ff;padding:15px;border-radius:12px;margin-bottom:15px;border:2px dashed #667eea;">
                        <h3 style="margin:0 0 12px 0;color:#667eea;font-size:16px;">➕ Cadastrar Produto</h3>
                        <form id="formCadastroRapido" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
                            <div><label style="display:block;margin-bottom:3px;color:#4a5568;font-weight:500;font-size:12px;">Nome *</label>
                                <input type="text" id="nomeRapido" placeholder="Nome" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;"></div>
                            <div><label style="display:block;margin-bottom:3px;color:#4a5568;font-weight:500;font-size:12px;">Preço *</label>
                                <input type="number" id="precoRapido" step="0.01" placeholder="0,00" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;"></div>
                            <div><label style="display:block;margin-bottom:3px;color:#4a5568;font-weight:500;font-size:12px;">Qtd *</label>
                                <input type="number" id="qtdRapido" placeholder="0" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;"></div>
                            <div><label style="display:block;margin-bottom:3px;color:#4a5568;font-weight:500;font-size:12px;">Marca</label>
                                <select id="marcaRapido" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                                    <option value="">Selecione</option>
                                    ${CONFIG.MARCAS.map(m => `<option value="${m}">${m}</option>`).join('')}
                                </select></div>
                            <div><label style="display:block;margin-bottom:3px;color:#4a5568;font-weight:500;font-size:12px;">Categoria</label>
                                <select id="categoriaRapido" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                                    <option value="">Selecione</option>
                                    ${CONFIG.CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
                                </select></div>
                            <div style="display:flex;align-items:flex-end;">
                                <button type="submit" style="width:100%;background:#667eea;color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer;font-weight:500;font-size:13px;">✅ Cadastrar</button>
                            </div>
                        </form>
                        <div id="msgCadastroRapido" style="margin-top:8px;font-size:13px;"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
                        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;">
                            <span>🟢 Normal | 🟡 Baixo | 🔴 Esgotado</span>
                        </div>
                        <button onclick="window.renderEstoque()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:500;font-size:12px;">🔄 Atualizar</button>
                    </div>
                    <div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden;">
                        <div style="overflow-x:auto;">
                            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                                <thead>
                                    <tr style="background:#3957ed;">
                                        <th style="padding:10px;text-align:left;color:#fff;">Produto</th>
                                        <th style="padding:10px;text-align:left;color:#fff;">Preço</th>
                                        <th style="padding:10px;text-align:left;color:#fff;">Quantidade</th>
                                        <th style="padding:10px;text-align:left;color:#fff;">Marca</th>
                                        <th style="padding:10px;text-align:left;color:#fff;">Categoria</th>
                                    </tr>
                                </thead>
                                <tbody>${html}</tbody>
                            </table>
                        </div>
                    </div>
                </section>
            `;

            document.getElementById('formCadastroRapido').addEventListener('submit', cadastrarProdutoRapido);

        } catch (error) {
            console.error('❌ Erro no renderEstoque:', error);
            app.innerHTML = `<section><h2>📦 Estoque</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
        }
    }

    async function cadastrarProdutoRapido(e) {
        e.preventDefault();
        const nome = document.getElementById('nomeRapido').value.trim();
        const preco = parseFloat(document.getElementById('precoRapido').value);
        const quantidade = parseInt(document.getElementById('qtdRapido').value);
        const marca = document.getElementById('marcaRapido').value;
        const categoria = document.getElementById('categoriaRapido').value;
        const msg = document.getElementById('msgCadastroRapido');

        if (!nome) { msg.innerHTML = '<div style="color:#e53e3e;">Nome obrigatório</div>'; return; }
        if (isNaN(preco) || preco < 0) { msg.innerHTML = '<div style="color:#e53e3e;">Preço inválido</div>'; return; }
        if (isNaN(quantidade) || quantidade < 0) { msg.innerHTML = '<div style="color:#e53e3e;">Quantidade inválida</div>'; return; }

        const result = await callAPI('cadastrarProduto', {
            nome, preco, quantidade,
            marca: marca || '',
            categoria: categoria || ''
        });

        if (result.success) {
            msg.innerHTML = '<div style="color:#38a169;">✅ Produto cadastrado!</div>';
            mostrarToast(`Produto "${nome}" cadastrado!`, 'success');
            document.getElementById('formCadastroRapido').reset();
            renderEstoque();
        } else {
            msg.innerHTML = `<div style="color:#e53e3e;">${result.error || 'Erro ao cadastrar'}</div>`;
        }
    }

    // ============================================================
    // VENDAS (SIMPLIFICADA)
    // ============================================================
    async function renderVendas() {
        console.log('💰 Renderizando Vendas...');
        const app = document.getElementById('app');
        app.innerHTML = `
            <section>
                <h2>💰 Vendas</h2>
                <div style="text-align:center;padding:20px;">
                    <div class="loading-spinner" style="font-size:24px;">⏳</div>
                    <p style="color:#667eea;">Carregando dados...</p>
                </div>
            </section>
        `;

        try {
            const [produtosResult, clientesResult] = await Promise.all([
                callAPI('listarProdutos'),
                callAPI('listarClientes')
            ]);

            console.log('📦 Produtos para venda:', produtosResult);
            console.log('👥 Clientes:', clientesResult);

            let produtosOptions = '<option value="">Selecione um produto...</option>';
            if (produtosResult.success && produtosResult.produtos) {
                const produtos = Array.isArray(produtosResult.produtos) ? produtosResult.produtos : [];
                produtos.forEach(p => {
                    const qtd = parseInt(p.quantidade) || 0;
                    const preco = parseFloat(p.preco) || 0;
                    const disabled = qtd === 0 ? 'disabled' : '';
                    produtosOptions += `
                        <option value="${p.id}" data-preco="${preco}" data-nome="${p.nome}" data-quantidade="${qtd}" ${disabled}>
                            ${p.nome || 'Sem nome'} (${qtd} disp.) - R$ ${preco.toFixed(2).replace('.', ',')} ${disabled ? '🔴' : ''}
                        </option>
                    `;
                });
            }

            let clientesOptions = '<option value="">Selecione um cliente...</option>';
            if (clientesResult.success && clientesResult.clientes) {
                const clientes = Array.isArray(clientesResult.clientes) ? clientesResult.clientes : [];
                clientes.forEach(c => {
                    if (c.nome && c.nome !== 'Cliente não informado') {
                        clientesOptions += `<option value="${c.nome}">${c.nome}</option>`;
                    }
                });
            }

            app.innerHTML = `
                <section>
                    <h2>💰 Registrar Venda</h2>
                    <div style="background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <form id="formVendaMultipla">
                            <div style="margin-bottom:12px;">
                                <label style="display:block;margin-bottom:5px;color:#4a5568;font-weight:500;font-size:13px;">Cliente *</label>
                                <select id="clienteSelect" required style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                                    ${clientesOptions}
                                </select>
                            </div>
                            <div id="produtosContainer">
                                ${[1,2,3,4].map(i => `
                                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid #e2e8f0;">
                                        <div style="flex:2;min-width:120px;">
                                            <label style="font-size:12px;color:#4a5568;">Produto ${i}</label>
                                            <select id="produto${i}" class="produto-select" style="width:100%;padding:6px;border:2px solid #e2e8f0;border-radius:6px;font-size:12px;">
                                                ${produtosOptions}
                                            </select>
                                        </div>
                                        <div style="flex:1;min-width:60px;">
                                            <label style="font-size:12px;color:#4a5568;">Qtd</label>
                                            <input type="number" id="qtd${i}" class="qtd-produto" min="0" value="0" style="width:100%;padding:6px;border:2px solid #e2e8f0;border-radius:6px;font-size:12px;">
                                        </div>
                                        <div style="flex:1;min-width:80px;">
                                            <label style="font-size:12px;color:#4a5568;">Subtotal</label>
                                            <span id="subtotal${i}" style="display:block;padding:6px;background:#f7fafc;border-radius:6px;text-align:center;font-weight:bold;color:#667eea;font-size:13px;">R$ 0,00</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div style="margin-top:12px;padding:15px;background:#f7fafc;border-radius:10px;border:2px solid #e2e8f0;">
                                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                                    <div>
                                        <span style="font-size:12px;color:#666;">Total:</span>
                                        <span id="totalVenda" style="font-size:28px;font-weight:bold;color:#667eea;display:block;">R$ 0,00</span>
                                    </div>
                                    <div>
                                        <label style="display:block;margin-bottom:4px;color:#4a5568;font-weight:500;font-size:12px;">💵 Valor Pago</label>
                                        <input type="number" id="valorPago" step="0.01" min="0" placeholder="Digite o valor..." style="width:100%;padding:8px;border:2px solid #48bb78;border-radius:6px;font-size:14px;font-weight:bold;">
                                    </div>
                                    <div>
                                        <span style="font-size:12px;color:#666;">Troco/Pendente:</span>
                                        <span id="trocoOuPendente" style="font-size:24px;font-weight:bold;color:#e53e3e;display:block;">R$ 0,00</span>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" style="margin-top:8px;background:#48bb78;color:#fff;border:none;padding:10px;border-radius:6px;cursor:pointer;font-weight:500;width:100%;font-size:14px;">💰 Registrar Venda</button>
                        </form>
                        <div id="msgVenda" style="margin-top:12px;"></div>
                    </div>
                </section>
            `;

            function calcularTotais() {
                let totalGeral = 0;
                for (let i = 1; i <= 4; i++) {
                    const select = document.getElementById(`produto${i}`);
                    const qtdInput = document.getElementById(`qtd${i}`);
                    const subtotalSpan = document.getElementById(`subtotal${i}`);
                    const qtd = parseInt(qtdInput.value) || 0;
                    const option = select.options[select.selectedIndex];
                    let subtotal = 0;
                    if (select.selectedIndex > 0 && option && qtd > 0) {
                        const preco = parseFloat(option.dataset.preco || 0);
                        subtotal = preco * qtd;
                    }
                    subtotalSpan.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
                    totalGeral += subtotal;
                }
                document.getElementById('totalVenda').textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
                const valorPago = parseFloat(document.getElementById('valorPago').value) || 0;
                const troco = valorPago - totalGeral;
                const trocoSpan = document.getElementById('trocoOuPendente');
                if (troco >= 0) {
                    trocoSpan.textContent = `R$ ${troco.toFixed(2).replace('.', ',')}`;
                    trocoSpan.style.color = '#38a169';
                } else {
                    trocoSpan.textContent = `R$ ${Math.abs(troco).toFixed(2).replace('.', ',')} (Pendente)`;
                    trocoSpan.style.color = '#e53e3e';
                }
            }

            document.querySelectorAll('.produto-select, .qtd-produto').forEach(el => {
                el.addEventListener('change', calcularTotais);
                el.addEventListener('input', calcularTotais);
            });
            document.getElementById('valorPago').addEventListener('input', calcularTotais);

            document.getElementById('formVendaMultipla').addEventListener('submit', registrarVendaMultipla);
            calcularTotais();

        } catch (error) {
            console.error('❌ Erro no renderVendas:', error);
            app.innerHTML = `<section><h2>💰 Vendas</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
        }
    }

    async function registrarVendaMultipla(e) {
        e.preventDefault();
        const cliente = document.getElementById('clienteSelect').value;
        const msg = document.getElementById('msgVenda');
        const valorPago = parseFloat(document.getElementById('valorPago').value) || 0;
        const botaoSubmit = e.target.querySelector('button[type="submit"]');

        if (!cliente) {
            msg.innerHTML = '<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Selecione um cliente</div>';
            return;
        }

        const itens = [];
        let totalVenda = 0;

        for (let i = 1; i <= 4; i++) {
            const select = document.getElementById(`produto${i}`);
            const qtdInput = document.getElementById(`qtd${i}`);
            const qtd = parseInt(qtdInput.value) || 0;

            if (qtd > 0 && select.selectedIndex > 0) {
                const option = select.options[select.selectedIndex];
                const produtoId = option.value;
                const preco = parseFloat(option.dataset.preco || 0);
                const disponivel = parseInt(option.dataset.quantidade || 0);

                if (qtd > disponivel) {
                    msg.innerHTML = `<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Estoque insuficiente para "${option.dataset.nome || 'produto'}"</div>`;
                    return;
                }

                itens.push({ produtoId, quantidade: qtd, precoUnitario: preco });
                totalVenda += preco * qtd;
            }
        }

        if (itens.length === 0) {
            msg.innerHTML = '<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Adicione pelo menos um produto</div>';
            return;
        }

        try {
            botaoSubmit.innerHTML = '⏳ Processando...';
            botaoSubmit.disabled = true;

            for (const item of itens) {
                const result = await callAPI('registrarVenda', {
                    produtoId: item.produtoId,
                    quantidade: item.quantidade,
                    cliente: cliente,
                    precoUnitario: item.precoUnitario,
                    desconto: 0,
                    descontoTipo: 'R$',
                    descontoValor: 0
                });
                if (!result.success) {
                    throw new Error(result.error || 'Erro ao registrar venda');
                }
            }

            if (valorPago > 0) {
                await callAPI('registrarPagamento', {
                    cliente, valor: valorPago,
                    observacao: `Pagamento da venda de R$ ${totalVenda.toFixed(2)}`
                });
            }

            msg.innerHTML = `
                <div style="padding:12px;background:#c6f6d5;color:#22543d;border-radius:6px;">
                    ✅ Venda registrada! Total: R$ ${totalVenda.toFixed(2).replace('.', ',')}
                </div>
            `;
            mostrarToast('Venda registrada com sucesso!', 'success');

            document.querySelectorAll('.qtd-produto').forEach(el => el.value = 0);
            document.querySelectorAll('.produto-select').forEach(el => el.selectedIndex = 0);
            document.getElementById('totalVenda').textContent = 'R$ 0,00';
            document.getElementById('trocoOuPendente').textContent = 'R$ 0,00';
            document.getElementById('valorPago').value = '';

        } catch (error) {
            console.error('❌ Erro ao registrar venda:', error);
            msg.innerHTML = `<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Erro: ${error.message}</div>`;
        } finally {
            botaoSubmit.innerHTML = '💰 Registrar Venda';
            botaoSubmit.disabled = false;
        }
    }

    // ============================================================
    // CLIENTES
    // ============================================================
    async function renderClientes() {
        console.log('👥 Renderizando Clientes...');
        const app = document.getElementById('app');
        app.innerHTML = `
            <section>
                <h2>👥 Clientes</h2>
                <div style="background:#fff;padding:15px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <div style="margin-bottom:12px;">
                        <div style="display:flex;gap:8px;align-items:center;">
                            <input type="text" id="buscaCliente" placeholder="🔍 Buscar cliente..." style="flex:1;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                            <button onclick="document.getElementById('buscaCliente').value=''; window.carregarTabelaClientes();" style="background:#e2e8f0;color:#4a5568;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;">✕</button>
                        </div>
                    </div>
                    <div id="tabelaClientes">
                        <div style="text-align:center;padding:15px;">
                            <div class="loading-spinner" style="font-size:20px;">⏳</div>
                            <p style="color:#667eea;font-size:13px;">Carregando clientes...</p>
                        </div>
                    </div>
                </div>
            </section>
        `;

        await carregarTabelaClientes();
    }

    async function carregarTabelaClientes(filtro = '') {
        const container = document.getElementById('tabelaClientes');
        if (!container) return;

        try {
            const result = await callAPI('listarVendasPorCliente');
            console.log('👥 Resultado clientes:', result);

            let html = '';
            if (result.success && result.clientes) {
                let clientes = Array.isArray(result.clientes) ? result.clientes : [];
                clientes = clientes.filter(c => c.nome && c.nome !== 'Cliente não informado');
                
                if (filtro) {
                    clientes = clientes.filter(c => c.nome.toLowerCase().includes(filtro.toLowerCase()));
                }

                if (clientes.length > 0) {
                    clientes.forEach(c => {
                        const totalGasto = parseFloat(c.totalGasto) || 0;
                        const totalPago = parseFloat(c.totalPago) || 0;
                        const saldo = totalGasto - totalPago;
                        const statusSaldo = saldo > 0.01 ? '🔴' : saldo < -0.01 ? '🟡' : '🟢';
                        const statusTexto = saldo > 0.01 ? 'A pagar' : saldo < -0.01 ? 'Crédito' : 'Quitado';
                        html += `
                            <tr>
                                <td style="padding:8px;"><strong>${c.nome}</strong></td>
                                <td style="padding:8px;">R$ ${totalGasto.toFixed(2).replace('.', ',')}</td>
                                <td style="padding:8px;">R$ ${totalPago.toFixed(2).replace('.', ',')}</td>
                                <td style="padding:8px;">${statusSaldo} R$ ${Math.abs(saldo).toFixed(2).replace('.', ',')} <small>(${statusTexto})</small></td>
                            </tr>
                        `;
                    });
                } else {
                    html = `<tr><td colspan="4" style="text-align:center;padding:30px;"><p style="font-size:32px;">🔍</p><p style="color:#666;">Nenhum cliente encontrado</p></td></tr>`;
                }
            } else {
                html = `<tr><td colspan="4" style="text-align:center;padding:30px;"><p style="font-size:32px;">📭</p><p style="color:#666;">Nenhum cliente cadastrado</p></td></tr>`;
            }

            container.innerHTML = `
                <div style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <thead>
                            <tr style="background:#3957ed;">
                                <th style="padding:10px;text-align:left;color:#fff;">Cliente</th>
                                <th style="padding:10px;text-align:left;color:#fff;">Total Gasto</th>
                                <th style="padding:10px;text-align:left;color:#fff;">Total Pago</th>
                                <th style="padding:10px;text-align:left;color:#fff;">Saldo</th>
                            </tr>
                        </thead>
                        <tbody>${html}</tbody>
                    </table>
                </div>
                <div style="margin-top:8px;padding:8px;background:#f7fafc;border-radius:6px;font-size:11px;color:#666;">
                    🟢 Quitado | 🔴 Em débito | 🟡 Crédito
                </div>
            `;

        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            container.innerHTML = `<div style="text-align:center;padding:15px;color:#e53e3e;"><p>❌ Erro: ${error.message}</p><button onclick="carregarTabelaClientes()" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;">🔄 Tentar</button></div>`;
        }
    }

    window.carregarTabelaClientes = carregarTabelaClientes;

    // ============================================================
    // VENDEDORA
    // ============================================================
    async function renderVendedora() {
        console.log('👩‍💼 Renderizando Vendedora...');
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = `
            <section>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h2>👩‍💼 Área da Vendedora</h2>
                    <button onclick="window.atualizarVendedora()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:500;font-size:12px;">🔄 Atualizar</button>
                </div>
                <div style="background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <div style="display:flex;align-items:center;gap:15px;margin-bottom:20px;padding:15px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;color:#fff;">
                        <div style="background:rgba(255,255,255,0.2);border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:24px;">👩</div>
                        <div>
                            <p style="margin:0;font-size:12px;opacity:0.9;">Bem-vinda,</p>
                            <h3 style="margin:0;font-size:20px;">Roberta Bento</h3>
                            <p style="margin:2px 0 0;font-size:11px;opacity:0.8;">Gerencie vendas e cobranças</p>
                        </div>
                    </div>
                    <div style="margin-bottom:20px;">
                        <h4 style="color:#2d3748;margin-bottom:8px;font-size:15px;">📅 Pagamentos Pendentes</h4>
                        <div id="promessasHojeContainer">
                            <div style="text-align:center;padding:15px;">
                                <div class="loading-spinner" style="font-size:18px;">⏳</div>
                                <p style="color:#667eea;font-size:13px;">Carregando...</p>
                            </div>
                        </div>
                    </div>
                    <div style="margin-bottom:15px;">
                        <h4 style="color:#2d3748;margin-bottom:8px;font-size:15px;">📊 Extratos</h4>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
                            <button onclick="mostrarToast('Extrato semanal - Funcionalidade em desenvolvimento', 'info')" class="btn-extrato" style="background:#667eea;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;">📅 Semanal</button>
                            <button onclick="mostrarToast('Extrato mensal - Funcionalidade em desenvolvimento', 'info')" class="btn-extrato" style="background:#4facfe;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;">📆 Mensal</button>
                            <button onclick="mostrarToast('Extrato semestral - Funcionalidade em desenvolvimento', 'info')" class="btn-extrato" style="background:#f093fb;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;">📊 Semestral</button>
                            <button onclick="mostrarToast('Extrato anual - Funcionalidade em desenvolvimento', 'info')" class="btn-extrato" style="background:#43e97b;color:#1a202c;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;">📈 Anual</button>
                        </div>
                    </div>
                    <div style="margin-top:20px;border-top:2px solid #e2e8f0;padding-top:15px;">
                        <h4 style="color:#2d3748;margin-bottom:8px;font-size:15px;">💰 Pagamentos Recebidos</h4>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
                            <button onclick="mostrarToast('Pagamentos da semana - Funcionalidade em desenvolvimento', 'info')" class="btn-extrato" style="background:#38a169;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;">💳 Semana</button>
                            <button onclick="mostrarToast('Pagamentos do mês - Funcionalidade em desenvolvimento', 'info')" class="btn-extrato" style="background:#2b6cb0;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;">📆 Mês</button>
                            <button onclick="mostrarToast('Pagamentos do ano - Funcionalidade em desenvolvimento', 'info')" class="btn-extrato" style="background:#d69e2e;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;">📈 Ano</button>
                        </div>
                    </div>
                </div>
            </section>
        `;

        await carregarPromessasHoje();
    }

    // ============================================================
    // PROMESSAS DE PAGAMENTO
    // ============================================================
    async function carregarPromessasHoje() {
        const container = document.getElementById('promessasHojeContainer');
        if (!container) return;

        try {
            const result = await callAPI('listarPromessasPagamento');
            console.log('📅 Promessas:', result);

            if (!result.success || !result.promessas || result.promessas.length === 0) {
                container.innerHTML = `<div style="background:#f0f4ff;padding:15px;border-radius:6px;text-align:center;color:#718096;font-size:13px;">✅ Nenhum pagamento pendente</div>`;
                return;
            }

            const hoje = new Date();
            const hojeStr = hoje.toDateString();
            const promessas = Array.isArray(result.promessas) ? result.promessas : [];
            const promessasPendentes = promessas.filter(p => {
                const saldo = parseFloat(p.saldo) || 0;
                const status = String(p.status || 'pendente');
                return saldo > 0 && status !== 'pago';
            });

            if (promessasPendentes.length === 0) {
                container.innerHTML = `<div style="background:#f0f4ff;padding:15px;border-radius:6px;text-align:center;color:#718096;font-size:13px;">✅ Nenhum pagamento pendente</div>`;
                return;
            }

            let html = `
                <div style="background:#fff;border-radius:6px;border:2px solid #48bb78;overflow:hidden;">
                    <div style="background:#48bb78;color:#fff;padding:6px 10px;font-weight:600;font-size:12px;display:flex;justify-content:space-between;">
                        <span>Cliente</span><span>Valor</span><span>Vencimento</span><span>Ação</span>
                    </div>
                    <div>
            `;

            promessasPendentes.forEach(p => {
                const cliente = String(p.cliente || '');
                const whatsapp = String(p.whatsapp || '');
                const valor = parseFloat(p.saldo) || 0;
                const dataPag = new Date(p.dataPagamento);
                const dataStr = dataPag.toLocaleDateString('pt-BR');
                const clienteSafe = cliente.replace(/'/g, "\\'");
                const whatsappSafe = whatsapp.replace(/'/g, "\\'");

                let badge = '', cor = 'transparent';
                if (dataPag.toDateString() === hojeStr) {
                    badge = '<span class="badge-hoje">Hoje</span>';
                    cor = '#f0fff4';
                } else if (dataPag < hoje) {
                    badge = '<span class="badge-atraso">Atrasado</span>';
                    cor = '#fff5f5';
                } else {
                    badge = '<span class="badge-futuro">Futuro</span>';
                    cor = '#fffff0';
                }

                html += `
                    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:6px;align-items:center;padding:6px 10px;border-bottom:1px solid #edf2f7;background:${cor};font-size:12px;">
                        <div><strong>${cliente}</strong>${whatsapp ? `<span style="font-size:10px;color:#25D366;display:block;">📱 ${whatsapp}</span>` : ''}</div>
                        <div style="text-align:center;font-weight:bold;color:#48bb78;">R$ ${valor.toFixed(2).replace('.', ',')}</div>
                        <div style="text-align:center;">${badge}<div style="font-size:10px;color:#666;">${dataStr}</div></div>
                        <div style="text-align:center;">
                            <button onclick="window.enviarCobranca('${clienteSafe}', ${valor}, '${whatsappSafe}')" 
                                    class="btn-cobrar" 
                                    style="background:#25D366;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:500;width:100%;">💬 Cobrar</button>
                        </div>
                    </div>
                `;
            });

            html += `</div></div><div style="margin-top:6px;text-align:center;font-size:11px;color:#666;">Total: ${promessasPendentes.length} pendente(s)</div>`;
            container.innerHTML = html;

        } catch (error) {
            console.error('❌ Erro ao carregar promessas:', error);
            container.innerHTML = `<div style="background:#fed7d7;padding:12px;border-radius:6px;text-align:center;color:#9b2c2c;font-size:13px;">❌ Erro: ${error.message}</div>`;
        }
    }

    // ============================================================
    // ENVIAR COBRANÇA VIA WHATSAPP
    // ============================================================
    window.enviarCobranca = function(cliente, valor, whatsapp) {
        console.log(`📱 Enviando cobrança para ${cliente} (${whatsapp}) - R$ ${valor}`);
        const mensagem = `Olá, querida! Tudo bem? 💕\n\nPassando rapidinho para te lembrar do vencimento da sua parcela hoje!\nAssim você garante seus atendimentos e novidades sem preocupação! 😉🥰\n\n📲 Chave Pix: ${CONFIG.PIX.chave}\n\n📄 Comprovante: Pode me enviar por aqui mesmo!\n\nAgradeço demais a sua confiança e preferência de sempre! 🌷`;
        let url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        if (whatsapp) {
            const numero = whatsapp.replace(/\D/g, '');
            if (numero.length >= 10) {
                url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
            }
        }
        window.open(url, '_blank');
    };

    window.atualizarVendedora = function() {
        mostrarToast('Atualizando...', 'info');
        renderVendedora();
    };

    // ============================================================
    // PIX - FUNÇÕES SIMPLIFICADAS
    // ============================================================
    window.gerarQrCodePix = function(valor, descricao = 'Pagamento') {
        if (!valor || valor <= 0) {
            mostrarToast('Valor inválido para gerar QR Code', 'error');
            return;
        }
        mostrarToast(`Gerando QR Code Pix para R$ ${valor.toFixed(2).replace('.', ',')}`, 'info');
        // Implementação simplificada
        const payload = gerarPayloadPix(valor, descricao);
        mostrarModalPix(payload, valor, descricao);
    };

    function gerarPayloadPix(valor, descricao) {
        const { chave, nomeRecebedor, cidade } = CONFIG.PIX;
        let payload = '000201';
        payload += '26420014BR.GOV.BCB.PIX0114' + chave;
        payload += '52040000';
        payload += '5303986';
        if (valor && valor > 0) {
            const valorFormatado = valor.toFixed(2);
            payload += '54' + String(valorFormatado.length).padStart(2, '0') + valorFormatado;
        }
        payload += '5802BR';
        const nomeLimpo = removerAcentos(nomeRecebedor).substring(0, 25);
        payload += '59' + String(nomeLimpo.length).padStart(2, '0') + nomeLimpo;
        const cidadeLimpa = removerAcentos(cidade).substring(0, 15);
        payload += '60' + String(cidadeLimpa.length).padStart(2, '0') + cidadeLimpa;
        payload += '62070503***';
        payload += '6304';
        const crc = calcularCRC16(payload);
        payload += crc.toString(16).toUpperCase().padStart(4, '0');
        return payload;
    }

    function removerAcentos(str) {
        const mapa = {
            'á':'a','à':'a','â':'a','ã':'a','ä':'a','é':'e','è':'e','ê':'e','ë':'e',
            'í':'i','ì':'i','î':'i','ï':'i','ó':'o','ò':'o','ô':'o','õ':'o','ö':'o',
            'ú':'u','ù':'u','û':'u','ü':'u','ç':'c','ñ':'n'
        };
        return str.replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/g, m => mapa[m] || m);
    }

    function calcularCRC16(payload) {
        let crc = 0xFFFF;
        for (let i = 0; i < payload.length; i++) {
            crc ^= payload.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc <<= 1;
                }
                crc &= 0xFFFF;
            }
        }
        return crc;
    }

    function mostrarModalPix(payload, valor, descricao) {
        const modalAnterior = document.querySelector('.modal-pix');
        if (modalAnterior) modalAnterior.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-pix';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: '10001',
            padding: '20px'
        });

        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;

        overlay.innerHTML = `
            <div style="background:white; padding:20px; border-radius:16px; max-width:400px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.3); position:relative;">
                <button onclick="this.closest('.modal-pix').remove()" style="position:absolute; top:8px; right:12px; background:transparent; border:none; font-size:20px; cursor:pointer; color:#999;">✕</button>
                <div style="text-align:center;">
                    <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:8px;">
                        <span style="font-size:22px;">💳</span>
                        <h2 style="margin:0; color:#2d3748; font-size:18px;">Pagar com Pix</h2>
                    </div>
                    <div style="background:#f0f4ff; padding:10px; border-radius:10px; margin-bottom:12px;">
                        <p style="margin:0; font-size:11px; color:#4a5568;">Valor</p>
                        <p style="margin:0; font-size:24px; font-weight:bold; color:#667eea;">R$ ${valor.toFixed(2).replace('.', ',')}</p>
                        ${descricao ? `<p style="margin:2px 0 0 0; font-size:11px; color:#666;">${descricao}</p>` : ''}
                    </div>
                    <div style="background:#f8f9fa; padding:10px; border-radius:10px; margin-bottom:12px;">
                        <img src="${qrCodeUrl}" alt="QR Code Pix" style="width:160px; height:160px; margin:0 auto; display:block; background:white; padding:6px; border-radius:6px;">
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button onclick="copiarPix('${payload.replace(/'/g, "\\'")}')" style="flex:1; background:#667eea; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:500; font-size:12px;">📋 Copiar</button>
                        <button onclick="this.closest('.modal-pix').remove()" style="flex:1; background:#e2e8f0; color:#4a5568; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:500; font-size:12px;">Fechar</button>
                    </div>
                    <div style="margin-top:10px; padding:8px; background:#fff3cd; border-radius:6px; font-size:11px; color:#856404;">⚠️ Após o pagamento, finalize a compra.</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    function copiarPix(payload) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(payload).then(() => {
                mostrarToast('✅ Código Pix copiado!', 'success');
            }).catch(() => copiarPixFallback(payload));
        } else {
            copiarPixFallback(payload);
        }
    }

    function copiarPixFallback(payload) {
        const textarea = document.createElement('textarea');
        textarea.value = payload;
        textarea.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            mostrarToast('✅ Código Pix copiado!', 'success');
        } catch (e) {
            mostrarToast('❌ Erro ao copiar', 'error');
        }
        document.body.removeChild(textarea);
    }

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    function init() {
        console.log('🚀 Inicializando Sistema de Vendas V9.0...');
        adicionarEstilosCSS();
        inicializarNavegacao();
        
        // Verificar se o elemento app existe
        const app = document.getElementById('app');
        if (!app) {
            console.error('❌ Elemento #app não encontrado!');
            return;
        }
        
        // Carregar a página inicial
        setTimeout(() => {
            renderHome();
        }, 100);
        
        console.log('✅ Sistema inicializado!');
    }

    // ============================================================
    // EXPORTA FUNÇÕES GLOBAIS
    // ============================================================
    window.renderHome = renderHome;
    window.renderEstoque = renderEstoque;
    window.renderVendas = renderVendas;
    window.renderClientes = renderClientes;
    window.renderVendedora = renderVendedora;
    window.mostrarToast = mostrarToast;
    window.confirmarAcao = confirmarAcao;
    window.carregarTabelaClientes = carregarTabelaClientes;
    window.enviarCobranca = window.enviarCobranca;
    window.atualizarVendedora = window.atualizarVendedora;
    window.gerarQrCodePix = window.gerarQrCodePix;

    // Iniciar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();