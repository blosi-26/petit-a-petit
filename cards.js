// Startpaket: wird nur beim allerersten Start in den Browser-Speicher übernommen.
// Danach können Sie Karten in der App selbst anlegen, ändern und löschen.
const STARTER_CARDS = [
  // Grundwörter
  { fr: 'bonjour', de: 'guten Tag / hallo', category: 'Grundwörter' },
  { fr: 'merci', de: 'danke', category: 'Grundwörter' },
  { fr: "s'il vous plaît", de: 'bitte (förmlich)', category: 'Grundwörter' },
  { fr: 'oui', de: 'ja', category: 'Grundwörter' },
  { fr: 'non', de: 'nein', category: 'Grundwörter' },
  { fr: 'au revoir', de: 'auf Wiedersehen', category: 'Grundwörter' },
  { fr: 'excusez-moi', de: 'entschuldigen Sie', category: 'Grundwörter' },
  { fr: 'je ne comprends pas', de: 'ich verstehe nicht', category: 'Grundwörter' },
  { fr: "aujourd'hui", de: 'heute', category: 'Grundwörter' },
  { fr: 'demain', de: 'morgen', category: 'Grundwörter' },

  // Essen & Trinken
  { fr: 'le pain', de: 'das Brot', category: 'Essen & Trinken' },
  { fr: 'le fromage', de: 'der Käse', category: 'Essen & Trinken' },
  { fr: "l'eau (f)", de: 'das Wasser', category: 'Essen & Trinken' },
  { fr: 'le vin', de: 'der Wein', category: 'Essen & Trinken' },
  { fr: 'la pomme', de: 'der Apfel', category: 'Essen & Trinken' },
  { fr: 'le petit-déjeuner', de: 'das Frühstück', category: 'Essen & Trinken' },
  { fr: "l'addition (f)", de: 'die Rechnung (im Restaurant)', category: 'Essen & Trinken' },
  { fr: 'la viande', de: 'das Fleisch', category: 'Essen & Trinken' },
  { fr: 'le poisson', de: 'der Fisch', category: 'Essen & Trinken' },
  { fr: "un café, s'il vous plaît", de: 'einen Kaffee, bitte', category: 'Essen & Trinken' },

  // Alltag
  { fr: 'la maison', de: 'das Haus', category: 'Alltag' },
  { fr: 'le travail', de: 'die Arbeit', category: 'Alltag' },
  { fr: 'la voiture', de: 'das Auto', category: 'Alltag' },
  { fr: "l'ami / l'amie", de: 'der Freund / die Freundin', category: 'Alltag' },
  { fr: 'le temps', de: 'das Wetter / die Zeit', category: 'Alltag' },
  { fr: 'la semaine', de: 'die Woche', category: 'Alltag' },
  { fr: 'acheter', de: 'kaufen', category: 'Alltag' },
  { fr: 'parler', de: 'sprechen', category: 'Alltag' },
  { fr: 'le téléphone', de: 'das Telefon', category: 'Alltag' },
  { fr: 'la clé', de: 'der Schlüssel', category: 'Alltag' },

  // Reisen
  { fr: 'la gare', de: 'der Bahnhof', category: 'Reisen' },
  { fr: 'le billet', de: 'die Fahrkarte', category: 'Reisen' },
  { fr: "l'hôtel (m)", de: 'das Hotel', category: 'Reisen' },
  { fr: 'la plage', de: 'der Strand', category: 'Reisen' },
  { fr: 'à gauche', de: 'links', category: 'Reisen' },
  { fr: 'à droite', de: 'rechts', category: 'Reisen' },
  { fr: 'tout droit', de: 'geradeaus', category: 'Reisen' },
  { fr: 'Où sont les toilettes ?', de: 'Wo ist die Toilette?', category: 'Reisen' },
  { fr: 'la valise', de: 'der Koffer', category: 'Reisen' },
  { fr: "l'aéroport (m)", de: 'der Flughafen', category: 'Reisen' },

  // Redewendungen
  { fr: 'petit à petit', de: 'nach und nach', category: 'Redewendungen' },
  { fr: 'ça marche', de: 'geht klar / passt', category: 'Redewendungen' },
  { fr: "ce n'est pas grave", de: 'das ist nicht schlimm', category: 'Redewendungen' },
  { fr: "c'est la vie", de: 'so ist das Leben', category: 'Redewendungen' },
  { fr: 'tant pis', de: 'schade / Pech gehabt', category: 'Redewendungen' },
  { fr: 'avoir la flemme', de: 'keine Lust haben', category: 'Redewendungen' },
  { fr: 'avoir le cafard', de: 'Trübsal blasen', category: 'Redewendungen' },
  { fr: 'poser un lapin à qn', de: 'jemanden versetzen', category: 'Redewendungen' },
  { fr: 'coûter les yeux de la tête', de: 'ein Vermögen kosten', category: 'Redewendungen' },
  { fr: 'il pleut des cordes', de: 'es regnet in Strömen', category: 'Redewendungen' },
];
