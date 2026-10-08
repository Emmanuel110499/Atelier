# Travail de conteneurisation à réaliser

## Livrables attendus

1. Une image frontend qui sert le build de l’interface.
2. Une image backend qui exécute l’API.
3. Un Compose local permettant de construire et lancer l’ensemble avec PostgreSQL.
4. Les deux images applicatives publiées dans un registre privé.
5. Un Compose de « production » qui référence ces images, sans `build:`.
6. Un README expliquant les commandes et les choix de votre équipe.

La base peut utiliser une image officielle : inutile de reconstruire PostgreSQL.
Le nom « production » désigne ici un déploiement reproductible pour l’exercice,
pas une application sécurisée et prête à être exposée à Internet.

## Pistes pour les images

### Frontend

Le multi-stage a ici un intérêt direct : construire avec Node et Vite, puis
copier uniquement `dist/` dans une image de serveur web. Node et les dépendances
de build ne sont plus nécessaires dans l’image finale.

Configurer le reverse proxy `/api/` vers le backend. Conserver le chemin complet.
Un appel `/api/tickets` doit arriver sur `/api/tickets`, pas `/tickets`.

### Backend

Le JavaScript n’exige pas de compilation. Vous pouvez néanmoins utiliser une
étape d’installation (`npm ci --omit=dev`) puis transférer les dépendances
de production et `src/` vers l’étape finale. Cela exclut notamment PGlite.
N’utilisez pas une étape de build artificielle : expliquez l’intérêt réel
de votre découpage et mesurez la taille des images.

Exécuter `node src/server.js`, avec `HOST=0.0.0.0`, `PORT=3000` et `DATABASE_URL`.
Les environnements de construction et d’exécution doivent être compatibles.
Prévoyez un utilisateur non-root et un `.dockerignore` pour chaque contexte.

## Points à vérifier dans Compose

- Le navigateur accède seulement au serveur web ; API et base peuvent rester internes.
- Les conteneurs utilisent les noms de services pour communiquer.
- `localhost` dans un conteneur désigne ce conteneur, pas PostgreSQL ni votre PC.
- Les données PostgreSQL sont dans un volume persistant adapté à la version choisie.
- L’API attend que PostgreSQL soit sain ; l’ordre de lancement seul ne suffit pas.
- Le contrôle `/api/health` vérifie bien la connexion à la base.
- Les mots de passe restent hors du code et des images. Ne versionnez pas `.env`.
- Fixez les versions des images ; utilisez un tag explicite pour vos images.
- Authentifiez-vous au registre avant de pousser ou tirer des images privées.
- Ne publiez pas de ports inutilement. Évitez d’exposer PostgreSQL en production.

## Démonstration à préparer

1. Lancer les trois services et ouvrir l’application.
2. Créer une demande et changer son statut.
3. Redémarrer les services et montrer la persistance.
4. Montrer les tailles de vos images finales.
5. Récupérer les images du registre privé avec le Compose de production.
6. Expliquer la différence entre configuration locale et configuration conteneurisée.

Ne supprimez pas les volumes pendant la démonstration de persistance.
Une suppression de volume peut effacer toutes les demandes.
