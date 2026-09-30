alter table ml_private.daily_answers drop constraint daily_answers_day_user_id_fkey;
alter table ml_private.daily_questions drop constraint daily_questions_pkey;
alter table ml_private.daily_attempts drop constraint daily_attempts_pkey;
alter table ml_private.daily_answers drop constraint daily_answers_pkey;
alter table ml_private.daily_answers drop constraint daily_answers_choice_check;
alter table ml_private.daily_attempts drop constraint daily_attempts_score_check;
alter table ml_private.daily_catalogue add column game text not null default 'moreless' check(game in ('moreless','estimate','facts'));
alter table ml_private.daily_questions add column game text not null default 'moreless' check(game in ('moreless','estimate','facts'));
alter table ml_private.daily_attempts add column game text not null default 'moreless' check(game in ('moreless','estimate','facts'));
alter table ml_private.daily_answers add column game text not null default 'moreless' check(game in ('moreless','estimate','facts'));
alter table ml_private.daily_answers add column points integer not null default 0;
alter table ml_private.daily_attempts add constraint daily_score_range check(score between 0 and 1000);
alter table ml_private.daily_questions add primary key(day,game,no);
alter table ml_private.daily_attempts add primary key(day,user_id,game);
alter table ml_private.daily_answers add primary key(day,user_id,game,no);
alter table ml_private.daily_answers add foreign key(day,user_id,game) references ml_private.daily_attempts(day,user_id,game) on delete cascade;
insert into ml_private.daily_catalogue(id,game,payload) values
('ca6620b45b9b332ada6588c1','estimate','{"q":"Wie hoch ist der Burj Khalifa?","a":828,"u":"m"}'::jsonb),
('3d5470d3b121758594d82a05','estimate','{"q":"Wie groß ist die mittlere Entfernung Erde–Mond ungefähr?","a":384400,"u":"km"}'::jsonb),
('332ddf7c8ee504019f9ca2dc','estimate','{"q":"Wie lang ist ein Marathon?","a":42.195,"u":"km"}'::jsonb),
('cc7acaee6359ce2998c156f7','estimate','{"q":"Wie hoch ist der Mount Everest ungefähr?","a":8849,"u":"m"}'::jsonb),
('5a8a565a7276d130315e4a69','estimate','{"q":"Wie groß ist der Erddurchmesser am Äquator?","a":12756,"u":"km"}'::jsonb),
('756fd6a7088a9924b14a527f','estimate','{"q":"Wie schnell ist Licht im Vakuum?","a":299792458,"u":"m/s"}'::jsonb),
('a02391d3ca59a1de14e7d6b4','estimate','{"q":"Wie viele Tasten hat ein Standard-Klavier?","a":88,"u":"Tasten"}'::jsonb),
('c05572ef030227679532a89d','estimate','{"q":"Wie hoch ist der Eiffelturm inklusive Antenne ungefähr?","a":330,"u":"m"}'::jsonb),
('f6f055ab0175450589e08110','estimate','{"q":"Wie viele Felder hat ein Schachbrett?","a":64,"u":"Felder"}'::jsonb),
('f07e91315af164df427f76cf','estimate','{"q":"Wie groß ist Jupiters Durchmesser?","a":142984,"u":"km"}'::jsonb),
('b981b41a1316822202c6b421','estimate','{"q":"Wie groß ist Saturns Durchmesser?","a":120536,"u":"km"}'::jsonb),
('7a65f2362e75b99ce030eb87','estimate','{"q":"Wie groß ist Neptuns Durchmesser?","a":49528,"u":"km"}'::jsonb),
('7f2d9cbe8ed2f0818e36b27c','estimate','{"q":"Wie groß ist der Durchmesser der Venus?","a":12104,"u":"km"}'::jsonb),
('d8102034771021f69e8606e2','estimate','{"q":"Wie groß ist der Durchmesser des Mars?","a":6792,"u":"km"}'::jsonb),
('371e45fa4b29cbc36190521c','estimate','{"q":"Wie stark ist die Schwerkraft auf dem Mond ungefähr?","a":1.6,"u":"m/s²"}'::jsonb),
('d37d45ee60828905a570909e','estimate','{"q":"Wie lange dauert ein Tag auf Jupiter ungefähr?","a":9.9,"u":"Stunden"}'::jsonb),
('8234e40d8b366218225d1724','estimate','{"q":"Wie weit ist die Erde im Mittel von der Sonne entfernt?","a":149.7,"u":"Mio. km"}'::jsonb),
('7cbbe5ea54b2dd7522be0bdc','estimate','{"q":"Wie weit ist Neptun im Mittel von der Sonne entfernt?","a":4.5,"u":"Mrd. km"}'::jsonb),
('edb2960df4d186ac3ac0bdfa','estimate','{"q":"Wie groß ist die Fläche des Atlantiks ungefähr?","a":106460000,"u":"km²"}'::jsonb),
('d0b93e0df3d89125629aa1fa','estimate','{"q":"Wie groß ist die Fläche des Pazifiks ungefähr?","a":155000000,"u":"km²"}'::jsonb),
('ea9a2c5b5de6109dabe0ac6c','estimate','{"q":"Wie tief ist der Pazifik im Durchschnitt ungefähr?","a":4000,"u":"m"}'::jsonb),
('ec4371a44bc8881b0c954140','estimate','{"q":"Wie viel Prozent der Erdoberfläche bedeckt der Ozean ungefähr?","a":71,"u":"%"}'::jsonb),
('1ca7d2d94580cd40fd270240','estimate','{"q":"Wie viel Prozent des Wassers der Erde befinden sich ungefähr im Ozean?","a":97,"u":"%"}'::jsonb),
('1f87925cc51aa0248cd4b9ac','estimate','{"q":"Wie viele Menschen lebten 2024 laut CIA-Schätzung in Deutschland?","a":84119100,"u":"Menschen"}'::jsonb),
('9deea4ff65621465bdf49db8','estimate','{"q":"Wie viele Menschen lebten 2024 laut CIA-Schätzung in Frankreich?","a":68374591,"u":"Menschen"}'::jsonb),
('2dbdf5af1cf3d84945760b28','estimate','{"q":"Wie viele Menschen lebten 2024 laut CIA-Schätzung in Italien?","a":60964931,"u":"Menschen"}'::jsonb),
('cf92c01cf333ebafb12c4615','estimate','{"q":"Wie viele Menschen lebten 2024 laut CIA-Schätzung in Spanien?","a":47280433,"u":"Menschen"}'::jsonb),
('796776ef3d81541879f5a172','estimate','{"q":"Wie viele Menschen lebten 2024 laut CIA-Schätzung in Kanada?","a":38794813,"u":"Menschen"}'::jsonb),
('b34799b7e64c6956e65f2b58','estimate','{"q":"Wie viele Sekunden hat ein Tag?","a":86400,"u":"Sekunden"}'::jsonb),
('7dbdc279eebe8c30ad892460','estimate','{"q":"Wie viele Minuten hat eine Woche?","a":10080,"u":"Minuten"}'::jsonb),
('67b59f9cabeeea7db44d3e87','estimate','{"q":"Wie viele Zentimeter entsprechen einem Kilometer?","a":100000,"u":"cm"}'::jsonb),
('44b837d1277115436f5fe5ad','estimate','{"q":"Wie viele Meter pro Sekunde ist die Lichtgeschwindigkeit exakt?","a":299792458,"u":"m/s"}'::jsonb),
('cb3ea6ddef5f805957820d2c','estimate','{"q":"Wie viele definierende Konstanten hat das moderne SI?","a":7,"u":"Konstanten"}'::jsonb),
('569930e9f5d3eea56d8906bd','estimate','{"q":"Wie viele Ozeane werden heute meist benannt?","a":5,"u":"Ozeane"}'::jsonb),
('bb8cb34fa729ab92c181ca0e','estimate','{"q":"Wie viele Planeten hat das Sonnensystem?","a":8,"u":"Planeten"}'::jsonb),
('905c1bdf2b95e6ddecfa7a75','estimate','{"q":"Wie viele Häuser enthält die klassische Monopoly-Ausstattung laut Hasbro?","a":32,"u":"Häuser"}'::jsonb),
('fad8292f74f3620abe2c8857','estimate','{"q":"Wie viele Hotels enthält die klassische Monopoly-Ausstattung laut Hasbro?","a":12,"u":"Hotels"}'::jsonb),
('9cd52d3ef887b67b82493331','estimate','{"q":"Wie viele Besitzrechtkarten enthält Hasbros Monopoly Game C1009?","a":28,"u":"Karten"}'::jsonb),
('d9c79998f2fa34e2a84acc3e','estimate','{"q":"Wie viele Chance-Karten enthält Hasbros Monopoly Game C1009?","a":16,"u":"Karten"}'::jsonb),
('db65e5b829dc6833b06babf3','estimate','{"q":"Wie viele Gemeinschaftskarten enthält Hasbros Monopoly Game C1009?","a":16,"u":"Karten"}'::jsonb),
('867534ae095864aacf94e6c9','estimate','{"q":"Wie viele Teile hat das LEGO Icons Eiffelturm-Set 10307?","a":10001,"u":"Teile"}'::jsonb),
('bf041c02a51f0576fc725ebb','estimate','{"q":"Wie hoch ist das LEGO Eiffelturm-Set 10307 ungefähr?","a":149,"u":"cm"}'::jsonb),
('338d217829ce75ad4c02d9f2','estimate','{"q":"Wie breit ist das LEGO Eiffelturm-Set 10307?","a":57,"u":"cm"}'::jsonb),
('a31ee640f18db45cd7e5664b','estimate','{"q":"In welchem Jahr erschien das LEGO Eiffelturm-Set 10307?","a":2022,"u":"Jahr"}'::jsonb),
('97770e09d6074c4684b98234','estimate','{"q":"Wie hoch war Top Thrill 2 bei seinem Guinness-Rekord 2024?","a":128,"u":"m"}'::jsonb),
('42dbf4de6dafd4ed3feb22d4','facts','{"s":"Orcas gehören zur Familie der Delfine.","a":true,"e":"Orcas sind die größten Mitglieder der Delfinfamilie.","cat":"Tierwelt","difficulty":"easy","source":"https://www.fisheries.noaa.gov/feature-story/11-cool-facts-about-whales-dolphins-and-porpoises"}'::jsonb),
('4ee20a778c5577a0e669a6c0','facts','{"s":"Der Blauwal ist ein Fisch.","a":false,"e":"Blauwale sind Säugetiere und atmen Luft.","cat":"Tierwelt","difficulty":"easy","source":"https://www.fisheries.noaa.gov/species/blue-whale"}'::jsonb),
('d2d1e9115ba7797bc4cb2702','facts','{"s":"Quallen besitzen ein Herz.","a":false,"e":"Quallen haben weder Herz noch Blut.","cat":"Tierwelt","difficulty":"easy","source":"https://oceanservice.noaa.gov/facts/jellyfish.html"}'::jsonb),
('e9891b337229b89d9174b59b','facts','{"s":"Flamingos bekommen ihre rosa Farbe durch die Nahrung.","a":true,"e":"Pigmente aus Nahrung wie Algen und Krebstieren färben ihr Gefieder.","cat":"Tierwelt","difficulty":"easy","source":"https://nationalzoo.si.edu/animals/american-flamingo"}'::jsonb),
('b0590414cf4b8c7b3372d80a','facts','{"s":"Korallen sind Pflanzen.","a":false,"e":"Korallen sind Tiere; viele leben mit Algen in Symbiose.","cat":"Tierwelt","difficulty":"easy","source":"https://oceanservice.noaa.gov/facts/coral.html"}'::jsonb),
('0c004c0a140688920eab66be','facts','{"s":"Der Eiffelturm wurde für die Weltausstellung 1889 erbaut.","a":true,"e":"Die Pariser Weltausstellung von 1889 war der Anlass für seinen Bau.","cat":"Bauwerke","difficulty":"easy","source":"https://www.toureiffel.paris/de/monument/zahlen"}'::jsonb),
('fb3aa3a95511a2e2db526726','facts','{"s":"Die Außenhaut der Freiheitsstatue besteht aus Gold.","a":false,"e":"Ihre Außenhaut besteht aus Kupfer und wurde durch Oxidation grün.","cat":"Bauwerke","difficulty":"easy","source":"https://home.nps.gov/stli/learn/statue-of-liberty-facts.htm"}'::jsonb),
('4158c79dae352d4f39ce201a','facts','{"s":"Der Mars hat zwei Monde.","a":true,"e":"Sie heißen Phobos und Deimos.","cat":"Weltraum","difficulty":"easy","source":"https://science.nasa.gov/mars/facts/"}'::jsonb),
('bf7bef4fa8b4a5fe27e58a9e','facts','{"s":"Der Mars besitzt ein Ringsystem wie der Saturn.","a":false,"e":"Der Mars hat derzeit keine Ringe.","cat":"Weltraum","difficulty":"easy","source":"https://science.nasa.gov/mars/facts/"}'::jsonb),
('990bfb0866ebc7dc93c5985a','facts','{"s":"Die Venus ist der heißeste Planet unseres Sonnensystems.","a":true,"e":"Ihre dichte Atmosphäre hält Wärme besonders stark zurück.","cat":"Weltraum","difficulty":"easy","source":"https://science.nasa.gov/venus/venus-facts/"}'::jsonb),
('8a6cd8a1d275793fc4152c5b','facts','{"s":"Jupiter ist der fünfte Planet von der Sonne aus.","a":true,"e":"Vor Jupiter liegen Merkur, Venus, Erde und Mars.","cat":"Weltraum","difficulty":"easy","source":"https://science.nasa.gov/jupiter/jupiter-facts/"}'::jsonb),
('3fb1e0e62725e8f70d9340a5','facts','{"s":"Delfine zerkauen gefangene Fische mit ihren Zähnen.","a":false,"e":"Sie halten Beute mit den Zähnen fest und schlucken Fische meist ganz.","cat":"Tierwelt","difficulty":"easy","source":"https://www.fisheries.noaa.gov/feature-story/11-cool-facts-about-whales-dolphins-and-porpoises"}'::jsonb),
('6c106d3a9c9657e4fb74489e','facts','{"s":"Riesenpandas ernähren sich überwiegend von Bambus.","a":true,"e":"Bambus macht den größten Teil ihrer Nahrung aus.","cat":"Tierwelt","difficulty":"easy","source":"https://nationalzoo.si.edu/animals/giant-panda"}'::jsonb),
('1d3980ca750511bc36ce9632','facts','{"s":"Die erste ILO-Konvention legte eine 60-Stunden-Woche als Ziel fest.","a":false,"e":"Die Arbeitszeitkonvention von 1919 sah acht Stunden pro Tag und 48 pro Woche vor.","cat":"Arbeitswelt","difficulty":"easy","source":"https://www.ilo.org/resource/article/convention-no-1-landmark-workers%E2%80%99-rights"}'::jsonb),
('a1986f94f4fdc2357fdcffac','facts','{"s":"Die Freiheitsstatue ist mit Sockel rund 93 Meter hoch.","a":true,"e":"Von Boden bis Fackel misst das Monument laut National Park Service rund 92,99 Meter.","cat":"Bauwerke","difficulty":"medium","source":"https://home.nps.gov/stli/learn/statue-of-liberty-facts.htm"}'::jsonb),
('b58cb545f5cbbd7f3355dce6','facts','{"s":"Der Eiffelturm war bei seiner Eröffnung bereits 330 Meter hoch.","a":false,"e":"Ohne Antenne war er damals 312 Meter hoch; heute misst er 330 Meter.","cat":"Bauwerke","difficulty":"medium","source":"https://www.toureiffel.paris/de/monument/zahlen"}'::jsonb),
('ca0e24914b6d47eb476c97b0','facts','{"s":"Die Weltausstellung von 1889 erinnerte an 100 Jahre Französische Revolution.","a":true,"e":"Der Eiffelturm wurde für diese Jubiläumsausstellung erbaut.","cat":"Geschichte","difficulty":"medium","source":"https://www.toureiffel.paris/de/monument/zahlen"}'::jsonb),
('974cb32e768bde3aa89f7157','facts','{"s":"Ein Tag auf Jupiter dauert ungefähr 24 Stunden.","a":false,"e":"Jupiter dreht sich in rund 9,9 Stunden um seine Achse.","cat":"Weltraum","difficulty":"medium","source":"https://science.nasa.gov/jupiter/jupiter-facts/"}'::jsonb),
('5ac0e7193e77b5f8246d5031','facts','{"s":"Jupiters Mond Ganymed ist größer als der Planet Merkur.","a":true,"e":"Ganymed ist der größte Mond unseres Sonnensystems.","cat":"Weltraum","difficulty":"medium","source":"https://science.nasa.gov/jupiter/jupiter-facts/"}'::jsonb),
('322aacd609b554a30f8652f2','facts','{"s":"Die Venus hat einen eigenen Mond.","a":false,"e":"Venus und Merkur sind die beiden Planeten ohne eigene Monde.","cat":"Weltraum","difficulty":"medium","source":"https://science.nasa.gov/venus/venus-facts/"}'::jsonb),
('747e02b9957c8a5e611bbb2a','facts','{"s":"Phobos ist größer als Deimos.","a":true,"e":"Phobos ist der größere der zwei Marsmonde.","cat":"Weltraum","difficulty":"medium","source":"https://science.nasa.gov/mars/facts/"}'::jsonb),
('4c1e169665232943a2df0d6d','facts','{"s":"Flamingoküken schlüpfen bereits mit leuchtend rosa Federn.","a":false,"e":"Ihre Daunen sind zunächst weißgrau; die rosa Färbung kommt später.","cat":"Tierwelt","difficulty":"medium","source":"https://nationalzoo.si.edu/animals/news/why-are-flamingos-pink-and-other-flamingo-facts"}'::jsonb),
('9105e3ea57851e04f74eac0b','facts','{"s":"Der „Daumen“ des Riesenpandas entsteht aus einem vergrößerten Handwurzelknochen.","a":true,"e":"Dieser sogenannte Pseudodaumen hilft beim Greifen von Bambus.","cat":"Tierwelt","difficulty":"medium","source":"https://nationalzoo.si.edu/animals/giant-panda"}'::jsonb),
('4a648db19c970e05329b8291','facts','{"s":"Eine gebleichte Koralle ist immer bereits tot.","a":false,"e":"Korallen können eine Bleiche überleben, wenn sich die Bedingungen rechtzeitig verbessern.","cat":"Tierwelt","difficulty":"medium","source":"https://oceanservice.noaa.gov/facts/coral_bleach.html"}'::jsonb),
('86aa49e884b61a3fb9e8b650','facts','{"s":"Die erste ILO-Konvention von 1919 befasste sich mit Arbeitszeit.","a":true,"e":"Sie griff den Achtstundentag und die 48-Stunden-Woche in der Industrie auf.","cat":"Arbeitswelt","difficulty":"medium","source":"https://www.ilo.org/resource/article/convention-no-1-landmark-workers%E2%80%99-rights"}'::jsonb),
('22868301c4318a57ca7a89a0','facts','{"s":"Die Freiheitsstatue hält ihre Fackel in der linken Hand.","a":false,"e":"Die Fackel ist in der rechten Hand; links trägt sie eine Tafel.","cat":"Bauwerke","difficulty":"medium","source":"https://home.nps.gov/stli/learn/statue-of-liberty-facts.htm"}'::jsonb),
('b72180d952d407b82ae7c011','facts','{"s":"Quallen bestehen zu ungefähr 95 Prozent aus Wasser.","a":true,"e":"NOAA beschreibt nur etwa fünf Prozent ihres Körpers als feste Substanz.","cat":"Tierwelt","difficulty":"medium","source":"https://oceanservice.noaa.gov/facts/jellyfish.html"}'::jsonb),
('04e3ebcf607347b7c525e49e','facts','{"s":"Die zweite Etage des Eiffelturms liegt auf 276 Metern Höhe.","a":false,"e":"Sie liegt auf 115 Metern; 276 Meter ist die Höhe der dritten Etage.","cat":"Bauwerke","difficulty":"medium","source":"https://www.toureiffel.paris/de/monument/zahlen"}'::jsonb),
('bb3c8894e52eb5c02b90611f','facts','{"s":"Bis zur Krone der Freiheitsstatue führen 377 Stufen.","a":true,"e":"Die Angabe zählt den Weg vom Boden bis zur Krone.","cat":"Bauwerke","difficulty":"hard","source":"https://home.nps.gov/stli/learn/statue-of-liberty-facts.htm"}'::jsonb),
('eb67cc98f7fc918dcd382f9b','facts','{"s":"Gustave Eiffel entwarf den Sockel der Freiheitsstatue.","a":false,"e":"Den Sockel entwarf Richard Morris Hunt; Eiffel wirkte an der inneren Tragstruktur der Statue mit.","cat":"Bauwerke","difficulty":"hard","source":"https://home.nps.gov/stli/learn/statue-of-liberty-facts.htm"}'::jsonb),
('8ef124e7243a4b8fa549a3ca','facts','{"s":"Im Eiffelturm stecken etwa 2,5 Millionen Nieten.","a":true,"e":"Die offizielle Turmseite nennt 2.500.000 verarbeitete Nieten.","cat":"Bauwerke","difficulty":"hard","source":"https://www.toureiffel.paris/de/monument/zahlen"}'::jsonb),
('3a97c906fa29a2ebf8aaca44','facts','{"s":"Der Luftdruck an der Venusoberfläche ist etwa neunmal so hoch wie auf der Erde.","a":false,"e":"Er beträgt ungefähr das 93-Fache des Luftdrucks auf Meereshöhe der Erde.","cat":"Weltraum","difficulty":"hard","source":"https://science.nasa.gov/venus/venus-facts/"}'::jsonb),
('783461c213dae5a85afbc7f2','facts','{"s":"Jupiters Äquatorebene ist um etwa drei Grad gegen seine Bahnebene geneigt.","a":true,"e":"NASA nennt eine Achsneigung von ungefähr drei Grad.","cat":"Weltraum","difficulty":"hard","source":"https://science.nasa.gov/jupiter/jupiter-facts/"}'::jsonb),
('28beb8657bb140f318dff9e2','facts','{"s":"Jupiters Ringe wurden erstmals 1969 von Apollo 11 fotografiert.","a":false,"e":"NASA entdeckte Jupiters Ringsystem 1979 mit Voyager 1.","cat":"Weltraum","difficulty":"hard","source":"https://science.nasa.gov/jupiter/jupiter-facts/"}'::jsonb),
('f58bb320f826a76cf3a24823','facts','{"s":"Das Mars-Canyonsystem Valles Marineris ist ungefähr 3.870 Kilometer lang.","a":true,"e":"NASA gibt seine Länge mit etwa 2.400 Meilen beziehungsweise 3.870 Kilometern an.","cat":"Weltraum","difficulty":"hard","source":"https://science.nasa.gov/mars/facts/"}'::jsonb),
('cee73f1bf3f0871456cbb5e6','facts','{"s":"Der Marsmond Phobos entfernt sich langsam vom Mars.","a":false,"e":"Phobos nähert sich dem Mars und könnte in ferner Zukunft zerbrechen oder einschlagen.","cat":"Weltraum","difficulty":"hard","source":"https://science.nasa.gov/mars/facts/"}'::jsonb),
('560cb549fdd60c85926deba3','facts','{"s":"Bei Nacktmullen bekommt in einer Kolonie normalerweise nur ein Weibchen Nachwuchs.","a":true,"e":"Dieses Weibchen wird Königin genannt.","cat":"Tierwelt","difficulty":"hard","source":"https://nationalzoo.si.edu/animals/naked-mole-rat"}'::jsonb),
('322c78b2a1b3fa128ac44f19','facts','{"s":"Der Pseudodaumen des Riesenpandas ist ein zusätzlicher echter Finger.","a":false,"e":"Er ist ein umgebildeter Handwurzelknochen und kein zusätzlicher Finger.","cat":"Tierwelt","difficulty":"hard","source":"https://nationalzoo.si.edu/animals/giant-panda"}'::jsonb),
('f9cf55a56e387344e9911f72','facts','{"s":"1919 verabschiedete die ILO eine Mutterschutzkonvention mit der Nummer 3.","a":true,"e":"Die Mutterschutzkonvention wurde auf der ersten Internationalen Arbeitskonferenz beschlossen.","cat":"Arbeitswelt","difficulty":"hard","source":"https://www.ilo.org/meetings-and-events/100-years-maternity-protection-transforming-leave-and-care-policies-all"}'::jsonb),
('ea7866a3f82f5e5486ca0e1d','facts','{"s":"Die erste ILO-Arbeitszeitkonvention sah eine 40-Stunden-Woche für die Industrie vor.","a":false,"e":"Sie bezog sich auf acht Stunden täglich und 48 Stunden wöchentlich.","cat":"Arbeitswelt","difficulty":"hard","source":"https://www.ilo.org/resource/article/convention-no-1-landmark-workers%E2%80%99-rights"}'::jsonb),
('8fb7947dbe01cdb44e33c3a8','facts','{"s":"Quallen haben kein Gehirn, aber ein einfaches Nervennetz.","a":true,"e":"Ihr Nervennetz nimmt Reize wie Licht und Berührung wahr.","cat":"Tierwelt","difficulty":"hard","source":"https://oceanservice.noaa.gov/facts/jellyfish.html"}'::jsonb),
('74ef20ce171c920b846acb8e','facts','{"s":"Das Herz eines Blauwals wiegt weniger als zehn Kilogramm.","a":false,"e":"NOAA nennt für das Herz eines Blauwals mehr als 1.000 Pfund.","cat":"Tierwelt","difficulty":"hard","source":"https://www.fisheries.noaa.gov/feature-story/11-cool-facts-about-whales-dolphins-and-porpoises"}'::jsonb);
create or replace function ml_private.daily_game_impl(p_action text,p_name text,p_day date,p_question integer,p_choice text,p_offset integer,p_game text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 g text:=coalesce(p_game,'moreless'); points integer; estimate_value numeric; maxscore integer;
 u uuid:=auth.uid(); d date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;
 a ml_private.daily_attempts; q jsonb; good boolean; reveal jsonb; board jsonb; question jsonb;
 total integer; my_rank integer; my_total integer; off integer:=greatest(0,coalesce(p_offset,0));
begin
 if u is null then raise exception 'Authentication required'; end if;
 if g not in ('moreless','estimate','facts','overall') then raise exception 'Invalid daily game';end if;
 if g='overall' and p_action<>'home' then raise exception 'Choose a game first';end if;
 maxscore:=case when g='estimate' then 1000 when g='overall' then 300 else 10 end;
 if p_action is null or p_action not in ('home','start','answer') then raise exception 'Invalid daily action'; end if;
 if p_action='answer' and p_day is distinct from d then raise exception 'Ein neuer Daily-Tag hat begonnen. Bitte die Tagesseite neu laden.'; end if;
 if g<>'overall' and not exists(select 1 from ml_private.daily_questions where day=d and game=g) then
  perform pg_advisory_xact_lock(81851+case g when 'estimate' then 1 when 'facts' then 2 else 0 end,(d-date '2020-01-01')::integer);
  if not exists(select 1 from ml_private.daily_questions where day=d and game=g) then
   insert into ml_private.daily_questions(day,game,no,payload)
   select d,g,row_number() over(order by md5(d::text||id),id)::int,payload from
    (select id,payload from ml_private.daily_catalogue where game=g order by md5(d::text||id),id limit 10) pool;
  end if;
 end if;
 if g<>'overall' and (select count(*) from ml_private.daily_questions where day=d and game=g)<>10 then raise exception 'Daily questions unavailable'; end if;
 if p_action='start' then
  if p_name is null or char_length(btrim(p_name)) not between 1 and 24 then raise exception 'Bitte einen Namen mit 1–24 Zeichen eingeben.'; end if;
  insert into ml_private.daily_attempts(day,user_id,game,name) values(d,u,g,coalesce((select name from ml_private.daily_attempts where day=d and user_id=u limit 1),btrim(p_name))) on conflict(day,user_id,game) do nothing;
 end if;
 select * into a from ml_private.daily_attempts where day=d and game=g and user_id=u for update;
 if p_action='answer' then
  if a.user_id is null then raise exception 'Daily zuerst starten'; end if;
  if p_question is null or p_question not between 1 and 10 or p_choice is null or (g='moreless' and p_choice not in ('a','b')) or (g='facts' and p_choice not in ('true','false')) then raise exception 'Invalid daily answer'; end if;
  if p_question>a.answered+1 then raise exception 'Answer questions in order'; end if;
  select payload into q from ml_private.daily_questions where day=d and game=g and no=p_question;
  if p_question=a.answered+1 then
   if g='estimate' then
    if char_length(p_choice)>30 or p_choice !~ '^[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' then raise exception 'Bitte eine gültige positive Schätzung eingeben.';end if;
    estimate_value:=p_choice::numeric;
    if estimate_value>1e15 then raise exception 'Schätzung zu groß';end if;
    points:=round(100*greatest(0,1-abs(estimate_value-(q->>'a')::numeric)/greatest(abs((q->>'a')::numeric),1)))::int;
    good:=points>0;
   else
    good:=case when g='facts' then (p_choice::boolean)=(q->>'a')::boolean else (p_choice='a')=((q->>'lv')::numeric>(q->>'rv')::numeric) end;
    points:=case when good then 1 else 0 end;
   end if;
   insert into ml_private.daily_answers(day,user_id,game,no,choice,correct,points) values(d,u,g,p_question,p_choice,good,points);
   update ml_private.daily_attempts set answered=p_question,score=score+points,completed_at=case when p_question=10 then clock_timestamp() else null end where day=d and game=g and user_id=u returning * into a;
  else
   select choice,correct,daily_answers.points into p_choice,good,points from ml_private.daily_answers where day=d and game=g and user_id=u and no=p_question;
  end if;
  reveal:=jsonb_build_object('no',p_question,'choice',p_choice,'correct',good,'points',points,'left_value',q->'lv','right_value',q->'rv','unit',q->>'u','correct_name',case when g='moreless' then case when (q->>'lv')::numeric>(q->>'rv')::numeric then q->>'l' else q->>'r' end else null end,'answer',q->'a','explanation',q->>'e','source',q->>'source');
 end if;
 if a.user_id is not null and a.answered<10 then
  select jsonb_build_object('no',no,'left_name',payload->>'l','right_name',payload->>'r','left_value',payload->'lv','unit',payload->>'u','category',coalesce(payload->>'cat','Schätzduell'),'prompt',coalesce(payload->>'q',payload->>'s')) into question from ml_private.daily_questions where day=d and game=g and no=a.answered+1;
 end if;
 with scores as (
  select user_id,max(name) as name,case when g='overall' then sum(round(score::numeric/(case game when 'estimate' then 1000 else 10 end)*100))::integer else max(score) end as score,max(completed_at) as completed_at
  from ml_private.daily_attempts where day=d and completed_at is not null and (g='overall' or game=g) group by user_id
 ), ranked as (select *,dense_rank() over(order by score desc) as rank from scores), paged as (select * from ranked order by score desc,completed_at,user_id limit 50 offset off)
 select (select count(*) from scores),coalesce(jsonb_agg(jsonb_build_object('name',name,'score',score,'rank',rank,'mine',user_id=u) order by score desc,completed_at,user_id),'[]'::jsonb),(select rank from ranked where user_id=u),(select score from scores where user_id=u)
 into total,board,my_rank,my_total from paged;
 return jsonb_build_object('game',g,'max_score',maxscore,'my_rank',my_rank,'my_score',my_total,'day',d,'total',total,'offset',off,'leaderboard',board,'question',question,'reveal',reveal,'attempt',case when a.user_id is null then null else jsonb_build_object('name',a.name,'answered',a.answered,'score',a.score,'complete',a.completed_at is not null,'rank',my_rank) end);
end $$;

create or replace function public.ml_daily_game(p_action text,p_name text default null,p_day date default null,p_question integer default null,p_choice text default null,p_offset integer default 0,p_game text default 'moreless')
returns jsonb language sql security invoker set search_path='' as $$ select ml_private.daily_game_impl(p_action,p_name,p_day,p_question,p_choice,p_offset,p_game); $$;
create or replace function ml_private.daily_impl(p_action text,p_name text,p_day date,p_question integer,p_choice text,p_offset integer)
returns jsonb language sql security invoker set search_path='' as $$ select ml_private.daily_game_impl(p_action,p_name,p_day,p_question,p_choice,p_offset,'moreless'); $$;
revoke all on function ml_private.daily_game_impl(text,text,date,integer,text,integer,text),public.ml_daily_game(text,text,date,integer,text,integer,text) from public,anon;
grant execute on function ml_private.daily_game_impl(text,text,date,integer,text,integer,text),public.ml_daily_game(text,text,date,integer,text,integer,text) to authenticated;
