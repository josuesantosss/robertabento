// ============================================================
// SISTEMA DE VENDAS - VERSÃO CORRIGIDA
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // CONFIGURAÇÕES
    // ============================================================
    const CONFIG = {
        API_URL: 'https://script.google.com/macros/s/AKfycbzDoNt-58HOvCOqCr2xuXGVuFs4AFjJAiAwuEO3kF82dEmzt8_fq2NNgRPeEbHix2Q-2A/exec',
        CACHE_TIMEOUT: 30000,
        API_TIMEOUT: 8000,
        PIX: {
            chave: '27194177854',
            nomeRecebedor: 'Roberta Bento',
            cidade: 'Monte Azul Pta-SP'
        },
        MARCAS: ['Natura', 'Mary Kay', 'Eudora', 'Boticário', 'Outra'],
        CATEGORIAS: ['Perfumaria', 'Maquiagem', 'Cuidados com a Pele', 'Cuidados com o Corpo', 'Cabelos', 'Infantil', 'Masculina', 'Kit', 'Outra']
    };

    // ============================================================
    // CACHE
    // ============================================================
    const Cache = {
        data: {},
        timeout: CONFIG.CACHE_TIMEOUT,
        get(key, fetchFn) {
            const cached = this.data[key];
            if (cached && Date.now() - cached.timestamp < this.timeout) {
                return Promise.resolve(cached.data);
            }
            return fetchFn().then(data => {
                this.data[key] = { data, timestamp: Date.now() };
                return data;
            });
        },
        clear() { this.data = {}; }
    };

    // ============================================================
    // SAUDAÇÃO CACHEADA
    // ============================================================
    let saudacaoCache = null;
    function obterSaudacao() {
        if (saudacaoCache) return saudacaoCache;
        const agora = new Date();
        const hora = agora.getHours();
        let saudacao = hora >= 5 && hora < 12 ? 'Bom dia' : hora >= 12 && hora < 18 ? 'Boa tarde' : 'Boa noite';
        const horario = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        saudacaoCache = { saudacao, horario };
        return saudacaoCache;
    }

    // ============================================================
    // API CALL
    // ============================================================
    async function callAPI(action, data = null, useCache = true) {
        let url = `${CONFIG.API_URL}?action=${action}`;
        if (data) {
            const params = new URLSearchParams(data);
            url += `&${params.toString()}`;
        }

        const fetchFn = () => {
            return new Promise((resolve) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
                
                fetch(url, { 
                    method: 'GET',
                    signal: controller.signal,
                    headers: { 'Cache-Control': 'no-cache' }
                })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.json();
                })
                .then(result => resolve(result))
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.error('API Error:', error);
                    resolve({ success: false, error: error.message });
                });
            });
        };

        if (useCache && !data) {
            return Cache.get(action, fetchFn);
        }
        return fetchFn();
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
            background: cores[tipo], color: 'white',
            padding: '10px 16px', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '10000', maxWidth: '350px',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontWeight: '500', fontSize: '13px',
            animation: 'slideInRight 0.2s ease'
        });
        toast.innerHTML = `<span style="font-size:16px;">${icones[tipo]}</span><span>${mensagem}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.2s ease';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 200);
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
            zIndex: '9999', animation: 'fadeIn 0.15s ease'
        });
        overlay.innerHTML = `
            <div style="background:white; padding:20px; border-radius:12px; max-width:400px; width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.2); animation:scaleIn 0.15s ease;">
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
            overlay.style.animation = 'fadeOut 0.15s ease';
            setTimeout(() => { overlay.remove(); callback(); }, 150);
        };
        overlay.querySelector('.btn-cancelar').onclick = () => {
            overlay.style.animation = 'fadeOut 0.15s ease';
            setTimeout(() => overlay.remove(), 150);
        };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.animation = 'fadeOut 0.15s ease';
                setTimeout(() => overlay.remove(), 150);
            }
        });
    }

    // ============================================================
    // ESTILOS CSS
    // ============================================================
    function adicionarEstilosCSS() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
            @keyframes slideOutRight{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}
            @keyframes fadeIn{from{opacity:0}to{opacity:1}}
            @keyframes fadeOut{from{opacity:1}to{opacity:0}}
            @keyframes scaleIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}
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
            .cliente-detalhe-row td{padding:0 !important}
            .cliente-detalhe-content{padding:15px;background:#f7fafc;border-radius:0 0 8px 8px}
            .btn-extrato{transition:all .2s ease;cursor:pointer}
            .btn-extrato:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.15)}
            .btn-cobrar{transition:all .2s ease;cursor:pointer}
            .btn-cobrar:hover{transform:scale(1.05)}
            @media(max-width:480px){.btn-extrato{font-size:14px !important;padding:12px !important}.btn-extrato span{font-size:20px !important}}
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // BLOQUEAR ZOOM
    // ============================================================
    function bloquearZoom() {
        document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && ['+','-','=','_','0'].includes(e.key)) e.preventDefault();
        });
        document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
    }

    // ============================================================
    // GERENCIADOR DE ESTADO
    // ============================================================
    const StateManager = {
        currentPage: 'home',
        filtroBusca: '',
        clienteExpandido: null,
        setPage(page) { this.currentPage = page; },
        getPage() { return this.currentPage; },
        setFiltro(filtro) { this.filtroBusca = filtro; },
        getFiltro() { return this.filtroBusca; },
        setClienteExpandido(nome) { this.clienteExpandido = nome; },
        getClienteExpandido() { return this.clienteExpandido; }
    };

    // ============================================================
    // NAVEGAÇÃO
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
                    Cache.clear();
                    setTimeout(() => pageMap[page](), 50);
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
    // PIX - FUNÇÕES SIMPLIFICADAS
    // ============================================================
    window.gerarQrCodePix = function(valor, descricao = 'Pagamento') {
        if (!valor || valor <= 0) {
            mostrarToast('Valor inválido para gerar QR Code', 'error');
            return;
        }
        // Implementação simplificada do Pix
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
    // ENVIAR COBRANÇA
    // ============================================================
    window.enviarCobranca = function(cliente, valor, whatsapp) {
        const mensagem = `Olá, querida! Tudo bem? 💕\n\nPassando rapidinho para te lembrar do vencimento da sua parcela hoje!\nAssim você garante seus atendimentos e novidades sem preocupação! 😉🥰\n\n📲 Chave Pix: ${CONFIG.PIX.chave}\n\n📄 Comprovante: Pode me enviar por aqui mesmo!\n\nAgradeço demais a sua confiança e preferência de sempre! 🌷`;
        let url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        if (whatsapp) {
            const numero = whatsapp.replace(/\D/g, '');
            if (numero.length >= 10) url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
        }
        window.open(url, '_blank');
    };

    // ============================================================
    // HOME (DASHBOARD)
    // ============================================================
    async function renderHome() {
        const app = document.getElementById('app');
        if (!app) {
            console.error('Elemento #app não encontrado!');
            return;
        }
        const { saudacao, horario } = obterSaudacao();

        // Mostrar loading
        app.innerHTML = `
            <section>
                <h2>🏠 Dashboard</h2>
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
                <div style="text-align:center;padding:25px;">
                    <div class="loading-spinner" style="font-size:24px;">⏳</div>
                    <p style="color:#667eea;margin-top:6px;font-size:14px;">Carregando dados...</p>
                </div>
            </section>
        `;

        try {
            const [produtosResult, vendasResult] = await Promise.all([
                callAPI('listarProdutos', null, false),
                callAPI('listarVendas', null, false)
            ]);

            let totalProdutos = 0, valorTotalEstoque = 0;
            if (produtosResult.success && produtosResult.produtos) {
                totalProdutos = produtosResult.produtos.length;
                produtosResult.produtos.forEach(produto => {
                    const preco = parseFloat(produto.preco) || 0;
                    const quantidade = parseInt(produto.quantidade) || 0;
                    valorTotalEstoque += preco * quantidade;
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

            app.innerHTML = `
                <section>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <h2>🏠 Dashboard</h2>
                        <button onclick="window.atualizarDashboard()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:500;font-size:12px;cursor:pointer;">🔄 Atualizar</button>
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
                    <div style="margin-top:12px;padding:15px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="margin:0 0 10px 0;font-size:15px;">📈 Resumo Geral</h3>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
                            <div><p style="color:#666;margin:0;font-size:11px;">Total em Vendas</p><p style="font-size:18px;font-weight:bold;color:#667eea;margin:2px 0;">R$ ${totalVendasGeral.toFixed(2).replace('.', ',')}</p></div>
                            <div><p style="color:#666;margin:0;font-size:11px;">Ticket Médio</p><p style="font-size:18px;font-weight:bold;color:#667eea;margin:2px 0;">R$ ${vendasResult.vendas && vendasResult.vendas.length > 0 ? (totalVendasGeral / vendasResult.vendas.length).toFixed(2).replace('.', ',') : '0,00'}</p></div>
                        </div>
                    </div>
                </section>
            `;

        } catch (error) {
            console.error('Erro no renderHome:', error);
            app.innerHTML = `
                <section><h2>🏠 Dashboard</h2>
                <div style="text-align:center;padding:25px;color:#e53e3e;">
                    <p style="font-size:36px;">😕</p>
                    <p>❌ Erro: ${error.message}</p>
                    <button onclick="window.renderHome()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-top:6px;">🔄 Tentar novamente</button>
                </div></section>
            `;
        }
    }

    window.atualizarDashboard = function() {
        mostrarToast('Atualizando...', 'info');
        Cache.clear();
        renderHome();
    };

    // ============================================================
    // ESTOQUE (VERSÃO SIMPLIFICADA)
    // ============================================================
    async function renderEstoque() {
        const app = document.getElementById('app');
        if (!app) return;

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
                <div style="text-align:center;padding:15px;">
                    <div class="loading-spinner" style="font-size:24px;">⏳</div>
                    <p style="color:#667eea;font-size:14px;">Carregando produtos...</p>
                </div>
            </section>
        `;

        document.getElementById('formCadastroRapido').addEventListener('submit', cadastrarProdutoRapido);

        try {
            const result = await callAPI('listarProdutos');
            let html = '';
            if (result.success && result.produtos && result.produtos.length > 0) {
                result.produtos.forEach(p => {
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
                        <button onclick="window.renderEstoque()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:500;font-size:12px;cursor:pointer;">🔄 Atualizar</button>
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
            console.error('Erro no renderEstoque:', error);
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
        }, false);

        if (result.success) {
            msg.innerHTML = '<div style="color:#38a169;">✅ Produto cadastrado!</div>';
            mostrarToast(`Produto "${nome}" cadastrado!`, 'success');
            document.getElementById('formCadastroRapido').reset();
            Cache.clear();
            renderEstoque();
        } else {
            msg.innerHTML = `<div style="color:#e53e3e;">${result.error || 'Erro ao cadastrar'}</div>`;
        }
    }

    // ============================================================
    // VENDAS (VERSÃO SIMPLIFICADA)
    // ============================================================
    async function renderVendas() {
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

            let produtosOptions = '<option value="">Selecione um produto...</option>';
            if (produtosResult.success && produtosResult.produtos && produtosResult.produtos.length > 0) {
                produtosResult.produtos.forEach(p => {
                    const qtd = parseInt(p.quantidade) || 0;
                    const preco = parseFloat(p.preco) || 0;
                    const disabled = qtd === 0 ? 'disabled' : '';
                    produtosOptions += `
                        <option value="${p.id}" data-quantidade="${qtd}" data-preco="${preco}" data-nome="${p.nome}" ${disabled}>
                            ${p.nome} (${qtd} disp.) - R$ ${preco.toFixed(2).replace('.', ',')} ${disabled ? '🔴' : ''}
                        </option>
                    `;
                });
            }

            let clientesOptions = '<option value="">Selecione um cliente...</option>';
            if (clientesResult.success && clientesResult.clientes && clientesResult.clientes.length > 0) {
                clientesResult.clientes.forEach(c => {
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
                                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                    <select id="clienteSelect" required style="flex:3;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                                        ${clientesOptions}
                                    </select>
                                    <button type="button" onclick="window.cadastrarNovoCliente()" style="background:#667eea;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:500;font-size:12px;">➕ Novo</button>
                                </div>
                            </div>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                                <div>
                                    <label style="display:block;margin-bottom:5px;color:#4a5568;font-weight:500;font-size:13px;">📱 WhatsApp</label>
                                    <input type="text" id="whatsappCliente" placeholder="(xx) xxxxxxxxx" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                                </div>
                                <div>
                                    <label style="display:block;margin-bottom:5px;color:#4a5568;font-weight:500;font-size:13px;">📅 Data Pagamento</label>
                                    <input type="date" id="dataPagamento" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;font-size:13px;">
                                </div>
                            </div>
                            <div id="produtosContainer">
                                ${[1,2,3,4].map(i => `
                                    <div class="produto-item" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid #e2e8f0;">
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
                                    <div style="flex:1;min-width:150px;">
                                        <span style="font-size:12px;color:#666;">Total:</span>
                                        <span id="totalVenda" style="font-size:28px;font-weight:bold;color:#667eea;display:block;">R$ 0,00</span>
                                    </div>
                                    <div class="valor-pago-container" style="flex:1;min-width:150px;">
                                        <label style="display:block;margin-bottom:4px;color:#4a5568;font-weight:500;font-size:12px;">💵 Valor Pago</label>
                                        <input type="number" id="valorPago" step="0.01" min="0" placeholder="Digite o valor..." style="width:100%;padding:8px;border:2px solid #48bb78;border-radius:6px;font-size:14px;font-weight:bold;background:#f0fff4;">
                                    </div>
                                    <div style="flex:1;min-width:150px;">
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
                    let subtotalFinal = 0;

                    if (select.selectedIndex > 0 && option && qtd > 0) {
                        const preco = parseFloat(option.dataset.preco || 0);
                        subtotalFinal = preco * qtd;
                    }
                    subtotalSpan.textContent = `R$ ${subtotalFinal.toFixed(2).replace('.', ',')}`;
                    totalGeral += subtotalFinal;
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
            console.error('Erro no renderVendas:', error);
            app.innerHTML = `<section><h2>💰 Vendas</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
        }
    }

    async function registrarVendaMultipla(e) {
        e.preventDefault();
        const cliente = document.getElementById('clienteSelect').value;
        const whatsapp = document.getElementById('whatsappCliente').value.trim();
        const dataPagamento = document.getElementById('dataPagamento').value;
        const msg = document.getElementById('msgVenda');
        const valorPago = parseFloat(document.getElementById('valorPago').value) || 0;
        const botaoSubmit = e.target.querySelector('button[type="submit"]');

        if (!cliente) {
            msg.innerHTML = '<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Selecione um cliente</div>';
            return;
        }

        const itens = [];
        let totalVenda = 0, resumoItens = [];

        for (let i = 1; i <= 4; i++) {
            const select = document.getElementById(`produto${i}`);
            const qtdInput = document.getElementById(`qtd${i}`);
            const qtd = parseInt(qtdInput.value) || 0;

            if (qtd > 0 && select.selectedIndex > 0) {
                const option = select.options[select.selectedIndex];
                const produtoId = option.value;
                const precoOriginal = parseFloat(option.dataset.preco || 0);
                const nomeProduto = option.dataset.nome || '';
                const disponivel = parseInt(option.dataset.quantidade || 0);

                if (qtd > disponivel) {
                    msg.innerHTML = `<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Estoque insuficiente para "${nomeProduto}"</div>`;
                    return;
                }

                const totalItem = precoOriginal * qtd;
                itens.push({ produtoId, quantidade: qtd, precoUnitario: precoOriginal });
                totalVenda += totalItem;
                resumoItens.push(`${qtd}x ${nomeProduto}`);
            }
        }

        if (itens.length === 0) {
            msg.innerHTML = '<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Adicione pelo menos um produto</div>';
            return;
        }

        const troco = valorPago - totalVenda;
        let msgConfirm = `Confirmar venda para ${cliente}?<br><br>Itens: ${resumoItens.join(', ')}<br><br>Total: R$ ${totalVenda.toFixed(2).replace('.', ',')}<br>Pago: R$ ${valorPago.toFixed(2).replace('.', ',')}`;
        msgConfirm += troco >= 0 ? `<br>Troco: R$ ${troco.toFixed(2).replace('.', ',')}` : `<br>⚠️ Pendente: R$ ${Math.abs(troco).toFixed(2).replace('.', ',')}`;

        confirmarAcao(msgConfirm, async () => {
            try {
                botaoSubmit.innerHTML = '⏳ Processando...';
                botaoSubmit.disabled = true;
                msg.innerHTML = '<div style="padding:10px;background:#e3f2fd;color:#0d47a1;border-radius:6px;">⏳ Processando venda...</div>';

                let todasOk = true;
                for (const item of itens) {
                    const result = await callAPI('registrarVenda', {
                        produtoId: item.produtoId,
                        quantidade: item.quantidade,
                        cliente: cliente,
                        precoUnitario: item.precoUnitario,
                        desconto: 0,
                        descontoTipo: 'R$',
                        descontoValor: 0
                    }, false);
                    if (!result.success) { todasOk = false; break; }
                }

                if (todasOk) {
                    if (valorPago > 0) {
                        await callAPI('registrarPagamento', {
                            cliente, valor: valorPago,
                            observacao: `Pagamento da venda de R$ ${totalVenda.toFixed(2)}`
                        }, false);
                    }
                    if (troco < 0 && dataPagamento) {
                        await callAPI('registrarPromessaPagamento', {
                            cliente, saldo: Math.abs(troco), dataPagamento,
                            whatsapp: whatsapp || '',
                            observacao: `Venda de R$ ${totalVenda.toFixed(2)}`
                        }, false);
                    }

                    msg.innerHTML = `
                        <div style="padding:12px;background:#c6f6d5;color:#22543d;border-radius:6px;">
                            ✅ Venda registrada! Total: R$ ${totalVenda.toFixed(2).replace('.', ',')}
                            ${troco >= 0 ? `<br>Troco: R$ ${troco.toFixed(2).replace('.', ',')}` : `<br>⚠️ Pendente: R$ ${Math.abs(troco).toFixed(2).replace('.', ',')}`}
                        </div>
                        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
                            <button onclick="gerarQrCodePix(${totalVenda}, 'Venda para ${cliente}')" 
                                    style="background:#1a73e8;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:500;font-size:12px;">
                                📱 Pix - R$ ${totalVenda.toFixed(2).replace('.', ',')}
                            </button>
                            ${troco < 0 && whatsapp ? `
                                <button onclick="window.enviarCobranca('${cliente.replace(/'/g, "\\'")}', ${Math.abs(troco)}, '${whatsapp}')" 
                                        style="background:#25D366;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:500;font-size:12px;">
                                    💬 Cobrar
                                </button>
                            ` : ''}
                            <button onclick="document.getElementById('msgVenda').innerHTML=''" 
                                    style="background:#667eea;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:500;font-size:12px;">
                                ✅ Nova Venda
                            </button>
                        </div>
                    `;
                    mostrarToast(`Venda registrada!`, 'success');
                    document.querySelectorAll('.qtd-produto').forEach(el => el.value = 0);
                    document.querySelectorAll('.produto-select').forEach(el => el.selectedIndex = 0);
                    document.getElementById('totalVenda').textContent = 'R$ 0,00';
                    document.getElementById('trocoOuPendente').textContent = 'R$ 0,00';
                    document.getElementById('valorPago').value = '';
                    document.getElementById('whatsappCliente').value = '';
                    document.getElementById('dataPagamento').value = '';
                    Cache.clear();
                }
            } catch (error) {
                msg.innerHTML = `<div style="padding:10px;background:#fed7d7;color:#9b2c2c;border-radius:6px;">❌ Erro: ${error.message}</div>`;
            } finally {
                botaoSubmit.innerHTML = '💰 Registrar Venda';
                botaoSubmit.disabled = false;
            }
        }, 'Confirmar Venda', 'Cancelar');
    }

    window.cadastrarNovoCliente = function() {
        const nome = prompt('Digite o nome do novo cliente:');
        if (!nome || nome.trim() === '') {
            mostrarToast('Nome inválido', 'warning');
            return;
        }
        const select = document.getElementById('clienteSelect');
        if (select) {
            const novoNome = nome.trim();
            const option = document.createElement('option');
            option.value = novoNome;
            option.textContent = novoNome;
            select.appendChild(option);
            select.value = novoNome;
            mostrarToast(`Cliente "${novoNome}" adicionado!`, 'success');
        }
    };

    // ============================================================
    // CLIENTES (VERSÃO SIMPLIFICADA)
    // ============================================================
    async function renderClientes() {
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

        document.getElementById('buscaCliente').addEventListener('input', (e) => {
            StateManager.setFiltro(e.target.value);
            carregarTabelaClientes(e.target.value);
        });

        await carregarTabelaClientes();
    }

    async function carregarTabelaClientes(filtro = '') {
        const container = document.getElementById('tabelaClientes');
        if (!container) return;

        try {
            const result = await callAPI('listarVendasPorCliente', null, false);
            let html = '';
            if (result.success && result.clientes && result.clientes.length > 0) {
                let clientesFiltrados = result.clientes.filter(c => c.nome && c.nome !== 'Cliente não informado');
                if (filtro) {
                    clientesFiltrados = clientesFiltrados.filter(c => c.nome.toLowerCase().includes(filtro.toLowerCase()));
                }
                if (clientesFiltrados.length > 0) {
                    clientesFiltrados.forEach(cliente => {
                        const totalGasto = parseFloat(cliente.totalGasto) || 0;
                        const totalPago = parseFloat(cliente.totalPago) || 0;
                        const saldo = totalGasto - totalPago;
                        const statusSaldo = saldo > 0.01 ? '🔴' : saldo < -0.01 ? '🟡' : '🟢';
                        const statusTexto = saldo > 0.01 ? 'A pagar' : saldo < -0.01 ? 'Crédito' : 'Quitado';
                        html += `
                            <tr>
                                <td style="padding:8px;"><strong>${cliente.nome}</strong></td>
                                <td style="padding:8px;">R$ ${totalGasto.toFixed(2).replace('.', ',')}</td>
                                <td style="padding:8px;">R$ ${totalPago.toFixed(2).replace('.', ',')}</td>
                                <td style="padding:8px;">${statusSaldo} <strong>R$ ${Math.abs(saldo).toFixed(2).replace('.', ',')}</strong> <small>(${statusTexto})</small></td>
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
            console.error('Erro ao carregar clientes:', error);
            container.innerHTML = `<div style="text-align:center;padding:15px;color:#e53e3e;"><p>❌ Erro: ${error.message}</p><button onclick="carregarTabelaClientes()" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;">🔄 Tentar</button></div>`;
        }
    }

    window.carregarTabelaClientes = carregarTabelaClientes;

    // ============================================================
    // VENDEDORA (VERSÃO SIMPLIFICADA)
    // ============================================================
    async function renderVendedora() {
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = `
            <section>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h2>👩‍💼 Área da Vendedora</h2>
                    <button onclick="window.atualizarVendedora()" class="btn-primary" style="background:#667eea;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:500;font-size:12px;cursor:pointer;">🔄 Atualizar</button>
                </div>
                <div style="background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <div style="display:flex;align-items:center;gap:15px;margin-bottom:20px;padding:15px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;color:#fff;">
                        <div style="background:rgba(255,255,255,0.2);border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                            <img src="img/face.png" alt="Face" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                        </div>
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
                            <button onclick="mostrarToast('Extrato semanal', 'info')" class="btn-extrato" style="background:#667eea;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;">📅 Semanal</button>
                            <button onclick="mostrarToast('Extrato mensal', 'info')" class="btn-extrato" style="background:#4facfe;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;">📆 Mensal</button>
                            <button onclick="mostrarToast('Extrato semestral', 'info')" class="btn-extrato" style="background:#f093fb;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;">📊 Semestral</button>
                            <button onclick="mostrarToast('Extrato anual', 'info')" class="btn-extrato" style="background:#43e97b;color:#1a202c;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;">📈 Anual</button>
                        </div>
                    </div>
                    <div style="margin-top:20px;border-top:2px solid #e2e8f0;padding-top:15px;">
                        <h4 style="color:#2d3748;margin-bottom:8px;font-size:15px;">💰 Pagamentos Recebidos</h4>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
                            <button onclick="mostrarToast('Pagamentos da semana', 'info')" class="btn-extrato" style="background:#38a169;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;">💳 Semana</button>
                            <button onclick="mostrarToast('Pagamentos do mês', 'info')" class="btn-extrato" style="background:#2b6cb0;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;">📆 Mês</button>
                            <button onclick="mostrarToast('Pagamentos do ano', 'info')" class="btn-extrato" style="background:#d69e2e;color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;">📈 Ano</button>
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
            const result = await callAPI('listarPromessasPagamento', null, false);
            if (!result.success || !result.promessas || result.promessas.length === 0) {
                container.innerHTML = `<div style="background:#f0f4ff;padding:15px;border-radius:6px;text-align:center;color:#718096;font-size:13px;">✅ Nenhum pagamento pendente</div>`;
                return;
            }

            const hoje = new Date();
            const hojeStr = hoje.toDateString();
            const promessasPendentes = result.promessas.filter(p => {
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
            console.error('Erro ao carregar promessas:', error);
            container.innerHTML = `<div style="background:#fed7d7;padding:12px;border-radius:6px;text-align:center;color:#9b2c2c;font-size:13px;">❌ Erro: ${error.message}</div>`;
        }
    }

    window.atualizarVendedora = function() {
        mostrarToast('Atualizando...', 'info');
        Cache.clear();
        renderVendedora();
    };

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    function init() {
        console.log('🚀 Iniciando Sistema de Vendas...');
        adicionarEstilosCSS();
        bloquearZoom();
        inicializarNavegacao();
        // Carregar home após um pequeno delay para garantir que o DOM está pronto
        setTimeout(() => {
            renderHome();
        }, 100);
        console.log('✅ Sistema iniciado!');
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
    window.cadastrarNovoCliente = window.cadastrarNovoCliente;
    window.enviarCobranca = window.enviarCobranca;
    window.atualizarVendedora = window.atualizarVendedora;
    window.atualizarDashboard = window.atualizarDashboard;
    window.gerarQrCodePix = window.gerarQrCodePix;

    // Iniciar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();