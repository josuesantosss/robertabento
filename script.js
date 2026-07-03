// CONFIGURAÇÃO – Substitua pela nova URL da sua API
const API_URL = 'https://script.google.com/macros/s/AKfycbzWrSiJmWEuT0MJm2MZczxqbqcHAOvCcUJud-0Ke59Ag3V1TjAsSIvF7zh5b9cBtMNRrw/exec';

async function callAPI(action, data = null) {
  console.log(`📤 Chamando API: ${action}`);
  
  const url = `${API_URL}?action=${action}`;
  
  const options = {
    method: data ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const result = await response.json();
    console.log('📥 Resposta:', result);
    return result;
  } catch (error) {
    console.error('❌ Falha na chamada:', error);
    return { success: false, error: error.message };
  }
}
