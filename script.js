// ============================================
// CONFIGURAÇÃO DA API - SEM LIMITE DE TAMANHO
// ============================================
const API_URL = 'https://script.google.com/macros/s/AKfycby2eVGkl74Hjocrt0IEXN6hQbvAr6lynEpNZb4zqj386jdkggc2_uRbUrgGukac6gqlSg/exec';

async function callAPI(action, data = null) {
  console.log(`📤 Chamando API: ${action}`);
  
  // Para GET, vamos usar allorigins.win (sem limite de tamanho)
  if (!data) {
    try {
      const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(API_URL + '?action=' + action)}`;
      console.log(`📤 URL allorigins: ${url}`);
      
      const response = await fetch(url);
      console.log(`📥 Status: ${response.status}`);
      
      const text = await response.text();
      console.log('📥 Resposta (primeiros 200 chars):', text.substring(0, 200));
      
      try {
        const result = JSON.parse(text);
        console.log('📥 Resultado parseado:', result);
        return result;
      } catch (e) {
        console.error('❌ Erro ao parsear JSON:', e);
        // Se não for JSON, tenta extrair o JSON da resposta
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
          try {
            const result = JSON.parse(jsonMatch[0]);
            console.log('📥 JSON extraído:', result);
            return result;
          } catch (e2) {
            console.error('❌ Erro ao extrair JSON:', e2);
          }
        }
        return { success: false, error: 'Resposta inválida do servidor' };
      }
    } catch (error) {
      console.error('❌ Erro allorigins:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Para POST, tenta primeiro sem proxy (pode funcionar)
  try {
    const url = `${API_URL}?action=${action}`;
    console.log(`📤 Tentando POST direto: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log('📥 POST direto funcionou!', result);
    return result;
  } catch (error) {
    console.log('⚠️ POST direto falhou, tentando proxy...');
    
    // Fallback: usar thingproxy (sem limite)
    try {
      const proxyUrl = `https://thingproxy.freeboard.io/fetch/${API_URL}?action=${action}`;
      console.log(`📤 URL proxy: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      console.log('📥 POST com proxy funcionou!', result);
      return result;
    } catch (proxyError) {
      console.error('❌ Erro POST com proxy:', proxyError);
      return { success: false, error: proxyError.message };
    }
  }
}
