"""Canonical content categories, shared by import and content builds."""
import re

def normalize_category(item, field='cat'):
    text = ' '.join(str(item.get(k, '')) for k in ('metric', 'comparison_unit', 'u', 'q', 's', 'source'))
    gaming = item.get(field) == 'FIFA-Ratings' or bool(re.search(r'\b(?:FIFA\s*\d{2}|(?:EA SPORTS\s*)?FC\s*2\d)\b|Basiskarte|ea\.com/games/ea-sports-fc', text, re.I))
    if gaming:
        item[field] = 'Videospiele'
        edition = re.search(r'\b(?:FIFA|FC)\s*\d{2}\b', text, re.I)
        item['subcategory'] = edition.group().upper() if edition else 'EA SPORTS FC & FIFA'
        item.pop('sets', None)
    elif item.get(field) == 'Fußballer':
        item[field] = 'Fußball'
    return item
