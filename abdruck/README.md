# Abdruck

Ein Fidget für den Bildschirm. Der Finger liegt auf, und zwei Dinge geschehen
gleichzeitig: die Farbe darunter beginnt zu strömen — ein endloser Durchflug
durch Farbverläufe, dessen Tempo an Zahl, Druck und Geschwindigkeit der Finger
hängt — und genau auf der Auflagefläche zeichnet sich langsam ein Rillenmuster
nach, wie unter einem Fingerabdruckscanner. Wird der Finger gehoben, glüht der
Abdruck noch einen Moment nach und verlischt.

Läuft im Browser, installiert sich auf dem Home-Bildschirm, braucht keinen Store
und kein Netz. Es gibt kein Backend: Einstellungen liegen im `localStorage`
dieses Geräts, sonst wird nichts gespeichert und nichts gesendet.

## Aufs iPhone holen

1. Die Dateien unter `abdruck/` auf einen Webserver laden — **HTTPS ist Pflicht**,
   sonst verweigert iOS den Service Worker und damit den Offline-Betrieb.
   Mit GitHub Pages: Repository → Settings → Pages → Branch wählen; die App
   liegt danach unter `https://<name>.github.io/<repo>/abdruck/`.
2. Adresse **in Safari** öffnen (nicht in Chrome oder im In-App-Browser —
   nur Safari darf auf den Home-Bildschirm legen).
3. Teilen-Symbol → *Zum Home-Bildschirm* → *Hinzufügen*.
4. Vom Home-Bildschirm starten. Die App läuft ohne Safari-Leisten im Vollbild
   und funktioniert danach auch im Flugmodus.

Zum Ausprobieren am Rechner genügt ein lokaler Server im Repository-Wurzelverzeichnis:

```
npx http-server -p 8080
# → http://localhost:8080/abdruck/
```

`file://` reicht nicht — der Service Worker verlangt `http://localhost` oder HTTPS.
Mit der Maus lässt sich ein einzelner „Finger" simulieren.

## Bedienung

| Geste | Wirkung |
|---|---|
| Finger auflegen und halten | Der Abdruck zeichnet sich von innen nach außen auf |
| Ziehen | Die Strömung wird schneller, der Abdruck schleift eine Spur |
| Loslassen | Nachglühen, dann verlischt der Abdruck |
| Mehrere Finger | Bis zu fünf gleichzeitig, jeder mit eigenem Wirbel |
| Zwei Finger, Doppeltipp | Nächste Palette |
| Punkt oben rechts | Einstellungen |

**Rillendichte** — wie fein das Muster ausfällt.
**Nachglühen** — wie lange ein gehobener Abdruck stehen bleibt (0,4 bis 6 s).
**Strömung** — Tempo des Durchflugs; auf 0 steht das Farbfeld still.
**Deckkraft** — wie stark sich der Abdruck gegen den Untergrund durchsetzt.
**Bildschirm wach** — verhindert das Abdunkeln beim Fidgeten (Safari ab 16.4).

## Was das Gerät wirklich hergibt

Safari liefert **kein** Kapazitätsbild der Fingerkuppe. Aus den Touch-Ereignissen
kommen nur `radiusX`, `radiusY` und `rotationAngle` — eine Näherungs-Ellipse —
sowie `force`, das auf iPhones ohne 3D Touch meist leer bleibt. Ein pixelgenauer
Scan der Papillarleisten ist im Browser also nicht möglich; kein Web-Verfahren
kann das umgehen.

Die App baut die Auflagefläche daher aus dieser Ellipse: sie richtet sich mit dem
Finger, wächst mit Druck und Verweildauer, und das Muster zeichnet sich exakt
darin ab. Fehlt `force`, wird ein Ersatzwert aus Verweildauer und Tempo gebildet
(`index.html`, `readTouch` und die Energieberechnung in `frame`).

## Wie es gebaut ist

Eine Datei, kein Build, keine Abhängigkeiten. Alles steckt in `index.html`:
ein einziger Fragment-Shader auf einem bildschirmfüllenden Dreieck.

- **Untergrund** — verschachtelte Domänenverzerrung aus Simplex-Rauschen. Zwei
  Zoomstufen laufen überblendet, damit der Durchflug nie an ein Ende kommt.
- **Rillen** — eine Phasenfunktion über den ganzen Bildschirm. Unter jedem Finger
  wird eine Schleife mit Delta hineingemischt, außerhalb bleibt das fließende
  Irrgartenmuster. `sin` über diese Phase ergibt die Linien; ein Rauschterm reißt
  sie stellenweise auf, wie die Minutien eines echten Abdrucks.
- **Maske** — nur wo ein Finger liegt oder lag, wird die Phase sichtbar.
  Aktive Finger stehen in `uTouch`, gehobene und geschleifte Abdrücke in einem
  Ringpuffer `uStamp` mit eigener Lebensdauer. Der Rand der Auflagefläche ist
  keine saubere Ellipse: er franst über zwei Rauschterme aus, und ganz außen
  setzt die Farbe nur noch stellenweise auf (`footprint` im Shader).
- **Zwei Farben** — der Abdruck ist flächig zweifarbig: Rille und Zwischenraum
  liegen einander in der Palette gegenüber, beide um einen festen Abstand vom
  Untergrund weggedreht. Weiß und Schwarz kommen nicht vor. Weil der Farbabstand
  allein nicht durch jede Palette trägt, wird die hellere der beiden zusätzlich
  angehoben und die dunklere abgesenkt — gesättigt, nie ausgewaschen.
- **Auflösung** — regelt sich selbst nach. Bleibt die Bildzeit über 22 ms, wird
  kleiner gerendert, wird es wieder flott, steigt sie zurück.

Die Farben stehen ganz oben im Skript in `PALETTES` — Hex-Listen, die im Kreis
geschlossen werden. Eine Palette dazuschreiben genügt, der Rest ergibt sich.

## Icons

`node tools/make-icons.mjs` erzeugt `icons/` neu — dieselbe Rillenformel wie im
Shader, nur auf der CPU, PNG von Hand geschrieben. Kein Fremdpaket nötig.

## Beim Ändern

`sw.js` hält die App im Cache. Nach jeder Änderung an den Dateien die Konstante
`VERSION` erhöhen, sonst bleibt auf schon installierten Geräten die alte Fassung
liegen.
