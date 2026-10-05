-- Eight new local music loops. Does not change balances or existing purchases.
insert into ml_private.cosmetic_catalog(id,kind,name,price,sort) values
 ('music-velvet-cafe','music','Velvet Café · Lo-Fi',60,200),
 ('music-blue-hour','music','Blue Hour · Ambient',80,201),
 ('music-palm-pixels','music','Palm Pixels · Bossa',80,202),
 ('music-cloud-garden','music','Cloud Garden · Dream Pop',100,203),
 ('music-final-answer','music','Final Answer · Quiz',120,204),
 ('music-rubber-duck','music','Rubber Duck Parade · Weird',100,205),
 ('music-satie-lounge','music','Gymnopédie Lounge · Satie',80,206),
 ('music-elise-afterglow','music','Elise Afterglow · Beethoven',80,207)
on conflict(id) do nothing;
