// CONFIGURAÇÃO – Substitua pela nova URL da sua API
const API_URL = 'https://script.google.com/macros/s/AKfycbzWrSiJmWEuT0MJm2MZczxqbqcHAOvCcUJud-0Ke59Ag3V1TjAsSIvF7zh5b9cBtMNRrw/exec';

async function callAPI(action, data = null) {
  const url = `${API_URL}?action=${action}`;
  const options = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  console.log(`📤 Chamando API: ${action}`, data || '');
  
  try {
    const response = await fetch(url, options);
    console.log(`📥 Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resposta de erro:', errorText);
      return { 
        success: false, 
        error: `Erro HTTP ${response.status}` 
      };
    }
    
    const result = await response.json();
    console.log('📥 Resultado:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erro de rede:', error);
    return { 
      success: false, 
      error: 'Erro de comunicação: ' + error.message 
    };
  }
}
