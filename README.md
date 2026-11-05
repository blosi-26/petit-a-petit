# Petit à Petit 🥐

Eine Karteikarten-App zum Vokabellernen nach dem Leitner-System, mit **Stapeln** für
🇫🇷 Französisch und 🇬🇧 Business English. Sie läuft komplett im Browser, ohne Server und ohne Datenbank.

## Funktionen
- **Stapel-Umschalter** oben auf der Startseite. Fächer, Kategorien, Import und Kartenverwaltung gelten jeweils für den gewählten Stapel.
  Das rote Abzeichen zeigt, wie viele Karten im Stapel heute fällig sind.
- Je 50 Startkarten: Französisch (Grundwortschatz) und Business English (Meetings, E-Mails, Telefon, Präsentation, Verhandlung)
- Leitner-System mit 5 Fächern (Wiederholung nach 1, 2, 4, 8 und 16 Tagen)
- Lernrichtung umschaltbar: Fremdsprache → Deutsch oder Deutsch → Fremdsprache
- Höchstens 20 Karten pro Runde; nicht gewusste Karten kommen am Ende noch einmal
- **Aussprache** 🔊 über die eingebaute Sprachausgabe des Geräts, je Stapel in der passenden Sprache.
  Erscheint nur, wenn das Gerät eine passende Stimme hat. Fehlt sie, lässt sie sich meist nachladen
  (iPhone: *Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen*).
- Tagesserie 🔥 (gemeinsam für alle Stapel), freies Üben, wenn nichts fällig ist
- **Kategorie löschen**, z. B. um einen Import rückgängig zu machen
- Backup aller Stapel als JSON-Datei (Export/Import)

## Neue Vokabeln importieren
Importiert wird immer **in den gerade gewählten Stapel**. Dubletten prüft die App je Stapel, neue Karten werden auf 20 pro Tag verteilt.

**Variante A – CSV-Datei auswählen:** *Karten verwalten → CSV importieren*.
Format: `Fremdsprache;Deutsch;Kategorie` (die Kategorie ist optional, `;` oder `,` als Trenner, eine Kopfzeile ist erlaubt).

**Variante B – Wortliste im Repo:** Liegt eine der folgenden Dateien neben `index.html`, zeigt die Startseite des passenden Stapels
einen Import-Hinweis an:

| Stapel | Dateiname | Kategorie beim Import |
|---|---|---|
| 🇫🇷 Französisch | `vokabeln_franzoesisch.csv` | Duolingo |
| 🇬🇧 Business English | `vokabeln_englisch.csv` | Wortliste |

Neue Wörter in der CSV ergänzen und erneut hochladen; der Hinweis erscheint dann nur für die neuen Wörter.

## Dateien
| Datei | Aufgabe |
|---|---|
| `index.html` | Aufbau aller Ansichten und des Karten-Dialogs |
| `style.css` | Design und Animationen, für das Handy optimiert |
| `cards.js` | Die Stapel: Name, Flagge, Sprache, Startkarten. Ein weiterer Stapel (z. B. Spanisch) = ein weiterer Eintrag. |
| `script.js` | Logik: Speichern, Leitner-System, Lernsitzung, Verwaltung, Import, Aussprache |
| `vokabeln_franzoesisch.csv` | Ihre Duolingo-Wortliste (optional) |

## Lokal ausprobieren
`index.html` per Doppelklick im Browser öffnen. Der Import-Hinweis aus Variante B funktioniert nur online, also auf GitHub Pages.

## Auf GitHub Pages veröffentlichen
1. Auf [github.com](https://github.com) ein Repository anlegen (z. B. `petit-a-petit`, **Public**).
2. **Add file → Upload files**, alle Dateien hineinziehen und dann **Commit changes** klicken.
3. **Settings → Pages**: Source „Deploy from a branch“, Branch `main`, Ordner `/ (root)` einstellen und **Save** klicken.
4. Nach etwa einer Minute ist die App unter `https://IHR-NAME.github.io/petit-a-petit/` erreichbar.

Am iPhone die Adresse in Safari öffnen und über *Teilen → Zum Home-Bildschirm* wie eine App ablegen.

## Wichtig zu den Daten
- Alles wird im **localStorage des jeweiligen Browsers** gespeichert. Handy und Rechner haben deshalb getrennte Stände.
  Über *Exportieren* auf Gerät A und *Importieren* auf Gerät B lässt sich der Stand übertragen.
- Wenn Sie die Browserdaten löschen oder im privaten Modus surfen, ist der Fortschritt weg. Erstellen Sie deshalb ab und zu ein Backup.
- Bei einem Update wandelt die App alte Daten automatisch um. Fortschritt, Kategorien und Serie bleiben erhalten,
  und ein neuer Stapel bekommt einmalig sein Startpaket.
- Änderungen an den Startkarten in `cards.js` wirken nur für neue Stapel oder nach *Diesen Stapel auf Startpaket zurücksetzen*.
