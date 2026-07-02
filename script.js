// ============================================
// CONFIGURAÇÃO DA API - VERSÃO JSONP
// ============================================
const API_URL = 'https://script.google.com/macros/s/AKfycby2eVGkl74Hjocrt0IEXN6hQbvAr6lynEpNZb4zqj386jdkggc2_uRbUrgGukac6gqlSg/exec';

async function callAPI(action, data = null) {
  // Para GET, usa JSONP
  if (!data) {
    return new Promise((resolve, reject) => {
      const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const url = `${API_URL}?action=${action}&callback=${callbackName}`;
      
      console.log(`📤 Chamando JSONP: ${action}`);
      console.log(`📤 URL: ${url}`);
      
      // Define a função callback global
      window[callbackName] = function(response) {
        console.log('📥 Resposta JSONP:', response);
        delete window[callbackName];
        document.body.removeChild(script);
        resolve(response);
      };
      
      // Cria o script
      const script = document.createElement('script');
      script.src = url;
      script.onerror = function() {
        console.error('❌ Erro no JSONP');
        delete window[callbackName];
        document.body.removeChild(script);
        reject(new Error('Erro na requisição JSONP'));
      };
      
      // Timeout para evitar carregamento infinito
      const timeout = setTimeout(() => {
        delete window[callbackName];
        document.body.removeChild(script);
        reject(new Error('Timeout na requisição JSONP'));
      }, 10000);
      
      // Limpa o timeout quando a resposta chegar
      const originalCallback = window[callbackName];
      window[callbackName] = function(response) {
        clearTimeout(timeout);
        originalCallback(response);
      };
      
      document.body.appendChild(script);
    });
  }
  
  // Para POST, usa fetch com proxy CORS
  console.log(`📤 Chamando POST: ${action}`);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  };
  
  try {
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${API_URL}?action=${action}`;
    const response = await fetch(proxyUrl, options);
    const result = await response.json();
    console.log('📥 Resposta POST:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro na API POST:', error);
    return { 
      success: false, 
      error: 'Erro de comunicação: ' + error.message 
    };
  }
}
