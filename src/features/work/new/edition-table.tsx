import { Fragment, MouseEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";
import { OverlayPanel } from "primereact/overlaypanel";
import { confirmPopup, ConfirmPopup } from "primereact/confirmpopup";
import { Toast } from "primereact/toast";
import { Image } from "primereact/image";
import type { MenuItem } from "primereact/menuitem";

import { Edition, EditionOwnershipStatus, EditionPrice } from "@features/edition";
import { EditionForm } from "@features/edition/components/edition-form";
import { EditionOwnership } from "@features/edition/components/edition-ownership";
import { EditionWishlist } from "@features/edition/components/edition-wishlist";
import { EditionPricesDialog } from "@features/edition/components/edition-prices-dialog";
import { EditionShortsPicker } from "@features/short/components/shorts-picker";
import { User } from "@features/user";
import { deleteApiContent, postApiContent } from "@services/user-service";
import { Work } from "../types";
import type { CoverTools } from "./cover-tools";
import { CoverItem, editionLabel, Laitos, mergeGroupForRow, ownershipSummary, publisherLines, workCovers } from "../utils/work-facts";

const imageUrl = (src: string) => (src.startsWith("http") ? src : `${import.meta.env.VITE_IMAGE_URL}${src}`);
const nlLink = (isbn: string) => "https://kansalliskirjasto.finna.fi/Search/Results?limit=0&filter%5B%5D=~language%3A%22fin%22"
    + "&filter%5B%5D=~format_ext_str_mv%3A%220%2FBook%2F%22&&filter%5B%5D=~collection%3A%22FEN%22&lookfor="
    + encodeURIComponent(isbn) + "&type=AllFields";
const QUALITY: Record<string, string> = { Perfect: "Täydellinen", Good: "Hyvä", Decent: "Kohtalainen", Poor: "Heikko" };

type Action = "edit" | "copy" | "delete" | "prices" | "stories" | "covers";

interface Props {
    work: Work;
    laitos: Laitos[];
    user: User | null;
    admin: boolean;
    /** The user's owned printings (edition id → ownership), from the work's one ownership request; undefined while loading. */
    ownership?: Record<string, EditionOwnershipStatus>;
    prices?: Record<number, EditionPrice>;
    picked: number | null;
    open: Set<number>;
    onToggle: (firstId: number) => void;
    /** Opens the page's gallery on a row's covers: a printing can have several, and a row can hold several printings. */
    onGallery: (covers: CoverItem[]) => void;
    /** The cover menu (right-click) and the per-printing cover dialog (#91). */
    coverTools?: CoverTools;
}

type Person = { id: number; name: string; alt_name: string };
/** Linked names, as on the old edition rows. */
const People = ({ people }: { people: Person[] }) => (
    <>{people.map((p, i) => <Fragment key={p.id}>{i > 0 && ", "}<Link to={`/people/${p.id}`}>{p.alt_name || p.name}</Link></Fragment>)}</>
);

/** Other owners of a printing, from the work response (no request per printing). */
const OtherOwners = ({ edition, user }: { edition: Edition; user: User }) => {
    const op = useRef<OverlayPanel>(null);
    const others = (edition.owners ?? []).filter(o => Number(o.id) !== Number(user.id));
    if (others.length === 0) return null;
    return (
        <>
            <Button type="button" text icon="pi pi-users" label={String(others.length)}
                aria-label={`Muut omistajat (${others.length})`} tooltip="Muut omistajat" tooltipOptions={{ position: "top" }}
                onClick={e => op.current?.toggle(e)} aria-haspopup />
            <OverlayPanel ref={op}>
                <ul className="list-none m-0 p-0">
                    {others.map(o => <li key={o.id}><Link to={`/users/${o.id}`}>{o.name}</Link></li>)}
                </ul>
            </OverlayPanel>
        </>
    );
};

/** The editions in tables, one per laitos, with the agreed columns and width bands (work.md section 5). */
export const EditionTable = ({ work, laitos, user, admin, ownership, prices, picked, open, onToggle, onGallery, coverTools }: Props) => {
    const queryClient = useQueryClient();
    const toast = useRef<Toast>(null);
    const menu = useRef<Menu>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [dialog, setDialog] = useState<{ action: "edit" | "prices" | "stories"; edition: Edition } | null>(null);
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["work", String(work.id)] });

    const editions = laitos.flatMap(l => l.editions);
    const hasCovers = editions.some(e => e.images?.length);
    const hasTranslators = editions.some(e => e.contributions?.some(c => c.role.id === 2));
    const collection = (work.stories?.length ?? 0) > 0;
    const owned = new Set(Object.keys(ownership ?? {}).map(Number));
    const wished = new Set(editions.filter(e => user && e.wishlisted?.some(w => Number(w.id) === Number(user.id))).map(e => e.id));

    const run = (action: Action, edition: Edition, target?: HTMLElement) => {
        if (action === "covers") { coverTools?.openDialog(edition); return; }
        if (action === "edit" || action === "prices" || action === "stories") { setDialog({ action, edition }); return; }
        if (action === "copy") {
            postApiContent(`editions/${edition.id}/copy`, {}, user).then(r => {
                if (r.status === 200) { toast.current?.show({ severity: "success", summary: "Painos kopioitu" }); refresh(); }
                else toast.current?.show({ severity: "error", summary: "Painosta ei kopioitu", detail: r.response, sticky: true });
            });
            return;
        }
        confirmPopup({
            target: target ?? document.body,
            message: "Haluatko varmasti poistaa painoksen?",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => deleteApiContent(`editions/${edition.id}`).then(r => {
                if (r.status === 200) { toast.current?.show({ severity: "success", summary: "Painos poistettu" }); refresh(); }
                else toast.current?.show({ severity: "error", summary: "Painosta ei poistettu", detail: r.response, sticky: true });
            }),
        });
    };
    const actions = (e: Edition): [Action, string, string][] => [
        ["edit", "pi pi-pencil", "Muokkaa"], ["copy", "pi pi-copy", "Kopioi painos"], ["delete", "pi pi-trash", "Poista"],
        ["prices", "pi pi-euro", "Hinnat"],
        // add, delete and copy covers on touch screens and for a printing without one (#91)
        ...(coverTools ? [["covers", "pi pi-image", "Kansikuvat"] as [Action, string, string]] : []),
        ...(collection ? [["stories", "fa fa-list-ul", "Novellit ja artikkelit"] as [Action, string, string]] : []),
    ].map(([a, icon, label]) => [a, icon, `${label}: ${editionLabel(e)}`] as [Action, string, string]);

    const ownCell = (group: Edition[]) => {
        if (!user) return null;
        if (group.length > 1) {
            const summary = ownershipSummary(group, owned, wished);
            return <span className="wn-ownsum">{summary.startsWith("Omistat") && <i className="pi pi-star-fill" aria-hidden="true" />}{summary}</span>;
        }
        const e = group[0];
        const price = prices?.[e.id];
        return (
            <span className="wn-own">
                {ownership !== undefined && <EditionOwnership editionId={e.id} workId={work.id} prefetched={ownership[String(e.id)] ?? null} />}
                <EditionWishlist editionId={e.id} workId={work.id} initial={wished.has(e.id)} prefetched />
                <OtherOwners edition={e} user={user} />
                {price && <span className="wn-price" title={QUALITY[price.match_quality]}>{price.best_price.toFixed(2).replace(".", ",")} €</span>}
                {!admin && owned.has(e.id) && (
                    <Button type="button" text icon="pi pi-euro" aria-label={`Hinnat: ${editionLabel(e)}`} onClick={() => setDialog({ action: "prices", edition: e })} />
                )}
            </span>
        );
    };

    const admCell = (group: Edition[]) => {
        if (group.length > 1) return null;
        const e = group[0];
        return (
            <>
                <span className="wn-adm">
                    {actions(e).map(([a, icon, label]) => (
                        <Button key={a} type="button" text icon={icon} aria-label={label} tooltip={label.split(":")[0]} tooltipOptions={{ position: "top" }}
                            onClick={ev => run(a, e, ev.currentTarget)} />
                    ))}
                </span>
                <Button type="button" outlined size="small" icon="pi pi-ellipsis-h" className="wn-kebab" aria-label={`Ylläpitotoiminnot: ${editionLabel(e)}`}
                    aria-haspopup onClick={ev => {
                        const target = ev.currentTarget;
                        setMenuItems(actions(e).map(([a, icon, label]) => ({ label: label.split(":")[0], icon, command: () => run(a, e, target) })));
                        menu.current?.toggle(ev);
                    }} />
            </>
        );
    };

    const row = (group: Edition[], sub: boolean) => {
        const r = mergeGroupForRow(group, work.title);
        const many = group.length > 1;
        const first = group[0];
        const ids = group.map(e => e.id);
        const isOpen = many && open.has(first.id);
        const hl = picked !== null && ids.includes(picked) && !isOpen;
        return (
            <tr key={`${sub ? "s" : "g"}${first.id}`} data-editions={ids.join(" ")} id={many ? undefined : `painos-${first.id}`}
                className={[sub ? "wn-sub" : "", hl ? "wn-hl" : ""].filter(Boolean).join(" ") || undefined}>
                {hasCovers && (
                    <td className="c-th">
                        {/* A row's own covers: a merged row's are all its printings', an opened printing's only its own. */}
                        {r.cover && (() => {
                            const covers = workCovers(group);
                            // the old page's cover menu: a merged row's thumbnail belongs to one of its printings,
                            // and a new cover needs one printing, so "Lisää kuva" only on a printing's own row
                            const coverOf = group.find(e => e.images?.some(i => i.id === r.cover!.id));
                            const onMenu = (ev: MouseEvent) => coverTools?.openMenu(ev, { image: r.cover!, imageEdition: coverOf?.id, addTo: many ? undefined : first.id });
                            const thumb = <img src={imageUrl(r.cover.thumb_src ?? r.cover.image_src)} alt={`Kansikuva: ${r.label}`} loading="lazy" />;
                            // Several covers in the row: a gallery of them all; one cover: the original at full size.
                            return covers.length > 1 ? (
                                <button type="button" className="wn-th-btn" aria-label={`Näytä rivin kannet (${covers.length}): ${r.label}`}
                                    onClick={() => onGallery(covers)} onContextMenu={onMenu}>
                                    {thumb}<span className="wn-th-n" aria-hidden="true">{covers.length}</span>
                                </button>
                            ) : (
                                <Image src={imageUrl(r.cover.thumb_src ?? r.cover.image_src)} zoomSrc={imageUrl(r.cover.image_src)}
                                    alt={`Kansikuva: ${r.label}`} preview loading="lazy" onContextMenu={onMenu} />
                            );
                        })()}
                    </td>
                )}
                <td className="c-ed wn-ed">
                    {many ? (
                        <>
                            <button type="button" className="wn-exp" aria-expanded={isOpen} onClick={() => onToggle(first.id)}>
                                <i className={`pi ${isOpen ? "pi-chevron-down" : "pi-chevron-right"}`} aria-hidden="true" /><b>{r.label}</b>
                            </button>
                            <small>{group.length} painosta</small>
                        </>
                    ) : <Link to={`/editions/${first.id}`}>{r.label}</Link>}
                    <span className="wn-yr-in">{r.years}</span>
                    {!many && admin && first.verified && <span className="wn-verified"><i className="pi pi-check-circle" aria-hidden="true" /> Tarkastettu</span>}
                </td>
                <td className="c-yr">{r.years}</td>
                {/* Every row (owner, 2026-11-26): another title in bold, publisher and series, translators, the other credits,
                    then the printing's own notes. A merged row stops at the translators: the rest is on its printings' rows. */}
                <td className="c-pub">
                    {r.otherTitles.map(t => <b key={t} className="wn-etitle">{t}</b>)}
                    {many ? publisherLines(r.publishers).map((l, i) => (
                        <Fragment key={i}>
                            {l.publisher && <div><Link to={`/publishers/${l.publisher.id}`}>{l.publisher.name}</Link></div>}
                            {l.series.map(x => <div key={x.id}><Link to={`/pubseries/${x.id}`}>{x.name}</Link></div>)}
                        </Fragment>
                    )) : r.publishers.map((p, i) => (
                        <div key={i}>
                            {p.publisher && <Link to={`/publishers/${p.publisher.id}`}>{p.publisher.name}</Link>}
                            {p.printedin && ` (${p.printedin})`}
                            {p.pubseries && <>, <Link to={`/pubseries/${p.pubseries.id}`}>{p.pubseries.name}</Link>{p.pubseriesnum ? ` ${p.pubseriesnum}` : ""}</>}
                        </div>
                    ))}
                    {hasTranslators && r.translators.length > 0 && <span className="wn-note wn-tr-in">Suom. <People people={r.translators} /></span>}
                    {!many && (r.coverArtists.length > 0 || r.illustrators.length > 0) && (
                        <span className="wn-note">
                            {r.coverArtists.length > 0 && <>Kansi <People people={r.coverArtists} /></>}
                            {r.coverArtists.length > 0 && r.illustrators.length > 0 && ". "}
                            {r.illustrators.length > 0 && <>Kuvitus <People people={r.illustrators} /></>}
                        </span>
                    )}
                    {!many && r.notes.length > 0 && <span className="wn-note wn-misc">{r.notes.join(". ")}</span>}
                </td>
                {hasTranslators && (
                    <td className="c-tr" data-l="Suom.">
                        <People people={r.translators} />
                    </td>
                )}
                {/* Kansipaperi and Ylivetokannet go with the binding on every row (owner, 2026-11-26) */}
                <td className="c-bind">{[...r.bindings, ...r.jackets].join(", ")}</td>
                <td className="c-pages" data-l="Sivuja">
                    {!many && <>{r.pages.join(", ")}{r.sizes.length > 0 && <span className="wn-note">{r.sizes.join(", ")} cm</span>}</>}
                </td>
                <td className="c-isbn wn-isbn" data-l="ISBN">
                    {r.isbns.map(i => <div key={i}><a href={nlLink(i)} target="_blank" rel="noopener noreferrer">{i}</a></div>)}
                </td>
                <td className="c-book">
                    {(many
                        ? [...r.bindings, ...r.jackets]
                        : [...r.bindings, ...r.jackets, r.pages.length ? `${r.pages.join(", ")} s.` : "", r.sizes.length ? `${r.sizes.join(", ")} cm` : ""]
                    ).filter(Boolean).join(", ")}
                    {r.isbns.length > 0 && <span className="wn-note wn-isbn">{r.isbns.map(i => <span key={i} className="wn-nowrap">{i}</span>)}</span>}
                </td>
                {user && <td className="c-own">{ownCell(group)}</td>}
                {admin && <td className="c-adm">{admCell(group)}</td>}
            </tr>
        );
    };

    const one = laitos.length === 1;
    return (
        <>
            <Toast ref={toast} />
            <ConfirmPopup />
            <Menu model={menuItems} popup ref={menu} />
            {laitos.map(l => (
                <div className="wn-version" key={l.version}>
                    {!one && (
                        <div className="wn-v-head">
                            <h3>{l.version}. laitos</h3>
                            <span>{l.editions.length} {l.editions.length === 1 ? "painos" : "painosta"}, {mergeGroupForRow(l.editions).years}</span>
                        </div>
                    )}
                    <table className={`wn-et${hasCovers ? "" : " wn-nothumb"}${user ? "" : " wn-et-visitor"}`} aria-label={one ? "Painokset" : `${l.version}. laitos`}>
                        <thead>
                            <tr>
                                {hasCovers && <th className="c-th"><span className="p-hidden-accessible">Kansi</span></th>}
                                <th className="c-ed">Painos</th>
                                <th className="c-yr">Vuosi</th>
                                <th className="c-pub">Kustantaja ja sarja</th>
                                {hasTranslators && <th className="c-tr">Suomentaja</th>}
                                <th className="c-bind">Sidonta</th>
                                <th className="c-pages">Sivuja</th>
                                <th className="c-isbn">ISBN</th>
                                <th className="c-book">Kirja</th>
                                {user && <th className="c-own">Omat</th>}
                                {admin && <th className="c-adm">Ylläpito</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {l.groups.map(g => (
                                <Fragment key={g[0].id}>
                                    {row(g, false)}
                                    {g.length > 1 && open.has(g[0].id) && g.map(e => row([e], true))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
            <Dialog maximizable blockScroll className="w-full xl:w-6" header="Painoksen muokkaus"
                visible={dialog?.action === "edit"} onHide={() => setDialog(null)}>
                {dialog?.action === "edit" && (
                    <EditionForm editionid={dialog.edition.id} work={work} onSubmitCallback={(status: boolean, message: string) => {
                        setDialog(null);
                        refresh();
                        toast.current?.show(status ? { severity: "success", summary: "Tallentaminen onnistui" }
                            : { severity: "error", summary: "Tietojen tallentaminen epäonnistui", detail: message, life: 6000 });
                    }} />
                )}
            </Dialog>
            <Dialog maximizable blockScroll className="w-full xl:w-9" header="Novellien muokkaus"
                visible={dialog?.action === "stories"} onHide={() => { setDialog(null); refresh(); }}>
                {dialog?.action === "stories" && <EditionShortsPicker id={String(dialog.edition.id)} onClose={() => { setDialog(null); refresh(); }} />}
            </Dialog>
            {dialog?.action === "prices" && (
                <EditionPricesDialog edition={dialog.edition} workTitle={work.title} visible onHide={() => setDialog(null)} />
            )}
        </>
    );
};
