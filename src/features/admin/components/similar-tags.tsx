import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { SelectButton } from "primereact/selectbutton";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";

import { getCurrenUser } from "@services/auth-service";
import { getApiContent, postApiContent } from "@services/user-service";
import { mergeTags } from "@api/tag/merge-tags";
import { SfTag, TagType } from "@features/tag/types";
import { tagTypeToClass, tagTypeToSeverity } from "@features/tag/components/tag-type-to-severity";

interface SimilarTag {
    id: number;
    name: string;
    type: TagType | null;
    // Works, stories and articles tagged with it.
    uses: number;
}

type Reason = "baseform" | "spelling" | "place" | "name" | "usage";

interface SimilarPair {
    tag_a: SimilarTag;
    tag_b: SimilarTag;
    kind: "duplicate" | "related";
    reason: Reason;
    name_score: number | null;
    containment: number | null;
    shared: number;
    status: "new" | "dismissed";
    decided_by: string | null;
    decided_at: string | null;
}

interface SimilarResponse {
    // Newest write of the job, null if it has never run.
    updated: string | null;
    pairs: SimilarPair[];
}

type PairRow = SimilarPair & { key: string; score: number | null; names: string };

type View = "duplicate" | "related" | "dismissed";

const VIEWS: { label: string; value: View }[] = [
    { label: "Kaksoiskappaleet", value: "duplicate" },
    { label: "Liittyvät", value: "related" },
    { label: "Hylätyt", value: "dismissed" },
];

export const REASONS: Record<Reason, string> = {
    baseform: "Sama perusmuoto",
    spelling: "Kirjoitusasu",
    place: "Paikka",
    name: "Samankaltainen nimi",
    usage: "Käytetään yhdessä",
};

const SIMILAR_KEY = ["tags-similar"];

// Columns left out on phones.
const WIDE_ONLY = { className: "wide-only", headerClassName: "wide-only" };

const query = (view: View) =>
    view === "dismissed" ? "tags/similar?status=dismissed" : `tags/similar?kind=${view}`;

const formatDate = (iso: string) => new Date(iso).toLocaleString("fi-FI",
    { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

const asSfTag = (tag: SimilarTag): SfTag =>
    ({ id: tag.id, name: tag.name, type_id: tag.type?.id ?? 0, type: tag.type ?? undefined });

/** A tag as a link, coloured by type as elsewhere, with its use count. */
const TagCell = ({ tag }: { tag: SimilarTag }) => (
    <span className="inline-flex align-items-center gap-2">
        <Link to={`/tags/${tag.id}`} title={tag.type?.name}>
            <Tag value={tag.name} severity={tagTypeToSeverity(asSfTag(tag))}
                className={tagTypeToClass(asSfTag(tag))} />
        </Link>
        <span className="text-color-secondary text-sm" title="Käyttökerrat">{tag.uses}</span>
    </span>
);

const scoreText = (pair: SimilarPair) => [
    pair.name_score !== null && `Nimen samankaltaisuus ${pair.name_score.toFixed(2)}`,
    pair.containment !== null && `Yhteiskäyttö ${pair.containment.toFixed(2)}`,
    pair.shared > 0 && `${pair.shared} yhteistä kohdetta`,
].filter(Boolean).join(", ");

/**
 * Tag pairs suggested by the backend's tag similarity job: probable
 * duplicates to merge and related tags. A pair can be merged (the less
 * used tag into the other by default) or dismissed as different tags;
 * dismissed pairs can be restored.
 */
export const SimilarTags = () => {
    const user = useMemo(() => getCurrenUser(), []);
    const queryClient = useQueryClient();
    const toastRef = useRef<Toast>(null);
    const [view, setView] = useState<View>("duplicate");
    const [filter, setFilter] = useState("");
    // The pair being merged: keep is merged into, remove goes away.
    const [merging, setMerging] = useState<{ keep: SimilarTag; remove: SimilarTag } | null>(null);
    const [busy, setBusy] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: [...SIMILAR_KEY, view],
        queryFn: async (): Promise<SimilarResponse> =>
            getApiContent(query(view), user).then(response => response.data),
    });

    const rows: PairRow[] = useMemo(() => (data?.pairs ?? []).map(p => ({
        ...p,
        key: `${p.tag_a.id}-${p.tag_b.id}`,
        score: p.name_score ?? p.containment,
        names: `${p.tag_a.name} ${p.tag_b.name}`,
    })), [data]);

    const refresh = () => queryClient.invalidateQueries({ queryKey: SIMILAR_KEY });

    const decide = async (pair: SimilarPair, action: "dismiss" | "restore") => {
        try {
            await postApiContent(`tags/similar/${action}`,
                { tag_a: pair.tag_a.id, tag_b: pair.tag_b.id }, user);
            toastRef.current?.show({
                severity: "success",
                summary: action === "dismiss" ? "Merkitty eri asiasanoiksi" : "Palautettu",
                detail: `${pair.tag_a.name} – ${pair.tag_b.name}`,
            });
            await refresh();
        } catch {
            toastRef.current?.show({ severity: "error", summary: "Virhe", detail: "Tallennus epäonnistui." });
        }
    };

    const openMerge = (pair: SimilarPair) => {
        // Keep the more used tag by default.
        const [keep, remove] = pair.tag_b.uses > pair.tag_a.uses
            ? [pair.tag_b, pair.tag_a] : [pair.tag_a, pair.tag_b];
        setMerging({ keep, remove });
    };

    const merge = async () => {
        if (!merging) return;
        setBusy(true);
        try {
            await mergeTags(merging.keep.id, merging.remove.id, user);
            toastRef.current?.show({ severity: "success", summary: "Asiasanat yhdistetty",
                detail: `${merging.remove.name} → ${merging.keep.name}` });
            setMerging(null);
            await refresh();
        } catch {
            toastRef.current?.show({ severity: "error", summary: "Virhe", detail: "Yhdistäminen epäonnistui." });
        } finally {
            setBusy(false);
        }
    };

    const header = (
        <div className="flex justify-content-between align-items-center flex-wrap gap-2">
            <SelectButton value={view} options={VIEWS} allowEmpty={false}
                onChange={e => setView(e.value as View)} />
            <IconField iconPosition="left">
                <InputIcon className="pi pi-search" />
                <InputText value={filter} onChange={e => setFilter(e.target.value)}
                    placeholder="Hae asiasanaa..." aria-label="Hae asiasanaa" />
            </IconField>
        </div>
    );

    const actions = (row: PairRow) => (
        <div className="flex gap-1 justify-content-end">
            {row.status === "dismissed" ? (
                <Button icon="pi pi-undo" rounded text aria-label="Palauta"
                    tooltip="Palauta ehdotuksiin" tooltipOptions={{ position: "left" }}
                    onClick={() => decide(row, "restore")} />
            ) : (
                <>
                    <Button icon="pi pi-link" rounded text aria-label="Yhdistä"
                        tooltip="Yhdistä asiasanat" tooltipOptions={{ position: "left" }}
                        onClick={() => openMerge(row)} />
                    <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Eri asiasanat"
                        tooltip={row.kind === "duplicate" ? "Eri asiasanat" : "Eivät liity toisiinsa"}
                        tooltipOptions={{ position: "left" }}
                        onClick={() => decide(row, "dismiss")} />
                </>
            )}
        </div>
    );

    return (
        <div>
            <Toast ref={toastRef} />
            <p className="mt-0 mb-3 text-color-secondary">
                Ehdotukset tulevat taustalla ajettavasta vertailusta.
                {data?.updated && <> Päivitetty {formatDate(data.updated)}.</>}
                {" "}Yhdistä kaksoiskappaleet tai merkitse ne eri asiasanoiksi, jolloin niitä ei ehdoteta uudelleen.
            </p>
            <DataTable
                value={rows}
                dataKey="key"
                loading={isLoading}
                header={header}
                size="small"
                stripedRows
                globalFilter={filter}
                globalFilterFields={["names"]}
                paginator
                rows={25}
                emptyMessage={view === "dismissed" ? "Ei hylättyjä ehdotuksia." : "Ei ehdotuksia."}
            >
                <Column header="Asiasanat" body={(row: PairRow) => (
                    // The first tag has a fixed width so the second lines up on
                    // wide screens; on a phone the second wraps below it.
                    <div className="flex flex-wrap align-items-center column-gap-3 row-gap-2">
                        <div className="md:w-18rem"><TagCell tag={row.tag_a} /></div>
                        <TagCell tag={row.tag_b} />
                        <div className="w-full text-sm text-color-secondary md:hidden">{REASONS[row.reason]}</div>
                    </div>
                )} />
                {view === "dismissed" && <Column header="Tyyppi" style={{ width: "9rem" }} {...WIDE_ONLY}
                    body={(row: PairRow) => row.kind === "duplicate" ? "Kaksoiskappale" : "Liittyvä"} />}
                <Column field="reason" header="Peruste" sortable style={{ width: "13rem" }} {...WIDE_ONLY}
                    body={(row: PairRow) => <span title={scoreText(row) || undefined}>{REASONS[row.reason]}</span>} />
                <Column field="score" header="Pisteet" sortable style={{ width: "7rem" }} {...WIDE_ONLY}
                    body={(row: PairRow) => row.score?.toFixed(2) ?? ""} />
                {view === "dismissed" && <Column header="Hylännyt" style={{ width: "12rem" }} {...WIDE_ONLY}
                    body={(row: PairRow) => row.decided_by &&
                        `${row.decided_by}${row.decided_at ? `, ${formatDate(row.decided_at)}` : ""}`} />}
                <Column style={{ width: "6rem" }} body={actions} />
            </DataTable>

            <Dialog
                header="Yhdistä asiasanat"
                visible={merging !== null}
                onHide={() => setMerging(null)}
                style={{ width: "32rem" }}
                breakpoints={{ "640px": "100vw" }}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Peruuta" icon="pi pi-times" severity="secondary"
                            onClick={() => setMerging(null)} />
                        <Button label="Yhdistä" icon="pi pi-check" loading={busy} onClick={merge} />
                    </div>
                }
            >
                {merging && (
                    <div className="flex flex-column gap-3">
                        <div>
                            <div className="font-bold mb-1">Poistetaan</div>
                            <TagCell tag={merging.remove} />
                        </div>
                        <div className="flex align-items-center gap-2">
                            <Button icon="pi pi-arrow-right-arrow-left" rounded outlined
                                aria-label="Vaihda suunta" tooltip="Vaihda suunta"
                                onClick={() => setMerging({ keep: merging.remove, remove: merging.keep })} />
                        </div>
                        <div>
                            <div className="font-bold mb-1">Säilytetään</div>
                            <TagCell tag={merging.keep} />
                        </div>
                        <p className="m-0 text-color-secondary">
                            Poistettavan asiasanan teokset, novellit ja artikkelit siirretään säilytettävälle.
                        </p>
                    </div>
                )}
            </Dialog>
        </div>
    );
};
