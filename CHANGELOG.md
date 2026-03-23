# Changelog

Tämä lista on lyhennetty merkittävimpiin muutoksiin. Kahden vuoden aikana (maaliskuu 2024 – maaliskuu 2026) tehtiin yhteensä 272 commitia, joista 220 oli ominaisuus- tai korjausmuutoksia. Projektin koko historian aikana committeja on tehty yhteensä 623.

---

## 2026-03-23 `d2bbee2` — Uusi etusivu
Etusivu uudistettiin kokonaan: selkeämpi ulkoasu, viimeisimmät lisäykset kansinäkymänä, kokoelman laajuustilastot ja latausanimaatiot.

## 2026-03-22 `9ebeca6` — Korjaus: dialogit eivät toimineet sivuston sisäisessä navigoinnissa
PrimeReactin `blockScroll`-dialogi jätti `p-overflow-hidden`-luokan `<body>`-elementtiin navigoinnin yhteydessä. Lisäksi `QueryClient` luotiin uudelleen jokaisella renderöinnillä. Molemmat korjattu.

## 2026-03-22 `0d5bf8d` — Henkilösivu: johdetut roolit, asiasanat ja välilehtikorjaus
Henkilösivun sivupalkkiin lisätty johdetut roolit (Kirjailija, Novellisti, Runoilija, Kirjoittaja, Kääntäjä, Toimittaja, Kansitaiteilija, Kuvittaja, Päätoimittaja) sekä asiasanat. Korjattu PrimeReact TabView -bugi jossa ensimmäinen välilehti ei avautunut tietyin ehdoin.

## 2026-03-22 `4de64d9` — Teossivu: kansikuvien asettelu ja tason valitsin
Painoslistauksen kansikuvat pysyvät nyt aina tietojen vieressä kapealla näytöllä. Tason valitsin sai suomenkieliset nimet (Lyhyt / Tiivistetty / Kaikki).

## 2026-03-22 `92b4f42` — Henkilökuva Wikimediasta
Henkilösivulle haetaan automaattisesti muotokuva Wikimedia Commonsista QID:n perusteella. Kuva tallennetaan tietokantaan. Kuvanvalitsin, pisteytetty kasvohaku, ei-kuvaa-vaihtoehto ja toast-ilmoitukset.

## 2026-03-22 `4740e22` — Kirjautuminen hakee käyttäjänimen ja admin-roolin
Kirjautumisen yhteydessä haetaan `/me`-rajapinnasta käyttäjänimi ja admin-tieto.

## 2026-03-19 `844c78f` — Korjaus: ei-SF-teokset eivät näkyneet henkilösivulla

## 2026-02-06 `ba7353d` — Tilastosivut interaktiivisilla kaavioilla
Kattava tilastosivu: teokset vuosittain, novellien kielijakauma interaktiivisilla suodattimilla, kustantajakohtainen kaavio dynaamisella datalla.

## 2026-01-22 `e8e6a4e` — "Esiintyy teoksessa" teossivulle ja lyhytsivulle
Teossivulle lisätty Esiintyy-kenttä henkilölinkeillä. Lyhytsivun ulkoasua parannettu.

## 2026-01-21 `be0155e` — Tietokirjallisuus-välilehti ja teostyyppi henkilö- ja teossivulle
Henkilösivulle erillinen välilehti tietokirjallisuudelle. Teossivulle teostyypin näyttö. Kirjasuodatus kontribuuttorikontrolliin.

## 2026-01-17 `8b52889` — Aliakset henkilölomakkeeseen

## 2026-01-15 `bb344ea` — Kuvaus lehtisivulle

## 2025-11-09 `429db10` — Teossivu päivittyy automaattisesti novellien muutosten jälkeen

## 2025-10-29 `199a48f` — Edellinen/seuraava-navigointi lehden sivulle

## 2025-10-28 `f031703` — Samankaltaiset novellit lyhytsivulle

## 2025-10-15 `1ca6058` — Koosteteostenkäsittely (OmnibusPicker)
Uusi komponentti koosteosteosten hallintaan. Novellit voi lisätä kaikkiin teostyyppeihin. Kielen päättely kokoelmanosista.

## 2025-10-07 `d41824c` — Kopiointipainike painostietoihin

## 2025-09-30 `ed9deb5` — Satunnainen puutteellinen teos profiilisivulla

## 2025-09-21 `4af3dc7` — Kirjasarjojen ja kustantajasarjojen lisätiedot
Kuvaus, linkit, lajityypit, sarjasuhteet ja alkuperäinen nimi kirjasarjoille ja kustantajasarjoille.

## 2025-09-18 `f3aacc1` — Henkilön lehtikansigalleria kontribuutiotyypin mukaan

## 2025-08-05 `9918e9b` — Suomenkielinen lajittelu skandinaavisille kirjaimille

## 2025-08-01 `d31948e` — Kontribuuttorikontrollit uudistettu
Refaktorointi, kuvakokoelmanäkymä, tähdellä merkityt omat painokset, galleria-integraatio, parempi tagien ja painostietojen esitys.

## 2025-07-31 `5edf4b8` — Lehtikontribuutiot henkilösivulle

## 2025-07-18 `fd88abe` — Suora URL-osoite yksittäiselle painokselle

## 2025-06-08 `7c3531b` — Linkkilistat käyttävät alt_name-nimeä oletuksena

## 2025-05-14 `a94dc90` — Vihko-teostyypin tuki

## 2025-05-13 `ddab3c4` — Novellihaun parannuksia
Lisää kenttiä, palkinto-suodatus, siivottu hakusivu.

## 2025-05-11 `e42666f` — Palkintosivu ryhmittelee kategorioittain

## 2025-04-27 `090b464` — Hakutulosten parannuksia ja palkintolomakkeet

## 2025-04-05 `4f2991f` — Lyhytsivun päivitys
Kirja- ja lehtivälilehdet yhdistetty. Tarina-tyyppi näytetään tiivistelmässä. Omistustiedot korjattu.

## 2025-04-01 `8e2998de` — Laaja responsiivisuuspäivitys
Henkilö-, teos-, painos- ja muut sivut optimoitu mobiilille. CDN vaihdettu. Kustantajan ja asiasanojen kuvauskentät.

## 2025-03-31 `1405492` — Visuaalinen uudistus useille sivuille
Tag-, kustantajasarja-, kustantaja- ja kirjasarjasivut päivitetty uuteen ulkoasuun.

## 2025-02-16 `362d9c1` — Omistustieto tagi- ja kirjasarjasivuille

## 2025-02-12 `018616f` — Parannettu painoslista tietopainikkeella

## 2025-01-22 `2c0372b` — Lehden hallintaominaisuudet

## 2024-12-08 `3964073` — Toivelista
Käyttäjä voi merkitä painoksia toivelistalle. Profiilisivulla wishlist-näkymä ja tilastot.

## 2024-11-24 `c336a52` — Lehden sisällön ja novellien hallinnan parannuksia

## 2024-10-15 `e8cdef2` — Lehden hallintatoiminnot ja kansikuvanhallinta

## 2024-09-22 `5c398d47` — Profiilisivu näyttää omistetut kirjat
Painosten omistuksen merkintä ja seuranta.

## 2024-07-29 `b3380f90` — Painosten ryhmittely ja tagien sijoittelu teossivulla

## 2024-07-03 `fb85f766` — FAQ-sivu
Usein kysytyt kysymykset-sivu etusivun kautta. Sähköpostilinkki.

## 2024-05-15 `b851313` — Asiasanajärjestelmän uudelleenkirjoitus
Tagien suodatus, poisto ja luonti refaktoroitu. Uusien tagien luonti suoraan teoslomakkeesta.

## 2024-05-05 `ac01c9ea` — Teos- ja painoslomakkeiden parannuksia
Lomakkeet lataavat datan itsenäisesti. Toast-ilmoitukset tallennuksesta. Useita pienkorjauksia.

## 2024-04-18 `7acd99e2` — Migraatio Create React App → Vite

## 2024-04-16 `e77d68d3` — Sarjaselaimen nuolipainikkeet teossivulle

## 2024-04-01 `3c6ea2af` — PrimeReact päivitetty versioon 10

## 2024-03-26 `a1d6941` — Kustantajasarjalomake
