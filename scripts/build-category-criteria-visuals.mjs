import fs from 'node:fs';
import assert from 'node:assert/strict';
const themes={
 airport:{title:'Flughafen',accent:'#9bd8ff',art:'<path d="M-180 95H180V40H-180Z"/><path d="M-115 40V-65H-45V40M-130-65H-30V-100H-130Z"/><path d="M45 10V-120M45-110L-35-40L45-60L125-40ZM45-5L15 22L45 10L75 22Z"/><path d="M-155 65H-115M-85 65H-45M-15 65H25M55 65H95M125 65H155" fill="none" stroke="#182942"/>'},
 forest:{title:'Wald',accent:'#9de7b7',art:'<path d="M-155 70L-95-75L-35 70ZM-70 95L10-125L90 95ZM60 75L125-65L190 75Z"/><path d="M-95 70V120M10 95V135M125 75V120" fill="none"/>'},
 wellbeing:{title:'Lebenserwartung',accent:'#efadd7',art:'<circle cx="-105" cy="-58" r="38"/><path d="M-166 100V28Q-105-30-44 28V100Z"/><path d="M28-52Q58-98 94-57Q135-98 163-52Q190-8 94 68Q0-8 28-52Z"/><path d="M18 117H160" fill="none"/>'},
 skyline:{title:'Architektur',accent:'#b6c7ff',art:'<path d="M-175 125V-30H-90V125M-58 125V-135H38V125M70 125V-75H170V125Z"/><path d="M-15-135V-165M-145 0H-115M-145 40H-115M-145 80H-115M-28-100H8M-28-55H8M-28-10H8M-28 35H8M-28 80H8M100-40H140M100 5H140M100 50H140M100 95H140" fill="none"/>'},
 park:{title:'Nationalparks',accent:'#a4dfc4',art:'<path d="M-190 85L-90-100L20 85L100-125L195 85Z" fill="#334969"/><path d="M-190 95Q-80 5 15 100Q95 25 190 105V145H-190Z"/><path d="M-130 70L-93-18L-56 70ZM100 75L135-5L170 75Z" fill="#155951"/><path d="M-93 70V110M135 75V115" fill="none"/>'},
 football:{title:'Bundesliga',accent:'#c1e5b0',art:'<rect x="-185" y="-118" width="370" height="236" rx="10" fill="#214d48"/><path d="M0-118V118M-185-62H-130V62H-185M185-62H130V62H185" fill="none"/><circle r="50" fill="none"/><circle r="20"/><path d="M-150-85H-165V-100M150 85H165V100" fill="none"/>'},
 birds:{title:'Vögel',accent:'#a2e6c0',art:'<path d="M-180 55 Q-110-110 0-15 Q110-110 180 55 Q100 5 55 65 Q0 105-55 65 Q-100 5-180 55Z"/><path d="M0-15V110M-90 22L-38 48M90 22L38 48" fill="none"/>'},
 observation:{title:'Aussicht',accent:'#e6b7ff',art:'<path d="M-52 100L-30-65H30L52 100Z"/><path d="M-100-65H100V-25H-100ZM-60-95H60V-65H-60Z"/><path d="M0-95V-135M-28 100V15H28V100" fill="none"/><path d="M-170 25Q-150-5-115 8M115 8Q150-5 170 25" fill="none"/>'},
 metro:{title:'U-Bahn',accent:'#98caff',art:'<rect x="-108" y="-110" width="216" height="220" rx="40"/><path d="M-75-72H75V15H-75Z" fill="#102848"/><path d="M0-72V15M-65 130L-100 165M65 130L100 165" fill="none"/><circle cx="-58" cy="62" r="14" fill="#102848"/><circle cx="58" cy="62" r="14" fill="#102848"/><path d="M-32-128H32" fill="none"/>'},
 summit:{title:'Gipfel',accent:'#b2c2ff',art:'<path d="M-190 105L-72-80L-20-20L55-145L195 105Z"/><path d="M15-78L55-145L104-58L66-78L46-60Z" fill="#f4f5ff"/><path d="M-106-27L-72-80L-38-39L-66-52L-80-37Z" fill="#f4f5ff"/>'},
 waterfall:{title:'Wasserfälle',accent:'#91e8f7',art:'<path d="M-180-110H-52V25L-96 110H-180ZM52-110H180V110H96L52 25Z" fill="#214a67"/><path d="M-52-110H52V5Q70 60 115 110H-115Q-70 60-52 5Z"/><path d="M-22-75V40M22-90V55M-150 130Q0 165 150 130" fill="none" stroke="#d3faff"/>'},
 balls:{title:'Spielbälle',accent:'#ffcd9a',art:'<circle r="126"/><path d="M0-126Q-50 0 0 126M-126 0Q0-45 126 0M-90-88Q0 45 90 88M90-88Q0 45-90 88" fill="none" stroke="#463553"/>'},
 car:{title:'Autos',accent:'#9cebd5',art:'<path d="M-180 35L-160-5L-75-65H70L145-5L180 35V85H-180Z"/><path d="M-112-7L-63-42H58L100-7Z" fill="#173249"/><circle cx="-108" cy="82" r="32" fill="#173249"/><circle cx="108" cy="82" r="32" fill="#173249"/><path d="M-160 32H-126M126 32H160" fill="none"/>'},
 film:{title:'Film',accent:'#d1b5ff',art:'<rect x="-150" y="-58" width="300" height="190" rx="14"/><path d="M-150-62L130-133L145-75L-135-4Z" fill="#59618c"/><path d="M-95-76L-66-24M-25-94L4-41M45-112L74-59M115-130L144-77" fill="none"/><path d="M-28-3L55 38L-28 79Z" fill="#28364f"/>'},
 board:{title:'Brettspiele',accent:'#f2c3a7',art:'<path d="M-180 75L0-30L180 75L0 170Z" fill="#3b365e"/><path d="M-140 75L0-6L140 75L0 148Z" fill="none"/><path d="M-35 25L-30-45H30L35 25Z"/><circle cy="-67" r="34"/><path d="M-100 90L0 32L100 90M-70 118L70 35" fill="none" opacity=".45"/>'}
};
for(const [name,t] of Object.entries(themes))for(const kind of ['card','detail']){
 const w=kind==='card'?720:960;
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="540" viewBox="0 0 '+w+' 540" role="img" aria-label="Antwortneutrale Themenillustration: '+t.title+'">\n'+
 '<metadata>Original artwork; CC0-1.0; thematic illustration, not a scaled depiction or answer hint. No third-party photos or logos.</metadata>\n'+
 '<defs><radialGradient id="bg"><stop stop-color="#29395a"/><stop offset="1" stop-color="#0b1226"/></radialGradient><linearGradient id="ink" x2="1" y2="1"><stop stop-color="'+t.accent+'"/><stop offset="1" stop-color="#7162bf"/></linearGradient><filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter></defs>\n'+
 '<rect width="'+w+'" height="540" rx="28" fill="url(#bg)"/><rect x="22" y="22" width="'+(w-44)+'" height="496" rx="22" fill="none" stroke="'+t.accent+'" stroke-opacity=".25" stroke-width="2"/>\n'+
 '<ellipse cx="'+w/2+'" cy="270" rx="225" ry="180" fill="'+t.accent+'" opacity=".07" filter="url(#glow)"/>\n'+
 '<g transform="translate('+w/2+' 257)" fill="url(#ink)" stroke="'+t.accent+'" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">'+t.art+'</g>\n'+
 '<text x="'+w/2+'" y="478" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#edf0ff">'+t.title+'</text>\n</svg>\n';
 const path='assets/visuals/criteria/'+name+'-'+kind+'.svg';
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),svg);else fs.writeFileSync(path,svg);
}
console.log('PASS: 30 deterministic original neutral illustrations, 4:3 cards / 16:9 details');
