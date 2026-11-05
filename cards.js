// Die Lern-Stapel. Ein neuer Stapel (z. B. Spanisch) = einfach einen weiteren Eintrag ergänzen.
// Die Startkarten werden nur einmal übernommen – beim ersten Öffnen des Stapels.
// Danach verwalten Sie die Karten in der App selbst.
const DECKS = [
  {
    id: 'fr',
    name: 'Französisch',
    flag: '🇫🇷',
    lang: 'fr',                      // Sprache für die Sprachausgabe
    voiceLangs: ['fr-fr'],           // bevorzugte Stimmen, der Reihe nach
    sample: 'Bonjour !',             // Hörprobe beim Einschalten von "automatisch vorlesen"
    abbreviations: { qn: "quelqu'un" }, // Abkürzungen, die ausgeschrieben vorgelesen werden
    praise: ['Parfait !', 'Très bien !', 'Pas mal !'],
    importFile: 'vokabeln_franzoesisch.csv', // optionale Wortliste im Repo
    importCategory: 'Duolingo',
    importReversed: true,            // Duolingo listet die neuesten Wörter zuerst
    cards: [
      // Grundwörter
      { front: 'bonjour', back: 'guten Tag / hallo', category: 'Grundwörter' },
      { front: 'merci', back: 'danke', category: 'Grundwörter' },
      { front: "s'il vous plaît", back: 'bitte (förmlich)', category: 'Grundwörter' },
      { front: 'oui', back: 'ja', category: 'Grundwörter' },
      { front: 'non', back: 'nein', category: 'Grundwörter' },
      { front: 'au revoir', back: 'auf Wiedersehen', category: 'Grundwörter' },
      { front: 'excusez-moi', back: 'entschuldigen Sie', category: 'Grundwörter' },
      { front: 'je ne comprends pas', back: 'ich verstehe nicht', category: 'Grundwörter' },
      { front: "aujourd'hui", back: 'heute', category: 'Grundwörter' },
      { front: 'demain', back: 'morgen', category: 'Grundwörter' },

      // Essen & Trinken
      { front: 'le pain', back: 'das Brot', category: 'Essen & Trinken' },
      { front: 'le fromage', back: 'der Käse', category: 'Essen & Trinken' },
      { front: "l'eau (f)", back: 'das Wasser', category: 'Essen & Trinken' },
      { front: 'le vin', back: 'der Wein', category: 'Essen & Trinken' },
      { front: 'la pomme', back: 'der Apfel', category: 'Essen & Trinken' },
      { front: 'le petit-déjeuner', back: 'das Frühstück', category: 'Essen & Trinken' },
      { front: "l'addition (f)", back: 'die Rechnung (im Restaurant)', category: 'Essen & Trinken' },
      { front: 'la viande', back: 'das Fleisch', category: 'Essen & Trinken' },
      { front: 'le poisson', back: 'der Fisch', category: 'Essen & Trinken' },
      { front: "un café, s'il vous plaît", back: 'einen Kaffee, bitte', category: 'Essen & Trinken' },

      // Alltag
      { front: 'la maison', back: 'das Haus', category: 'Alltag' },
      { front: 'le travail', back: 'die Arbeit', category: 'Alltag' },
      { front: 'la voiture', back: 'das Auto', category: 'Alltag' },
      { front: "l'ami / l'amie", back: 'der Freund / die Freundin', category: 'Alltag' },
      { front: 'le temps', back: 'das Wetter / die Zeit', category: 'Alltag' },
      { front: 'la semaine', back: 'die Woche', category: 'Alltag' },
      { front: 'acheter', back: 'kaufen', category: 'Alltag' },
      { front: 'parler', back: 'sprechen', category: 'Alltag' },
      { front: 'le téléphone', back: 'das Telefon', category: 'Alltag' },
      { front: 'la clé', back: 'der Schlüssel', category: 'Alltag' },

      // Reisen
      { front: 'la gare', back: 'der Bahnhof', category: 'Reisen' },
      { front: 'le billet', back: 'die Fahrkarte', category: 'Reisen' },
      { front: "l'hôtel (m)", back: 'das Hotel', category: 'Reisen' },
      { front: 'la plage', back: 'der Strand', category: 'Reisen' },
      { front: 'à gauche', back: 'links', category: 'Reisen' },
      { front: 'à droite', back: 'rechts', category: 'Reisen' },
      { front: 'tout droit', back: 'geradeaus', category: 'Reisen' },
      { front: 'Où sont les toilettes ?', back: 'Wo ist die Toilette?', category: 'Reisen' },
      { front: 'la valise', back: 'der Koffer', category: 'Reisen' },
      { front: "l'aéroport (m)", back: 'der Flughafen', category: 'Reisen' },

      // Redewendungen
      { front: 'petit à petit', back: 'nach und nach', category: 'Redewendungen' },
      { front: 'ça marche', back: 'geht klar / passt', category: 'Redewendungen' },
      { front: "ce n'est pas grave", back: 'das ist nicht schlimm', category: 'Redewendungen' },
      { front: "c'est la vie", back: 'so ist das Leben', category: 'Redewendungen' },
      { front: 'tant pis', back: 'schade / Pech gehabt', category: 'Redewendungen' },
      { front: 'avoir la flemme', back: 'keine Lust haben', category: 'Redewendungen' },
      { front: 'avoir le cafard', back: 'Trübsal blasen', category: 'Redewendungen' },
      { front: 'poser un lapin à qn', back: 'jemanden versetzen', category: 'Redewendungen' },
      { front: 'coûter les yeux de la tête', back: 'ein Vermögen kosten', category: 'Redewendungen' },
      { front: 'il pleut des cordes', back: 'es regnet in Strömen', category: 'Redewendungen' },
    ],
  },
  {
    id: 'en',
    name: 'Business English',
    flag: '🇬🇧',
    lang: 'en',
    voiceLangs: ['en-gb', 'en-us'],
    sample: 'Hello!',
    abbreviations: { sb: 'somebody', sth: 'something' },
    praise: ['Perfect!', 'Well done!', 'Not bad!'],
    importFile: 'vokabeln_englisch.csv',
    importCategory: 'Wortliste',
    importReversed: false,
    cards: [
      // Meetings
      { front: "to schedule a meeting", back: "ein Meeting ansetzen", category: 'Meetings' },
      { front: "to postpone a meeting", back: "ein Meeting verschieben", category: 'Meetings' },
      { front: "the agenda", back: "die Tagesordnung", category: 'Meetings' },
      { front: "to take the minutes", back: "Protokoll führen", category: 'Meetings' },
      { front: "Let's get started.", back: "Fangen wir an.", category: 'Meetings' },
      { front: "Could you elaborate on that?", back: "Könnten Sie das näher erläutern?", category: 'Meetings' },
      { front: "to follow up on sth", back: "etw. nachverfolgen, an etw. dranbleiben", category: 'Meetings' },
      { front: "action items", back: "die Aufgaben / To-dos aus dem Meeting", category: 'Meetings' },
      { front: "to be on the same page", back: "auf demselben Stand sein", category: 'Meetings' },
      { front: "Let's wrap up.", back: "Lassen Sie uns zum Schluss kommen.", category: 'Meetings' },

      // E-Mails
      { front: "Please find attached …", back: "Anbei finden Sie …", category: 'E-Mails' },
      { front: "I look forward to hearing from you.", back: "Ich freue mich auf Ihre Rückmeldung.", category: 'E-Mails' },
      { front: "Thank you for your prompt reply.", back: "Vielen Dank für Ihre schnelle Antwort.", category: 'E-Mails' },
      { front: "Kind regards", back: "Viele Grüße / Mit freundlichen Grüßen", category: 'E-Mails' },
      { front: "to cc sb", back: "jdn. in Kopie setzen", category: 'E-Mails' },
      { front: "Further to our conversation, …", back: "Bezugnehmend auf unser Gespräch …", category: 'E-Mails' },
      { front: "I'm writing to inquire about …", back: "Ich schreibe Ihnen, um mich nach … zu erkundigen.", category: 'E-Mails' },
      { front: "Please let me know if you have any questions.", back: "Bei Fragen melden Sie sich gern.", category: 'E-Mails' },
      { front: "the deadline", back: "die Frist, der Abgabetermin", category: 'E-Mails' },
      { front: "ASAP (as soon as possible)", back: "so schnell wie möglich", category: 'E-Mails' },

      // Telefon & Calls
      { front: "Could you put me through to …?", back: "Könnten Sie mich mit … verbinden?", category: 'Telefon & Calls' },
      { front: "to hold the line", back: "am Apparat bleiben", category: 'Telefon & Calls' },
      { front: "You're breaking up.", back: "Die Verbindung bricht ab / Sie sind kaum zu verstehen.", category: 'Telefon & Calls' },
      { front: "Can you hear me?", back: "Können Sie mich hören?", category: 'Telefon & Calls' },
      { front: "You're on mute.", back: "Ihr Mikrofon ist stummgeschaltet.", category: 'Telefon & Calls' },
      { front: "to call sb back", back: "jdn. zurückrufen", category: 'Telefon & Calls' },
      { front: "Could you speak up, please?", back: "Könnten Sie bitte lauter sprechen?", category: 'Telefon & Calls' },
      { front: "to leave a message", back: "eine Nachricht hinterlassen", category: 'Telefon & Calls' },
      { front: "Sorry, I didn't catch that.", back: "Entschuldigung, das habe ich nicht verstanden.", category: 'Telefon & Calls' },
      { front: "Let me share my screen.", back: "Ich teile mal meinen Bildschirm.", category: 'Telefon & Calls' },

      // Präsentation
      { front: "to give a presentation", back: "eine Präsentation halten", category: 'Präsentation' },
      { front: "the slide", back: "die Folie", category: 'Präsentation' },
      { front: "to outline sth", back: "etw. skizzieren, umreißen", category: 'Präsentation' },
      { front: "As you can see …", back: "Wie Sie sehen …", category: 'Präsentation' },
      { front: "Let me move on to …", back: "Ich komme nun zu …", category: 'Präsentation' },
      { front: "to sum up", back: "zusammenfassend; zusammenfassen", category: 'Präsentation' },
      { front: "the key takeaway", back: "die wichtigste Erkenntnis", category: 'Präsentation' },
      { front: "the figures", back: "die Zahlen", category: 'Präsentation' },
      { front: "to increase significantly", back: "deutlich steigen", category: 'Präsentation' },
      { front: "That brings me to the end of my presentation.", back: "Damit bin ich am Ende meiner Präsentation.", category: 'Präsentation' },

      // Verhandlung
      { front: "the offer", back: "das Angebot", category: 'Verhandlung' },
      { front: "to negotiate", back: "verhandeln", category: 'Verhandlung' },
      { front: "to reach a compromise", back: "einen Kompromiss finden", category: 'Verhandlung' },
      { front: "the contract", back: "der Vertrag", category: 'Verhandlung' },
      { front: "the budget", back: "das Budget", category: 'Verhandlung' },
      { front: "to meet a deadline", back: "eine Frist einhalten", category: 'Verhandlung' },
      { front: "the stakeholder", back: "der/die Beteiligte, die Interessengruppe", category: 'Verhandlung' },
      { front: "the revenue", back: "der Umsatz", category: 'Verhandlung' },
      { front: "That sounds reasonable.", back: "Das klingt vernünftig.", category: 'Verhandlung' },
      { front: "I'm afraid that won't be possible.", back: "Das wird leider nicht möglich sein.", category: 'Verhandlung' },
    ],
  },
];
