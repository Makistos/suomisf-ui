import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";

import { getCurrenUser } from "@services/auth-service";
import { addSimilarTag, getSimilarTags, removeSimilarTag, SimilarTag } from "@api/tag/get-similar-tags";
import { filterTags } from "@api/tag/filter-tags";
import { SfTag } from "../types";
import { tagTypeToClass, tagTypeToSeverity } from "./tag-type-to-severity";
import { SIMILAR_REASONS } from "../utils/similar-reasons";

interface Props {
    tagId: number;
}

/**
 * The similar tags of a tag, for admins: the job's suggestions and tags
 * linked by hand. A tag can be removed (a suggestion is dismissed and not
 * suggested again, a hand-made link deleted) and any tag added.
 */
export const SimilarTagsEditor = ({ tagId }: Props) => {
    const user = useMemo(() => getCurrenUser(), []);
    const queryClient = useQueryClient();
    const queryKey = ["tags", String(tagId), "similar"];
    const [selected, setSelected] = useState<SfTag | string | null>(null);
    const [suggestions, setSuggestions] = useState<SfTag[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const { data: similar = [], isLoading } = useQuery({
        queryKey,
        queryFn: () => getSimilarTags(tagId, user),
    });

    const run = async (action: () => Promise<unknown>) => {
        setBusy(true);
        setError("");
        try {
            await action();
            await queryClient.invalidateQueries({ queryKey });
        } catch {
            setError("Tallennus epäonnistui.");
        } finally {
            setBusy(false);
        }
    };

    const search = async (query: string) => {
        try {
            const listed = new Set([tagId, ...similar.map(t => t.id)]);
            setSuggestions((await filterTags(query, user)).filter(t => !listed.has(t.id)));
        } catch {
            setSuggestions([]);
        }
    };

    const add = () => {
        if (!selected || typeof selected === "string") return;
        const other = selected;
        run(async () => {
            await addSimilarTag(tagId, other.id, user);
            setSelected(null);
        });
    };

    const remove = (tag: SimilarTag) => run(() => removeSimilarTag(tagId, tag.id, user));

    return (
        <section aria-labelledby="similar-tags-heading">
            <h2 id="similar-tags-heading" className="text-lg mt-0 mb-2">Samankaltaiset asiasanat</h2>
            <p className="mt-0 mb-3 text-sm text-color-secondary">
                Poistettua ehdotusta ei ehdoteta uudelleen. Lisätyt asiasanat näkyvät liittyvinä.
            </p>
            {isLoading ? null : similar.length === 0 ? (
                <p className="mt-0 mb-3">Ei samankaltaisia asiasanoja.</p>
            ) : (
                <ul className="list-none p-0 m-0 mb-3 max-h-20rem overflow-y-auto">
                    {similar.map(tag => (
                        <li key={tag.id} className="flex align-items-center gap-2 py-1">
                            <Link to={`/tags/${tag.id}`} title={tag.type?.name}>
                                <Tag value={tag.name} severity={tagTypeToSeverity(tag)}
                                    className={tagTypeToClass(tag)} />
                            </Link>
                            <span className="text-sm text-color-secondary">
                                {tag.kind === "duplicate" ? "Kaksoiskappale" : "Liittyvä"},{" "}
                                {SIMILAR_REASONS[tag.reason].toLowerCase()}
                            </span>
                            <Button icon="pi pi-times" rounded text severity="secondary" size="small"
                                className="ml-auto" aria-label={`Poista ${tag.name}`}
                                tooltip="Poista" tooltipOptions={{ position: "left" }}
                                disabled={busy} onClick={() => remove(tag)} />
                        </li>
                    ))}
                </ul>
            )}
            <label htmlFor="similar-tag-add" className="block font-bold mb-2">Lisää asiasana</label>
            <div className="flex gap-2">
                <AutoComplete
                    inputId="similar-tag-add"
                    value={selected}
                    field="name"
                    suggestions={suggestions}
                    completeMethod={e => search(e.query)}
                    onChange={e => setSelected(e.value)}
                    delay={400}
                    minLength={2}
                    placeholder="Hae asiasanaa"
                    className="flex-1"
                    inputClassName="w-full"
                />
                <Button label="Lisää" icon="pi pi-plus" onClick={add} loading={busy}
                    disabled={!selected || typeof selected === "string"} />
            </div>
            {error && <Message severity="error" text={error} className="mt-2" />}
        </section>
    );
};
