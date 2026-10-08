import { createServer } from 'node:http';

const statuses = ['new', 'in_progress', 'done'];
const priorities = ['low', 'normal', 'high'];
const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
};
async function readBody(req) {
  let content = '';
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw Object.assign(new Error('Requête trop volumineuse.'), { status: 413 });
    content += chunk;
  }
  try {
    const body = JSON.parse(content);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw Object.assign(new Error('Corps JSON invalide.'), { status: 400 }); }
}
function field(value, name, max, optional = false) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > max)
    throw Object.assign(new Error(`${name} : texte ${optional ? '' : 'non vide '}limité à ${max} caractères.`), { status: 400 });
  return value.trim();
}
export function createApp(repository) {
  return createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (path === '/api/health' && req.method === 'GET') {
        try { await repository.health(); send(res, 200, { status: 'ok', database: 'connected' }); }
        catch { send(res, 503, { status: 'unavailable', database: 'disconnected' }); }
        return;
      }
      if (path === '/api/tickets' && req.method === 'GET') return send(res, 200, await repository.list());
      if (path === '/api/tickets' && req.method === 'POST') {
        const body = await readBody(req);
        const ticket = {
          title: field(body.title, 'Titre', 120), description: field(body.description, 'Description', 2000, true),
          requester: field(body.requester, 'Demandeur', 80), priority: body.priority ?? 'normal'
        };
        if (!priorities.includes(ticket.priority)) return send(res, 400, { error: 'Priorité invalide.' });
        return send(res, 201, await repository.create(ticket));
      }
      const match = path.match(/^\/api\/tickets\/([1-9][0-9]*)$/);
      if (match && ['PATCH', 'DELETE'].includes(req.method)) {
        const id = Number(match[1]);
        if (!Number.isSafeInteger(id) || id > 2147483647) return send(res, 400, { error: 'Identifiant invalide.' });
        if (req.method === 'DELETE') {
          if (!await repository.remove(id)) return send(res, 404, { error: 'Demande introuvable.' });
          return send(res, 204);
        }
        const body = await readBody(req);
        if (!statuses.includes(body.status)) return send(res, 400, { error: 'Statut invalide.' });
        const ticket = await repository.update(id, body.status);
        return ticket ? send(res, 200, ticket) : send(res, 404, { error: 'Demande introuvable.' });
      }
      send(res, 404, { error: 'Route introuvable.' });
    } catch (error) {
      if (!error.status) console.error(error);
      send(res, error.status ?? 500, { error: error.status ? error.message : 'Erreur serveur. Vérifiez la connexion à la base.' });
    }
  });
}
