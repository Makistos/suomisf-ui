# SuomiSF – palvelimen ylläpito

Tämä opas on palvelimen ja tietokannan ylläpitäjälle. Se kattaa asiat, joita
ei voi tehdä sivuston kautta: ylläpito-oikeudet, käyttäjätunnukset,
asetukset, skriptit ja tietokantamigraatiot.

**Sivuston ylläpitotoiminnot** (teosten, painosten, henkilöiden, asiasanojen,
palkintojen ym. lisääminen, muokkaaminen ja poistaminen sekä
Ylläpitotyökalut-sivu) on kuvattu wikissä:
[Ylläpito](https://github.com/Makistos/suomisf-ui/wiki/Ylläpito).

Taustajärjestelmä on erillinen checkout `../suomisf` (Flask + PostgreSQL,
taulut `suomisf`-skeemassa).

## Ylläpito-oikeudet

Ylläpito-oikeuksille ei ole käyttöliittymää eikä API:a. Oikeus on
`user`-taulun sarake `is_admin`:

```sql
-- myönnä ylläpito-oikeus
UPDATE suomisf."user" SET is_admin = true  WHERE name = '<käyttäjänimi>';
-- poista ylläpito-oikeus
UPDATE suomisf."user" SET is_admin = false WHERE name = '<käyttäjänimi>';
```

Kirjautuessa taustajärjestelmä kirjoittaa JWT-tunnisteeseen `role`- ja
`is_administrator`-tiedot `is_admin`-sarakkeen perusteella
(`app/impl_users.py`). Muutos tulee siis voimaan vasta seuraavassa
kirjautumisessa. Jo myönnetty tunniste pysyy voimassa vanhoilla oikeuksilla,
kunnes se vanhenee.

Käyttöliittymä näyttää ylläpitotoiminnot roolille `admin`, ja taustajärjestelmä
tarkistaa jokaisessa ylläpitokutsussa erikseen tunnisteen
`is_administrator`-tiedon.

### `demo_admin`

Käyttäjänimi `demo_admin` saa kirjautuessa `is_administrator`-oikeuden, mutta
roolin arvoksi tulee `demo_admin` eikä `admin`. Käyttöliittymä ei siksi näytä
tälle tunnukselle ylläpitotoimintoja, vaikka palvelin hyväksyisi sen
ylläpitokutsut. Jos tunnusta ei käytetä, sitä ei kannata luoda.

## Käyttäjätunnukset

Käyttäjät rekisteröityvät itse, ja rekisteröityminen luo aina tavallisen
käyttäjän. Käyttäjiä ei voi muokata eikä poistaa sivuston kautta, joten
esimerkiksi tunnuksen poisto tai sähköpostiosoitteen korjaus tehdään
tietokannassa (`suomisf."user"`, sarakkeet mm. `name`, `email`, `is_admin`).

Salasanan käyttäjä vaihtaa itse kirjautumissivun linkistä
*Unohtuiko salasana?*. Palautusviesti lähtee vain, jos sähköposti on
määritetty (ks. alla).

## Asetukset

Taustajärjestelmän asetukset luetaan ympäristömuuttujista (`config.py`).
Asetuksille ei ole käyttöliittymää.

| Muuttuja | Merkitys |
|----------|----------|
| `FLASK_ENV` | `production`, `staging` tai muu (kehitys); valitsee asetusluokan. `TESTING` valitsee testiasetukset. |
| `DATABASE_URL` | Tietokantayhteys (PostgreSQL). |
| `SECRET_KEY` | Flaskin salausavain. Aseta tuotannossa, oletusarvo ei ole turvallinen. |
| `JWT_SECRET_TOKEN` | JWT-tunnisteiden allekirjoitusavain. |
| `LOG_TO_STDOUT` | Kirjoita loki vakiotulosteeseen. |
| `MAIL_BACKEND` | `log` (oletus, viesti kirjoitetaan lokiin) tai `smtp`. |
| `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | SMTP-asetukset. `MAIL_USE_TLS` on päällä arvolla `true`. |
| `FRONTEND_URL` | Käyttöliittymän osoite, josta muodostetaan salasanan palautuslinkki (oletus `http://localhost:3000`). |
| `PASSWORD_RESET_MAX_AGE` | Palautuslinkin voimassaoloaika sekunteina (oletus 3600). |

Huomioita:

- Oletuksella `MAIL_BACKEND=log` salasanan palautusviestejä **ei lähetetä**.
  Aseta `MAIL_BACKEND=smtp`, `MAIL_*`-asetukset ja tuotannon `FRONTEND_URL`.
- Taustajärjestelmä ajetaan gunicornilla (`wsgi:app`), eikä se lataa
  muutoksia automaattisesti. Asetusten tai koodin muutoksen jälkeen:
  `kill -HUP $(cat /tmp/gunicorn.pid)`.
- Käyttöliittymä lukee taustajärjestelmän osoitteet tiedostoista
  `.env.production` ja `.env.development` (`VITE_API_URL`, `VITE_IMAGE_URL`).

## Tietokantamigraatiot

Skeeman muutokset ovat käsin kirjoitettuja, numeroituja SQL-tiedostoja
hakemistossa `../suomisf/migrations/NNN_*.sql` (ei Alembicia). Ne ajetaan
käsin tietokantaa vasten päivityksen yhteydessä, numerojärjestyksessä.

## Skriptit

Hakemistossa `../suomisf/scripts`:

| Skripti | Käyttö |
|---------|--------|
| `check_data.py` | Etsii tietokannasta outouksia: mahdottomia arvoja, todennäköisiä kaksoiskappaleita, käyttämättömiä rivejä ja ylimääräisiä välilyöntejä. Ei muuta mitään. Ks. `../suomisf/docs/data-checks.md`. |
| `trim_names.py` | Poistaa nimistä ja nimekkeistä ylimääräiset välilyönnit. Ilman `--apply` vain listaa muutokset. |
| `tag_similarity.py` | Laskee samankaltaisten asiasanojen ehdotukset, jotka näkyvät Ylläpitotyökalut-sivulla. Ks. `../suomisf/docs/tag-similarity-plan.md`. |
| `make_thumbnails.py` | Tekee listojen pienoiskuvat kansikuvista. Aja, jos kansikuvia on lisätty kuvahakemistoihin muuten kuin sivuston kautta. |
| `seed_award_import_sources.py`, `award_import_source_seed.sql` | Alustavat palkintojen voittajien tuonnin lähteet (`award_import_source`). |
| `check-awards.py`, `get-awards.py`, `compare_award_sources.py`, `category-map.txt`, `awards-and-categories.txt` | Palkintojen ja kategorioiden haku ja vertailu ulkoisista lähteistä sekä kategorioiden nimikartat. |
| `lonnrot_missing_links.py` | Etsii lonnrot.net-sivustolta teoslinkkejä, joita tietokannassa ei vielä ole. |
| `analyze_visitors.py` | Analysoi nginxin pääsylokeista oikeat kävijät. |
| `movearticles.py` | Vanha kertaluonteinen siirto artikkelitaulusta novellitauluun. |

Palkinnon kategorioita ei voi lisätä käyttöliittymästä, vaan ne lisätään
tietokantaan (`awardcategory`, palkinnon ja kategorian liitos
`awardcategories`).
