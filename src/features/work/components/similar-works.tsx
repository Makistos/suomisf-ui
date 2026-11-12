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
 * driven; see docs/work-similarity-plan.md in the backend.
 */

export interface SimilarReason {
    /** Tag type id, or "description" for a similar description. */
    type: number | "description";
    type_name: string;
    tags: { id: number; name: string }[];
}

export interface SimilarWork {
    id: number;
    title: string;
    author_str: string | null;
    pubyear: number | null;
    image: { image_src: string; thumb_src?: string } | null;
    /** Strongest first. */
    reasons: SimilarReason[];
}

/** Reasons shown per work. */
const SHOWN_REASONS = 2;
/** Tags shown per reason. */
const SHOWN_TAGS = 2;

/** "Yhteinen alagenre: korkea fantasia" or "Samankaltainen kuvaus". */
export const reasonText = (reason: SimilarReason): string =>
    reason.type === "description"
        ? "Samankaltainen kuvaus"
        : `Yhteinen ${reason.type_name.toLowerCase()}: `
          + reason.tags.slice(0, SHOWN_TAGS).map(t => t.name).join(", ");

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
                                    {work.reasons.slice(0, SHOWN_REASONS).map(reasonText).join(" · ")}
                                </span>
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
