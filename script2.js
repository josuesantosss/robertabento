async function renderEstoque() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>📦 Estoque</h2>
            <!-- Box de cadastro rápido -->
            <div style="background:#f0f4ff; padding:20px; border-radius:12px; margin-bottom:20px; border:2px dashed #667eea;">
                <h3 style="margin:0 0 15px 0; color:#667eea;">➕ Cadastrar Novo Produto</h3>
                <form id="formCadastroRapido" style="display:flex; gap:15px; flex-wrap:wrap; align-items:flex-end;">
                    <div style="flex:2; min-width:150px;">
                        <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Nome</label>
                        <input type="text" id="nomeRapido" placeholder="Nome do produto" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>
                    <div style="flex:1; min-width:100px;">
                        <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Preço (R$)</label>
                        <input type="number" id="precoRapido" step="0.01" placeholder="0,00" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>
                    <div style="flex:1; min-width:100px;">
                        <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Quantidade</label>
                        <input type="number" id="qtdRapido" placeholder="0" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                    </div>
                    <button type="submit" style="background:#667eea; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:500; height:42px;">
                        ✅ Cadastrar
                    </button>
                </form>
                <div id="msgCadastroRapido" style="margin-top:10px;"></div>
            </div>

            <div style="text-align:center; padding:20px;">
                <div class="loading-spinner" style="font-size:32px;">⏳</div>
                <p style="color:#667eea;">Carregando produtos...</p>
            </div>
        </section>
    `;

    document.getElementById('formCadastroRapido').addEventListener('submit', cadastrarProdutoRapido);

    try {
        const result = await callAPI('listarProdutos');
        let html = '';
        if (result.success && result.produtos.length > 0) {
            // ORDENAR PRODUTOS EM ORDEM ALFABÉTICA
            const produtosOrdenados = result.produtos.sort((a, b) => {
                const nomeA = (a.nome || '').toLowerCase().trim();
                const nomeB = (b.nome || '').toLowerCase().trim();
                return nomeA.localeCompare(nomeB, 'pt-BR');
            });
            
            produtosOrdenados.forEach(p => {
                const qtd = parseInt(p.quantidade) || 0;
                const preco = parseFloat(p.preco) || 0;
                const status = qtd === 0 ? '🔴' : qtd <= 5 ? '🟡' : '🟢';
                const statusTexto = qtd === 0 ? 'Esgotado' : qtd <= 5 ? 'Baixo' : 'Normal';
                html += `
                    <tr onclick="window.abrirEdicaoProduto(${p.id}, '${p.nome.replace(/'/g, "\\'")}', ${preco}, ${qtd})" style="cursor:pointer; ${qtd === 0 ? 'background:#fff5f5;' : ''}">
                        <td>${p.id}</td>
                        <td><strong>${p.nome}</strong></td>
                        <td>${status} ${qtd} <small style="color:#666;">(${statusTexto})</small></td>
                        <td>R$ ${preco.toFixed(2).replace('.', ',')}</td>
                    </tr>
                `;
            });
        } else {
            html = `<tr><td colspan="4" style="text-align:center; padding:40px;"><p style="font-size:48px;">📭</p><p style="color:#666;">Nenhum produto cadastrado</p></td></tr>`;
        }

        app.innerHTML = `
            <section>
                <h2>📦 Estoque</h2>
                <!-- Box de cadastro rápido -->
                <div style="background:#f0f4ff; padding:20px; border-radius:12px; margin-bottom:20px; border:2px dashed #667eea;">
                    <h3 style="margin:0 0 15px 0; color:#667eea;">➕ Cadastrar Novo Produto</h3>
                    <form id="formCadastroRapido" style="display:flex; gap:15px; flex-wrap:wrap; align-items:flex-end;">
                        <div style="flex:2; min-width:150px;">
                            <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Nome</label>
                            <input type="text" id="nomeRapido" placeholder="Nome do produto" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div style="flex:1; min-width:100px;">
                            <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Preço (R$)</label>
                            <input type="number" id="precoRapido" step="0.01" placeholder="0,00" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <div style="flex:1; min-width:100px;">
                            <label style="display:block; margin-bottom:5px; color:#4a5568; font-weight:500;">Quantidade</label>
                            <input type="number" id="qtdRapido" placeholder="0" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:6px;">
                        </div>
                        <button type="submit" style="background:#667eea; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:500; height:42px;">
                            ✅ Cadastrar
                        </button>
                    </form>
                    <div id="msgCadastroRapido" style="margin-top:10px;"></div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap;">
                        <span style="font-size:14px;">🟢 Normal | 🟡 Baixo (≤5) | 🔴 Esgotado</span>
                        <span style="font-size:12px; color:#666;">💡 Clique em qualquer linha para editar/excluir</span>
                        <span style="font-size:12px; background:#f0f4ff; padding:4px 8px; border-radius:4px;">📋 Ordem Alfabética</span>
                    </div>
                    <button onclick="window.renderEstoque()" class="btn-primary" style="background:#667eea; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:500;">
                        🔄 Atualizar
                    </button>
                </div>
                <div style="background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); overflow:hidden;">
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="background:#3957ed; border-bottom:2px solid #e2e8f0;">
                                    <th style="padding:12px; text-align:left; color:white;">ID</th>
                                    <th style="padding:12px; text-align:left; color:white;">Produto 📋</th>
                                    <th style="padding:12px; text-align:left; color:white;">Quantidade</th>
                                    <th style="padding:12px; text-align:left; color:white;">Preço Unit.</th>
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
        app.innerHTML = `<section><h2>📦 Estoque</h2><p style="color:red;">❌ Erro: ${error.message}</p></section>`;
    }
}