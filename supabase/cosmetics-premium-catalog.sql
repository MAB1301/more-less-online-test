-- Additive catalog update; existing item IDs, purchases and wallets stay intact.
insert into ml_private.cosmetic_catalog(id,kind,name,price,sort) values
 ('frame-obsidian','frame','Obsidian Crest',180,13),
 ('frame-laurel','frame','Royal Laurel',260,14),
 ('frame-aurora','frame','Aurora Veil',220,15),
 ('frame-dragon','frame','Dragon Guard',300,16),
 ('frame-coral','frame','Coral Bloom',160,17),
 ('frame-prism','frame','Prism Arc',240,18),
 ('color-pearl','color','Pearl Rose',90,16),
 ('color-ocean','color','Ocean Blue',100,17),
 ('color-aurora','color','Aurora Mint',140,18),
 ('title-night','title','Nachtstratege',80,124),
 ('title-architect','title','Quiz-Architekt',120,125),
 ('title-brain','title','Kopf mit Köpfchen',60,126),
 ('title-comeback','title','Comeback-König',100,127),
 ('title-stellar','title','Sternenkenner',140,128),
 ('title-captain','title','Captain Bauchgefühl',80,129)
on conflict(id) do nothing;
