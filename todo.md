- [x] Remplacer les données HomeExchange par les cinq prêts retenus.
- [x] Vérifier la validité du JSON et le rendu de la page HomeExchange.
- [x] Sauvegarder le projet puis synchroniser la mise à jour vers GitHub.
- [x] Appliquer la palette sombre « Ardoise & terre cuite » aux couleurs de garde.
- [x] Vérifier l’accessibilité et le rendu du planning en mode sombre (contraste des cellules et légendes contrôlé).
- [x] Sauvegarder la palette et synchroniser la mise à jour vers GitHub.
- [x] Recenser les activités familiales vérifiées, uniquement les week-ends de septembre à décembre 2026.
- [x] Intégrer les activités retenues dans les fichiers hebdomadaires du site.
- [x] Valider les données, le rendu, puis sauvegarder et synchroniser la mise à jour.

Contrôle interface : le 15 août 2026, la sélection affiche bien les semaines S36 à S52 ; S36 charge la Grande Braderie le samedi 5 septembre avec son lien source. La page Liste affiche également ces semaines dans son sélecteur et conserve les filtres dédiés aux créneaux samedi/dimanche ; S50 présente ses trois activités. La page Carte affiche également le sélecteur S36–S52 sans erreur de chargement, et S50 y liste les trois lieux géolocalisés.

- [x] Étendre la sélection des activités aux vendredis soirs de septembre à décembre.
- [x] Ajouter un filtre « Disponible selon ma garde » dans la liste des activités.
- [x] Ajouter des alertes de réservation pour les activités concernées, dont le Quai des Savoirs.
- [x] Programmer une veille ciblée de novembre à la fin octobre.
- [x] Valider, sauvegarder et synchroniser les évolutions.

Contrôle interface : le filtre « Disponible selon ma garde » et le créneau « Vendredi soir » sont disponibles dans Liste. En S42, l’activité Lumières sur le Quai affiche l’alerte « Ouverture à surveiller » avec l’instruction de vérifier la publication des ateliers. En S50, le vendredi soir est affiché et les alertes de réservation sont visibles pour Le Noël de Patapon et Casse-Noisette ; le filtre de disponibilité conserve ces quatre activités, conformément au planning de garde.

Veille planifiée : exécution ponctuelle le 28 octobre 2026 à 10 h 00 (Europe/Paris), avec mise à jour des activités familiales de novembre à partir de sources vérifiées.

- [x] Ajouter le filtre « Sans réservation ».
- [x] Ajouter des rappels visuels J-7 sur les activités réservées.
- [x] Créer la liste personnelle « Mes sorties » avec stockage local dans le navigateur.
- [x] Valider, sauvegarder et synchroniser ces évolutions.

Contrôle interface : le filtre « Sans réservation », le lien « Mes sorties » et les boutons d’enregistrement sont visibles dans Liste. L’ajout d’une activité change bien son action en « Retirer de mes sorties ». La page Mes sorties restitue l’activité enregistrée, puis revient correctement à son état vide après retrait. En S50, quatre activités apparaissent, dont deux avec une réservation conseillée et deux sans réservation. Le filtre « Sans réservation » ramène bien le résultat à ces deux seules activités sans alerte de réservation.

- [x] Vérifier les dates officielles des vacances scolaires 2026 et 2027 en zone C.
- [x] Ajouter les vacances 2026 manquantes et créer les douze mois de 2027 dans le planning.
- [x] Adapter la consultation du planning à l’année 2027.
- [x] Valider, sauvegarder et synchroniser l’extension du planning scolaire.

Contrôle interface : le sélecteur 2026/2027 du planning annuel charge bien les douze mois de 2027 et les dates de vacances associées. Le détail du 1er janvier indique « Vacances scolaires — Noël 2026-2027 ». Le lien de janvier ouvre correctement le calendrier mensuel sur `calendrier?year=2027&month=0`. Les gardes 2027 restent volontairement indiquées « à déterminer » tant qu’un accord n’est pas saisi.
