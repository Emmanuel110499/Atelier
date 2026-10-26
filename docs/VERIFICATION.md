# Bilan des vérifications

Vérifications finales réalisées le 26 octobre 2026.

## Application

- Backend : `npm test`, 7 tests réussis sur 7.
- Frontend : `npm run build`, construction Vite réussie.
- API : création, lecture, changement de statut et suppression validés.
- Healthcheck : `/api/health` confirme la connexion à PostgreSQL.

## Images Docker

- Image backend construite avec Node.js 24 Alpine.
- Image frontend construite avec Node.js 24 Alpine puis exécutée avec Nginx non-root.
- Utilisateur backend : `node`, UID 1000.
- Utilisateur frontend : `nginx`, UID 101.
- Configuration Nginx validée par `nginx -t`.
- Les tests et dépendances de développement sont absents des images d'exécution.

Images privées publiées dans GHCR :

| Image | Digest |
| --- | --- |
| `ghcr.io/louis-slr/atelier-backend:1.0.0` | `sha256:161d755547ae5544c5dd304acd6421b7e61d49d5a595dd584b144b7466e3b3e1` |
| `ghcr.io/louis-slr/atelier-frontend:1.0.0` | `sha256:f4739d124b55bce5fe6781226e797610418303c5b879ad1433d35ba8332d2e64` |

Le téléchargement authentifié des deux images privées a été validé.

## Compose local

- Validation de la configuration réussie.
- PostgreSQL, backend et frontend sains.
- Frontend accessible sur `http://127.0.0.1:8080`.
- API accessible uniquement par le proxy Nginx.
- PostgreSQL non publié sur l'hôte.
- Persistance validée après `docker compose down` puis redémarrage.
- Le volume `atelier_postgres_data` conserve les demandes.

## Déploiement public

Infrastructure :

- Droplet DigitalOcean ;
- Ubuntu 24.04 LTS ;
- Docker Engine 29.9.2 ;
- Docker Compose 5.6.1 ;
- 1 vCPU, 512 Mio de mémoire et 1 Gio de swap ;
- pare-feu limité aux ports SSH, HTTP et HTTPS.

Adresse publique :

<https://atelier-ynov.duckdns.org>

Contrôles réussis :

- résolution DuckDNS vers l'adresse IPv4 du Droplet ;
- réponse HTTP `308 Permanent Redirect` vers HTTPS ;
- réponse HTTPS `200` ;
- frontend servi par Nginx derrière Caddy ;
- `/healthz` répond `ok` ;
- `/api/health` répond `{"status":"ok","database":"connected"}` ;
- certificat ayant pour sujet `CN=atelier-ynov.duckdns.org` ;
- certificat émis par Let's Encrypt ;
- obtention et renouvellement automatisés par ACME ;
- persistance d'une demande après recréation des conteneurs.

## Ressources observées

Au moment de la vérification :

- environ 218 Mio de mémoire vive utilisés ;
- environ 95 Mio de swap utilisés ;
- environ 49 % du disque utilisé ;
- tous les services opérationnels.

## Sécurité et limites

- les fichiers `.env`, `.env.production` et `.env.tunnel` sont ignorés par Git ;
- PostgreSQL et le backend ne publient aucun port Internet ;
- les secrets ne sont ni versionnés ni intégrés aux images ;
- l'application reste pédagogique et ne possède pas d'authentification ;
- seules des données fictives doivent être utilisées.
