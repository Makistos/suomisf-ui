import { useMemo, useState } from "react";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

import { getCurrenUser } from "@services/auth-service";
import { fetchIncompleteWorks, IncompleteWorksResult } from "../api/incomplete-works";
import { WorkResultList } from "./work-result-list";

/**
 * Random works that have a Kirjasampo link but whose Kirjasampo tags have
 * never been imported ("Tuo Kirjasampo-asiasanat" on the work page).
 */
export const KirjasampoUnimportedWorks = () => {
    const user = useMemo(() => getCurrenUser(), []);
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [result, setResult] = useState<IncompleteWorksResult | null>(null);

    const search = async () => {
        setLoading(true);
        setError(false);
        try {
            setResult(await fetchIncompleteWorks(count, ["kirjasampo_tags"], user));
        } catch {
            setError(true);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <p className="mt-0 mb-3 text-color-secondary">
                Teokset, joilla on Kirjasampo-linkki mutta joihin ei ole vielä tuotu
                Kirjasampo-asiasanoja.
            </p>
            <div className="flex align-items-end gap-3 flex-wrap mb-4">
                <div className="flex flex-column gap-2">
                    <label htmlFor="kirjasampo-count" className="font-bold">Lukumäärä</label>
                    <InputNumber
                        inputId="kirjasampo-count"
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
