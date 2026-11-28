import "./tags-new.css";

import { FormEvent, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { isAdmin } from "@features/user";
import { GROUPS, letterLabel, parseTagsState, TAG_LETTERS, tagIndexQuery, TagsState, writeTagsState } from "./tags-state";

interface TagIndex {
    types: { id: number; name: string; count: number }[];
    tags: { id: number; name: string; count: number }[];
}

const n = (v: number) => v.toLocaleString("fi-FI").replace(/\s/g, " ");
const fetchIndex = async (query: string): Promise<TagIndex> => (await getApiContent(`tagindex?${query}`, getCurrenUser())).data;

/** The tag list in the identity style, under trial for admins (tags.md): a tab a group, big groups a letter at a time. */
export const TagsPageNew = () => {
    const [params, setParams] = useSearchParams();
    const state = parseTagsState(params);
    const user = useMemo(() => getCurrenUser(), []);
    // Unused tags are for clean-up: admins only (owner, 2026-11-23).
    const admin = isAdmin(user);
    const update = (changes: Partial<TagsState>) => setParams(writeTagsState({ ...state, ...changes }));

    const query = tagIndexQuery(state, admin);
    const { data, isError, isFetching, isPlaceholderData, refetch } = useQuery({
        queryKey: ["tagindex", query], queryFn: () => fetchIndex(query), placeholderData: keepPreviousData,
    });
    // The header's total: every group without a search.
    const { data: all } = useQuery({
        queryKey: ["tagindex", "all", admin], queryFn: () => fetchIndex(admin ? "unused=1" : ""), staleTime: 10 * 60 * 1000,
    });
    const total = all?.types.reduce((sum, t) => sum + t.count, 0);
    useEffect(() => { document.title = "Asiasanat"; }, []);

    const search = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        update({ haku: String(new FormData(e.currentTarget).get("haku") ?? "").trim() });
    };
    const count = (id: number) => data?.types.find(t => t.id === id)?.count;
    const tags = data?.tags ?? [];

    return (
        <main className="tg" data-tags-page="uusi">
            <header className="tg-head">
                <h1>Asiasanat</h1>
                <p>{total !== undefined ? `${n(total)} asiasanaa seitsemässä ryhmässä.` : "Asiasanat seitsemässä ryhmässä."} Asiasana kertoo,
                    mistä teos kertoo, missä ja milloin se tapahtuu ja millaisia hahmoja siinä on.</p>
            </header>

            <form className="tg-filters" role="search" aria-label="Hae asiasanoja" onSubmit={search} key={state.haku}>
                <label className="tg-search">Hae nimellä
                    <input type="search" name="haku" defaultValue={state.haku} autoComplete="off" placeholder="esim. aika" />
                </label>
                <label>Järjestys
                    <select value={state.jarjestys} onChange={e => update({ jarjestys: e.target.value as TagsState["jarjestys"] })}>
                        <option value="nimi">Nimi</option>
                        <option value="maara">Yleisimmät ensin</option>
                    </select>
                </label>
                {state.haku && <button type="button" className="tg-link" onClick={() => update({ haku: "" })}>Tyhjennä haku</button>}
            </form>

            <div className="tg-tabs" role="tablist" aria-label="Asiasanaryhmät">
                {GROUPS.map(g => (
                    <button key={g.slug} type="button" role="tab" aria-selected={g.slug === state.ryhma.slug} aria-controls="tg-list"
                        onClick={() => update({ ryhma: g, kirjain: g.big ? "A" : null })}>
                        {g.label}{count(g.id) !== undefined && <small>{n(count(g.id)!)}</small>}
                    </button>
                ))}
            </div>

            {state.ryhma.big && !state.haku && (
                <div className="tg-letters" role="group" aria-label="Alkukirjain">
                    <button type="button" aria-pressed={state.kirjain === null} onClick={() => update({ kirjain: null })}>Kaikki</button>
                    {TAG_LETTERS.map(l => (
                        <button key={l} type="button" aria-pressed={state.kirjain === l} onClick={() => update({ kirjain: l })}>{letterLabel(l)}</button>
                    ))}
                </div>
            )}

            <section id="tg-list" role="tabpanel" aria-label={state.ryhma.label} aria-busy={isFetching}>
                <p className="tg-status" role="status">
                    {data && !isPlaceholderData ? (
                        <><b>{n(tags.length)} {tags.length === 1 ? "asiasana" : "asiasanaa"}</b>
                            <span>{state.haku ? ` haulla "${state.haku}"` : state.kirjain ? `, alkukirjain ${letterLabel(state.kirjain)}` : ""}</span></>
                    ) : "Haetaan…"}
                </p>
                {isError ? (
                    <div className="tg-err" role="alert">Asiasanoja ei saatu haettua.<button type="button" onClick={() => refetch()}>Yritä uudelleen</button></div>
                ) : data && tags.length === 0 ? (
                    <p className="tg-empty">{state.haku ? "Haulla ei löytynyt asiasanoja tästä ryhmästä." : "Ei asiasanoja tällä kirjaimella."}</p>
                ) : (
                    <ul className="tg-cols">
                        {tags.map(t => (
                            <li key={t.id} className={t.count === 0 ? "tg-unused" : undefined}>
                                <Link to={`/tags/${t.id}`}>{t.name}</Link>
                                <span title={t.count === 0 ? "Ei käytössä" : undefined}>{n(t.count)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
};
