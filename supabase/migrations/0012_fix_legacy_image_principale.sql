-- Audit V3.3.Q.1.7 : 4 annonces de démo (id 1, 3, 9, 10) partagent exactement
-- la même valeur `image_principale` = '/images/properties/appartement-1/exterior.jpg'
-- — un chemin local qui n'existe plus dans public/images/properties (supprimé
-- lors du passage aux images Storage, V3.2.x). Ce n'est pas une vraie photo
-- par annonce : c'est visiblement une valeur par défaut recopiée telle
-- quelle lors du seed initial, jamais remplacée. Next/Image renvoie 400 sur
-- ce chemin mort (confirmé en QA mobile V3.3.Q.1.6).
--
-- Aucune de ces 4 annonces n'a de ligne annonce_images (Storage) : il
-- n'existe donc aucune vraie photo, locale ou distante, vers laquelle
-- rediriger ces annonces. On met `image_principale` à NULL plutôt que de
-- laisser une référence cassée — lib/supabase/annonces.ts
-- (buildPropertyImages) traite déjà ce cas proprement : `images` devient
-- `undefined`, et PropertyCard / PropertyDetailHero affichent alors
-- <ImagePlaceholder /> (comme l'annonce #2, qui n'a jamais eu d'image et
-- n'a jamais été concernée par ce bug).
--
-- Ciblage strict sur la valeur exacte du chemin mort : aucune autre colonne
-- touchée (titre, prix, surface, description, ville, caractéristiques
-- inchangés), et une annonce qui aurait légitimement ce chemin par coïncidence
-- future ne serait de toute façon jamais un cas réel puisque ce dossier
-- n'existe plus dans le dépôt.
update public.annonces
set image_principale = null
where image_principale = '/images/properties/appartement-1/exterior.jpg';
