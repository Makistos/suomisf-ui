import { Link } from "react-router-dom";

export const FAQ = () => {
    return (
        <div className="grid col-12">
            <div className="grid justify-content-center col-12">
                <h1 className="maintitle">UKK</h1>
            </div>
            <div className="grid col-12 mt-5">
                <h2>Mikä tämä sivusto oikein on?</h2>
            </div>
            <div className="grid col-12 mt-2">
                <h2>Mistä sivuston tiedot tulevat?</h2>
                <p>Suurin osa kirjoista tulee alkuperäisestä kirjaluettelosta. Sen tietoja on laajennettu
                    ja uudet kirjat lisätty käyttäen hyväksi omia kokoelmia sekä erityisesti
                    <Link to={`https://kansalliskirjasto.finna.fi/`}> Kansalliskirjastoa</Link> (perustiedot kuten ISBN), <Link to={`https://www.risingshadow.fi/`}>Risingshadow</Link> (teosten kuvaukset) ja&nbsp;
                    <Link to={`https://www.kirjasampo.fi/fi`}>Kirjasampo</Link> (asiasanat). Näiden lisäksi lukuisia muita lähteitä on käytetty tarpeen mukaan.</p>
                <p>Kansikuvat löytyvät pääasiassa eri sivustoilta, kuten Antikvaarista, Kansalliskirjastosta
                    (uudempien kirjojen osalta) ja Risingshadow'sta. Runsaasti kuvia on myös skannattu itse omista kirjoista.
                </p>

            </div>
            <div className="grid col-12 mt-2">
                <h2>Sivustolla on virhe tai puutteita!</h2>
                <p>Ihan varmasti. Pyrimme mahdollisimman suureen tarkkuuteen, mutta ellemme itse omista
                    tiettyä kirjaa, niin  olemme muiden kokoamien tietojen varassa. Jopa
                    Kansalliskirjaston tiedoissa on virheitä (muista lähteistä puhumattakaan) ja sieltä
                    puuttuu runsaasti painoksia. Kansikuvien osalta voimme skannata omat teoksemme, muuten olemme
                    internetin tarjoamien kuvien varassa.
                </p>
                <p>Sekä sivuston toiminnallisista että sisällöllisistä virheistä voi ilmoittaa sähköpostilla
                    osoitteeseen yp (at) sf-bibliografia.fi.
                </p>

            </div>
            <div className="grid col-12 mt-2">
                <h2>Mitä eroa on sidotulla ja nidotulla kirjalla?</h2>
                <p>Termit viittaavat kirjan sidontatapaan, mutta yleisesti ottaen tämä tarkoittaa
                    kovakantista (sidottu) ja pehmytkantista (nidottu) kirjaa.</p>

            </div>
            <div className="grid col-12 mt-2">
                <h2>Mitä ovat ylivetokansi ja kansipaperi?</h2>
                <p>Ylivetokansi tarkoittaa kovakantisen kirjan kanteen painettua kuvaa.
                    Pehmytkantisessa kirjassa tämä on niin yleistä että sitä ei erikseen mainita.
                    Kansipaperi on useimmiten kovakantiseen kirjaan lisätty erillinen, irrallinen suojakansi.</p>
                <p>Kannattaa huomata, että näiden tietojen osalta sivuston tiedot ovat varsin puutteellisia
                    koska tietoja ei ole aina tarjolla.</p>

            </div>
            <div className="grid col-12 mt-2">
                <h2>Mitä eroa on laitoksella ja painoksella?</h2>
                <p>Painos on perinteisesti tarkoittanut yhtä sarjaa kirjoja, jotka on painettu kerralla.
                    Valitettavasti asia ei ole aina yhtä yksinkertaista ja jopa jossain määrin toisistaan
                    poikkeavia kirjoja merkitään samaan painokseen. Sen lisäksi kustantajat ovat
                    alkaneet enenevässä määrin jättää painostiedon pois kirjoista. Näistä syistä
                    johtuen joudumme usein arvaamaan painoksen numeron. Eri kustantajilla on myös
                    ollut erilaisia käytäntöjä siinä miten eri laitosten painokset numeroidaan.
                    Toisinaan laitoksen ensimmäinen painos on numeroitu ensimmäiseksi, toisinaan on
                    jatkettu edellisen painoksen numeroista.</p>

                <p>Laitokselle ei ole varsinaista määritelmää. Tyypillisesti kustantaja on tehnyt
                    uuden laitoksen kun teoksen sisältö on muuttunut. Tämä sivusto noudattaa samaa
                    sääntöä. Yleisenä sääntönä laitos painoksessa on vaihtunut kustantaja, kääntäjä
                    tai teokseen on lisätty kuvitus, kyse on uudesta laitoksesta.</p>

                <p>Kirjoissa olevia laitos- ja painostietoja noudatetaan tietysti aina.
                    Kansalliskirjaston painostietojakin seurataan lähes aina.</p>


            </div>
            <div className="grid col-12 mt-2">
                <h2>Millä sivusto on tehty?</h2>
                <p>Sivuston ns. frontti, eli käyttöliittymä on tehty TypeScript-kielellä <Link to={`https://react.dev/`}>React</Link>-ympäristöön, komponenttikirjastona
                    on <Link to={`https://primereact.org/`}>PrimeReact</Link>. Taustajärjestelmä eli bäkkäri on tehty Pythonilla <Link to={`https://flask.palletsprojects.com/en/3.0.x/`}>Flask</Link>-ympäristöön.
                </p>
                <p>Ikonit ovat <Link to={`https://www.iconarchive.com/`}>IconArchive</Link>-palvelusta.</p>
                <p>Etusivun kuva on <Link to={`https://www.pexels.com`}>Pexels</Link>-palvelusta. Kuvan ottaja on Gunnar Ridderström.&nbsp;
                    <Link to={`https://www.pexels.com/photo/public-library-with-collection-of-multicolored-books-4318441/`}>Alkuperäinen kuva.</Link> </p>
                <p>Kaikki koodi on vapaata. Käyttöliittymäkoodi löytyy osoitteesta
                    <Link to={`https://github.com/Makistos/suomisf-ui`}>https://github.com/Makistos/suomisf-ui</Link> ja
                    taustajärjestelmä osoitteesta <Link to={`https://github.com/Makistos/suomisf`}>https://github.com/Makistos/suomisf</Link>.
                </p>
            </div>
        </div >
    );
}