const http = require('http');

function request(options, body=null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { const parsed = JSON.parse(data); resolve({ status: res.statusCode, body: parsed }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const loginBody = JSON.stringify({ username: 'admin', password: 'adminpass' });
    const loginRes = await request({ hostname: 'localhost', port: 5001, path: '/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) } }, loginBody);
    console.log('Login response:', loginRes.status, loginRes.body);
    if (!loginRes.body || !loginRes.body.token) {
      console.error('No token in login response'); process.exit(1);
    }
    const token = loginRes.body.token;
    const backupRes = await request({ hostname: 'localhost', port: 5001, path: '/admin/backup', method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    console.log('Backup response:', backupRes.status, JSON.stringify(backupRes.body, null, 2));
  } catch (e) {
    console.error('Request error:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();