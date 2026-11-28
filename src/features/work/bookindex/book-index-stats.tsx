import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { getGenreColors } from "@features/genre/utils/genre-colors";

interface SearchStats {
    total: number;
    genres: { abbr: string; name: string; works: number }[];
    tags: { id: number; name: string; works: number }[];
    tag_count: number;
}

const n = (v: number) => v.toLocaleString("fi-FI").replace(/\s/g, " ");

/**
 * "Tilastot tästä hausta": what the old Tilastoja panel counted in the browser (genres, tags), now for the whole search from
 * GET /api/bookindex/stats, since the list only loads one page. Genre bars as on the publisher page, with names and counts.
 */
export const BookIndexStats = ({ query }: { query: string }) => {
    const { data, isError, refetch } = useQuery<SearchStats>({
        queryKey: ["bookindex-stats", query],
        queryFn: async () => (await getApiContent(`bookindex/stats?${query}`, getCurrenUser())).data,
        staleTime: 5 * 60 * 1000,
    });
    if (isError) {
        return (
            <div className="bn-err bn-stats" role="alert">Tilastoja ei saatu haettua.
                <button type="button" onClick={() => refetch()}>Yritä uudelleen</button>
            </div>
        );
    }
    if (!data) return <p className="bn-stats bn-stats-wait" role="status">Lasketaan tilastoja…</p>;
    const most = data.genres[0]?.works ?? 1;
    return (
        <section className="bn-stats" id="bn-stats" aria-labelledby="bn-stats-h">
            <h2 id="bn-stats-h" className="bn-sr">Tilastot tästä hausta</h2>
            <div className="bn-stats-genres">
                <h3>Genret</h3>
                <p className="bn-snote">Teoksia; teoksella voi olla useampi genre.</p>
                {data.genres.length === 0 ? <p className="bn-snote">Ei genrejä.</p> : (
                    <ul>
                        {data.genres.map(g => (
                            <li className="bn-gbar" key={g.abbr}>
                                <span>{g.name}</span>
                                <span className="bn-track" aria-hidden="true">
                                    <i style={{ width: `${(g.works / most) * 100}%`, background: getGenreColors([g.abbr])[0] ?? "#6C757D" }} />
                                </span>
                                <b>{n(g.works)}</b>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="bn-stats-tags">
                <h3>Asiasanat</h3>
                <p className="bn-snote">
                    {data.tag_count > data.tags.length
                        ? `${n(data.tags.length)} yleisintä ${n(data.tag_count)} asiasanasta; teoksia.`
                        : "Teoksia."}
                </p>
                {data.tags.length === 0 ? <p className="bn-snote">Ei asiasanoja.</p> : (
                    <ul className="bn-tags">
                        {data.tags.map(t => (
                            <li key={t.id}><Link to={`/tags/${t.id}`}>{t.name}</Link> <span>{n(t.works)}</span></li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
};
