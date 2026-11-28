import "../../work/bookindex/book-index-new.css";
import "./tags-new.css";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { SpeedDial } from "primereact/speeddial";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

import { getCurrenUser } from "@services/auth-service";
import { getTag } from "@api/tag/get-tag";
import { getSimilarTags } from "@api/tag/get-similar-tags";
import { deleteTag } from "@api/tag/delete-tag";
import { isAdmin } from "@features/user";
import { getGenreColors } from "@features/genre/utils/genre-colors";
import type { Short } from "@features/short";
import { LoadError } from "@components/load-error";
import { safeHtml } from "@utils/safe-html";
import { parseIndexState, IndexState, withIndexState } from "../../work/bookindex/bookindex-state";
import { BookResults } from "../../work/bookindex/book-results";
import type { IndexRow } from "../../work/bookindex/work-row";
import { SfTagForm } from "../components/sftag-form";
import { SimilarTagsEditor } from "../components/similar-tags-editor";
import { MergeTagsDialog } from "../routes/sftag";
import { ARTICLE_TYPES, groupOf, tagFacts, TagTab } from "./tags-state";

const naturalName = (name: string) => (name.includes(", ") ? name.split(", ").reverse().join(" ") : name);
type Person = { id: number; name: string; alt_name?: string | null };
const PersonLinks = ({ people }: { people: Person[] }) => (
    <>{people.map((p, i) => <Fragment key={p.id}>{i > 0 && ", "}<Link to={`/people/${p.id}`}>{p.alt_name || naturalName(p.name)}</Link></Fragment>)}</>
);
const unique = (people: Person[]) => people.filter((p, i) => people.findIndex(q => q.id === p.id) === i);

/**
 * A story or article as on the current tag page: writers, title, (original title, year), translators, genres, and where it
 * was published (each book once, magazine issues), every one of them a link.
 */
const StoryRow = ({ s, showType }: { s: Short; showType: boolean }) => {
    const writers = unique((s.contributors ?? []).filter(c => c.role?.id === 1).map(c => c.person));
    const translators = unique((s.contributors ?? []).filter(c => c.role?.id === 2).map(c => c.person));
    const foreign = !!s.orig_title && s.orig_title !== s.title && s.lang?.id !== 7;
    const works = new Map<number, { id: number; title: string; pubyear: string | number }>();
    for (const e of s.editions ?? []) if (e.work && !works.has(e.work.id)) works.set(e.work.id, e.work);
    const places = [
        ...[...works.values()].map(w => <Link key={`w${w.id}`} to={`/works/${w.id}`}>{w.title}{w.pubyear ? ` (${w.pubyear})` : ""}</Link>),
        ...(s.issues ?? []).map(i => <Link key={`i${i.id}`} to={`/issues/${i.id}`}>{`${i.magazine?.name ?? ""} ${i.cover_number ?? ""}`.trim()}</Link>),
    ];
    return (
        <li className="tg-story">
            <div>
                <p>
                    {writers.length > 0 && <><span className="tg-sa"><PersonLinks people={writers} /></span>: </>}
                    <Link className="tg-st" to={`/shorts/${s.id}`}>{s.title}</Link>
                    {(foreign || s.pubyear) && (
                        <span className="tg-so"> ({foreign && <i>{s.orig_title}</i>}{foreign && s.pubyear && ", "}{s.pubyear})</span>
                    )}
                </p>
                {(translators.length > 0 || places.length > 0) && (
                    <p className="tg-sp">
                        {translators.length > 0 && <>Suom. <PersonLinks people={translators} />. </>}
                        {places.length > 0 && <>Julkaistu: {places.map((x, i) => <Fragment key={i}>{i > 0 && ", "}{x}</Fragment>)}.</>}
                    </p>
                )}
            </div>
            <span className="bn-genres">
                {showType && <span className="tg-stype">{s.type?.name}</span>}
                {(s.genres ?? []).map(g => (
                    <span className="bn-gdot" key={g.abbr}><i style={{ background: getGenreColors([g.abbr])[0] ?? "#6C757D" }} />{g.name}</span>
                ))}
            </span>
        </li>
    );
};

/** Long descriptions (steampunk's Wikipedia text) are clamped so the works stay near the top (tags.md). */
const Description = ({ html }: { html: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [long, setLong] = useState(false);
    useLayoutEffect(() => {
        const el = ref.current;
        if (el && !open) setLong(el.scrollHeight > el.clientHeight + 2);
    }, [html, open]);
    return (
        <>
            <div ref={ref} id="tg-desc" className={`tg-desc html-content${open ? "" : " tg-clamped"}`} dangerouslySetInnerHTML={safeHtml(html)} />
            {long && (
                <button type="button" className="tg-link" aria-expanded={open} aria-controls="tg-desc" onClick={() => setOpen(!open)}>
                    {open ? "Näytä vähemmän" : "Näytä koko kuvaus"}
                </button>
            )}
        </>
    );
};

const TABS: { tab: TagTab; label: string }[] = [
    { tab: "teokset", label: "Teokset" }, { tab: "novellit", label: "Novellit" }, { tab: "artikkelit", label: "Artikkelit" },
];

/** A tag in the identity style, under trial for admins (tags.md). */
export const TagPageNew = () => {
    const { tagid } = useParams();
    const id = Number(tagid);
    const [params, setParams] = useSearchParams();
    const user = useMemo(() => getCurrenUser(), []);
    const admin = isAdmin(user);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const toast = useRef<Toast>(null);
    const [dialog, setDialog] = useState<"edit" | "merge" | "delete" | null>(null);

    // Same keys as the current page, so switching pages doesn't load the tag twice.
    const { data, error, refetch } = useQuery({ queryKey: ["tags", tagid], queryFn: () => getTag(id, user) });
    const { data: similar = [] } = useQuery({ queryKey: ["tags", tagid, "similar"], queryFn: () => getSimilarTags(id, user) });
    useEffect(() => { if (data?.name) document.title = data.name; }, [data?.name]);

    const stories = useMemo(() => [...(data?.stories ?? [])].sort((a, b) => a.title.localeCompare(b.title, "fi")), [data?.stories]);
    const fiction = stories.filter(s => !ARTICLE_TYPES.includes(s.type?.id));
    const articles = stories.filter(s => ARTICLE_TYPES.includes(s.type?.id));
    const works = data?.works?.length ?? 0;
    const counts: Record<TagTab, number> = { teokset: works, novellit: fiction.length, artikkelit: articles.length };
    const tabs = TABS.filter(t => counts[t.tab] > 0 || t.tab === "teokset");
    const asked = params.get("valilehti") as TagTab | null;
    const tab = tabs.find(t => t.tab === asked)?.tab ?? (works > 0 ? "teokset" : tabs.find(t => counts[t.tab] > 0)?.tab ?? "teokset");
    const withSimilar = params.get("samankaltaiset") === "1" && similar.length > 0;
    const listState = parseIndexState(params);
    const set = (key: string, value: string | null, p = new URLSearchParams(window.location.search)) => {
        if (value) p.set(key, value); else p.delete(key);
        p.delete("sivu");
        setParams(p);
    };
    const updateList = (changes: Partial<IndexState>) => setParams(withIndexState(new URLSearchParams(window.location.search), changes));

    if (error || (data && !data.id)) {
        return <LoadError error={error} notFoundTitle="Asiasanaa ei löytynyt" onRetry={() => refetch()} />;
    }
    const group = groupOf(data?.type?.id);
    const linked = works + stories.length + (data?.articles?.length ?? 0);
    const remove = () => {
        if (!data) return;
        deleteTag(data.id);
        queryClient.invalidateQueries({ queryKey: ["tags"] });
        navigate(-1);
    };
    // Marks a work that came only from a similar tag (tags.md: "added works show which similar tag they came from").
    const via = (w: IndexRow) => {
        const from = (w.matched_tags ?? []).filter(t => t.id !== id);
        if (!withSimilar || from.length === 0 || w.matched_tags?.[0]?.id === id) return null;
        return <p className="tg-via">Samankaltainen asiasana: {from.map((t, i) => <Fragment key={t.id}>{i > 0 && ", "}<Link to={`/tags/${t.id}`}>{t.name}</Link></Fragment>)}</p>;
    };

    return (
        <main className="tg bn" data-tag-page="uusi">
            <Toast ref={toast} />
            {admin && data && (
                <>
                    <SpeedDial className="fixed-dial" direction="up" showIcon="pi pi-plus" hideIcon="pi pi-times" buttonClassName="p-button-primary"
                        model={[
                            { label: "Muokkaa", icon: "fa-solid fa-pen-to-square", command: () => setDialog("edit") },
                            { label: "Yhdistä", icon: "fa-solid fa-object-ungroup", command: () => setDialog("merge") },
                            { label: "Poista", icon: "fa-solid fa-trash-can", command: () => (linked > 0 ? setDialog("delete") : remove()) },
                        ]} />
                    <ConfirmDialog visible={dialog === "delete"} onHide={() => setDialog(null)} header="Vahvista poisto" icon="pi pi-exclamation-triangle"
                        message={`Asiasana on liitetty ${linked} kohteeseen. Haluatko silti poistaa sen?`}
                        acceptLabel="Poista" rejectLabel="Peruuta" acceptClassName="p-button-danger" accept={remove} reject={() => setDialog(null)} />
                    <Dialog header="Muokkaa" visible={dialog === "edit"} onHide={() => setDialog(null)} className="w-full xl:w-6">
                        <SfTagForm tagId={data.id} onSubmitCallback={(ok, message) => {
                            queryClient.invalidateQueries({ queryKey: ["tags"] });
                            toast.current?.show(ok
                                ? { severity: "success", summary: "Tallentaminen onnistui", detail: "Tietojen päivitys onnistui", life: 4000 }
                                : { severity: "error", summary: "Tietojen tallentaminen epäonnistui", detail: message, life: 6000 });
                            setDialog(null);
                        }} />
                        {/* saved as soon as changed, not with the form above */}
                        <div className="mt-5 pt-4 border-top-1 surface-border"><SimilarTagsEditor tagId={data.id} /></div>
                    </Dialog>
                    <Dialog header="Yhdistä asiasana" visible={dialog === "merge"} onHide={() => setDialog(null)} className="w-full xl:w-4">
                        <MergeTagsDialog tagId={tagid} user={user} onDone={() => setDialog(null)} />
                    </Dialog>
                </>
            )}

            <nav className="tg-crumbs" aria-label="Murupolku">
                <Link to="/tags">Asiasanat</Link> / <Link to={`/tags${group.slug === "alalajit" ? "" : `?ryhma=${group.slug}`}`}>{group.label}</Link> /
            </nav>
            {!data ? <p className="tg-status" role="status">Haetaan…</p> : (
                <>
                    <div className="tg-top">
                        <header className="tg-head">
                            <h1>{data.name}</h1>
                            <span className="tg-type">{group.one}</span>
                            <p className="tg-facts">{tagFacts(works, fiction.length, articles.length) || "Ei teoksia eikä novelleja."}</p>
                            {data.description && <Description html={data.description} />}
                        </header>
                        {similar.length > 0 && (
                            <aside className="tg-side" aria-labelledby="tg-similar-h">
                                <h2 id="tg-similar-h">Samankaltaiset asiasanat</h2>
                                <ul>{similar.map(t => (
                                    <li key={t.id}><Link to={`/tags/${t.id}`}>{t.name}</Link>{t.type && <span>{groupOf(t.type.id).one.toLowerCase()}</span>}</li>
                                ))}</ul>
                                <p>Niiden teokset saa mukaan teoslistaan valitsimella listan yläpuolella.</p>
                            </aside>
                        )}
                    </div>

                    <div className="tg-tabs" role="tablist" aria-label="Asiasanan kohteet">
                        {tabs.map(t => (
                            <button key={t.tab} type="button" role="tab" id={`tg-tab-${t.tab}`} aria-selected={tab === t.tab} aria-controls="tg-panel"
                                onClick={() => set("valilehti", t.tab === "teokset" ? null : t.tab)}>
                                {t.label}<small>{counts[t.tab].toLocaleString("fi-FI")}</small>
                            </button>
                        ))}
                    </div>
                    <section className="tg-panel" id="tg-panel" role="tabpanel" aria-labelledby={`tg-tab-${tab}`}>
                        {tab === "teokset" && (
                            <>
                                {similar.length > 0 && (
                                    <label className="tg-similar">
                                        <input type="checkbox" checked={withSimilar} onChange={e => set("samankaltaiset", e.target.checked ? "1" : null)} />
                                        Myös samankaltaisten asiasanojen teokset ({similar.map(t => t.name).join(", ")})
                                    </label>
                                )}
                                <BookResults state={listState} update={updateList}
                                    extra={`tag=${id}${withSimilar ? "&tag_similar=1" : ""}`}
                                    summary={withSimilar ? "samankaltaiset asiasanat mukana" : ""}
                                    empty="Asiasanalla ei ole teoksia." note={via} />
                            </>
                        )}
                        {tab !== "teokset" && (
                            <ul className="tg-stories">
                                {(tab === "novellit" ? fiction : articles).map(s => <StoryRow key={s.id} s={s} showType={tab === "artikkelit" || s.type?.id !== 1} />)}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </main>
    );
};
