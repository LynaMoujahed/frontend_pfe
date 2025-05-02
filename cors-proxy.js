// Serveur proxy CORS local
import { createServer } from "cors-anywhere";

// Configurer le serveur proxy
const host = "localhost";
const port = 8080;

createServer({
  originWhitelist: [], // Autoriser toutes les origines
  requireHeader: ["origin", "x-requested-with"],
  removeHeaders: ["cookie", "cookie2"],
}).listen(port, host, function () {
  console.log(
    "Serveur proxy CORS en cours d'exécution sur " + host + ":" + port
  );
});
