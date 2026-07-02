// ============================================
// CONFIGURAÇÃO DA API - VERSÃO COM PROXY ALTERNATIVO
// ============================================
const API_URL = 'https://script.google.com/macros/s/AKfycby2eVGkl74Hjocrt0IEXN6hQbvAr6lynEpNZb4zqj386jdkggc2_uRbUrgGukac6gqlSg/exec';

// 🔥 PROXY ALTERNATIVOS SEM LIMITE DE 1MB
// Opção 1: https://cors-anywhere.herokuapp.com/ (mais estável)
// Opção 2: https://api.allorigins.win/ (apenas GET, sem limite)
// Opção 3: https://thingproxy.freeboard.io/fetch/ (alternativo)

// Vamos usar o cors-anywhere como principal
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

async function callAPI(action, data = null) {
  let url;
  const options = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (data) {
    url = `${CORS_PROXY}${API_URL}?action=${action}`;
    options.body = JSON.stringify(data);
  } else {
    // Para GET, vamos usar allorigins (mais rápido)
    // Mas mantemos cors-anywhere como fallback
    try {
      const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(API_URL + '?action=' + action)}`;
      console.log(`📤 Chamando via allorigins: ${action}`);
      
      const response = await fetch(allOriginsUrl);
      const text = await response.text();
      console.log('📥 Resposta allorigins:', text.substring(0, 200));
      
      try {
        const result = JSON.parse(text);
        console.log('📥 Resultado parseado:', result);
        return result;
      } catch (e) {
        console.error('❌ Erro ao parsear allorigins:', e);
        // Fallback para cors-anywhere
      }
    } catch (error) {
      console.log('⚠️ allorigins falhou, tentando cors-anywhere...');
    }
    
    // Fallback para cors-anywhere
    url = `${CORS_PROXY}${API_URL}?action=${action}`;
  }
  
  console.log(`📤 Chamando API: ${action}`);
  console.log(`📤 URL: ${url}`);
  
  try {
    const response = await fetch(url, options);
    console.log(`📥 Status: ${response.status}`);
    
    const text = await response.text();
    console.log('📥 Resposta texto:', text.substring(0, 200));
    
    try {
      const result = JSON.parse(text);
      console.log('📥 Resposta JSON:', result);
      return result;
    } catch (e) {
      console.error('❌ Erro ao parsear JSON:', e);
      return { 
        success: false, 
        error: 'Resposta inválida do servidor' 
      };
    }
  } catch (error) {
    console.error('❌ Erro na API:', error);
    return { 
      success: false, 
      error: 'Erro de comunicação: ' + error.message 
    };
  }
}
