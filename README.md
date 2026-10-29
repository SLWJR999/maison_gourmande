# Maison Gourmande

Application web de commande pour **Maison Gourmande**, à **Keur Massar, Rond-point Gouye Gui (Dakar, Sénégal)**.

Le site public présente le menu, les promotions, les événements et les avis. Le client compose son panier, choisit la livraison ou le retrait, puis envoie sa commande sur WhatsApp. **Aucun paiement en ligne n'est effectué.** La commande reste en attente jusqu'à la confirmation de la boutique.

- Téléphone / WhatsApp : **+221 70 98 15 201**
- E-mail public : **bonjour@maisongourmande.sn**
- Administration : **/admin** (non référencée sur le site public, `noindex`)

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Démarrage local](#démarrage-local)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données](#base-de-données)
- [Administration et rôles](#administration-et-rôles)
- [Promotions et prix](#promotions-et-prix)
- [Rapports et finances](#rapports-et-finances)
- [Médias](#médias)
- [Tests et recette](#tests-et-recette)
- [Mise en production](#mise-en-production)
- [Dépannage](#dépannage)

## Fonctionnalités

### Site public

- Accueil éditorial, produits mis en avant, bandeaux et promotions.
- Menu avec recherche, filtres par catégorie, disponibilité, promotion, budget et format, puis tri.
- Fiche produit avec galerie, formats, options, composition, allergènes, temps de préparation, avis et recommandations.
- Panier persistant : quantités, format, options, notes, validation du code promo.
- Commande avec livraison ou retrait, adresse et repère, créneau souhaité, consentement.
- Recalcul serveur des prix, des remises et des frais au moment de la validation.
- Message WhatsApp prérempli avec la référence, le détail et le total.
- Suivi de commande par référence : `/commande/[reference]`.
- Promotions, événements/devis, avis clients, à-propos, contact, conditions et confidentialité.
- `/robots.txt` et `/sitemap.xml` générés côté serveur ; l'administration, le panier, le suivi et l'API sont exclus de l'indexation.
- Thème clair/sombre persistant, respect de la préférence système.
- Interface mobile-first de 360 à 430 px, avec barre panier mobile et bouton WhatsApp qui ne se chevauchent pas.

### Administration

- Tableau de bord : commandes, chiffre d'affaires enregistré, marge indicative, alertes.
- Catalogue : catégories, produits, variantes, formats, options, stocks, disponibilité, médias.
- Promotions : codes, offres automatiques, portée, conditions, limites, fidélité, bannières.
- Commandes : création hors site, statut, paiement déclaré, annulation, export CSV.
- Clients, événements/devis, avis, dépenses, coûts et marges.
- Contenu du site, paramètres de la maison, équipe, permissions, journal d'audit.
- Rapports par période, graphiques, répartitions et exports CSV.
- Bibliothèque de médias avec conversion WebP via `sharp`.
- Données de démonstration clairement marquées et exclues des indicateurs par défaut.
- Journal d'audit pour les actions sensibles.

### Hors périmètre

- Pas de paiement en ligne, pas de prestataire de paiement.
- Pas de réservation de créneau en temps réel : le créneau est une préférence confirmée par la boutique.
- La livraison est proposée dans la zone publiée ; les frais sont configurables.

## Stack technique

| Élément | Choix |
| --- | --- |
| Framework | Next.js 15.5 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 3.4 |
| Base de données | PostgreSQL en production, PGlite embarqué en local |
| ORM | Drizzle ORM + migrations SQL |
| Validation | Zod |
| Authentification admin | JWT HS256 (`jose`), bcrypt coût 12, cookie HttpOnly |
| Tests | Vitest |
| Images | `sharp`, conversion WebP |
| Devise | FCFA / XOF, montants entiers |

## Démarrage local

Prérequis : **Node.js 20 ou plus récent** et npm.

```bash
npm install
copy .env.example .env.local   # Windows
# ou : cp .env.example .env.local
```

Renseignez dans `.env.local` :

1. `AUTH_SECRET` : une valeur aléatoire d'au moins 32 caractères.
2. `ADMIN_EMAIL` et `ADMIN_PASSWORD` : identifiants du premier administrateur.
3. Laissez `DATABASE_URL` vide pour utiliser PGlite en local.

Génération d'un secret :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Initialisation de la base locale et des données de démonstration :

```bash
npm run db:setup
npm run dev
```

- Site public : <http://localhost:3000>
- Administration : <http://localhost:3000/admin>
- Connexion avec l'e-mail et le mot de passe définis dans `.env.local`.

> Les données de démonstration sont identifiées (`isDemo`) et exclues des rapports par défaut. Le seed ne crée **rien** si le catalogue contient déjà des produits.

### Remplacer les visuels et les prix

Les images de démonstration sont dans `public/images/`. Les produits, variantes et prix se modifient dans **Admin > Catalogue**. Les visuels peuvent aussi être ajoutés par URL ou téléversés depuis **Admin > Médias**. Les contenus de la maison se modifient dans **Admin > Contenu** et **Admin > Paramètres**.

## Variables d'environnement

| Variable | Obligatoire | Description |
| --- | --- | --- |
| `AUTH_SECRET` | Oui | Secret de signature des sessions admin, minimum 32 caractères. |
| `DATABASE_URL` | Production | URL PostgreSQL. Laisser vide en local pour PGlite. |
| `PGLITE_DIR` | Non | Répertoire PGlite local. Défaut : `.data/pgdata`. |
| `ADMIN_EMAIL` | Scripts | E-mail du compte créé ou réinitialisé par les scripts admin. |
| `ADMIN_PASSWORD` | Non | Mot de passe du script admin. S'il est omis, un mot de passe aléatoire est affiché une fois. |
| `ADMIN_NAME` | Non | Nom affiché du compte admin. |
| `ADMIN_ROLE` | Non | `SUPER_ADMIN` par défaut, ou `MANAGER` / `STAFF` pour le script de création. |
| `WHATSAPP_FALLBACK` | Non | Numéro WhatsApp de secours au format international, sans `+`. Défaut recommandé : `221709815201`. |
| `NEXT_PUBLIC_SITE_URL` | Non | URL publique absolue du site, utile pour les métadonnées. |
| `MEDIA_DIR` | Non | Répertoire de stockage local des médias. Défaut : `public/uploads`. |

Ne commitez jamais `.env.local`, `.env` ou un secret. Le fichier `.env.example` ne contient que des valeurs vides ou des exemples non sensibles.

## Base de données

### En local

PGlite démarre automatiquement une base PostgreSQL embarquée dans `.data/pgdata`. Aucun serveur PostgreSQL n'est requis. La base et les médias téléversés ne doivent pas être versionnés.

### Commandes

| Commande | Rôle |
| --- | --- |
| `npm run db:generate` | Génère une nouvelle migration Drizzle après modification du schéma. |
| `npm run db:migrate` | Applique les migrations de `drizzle/`. |
| `npm run db:seed` | Crée le compte admin, le catalogue, les promotions et les données de démonstration. Ignoré si le catalogue existe déjà. |
| `npm run db:setup` | `db:migrate` puis `db:seed`. |
| `npm run db:reset` | **Destructif** : supprime la base locale. À utiliser avec accord explicite. |
| `npm run db:create-admin` | Crée ou réinitialise un compte admin sans créer de données de démonstration. |
| `npm run db:clear-demo` | Supprime les commandes, clients, événements, avis et dépenses marqués démo. Conserve catalogue, promotions, médias et paramètres. |
| `npm run db:update-catalog` | Ajoute le format **Box de 15** aux Mini-fataya et Nems d'une base existante, puis remet les formats 10/15/25/50 dans l'ordre. Idempotent. |

Après un `db:reset`, relancez `npm run db:setup`.

### Données historiques

Chaque ligne de commande conserve un instantané du produit, de la variante, des options, du prix unitaire et du coût matière au moment de la commande. Les modifications ultérieures du catalogue ne réécrivent pas les commandes passées.

### Données de démonstration

Les commandes, clients, événements, avis et dépenses de démonstration portent `isDemo = true`.

- Le tableau de bord et les rapports les excluent par défaut.
- Le rapport propose une case **Inclure la démo**.
- Les exports peuvent inclure ou exclure la démo selon le choix affiché.
- `npm run db:clear-demo` supprime ces données avant une mise en production réelle.

## Administration et rôles

L'administration est disponible sur `/admin`, n'est pas liée depuis le site public et renvoie `noindex, nofollow`. Le middleware protège les routes, puis **chaque action serveur vérifie les permissions**. Une URL non référencée ne remplace pas une authentification forte.

| Permission | SUPER_ADMIN | MANAGER | STAFF |
| --- | --- | --- | --- |
| Tableau de bord | Oui | Oui | Oui |
| Commandes (lecture/écriture) | Oui | Oui | Oui |
| Catalogue (lecture/écriture) | Oui | Oui | Non |
| Promotions | Oui | Oui | Non |
| Clients (lecture/écriture) | Oui | Oui | Lecture |
| Événements | Oui | Oui | Lecture |
| Avis | Oui | Oui | Lecture |
| Dépenses / coûts / rapports | Oui | Oui | Non |
| Contenu / médias / paramètres | Oui | Oui | Non |
| Équipe et journal d'audit | Oui | Non | Non |

### Créer ou réinitialiser un admin en production

```bash
npm run db:migrate
ADMIN_EMAIL=gerante@maisongourmande.sn \
ADMIN_PASSWORD='un-mot-de-passe-long-et-unique' \
ADMIN_NAME='Gérante Maison Gourmande' \
npm run db:create-admin
```

Sur Windows PowerShell, définissez les variables avec `$env:ADMIN_EMAIL = "..."` avant la commande, ou placez-les temporairement dans `.env.local` (jamais dans le dépôt). Le script :

- exige un e-mail valide et un mot de passe d'au moins 12 caractères ;
- génère un mot de passe aléatoire si `ADMIN_PASSWORD` est absent ;
- hache le mot de passe avec bcrypt (coût 12) ;
- ne stocke jamais le mot de passe en clair ;
- écrit une entrée d'audit ;
- peut réinitialiser un compte existant.

**Changez immédiatement le mot de passe de démonstration local avant toute exposition publique.** Le compte local fourni avec le projet est uniquement destiné au développement.

La connexion est limitée à 5 tentatives par 15 minutes par couple e-mail/adresse IP. Les sessions durent 8 heures. Une rotation de `AUTH_SECRET` invalide toutes les sessions.

## Promotions et prix

Le moteur de prix est dans `src/lib/pricing.ts` et s'exécute **côté serveur** lors de l'aperçu du panier et de la création de commande.

Règles appliquées :

1. Le sous-total est calculé à partir des prix serveur, options comprises.
2. La remise quantité est calculée d'abord, selon le seuil et le pourcentage configurés. Par défaut : 5 % dès 50 pièces.
3. Toutes les offres éligibles sont évaluées : code saisi et offres automatiques.
4. **Une seule meilleure offre** est retenue, en plus de la remise quantité.
5. En cas d'égalité, le code saisi est prioritaire, puis l'offre dont le nom vient alphabétiquement en premier.
6. Les offres limitées comptent les **commandes enregistrées et non annulées**. Un simple clic WhatsApp ne crée aucune commande et ne consomme aucune utilisation.
7. Une livraison offerte annule les frais de livraison mais n'accorde pas de remise produit ; elle ne s'applique pas au retrait.
8. Les conditions de date, jour, heure (fuseau `Africa/Dakar`), montant, nombre de pièces, catégories, produits, fidélité et plafonds sont vérifiées.
9. Une promotion dont la portée catégorie/produit ne correspond à aucune ligne est refusée.

Les montants sont des entiers FCFA. Les prix affichés dans le navigateur ne sont jamais utilisés pour valider une commande.

## Rapports et finances

Les indicateurs ne sont pas interchangeables :

| Indicateur | Définition |
| --- | --- |
| **CA enregistré** | Somme des totaux des commandes non annulées. Ce n'est pas de l'argent reçu. |
| **Encaissements déclarés** | Somme des montants saisis dans `amountReceived`, selon les paiements réellement déclarés. |
| **Marge brute indicative** | CA enregistré − coût matière historique des lignes. |
| **Résultat indicatif** | Marge brute indicative − dépenses réelles de la période. |

- Les données de démonstration sont exclues par défaut.
- Les lignes sans coût matière renseigné sont signalées : aucune marge n'est inventée.
- Les dépenses de démonstration sont signalées et exclues du résultat par défaut.
- Les rapports ne doivent pas être utilisés comme comptabilité officielle sans vérification des encaissements et des justificatifs.

## Médias

- Formats acceptés : JPG, PNG, WebP, AVIF.
- Taille maximale : 6 Mo.
- Les images sont redimensionnées (max 2400 px), orientées et converties en WebP.
- Le stockage par défaut est le système de fichiers (`public/uploads`).
- En production, `public/uploads` doit se trouver sur un **volume persistant sauvegardé**. Sur une plateforme à système de fichiers éphémère, adaptez le stockage vers un service objet (S3, R2, Supabase Storage, etc.) et mettez en place la sauvegarde des fichiers.
- Une image supprimée de la bibliothèque ne supprime pas automatiquement le fichier physique : nettoyez le volume selon votre procédure.

## Tests et recette

```bash
npm test
npm run typecheck
npm run build
```

Les tests unitaires couvrent le panier, les remises quantité, les promotions, les portées, les plafonds, la fidélité, les fenêtres de date/jour/heure, la livraison offerte et la priorité de la meilleure offre.

La recette manuelle et les critères d'acceptation sont détaillés dans [RECETTE.md](./RECETTE.md).

## Mise en production

Le guide complet est dans [DEPLOIEMENT.md](./DEPLOIEMENT.md). Résumé :

1. Provisionner PostgreSQL et un volume persistant pour les médias.
2. Renseigner les variables d'environnement, notamment `DATABASE_URL` et `AUTH_SECRET`.
3. Exécuter `npm ci`, `npm run db:migrate`, puis créer l'admin.
4. Exécuter `npm run build` et `npm run start` derrière un reverse proxy HTTPS.
5. Configurer les sauvegardes PostgreSQL et médias, la supervision et HTTPS/HSTS.
6. Tester le site public, `/admin`, le parcours panier → commande → WhatsApp, les exports et les rôles.
7. Retirer les données de démonstration et remplacer les visuels/prix avant ouverture.

## Dépannage

- **`AUTH_SECRET manquant ou trop court`** : définissez un secret d'au moins 32 caractères dans `.env.local` ou l'environnement de production.
- **La base PGlite est verrouillée** : arrêtez le serveur Next.js avant une migration ou un seed local.
- **Le seed est ignoré** : la base contient déjà des produits. Utilisez l'administration ou, après accord explicite, `npm run db:reset` puis `npm run db:setup`.
- **Le numéro WhatsApp ne s'ouvre pas** : vérifiez `whatsapp` dans **Admin > Paramètres**, au format `221709815201`, et `WHATSAPP_FALLBACK` en secours.
- **Connexion admin bloquée** : la limitation est en mémoire ; redémarrez le serveur ou attendez 15 minutes.
- **Prix affiché différent du panier** : le serveur recalcule toujours le panier ; rechargez les disponibilités et vérifiez les promotions actives.
- **`sharp` ne s'installe pas** : utilisez une version de Node supportée et réinstallez les dépendances (`npm ci`).
- **Fuseau horaire** : les promotions utilisent `Africa/Dakar`. Vérifiez que l'heure du serveur est correcte.
- **PowerShell refuse `npm`** : si la stratégie d'exécution bloque `npm.ps1`, lancez `cmd /c npm run ...` depuis l'invite Windows.

## Contact

Maison Gourmande — Keur Massar, Rond-point Gouye Gui · Dakar, Sénégal  
Téléphone / WhatsApp : +221 70 98 15 201  
E-mail : bonjour@maisongourmande.sn
