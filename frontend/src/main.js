import './style.css';

const statusLabels = { new: 'À traiter', in_progress: 'En cours', done: 'Terminée' };
const priorityLabels = { low: 'Basse', normal: 'Normale', high: 'Haute' };
let tickets = [];
let busy = false;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
document.querySelector('#app').innerHTML = `
  <header><a class="brand" href="/">a<span>Atelier<span class="brand-caption">LE SUIVI, SIMPLEMENT.</span></span></a><span class="workspace">Espace de démonstration</span></header>
  <main><section class="intro"><div><p class="eyebrow">OPÉRATIONS / INTERVENTIONS</p><h1>Chaque demande,<br>à sa bonne place.</h1><p class="subtitle">Un espace simple pour organiser les interventions et suivre leur avancement.</p></div><div class="intro-mark" aria-hidden="true">↗</div></section>
  <div id="notice" role="status" aria-live="polite" hidden></div>
  <section class="stats" aria-label="Statistiques"><div><span>Demandes totales</span><strong id="total">—</strong></div><div><span>À traiter</span><strong id="new">—</strong></div><div><span>En cours</span><strong id="in_progress">—</strong></div><div><span>Terminées</span><strong id="done">—</strong></div></section>
  <div class="layout"><section class="requests"><div class="section-heading"><h2>Les interventions</h2><button id="refresh" class="secondary">Actualiser</button></div>
  <div class="filters"><label class="sr-only" for="search">Rechercher</label><input id="search" type="search" placeholder="Rechercher une demande…" /><label class="sr-only" for="filter">Filtrer par statut</label><select id="filter"><option value="all">Tous les statuts</option>${Object.entries(statusLabels).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
  <div id="list" aria-live="polite"><p class="empty">Chargement des interventions…</p></div></section>
  <aside><p class="eyebrow">NOUVELLE DEMANDE</p><h2>On s’en occupe.</h2><p class="form-intro">Décrivez le besoin, puis suivez sa résolution.</p><form id="ticket-form">
  <label for="title">Titre de la demande</label><input id="title" name="title" required maxlength="120" placeholder="Ex. Configurer un nouveau poste" />
  <label for="requester">Demandeur</label><input id="requester" name="requester" required maxlength="80" placeholder="Prénom ou équipe" />
  <label for="priority">Priorité</label><select id="priority" name="priority"><option value="normal">Normale</option><option value="high">Haute</option><option value="low">Basse</option></select>
  <label for="description">Description <span>(facultatif)</span></label><textarea id="description" name="description" maxlength="2000" rows="4" placeholder="Les informations utiles pour intervenir…"></textarea>
  <button type="submit" class="primary">Créer la demande <span>↗</span></button></form><p class="demo-note">Projet pédagogique · Pas de données sensibles</p></aside></div>
  <footer>Atelier <span>Une application, trois services. À vous de les conteneuriser.</span></footer></main>`;
function notify(message, error = false) {
  const node = document.querySelector('#notice');
  node.textContent = message;
  node.className = error ? 'notice error' : 'notice';
  node.hidden = false;
}
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers }, signal: AbortSignal.timeout(10000) });
  if (response.status === 204) return;
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Le serveur est indisponible.');
  return body;
}
function render() {
  document.querySelector('#total').textContent = tickets.length;
  for (const status of Object.keys(statusLabels)) document.getElementById(status).textContent = tickets.filter(t => t.status === status).length;
  const query = document.querySelector('#search').value.trim().toLocaleLowerCase('fr');
  const filter = document.querySelector('#filter').value;
  const visible = tickets.filter(t => (filter === 'all' || t.status === filter) && `${t.title} ${t.description} ${t.requester}`.toLocaleLowerCase('fr').includes(query));
  document.querySelector('#list').innerHTML = visible.length ? visible.map(t => `
    <article class="ticket"><div class="ticket-top"><span class="ticket-id">#${String(t.id).padStart(3,'0')}</span><span class="badge ${t.priority}">Priorité ${priorityLabels[t.priority]}</span></div><h3>${escape(t.title)}</h3>${t.description ? `<p class="description">${escape(t.description)}</p>` : ''}<p class="meta">${escape(t.requester)} <span>·</span> ${escape(new Date(t.created_at).toLocaleDateString('fr-FR'))}</p><div class="ticket-bottom"><label class="sr-only" for="status-${t.id}">Statut de ${escape(t.title)}</label><select id="status-${t.id}" data-status="${t.id}">${Object.entries(statusLabels).map(([v,l]) => `<option value="${v}" ${t.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="delete" data-delete="${t.id}" aria-label="Supprimer ${escape(t.title)}">Supprimer</button></div></article>`).join('') : '<p class="empty">Aucune demande à afficher.<br>Ajoutez une intervention ou ajustez vos filtres.</p>';
  document.querySelectorAll('[data-status], [data-delete], button[type="submit"]').forEach(el => el.disabled = busy);
}
async function load() { tickets = await api('/tickets'); render(); }
async function action(fn, success) {
  if (busy) return;
  busy = true; render();
  try { await fn(); await load(); notify(success); }
  catch (error) { notify(error.message === 'Failed to fetch' ? 'API inaccessible. Vérifiez que le backend et PostgreSQL sont démarrés.' : error.message, true); }
  finally { busy = false; render(); }
}
document.querySelector('#search').addEventListener('input', render);
document.querySelector('#filter').addEventListener('change', render);
document.querySelector('#refresh').addEventListener('click', () => action(async () => {}, 'Liste actualisée.'));
document.querySelector('#ticket-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  action(async () => { await api('/tickets', { method: 'POST', body: JSON.stringify(values) }); form.reset(); }, 'Demande créée.');
});
document.querySelector('#list').addEventListener('change', event => {
  const id = event.target.dataset.status;
  if (id) action(() => api(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ status: event.target.value }) }), 'Statut mis à jour.');
});
document.querySelector('#list').addEventListener('click', event => {
  const id = event.target.dataset.delete;
  if (id && confirm('Supprimer définitivement cette demande ?')) action(() => api(`/tickets/${id}`, { method: 'DELETE' }), 'Demande supprimée.');
});
load().catch(() => {
  document.querySelector('#list').innerHTML = '<p class="empty">Connexion indisponible. Démarrez l’API et PostgreSQL, puis cliquez sur Actualiser.</p>';
  notify('Impossible de charger les demandes : vérifiez le backend et la base de données.', true);
});
