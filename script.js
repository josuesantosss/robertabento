// ============================================
// CONFIGURAÇÃO DA API
// ============================================
// Use a URL completa do seu Web App
const API_URL = 'https://script.google.com/macros/s/AKfycby2eVGkl74Hjocrt0IEXN6hQbvAr6lynEpNZb4zqj386jdkggc2_uRbUrgGukac6gqlSg/exec';

// ============================================
// FUNÇÃO PARA CHAMAR A API
// ============================================
async function callAPI(action, data = null) {
  const url = `${API_URL}?action=${action}`;
  
  console.log(`📤 Chamando API: ${action}`);
  console.log(`📤 URL: ${url}`);
  
  const options = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
    console.log('📤 Dados:', data);
  }
  
  try {
    const response = await fetch(url, options);
    console.log(`📥 Status: ${response.status}`);
    
    // Verifica se a resposta é JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      console.log('📥 Resposta JSON:', result);
      return result;
    } else {
      // Se não for JSON, tenta ler como texto
      const text = await response.text();
      console.log('📥 Resposta texto:', text.substring(0, 200));
      
      // Se a resposta começa com <!DOCTYPE, é HTML (erro)
      if (text.trim().startsWith('<!DOCTYPE')) {
        console.error('❌ A API retornou HTML em vez de JSON');
        console.error('📄 HTML recebido:', text.substring(0, 500));
        return { 
          success: false, 
          error: 'A API retornou HTML. Verifique se a URL do Web App está correta.' 
        };
      }
      
      // Tenta parsear o texto como JSON
      try {
        const result = JSON.parse(text);
        return result;
      } catch(e) {
        return { 
          success: false, 
          error: 'Resposta inválida do servidor' 
        };
      }
    }
  } catch (error) {
    console.error('❌ Erro na API:', error);
    return { 
      success: false, 
      error: 'Erro de comunicação: ' + error.message 
    };
  }
}
