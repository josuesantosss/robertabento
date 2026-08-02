// ============================================================
// SISTEMA DE VENDAS - VERSÃO MOBILE OTIMIZADA V11.1
// ============================================================

(function() {
    'use strict';

    console.log('🚀 Iniciando Sistema de Vendas V11.1...');

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
    // DETECTAR DISPOSITIVO MÓVEL
    // ============================================================
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // ============================================================
    // API CALL COM LOGS
    // ============================================================
    async function callAPI(action, data = null) {
        let url = `${CONFIG.API_URL}?action=${action}`;
        if (data) {
            const params = new URLSearchParams(data);
            url += `&${params.toString()}`;
        }

        console.log(`📤 Chamando API: ${action}`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            console.log(`📥 Dados recebidos (${action}):`, result);
            return result;
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
            @keyframes fadeIn{from{opacity:0}to{opacity:1}}
            @keyframes slideDown{from{transform:translateY(-10px);opacity:0}to{transform:translateY(0);opacity:1}}
            
            .loading-spinner{animation:spin .8s linear infinite;display:inline-block}
            .card-dashboard{transition:all .2s ease}
            .card-dashboard:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(0,0,0,0.15)}
            .btn-primary{transition:all .15s ease;cursor:pointer}
            .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,0,0,0.1)}
            
            .badge-hoje{background:#48bb78;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;display:inline-block}
            .badge-atraso{background:#e53e3e;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;display:inline-block}
            .badge-futuro{background:#ed8936;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;display:inline-block}
            
            .btn-extrato{transition:all .2s ease;cursor:pointer}
            .btn-extrato:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.15)}
            .btn-cobrar{transition:all .2s ease;cursor:pointer}
            .btn-cobrar:hover{transform:scale(1.05)}
            
            .cliente-detalhe-row td{padding:0 !important}
            .cliente-detalhe-content{padding:15px;background:#f7fafc;border-radius:0 0 8px 8px;animation:fadeIn 0.3s ease}
            
            @media (max-width: 768px) {
                .clientes-table thead { display: none; }
                .clientes-table tbody tr {
                    display: block; margin-bottom: 12px; border: 1px solid #e2e8f0;
                    border-radius: 10px; padding: 12px 15px; background: white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
                }
                .clientes-table tbody tr td {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 8px 0 !important; border-bottom: 1px solid #f0f0f0; font-size: 14px;
                }
                .clientes-table tbody tr td:last-child { border-bottom: none; }
                .clientes-table tbody tr td::before {
                    content: attr(data-label); font-weight: 600; color: #4a5568; font-size: 13px;
                }
                .clientes-table tbody tr td:first-child {
                    font-weight: 600; font-size: 16px; color: #2d3748;
                    border-bottom: 2px solid #e2e8f0; padding-bottom: 10px !important; margin-bottom: 4px;
                }
                .clientes-table tbody tr td:first-child::before { content: "👤 Cliente"; font-weight: 700; }
                .clientes-table tbody tr td:nth-child(2)::before { content: "💰 Total Gasto"; }
                .clientes-table tbody tr td:nth-child(3)::before { content: "💵 Total Pago"; }
                .clientes-table tbody tr td:nth-child(4)::before { content: "📊 Saldo"; }
                
                .cliente-detalhe-content { padding: 12px !important; }
                .cliente-detalhe-content .detalhes-grid {
                    display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 6px !important;
                }
                .cliente-detalhe-content .detalhes-grid div { padding: 8px !important; font-size: 12px !important; }
                .cliente-detalhe-content .acoes-grid {
                    display: grid !important; grid-template-columns: 1fr !important; gap: 8px !important;
                }
                .cliente-detalhe-content table { font-size: 11px !important; }
                .cliente-detalhe-content table td, .cliente-detalhe-content table th { padding: 4px 6px !important; }
                .cliente-detalhe-content .btn-acao { width: 100% !important; justify-content: center !important; }
            }
            
            @media (min-width: 769px) {
                .clientes-table tbody tr td::before { display: none; }
            }
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
        clienteExpandido: null,
        setPage(page) { this.currentPage = page; },
        setClienteExpandido(nome) { this.clienteExpandido = nome; },
        getClienteExpandido() { return this.clienteExpandido; }
    };

    // ============================================================
    // NAVEGAÇÃO COM LOADING SUAVE
    // ============================================================
    function inicializarNavegacao() {
        const navButtons = document.querySelectorAll('.nav-btn');
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
                if (pageMap[page]) {
                    StateManager.setPage(page);
                    mostrarLoading(page);
                    setTimeout(() => pageMap[page](), 100);
                }
            });
        });
    }

    function mostrarLoading(page) {
        const app = document.getElementById('app');
        if (!app) return;
        
        const nomes = { 'home': 'Dashboard', 'estoque': 'Estoque', 'vendas': 'Vendas', 'clientes': 'Clientes', 'vendedora': 'Área da Vendedora' };
        const icones = { 'home': '🏠', 'estoque': '📦', 'vendas': '💰', 'clientes': '👥', 'vendedora': '👩‍💼' };
        
        app.innerHTML = `
            <section style="animation:fadeIn 0.3s ease;">
                <h2>${icones[page] || '📄'} ${nomes[page] || page}</h2>
                <div style="text-align:center;padding:40px 20px;">
                    <div class="loading-spinner" style="font-size:32px;">⏳</div>
                    <p style="color:#667eea;margin-top:12px;font-size:15px;">Carregando ${nomes[page] || page}...</p>
                </div>
            </section>
        `;
    }

    // ============================================================
    // HOME (DASHBOARD)
    // ============================================================
    async function renderHome() {
        const app = document.getElementById('app');
        if (!app) return;

        const { saudacao, horario } = obterSaudacao();
        mostrarLoading('home');

        try {
            const [produtosResult, vendasResult] = await Promise.all([
                callAPI('listarProdutos'),
                callAPI('listarVendas')
            ]);

            let totalProdutos = 0;
            let valorTotalEstoque = 0;

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
                <section style="animation:fadeIn 0.4s ease;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <h2>🏠 Dashboard</h2>
                        <button onclick="window.renderHome()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:500;font-size:12px;">🔄 Atualizar</button>
                    </div>
                    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:20px;border-radius:15px;margin-bottom:20px;box-shadow:0 4px 15px rgba(102,126,234,0.3);">
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
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;">
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
                </section>
            `;
        } catch (error) {
            app.innerHTML = `<section style="animation:fadeIn 0.4s ease;"><h2>🏠 Dashboard</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
        }
    }

    // ============================================================
    // ESTOQUE
    // ============================================================
    async function renderEstoque() {
        const app = document.getElementById('app');
        if (!app) return;
        mostrarLoading('estoque');

        try {
            const result = await callAPI('listarProdutos');
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
                html = `<tr><td colspan="5" style="text-align:center;padding:30px;"><p style="font-size:36px;">⚠️</p><p style="color:#666;">${result.error || 'Erro ao carregar'}</p></td></tr>`;
            }

            app.innerHTML = `
                <section style="animation:fadeIn 0.4s ease;">
                    <h2>📦 Estoque</h2>
                    <div style="background:#f0f4ff;padding:15px;border-radius:12px;margin-bottom:15px;border:2px dashed #667eea;">
                        <h3 style="margin:0 0 12px 0;color:#667eea;font-size:16px;">➕ Cadastrar Produto</h3>
                        <form id="formCadastroRapido" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
                            <div><label style="display:block;margin-bottom:3px;font-size:12px;">Nome *</label><input type="text" id="nomeRapido" placeholder="Nome" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;"></div>
                            <div><label style="display:block;margin-bottom:3px;font-size:12px;">Preço *</label><input type="number" id="precoRapido" step="0.01" placeholder="0,00" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;"></div>
                            <div><label style="display:block;margin-bottom:3px;font-size:12px;">Qtd *</label><input type="number" id="qtdRapido" placeholder="0" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;"></div>
                            <div><label style="display:block;margin-bottom:3px;font-size:12px;">Marca</label><select id="marcaRapido" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;"><option value="">Selecione</option>${CONFIG.MARCAS.map(m => `<option value="${m}">${m}</option>`).join('')}</select></div>
                            <div><label style="display:block;margin-bottom:3px;font-size:12px;">Categoria</label><select id="categoriaRapido" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;"><option value="">Selecione</option>${CONFIG.CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                            <div style="display:flex;align-items:flex-end;"><button type="submit" style="width:100%;background:#667eea;color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer;font-weight:500;font-size:13px;">✅ Cadastrar</button></div>
                        </form>
                        <div id="msgCadastroRapido" style="margin-top:8px;font-size:13px;"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <span>🟢 Normal | 🟡 Baixo | 🔴 Esgotado</span>
                        <button onclick="window.renderEstoque()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;">🔄 Atualizar</button>
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
            app.innerHTML = `<section style="animation:fadeIn 0.4s ease;"><h2>📦 Estoque</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
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

        const result = await callAPI('cadastrarProduto', { nome, preco, quantidade, marca: marca || '', categoria: categoria || '' });

        if (result.success) {
            mostrarToast(`Produto "${nome}" cadastrado!`, 'success');
            renderEstoque();
        } else {
            msg.innerHTML = `<div style="color:#e53e3e;">${result.error || 'Erro ao cadastrar'}</div>`;
        }
    }

    // ============================================================
    // VENDAS
    // ============================================================
    async function renderVendas() {
        const app = document.getElementById('app');
        if (!app) return;
        mostrarLoading('vendas');

        try {
            const [produtosResult, clientesResult] = await Promise.all([
                callAPI('listarProdutos'),
                callAPI('listarClientes')
            ]);

            let produtosOptions = '<option value="">Selecione um produto...</option>';
            if (produtosResult.success && produtosResult.produtos) {
                const produtos = Array.isArray(produtosResult.produtos) ? produtosResult.produtos : [];
                produtos.forEach(p => {
                    const qtd = parseInt(p.quantidade) || 0;
                    const preco = parseFloat(p.preco) || 0;
                    const disabled = qtd === 0 ? 'disabled' : '';
                    produtosOptions += `<option value="${p.id}" data-preco="${preco}" data-nome="${p.nome}" data-quantidade="${qtd}" ${disabled}>${p.nome || 'Sem nome'} (${qtd} disp.) - R$ ${preco.toFixed(2).replace('.', ',')} ${disabled ? '🔴' : ''}</option>`;
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
                <section style="animation:fadeIn 0.4s ease;">
                    <h2>💰 Registrar Venda</h2>
                    <div style="background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <form id="formVendaMultipla">
                            <div style="margin-bottom:12px;">
                                <label style="display:block;margin-bottom:5px;font-weight:500;font-size:13px;">Cliente *</label>
                                <select id="clienteSelect" required style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">${clientesOptions}</select>
                            </div>
                            <div id="produtosContainer">
                                ${[1,2,3,4].map(i => `
                                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid #e2e8f0;">
                                        <div style="flex:2;min-width:120px;"><label style="font-size:12px;">Produto ${i}</label><select id="produto${i}" class="produto-select" style="width:100%;padding:6px;border:2px solid #e2e8f0;border-radius:6px;font-size:12px;">${produtosOptions}</select></div>
                                        <div style="flex:1;min-width:60px;"><label style="font-size:12px;">Qtd</label><input type="number" id="qtd${i}" class="qtd-produto" min="0" value="0" style="width:100%;padding:6px;border:2px solid #e2e8f0;border-radius:6px;font-size:12px;"></div>
                                        <div style="flex:1;min-width:80px;"><label style="font-size:12px;">Subtotal</label><span id="subtotal${i}" style="display:block;padding:6px;background:#f7fafc;border-radius:6px;text-align:center;font-weight:bold;color:#667eea;font-size:13px;">R$ 0,00</span></div>
                                    </div>
                                `).join('')}
                            </div>
                            <div style="margin-top:12px;padding:15px;background:#f7fafc;border-radius:10px;border:2px solid #e2e8f0;">
                                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                                    <div><span style="font-size:12px;color:#666;">Total:</span><span id="totalVenda" style="font-size:28px;font-weight:bold;color:#667eea;display:block;">R$ 0,00</span></div>
                                    <div><label style="display:block;margin-bottom:4px;font-size:12px;">💵 Valor Pago</label><input type="number" id="valorPago" step="0.01" min="0" placeholder="Digite..." style="width:100%;padding:8px;border:2px solid #48bb78;border-radius:6px;font-size:14px;font-weight:bold;"></div>
                                    <div><span style="font-size:12px;color:#666;">Troco/Pendente:</span><span id="trocoOuPendente" style="font-size:24px;font-weight:bold;color:#e53e3e;display:block;">R$ 0,00</span></div>
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
            app.innerHTML = `<section style="animation:fadeIn 0.4s ease;"><h2>💰 Vendas</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
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
                    produtoId: item.produtoId, quantidade: item.quantidade, cliente: cliente, precoUnitario: item.precoUnitario, desconto: 0, descontoTipo: 'R$', descontoValor: 0
                });
                if (!result.success) throw new Error(result.error || 'Erro ao registrar venda');
            }

            if (valorPago > 0) {
                await callAPI('registrarPagamento', { cliente, valor: valorPago, observacao: `Pagamento da venda de R$ ${totalVenda.toFixed(2)}` });
            }

            msg.innerHTML = `<div style="padding:12px;background:#c6f6d5;color:#22543d;border-radius:6px;">✅ Venda registrada! Total: R$ ${totalVenda.toFixed(2).replace('.', ',')}</div>`;
            mostrarToast('Venda registrada com sucesso!', 'success');

            document.querySelectorAll('.qtd-produto').forEach(el => el.value = 0);
            document.querySelectorAll('.produto-select').forEach(el => el.selectedIndex = 0);
            document.getElementById('totalVenda').textContent = 'R$ 0,00';
            document.getElementById('trocoOuPendente').textContent = 'R$ 0,00';
            document.getElementById('valorPago').value = '';
        } catch (error) {
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
        const app = document.getElementById('app');
        if (!app) return;
        mostrarLoading('clientes');

        try {
            const result = await callAPI('listarVendasPorCliente');
            let clientes = [];
            if (result.success && result.clientes) {
                clientes = Array.isArray(result.clientes) ? result.clientes : [];
                clientes = clientes.filter(c => c.nome && c.nome !== 'Cliente não informado');
                clientes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
            }

            let html = '';
            if (clientes.length > 0) {
                clientes.forEach(cliente => {
                    const totalGasto = parseFloat(cliente.totalGasto) || 0;
                    const totalPago = parseFloat(cliente.totalPago) || 0;
                    const saldo = totalGasto - totalPago;
                    const statusSaldo = saldo > 0.01 ? '🔴' : saldo < -0.01 ? '🟡' : '🟢';
                    const statusTexto = saldo > 0.01 ? 'A pagar' : saldo < -0.01 ? 'Crédito' : 'Quitado';
                    const nomeSafe = String(cliente.nome || '').replace(/'/g, "\\'");
                    const isExpanded = StateManager.getClienteExpandido() === cliente.nome;

                    html += `
                        <tr onclick="window.toggleDetalhesCliente('${nomeSafe}')" style="cursor:pointer;${isExpanded ? 'background:#f7fafc;' : ''}">
                            <td data-label="👤 Cliente" style="padding:8px;"><strong>${cliente.nome}</strong></td>
                            <td data-label="💰 Total Gasto" style="padding:8px;">R$ ${totalGasto.toFixed(2).replace('.', ',')}</td>
                            <td data-label="💵 Total Pago" style="padding:8px;">R$ ${totalPago.toFixed(2).replace('.', ',')}</td>
                            <td data-label="📊 Saldo" style="padding:8px;">${statusSaldo} R$ ${Math.abs(saldo).toFixed(2).replace('.', ',')} <small>(${statusTexto})</small></td>
                        </tr>
                        ${isExpanded ? `
                            <tr class="cliente-detalhe-row">
                                <td colspan="4" style="padding:0 !important;">
                                    <div class="cliente-detalhe-content" id="detalhe-${cliente.nome.replace(/[^a-zA-Z0-9]/g, '')}">
                                        <div style="text-align:center;padding:8px;"><div class="loading-spinner" style="font-size:16px;">⏳</div><p style="color:#667eea;font-size:12px;">Carregando...</p></div>
                                    </div>
                                </td>
                            </tr>
                        ` : ''}
                    `;
                });
            } else {
                html = `<tr><td colspan="4" style="text-align:center;padding:30px;"><p style="font-size:32px;">📭</p><p style="color:#666;">Nenhum cliente cadastrado</p></td></tr>`;
            }

            app.innerHTML = `
                <section style="animation:fadeIn 0.4s ease;">
                    <h2>👥 Clientes</h2>
                    <div style="background:#fff;padding:15px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <div style="margin-bottom:12px;display:flex;gap:8px;">
                            <input type="text" id="buscaCliente" placeholder="🔍 Buscar cliente..." style="flex:1;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                            <button onclick="document.getElementById('buscaCliente').value=''; window.carregarTabelaClientes();" style="background:#e2e8f0;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;">✕</button>
                        </div>
                        <div style="overflow-x:auto;">
                            <table class="clientes-table" style="width:100%;border-collapse:collapse;font-size:13px;">
                                <thead>
                                    <tr style="background:#3957ed;">
                                        <th style="padding:10px;text-align:left;color:#fff;">👤 Cliente</th>
                                        <th style="padding:10px;text-align:left;color:#fff;">💰 Total Gasto</th>
                                        <th style="padding:10px;text-align:left;color:#fff;">💵 Total Pago</th>
                                        <th style="padding:10px;text-align:left;color:#fff;">📊 Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>${html}</tbody>
                            </table>
                        </div>
                    </div>
                </section>
            `;

            document.getElementById('buscaCliente').addEventListener('input', (e) => carregarTabelaClientes(e.target.value));

            const expandido = StateManager.getClienteExpandido();
            if (expandido) {
                const safeNome = expandido.replace(/[^a-zA-Z0-9]/g, '');
                const detalheContainer = document.getElementById(`detalhe-${safeNome}`);
                if (detalheContainer) await carregarDetalhesCliente(expandido, detalheContainer);
            }
        } catch (error) {
            app.innerHTML = `<section style="animation:fadeIn 0.4s ease;"><h2>👥 Clientes</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
        }
    }

    async function carregarTabelaClientes(filtro = '') {
        try {
            const result = await callAPI('listarVendasPorCliente');
            let clientes = [];
            if (result.success && result.clientes) {
                clientes = Array.isArray(result.clientes) ? result.clientes : [];
                clientes = clientes.filter(c => c.nome && c.nome !== 'Cliente não informado');
                if (filtro) clientes = clientes.filter(c => c.nome.toLowerCase().includes(filtro.toLowerCase()));
                clientes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
            }

            const tbody = document.querySelector('.clientes-table tbody');
            if (!tbody) return;

            let html = '';
            if (clientes.length > 0) {
                clientes.forEach(cliente => {
                    const totalGasto = parseFloat(cliente.totalGasto) || 0;
                    const totalPago = parseFloat(cliente.totalPago) || 0;
                    const saldo = totalGasto - totalPago;
                    const statusSaldo = saldo > 0.01 ? '🔴' : saldo < -0.01 ? '🟡' : '🟢';
                    const statusTexto = saldo > 0.01 ? 'A pagar' : saldo < -0.01 ? 'Crédito' : 'Quitado';
                    const nomeSafe = String(cliente.nome || '').replace(/'/g, "\\'");
                    const isExpanded = StateManager.getClienteExpandido() === cliente.nome;

                    html += `
                        <tr onclick="window.toggleDetalhesCliente('${nomeSafe}')" style="cursor:pointer;${isExpanded ? 'background:#f7fafc;' : ''}">
                            <td data-label="👤 Cliente" style="padding:8px;"><strong>${cliente.nome}</strong></td>
                            <td data-label="💰 Total Gasto" style="padding:8px;">R$ ${totalGasto.toFixed(2).replace('.', ',')}</td>
                            <td data-label="💵 Total Pago" style="padding:8px;">R$ ${totalPago.toFixed(2).replace('.', ',')}</td>
                            <td data-label="📊 Saldo" style="padding:8px;">${statusSaldo} R$ ${Math.abs(saldo).toFixed(2).replace('.', ',')} <small>(${statusTexto})</small></td>
                        </tr>
                        ${isExpanded ? `
                            <tr class="cliente-detalhe-row">
                                <td colspan="4" style="padding:0 !important;">
                                    <div class="cliente-detalhe-content" id="detalhe-${cliente.nome.replace(/[^a-zA-Z0-9]/g, '')}">
                                        <div style="text-align:center;padding:8px;"><div class="loading-spinner" style="font-size:16px;">⏳</div></div>
                                    </div>
                                </td>
                            </tr>
                        ` : ''}
                    `;
                });
                tbody.innerHTML = html;

                const expandido = StateManager.getClienteExpandido();
                if (expandido) {
                    const safeNome = expandido.replace(/[^a-zA-Z0-9]/g, '');
                    const detalheContainer = document.getElementById(`detalhe-${safeNome}`);
                    if (detalheContainer) await carregarDetalhesCliente(expandido, detalheContainer);
                }
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;">Nenhum cliente encontrado</td></tr>`;
            }
        } catch (error) {
            console.error('Erro ao filtrar clientes:', error);
        }
    }

    window.toggleDetalhesCliente = async function(nomeCliente) {
        const current = StateManager.getClienteExpandido();
        StateManager.setClienteExpandido(current === nomeCliente ? null : nomeCliente);
        await carregarTabelaClientes(document.getElementById('buscaCliente')?.value || '');
    };

    async function carregarDetalhesCliente(nomeCliente, container) {
        if (!container) return;

        try {
            const [historicoCompras, historicoPagamentos, resumoCliente] = await Promise.all([
                callAPI('listarDetalhesCliente', { cliente: nomeCliente }),
                callAPI('listarPagamentosPorCliente', { cliente: nomeCliente }),
                callAPI('listarVendasPorCliente')
            ]);

            let totalGasto = 0, totalPago = 0;
            if (resumoCliente.success && resumoCliente.clientes) {
                const cliente = resumoCliente.clientes.find(c => c.nome?.toLowerCase() === nomeCliente.toLowerCase());
                if (cliente) {
                    totalGasto = parseFloat(cliente.totalGasto) || 0;
                    totalPago = parseFloat(cliente.totalPago) || 0;
                }
            }

            const saldo = totalGasto - totalPago;
            const statusSaldo = saldo > 0.01 ? 'A pagar' : saldo < -0.01 ? 'Crédito' : 'Quitado';
            const corSaldo = saldo > 0.01 ? '#e53e3e' : saldo < -0.01 ? '#dd6b20' : '#38a169';

            let comprasHtml = '';
            if (historicoCompras.success && Array.isArray(historicoCompras.historico) && historicoCompras.historico.length > 0) {
                comprasHtml = historicoCompras.historico.map(h => {
                    const data = h.data ? new Date(h.data) : new Date();
                    return `<tr><td>${data.toLocaleDateString('pt-BR')}</td><td>${h.produto || '-'}</td><td>${h.quantidade || 1}</td><td>R$ ${(parseFloat(h.total) || 0).toFixed(2).replace('.', ',')}</td></tr>`;
                }).join('');
            } else { comprasHtml = `<tr><td colspan="4" style="text-align:center;padding:15px;">Nenhuma compra</td></tr>`; }

            let pagamentosHtml = '';
            if (historicoPagamentos.success && Array.isArray(historicoPagamentos.pagamentos) && historicoPagamentos.pagamentos.length > 0) {
                pagamentosHtml = historicoPagamentos.pagamentos.map(p => {
                    const data = p.data ? new Date(p.data) : new Date();
                    return `<tr><td>${data.toLocaleDateString('pt-BR')}</td><td>R$ ${(parseFloat(p.valor) || 0).toFixed(2).replace('.', ',')}</td><td>${p.observacao || '-'}</td></tr>`;
                }).join('');
            } else { pagamentosHtml = `<tr><td colspan="3" style="text-align:center;padding:15px;">Nenhum pagamento</td></tr>`; }

            const idSufixo = nomeCliente.replace(/[^a-zA-Z0-9]/g, '');
            const nomeSafe = nomeCliente.replace(/'/g, "\\'");
            const isMobileDevice = isMobile();

            container.innerHTML = `
                <div style="background:#fff;padding:15px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <h4 style="margin:0;font-size:16px;">${nomeCliente}</h4>
                        <button onclick="window.toggleDetalhesCliente('${nomeSafe}')" style="background:#e53e3e;color:#fff;border:none;padding:4px 14px;border-radius:4px;cursor:pointer;font-size:12px;">✕ Fechar</button>
                    </div>
                    <div class="detalhes-grid" style="display:grid;grid-template-columns:${isMobileDevice ? '1fr 1fr' : 'repeat(auto-fit,minmax(120px,1fr))'};gap:8px;margin-bottom:12px;">
                        <div style="background:#f7fafc;padding:10px;border-radius:6px;text-align:center;"><p style="margin:0;font-size:10px;">TOTAL GASTO</p><p style="font-size:18px;font-weight:bold;margin:4px 0 0;color:#667eea;">R$ ${totalGasto.toFixed(2).replace('.', ',')}</p></div>
                        <div style="background:#f7fafc;padding:10px;border-radius:6px;text-align:center;"><p style="margin:0;font-size:10px;">TOTAL PAGO</p><p style="font-size:18px;font-weight:bold;margin:4px 0 0;color:#48bb78;">R$ ${totalPago.toFixed(2).replace('.', ',')}</p></div>
                    </div>
                    <div style="margin-bottom:10px;"><button onclick="window.compartilharExtrato('${nomeSafe}')" style="background:#25D366;color:#fff;border:none;padding:10px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;width:100%;">📱 Compartilhar Extrato</button></div>
                    <div style="margin-bottom:10px;display:flex;gap:6px;">
                        <button onclick="document.getElementById('abaCompras-${idSufixo}').style.display='block';document.getElementById('abaPagamentos-${idSufixo}').style.display='none';" style="flex:1;background:#667eea;color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer;font-size:12px;">📦 Compras</button>
                        <button onclick="document.getElementById('abaCompras-${idSufixo}').style.display='none';document.getElementById('abaPagamentos-${idSufixo}').style.display='block';" style="flex:1;background:#e2e8f0;color:#4a5568;border:none;padding:8px;border-radius:6px;cursor:pointer;font-size:12px;">💳 Pagamentos</button>
                    </div>
                    <div id="abaCompras-${idSufixo}" style="margin-bottom:10px;max-height:130px;overflow-y:auto;"><table style="width:100%;font-size:11px;"><thead><tr><th>Data</th><th>Produto</th><th>Qtd</th><th>Valor</th></tr></thead><tbody>${comprasHtml}</tbody></table></div>
                    <div id="abaPagamentos-${idSufixo}" style="display:none;margin-bottom:10px;max-height:130px;overflow-y:auto;"><table style="width:100%;font-size:11px;"><thead><tr><th>Data</th><th>Valor</th><th>Obs</th></tr></thead><tbody>${pagamentosHtml}</tbody></table></div>
                    <div class="acoes-grid" style="display:grid;grid-template-columns:${isMobileDevice ? '1fr' : '1fr 1fr'};gap:8px;">
                        <div style="background:#f7fafc;padding:10px;border-radius:6px;"><input type="number" id="valorPagamentoDetalhe-${idSufixo}" placeholder="Valor" min="0.01" step="0.01" style="width:100%;padding:6px;margin-bottom:6px;"><button onclick="window.registrarPagamentoInline('${nomeSafe}','${idSufixo}')" style="background:#48bb78;color:#fff;border:none;padding:6px;border-radius:4px;width:100%;">💵 Pagar</button><div id="msgPagamentoInline-${idSufixo}"></div></div>
                        <div style="background:#f0f4ff;padding:10px;border-radius:6px;"><input type="number" id="valorPixInline-${idSufixo}" placeholder="Valor" min="0.01" step="0.01" style="width:100%;padding:6px;margin-bottom:6px;"><button onclick="window.gerarPixInline('${nomeSafe}','${idSufixo}')" style="background:#1a73e8;color:#fff;border:none;padding:6px;border-radius:4px;width:100%;">📱 Pix</button><div id="msgPixInline-${idSufixo}"></div></div>
                    </div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = `<div style="padding:12px;color:#e53e3e;">❌ Erro ao carregar detalhes</div>`;
        }
    }

    window.registrarPagamentoInline = async function(nomeCliente, idSufixo) {
        const valorInput = document.getElementById(`valorPagamentoDetalhe-${idSufixo}`);
        const msgDiv = document.getElementById(`msgPagamentoInline-${idSufixo}`);
        const valor = parseFloat(valorInput?.value);

        if (isNaN(valor) || valor <= 0) {
            if (msgDiv) msgDiv.innerHTML = '<span style="color:#e53e3e;">Valor inválido</span>';
            return;
        }

        confirmarAcao(`Confirmar pagamento de R$ ${valor.toFixed(2).replace('.', ',')} de ${nomeCliente}?`, async () => {
            const result = await callAPI('registrarPagamento', { cliente: nomeCliente, valor, observacao: 'Pagamento registrado' });
            if (result.success) {
                mostrarToast('Pagamento registrado!', 'success');
                const detalheContainer = document.getElementById(`detalhe-${idSufixo}`);
                if (detalheContainer) await carregarDetalhesCliente(nomeCliente, detalheContainer);
                await carregarTabelaClientes(document.getElementById('buscaCliente')?.value || '');
            } else {
                mostrarToast(result.error || 'Erro ao registrar', 'error');
            }
        });
    };

    window.gerarPixInline = function(nomeCliente, idSufixo) {
        const valorInput = document.getElementById(`valorPixInline-${idSufixo}`);
        const valor = parseFloat(valorInput?.value);
        if (isNaN(valor) || valor <= 0) {
            mostrarToast('Valor inválido', 'error');
            return;
        }
        window.gerarQrCodePix(valor, `Pagamento de ${nomeCliente}`);
    };

    window.compartilharExtrato = async function(nomeCliente) {
        const res = await callAPI('listarDetalhesCliente', { cliente: nomeCliente });
        let texto = `📋 EXTRATO - ${nomeCliente}\n\n`;
        if (res.success && Array.isArray(res.historico)) {
            res.historico.forEach(h => {
                texto += `- ${h.produto} (${h.quantidade}x) = R$ ${(parseFloat(h.total)||0).toFixed(2).replace('.', ',')}\n`;
            });
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    };

    // ============================================================
    // VENDEDORA & COBRANÇAS
    // ============================================================
    async function renderVendedora() {
        const app = document.getElementById('app');
        if (!app) return;
        mostrarLoading('vendedora');

        app.innerHTML = `
            <section style="animation:fadeIn 0.4s ease;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h2>👩‍💼 Área da Vendedora</h2>
                    <button onclick="window.renderVendedora()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;">🔄 Atualizar</button>
                </div>
                <div style="background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="color:#2d3748;margin-bottom:8px;font-size:15px;">📅 Pagamentos Pendentes</h4>
                    <div id="promessasHojeContainer"><div style="text-align:center;padding:15px;">⏳ Carregando...</div></div>
                </div>
            </section>
        `;

        await carregarPromessasHoje();
    }

    async function carregarPromessasHoje() {
        const container = document.getElementById('promessasHojeContainer');
        if (!container) return;

        try {
            const result = await callAPI('listarPromessasPagamento');
            if (!result.success || !Array.isArray(result.promessas) || result.promessas.length === 0) {
                container.innerHTML = `<div style="background:#f0f4ff;padding:15px;border-radius:6px;text-align:center;color:#718096;font-size:13px;">✅ Nenhum pagamento pendente</div>`;
                return;
            }

            let html = '<div style="background:#fff;border-radius:6px;border:2px solid #48bb78;overflow:hidden;">';
            result.promessas.forEach(p => {
                const valor = parseFloat(p.saldo) || 0;
                if (valor > 0) {
                    const clienteSafe = String(p.cliente || '').replace(/'/g, "\\'");
                    html += `<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #eee;"><span>${p.cliente}</span><b>R$ ${valor.toFixed(2).replace('.', ',')}</b><button onclick="window.enviarCobranca('${clienteSafe}', ${valor}, '${p.whatsapp || ''}')" style="background:#25D366;color:#fff;border:none;padding:4px 8px;border-radius:4px;">💬 Cobrar</button></div>`;
                }
            });
            html += '</div>';
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = `<div style="color:red;">❌ Erro ao carregar</div>`;
        }
    }

    window.enviarCobranca = function(cliente, valor, whatsapp) {
        const mensagem = `Olá, ${cliente}! Tudo bem? 💕\nPassando para lembrar do seu pagamento de R$ ${valor.toFixed(2).replace('.', ',')}.\nChave Pix: ${CONFIG.PIX.chave}`;
        let url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        if (whatsapp) {
            const numero = whatsapp.replace(/\D/g, '');
            if (numero.length >= 10) url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
        }
        window.open(url, '_blank');
    };

    // ============================================================
    // PIX QR CODE
    // ============================================================
    window.gerarQrCodePix = function(valor, descricao = 'Pagamento') {
        if (!valor || valor <= 0) return mostrarToast('Valor inválido', 'error');
        const payload = gerarPayloadPix(valor, descricao);
        mostrarModalPix(payload, valor, descricao);
    };

    function gerarPayloadPix(valor, descricao) {
        const { chave, nomeRecebedor, cidade } = CONFIG.PIX;
        let payload = '00020126420014BR.GOV.BCB.PIX0114' + chave + '520400005303986';
        if (valor && valor > 0) {
            const vF = valor.toFixed(2);
            payload += '54' + String(vF.length).padStart(2, '0') + vF;
        }
        payload += '5802BR';
        const nomeLimpo = nomeRecebedor.substring(0, 25);
        payload += '59' + String(nomeLimpo.length).padStart(2, '0') + nomeLimpo;
        const cidadeLimpa = cidade.substring(0, 15);
        payload += '60' + String(cidadeLimpa.length).padStart(2, '0') + cidadeLimpa;
        payload += '62070503***6304';
        const crc = calcularCRC16(payload);
        payload += crc.toString(16).toUpperCase().padStart(4, '0');
        return payload;
    }

    function calcularCRC16(payload) {
        let crc = 0xFFFF;
        for (let i = 0; i < payload.length; i++) {
            crc ^= payload.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return crc;
    }

    function mostrarModalPix(payload, valor, descricao) {
        document.querySelector('.modal-pix')?.remove();
        const overlay = document.createElement('div');
        overlay.className = 'modal-pix';
        Object.assign(overlay.style, { position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '10001', padding: '20px' });
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;

        overlay.innerHTML = `
            <div style="background:white; padding:20px; border-radius:16px; max-width:400px; width:100%; text-align:center;">
                <h3>Pagar com Pix</h3>
                <p style="font-size:24px; font-weight:bold; color:#667eea;">R$ ${valor.toFixed(2).replace('.', ',')}</p>
                <img src="${qrCodeUrl}" alt="QR Code Pix" style="width:160px; height:160px; margin:0 auto; display:block;">
                <button onclick="navigator.clipboard.writeText('${payload}');mostrarToast('Pix copiado!');" style="background:#667eea;color:white;border:none;padding:8px 16px;border-radius:6px;margin-top:10px;">📋 Copiar Código Pix</button>
                <button onclick="this.closest('.modal-pix').remove()" style="background:#e2e8f0;border:none;padding:8px 16px;border-radius:6px;margin-top:10px;">Fechar</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    function init() {
        adicionarEstilosCSS();
        inicializarNavegacao();
        const app = document.getElementById('app');
        if (app) setTimeout(renderHome, 100);
    }

    window.renderHome = renderHome;
    window.renderEstoque = renderEstoque;
    window.renderVendas = renderVendas;
    window.renderClientes = renderClientes;
    window.renderVendedora = renderVendedora;
    window.mostrarToast = mostrarToast;
    window.confirmarAcao = confirmarAcao;
    window.carregarTabelaClientes = carregarTabelaClientes;
    window.gerarQrCodePix = gerarQrCodePix;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
