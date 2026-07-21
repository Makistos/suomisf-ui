# SuomiSF – ylläpitäjän opas

Tämä opas on tarkoitettu sivuston **ylläpitäjille** (admin). Se kuvaa kaikki
ylläpito-oikeuksia vaativat toiminnot: mitä ne tekevät, mistä ne löytyvät
käyttöliittymästä, miten yleisimmät tehtävät suoritetaan sekä mihin toimintoihin
liittyy peruuttamattomia seurauksia. Lopussa on lisäksi luettelo toiminnoista,
jotka hoidetaan vain komentoriviltä, tietokannasta tai konfiguraatiosta käsin,
sekä kohdat, jotka vaativat vielä tarkistusta.

> **Käyttöliittymä vs. taustajärjestelmä.** Käyttöliittymä (React/PrimeReact)
> näyttää ylläpitopainikkeet, kun kirjautuneen käyttäjän rooli on `admin`.
> Taustajärjestelmä (Flask) tarkistaa jokaisessa ylläpito-API-kutsussa erikseen,
> että käyttäjän tunnisteessa (JWT) on `is_administrator`-oikeus. Pelkkä
> painikkeen näkyminen ei siis riitä – myös token tarkistetaan palvelimella.

## Sisällysluettelo

1. [Yleiskatsaus ja käyttöoikeudet](#1-yleiskatsaus-ja-käyttöoikeudet)
2. [Käyttäjähallinta](#2-käyttäjähallinta)
3. [Sisällönhallinta](#3-sisällönhallinta)
   - [3.1 Teokset](#31-teokset)
   - [3.2 Painokset](#32-painokset)
   - [3.3 Henkilöt](#33-henkilöt)
   - [3.4 Novellit](#34-novellit)
   - [3.5 Lehdet ja numerot](#35-lehdet-ja-numerot)
   - [3.6 Kustantajat ja sarjat](#36-kustantajat-ja-sarjat)
   - [3.7 Asiasanat](#37-asiasanat)
   - [3.8 Palkinnot](#38-palkinnot)
   - [3.9 Kuvat](#39-kuvat)
   - [3.10 Antikvaari-hinnat](#310-antikvaari-hinnat)
   - [3.11 Muutoshistoria](#311-muutoshistoria)
4. [Tilastot ja kävijäseuranta](#4-tilastot-ja-kävijäseuranta)
5. [Asetukset ja konfiguraatio](#5-asetukset-ja-konfiguraatio)
6. [Komentorivi- ja tietokantatoiminnot](#6-komentorivi--ja-tietokantatoiminnot)
7. [Tarkistettavaa (Needs review)](#7-tarkistettavaa-needs-review)

---

## 1. Yleiskatsaus ja käyttöoikeudet

### Roolit

Sivustolla on kolme roolia:

| Rooli | Miten syntyy | Oikeudet |
|-------|--------------|----------|
| `user` | Tavallinen rekisteröityminen | Selaus, luettujen kirjojen merkintä, omat tiedot |
| `admin` | Tietokannassa `user.is_admin = true` | Kaikki ylläpitotoiminnot |
| `demo_admin` | Käyttäjätunnus on täsmälleen `demo_admin` | Taustajärjestelmässä ylläpito-oikeudet, ks. [luku 7](#7-tarkistettavaa-needs-review) |

Kirjautuessa taustajärjestelmä muodostaa JWT-tunnisteen, jonka `role`- ja
`is_administrator`-tiedot määräytyvät `is_admin`-lipun perusteella. Ylläpitäjän
oikeudet ovat voimassa niin kauan kuin tunniste on voimassa; oikeuksien muutos
tietokannassa tulee voimaan vasta seuraavan kirjautumisen yhteydessä.

### Ylläpitäjäksi tuleminen

**Ylläpito-oikeuden myöntämiseen ei ole käyttöliittymää eikä API-rajapintaa.**
Oikeus asetetaan suoraan tietokantaan (ks. [luku 6](#6-komentorivi--ja-tietokantatoiminnot)).

### Ylläpitovalikko

Kun olet kirjautunut ylläpitäjänä, päävalikkoon ilmestyy **Ylläpito**-valikko
(ruuvimeisseli-ikoni), jossa on pikakomennot:

- **Uusi teos** – avaa teoslomakkeen tyhjänä
- **Uusi henkilö** – avaa henkilölomakkeen tyhjänä

Suurin osa ylläpitotoiminnoista tehdään kuitenkin suoraan kunkin kohteen omalla
sivulla näkyvästä **toimintopainikkeesta** (SpeedDial, sivun oikeassa alareunassa
oleva **+**-painike) tai sivulla näkyvistä ylläpitopainikkeista.

---

## 2. Käyttäjähallinta

**Kuka pääsee:** –
**Sijainti UI:ssa:** ei käyttöliittymää.

Sovelluksessa **ei ole ylläpitäjän käyttöliittymää käyttäjien hallintaan.**
Käytettävissä olevat käyttäjärajapinnat (`GET /api/users`, `GET /api/users/<id>`)
ovat vain lukutoimintoja eivätkä vaadi ylläpito-oikeutta. Käyttäjiä **ei voi
luoda, muokata, poistaa eikä ylentää ylläpitäjäksi käyttöliittymästä.**

Käyttäjähallinnan tehtävät hoidetaan seuraavasti:

- **Uusi käyttäjä:** käyttäjät rekisteröityvät itse (`Rekisteröidy`-valikko).
  Rekisteröinti ei koskaan anna ylläpito-oikeuksia.
- **Ylläpito-oikeuden myöntäminen/poistaminen:** vain tietokannasta
  (ks. [luku 6](#6-komentorivi--ja-tietokantatoiminnot)).
- **Salasanan palautus:** käyttäjä pyytää palautuslinkin `Unohtuiko salasana`
  -toiminnolla. Sähköpostin lähetys riippuu palvelimen `MAIL_*`-asetuksista
  (ks. [luku 5](#5-asetukset-ja-konfiguraatio)).

> ⚠️ Koska ylennys tehdään tietokannassa, ole erityisen huolellinen: ylläpitäjä
> voi poistaa sisältöä pysyvästi. Anna oikeudet vain luotetuille henkilöille.

---

## 3. Sisällönhallinta

Kaikki tämän luvun toiminnot vaativat `admin`-roolin. Yleiset periaatteet:

- **Muokkaus- ja luontilomakkeet** avautuvat dialogeina.
- **Poistot pyytävät aina vahvistuksen** ja ovat **peruuttamattomia** – poistettua
  tietuetta ei voi palauttaa käyttöliittymästä.
- Osa poistoista on estetty, jos kohteeseen on liitetty muuta sisältöä (ks.
  kohtaiset huomiot).

### 3.1 Teokset

**Sijainti UI:ssa:** teossivu `/works/:id`, oikean alakulman **+**-painike
(SpeedDial). Uuden teoksen voi luoda myös valikosta *Ylläpito → Uusi teos*.

Toiminnot:

| Toiminto | Kuvaus |
|----------|--------|
| **Uusi teos** | Luo uusi teos tyhjältä lomakkeelta. |
| **Muokkaa** | Muokkaa teoksen tietoja. |
| **Poista** | Poistaa teoksen. **Peruuttamaton**, pyytää vahvistuksen. |
| **Palkinnot** | Liitä/poista teokselle myönnettyjä palkintoja. |
| **Uusi painos** | Lisää teokselle uusi painos (edition). |
| **Muokkaa novelleja** | Hallitse teokseen (esim. kokoelmaan) kuuluvia novelleja. |
| **Muokkaa kokoomateosta** | Hallitse kokoomateoksen (omnibus) sisältämiä teoksia. |
| **Antikvaari-hinnat** | Hae/hallitse antikvariaattihintoja (ks. [3.10](#310-antikvaari-hinnat)). |

Lisäksi teossivulla on ylläpitäjille **Kirjasampo-tuonti**, jolla teokselle
haetaan asiasanat Kirjasammosta (ks. [3.7](#37-asiasanat)).

**Tehtävä – luo uusi teos:** *Ylläpito → Uusi teos* (tai teossivun **+** →
*Uusi teos*) → täytä lomake → tallenna.

**Gotcha:** Teoksen poisto poistaa teoksen pysyvästi. Tarkista ennen poistoa,
ettei teokseen ole liitetty painoksia tai muuta sisältöä, jonka haluat säilyttää.

### 3.2 Painokset

**Sijainti UI:ssa:** teossivulla kunkin painoksen tiedoissa näkyvät
ylläpitopainikkeet.

| Toiminto (työkaluvihje) | Kuvaus |
|-------------------------|--------|
| **Muokkaa** (kynä) | Muokkaa painoksen tietoja. |
| **Kopioi painos** | Luo painoksesta kopio pohjaksi uudelle painokselle. |
| **Poista** (roskakori) | Poistaa painoksen. **Peruuttamaton.** |
| **Novellit ja artikkelit** | Muokkaa painokseen liittyviä novelleja/artikkeleita (näkyy vain jos teoksella on novelleja). |
| **Hinnat** (€) | Painoksen antikvariaattihinnat. |

**Gotchat:**
- Painoksen muokkaus-, kopiointi- ja poistopainikkeet näkyvät **vain, jos painos
  ei ole yhdistetty** (`combined = false`). Yhdistettyjä painoksia ei voi muokata
  näiltä painikkeilta.
- Ylläpitäjä näkee myös **"Tarkastettu"**-merkinnän niissä painoksissa, jotka on
  merkitty tarkastetuiksi.

### 3.3 Henkilöt

**Sijainti UI:ssa:** henkilösivu `/people/:id`, oikean alakulman **+**-painike.
Uuden henkilön voi luoda myös valikosta *Ylläpito → Uusi henkilö*.

| Toiminto | Kuvaus |
|----------|--------|
| **Uusi henkilö** | Luo uusi henkilö tyhjältä lomakkeelta. |
| **Muokkaa** | Muokkaa henkilön tietoja. |
| **Poista** | Poistaa henkilön. **Peruuttamaton.** |
| **Palkinnot** | Liitä/poista henkilölle myönnettyjä palkintoja. |
| **Kuva** | Valitse tai vaihda henkilön kuva. |

**Gotchat:**
- **Poista on käytettävissä vain, jos henkilöllä ei ole mitään liitoksia** –
  ei teoksia, käännöksiä, toimitustöitä, artikkeleita, novelleja, palkintoja,
  painoksia, alias- tai oikea nimi -tietoja eikä lehtiliitoksia. Muutoin
  poistopainike on pois käytöstä. (Poista siis ensin liitokset tai yhdistä
  henkilö, jos duplikaatti.)
- **Automaattinen kuvahaku (sivuvaikutus!):** Kun ylläpitäjä avaa henkilösivun,
  jolla **ei ole yhtään kuvatietuetta**, sovellus hakee automaattisesti kuvan
  Wikidatasta/Wikimedia Commonsista ja **tallentaa sen taustalla** henkilölle
  (kuva + lähde/lisenssi sekä Wikimedia Commons -linkki). Tämä tapahtuu pelkästä
  sivun avaamisesta ilman erillistä vahvistusta. Jos et halua tallentaa
  automaattista kuvaa, poista se jälkikäteen (ks. [3.9](#39-kuvat)).

### 3.4 Novellit

**Sijainti UI:ssa:** novellisivu `/shorts/:id`, toimintopainikkeet.

| Toiminto | Kuvaus |
|----------|--------|
| **Muokkaa** | Muokkaa novellin tietoja. |
| **Palkinnot** | Liitä/poista novellin palkintoja. |
| **Poista** | Poistaa novellin. **Peruuttamaton.** |

Uusia novelleja liitetään yleensä teoksen tai lehden numeron kautta (esim.
teossivun *Muokkaa novelleja* tai numerosivun *Artikkelit ja novellit*).

### 3.5 Lehdet ja numerot

**Sijainti UI:ssa:** lehtisivu `/magazines/:id` ja numerosivu `/issues/:id`.

Lehtisivun toiminnot:

| Toiminto | Kuvaus |
|----------|--------|
| **Uusi lehti** | Luo uusi lehti. |
| **Uusi numero** | Luo lehdelle uusi numero. |
| **Muokkaa** | Muokkaa lehden tietoja. |
| **Poista** | Poistaa lehden. **Peruuttamaton.** |

Numerosivun toiminnot:

| Toiminto | Kuvaus |
|----------|--------|
| **Muokkaa** | Muokkaa numeron tietoja. |
| **Artikkelit ja novellit** | Hallitse numeron sisältöä (artikkelit ja novellit). |
| **Poista numero** | Poistaa numeron. **Peruuttamaton.** |

Numeroihin voi lisätä myös kansikuvia (ks. [3.9](#39-kuvat)) ja hallita numeron
tekijöitä.

### 3.6 Kustantajat ja sarjat

**Kustantajat** (`/publishers/:id`):

| Toiminto | Kuvaus |
|----------|--------|
| **Muokkaa** | Muokkaa kustantajan tietoja. |
| **Poista** | Poistaa kustantajan. **Peruuttamaton.** |

**Kirjasarjat** (`/bookseries/:id`):

| Toiminto | Kuvaus |
|----------|--------|
| **Uusi kirjasarja** | Luo uusi kirjasarja. |
| **Muokkaa** | Muokkaa sarjan tietoja. |
| **Poista** | Poistaa sarjan. **Peruuttamaton.** |

**Kustantajan sarjat** (`/pubseries/:id`):

| Toiminto | Kuvaus |
|----------|--------|
| **Muokkaa** | Muokkaa sarjan tietoja. |
| **Poista** | Poistaa sarjan. **Peruuttamaton.** |

### 3.7 Asiasanat

**Sijainti UI:ssa:** asiasanan sivu `/tags/:id`, toimintopainikkeet. Lisäksi
teossivun **Kirjasampo-tuonti**.

| Toiminto | Kuvaus |
|----------|--------|
| **Muokkaa** | Muuta asiasanan nimeä/tyyppiä. |
| **Yhdistä** | Yhdistä toinen asiasana tähän asiasanaan. |
| **Poista** | Poistaa asiasanan. |

**Yhdistä (merge):** valitse lähdeasiasana, jonka liitokset siirretään tähän
asiasanaan. **Yhdistäminen on peruuttamaton** – lähdeasiasana sulautuu kohteeseen.

**Poisto:** jos asiasanaan on liitetty teoksia, novelleja tai artikkeleita,
avautuu erillinen vahvistusdialogi. Jos liitoksia ei ole, asiasana poistetaan
suoraan.

**Kirjasampo-tuonti (vain teossivulla):** ylläpitäjä voi tuoda teokselle
asiasanat Kirjasammosta. Toiminto hakee ehdotukset ja tallentaa valitut
asiasanat teokselle. Uudet asiasanat luodaan tarvittaessa automaattisesti.

### 3.8 Palkinnot

**Sijainti UI:ssa:** palkintolista `/awards` ja palkintosivu `/awards/:id`.

| Sijainti | Toiminto | Kuvaus |
|----------|----------|--------|
| `/awards` | **Lisää palkinto** | Luo uusi palkinto. |
| `/awards/:id` | **Muokkaa** | Muokkaa palkinnon tietoja. |
| `/awards/:id` | **Tuo voittajat** | Tuo palkinnon voittajat ulkoisesta lähteestä (ISFDB). |

**Tuo voittajat:** toiminnossa on kaksivaiheinen kulku – ensin **esikatselu**
(näet mitä tuotaisiin), sitten **tallennus**. Tuonti lisää palkinto-osumia
tietokantaan. Tuonnin kategoriamääritykset perustuvat erilliseen
kategoriakartoitukseen (ks. [luku 6](#6-komentorivi--ja-tietokantatoiminnot)).

**Gotcha:** tarkista aina esikatselu ennen tallennusta, ettei synny
duplikaatteja tai vääriä kategorioita.

### 3.9 Kuvat

Kuvia hallitaan sen kohteen sivulla, johon kuva liittyy (teoksen painos,
henkilö, lehden numero). Ylläpitäjän kuvatoiminnot:

- **Lisää kuva** – tiedoston lataus (painoksessa/numerossa, kun kuvaa ei vielä ole).
- **Vaihda kuva** – korvaa nykyinen kuva (näkyy, kun teoksella on vain yksi painos).
- **Poista kuva** – poistaa kuvan. **Peruuttamaton.**
- **Kopioi osoite** – kopioi kuvan osoitteen leikepöydälle (ei vaadi ylläpitoa).

Henkilön kuvan voi lisäksi valita henkilösivun **Kuva**-toiminnolla. Huomaa
henkilöiden automaattinen kuvahaku, joka on kuvattu kohdassa [3.3](#33-henkilöt).

### 3.10 Antikvaari-hinnat

**Sijainti UI:ssa:** teossivun **Antikvaari-hinnat** ja painoksen **Hinnat** (€).

Toiminnolla haetaan ja hallitaan käytettyjen kirjojen hintatietoja
antikvariaateista. Käytettävissä on mm. hakua, tuotteiden tallennusta ja
poistoa, hintojen haku ulkoisesta lähteestä sekä hintojen manuaalinen lisäys ja
URL-pohjainen haku.

**Gotchat:**
- Toiminnot tekevät **ulkoisia verkkohakuja** (antikvariaattien sivustot / API).
  Ne voivat olla hitaita tai epäonnistua ulkoisen palvelun vuoksi.
- Hintojen ja tuotteiden poisto on **peruuttamaton**.

### 3.11 Muutoshistoria

**Sijainti UI:ssa:** kohteiden muutoshistorianäkymä (esim. teoksen/henkilön
historiataulukko) sekä `/changes`-sivu.

Ylläpitäjälle näkyy muutoshistoriataulukossa **Poista**-sarake, jolla voi poistaa
yksittäisen muutoslokimerkinnän. **Merkinnän poisto on peruuttamaton** ja
poistaa kyseisen historiatiedon pysyvästi.

---

## 4. Tilastot ja kävijäseuranta

**Sijainti UI:ssa:** valikko *Muut → Tilastot* (`/stats`).

Tilastosivun perusvälilehdet (Genret, Teokset, Kustantajat, Lehdet, Novellit)
näkyvät kaikille kirjautuneille. Ylläpitäjälle avautuu lisäksi kaksi välilehteä:

- **Kävijät** – kävijämäärät ja käyntien jakaumat (päivittäin, sijainnit,
  selain/laite). Aikaväli valittavissa.
- **Käynnit** – yksittäisten sivukäyntien loki (haku ja sivutus).

Nämä perustuvat palvelimen sivukäyntien seurantaan (`/api/p` kerää käynnit,
`/api/stats/site/*` palauttaa koosteet – vain ylläpitäjälle).

---

## 5. Asetukset ja konfiguraatio

Sovelluksella **ei ole asetusten käyttöliittymää.** Ylläpitäjän säädettävät
asetukset ovat palvelimen ympäristömuuttujia (taustajärjestelmän `.env` /
ympäristö). Keskeiset:

| Muuttuja | Merkitys |
|----------|----------|
| `DATABASE_URL` | Tietokantayhteys (PostgreSQL). |
| `SECRET_KEY` | Flaskin salausavain. Aseta vahvaksi tuotannossa. |
| `JWT_SECRET_TOKEN` | JWT-tunnisteiden allekirjoitusavain. |
| `MAIL_BACKEND` | `log` (kirjoittaa viestin lokiin) tai `smtp` (lähettää SMTP:llä). |
| `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | SMTP-asetukset salasananpalautusviesteille. |
| `PASSWORD_RESET_MAX_AGE` | Palautuslinkin voimassaoloaika sekunteina (oletus 3600). |

**Gotchat:**
- Oletuksena `MAIL_BACKEND=log`, jolloin salasananpalautusviestejä **ei lähetetä**
  vaan ne kirjoitetaan lokiin. Ota SMTP käyttöön (`MAIL_BACKEND=smtp`) ja täytä
  `MAIL_*`-asetukset, jotta palautusviestit lähtevät oikeasti.
- Taustajärjestelmä (gunicorn) **ei lataa muutoksia automaattisesti**. Kun muutat
  asetuksia tai backendin koodia, käynnistä työntekijät uudelleen:
  `kill -HUP $(cat /tmp/gunicorn.pid)`.
- Frontend lukee osoitteet `.env.production` / `.env.development` -tiedostoista
  (`VITE_API_URL`, `VITE_IMAGE_URL`).

---

## 6. Komentorivi- ja tietokantatoiminnot

Seuraavat toiminnot **eivät ole mahdollisia käyttöliittymästä** vaan hoidetaan
tietokannassa tai komentoriviltä (taustajärjestelmä `../suomisf`).

### Ylläpito-oikeuden myöntäminen / poistaminen

Ei UI:ta eikä API:a. Aseta `user`-taulun `is_admin`-sarake suoraan tietokannassa:

```sql
-- myönnä ylläpito-oikeus
UPDATE "user" SET is_admin = true  WHERE name = '<käyttäjänimi>';
-- poista ylläpito-oikeus
UPDATE "user" SET is_admin = false WHERE name = '<käyttäjänimi>';
```

Muutos tulee voimaan, kun käyttäjä kirjautuu uudelleen (rooli luetaan
kirjautumishetkellä JWT-tunnisteeseen).

### Käyttäjien poisto ja muu käyttäjähallinta

Käyttäjätauluun kohdistuvat muutokset (poisto, sähköpostin korjaus, salasanan
nollaus manuaalisesti) tehdään tietokannassa – käyttöliittymässä ei ole näihin
toimintoja.

### Palkintojen tuonnin valmistelu (skriptit)

Kansiossa `../suomisf/scripts` on ylläpito- ja tuontiskriptejä, mm.:

- `check-awards.py` / `get-awards.py` / `compare_award_sources.py` – palkintojen
  haku ja vertailu ulkoisista lähteistä (ISFDB) ja kategoriakartoitus.
- `seed_award_import_sources.py` / `award_import_source_seed.sql` – palkintojen
  tuontilähteiden alustus.
- `category-map.txt`, `awards-and-categories.txt` – kategorioiden nimikartat.
- `lonnrot_missing_links.py`, `movearticles.py`, `analyze_visitors.py` – muut
  ylläpito- ja siivousskriptit.

Käyttöliittymän *Tuo voittajat* -toiminto (kohta [3.8](#38-palkinnot)) nojaa
näihin lähteisiin ja kategoriakartoituksiin.

### Tietokantamigraatiot

Skeeman muutokset tehdään migraatioilla (`../suomisf/migrations`, Alembic).
Aja migraatiot palvelimella päivityksen yhteydessä.

---

## 7. Tarkistettavaa (Needs review)

Seuraavat kohdat löytyivät koodista, mutta niiden tarkkaa tarkoitusta tai
oikeaa käyttötapaa ei voinut täysin varmistaa pelkästä koodista. Nämä kannattaa
tarkistaa ennen kuin niihin nojaa ohjeistuksessa:

- **`demo_admin`-tili.** Taustajärjestelmä antaa käyttäjänimelle `demo_admin`
  `is_administrator`-oikeudet, mutta roolin arvoksi tulee `demo_admin` eikä
  `admin`. Koska käyttöliittymä näyttää ylläpitopainikkeet vain roolilla
  `admin`, `demo_admin` ei näe ylläpitotoimintoja UI:ssa, vaikka sen tunniste
  läpäisisi palvelimen ylläpitotarkistukset. Tämän tilin tarkoitus (esim.
  demo-/esittelykäyttö) ja se, onko epäsymmetria tarkoituksellinen, kannattaa
  varmistaa.
- **Teoksen poiston estoehto.** Teoksen *Poista* on käytöstä poissa vain silloin,
  kun teoksen painostieto on `null`. Ehto vaikuttaa erikoiselta (tyhjä
  painoslista sallisi poiston), joten poiston tarkka logiikka ja mahdolliset
  liitosvaikutukset kannattaa varmistaa.
- **Antikvaari-hintojen ulkoiset lähteet.** Hintahaku käyttää useita
  ulkoisia rajapintoja/sivustoja (haku, tuotteet, URL-scrape). Näiden lähteiden
  luvallisuus, rajoitukset ja virhetilanteiden käsittely kannattaa tarkistaa
  ennen laajaa käyttöä.
- **Muutoshistorian poisto vs. peruutus.** Muutoslokimerkinnän *Poista* poistaa
  historiatiedon. Koodista ei käynyt ilmi, onko muutosten *peruutus*
  (rollback) missään erikseen mahdollista vai onko kyse vain lokirivin
  poistosta – tämä kannattaa varmistaa.
