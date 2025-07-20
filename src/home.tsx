import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import { Tooltip } from 'primereact/tooltip';

import { getApiContent } from "./services/user-service";
import { getCurrenUser } from './services/auth-service';
import { Edition } from "./features/edition";
//import { IMAGE_URL } from "./systemProps";
import { ImageTooltip } from "./utils/image-tooltip";

interface Statistics {
  works: number,
  editions: number,
  shorts: number,
  magazines: number
  covers: number,
  latest: Edition[]
}

export const Home = () => {
  const user = useMemo(() => { return getCurrenUser() }, []);
  const [stats, setStats]: [Statistics | null, (data: Statistics) => void] = useState<Statistics | null>(null);

  // React hook to retrieve data from the API
  useEffect(() => {

    const getStats = async () => {
      try {
        // Call the API
        const response = await getApiContent('frontpagedata', user);
        // Save the data
        setStats(response.data);
      } catch (e) {
        console.log(e);
      }
    };
    // Call the function
    getStats();
  }, [user])

  return (
    <div className="grid mt-4 p-4">
      <div className="grid col-12 lg:col-8">
        <div className="front-text-block">
          <h1 className="frontpage mb-8">Tervetuloa suomenkielisen spekulatiivisen fiktion bibliografiaan!</h1>
          <p className="frontpage mt-4">
            Tavoitteemme on sisällyttää kaikki suomenkielinen SF-kirjallisuus
            sekä tiedot kaikista suomalaisista SF-fanzineista.
            Sivustolta löydät <Link to={`/bookindex`}>kirjojen</Link> ja <Link to={`/shortstoryindex`}>novellien</Link> hakukoneen
            , <Link to={`/magazines`}>fanzine</Link>-luettelon sekä <Link to={`/people`}>henkilöhakemiston</Link>
            , <Link to={`/publishers`}>kustantajat</Link>
            , <Link to={`/bookseries`}>kirjasarjat</Link> ja <Link to={`/pubseries`}>kustantajien sarjat</Link>.
            Lisäksi täältä löytää listauksen merkittäviä SF-palkintoja
            voittaneista teoksista, novelleista ja henkilöistä sekä <Link to={`/tags`}>asiasanalistauksen</Link>.
          </p>
        </div>
        <div className="latest-additions mt-8 mb-8">
          <div className="grid">
            <div className="col-12">
              Viimeisimmät lisäykset
            </div>
            <div className="flex flex-wrap justify-content-between align-items-center flex-grow-1 gap-3">
              {stats && stats.latest && stats.latest.map((edition) => (
                <div className="flex flex-grow justify-content-between gap-1" key={edition.id}>
                  <div>
                    <div>
                      <Tooltip target={".image-" + edition.id} position="top" mouseTrack mouseTrackLeft={10}>
                        <div className="flex align-items-center">
                          <ImageTooltip edition={edition} />
                        </div>
                      </Tooltip>

                      <Link to={`/editions/${edition.id}`}>
                        {edition.images.length > 0 && edition.images[0].image_src !== undefined && edition.images[0].image_src !== null &&
                          edition.images[0].image_src !== "" ?
                          <><img alt={edition.title} className={"image-" + edition.id} src={import.meta.env.VITE_IMAGE_URL + edition.images[0].image_src}
                            height={String(edition.size ? Number(edition.size) * 10 : 200)} />
                          </>
                          :
                          <div>
                            {edition.work[0].author_str}:<br />
                            {edition.title}
                          </div>
                        }
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid justify-content-end p-1">
            <Link to={`/latest`}>Lisää...</Link>
          </div>
        </div>
        {stats && (
          <div className="flex justify-content-between p-3 flex-grow-1 flex-shrink-1 flex-wrap stats">
            <div className="front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
              <div className="col-12 justify-content-center p-0">Teoksia</div>
              <div className="col-12 justify-content-center stats-number pt-2">{stats.works}</div>
            </div>
            <div className="front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
              <div className="col-12 justify-content-center p-0">Painoksia</div>
              <div className="col-12 justify-content-center stats-number pt-2">{stats.editions}</div>
            </div>
            <div className="front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
              <div className="col-12 justify-content-center p-0">Novelleja</div>
              <div className="col-12 justify-content-center stats-number pt-2">{stats.shorts}</div>
            </div>
            <div className="front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
              <div className="col-12 justify-content-center p-0">Kansia</div>
              <div className="col-12 justify-content-center stats-number pt-2">{stats.covers}</div>
            </div>
            <div className="front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
              <div className="col-12 justify-content-center p-0">Lehtiä</div>
              <div className="col-12 justify-content-center stats-number pt-2">{stats.magazines}</div>
            </div>
          </div>
        )}
        <div className="grid col-12 mt-8">
          <hr />
          <div className="flex gap-3 flex-grow-1 flex-shrink-1 flex-wrap justify-content-center">
            <span><Link to={`/faq`}>Tietoja</Link></span>
            <span><a href="#">Tilastot</a></span>
            <span><a href="/changes">Muutokset</a></span>
          </div>
        </div>
      </div>
      <div className="grid lg:col-4 mt-4 hidden lg:block">
        <img alt="Image from a library" className="front-page-image" src="pexels-gunnar-ridderström-4318441.jpg"></img>
      </div>
    </div>
  )

}

export default Home;