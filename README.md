# Atelier — Suivi des interventions

Une petite application pédagogique pour le module **Conteneur et orchestration**.
Elle permet de créer une demande, choisir sa priorité, suivre son statut,
rechercher les interventions et supprimer une demande avec confirmation.

**Le code applicatif est fourni. La conteneurisation reste à réaliser par l’étudiant.**
Il n’y a volontairement aucun Dockerfile, fichier Compose ou registre préconfiguré.

## Architecture

| Composant | Technologie | Rôle |
| --- | --- | --- |
| Frontend | JavaScript, CSS et Vite | Interface et appels HTTP vers `/api` |
| Backend | Node.js, HTTP natif et `pg` | Validation, API REST et requêtes SQL |
| Base | PostgreSQL | Persistance des demandes |

Le frontend utilise des URL relatives `/api/...`. En développement, Vite transmet
ces requêtes à l’API. Pour la production, votre serveur web (par exemple Nginx)
devra servir `frontend/dist` et transmettre `/api/` au backend, **sans supprimer
le préfixe `/api`**. Le navigateur ne doit pas appeler un nom interne Docker.
Cela évite aussi d’avoir à configurer CORS.

## Prérequis

- Node.js **22.12 ou supérieur** et npm (Node 24 utilisé pour les tests).
- PostgreSQL **16 ou supérieur**, installé localement pour le démarrage initial.
- Trois terminaux : base / backend / frontend selon votre installation.

## 1. Préparer PostgreSQL

Ouvrir `psql` en administrateur PostgreSQL (sur Linux : `sudo -u postgres psql`,
sur Windows : SQL Shell ou l’outil de requêtes de pgAdmin).

```sql
CREATE ROLE atelier LOGIN PASSWORD 'change-me-local-only';
CREATE DATABASE atelier OWNER atelier;
```

Ces identifiants sont réservés à la démonstration locale. Si vous les changez,
modifiez aussi `DATABASE_URL`. Le serveur PostgreSQL doit écouter sur le port 5432.
La table `tickets` est créée automatiquement par l’API au démarrage.

## 2. Démarrer le backend

Depuis `atelier/backend` :

```bash
npm ci
cp .env.example .env
npm run seed
npm start
```

Sous PowerShell, remplacer `cp .env.example .env` par :

```powershell
Copy-Item .env.example .env
```

`seed` ajoute quatre demandes uniquement si la table est vide. Il est facultatif.
L’API écoute par défaut sur `http://127.0.0.1:3000`.
Vérification : ouvrir `http://127.0.0.1:3000/api/health`.

## 3. Démarrer le frontend

Dans un autre terminal, depuis `atelier/frontend` :

```bash
npm ci
npm run dev
```

Ouvrir **http://127.0.0.1:5173**. L’API doit rester démarrée.
Les données survivent au redémarrage de l’API car elles sont dans PostgreSQL.

## 4. Tester et construire

Backend :

```bash
npm test
```

Les tests exécutent les routes HTTP et les requêtes SQL avec **PGlite**, un moteur
PostgreSQL embarqué en WASM. Cela ne remplace pas le test de connexion réseau à
votre vrai serveur PostgreSQL. Cette dépendance est uniquement de développement.

Frontend :

```bash
npm run build
npm run preview
```

Le build produit `dist/`. La prévisualisation locale est sur
`http://127.0.0.1:4173` et transmet également `/api` au backend.
**Vite preview n’est pas le serveur web de production prévu.**

## Configuration

| Variable | Service | Valeur locale | Pour les conteneurs |
| --- | --- | --- | --- |
| `HOST` | Backend | `127.0.0.1` | `0.0.0.0` pour écouter hors du conteneur |
| `PORT` | Backend | `3000` | Port interne de l’API |
| `DATABASE_URL` | Backend | Voir `.env.example` | Utiliser le nom du service PostgreSQL, pas `localhost` |
| `API_PROXY_TARGET` | Vite local | `http://127.0.0.1:3000` | Facultatif en développement ; Nginx prend le relais en production |

`npm start` attend un fichier `.env` pour faciliter le lancement local.
Dans votre future image, lancez **`node src/server.js`** et fournissez les variables
par l’environnement du conteneur. Ne copiez pas `.env` dans une image.

## Routes API

| Méthode | Route | Fonction |
| --- | --- | --- |
| GET | `/api/health` | 200 si la base répond, 503 sinon |
| GET | `/api/tickets` | Liste des demandes, plus récentes en premier |
| POST | `/api/tickets` | Création : `title`, `requester`, `description` facultative, `priority` facultative |
| PATCH | `/api/tickets/:id` | Changement du `status` |
| DELETE | `/api/tickets/:id` | Suppression définitive |

Priorités : `low`, `normal`, `high`. Statuts : `new`, `in_progress`, `done`.

## Limites assumées

- Démonstration locale : **aucune authentification**, pas d’exposition publique.
- Pas de données personnelles réelles ou confidentielles.
- Pas de pièces jointes, rôles utilisateurs, notifications ou pagination.
- Initialisation simple du schéma, pas de système de migrations.
- Le healthcheck répond 503 si la base tombe ; l’API échoue au démarrage si la base
  est indisponible. Votre orchestration devra gérer cette dépendance.

## Suite du projet

Voir `docs/CONTENEURISATION.md` pour les objectifs et points de vigilance,
sans solution Docker prête à copier. Voir `docs/VERIFICATION.md` pour le bilan
des vérifications effectuées sur le livrable.
