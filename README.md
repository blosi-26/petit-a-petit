# Petit à Petit 🥐

Eine Karteikarten-App zum Französischlernen nach dem Leitner-System.
Sie läuft komplett im Browser, ohne Server und ohne Datenbank.

## Funktionen
- 50 Startkarten in 5 Kategorien, eigene Karten anlegen, bearbeiten und löschen
- Leitner-System mit 5 Fächern (Wiederholung nach 1, 2, 4, 8 und 16 Tagen)
- Lernrichtung umschaltbar: 🇫🇷 → 🇩🇪 oder 🇩🇪 → 🇫🇷
- Höchstens 20 Karten pro Runde; nicht gewusste Karten kommen am Ende noch einmal
- Aussprache 🔊 über die eingebaute Sprachausgabe des Geräts, auf Wunsch automatisch.
  Erscheint nur, wenn das Gerät eine französische Stimme hat. Fehlt sie, lässt sie sich meist in den Systemeinstellungen nachladen
  (iPhone: *Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Französisch*).
- Tagesserie 🔥, Fächer-Übersicht, freies Üben, wenn nichts fällig ist
- Backup als JSON-Datei (Export/Import)

## Dateien
| Datei | Aufgabe |
|---|---|
| `index.html` | Aufbau aller Ansichten und des Karten-Dialogs |
| `style.css` | Design und Animationen, für das Handy optimiert |
| `cards.js` | Startpaket – hier können Sie die 50 Startkarten anpassen |
| `script.js` | Logik: Speichern, Leitner-System, Lernsitzung, Verwaltung, Backup |

## Lokal ausprobieren
Einfach `index.html` per Doppelklick im Browser öffnen.

## Auf GitHub Pages veröffentlichen
1. Auf [github.com](https://github.com) anmelden und oben rechts **+ → New repository** wählen.
2. Einen Namen vergeben, z. B. `petit-a-petit`, **Public** auswählen und **Create repository** klicken.
3. Auf der leeren Repo-Seite **uploading an existing file** anklicken, alle vier Dateien
   (`index.html`, `style.css`, `cards.js`, `script.js`) und diese README hineinziehen und **Commit changes** klicken.
4. Im Repo auf **Settings → Pages** gehen. Unter *Build and deployment* bei **Source** „Deploy from a branch“ wählen,
   als **Branch** `main` und als Ordner `/ (root)` einstellen und dann **Save** klicken.
5. Nach etwa einer Minute erscheint oben die Adresse, z. B. `https://IHR-NAME.github.io/petit-a-petit/`.

Wenn Sie später Dateien ändern, laden Sie sie einfach erneut hoch. GitHub Pages aktualisiert die Seite automatisch.

**Tipp fürs Handy:** Die Seite im Browser öffnen und über *Teilen → Zum Home-Bildschirm* (iPhone)
bzw. *⋮ → Zum Startbildschirm hinzufügen* (Android) wie eine App ablegen.

## Wichtig zu den Daten
- Alles wird im **localStorage des jeweiligen Browsers** gespeichert. Handy und Rechner haben deshalb getrennte Stände.
- Wenn Sie die Browserdaten löschen oder im privaten Modus surfen, ist der Fortschritt weg.
  Erstellen Sie deshalb ab und zu unter **Karten verwalten → Exportieren** ein Backup.
- Über Export auf Gerät A und Import auf Gerät B lässt sich der Stand übertragen.
- Änderungen an `cards.js` wirken nur bei einem neuen Start, also in einem frischen Browser
  oder nach **Alles auf Startpaket zurücksetzen**.
