# Guide de déploiement — Maison Gourmande

Ce guide décrit une mise en production sûre de l'application Next.js avec PostgreSQL, HTTPS, sauvegardes et stockage persistant des médias.

## 1. Prérequis

- Node.js **20 LTS ou supérieur** et npm.
- Une base **PostgreSQL 15+** accessible depuis le serveur (Neon, Supabase, Railway, RDS, serveur managé ou auto-hébergé).
- Un nom de domaine avec HTTPS.
- Un volume persistant pour les médias si vous conservez le stockage local.
- Un gestionnaire de secrets (variable d'environnement du serveur, coffre-fort, secrets de la plateforme).
- Un reverse proxy (Nginx, Caddy, Traefik) ou une plateforme gérant TLS.

> **Ne pas utiliser PGlite en production.** PGlite est une commodité de développement local. En production, renseignez obligatoirement `DATABASE_URL`.

## 2. Variables d'environnement de production

Créer les variables dans le gestionnaire de secrets de la plateforme, pas dans un fichier versionné.

```dotenv
NODE_ENV=production
AUTH_SECRET=<secret-aléatoire-de-64-caractères>
DATABASE_URL=postgresql://user:password@host:5432/maison_gourmande?sslmode=require
NEXT_PUBLIC_SITE_URL=https://www.maisongourmande.sn
WHATSAPP_FALLBACK=221709815201
MEDIA_DIR=/var/lib/maison-gourmande/uploads
```

Variables utilisées uniquement lors de la création/réinitialisation d'un admin :

```dotenv
ADMIN_EMAIL=gerante@maisongourmande.sn
ADMIN_PASSWORD=<mot-de-passe-fort-12-caractères-minimum>
ADMIN_NAME=Gérante Maison Gourmande
ADMIN_ROLE=SUPER_ADMIN
```

Générer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Points importants :

- `AUTH_SECRET` doit être unique par environnement et stable entre les redémarrages. Le changer déconnecte tous les admins.
- `NEXT_PUBLIC_SITE_URL` est intégré au build : reconstruisez après modification.
- `DATABASE_URL` doit utiliser TLS si la base est distante (`sslmode=require` ou équivalent).
- Ne jamais committer `.env`, `.env.local`, `.env.production` ou un secret dans le dépôt. Le `.gitignore` ignore `.env*` sauf `.env.example`.

## 3. Base de données

### Première installation

```bash
npm ci
npm run db:migrate
```

Deux stratégies possibles pour le contenu initial.

#### A. Catalogue de démonstration à nettoyer (recommandé pour démarrer vite)

```bash
npm run db:seed
npm run db:clear-demo
```

- `db:seed` crée le catalogue, les promotions, les bannières, les paramètres et le compte admin.
- `db:clear-demo` supprime uniquement les commandes, clients, événements, avis et dépenses marqués démo.
- Relisez ensuite les produits, prix, promotions, bannières et paramètres dans l'administration.

#### B. Partir d'une base vierge

```bash
npm run db:create-admin
```

Puis créez les catégories, produits, variantes, promotions et paramètres dans `/admin`. Cette méthode évite toute donnée de démonstration.

### Vérification

```sql
SELECT count(*) FROM products;
SELECT count(*) FROM users;
SELECT count(*) FROM orders WHERE is_demo = true;
```

Le dernier résultat doit être `0` avant une ouverture réelle.

### Migrations suivantes

À chaque déploiement comportant une migration :

```bash
npm run db:migrate
npm run build
```

Si une base existante issue du catalogue de démonstration n'a pas encore le format **Box de 15**, exécutez une fois la mise à jour de données idempotente :

```bash
npm run db:update-catalog
```

Faites une sauvegarde avant toute migration en production. Ne lancez jamais `db:reset` en production.

## 4. Créer ou réinitialiser le compte administrateur

```bash
ADMIN_EMAIL=gerante@maisongourmande.sn \
ADMIN_PASSWORD='mot-de-passe-long-et-unique' \
ADMIN_NAME='Gérante Maison Gourmande' \
npm run db:create-admin
```

Sous PowerShell :

```powershell
$env:ADMIN_EMAIL = "gerante@maisongourmande.sn"
$env:ADMIN_PASSWORD = "mot-de-passe-long-et-unique"
$env:ADMIN_NAME = "Gérante Maison Gourmande"
npm run db:create-admin
```

Le script hache le mot de passe avec bcrypt (coût 12), n'écrit jamais le mot de passe en clair et journalise l'action. Si `ADMIN_PASSWORD` est absent, un mot de passe aléatoire est affiché une seule fois : notez-le immédiatement.

Après la première connexion :

1. Aller sur `/admin/compte` et changer le mot de passe.
2. Créer les comptes de l'équipe dans `/admin/equipe`.
3. Attribuer le rôle minimal nécessaire.
4. Ne jamais réutiliser le mot de passe de démonstration local.

## 5. Build et démarrage

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run start
```

`npm run start` écoute par défaut sur le port `3000`. Pour un autre port :

```bash
npx next start -p 8080
```

Avec un gestionnaire de processus (systemd, PM2, Docker, plateforme managée), configurez :

- redémarrage automatique ;
- rechargement des variables d'environnement au redémarrage ;
- journaux centralisés ;
- utilisateur système non privilégié ;
- limité aux fichiers nécessaires.

### Exemple de service systemd

```ini
[Unit]
Description=Maison Gourmande
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/maison-gourmande
EnvironmentFile=/etc/maison-gourmande.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Le fichier `/etc/maison-gourmande.env` doit être lisible uniquement par l'utilisateur du service.

## 6. HTTPS et reverse proxy

Terminez TLS au reverse proxy et transmettez les en-têtes nécessaires. Exemple Nginx :

```nginx
server {
  listen 80;
  server_name www.maisongourmande.sn;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name www.maisongourmande.sn;

  ssl_certificate     /etc/letsencrypt/live/www.maisongourmande.sn/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/www.maisongourmande.sn/privkey.pem;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  add_header X-Frame-Options SAMEORIGIN always;

  client_max_body_size 8m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
  }
}
```

Vérifications :

- HTTP redirige vers HTTPS.
- Le certificat est renouvelé automatiquement.
- `X-Forwarded-For` est transmis pour la limitation de connexion.
- Les téléversements jusqu'à 6 Mo passent (`client_max_body_size`).
- Les cookies admin sont `Secure` en production.

### Restreindre l'administration (optionnel)

L'URL `/admin` n'est pas liée publiquement et est en `noindex`, mais elle reste accessible à qui connaît l'adresse. Pour une défense supplémentaire, limitez `/admin` par IP, VPN ou authentification au niveau du proxy. Ne comptez jamais uniquement sur le secret de l'URL.

## 7. Stockage des médias

Le téléversement actuel écrit dans `MEDIA_DIR` (par défaut `public/uploads`). En production :

- montez un volume persistant ;
- sauvegardez-le avec la base ;
- vérifiez les droits d'écriture de l'utilisateur du service ;
- ne déployez pas un conteneur éphémère sans volume, sinon les images disparaissent au redéploiement.

Si la plateforme ne fournit pas de disque persistant, adaptez la couche de stockage dans `src/app/api/admin/upload/route.ts` vers un stockage objet (S3, R2, Supabase Storage…). Dans ce cas, sauvegardez aussi le bucket et configurez les permissions d'accès.

## 8. Sauvegardes

### PostgreSQL

Sauvegarde quotidienne chiffrée, conservation selon votre politique (par exemple 7 quotidiennes, 4 hebdomadaires, 3 mensuelles) :

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --file="maison-gourmande-$(date +%F).dump"
```

Restauration testée :

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" maison-gourmande-2026-10-29.dump
```

Testez une restauration sur une base de test au moins une fois par trimestre. Une sauvegarde non testée n'est pas une garantie.

### Médias

Sauvegardez le volume `MEDIA_DIR` (rsync, snapshot du disque ou export du stockage objet). Conservez la même politique de rétention que la base.

### Secrets

Conservez `AUTH_SECRET` et les accès base dans un coffre-fort. Sans `AUTH_SECRET`, les sessions existantes ne sont plus valides ; sans accès base, l'application ne démarre pas correctement.

## 9. Supervision et exploitation

Surveillez au minimum :

- disponibilité de `/` et `/admin/login` ;
- erreurs 5xx dans les logs ;
- espace disque du volume médias ;
- connexions PostgreSQL et taille de la base ;
- échecs de sauvegarde ;
- tentatives de connexion admin répétées.

Contrôles réguliers :

- vérifier les commandes `PENDING` et les relances WhatsApp ;
- vérifier les avis en attente et les événements ;
- contrôler les dépenses et les coûts matière ;
- vérifier la cohérence entre CA enregistré, encaissements déclarés et résultat indicatif ;
- renouveler les mots de passe de l'équipe après un départ.

## 10. Mise à jour applicative

1. Sauvegarder la base et les médias.
2. Récupérer la nouvelle version et installer les dépendances (`npm ci`).
3. Exécuter `npm run db:migrate`.
4. Exécuter `npm run db:update-catalog` si la mise à jour des formats de box est concernée.
5. Exécuter `npm run typecheck`, `npm test` et `npm run build`.
6. Redémarrer le service.
7. Vérifier les pages publiques, la connexion admin, un parcours panier et les exports.
8. En cas de problème, revenir à la version précédente et restaurer la sauvegarde si la migration est incompatible.

## 11. Checklist avant ouverture

- [ ] `DATABASE_URL` pointe vers PostgreSQL de production avec TLS.
- [ ] `AUTH_SECRET` est unique, robuste et sauvegardé.
- [ ] Le compte admin de démonstration a été remplacé ou son mot de passe a été changé.
- [ ] Les données `isDemo` ont été supprimées (`npm run db:clear-demo`).
- [ ] Les produits, prix, formats, options et disponibilités sont vérifiés.
- [ ] Les photos, le logo et la vidéo sont remplacés ou validés.
- [ ] L'adresse, le téléphone, l'e-mail, les horaires et la zone de livraison sont exacts.
- [ ] Le numéro WhatsApp ouvre bien une conversation avec le bon numéro.
- [ ] Les promotions actives, dates, horaires et plafonds sont relus.
- [ ] Les pages conditions, confidentialité et mentions sont complétées avec les informations légales définitives.
- [ ] Les sauvegardes base + médias sont planifiées et une restauration a été testée.
- [ ] HTTPS, HSTS et redirection HTTP → HTTPS fonctionnent.
- [ ] `/admin` est en `noindex` et protégé par authentification.
- [ ] Les rôles de l'équipe sont créés avec le minimum de permissions.
- [ ] Le parcours mobile 360–430 px est testé en clair et sombre.
- [ ] Le bouton WhatsApp et la barre panier mobile ne se chevauchent pas.
- [ ] Les exports CSV s'ouvrent correctement avec les accents.
- [ ] `/robots.txt` et `/sitemap.xml` répondent avec le domaine de production.
- [ ] Le site est ajouté à la supervision et aux alertes.

## 12. Rollback

- **Application** : redéployer l'image ou la révision précédente.
- **Base** : restaurer le dump si une migration a modifié le schéma de façon incompatible. Ne jamais lancer une migration destructive sans sauvegarde.
- **Médias** : restaurer le snapshot du volume.
- **Sessions** : après restauration, les sessions peuvent rester valides si `AUTH_SECRET` n'a pas changé.

## 13. Contacts techniques

- Dépôt et documentation : `README.md`, `RECETTE.md`.
- Point d'entrée admin : `/admin`.
- Point d'entrée santé simple : page d'accueil publique `/`.
