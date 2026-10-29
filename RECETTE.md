# Recette — Maison Gourmande

Cette recette valide le site public, le parcours de commande WhatsApp, les promotions, l'administration et le déploiement. Elle complète les tests automatisés ; elle ne les remplace pas.

## 1. Préparation

- [ ] Utiliser une base de test ou la base locale de démonstration, jamais la production réelle.
- [ ] Vérifier `.env.local` (`AUTH_SECRET`, `DATABASE_URL` vide en local, identifiants admin).
- [ ] Lancer `npm run db:setup` si la base locale est vide.
- [ ] Lancer `npm run dev`.
- [ ] Vérifier que les données de démonstration sont bien marquées et exclues des rapports par défaut.

Commandes automatiques à exécuter avant la recette manuelle :

```bash
npm test
npm run typecheck
npm run build
```

Résultat attendu : **2 fichiers de tests, 45 tests réussis**, aucune erreur TypeScript et build Next.js réussi.

## 2. Contrôle mobile et thèmes

Viewports à tester dans les DevTools du navigateur (largeur CSS réelle) :

| Appareil | Largeur × hauteur |
| --- | --- |
| Petit mobile | 360 × 800 |
| Mobile standard | 390 × 844 |
| Grand mobile | 430 × 932 |

Pour chaque viewport et pour les deux thèmes :

- [ ] **Accueil** : titre, image, boutons, bandeau d'annonce et carte de notation lisibles sans débordement.
- [ ] **Menu** : filtres, recherche, tri et cartes produits utilisables au doigt.
- [ ] **Fiche produit** : galerie, formats, options, quantité, note et bouton panier accessibles.
- [ ] **Panier** : lignes éditables, options, notes, code promo, mode de livraison et récapitulatif.
- [ ] **Promotions**, **Événements**, **Avis**, **Contact**, **À propos**, **Conditions** et **Confidentialité** : aucun texte coupé.
- [ ] **Administration** : connexion, tableau de bord, commandes, produits, promotions et rapports utilisables à 390 px.
- [ ] En console : `document.documentElement.scrollWidth` est égal à `window.innerWidth`. Les tiroirs hors écran (menu, sidebar admin) ne doivent pas créer de défilement horizontal de la page.
- [ ] Les éléments tactiles principaux (boutons, champs, cases) restent faciles à atteindre, sans chevauchement.
- [ ] Le thème clair/sombre se bascule sans flash au rechargement et reste mémorisé.
- [ ] La première visite respecte la préférence système.
- [ ] Le contraste reste lisible en sombre, notamment les boutons secondaires, les encarts de règles promotionnelles et les tableaux admin.

### Bouton WhatsApp et barre panier mobile

- [ ] Ajouter un produit, puis faire défiler la page sous 700 px : la barre panier mobile n'apparaît pas.
- [ ] Au-delà de 700 px, la barre panier mobile apparaît.
- [ ] Tant que la barre panier mobile est visible, le bouton WhatsApp flottant est masqué sur mobile : **aucun chevauchement**.
- [ ] Sur ordinateur, la barre panier mobile est absente et le bouton WhatsApp flottant reste visible.
- [ ] Sur `/panier`, le bouton WhatsApp flottant est masqué.
- [ ] La barre panier respecte la zone de sécurité basse (encoche / barre gestuelle).

## 3. Parcours panier et commande

- [ ] Ajouter deux fois le même produit avec les mêmes options : les quantités fusionnent sur une seule ligne.
- [ ] Ajouter le même produit avec une option différente : deux lignes distinctes.
- [ ] Modifier la quantité, changer de format, ajouter une note, supprimer une ligne.
- [ ] Vérifier les totaux : sous-total, remise quantité, remise promo, livraison, total.
- [ ] Valider un code promo en minuscules ou avec des espaces : il est normalisé.
- [ ] Passer en livraison : l'adresse et le repère sont demandés ; les frais s'appliquent.
- [ ] Passer en retrait : l'adresse disparaît et les frais de livraison sont à 0.
- [ ] Tenter de valider sans consentement : la commande est refusée avec un message clair.
- [ ] Tenter de modifier un prix dans le localStorage : le serveur recalcule avec le prix catalogue et refuse les données invalides.
- [ ] Valider une commande : elle est enregistrée une seule fois, une référence apparaît et WhatsApp s'ouvre.
- [ ] L'URL WhatsApp commence par `https://wa.me/221709815201?text=`.
- [ ] Le message contient la référence, le détail des lignes, le mode, le total et la mention « commande non confirmée ».
- [ ] Fermer WhatsApp : la commande reste en attente dans l'administration.
- [ ] Cliquer uniquement sur le bouton WhatsApp d'assistance : aucune commande n'est créée et aucun plafond promo n'est consommé.
- [ ] Ouvrir `/commande/[reference]` : la commande et son statut s'affichent.
- [ ] Une référence inconnue affiche une page « introuvable », pas une erreur serveur.
- [ ] Recharger ou revenir en arrière ne crée pas de doublon.

## 4. Promotions et remise quantité

Configurer des offres de test dans **Admin > Promotions** ou utiliser les offres de démonstration.

- [ ] 49 pièces : pas de remise quantité.
- [ ] 50 pièces : remise quantité de 5 % (ou valeur configurée dans **Paramètres**).
- [ ] La remise quantité est cumulée avec **une seule** autre offre.
- [ ] Plusieurs offres automatiques éligibles : la plus avantageuse est retenue.
- [ ] Égalité entre un code saisi et une offre automatique : le code saisi gagne.
- [ ] Égalité entre deux offres automatiques : l'ordre alphabétique du nom est respecté.
- [ ] Offre à montant fixe : la remise ne dépasse jamais le sous-total.
- [ ] Offre en pourcentage : calculée sur la portée concernée (tout, catégories ou produits).
- [ ] Portée catégorie/produit sans ligne correspondante : l'offre est refusée, y compris une livraison offerte.
- [ ] Montant minimum et nombre minimum de pièces respectés.
- [ ] Offre hors jour, hors horaire ou hors période : refusée.
- [ ] Plage horaire passant minuit (par exemple 22h–2h) : comportement correct à Dakar.
- [ ] Plafond global atteint : offre refusée.
- [ ] Plafond par client atteint : offre refusée.
- [ ] Offre fidélité : refusée sous le nombre de commandes validées, acceptée au seuil.
- [ ] Livraison offerte : frais à 0 en livraison, offre inapplicable en retrait.
- [ ] Un code inexistant ou moins avantageux affiche un avertissement sans bloquer la commande.
- [ ] Les plafonds ne comptent que les commandes enregistrées non annulées.
- [ ] Annuler une commande de test libère une utilisation du plafond après rechargement.
- [ ] Un simple clic WhatsApp ne consomme aucune utilisation.

Scénario recommandé :

1. Créer un code `TEST10` à 10 %, plafonné à 1 utilisation.
2. Créer une commande avec ce code.
3. Vérifier que le code est refusé pour la commande suivante.
4. Annuler la commande, puis vérifier que le code redevient disponible.

## 5. Administration et sécurité

### Accès

- [ ] `/admin` n'est pas référencé dans la navigation publique.
- [ ] Une requête non authentifiée sur `/admin` ou `/admin/commandes` redirige vers `/admin/login`.
- [ ] Après connexion, la redirection respecte `next` sans permettre une URL externe.
- [ ] L'en-tête `X-Robots-Tag` est présent sur `/admin` et les métadonnées sont en `noindex`.
- [ ] `/admin` ne doit pas être considéré comme secret : l'authentification et les rôles restent la protection réelle.
- [ ] Cinq tentatives de connexion échouées déclenchent le blocage temporaire.
- [ ] La déconnexion invalide le cookie de session.
- [ ] Le cookie est `HttpOnly`, `SameSite=Strict` et `Secure` en production HTTPS.
- [ ] Un mot de passe de moins de 12 caractères est refusé par `npm run db:create-admin`.

### Rôles

Créer un compte de chaque rôle via **Admin > Équipe**, puis vérifier :

- [ ] `SUPER_ADMIN` voit tout, y compris Équipe et Journal.
- [ ] `MANAGER` gère le catalogue, les promotions, les commandes, le contenu et les rapports, mais pas l'équipe ni le journal d'audit.
- [ ] `STAFF` voit le tableau de bord et les commandes, peut traiter les commandes, mais ne peut pas modifier produits, promotions, dépenses, contenu, paramètres ou équipe.
- [ ] Les accès directs par URL aux pages interdites sont refusés côté serveur, pas seulement masqués dans le menu.
- [ ] La désactivation d'un compte bloque ses prochaines requêtes.

### Fonctions admin

- [ ] Créer/modifier une catégorie et un produit, avec variantes et options.
- [ ] Activer la catégorie future **Pâtisserie** : elle apparaît sur le menu sans casser le site.
- [ ] Téléverser une image JPG/PNG : elle est convertie en WebP et s'affiche sur la fiche produit.
- [ ] Refuser un fichier trop lourd ou d'un type non autorisé.
- [ ] Créer une commande hors site : le total et les lignes sont cohérents.
- [ ] Modifier le statut d'une commande, déclarer un encaissement, annuler une commande.
- [ ] Exporter les commandes en CSV : le fichier s'ouvre avec les accents sous Excel (BOM UTF-8).
- [ ] Exporter la synthèse des rapports en CSV.
- [ ] Vérifier une entrée dans **Admin > Journal** après une action sensible.

## 6. Rapports et finances

- [ ] Les commandes et dépenses de démonstration sont exclues par défaut.
- [ ] La case **Inclure la démo** modifie les indicateurs et le signalement.
- [ ] **CA enregistré** = somme des totaux des commandes non annulées, pas les encaissements.
- [ ] **Encaissements déclarés** = paiements réellement saisis, séparés du CA.
- [ ] **Marge brute indicative** = CA − coût matière historique.
- [ ] Une ligne sans coût matière est signalée ; aucune marge n'est inventée.
- [ ] **Résultat indicatif** = marge brute − dépenses réelles de la période.
- [ ] Les dépenses de démonstration sont exclues du résultat par défaut.
- [ ] Le rapport et les exports mentionnent clairement les données exclues ou incluses.

## 7. Contenus, SEO et pages légales

- [ ] L'adresse affichée est **Keur Massar, Rond-point Gouye Gui · Dakar, Sénégal**.
- [ ] Le téléphone/WhatsApp affiché est **+221 70 98 15 201**.
- [ ] L'e-mail public affiché est **bonjour@maisongourmande.sn**.
- [ ] Aucune mention d'Abidjan, Cocody ou Côte d'Ivoire ne subsiste.
- [ ] Les pages Conditions et Confidentialité mentionnent le Sénégal, Dakar et la CDP.
- [ ] Les informations RCCM/NINEA nécessaires sont complétées avant ouverture.
- [ ] `/robots.txt` interdit `/admin`, `/api/`, `/panier` et `/commande/`.
- [ ] `/sitemap.xml` liste les pages publiques et les produits actifs, sans page admin.
- [ ] Les métadonnées et Open Graph utilisent la localisation Dakar.
- [ ] Les images de démonstration, le logo et la vidéo sont remplacés ou validés par la maison.

## 8. Déploiement

- [ ] `DATABASE_URL` pointe vers PostgreSQL de production, avec TLS.
- [ ] PGlite n'est pas utilisé en production.
- [ ] `AUTH_SECRET` est unique et sauvegardé dans un coffre-fort.
- [ ] `NEXT_PUBLIC_SITE_URL` est l'URL HTTPS finale.
- [ ] Les migrations ont été appliquées avant le build.
- [ ] L'admin de production a été créé avec `npm run db:create-admin` ou son mot de passe a été changé.
- [ ] Les données de démonstration ont été supprimées (`npm run db:clear-demo`).
- [ ] Les médias et la base sont sauvegardés et une restauration a été testée.
- [ ] HTTP redirige vers HTTPS, HSTS est actif et le certificat se renouvelle.
- [ ] Le volume `MEDIA_DIR` est persistant et sauvegardé.
- [ ] Les sauvegardes PostgreSQL et médias sont planifiées.
- [ ] Le service redémarre automatiquement et les logs sont supervisés.
- [ ] Les pages publiques, `/admin`, le panier, WhatsApp et les exports fonctionnent après déploiement.

## 9. Critères de refus

La livraison est refusée si l'un des points suivants est constaté :

- débordement horizontal sur un viewport de 360, 390 ou 430 px ;
- chevauchement entre le bouton WhatsApp et la barre panier mobile ;
- prix ou remise calculés à partir du navigateur ;
- deux promotions cumulées ou remise quantité perdue ;
- clic WhatsApp seul compté comme commande ou utilisation de plafond ;
- données de démonstration incluses silencieusement dans les indicateurs ;
- marge calculée sur un coût manquant sans avertissement ;
- accès admin possible sans session ou permission ;
- secret ou mot de passe présent dans le code source ;
- mention d'Abidjan/Côte d'Ivoire dans le site ou les données ;
- absence de sauvegarde ou d'HTTPS en production.
