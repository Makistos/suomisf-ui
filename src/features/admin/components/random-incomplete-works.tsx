import { useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputNumber } from "primereact/inputnumber";

import { getCurrenUser } from "@services/auth-service";
import { fetchIncompleteWorks, IncompleteWorksResult } from "../api/incomplete-works";
import { WorkResultList } from "./work-result-list";

// Fields the backend can check (missing_fields of /works/random/incomplete),
// in two columns: work data and edition data.
const FIELD_COLUMNS: { field: string; label: string }[][] = [
    [
        { field: "description", label: "Kuvaus" },
        { field: "tags", label: "Asiasanat" },
        { field: "genres", label: "Genret" },
        { field: "language", label: "Kieli" },
        { field: "links", label: "Linkit" },
        { field: "stories", label: "Novellit" },
    ],
    [
        { field: "page_count", label: "Sivumäärä" },
        { field: "size", label: "Koko" },
        { field: "binding", label: "Sidonta" },
        { field: "image", label: "Kuva" },
    ],
];

/** Search for random works that lack all of the chosen data fields. */
export const RandomIncompleteWorks = () => {
    const user = useMemo(() => getCurrenUser(), []);
    const [count, setCount] = useState(10);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [result, setResult] = useState<IncompleteWorksResult | null>(null);

    const toggle = (field: string, checked: boolean) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (checked) next.add(field); else next.delete(field);
            return next;
        });
    };

    const search = async () => {
        setLoading(true);
        setError(false);
        try {
            setResult(await fetchIncompleteWorks(count, [...selected], user));
        } catch {
            setError(true);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <span className="font-bold mb-3 block">Puuttuvat tiedot:</span>
                <div className="grid">
                    {FIELD_COLUMNS.map((column, i) => (
                        <div key={i} className="col-6">
                            {column.map(({ field, label }) => (
                                <div key={field} className="field-checkbox mb-2">
                                    <Checkbox
                                        inputId={`incomplete-${field}`}
                                        checked={selected.has(field)}
                                        onChange={e => toggle(field, !!e.checked)}
                                    />
                                    <label htmlFor={`incomplete-${field}`} className="ml-2">{label}</label>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex align-items-end gap-3 flex-wrap mb-4">
                <div className="flex flex-column gap-2">
                    <label htmlFor="incomplete-count" className="font-bold">Lukumäärä</label>
                    <InputNumber
                        inputId="incomplete-count"
                        value={count}
                        onValueChange={e => setCount(e.value || 10)}
                        min={1}
                        max={100}
                    />
                </div>
                <Button
                    label="Hae teoksia"
                    icon="pi pi-search"
                    loading={loading}
                    onClick={search}
                />
            </div>

            {error && <p className="text-red-500 m-0">Haku epäonnistui.</p>}
            {result && <WorkResultList result={result} />}
        </div>
    );
};
