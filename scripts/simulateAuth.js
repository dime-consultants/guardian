(async () => {
  const API = 'http://127.0.0.1:8000';
  const username = 'testuser';
  const password = 'password123';

  console.log('LOGIN ->');
  const loginRes = await fetch(`${API}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const loginText = await loginRes.text();
  console.log('status', loginRes.status);
  console.log('body', loginText);
  const setCookie = loginRes.headers.get('set-cookie');
  console.log('set-cookie:', setCookie);

  const cookie = setCookie ? setCookie.split(';')[0] : null;
  if (!cookie) {
    console.error('No cookie set by login; cannot proceed to refresh test.');
    process.exit(1);
  }

  console.log('\nREFRESH (send Cookie) ->');
  const refreshRes = await fetch(`${API}/api/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    // no body; backend should accept cookie
  });
  const refreshBody = await refreshRes.text();
  console.log('status', refreshRes.status);
  console.log('body', refreshBody);
  let access = null;
  try { access = JSON.parse(refreshBody).access; } catch (e) {}

  if (!access) {
    console.error('No access token obtained from refresh.');
    process.exit(1);
  }

  console.log('\nME (with Authorization) ->');
  const meRes = await fetch(`${API}/api/auth/me/`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${access}` },
  });
  const meBody = await meRes.text();
  console.log('status', meRes.status);
  console.log('body', meBody);
})();
