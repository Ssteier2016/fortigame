const express = require("express");
const app = express();

app.get("/", (req, res) => {
  console.log(`[${new Date().toISOString()}] Solicitud recibida en /`);
  res.send("¡Servidor de prueba funcionando!");
});

app.get("/test", (req, res) => {
  console.log(`[${new Date().toISOString()}] Solicitud recibida en /test`);
  res.send("Servidor de prueba: Ruta /test");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de prueba en http://localhost:${PORT}`);
});
