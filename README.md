# waldgang — maxberndotto.de

Scroll-getriebenes Web-Magazin (Ernst Jünger · „Der Waldgang").
Eine Datei erkennt Desktop/Handy selbst.

## Inhalt
- `index.html` — Sequenz (Centerfold → Gelb/Weiß-Fade → Tisch/Stühle → Garten → Dolly + Zitat → gelbe Ringe → „Der Waldgang ins Eigene." → Magazin)
- `magazin.html` — grenzenlose, ziehbare Magazin-Leinwand
- `impressum.html` — Impressum (verlinkt aufs Magazin)
- `assets/` — Bilder, Videos, Grafiken
- `wald/` — Schriftzüge und Splitter der Schlusssequenz (**derzeit Platzhalter**, s. u.)
- `_notes/` — Fundament, Leitgedanken, Wireframes (nicht Teil der Anzeige)

## Die Zeitachse von `index.html`

Alles hängt an einer einzigen Zahl `P`, die am Scrollrad wächst. Jede Phase ist eine
reine Funktion von `P` — rückwärts läuft die Sequenz identisch zurück.

| P | was passiert |
|---|---|
| 0 → 1 | Gelb kriecht über das Centerfold |
| 1 → 2 | Weiß darüber |
| 2 → 3 | Garten wird aus der Tischmitte freigelegt, Tisch fährt ein |
| — | Tisch anklicken: vier Stühle, dann die Headline |
| 3 → 4 | Dolly (Desktop) bzw. Zoom (Mobil) |
| 4 → 5 | Zitat dreht sich, gelbe Ringe wachsen aus der Mitte |
| 5 → 6 | Ringe schwellen zu einer geschlossenen Fläche |
| 6 → 7 | Station 1 — DER WALDGANG knallt auf Format |
| 7 → 8 | Station 2 — INS EIGENE. |
| 8 → 9 | Station 3 — der ganze Satz, bleibt stehen |
| 9 → 9,8 | Zoom in den pinken Satzpunkt → weiter ins Magazin |

## `wald/` — was hier noch fehlt

Die Dateien sind **Platzhalter**. Die echten Blätter ersetzen sie unter denselben
Namen, ohne Codeänderung:

- `01_der_waldgang.png`, `02_ins_eigene.png`, `03_satz.png` — die Schriftzüge,
  freigestellt, ohne Beiwerk. Beiwerk kommt aus den Splitterdateien.
- `chip_*.png` — je ein Splitter, **nur die Form, ohne Schlagschatten**. Den
  Versatzschatten erzeugt die Seite aus derselben Datei. Dadurch lassen sich Farbe
  und Schatten getrennt steuern — die gelben Elemente lösen sich im gelben Grund
  auf, der Schatten geht danach mit.

Anordnung, Flugrichtung und Tiefe der Splitter stehen oben im Script in der
`CHIPS`-Liste, die Zeiten der Stationen in `STAT`. Beides ist ohne Umbau editierbar.
`PUNKT` hält Lage und Größe des pinken Satzpunkts in `03_satz.png` — beim Austausch
des Blattes nachziehen, sonst zielt der Schlusszoom daneben.

## Deployment
Statische Seiten, kein Build. Dateien an den Webroot laden (FTP) oder via GitHub Pages ausliefern.
