/* Normalize legacy selections and questions before they enter a new game. */
function canonicalContentCategory(cat){return cat==='Fußballer'?'Fußball':cat==='FIFA-Ratings'?'Videospiele':cat}
function normalizeContentQuestion(q){
 const text=['metric','u','q','s','source'].map(k=>q[k]||'').join(' ');
 if(q.cat==='FIFA-Ratings'||/\b(?:FIFA\s*\d{2}|(?:EA SPORTS\s*)?FC\s*2\d)\b|Basiskarte|ea\.com\/games\/ea-sports-fc/i.test(text))q.cat='Videospiele';
 else q.cat=canonicalContentCategory(q.cat);
 return q;
}
