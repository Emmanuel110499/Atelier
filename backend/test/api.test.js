import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PGlite } from '@electric-sql/pglite';
import { createRepository } from '../src/db.js';
import { createApp } from '../src/app.js';

// PostgreSQL embarqué en WASM : mêmes requêtes SQL, sans serveur installé.
// Le transport réseau du driver pg est à vérifier séparément sur un vrai serveur.
class TestPool extends EventEmitter {
  constructor() { super(); this.database = new PGlite(); }
  async query(sql, params) {
    const result = await this.database.query(sql, params);
    return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
  }
  async end() { await this.database.close(); }
}
let repository, server, base;
before(async () => {
  repository = createRepository('', TestPool);
  await repository.init();
  server = createApp(repository);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (repository) await repository.close();
});
const request = (path, method = 'GET', body) => fetch(`${base}/api${path}`, {
  method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body)
});
test('santé API et PostgreSQL', async () => {
  const response = await request('/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).database, 'connected');
});
test('cycle complet : créer, consulter, modifier, supprimer et 404', async () => {
  const create = await request('/tickets', 'POST', { title: ' Test SQL ', requester: 'Louis', description: "L’écran ne répond pas", priority: 'high' });
  assert.equal(create.status, 201);
  const ticket = await create.json();
  assert.equal(ticket.title, 'Test SQL');
  assert.equal(ticket.status, 'new');
  assert.ok(ticket.created_at);
  assert.ok((await (await request('/tickets')).json()).some(t => t.id === ticket.id));
  const update = await request(`/tickets/${ticket.id}`, 'PATCH', { status: 'in_progress' });
  assert.equal(update.status, 200);
  assert.equal((await update.json()).status, 'in_progress');
  assert.equal((await request(`/tickets/${ticket.id}`, 'DELETE')).status, 204);
  assert.equal((await request(`/tickets/${ticket.id}`, 'DELETE')).status, 404);
  assert.equal((await request(`/tickets/${ticket.id}`, 'PATCH', { status: 'done' })).status, 404);
});
test('validation des champs et des priorités', async () => {
  for (const body of [ {}, { title: ' ', requester: 'Sam' }, { title: 'x'.repeat(121), requester: 'Sam' }, { title: 'Test', requester: 'Sam', priority: 'critical' }, { title: 'Test', requester: 'Sam', description: 12 } ]) {
    assert.equal((await request('/tickets', 'POST', body)).status, 400);
  }
});
test('JSON malformé, statut invalide et identifiant trop grand', async () => {
  assert.equal((await fetch(`${base}/api/tickets`, { method: 'POST', body: '{' })).status, 400);
  assert.equal((await request('/tickets/1', 'PATCH', { status: 'unknown' })).status, 400);
  assert.equal((await request('/tickets/999999999999999999', 'DELETE')).status, 400);
  assert.equal((await request('/unknown')).status, 404);
});
test('requête trop volumineuse', async () => {
  assert.equal((await request('/tickets', 'POST', { title: 'x'.repeat(17000) })).status, 413);
});
test('les valeurs SQL sont stockées comme texte et non exécutées', async () => {
  const title = "'); DROP TABLE tickets; --";
  const result = await request('/tickets', 'POST', { title, requester: 'Test' });
  assert.equal(result.status, 201);
  const created = await result.json();
  assert.equal(created.title, title);
  assert.equal((await request('/tickets')).status, 200);
  await request(`/tickets/${created.id}`, 'DELETE');
});
test('une base indisponible donne un healthcheck 503', async () => {
  const unavailable = createApp({ health: async () => { throw new Error('offline'); } });
  await new Promise(resolve => unavailable.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${unavailable.address().port}/api/health`);
    assert.equal(response.status, 503);
  } finally { await new Promise(resolve => unavailable.close(resolve)); }
});
