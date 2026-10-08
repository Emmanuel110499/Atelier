import { createRepository } from './db.js';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL est obligatoire.');
const repository = createRepository(process.env.DATABASE_URL);
try {
  await repository.init();
  if ((await repository.list()).length) console.log('Base non vide : aucune donnée ajoutée.');
  else {
    for (const ticket of [
      { title: 'Imprimante de l’accueil indisponible', requester: 'Camille', priority: 'high', description: 'Les documents restent dans la file d’attente.' },
      { title: 'Préparer le poste du nouvel arrivant', requester: 'Alex', priority: 'normal', description: 'Installer les logiciels et vérifier les accès avant lundi.' },
      { title: 'Remplacer le câble de la salle de réunion', requester: 'Sam', priority: 'low', description: 'Le câble HDMI présente un faux contact.' },
      { title: 'Mettre à jour les ordinateurs portables', requester: 'Morgan', priority: 'normal', description: 'Intervention à planifier après la fermeture.' }
    ]) {
      const created = await repository.create(ticket);
      if (ticket.requester === 'Alex') await repository.update(created.id, 'in_progress');
      if (ticket.requester === 'Sam') await repository.update(created.id, 'done');
    }
    console.log('4 demandes de démonstration ajoutées.');
  }
} finally { await repository.close(); }
