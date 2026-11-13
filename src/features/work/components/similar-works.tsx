import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

import { isAdmin, User } from "@features/user";
import { getApiContent } from "@services/user-service";
import { thumbUrl } from "@utils/cover-url";

/**
 * Similar works (GET /api/works/<id>/similar), computed by the backend's
 * scripts/work_similarity.py. Admins only while the results are test
 * driven; see docs/work-similarity-plan.md in the backend. The dialog
 * shows each work's score and its parts so the weights can be judged.
 */

/** Tag type ids (tagtype.id), as used in reasons and signals.types. */
export const AIHE = 1;
const TAG_TYPE_NAMES: Record<string, string> = {
    "1": "Aihe", "2": "Alagenre", "3": "Tyyli", "4": "Toimija", "5": "Paikka", "6": "Aika",
};
/** Order of the tag types in the values row: strongest weight first. */
const TAG_TYPE_ORDER = ["1", "2", "3", "6", "4", "5"];

export interface SimilarReason {
    /** Tag type id, or "description" for a similar description. */
    type: number | "description";
    type_name: string;
    tags: { id: number; name: string }[];
}

/** The score's parts, 0–1, as the backend job stored them. */
export interface SimilarSignals {
    /** Weighted mean of T, D, G and Y before multipliers. */
    S?: number | null;
    /** Tags, rescaled (median pair 0, best pairs 1). */
    T?: number | null;
    /** Tags before rescaling. */
    T_raw?: number | null;
    /** Description, rescaled. */
    D?: number | null;
    /** Genre. */
    G?: number | null;
    /** Original year. */
    Y?: number | null;
    /** Share of the signals both works have. */
    coverage?: number | null;
    /** Per tag type id. */
    types?: Record<string, number>;
    same_series?: boolean;
}

export interface SimilarWork {
    id: number;
    title: string;
    author_str: string | null;
    pubyear: number | null;
    image: { image_src: string; thumb_src?: string } | null;
    /** Strongest first. */
    reasons: SimilarReason[];
    /** The ranking score. */
    score?: number;
    signals?: SimilarSignals;
}

/** Reasons shown per work (plus shared themes, see shownReasons). */
const SHOWN_REASONS = 2;

/** "Yhteinen alagenre: korkea fantasia" or "Samankaltainen kuvaus".
 * Up to four shared themes (Aihe), two tags of other types. */
export const reasonText = (reason: SimilarReason): string =>
    reason.type === "description"
        ? "Samankaltainen kuvaus"
        : `Yhteinen ${reason.type_name.toLowerCase()}: `
          + reason.tags.slice(0, reason.type === AIHE ? 4 : 2).map(t => t.name).join(", ");

/**
 * The strongest reasons, plus the shared themes (Aihe) when there are two
 * or more of them: they are the most specific signal, but often come
 * third after the subgenre and the description.
 */
export const shownReasons = (reasons: SimilarReason[]): SimilarReason[] => {
    const shown = reasons.slice(0, SHOWN_REASONS);
    const themes = reasons.find(r => r.type === AIHE);
    if (themes && themes.tags.length >= 2 && !shown.includes(themes)) shown.push(themes);
    return shown;
};

/** 0.5 -> "0,50"; missing -> "–". */
export const formatValue = (value: number | null | undefined): string =>
    value === null || value === undefined
        ? "–"
        : value.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "Pisteet 0,63 · Asiasanat 0,91 (raaka 0,51) · Kuvaus 0,39 · …" */
export const signalsText = (work: SimilarWork): string => {
    const s = work.signals ?? {};
    const parts = [
        `Pisteet ${formatValue(work.score)}`,
        `Asiasanat ${formatValue(s.T)}` + (s.T_raw !== undefined ? ` (raaka ${formatValue(s.T_raw)})` : ""),
        `Kuvaus ${formatValue(s.D)}`,
        `Genre ${formatValue(s.G)}`,
        `Vuosi ${formatValue(s.Y)}`,
        `Kattavuus ${formatValue(s.coverage)}`,
    ];
    if (s.same_series) parts.push("sama sarja");
    return parts.join(" · ");
};

/** "Aihe 0,46 · Alagenre 1,00 · Tyyli 0,00" for the types either work has. */
export const tagTypesText = (signals: SimilarSignals | undefined): string =>
    TAG_TYPE_ORDER
        .filter(t => signals?.types?.[t] !== undefined)
        .map(t => `${TAG_TYPE_NAMES[t]} ${formatValue(signals?.types?.[t])}`)
        .join(" · ");

export const fetchSimilarWorks = async (workId: number, user: User | null): Promise<SimilarWork[]> => {
    const response = await getApiContent(`works/${workId}/similar?limit=8`, user);
    return response?.data ?? [];
};

interface SimilarWorksProps {
    workId: number;
    user: User | null;
}

/**
 * A button that opens the similar works; shown to admins only, and only
 * when the work has any.
 */
export const SimilarWorks = ({ workId, user }: SimilarWorksProps) => {
    const admin = isAdmin(user);
    const [visible, setVisible] = useState(false);
    const { data } = useQuery({
        queryKey: ["work", workId, "similar"],
        queryFn: () => fetchSimilarWorks(workId, user),
        enabled: admin,
    });

    if (!admin || !data || data.length === 0) return null;

    return (
        <>
            <Button label="Samankaltaisia teoksia" icon="pi pi-clone" size="small" outlined
                className="align-self-start" onClick={() => setVisible(true)} />
            <Dialog header="Samankaltaisia teoksia" visible={visible} onHide={() => setVisible(false)}
                blockScroll dismissableMask className="w-full md:w-8 xl:w-6">
                <p className="text-sm text-600 mt-0">
                    Luvut ovat 0–1. Pisteet järjestävät listan. Asiasanat ja kuvaus on skaalattu niin, että
                    keskimääräinen teospari saa 0 ja samankaltaisimmat 1; asiasanojen skaalaamaton arvo on
                    suluissa. Kattavuus kertoo, kuinka suuri osa vertailusta oli käytettävissä. Toisella
                    rivillä ovat asiasanatyypit erikseen.
                </p>
                <ul className="similar-works list-none p-0 m-0">
                    {data.map(work => (
                        <li key={work.id} className="flex gap-3 py-2 border-bottom-1 surface-border">
                            {work.image
                                ? <img src={thumbUrl(work.image)} alt={`Kansikuva: ${work.title}`}
                                    className="similar-works-cover" loading="lazy" />
                                : <div className="similar-works-cover" aria-hidden="true" />}
                            <div className="flex flex-column gap-1">
                                <Link to={`/works/${work.id}`} className="font-bold"
                                    onClick={() => setVisible(false)}>{work.title}</Link>
                                <span className="text-600">
                                    {work.author_str}{work.pubyear ? ` (${work.pubyear})` : ""}
                                </span>
                                <span className="text-sm">
                                    {shownReasons(work.reasons).map(reasonText).join(" · ")}
                                </span>
                                {work.signals && (
                                    <span className="similar-works-values text-xs text-600">
                                        {signalsText(work)}
                                        <br />
                                        {tagTypesText(work.signals)}
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
                <p className="text-sm text-600 mb-0">
                    Näkyy toistaiseksi vain ylläpitäjille.
                </p>
            </Dialog>
        </>
    );
};
