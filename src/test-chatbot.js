/**
 * Script de test pour vérifier les endpoints du chatbot
 * 
 * Pour exécuter ce script:
 * 1. Ouvrez la console du navigateur
 * 2. Copiez-collez ce script
 * 3. Appuyez sur Entrée
 */

// Configuration
const API_URL = 'https://127.0.0.1:8000/api';
const USER_ID = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;

// Fonction pour afficher les résultats dans la console
function logResult(testName, success, data) {
  if (success) {
    console.log(`%c✅ ${testName}: Succès`, 'color: green; font-weight: bold');
  } else {
    console.log(`%c❌ ${testName}: Échec`, 'color: red; font-weight: bold');
  }
  console.log(data);
  console.log('-----------------------------------');
}

// Test 1: Vérifier l'endpoint de test
async function testEndpoint() {
  try {
    const response = await fetch(`${API_URL}/chatbot/test-endpoint`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    logResult('Test de l\'endpoint', response.ok, data);
    return { success: response.ok, data };
  } catch (error) {
    logResult('Test de l\'endpoint', false, error);
    return { success: false, error };
  }
}

// Test 2: Vérifier l'endpoint message-extended
async function testMessageExtended() {
  if (!USER_ID) {
    logResult('Test de message-extended', false, 'Aucun ID utilisateur trouvé dans le localStorage');
    return { success: false, error: 'Aucun ID utilisateur trouvé' };
  }
  
  try {
    const response = await fetch(`${API_URL}/chatbot/message-extended`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Ceci est un message de test',
        context: 'test_script',
        userId: USER_ID
      })
    });
    
    const data = await response.json();
    logResult('Test de message-extended', response.ok, data);
    return { success: response.ok, data };
  } catch (error) {
    logResult('Test de message-extended', false, error);
    return { success: false, error };
  }
}

// Test 3: Vérifier l'endpoint history-extended
async function testHistoryExtended() {
  if (!USER_ID) {
    logResult('Test de history-extended', false, 'Aucun ID utilisateur trouvé dans le localStorage');
    return { success: false, error: 'Aucun ID utilisateur trouvé' };
  }
  
  try {
    const response = await fetch(`${API_URL}/chatbot/history-extended`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: USER_ID,
        limit: 5
      })
    });
    
    const data = await response.json();
    logResult('Test de history-extended', response.ok, data);
    return { success: response.ok, data };
  } catch (error) {
    logResult('Test de history-extended', false, error);
    return { success: false, error };
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('%c🚀 Début des tests du chatbot', 'color: blue; font-weight: bold; font-size: 16px');
  console.log('-----------------------------------');
  
  console.log('📝 Informations de configuration:');
  console.log(`API_URL: ${API_URL}`);
  console.log(`USER_ID: ${USER_ID}`);
  console.log('-----------------------------------');
  
  await testEndpoint();
  await testMessageExtended();
  await testHistoryExtended();
  
  console.log('%c🏁 Fin des tests', 'color: blue; font-weight: bold; font-size: 16px');
}

// Exécuter les tests
runAllTests();
