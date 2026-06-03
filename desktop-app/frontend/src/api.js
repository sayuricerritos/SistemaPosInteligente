// api.js -- URL centralizada de la API del backend
// =================================================
// INSTRUCCIONES PARA PRESENTACION CON NGROK:
//   1. Ejecuta: ngrok http 5000
//   2. Copia la URL publica (ej: https://abc123.ngrok-free.app)
//   3. Pega esa URL como valor de API_URL abajo
//   4. Ejecuta: npm run build
//   5. Reinicia el servidor Flask
//
// Para desarrollo local, deja: 'http://127.0.0.1:5000'

const API_URL = 'http://127.0.0.1:5000';

export default API_URL;
