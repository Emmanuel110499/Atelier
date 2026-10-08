# Bilan des vérifications

Vérifications réalisées le 8 octobre 2026 avec Node.js 24.19.0.

## Réussi

- Installation backend par `npm ci` à partir du lockfile.
- Installation frontend par `npm ci` à partir du lockfile.
- Build frontend Vite : `npm run build`.
- 7 tests backend par `npm test` :
  - santé de l’API et réponse PostgreSQL ;
  - création, lecture, changement de statut, suppression et demande absente ;
  - validation des champs et priorités ;
  - JSON invalide, statut incorrect et identifiant hors limites ;
  - refus des requêtes trop volumineuses ;
  - stockage d’une chaîne de type injection SQL sans exécution ;
  - healthcheck HTTP 503 si la base est indisponible.

Les tests exécutent les vraies requêtes du repository sur PostgreSQL embarqué
(PGlite). Ils n’utilisent pas un serveur PostgreSQL réseau ni le transport du
driver `pg` : cette partie reste à valider sur votre poste.

## Non vérifié ici

- Rendu visuel et parcours interactif dans un navigateur : aucun navigateur de
  test disponible, téléchargement du navigateur de test échoué.
- Connexion à une installation PostgreSQL indépendante.
- Dockerfiles, Compose, volume Docker et registre : volontairement non fournis.

## À vérifier à votre premier lancement

1. Ouvrir `/api/health` et vérifier `database: connected`.
2. Ouvrir le frontend et voir les 4 demandes après `npm run seed`.
3. Ajouter une demande, changer son statut, rechercher et filtrer la liste.
4. Supprimer une demande et vérifier la confirmation.
5. Vérifier l’affichage sur une fenêtre étroite ou un téléphone.
6. Redémarrer l’API et confirmer que les demandes sont conservées.
7. Après conteneurisation, recommencer le parcours avec le Compose de production.
