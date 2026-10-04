import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import { Tooltip } from "primereact/tooltip";
import { Skeleton } from "primereact/skeleton";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";

import { getApiContent } from "./services/user-service";
import { getCurrenUser } from "./services/auth-service";
import { Edition } from "./features/edition/types";
import { ImageTooltip } from "./utils/image-tooltip";
import { thumbUrl } from "./utils/cover-url";
import { ImageAccordion, ImageAccordionItem } from "./components/image-accordion";

interface Statistics {
  works: number;
  editions: number;
  shorts: number;
  magazines: number;
  covers: number;
}

const LATEST_COUNT = 6;
const COVER_HEIGHT = 160;

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <dl className="home-alt-stat" aria-label={`${label}: ${value}`}>
    <dt>{label}</dt>
    <dd>{value.toLocaleString("fi-FI")}</dd>
  </dl>
);

// Same row container and typical cover width (2:3 at COVER_HEIGHT) as the
// loaded covers, so the swap doesn't reflow the page.
const CoverSkeleton = () => (
  <div className="home-alt-covers">
    {Array.from({ length: LATEST_COUNT }).map((_, i) => (
      <Skeleton key={i} width={`${Math.round(COVER_HEIGHT * 2 / 3)}px`} height={`${COVER_HEIGHT}px`} borderRadius="2px" />
    ))}
  </div>
);

const StatsSkeleton = () => (
  <div className="flex gap-4 flex-wrap">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} width="100px" height="68px" borderRadius="var(--border-radius)" />
    ))}
  </div>
);

const CoverGrid = ({ editions, keyPrefix }: { editions: Edition[]; keyPrefix: string }) => (
  <div className="home-alt-covers">
    {editions.map((edition) => {
      const cls = `${keyPrefix}-${edition.id}`;
      return (
        <div key={edition.id} className="home-alt-cover-item">
          <Tooltip target={`.${cls}`} position="top" mouseTrack mouseTrackLeft={10}>
            <ImageTooltip edition={edition} />
          </Tooltip>
          <Link to={`/editions/${edition.id}`}>
            {edition.images.length > 0 && edition.images[0].image_src ? (
              <img
                alt={edition.title}
                className={cls}
                src={thumbUrl(edition.images[0])}
                height={COVER_HEIGHT}
              />
            ) : (
              <div className={`home-alt-cover-fallback ${cls}`}>
                <span className="home-alt-cover-author">{edition.work?.author_str}</span>
                <span className="home-alt-cover-title">{edition.title}</span>
              </div>
            )}
          </Link>
        </div>
      );
    })}
  </div>
);

export const HomeAlt = () => {
  const user = useMemo(() => getCurrenUser(), []);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [latest, setLatest] = useState<Edition[]>([]);
  const [randomPicks, setRandomPicks] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsResponse, latestResponse, randomResponse] = await Promise.all([
          getApiContent("frontpagedata", user),
          // One cover per work, picked on the server (see /api/frontpage/latest).
          getApiContent(`frontpage/latest?count=${LATEST_COUNT}`, user),
          getApiContent("frontpage/random", user),
        ]);
        setStats(statsResponse.data);
        setRandomPicks(randomResponse.data as Edition[]);
        setLatest(latestResponse.data as Edition[]);
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const randomAccordionItems: ImageAccordionItem[] = useMemo(
    () => randomPicks.map(edition => ({
      id: edition.id,
      imageSrc: edition.images.length > 0 && edition.images[0].image_src
        ? thumbUrl(edition.images[0])
        : null,
      imageAlt: edition.title,
      title: edition.work?.title ?? edition.title,
      author: edition.work?.author_str,
      description: edition.work?.description,
      genres: edition.work?.genres,
      tags: edition.work?.tags,
      linkTo: `/editions/${edition.id}`,
    })),
    [randomPicks]
  );

  return (
    <main className="home-alt-page">
      <section className="home-alt-hero">
        <h1 className="home-alt-heading">
          Suomenkielisen spekulatiivisen fiktion bibliografia
        </h1>
        <p className="home-alt-intro">
          Tavoitteemme on sisällyttää kaikki suomenkielinen SF-kirjallisuus
          sekä tiedot kaikista suomalaisista SF-fanzineista. Sivustolta löydät{" "}
          <Link to="/bookindex">kirjojen</Link> ja{" "}
          <Link to="/shortstoryindex">novellien</Link> hakukoneen,{" "}
          <Link to="/magazines">fanzine</Link>-luettelon sekä{" "}
          <Link to="/people">henkilöhakemiston</Link>,{" "}
          <Link to="/publishers">kustantajat</Link>,{" "}
          <Link to="/bookseries">kirjasarjat</Link> ja{" "}
          <Link to="/pubseries">kustantajien sarjat</Link>. Lisäksi täältä
          löytää listauksen merkittäviä SF-palkintoja voittaneista teoksista,
          novelleista ja henkilöistä sekä{" "}
          <Link to="/tags">asiasanalistauksen</Link>.
        </p>
      </section>

      <Divider />

      {error && (
        <Message
          severity="error"
          text="Tietojen lataaminen epäonnistui. Yritä päivittää sivu."
          className="w-full mb-4"
        />
      )}

      <section aria-labelledby="latest-heading">
        <div className="home-alt-section-header">
          <h2 id="latest-heading" className="home-alt-section-title">
            Viimeisimmät lisäykset
          </h2>
          <Link to="/latest" className="home-alt-see-more">
            Katso kaikki &rarr;
          </Link>
        </div>

        {loading ? (
          <CoverSkeleton />
        ) : (
          <CoverGrid editions={latest} keyPrefix="hac" />
        )}
      </section>

      <Divider />

      <section aria-labelledby="random-heading">
        <h2 id="random-heading" className="home-alt-section-title">
          Bibliografiasta löytyy
        </h2>

        {loading ? (
          <CoverSkeleton />
        ) : (
          <ImageAccordion items={randomAccordionItems} imageHeight={COVER_HEIGHT} />
        )}
      </section>

      <Divider />

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="home-alt-section-title">
          Bibliografian laajuus
        </h2>
        {loading ? (
          <StatsSkeleton />
        ) : (
          stats && (
            <div className="home-alt-stats">
              <StatBox label="Teoksia" value={stats.works} />
              <StatBox label="Painoksia" value={stats.editions} />
              <StatBox label="Novelleja" value={stats.shorts} />
              <StatBox label="Kansia" value={stats.covers} />
              <StatBox label="Lehtiä" value={stats.magazines} />
            </div>
          )
        )}
      </section>

      <Divider />

      <nav aria-label="Lisätietoja" className="home-alt-footer-nav">
        <Link to="/faq">Tietoja sivustosta</Link>
        <a href="/stats">Tilastot</a>
        <a href="/changes">Muutokset</a>
      </nav>
    </main>
  );
};

export default HomeAlt;
