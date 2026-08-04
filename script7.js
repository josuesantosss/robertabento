// ============================================================
// SISTEMA DE VENDAS - VERSÃO OTIMIZADA V13.4
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // VERSÃO DO SISTEMA - CENTRALIZADA
    // ============================================================
    const SISTEMA = {
        VERSAO: 'v13.4',        // ← Mude aqui para atualizar a versão
        DATA: '2024',
        NOME: 'Sistema de Vendas',
        AUTOR: 'Roberta Bento',
        getVersaoCompleta() {
            return `${this.NOME} ${this.VERSAO}`;
        },
        getVersaoRodape() {
            return `${this.NOME} ${this.VERSAO}`;
        }
    };

    console.log(`🚀 Iniciando ${SISTEMA.getVersaoCompleta()}...`);

    // ============================================================
    // FUNÇÃO PARA ATUALIZAR VERSÃO NO HTML
    // ============================================================
    function atualizarVersaoHTML() {
        console.log('🔄 Atualizando versão no HTML...');
        
        const versaoElement = document.getElementById('versao-sistema');
        if (versaoElement) {
            versaoElement.textContent = SISTEMA.getVersaoRodape();
            console.log(`✅ Versão atualizada: ${SISTEMA.getVersaoRodape()}`);
        } else {
            console.warn('⚠️ Elemento #versao-sistema não encontrado');
        }
        
        const anoElement = document.getElementById('ano-atual');
        if (anoElement) {
            anoElement.textContent = new Date().getFullYear();
            console.log(`✅ Ano atualizado: ${new Date().getFullYear()}`);
        } else {
            console.warn('⚠️ Elemento #ano-atual não encontrado');
        }
    }

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
        CATEGORIAS: ['Perfumaria', 'Maquiagem', 'Cuidados com a Pele', 'Cuidados com o Corpo', 'Cabelos', 'Infantil', 'Masculina', 'Kit', 'Outra'],
        CACHE: {
            TTL: 2 * 60 * 1000,
            MAX_ITEMS: 50
        },
        TIMEOUT: {
            READ: 30000,  // Aumentado para 30 segundos
            WRITE: 45000  // Aumentado para 45 segundos
        }
    };

    // ============================================================
    // SISTEMA DE CACHE OTIMIZADO
    // ============================================================
    const Cache = {
        data: {},
        timeouts: {},
        ttl: CONFIG.CACHE.TTL,
        maxItems: CONFIG.CACHE.MAX_ITEMS,
        
        async get(key, fetchFn, ttl = this.ttl) {
            if (Object.keys(this.data).length > this.maxItems) {
                this.clearOldest();
            }
            
            const cached = this.data[key];
            if (cached && Date.now() - cached.timestamp < ttl) {
                console.log(`📦 Cache hit: ${key}`);
                return cached.data;
            }
            
            console.log(`🔄 Cache miss: ${key}`);
            try {
                const data = await fetchFn();
                this.set(key, data, ttl);
                return data;
            } catch (error) {
                console.error(`❌ Erro no cache para ${key}:`, error);
                if (cached) {
                    console.log(`⚠️ Usando cache expirado como fallback para ${key}`);
                    return cached.data;
                }
                throw error;
            }
        },
        
        set(key, data, ttl = this.ttl) {
            this.data[key] = { data, timestamp: Date.now() };
            
            if (this.timeouts[key]) {
                clearTimeout(this.timeouts[key]);
            }
            
            this.timeouts[key] = setTimeout(() => {
                delete this.data[key];
                delete this.timeouts[key];
                console.log(`🗑️ Cache expirado: ${key}`);
            }, ttl);
        },
        
        clearOldest() {
            const keys = Object.keys(this.data);
            if (keys.length > this.maxItems) {
                const oldest = keys.reduce((a, b) => {
                    return this.data[a].timestamp < this.data[b].timestamp ? a : b;
                });
                delete this.data[oldest];
                if (this.timeouts[oldest]) {
                    clearTimeout(this.timeouts[oldest]);
                    delete this.timeouts[oldest];
                }
                console.log(`🗑️ Cache removido (limite excedido): ${oldest}`);
            }
        },
        
        clear() {
            Object.values(this.timeouts).forEach(timeout => clearTimeout(timeout));
            this.data = {};
            this.timeouts = {};
            console.log('🗑️ Cache completamente limpo');
        },
        
        getSize() {
            return Object.keys(this.data).length;
        }
    };

    // ============================================================
    // DEBOUNCE PARA OTIMIZAR BUSCAS
    // ============================================================
    function debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ============================================================
    // DETECTAR DISPOSITIVO MÓVEL
    // ============================================================
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // ============================================================
    // FUNÇÃO DE RETRY PARA OPERAÇÕES CRÍTICAS
    // ============================================================
    async function fetchWithRetry(fetchFn, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Tentativa ${attempt}/${maxRetries}`);
                const result = await fetchFn();
                
                if (result && result.success === false) {
                    if (result.error && result.error.includes('Timeout')) {
                        console.warn(`⚠️ Timeout na tentativa ${attempt}, tentando novamente...`);
                        if (attempt === maxRetries) {
                            return result;
                        }
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        continue;
                    }
                    return result;
                }
                
                return result;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Erro na tentativa ${attempt}:`, error.message);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
        return { success: false, error: lastError ? lastError.message : 'Falha após múltiplas tentativas' };
    }

    // ============================================================
    // API CALL CORRIGIDA
    // ============================================================
    async function callAPI(action, data = null, useCache = true, ttl = CONFIG.CACHE.TTL) {
        let url = `${CONFIG.API_URL}?action=${action}`;
        if (data) {
            const params = new URLSearchParams(data);
            url += `&${params.toString()}`;
        }

        const isWriteAction = ['cadastrarProduto', 'atualizarProduto', 'excluirProduto', 
                               'registrarVenda', 'registrarPagamento', 'registrarPromessaPagamento'].includes(action);

        const fetchFn = async () => {
            try {
                console.log(`📤 Chamando API: ${action}`);
                console.log(`📤 URL: ${url}`);
                
                let controller;
                let timeout;
                
                // Para ações de escrita, timeout maior
                const timeoutMs = isWriteAction ? CONFIG.TIMEOUT.WRITE : CONFIG.TIMEOUT.READ;
                
                controller = new AbortController();
                timeout = setTimeout(() => controller.abort(), timeoutMs);
                
                const fetchOptions = {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    signal: controller.signal
                };
                
                const startTime = Date.now();
                const response = await fetch(url, fetchOptions);
                const endTime = Date.now();
                
                clearTimeout(timeout);
                
                console.log(`⏱️ Tempo de resposta: ${endTime - startTime}ms`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                const result = await response.json();
                console.log(`📥 Dados recebidos (${action}):`, result);
                return result;
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.error(`⏱️ Timeout na API (${action}) após ${CONFIG.TIMEOUT.READ}ms`);
                    return { success: false, error: 'Timeout na requisição' };
                }
                console.error(`❌ Erro na API (${action}):`, error);
                return { success: false, error: error.message };
            }
        };

        if (isWriteAction) {
            return await fetchWithRetry(fetchFn, 3);
        }

        if (useCache && !data) {
            return await Cache.get(action, fetchFn, ttl);
        } else {
            return await fetchFn();
        }
    }

    // ============================================================
    // TOAST OTIMIZADO
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
            fontWeight: '500', fontSize: '14px',
            animation: 'slideInRight 0.3s ease'
        });
        toast.innerHTML = `<span style="font-size:18px;">${icones[tipo] || 'ℹ️'}</span><span>${mensagem}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 300);
            }
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
            zIndex: '9999',
            animation: 'fadeIn 0.2s ease'
        });
        overlay.innerHTML = `
            <div style="background:white; padding:20px; border-radius:12px; max-width:400px; width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.2); animation:scaleIn 0.2s ease;">
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
    // ESTILOS CSS OTIMIZADOS
    // ============================================================
    function adicionarEstilosCSS() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
            @keyframes fadeIn{from{opacity:0}to{opacity:1}}
            @keyframes slideDown{from{transform:translateY(-10px);opacity:0}to{transform:translateY(0);opacity:1}}
            @keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
            @keyframes slideOutRight{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}
            @keyframes scaleIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}
            @keyframes pulse{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}
            
            .loading-spinner{animation:spin .8s linear infinite;display:inline-block}
            .card-dashboard{transition:all .2s ease}
            .card-dashboard:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(0,0,0,0.15)}
            .btn-primary{transition:all .15s ease;cursor:pointer}
            .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,0,0,0.1)}
            .btn-primary:active{transform:translateY(0)}
            
            .badge-hoje{background:#48bb78;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;display:inline-block}
            .badge-atraso{background:#e53e3e;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;display:inline-block}
            .badge-futuro{background:#ed8936;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;display:inline-block}
            
            .btn-extrato{transition:all .2s ease;cursor:pointer}
            .btn-extrato:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.15)}
            .btn-cobrar{transition:all .2s ease;cursor:pointer}
            .btn-cobrar:hover{transform:scale(1.05)}
            
            .produto-item{border-bottom:1px solid #e2e8f0;padding-bottom:10px;margin-bottom:10px}
            .produto-item:last-child{border-bottom:none;margin-bottom:0}
            .valor-pago-container{transition:all .3s ease}
            .valor-pago-container:focus-within{transform:scale(1.02)}
            .saudacao-card{animation:slideInRight .5s ease;transition:all .3s ease}
            .saudacao-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(102,126,234,0.4) !important}
            .btn-processing{animation:pulse 1.5s ease infinite}
            .edit-modal{animation:scaleIn .2s ease}
            .modal-pix{animation:fadeIn .3s ease}
            
            .cliente-detalhe-row td{padding:0 !important}
            .cliente-detalhe-content{padding:0 !important;background:transparent;border-radius:0;animation:fadeIn 0.3s ease}
            
            .skeleton-container{animation:fadeIn 0.3s ease}
            .skeleton-header{height:40px;background:#e2e8f0;border-radius:8px;margin-bottom:20px;position:relative;overflow:hidden}
            .skeleton-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}
            .skeleton-card{background:#f7fafc;padding:20px;border-radius:12px;position:relative;overflow:hidden}
            .skeleton-line{height:20px;background:#e2e8f0;border-radius:4px;margin-bottom:10px}
            .skeleton-line.short{width:60%}
            .skeleton-loading{position:relative;overflow:hidden;background:#f7fafc;min-height:200px;border-radius:12px}
            .skeleton-loading::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);animation:loading 1.5s infinite}
            @keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
            
            .skeleton-header::after,.skeleton-card::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);animation:loading 1.5s infinite}
            
            @media (max-width: 768px) {
                .clientes-table thead { display: none; }
                .clientes-table tbody tr {
                    display: block;
                    margin-bottom: 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 12px 15px;
                    background: white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
                }
                .clientes-table tbody tr:not(.cliente-detalhe-row) td {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0 !important;
                    border-bottom: 1px solid #f0f0f0;
                    font-size: 14px;
                }
                .clientes-table tbody tr td:last-child { border-bottom: none; }
                .clientes-table tbody tr td::before {
                    content: attr(data-label);
                    font-weight: 600;
                    color: #4a5568;
                    font-size: 13px;
                }
                .clientes-table tbody tr td:first-child {
                    font-weight: 600;
                    font-size: 16px;
                    color: #2d3748;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 10px !important;
                    margin-bottom: 4px;
                }
                .clientes-table tbody tr td:first-child::before { content: "👤 Cliente"; font-weight: 700; }
                .clientes-table tbody tr td:nth-child(2)::before { content: "💰 Total Gasto"; }
                .clientes-table tbody tr td:nth-child(3)::before { content: "💵 Total Pago"; }
                .clientes-table tbody tr td:nth-child(4)::before { content: "📊 Saldo"; }
                .clientes-table tbody tr td:nth-child(5)::before { content: "📋 Ações"; }
                .clientes-table tbody tr td:last-child {
                    justify-content: center !important;
                }
                .clientes-table tbody tr td:last-child button {
                    width: 100% !important;
                    padding: 8px !important;
                    font-size: 14px !important;
                }
                
                .cliente-detalhe-content .detalhes-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 8px !important;
                    margin-top: 10px !important;
                }
                .cliente-detalhe-content .detalhes-grid div {
                    padding: 10px !important;
                    font-size: 13px !important;
                    background: #f7fafc !important;
                    border-radius: 6px !important;
                    border: 1px solid #edf2f7 !important;
                }
                .cliente-detalhe-content .acoes-grid {
                    display: grid !important;
                    grid-template-columns: 1fr !important;
                    gap: 8px !important;
                    margin-top: 10px !important;
                }
                .cliente-detalhe-content table {
                    font-size: 11px !important;
                    width: 100% !important;
                    background: #f7fafc !important;
                    border-radius: 6px !important;
                    overflow: hidden !important;
                }
                .cliente-detalhe-content table td,
                .cliente-detalhe-content table th {
                    padding: 6px 8px !important;
                }
                .cliente-detalhe-content .tab-content {
                    max-height: none !important;
                    overflow-y: visible !important;
                    height: auto !important;
                }
                .cliente-detalhe-content .btn-compartilhar {
                    width: 100% !important;
                }
                .btn-extrato { font-size: 14px !important; padding: 12px !important; }
                .btn-extrato span { font-size: 20px !important; }
            }
            
            @media (min-width: 769px) {
                .clientes-table tbody tr td::before { display: none; }
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // BLOQUEAR ZOOM
    // ============================================================
    function bloquearZoom() {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);

        document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && ['+','-','=','_','0'].includes(e.key)) e.preventDefault();
        });
        document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
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
    // GERENCIADOR DE ESTADO OTIMIZADO
    // ============================================================
    const StateManager = {
        currentPage: 'home',
        filtroBusca: '',
        clienteExpandido: null,
        isLoading: false,
        pageCache: {},
        isInitialized: false,
        
        setPage(page) { 
            if (this.currentPage !== page) {
                this.currentPage = page; 
                this.pageCache[page] = null;
            }
        },
        getPage() { return this.currentPage; },
        setFiltro(filtro) { this.filtroBusca = filtro; },
        getFiltro() { return this.filtroBusca; },
        setClienteExpandido(nome) { this.clienteExpandido = nome; },
        getClienteExpandido() { return this.clienteExpandido; },
        setLoading(loading) { this.isLoading = loading; },
        isLoading() { return this.isLoading; },
        getPageCache(page) { return this.pageCache[page]; },
        setPageCache(page, data) { this.pageCache[page] = data; },
        setIsInitialized(value) { this.isInitialized = value; },
        getIsInitialized() { return this.isInitialized; }
    };

    // ============================================================
    // NAVEGAÇÃO COM LOADING SUAVE
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
                    Cache.clear();
                    mostrarLoadingSkeleton(page);
                    requestAnimationFrame(() => {
                        setTimeout(() => pageMap[page](), 100);
                    });
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                const shortcuts = { '1': 'home', '2': 'estoque', '3': 'vendas', '4': 'clientes', '5': 'vendedora' };
                if (shortcuts[e.key]) {
                    e.preventDefault();
                    document.querySelector(`[data-page="${shortcuts[e.key]}"]`)?.click();
                }
            }
        });
    }

    // ============================================================
    // SKELETON LOADING OTIMIZADO
    // ============================================================
    function mostrarLoadingSkeleton(page) {
        const app = document.getElementById('app');
        if (!app) return;
        
        const nomes = { 'home': 'Dashboard', 'estoque': 'Estoque', 'vendas': 'Vendas', 'clientes': 'Clientes', 'vendedora': 'Área da Vendedora' };
        const icones = { 'home': '🏠', 'estoque': '📦', 'vendas': '💰', 'clientes': '👥', 'vendedora': '👩‍💼' };
        
        const skeletons = {
            home: `
                <section style="animation:fadeIn 0.3s ease;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <h2>${icones[page] || '📄'} ${nomes[page] || page}</h2>
                    </div>
                    <div class="skeleton-container">
                        <div class="skeleton-header" style="height:80px;border-radius:15px;"></div>
                        <div class="skeleton-grid">
                            ${[1,2,3,4].map(() => `
                                <div class="skeleton-card">
                                    <div class="skeleton-line"></div>
                                    <div class="skeleton-line short"></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </section>
            `,
            estoque: `
                <section style="animation:fadeIn 0.3s ease;">
                    <h2>${icones[page] || '📄'} ${nomes[page] || page}</h2>
                    <div class="skeleton-container">
                        <div class="skeleton-header" style="height:100px;"></div>
                        <div class="skeleton-card">
                            ${[1,2,3,4,5].map(() => `
                                <div class="skeleton-line"></div>
                            `).join('')}
                        </div>
                    </div>
                </section>
            `,
            default: `
                <section style="animation:fadeIn 0.3s ease;">
                    <h2>${icones[page] || '📄'} ${nomes[page] || page}</h2>
                    <div class="skeleton-loading" style="min-height:300px;"></div>
                </section>
            `
        };
        
        app.innerHTML = skeletons[page] || skeletons.default;
    }

    function mostrarLoading(page) {
        mostrarLoadingSkeleton(page);
    }

    // ============================================================
    // PIX QR CODE
    // ============================================================
    window.gerarQrCodePix = function(valor, descricao = 'Pagamento') {
        if (!valor || valor <= 0) {
            mostrarToast('Valor inválido para gerar QR Code', 'error');
            return;
        }

        const txid = 'VENDA' + Date.now().toString().slice(-8);
        const payload = gerarPayloadPix(
            CONFIG.PIX.chave,
            CONFIG.PIX.nomeRecebedor,
            CONFIG.PIX.cidade,
            valor,
            descricao,
            txid
        );

        mostrarModalPix(payload, valor, descricao);
    };

    function gerarPayloadPix(chave, nome, cidade, valor, descricao, txid) {
        chave = chave.trim();
        nome = removerAcentos(nome.trim()).substring(0, 25);
        cidade = removerAcentos(cidade.trim()).substring(0, 15);
        txid = (txid && txid.trim()) ? txid.trim().substring(0, 25) : '***';

        if (!chave) throw new Error('Chave Pix não configurada');

        let payload = '000201';
        const gui = '0014BR.GOV.BCB.PIX';
        const chaveLen = String(chave.length).padStart(2, '0');
        const merchantAccount = gui + '01' + chaveLen + chave;
        const merchantAccountLen = String(merchantAccount.length).padStart(2, '0');
        payload += '26' + merchantAccountLen + merchantAccount;
        payload += '52040000';
        payload += '5303986';
        if (valor && valor > 0) {
            const valorFormatado = valor.toFixed(2);
            const valorLen = String(valorFormatado.length).padStart(2, '0');
            payload += '54' + valorLen + valorFormatado;
        }
        payload += '5802BR';
        const nomeLen = String(nome.length).padStart(2, '0');
        payload += '59' + nomeLen + nome;
        const cidadeLen = String(cidade.length).padStart(2, '0');
        payload += '60' + cidadeLen + cidade;
        const txidValue = '05' + String(txid.length).padStart(2, '0') + txid;
        const txidLen = String(txidValue.length).padStart(2, '0');
        payload += '62' + txidLen + txidValue;
        payload += '6304';
        const crc = calcularCRC16(payload);
        const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
        payload += crcHex;

        console.log('📤 Payload Pix gerado:', payload);
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
        const polynomial = 0x1021;
        let crc = 0xFFFF;
        for (let i = 0; i < payload.length; i++) {
            crc ^= payload.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ polynomial;
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

        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(payload)}`;

        overlay.innerHTML = `
            <div style="background:white; padding:20px; border-radius:16px; max-width:480px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.3); position:relative; animation:scaleIn 0.3s ease;">
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
                    <div style="margin-top:10px;">
                        <button onclick="validarPix('${payload.replace(/'/g, "\\'")}')" style="background:transparent; border:1px solid #667eea; color:#667eea; padding:5px 10px; border-radius:4px; font-size:10px; cursor:pointer;">
                            🔍 Validar código Pix
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    function validarPix(payload) {
        const url = `https://pix.ingressos.etc.br/validador/?pix=${encodeURIComponent(payload)}`;
        window.open(url, '_blank');
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
    // ENVIAR COBRANÇA VIA WHATSAPP
    // ============================================================
    window.enviarCobranca = function(cliente, valor, whatsapp) {
        const clienteStr = String(cliente || 'Cliente');
        const whatsappStr = String(whatsapp || '');
        const valorNum = parseFloat(valor) || 0;

        const mensagem = `Olá, querida! Tudo bem? 💕\n\n` +
                 `Passando rapidinho para te lembrar do vencimento da sua parcela hoje!\n` +
                 `Assim você garante seus atendimentos e novidades sem preocupação! 😉🥰\n\n` +
                 `📲 Chave Pix: ${CONFIG.PIX.chave}\n\n` +
                 `📄 Comprovante: Pode me enviar por aqui mesmo!\n\n` +
                 `Agradeço demais a sua confiança e preferência de sempre! 🌷`;

        let url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

        if (whatsappStr) {
            const numero = whatsappStr.replace(/\D/g, '');
            if (numero.length >= 10) {
                url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
            }
        }

        window.open(url, '_blank');
    };

    // ============================================================
    // HOME (DASHBOARD) OTIMIZADO COM LOADING
    // ============================================================
    async function renderHome() {
        const app = document.getElementById('app');
        if (!app) return;

        const { saudacao, horario } = obterSaudacao();
        
        // Mostra skeleton loading primeiro
        mostrarLoadingSkeleton('home');

        // Adiciona indicador de carregamento
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255,255,255,0.95);
            padding: 30px 40px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 9999;
            text-align: center;
            display: none;
        `;
        loadingIndicator.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 10px;">⏳</div>
            <div style="font-size: 16px; color: #667eea; font-weight: 600;">Carregando dados...</div>
            <div style="font-size: 12px; color: #999; margin-top: 5px;">Aguarde, estamos preparando tudo para você</div>
        `;
        document.body.appendChild(loadingIndicator);

        try {
            // Mostra loading
            loadingIndicator.style.display = 'block';
            
            console.log('📊 Iniciando carregamento do dashboard...');
            
            // Carrega dados com timeout maior e retry
            const [produtosResult, vendasResult] = await Promise.all([
                callAPI('listarProdutos', null, true, 60000),
                callAPI('listarVendas', null, true, 60000)
            ]);

            console.log('✅ Dados principais carregados');

            // Carrega promessas em background
            let promessasResult = null;
            try {
                promessasResult = await callAPI('listarPromessasPagamento', null, true, 60000);
                console.log('✅ Promessas carregadas');
            } catch (e) {
                console.warn('⚠️ Erro ao carregar promessas:', e);
            }

            // Processa os dados
            let totalProdutos = 0, valorTotalEstoque = 0, produtosBaixoEstoque = 0, produtosEsgotados = 0;
            if (produtosResult && produtosResult.success && produtosResult.produtos) {
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

            if (vendasResult && vendasResult.success && vendasResult.vendas) {
                vendasResult.vendas.forEach(venda => {
                    const dataVenda = new Date(venda.data);
                    const total = parseFloat(venda.total) || 0;
                    totalVendasGeral += total;
                    if (dataVenda.toDateString() === hoje.toDateString()) totalVendasHoje += total;
                    if (dataVenda >= inicioMes) totalVendasMes += total;
                });
            }

            // Oculta loading
            loadingIndicator.style.display = 'none';

            // Renderiza o dashboard
            renderizarDashboard(app, {
                saudacao,
                horario,
                totalProdutos,
                valorTotalEstoque,
                produtosBaixoEstoque,
                produtosEsgotados,
                totalVendasHoje,
                totalVendasMes,
                totalVendasGeral,
                vendasResult,
                hoje,
                inicioMes,
                promessasResult
            });

        } catch (error) {
            console.error('❌ Erro no renderHome:', error);
            loadingIndicator.style.display = 'none';
            
            app.innerHTML = `
                <section style="animation:fadeIn 0.4s ease;">
                    <h2>🏠 Dashboard</h2>
                    <div style="text-align:center;padding:30px;background:#fff5f5;border-radius:12px;border:2px solid #e53e3e;">
                        <p style="font-size:48px;">😕</p>
                        <h3 style="color:#e53e3e;">Erro ao carregar dados</h3>
                        <p style="color:#666;font-size:14px;">${error.message}</p>
                        <button onclick="window.renderHome()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;margin-top:10px;font-size:14px;">🔄 Tentar novamente</button>
                        <div style="margin-top:15px;font-size:12px;color:#999;">
                            <p>💡 Dica: Verifique sua conexão com a internet</p>
                            <p>⏱️ O servidor pode estar demorando para responder</p>
                        </div>
                    </div>
                </section>
            `;
        }
    }

    function renderizarDashboard(app, dados) {
        const {
            saudacao, horario, totalProdutos, valorTotalEstoque,
            produtosBaixoEstoque, produtosEsgotados, totalVendasHoje,
            totalVendasMes, totalVendasGeral, vendasResult,
            hoje, inicioMes, promessasResult
        } = dados;

        let graficoHTML = '';
        if (vendasResult && vendasResult.success && vendasResult.vendas && vendasResult.vendas.length > 0) {
            const vendasPorDia = {};
            const ultimos7Dias = [];
            for (let i = 6; i >= 0; i--) {
                const data = new Date(hoje);
                data.setDate(data.getDate() - i);
                const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                ultimos7Dias.push(dataStr);
                vendasPorDia[dataStr] = 0;
            }
            vendasResult.vendas.forEach(v => {
                const dataVenda = new Date(v.data);
                const dataStr = dataVenda.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                if (vendasPorDia[dataStr] !== undefined) vendasPorDia[dataStr] += parseFloat(v.total) || 0;
            });
            const valores = ultimos7Dias.map(d => vendasPorDia[d]);
            const maxValor = Math.max(...valores, 1);

            graficoHTML = `
                <div style="margin-top:20px; background:white; padding:20px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin:0 0 20px 0;">📊 Vendas dos Últimos 7 Dias</h3>
                    <div style="display:flex; align-items:flex-end; gap:8px; height:200px; padding:0 10px;">
                        ${ultimos7Dias.map((dia, i) => {
                            const altura = Math.max((valores[i] / maxValor) * 100, 1);
                            return `
                                <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
                                    <span style="font-size:10px; margin-bottom:5px; color:#667eea; font-weight:bold;">
                                        ${valores[i] > 0 ? 'R$ ' + valores[i].toFixed(0) : ''}
                                    </span>
                                    <div style="background:linear-gradient(180deg, #667eea, #764ba2); width:100%; height:${altura}%; border-radius:4px 4px 0 0; transition:all 0.3s ease; cursor:pointer;" 
                                         title="${dia}: R$ ${valores[i].toFixed(2)}"
                                         onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                    </div>
                                    <span style="font-size:10px; margin-top:8px; color:#666;">${dia}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // Determina status dos pagamentos
        let promessasHoje = 0, promessasAtraso = 0;
        if (promessasResult && promessasResult.success && promessasResult.promessas) {
            const hojeStr = hoje.toDateString();
            promessasResult.promessas.forEach(p => {
                const saldo = parseFloat(p.saldo) || 0;
                const status = String(p.status || 'pendente');
                if (saldo > 0 && status !== 'pago') {
                    let dataPagamento = new Date();
                    if (p.dataPagamento) {
                        dataPagamento = new Date(p.dataPagamento);
                    }
                    if (dataPagamento.toDateString() === hojeStr) {
                        promessasHoje++;
                    } else if (dataPagamento < hoje) {
                        promessasAtraso++;
                    }
                }
            });
        }

        const statusHojeHTML = promessasHoje > 0 ?
            `<div style="background:#fff5f5; border:2px solid #e53e3e; border-radius:8px; padding:15px; text-align:center;">
                <span style="font-size:32px;">⚠️</span>
                <p style="font-weight:bold; color:#e53e3e; margin:5px 0 0 0;">Há pagamentos pendentes para hoje</p>
                <p style="color:#e53e3e; margin:0;">${promessasHoje} cliente(s) com pagamento prometido</p>
            </div>` :
            `<div style="background:#f0fff4; border:2px solid #48bb78; border-radius:8px; padding:15px; text-align:center;">
                <span style="font-size:32px;">✅</span>
                <p style="font-weight:bold; color:#38a169; margin:5px 0 0 0;">Nenhum pagamento pendente para hoje</p>
            </div>`;

        const statusAtrasoHTML = promessasAtraso > 0 ?
            `<div style="background:#fff5f5; border:2px solid #e53e3e; border-radius:8px; padding:15px; text-align:center;">
                <span style="font-size:32px;">🔴</span>
                <p style="font-weight:bold; color:#e53e3e; margin:5px 0 0 0;">Há pagamentos em atraso</p>
                <p style="color:#e53e3e; margin:0;">${promessasAtraso} cliente(s) com pagamento atrasado</p>
            </div>` :
            `<div style="background:#f0fff4; border:2px solid #48bb78; border-radius:8px; padding:15px; text-align:center;">
                <span style="font-size:32px;">✅</span>
                <p style="font-weight:bold; color:#38a169; margin:5px 0 0 0;">Nenhum pagamento em atraso</p>
            </div>`;

        app.innerHTML = `
            <section style="animation:fadeIn 0.4s ease;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h2>🏠 Dashboard</h2>
                    <button onclick="window.atualizarDashboard()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:500;font-size:12px;">🔄 Atualizar</button>
                </div>
                <div class="saudacao-card" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:18px 22px;border-radius:15px;margin-bottom:18px;box-shadow:0 4px 15px rgba(102,126,234,0.3);">
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="background:rgba(255,255,255,0.2);border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                                <img src="img/face.png" alt="Face" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                            </div>
                            <div>
                                <p style="font-size:13px;margin:0;opacity:0.9;font-weight:300;">${saudacao},</p>
                                <p style="font-size:26px;margin:2px 0 0 0;font-weight:700;text-shadow:2px 2px 4px rgba(0,0,0,0.2);">Roberta! 👋</p>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.15);padding:10px 14px;border-radius:10px;">
                                <span style="font-size:20px;">🕐</span>
                                <div>
                                    <p style="font-size:9px;margin:0;opacity:0.8;text-transform:uppercase;letter-spacing:1px;">Agora</p>
                                    <p style="font-size:22px;margin:0;font-weight:700;letter-spacing:1px;">${horario}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px;">
                    <div style="background:white;border-radius:10px;padding:15px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <h4 style="margin:0 0 10px 0;color:#e53e3e;font-size:13px;">📅 Pagamentos Pendentes Hoje</h4>
                        ${statusHojeHTML}
                    </div>
                    <div style="background:white;border-radius:10px;padding:15px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <h4 style="margin:0 0 10px 0;color:#e53e3e;font-size:13px;">⚠️ Pagamentos em Atraso</h4>
                        ${statusAtrasoHTML}
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
                    <div class="card-dashboard" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:18px;border-radius:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:start;">
                            <div><h3 style="margin:0 0 6px 0;font-size:11px;opacity:0.9;">📦 Total Produtos</h3><p style="font-size:28px;font-weight:bold;margin:0;">${totalProdutos}</p></div>
                            <span style="font-size:24px;opacity:0.5;">📦</span>
                        </div>
                        <small style="opacity:0.8;font-size:11px;">Produtos cadastrados</small>
                    </div>
                    <div class="card-dashboard" style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);color:#fff;padding:18px;border-radius:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:start;">
                            <div><h3 style="margin:0 0 6px 0;font-size:11px;opacity:0.9;">💰 Estoque Total</h3><p style="font-size:28px;font-weight:bold;margin:0;">R$ ${valorTotalEstoque.toFixed(2).replace('.', ',')}</p></div>
                            <span style="font-size:24px;opacity:0.5;">💰</span>
                        </div>
                        <small style="opacity:0.8;font-size:11px;">Valor total em estoque</small>
                    </div>
                    <div class="card-dashboard" style="background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%);color:#fff;padding:18px;border-radius:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:start;">
                            <div><h3 style="margin:0 0 6px 0;font-size:11px;opacity:0.9;">💵 Vendas Hoje</h3><p style="font-size:28px;font-weight:bold;margin:0;">R$ ${totalVendasHoje.toFixed(2).replace('.', ',')}</p></div>
                            <span style="font-size:24px;opacity:0.5;">💵</span>
                        </div>
                        <small style="opacity:0.8;font-size:11px;">${hoje.toLocaleDateString('pt-BR')}</small>
                    </div>
                    <div class="card-dashboard" style="background:linear-gradient(135deg,#43e97b 0%,#38f9d7 100%);color:#1a202c;padding:18px;border-radius:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:start;">
                            <div><h3 style="margin:0 0 6px 0;font-size:11px;opacity:0.9;">📊 Vendas do Mês</h3><p style="font-size:28px;font-weight:bold;margin:0;">R$ ${totalVendasMes.toFixed(2).replace('.', ',')}</p></div>
                            <span style="font-size:24px;opacity:0.5;">📊</span>
                        </div>
                        <small style="opacity:0.8;font-size:11px;">Desde ${inicioMes.toLocaleDateString('pt-BR')}</small>
                    </div>
                </div>
                ${(produtosBaixoEstoque > 0 || produtosEsgotados > 0) ? `
                    <div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;">
                        ${produtosBaixoEstoque > 0 ? `<div style="padding:10px;background:#fff3cd;border:2px solid #ffc107;border-radius:6px;color:#856404;font-size:12px;"><strong>⚠️</strong> ${produtosBaixoEstoque} com estoque baixo</div>` : ''}
                        ${produtosEsgotados > 0 ? `<div style="padding:10px;background:#f8d7da;border:2px solid #dc3545;border-radius:6px;color:#721c24;font-size:12px;"><strong>🔴</strong> ${produtosEsgotados} esgotados</div>` : ''}
                    </div>
                ` : ''}
                ${graficoHTML}
                <div style="margin-top:12px;padding:15px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin:0 0 10px 0;font-size:15px;">📈 Resumo Geral</h3>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
                        <div><p style="color:#666;margin:0;font-size:11px;">Total em Vendas</p><p style="font-size:18px;font-weight:bold;color:#667eea;margin:2px 0;">R$ ${totalVendasGeral.toFixed(2).replace('.', ',')}</p></div>
                        <div><p style="color:#666;margin:0;font-size:11px;">Ticket Médio</p><p style="font-size:18px;font-weight:bold;color:#667eea;margin:2px 0;">R$ ${vendasResult.vendas && vendasResult.vendas.length > 0 ? (totalVendasGeral / vendasResult.vendas.length).toFixed(2).replace('.', ',') : '0,00'}</p></div>
                    </div>
                </div>
            </section>
        `;
    }

    // ============================================================
    // INICIALIZAÇÃO - CORRIGIDA COM LOADING
    // ============================================================
    function init() {
        console.log(`🚀 Iniciando ${SISTEMA.getVersaoCompleta()}...`);
        
        // Aguarda o DOM estar completamente carregado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                iniciarSistema();
            });
        } else {
            iniciarSistema();
        }
    }

    function iniciarSistema() {
        console.log('✅ DOM pronto, inicializando sistema...');
        
        adicionarEstilosCSS();
        bloquearZoom();
        inicializarNavegacao();
        
        // Atualiza a versão no HTML
        setTimeout(() => {
            atualizarVersaoHTML();
        }, 100);
        
        // Tenta novamente após 500ms se não encontrar os elementos
        setTimeout(() => {
            const versaoElement = document.getElementById('versao-sistema');
            if (!versaoElement || !versaoElement.textContent) {
                console.warn('⚠️ Tentando atualizar versão novamente...');
                atualizarVersaoHTML();
            }
        }, 500);
        
        const app = document.getElementById('app');
        if (!app) {
            console.error('❌ Elemento #app não encontrado!');
            return;
        }
        
        // Mostra loading inicial
        mostrarLoadingSkeleton('home');
        
        // Carrega o dashboard com delay para garantir que tudo esteja pronto
        setTimeout(() => {
            renderHome();
        }, 300);
        
        console.log(`✅ ${SISTEMA.getVersaoCompleta()} inicializado com sucesso!`);
        console.log(`📊 Cache size: ${Cache.getSize()}`);
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
    window.carregarTabelaClientes = window.carregarTabelaClientes;
    window.toggleDetalhesCliente = window.toggleDetalhesCliente;
    window.cadastrarNovoCliente = window.cadastrarNovoCliente;
    window.abrirEdicaoProduto = window.abrirEdicaoProduto;
    window.confirmarExclusaoProduto = window.confirmarExclusaoProduto;
    window.registrarPagamentoInline = window.registrarPagamentoInline;
    window.gerarPixInline = window.gerarPixInline;
    window.compartilharExtrato = window.compartilharExtrato;
    window.gerarQrCodePix = window.gerarQrCodePix;
    window.gerarExtrato = window.gerarExtrato;
    window.gerarExtratoPagamentos = window.gerarExtratoPagamentos;
    window.fecharResultadoExtrato = window.fecharResultadoExtrato;
    window.compartilharExtratoVendedora = window.compartilharExtratoVendedora;
    window.compartilharExtratoPagamentos = window.compartilharExtratoPagamentos;
    window.atualizarVendedora = window.atualizarVendedora;
    window.enviarCobranca = window.enviarCobranca;
    window.carregarPromessasHoje = window.carregarPromessasHoje;
    window.atualizarDashboard = window.atualizarDashboard;
    window.tentarCadastrarNovamente = window.tentarCadastrarNovamente;

    // Inicia o sistema
    init();

})();