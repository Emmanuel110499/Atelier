# Architecture de conteneurisation

## Résultat

L'application Atelier est entièrement conteneurisée et déployable avec Docker Compose.

Les livrables réalisés sont :

1. une image frontend multi-stage ;
2. une image backend multi-stage ;
3. un environnement local avec PostgreSQL ;
4. deux images applicatives publiées sur le registre privé GHCR ;
5. un environnement de production sans directive `build:` ;
6. un reverse proxy Caddy avec HTTPS automatique ;
7. un volume PostgreSQL persistant et des réseaux segmentés.

## Images applicatives

| Image | Construction | Exécution |
| --- | --- | --- |
| `ghcr.io/louis-slr/atelier-frontend:1.0.0` | Node.js 24 et Vite | Nginx non-root sur le port 8080 |
| `ghcr.io/louis-slr/atelier-backend:1.0.0` | Installation des dépendances de production | Node.js non-root sur le port 3000 |

Les fichiers `.dockerignore` excluent les dépendances locales, les tests, les secrets et les fichiers inutiles des contextes de construction.

## Orchestration

### Environnement local

Le fichier `compose.yaml` construit les images et démarre :

- le frontend ;
- le backend ;
- PostgreSQL.

Seul le frontend est publié sur `127.0.0.1:8080`. Les healthchecks et les dépendances `service_healthy` garantissent un ordre de démarrage fonctionnel.

### Environnement de production

Le fichier `compose.prod.yaml` référence uniquement des images versionnées. Il ne contient aucune directive `build:`.

Il ajoute Caddy devant le frontend. Seul Caddy publie les ports 80 et 443. Le backend et PostgreSQL restent accessibles uniquement sur leurs réseaux Docker internes.

## Réseaux

| Réseau | Services | Exposition |
| --- | --- | --- |
| `edge` | Caddy et frontend | Entrée HTTP/HTTPS |
| `application` | Frontend et backend | Interne |
| `database` | Backend et PostgreSQL | Interne |

Cette séparation empêche l'accès direct à PostgreSQL depuis Internet.

## Persistance

Le volume `postgres_data` conserve les demandes lors de la suppression et de la recréation des conteneurs.

Les volumes `caddy_data` et `caddy_config` conservent le compte ACME, les certificats et la configuration persistante de Caddy.

La commande `docker compose down` conserve les volumes. L'option `-v` les supprime et ne doit pas être utilisée pendant une démonstration de persistance.

## Registre privé

Les images frontend et backend sont stockées dans GHCR avec le tag `1.0.0`. Le registre est privé et nécessite une authentification disposant du droit `read:packages` pour les télécharger.

Les identifiants du registre et les fichiers d'environnement ne sont pas inclus dans les images.

## HTTPS, Let's Encrypt et ACME

Le domaine public est :

<https://atelier-ynov.duckdns.org>

DuckDNS résout ce domaine vers le Droplet DigitalOcean. Caddy agit comme reverse proxy et client ACME :

1. Caddy prouve le contrôle du domaine ;
2. Let's Encrypt délivre un certificat signé ;
3. Caddy sert l'application en HTTPS ;
4. le certificat est renouvelé automatiquement ;
5. les requêtes HTTP sont redirigées vers HTTPS.

Le fichier `Caddyfile` sélectionne explicitement le serveur ACME de production de Let's Encrypt.

## Démonstration de secours

`compose.tunnel.yaml` permet une démonstration temporaire avec Cloudflare Quick Tunnel lorsqu'aucune VM publique n'est disponible. Ce mode n'est pas utilisé pour le déploiement final DigitalOcean.
