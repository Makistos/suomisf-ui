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
  /*
  return (
    <div className="grid mt-4">
      <div className="col-12 lg:col-8 justify-content-start min-h-screen">
        <div className="front-text-block">
          <h1 className="frontpage mb-8">Tervetuloa suomenkielisen spekulatiivisen fiktion bibliografiaan!</h1>
          <p className="frontpage mt-4">
            Tavoitteemme on sisällyttää kaikki suomenkielinen SF-kirjallisuus sekä tiedot kaikista suomalaisista SF-fanzineista.
            Sivustolta löydät <Link to={`/bookindex`}>kirjojen</Link> ja <Link to={`/shortstoryindex`}>novellien</Link> hakukoneen,
            <Link to={`/magazines`}>fanzine</Link>-luettelon sekä <Link to={`/people`}>henkilöhakemiston</Link>,
            <Link to={`/publishers`}>kustantajat</Link>, <Link to={`/bookseries`}>kirjasarjat</Link> ja <Link to={`/pubseries`}>kustantajien sarjat</Link>.
            Lisäksi täältä löytää listauksen merkittäviä SF-palkintoja voittaneista teoksista, novelleista ja henkilöistä (palkintosivut tulossa)
            sekä <Link to={`/tags`}>asiasanalistauksen</Link>.
          </p>
        </div>
        <div className="latest-additions mt-8 mb-8">
          <div className="grid">
            <div className="grid col-12 bg-blue-500">
              Viimeisimmät lisäykset
            </div>
            <div className="flex col-12">
              {stats && stats.latest && stats.latest.map((edition) => (
                <div className="grid col-3 sm:col-6 justify-content-between" key={edition.id}>
                  <div className="grid col-12">
                    {edition.images.length > 0 && (
                      <div>
                        <Tooltip target={".image-" + edition.id} position="top" mouseTrack mouseTrackLeft={10}>
                          <div className="flex align-items-center">
                            <ImageTooltip edition={edition} />
                          </div>
                        </Tooltip>
                        <Link to={`/works/${edition.work[0].id}`}>
                          <img
                            alt={edition.title}
                            className={"image-" + edition.id}
                            src={process.env.REACT_APP_IMAGE_URL + edition.images[0].image_src}
                            height={String(edition.size ? Number(edition.size) * 10 : 200)}
                          />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className=""></div>
          <div className="grid justify-content-end p-1">Lisää...</div>
        </div>
        {stats && (
          <div className="stats">
            <div className="flex justify-content-between p-3">
              <div className="grid front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
                <div className="grid col-12 justify-content-center p-0">Teoksia</div>
                <div className="grid col-12 justify-content-center stats-number pt-2">{stats.works}</div>
              </div>
              <div className="grid front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
                <div className="grid col-12 justify-content-center p-0">Painoksia</div>
                <div className="grid col-12 justify-content-center stats-number pt-2">{stats.editions}</div>
              </div>
              <div className="grid front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
                <div className="grid col-12 justify-content-center p-0">Novelleja</div>
                <div className="grid col-12 justify-content-center stats-number pt-2">{stats.shorts}</div>
              </div>
              <div className="grid front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
                <div className="grid col-12 justify-content-center p-0">Kansia</div>
                <div className="grid col-12 justify-content-center stats-number pt-2">{stats.covers}</div>
              </div>
              <div className="grid front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
                <div className="grid col-12 justify-content-center p-0">Lehtiä</div>
                <div className="grid col-12 justify-content-center stats-number pt-2">{stats.magazines}</div>
              </div>
            </div>
          </div>
        )}
        <div className="mt-8">
          <hr></hr>
          <div className="grid justify-content-center vertical-align-bottom">
            <span className="mr-3"><a href="#">Tietoja</a></span>
            <span className="mr-3"><a href="#">Tilastot</a></span>
            <span><a href="/changes">Muutokset</a></span>
          </div>
        </div>
      </div>
      <div className="col-4 sm:col-12 mt-4">
        <img alt="Image from a library" className="front-page-image" src="pexels-gunnar-ridderström-4318441.jpg"></img>
      </div>
    </div>
  );
  */

  return (
    <div className="grid mt-4">
      <div className="col-12 lg:col-8 justify-content-start min-h-screen">
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
            voittaneista teoksista, novelleista ja henkilöistä (palkintosivut tulossa) sekä <Link to={`/tags`}>asiasanalistauksen</Link>.
          </p>
        </div>
        <div className="latest-additions mt-8 mb-8">
          <div className="grid">
            <div className="grid col-12 bg-blue-500">
              Viimeisimmät lisäykset
            </div>
            <div className="flex col-12">
              {stats && stats.latest && stats.latest.map((edition) => (
                <div className="grid col-3 justify-content-between" key={edition.id}>
                  <div className="grid col-12" >
                    {edition.images.length > 0 && (
                      <div>
                        <Tooltip target={".image-" + edition.id} position="top" mouseTrack mouseTrackLeft={10}>
                          <div className="flex align-items-center">
                            <ImageTooltip edition={edition} />
                          </div>
                        </Tooltip>
                        <Link to={`/works/${edition.work[0].id}`}>
                          <img alt={edition.title} className={"image-" + edition.id} src={process.env.REACT_APP_IMAGE_URL + edition.images[0].image_src}
                            height={String(edition.size ? Number(edition.size) * 10 : 200)} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="">

          </div>
          <div className="grid justify-content-end p-1">Lisää...</div>
        </div>
        {stats && (
          <div className="stats">
            <div className="flex justify-content-between p-3">
              <div className="grid front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
                <div className="grid col-12 justify-content-center p-0">Teoksia</div>
                <div className="grid col-12 justify-content-center stats-number pt-2">{stats.works}</div>
              </div>
              <div className="grid front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
                <div className="grid col-12 justify-content-center p-0">Painoksia</div>
                <div className="grid col-12 justify-content-center stats-number pt-2">{stats.editions}</div>
              </div>
              <div className="grid front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
                <div className="grid col-12 justify-content-center p-0">Novelleja</div>
                <div className="grid col-12 justify-content-center stats-number pt-2">{stats.shorts}</div>
              </div>
              <div className="grid front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
                <div className="grid col-12 justify-content-center p-0">Kansia</div>
                <div className="grid col-12 justify-content-center stats-number pt-2">{stats.covers}</div>
              </div>
              <div className="grid front-stats-box pt-2 pl-3 pr-3 pb-0 justify-content-center">
                <div className="grid col-12 justify-content-center p-0">Lehtiä</div>
                <div className="grid col-12 justify-content-center stats-number pt-2">{stats.magazines}</div>
              </div>
            </div>
          </div>
        )}
        <div className="mt-8">
          <hr></hr>
          <div className="grid justify-content-center vertical-align-bottom">
            <span className="mr-3"><a href="#">Tietoja</a></span>
            <span className="mr-3"><a href="#">Tilastot</a></span>
            <span><a href="/changes">Muutokset</a></span>
          </div>
        </div>
      </div>
      <div className="col-4 mt-4">
        <img alt="Image from a library" className="front-page-image" src="pexels-gunnar-ridderström-4318441.jpg"></img>
      </div>
    </div>
  )

}

export default Home;