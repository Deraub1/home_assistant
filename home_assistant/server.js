const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint to bypass CORS issues when contacting microcontrollers (ESP32, ESP8266, Arduino)
app.all('/api/proxy', (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'Paramètre "url" cible requis' });
  }

  try {
    const urlObj = new URL(targetUrl);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      method: req.method,
      headers: {
        'User-Agent': 'LED-Web-Controller/1.0',
        'Content-Type': req.headers['content-type'] || 'application/json'
      },
      timeout: 4000
    };

    const proxyReq = client.request(targetUrl, options, (proxyRes) => {
      res.status(proxyRes.statusCode);
      Object.keys(proxyRes.headers).forEach((key) => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      if (res.headersSent) return;
      res.status(502).json({
        error: 'Impossible d\'atteindre le circuit physique LED',
        message: err.message,
        details: 'Vérifiez que le composant est sous tension et sur le même réseau local.'
      });
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      if (res.headersSent) return;
      res.status(540).json({ error: 'Délai d\'attente dépassé (Timeout HTTP)' });
    });

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const bodyData = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
      proxyReq.write(bodyData);
    }

    proxyReq.end();
  } catch (err) {
    res.status(400).json({ error: 'URL cible invalide: ' + err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Serveur de Contrôle LED Physique lancé sur le port ${PORT}`);
  console.log(`👉 Ouvrez http://localhost:${PORT} dans votre navigateur`);
  console.log(`====================================================`);
});
