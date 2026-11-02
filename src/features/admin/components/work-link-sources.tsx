import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { AutoComplete } from "primereact/autocomplete";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";

import { getCurrenUser } from "@services/auth-service";
import { getApiContent, postApiContent } from "@services/user-service";

interface SourceRow {
    // null = links without a source.
    source: string | null;
    count: number;
    works: number;
    // Unique row id for the DataTable (a null source can't be a dataKey).
    key: string;
}

interface SourceLink {
    id: number;
    link: string;
    work_id: number;
    work_title: string;
}

const SOURCES_KEY = ["worklink-sources"];

const sourceLabel = (source: string | null) => source ?? "(ei lähdettä)";

/** The links of one source, shown when its row is expanded. */
const SourceLinks = ({ source }: { source: string | null }) => {
    const user = useMemo(() => getCurrenUser(), []);
    const { data, isLoading } = useQuery({
        queryKey: [...SOURCES_KEY, "links", source],
        queryFn: async (): Promise<SourceLink[]> =>
            getApiContent(`worklinks/sources/links?source=${encodeURIComponent(source ?? "")}`, user)
                .then(response => response.data),
    });
    if (isLoading) return <ProgressSpinner style={{ width: "2rem", height: "2rem" }} />;
    return (
        <ul className="m-0 pl-4">
            {data?.map(link => (
                <li key={link.id} className="mb-1">
                    <Link to={`/works/${link.work_id}`}>{link.work_title}</Link>
                    {": "}
                    <a href={link.link} target="_blank" rel="noopener noreferrer"
                        className="text-sm word-break-all">{link.link}</a>
                </li>
            ))}
        </ul>
    );
};

/**
 * Work link sources (link descriptions such as "Kansalliskirjasto") with
 * link counts. Mistyped sources can be renamed, combined into another
 * source or deleted together with their links.
 */
export const WorkLinkSources = () => {
    const user = useMemo(() => getCurrenUser(), []);
    const queryClient = useQueryClient();
    const toastRef = useRef<Toast>(null);
    const [filter, setFilter] = useState("");
    const [selected, setSelected] = useState<SourceRow[]>([]);
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | SourceRow[]>([]);
    const [mergeVisible, setMergeVisible] = useState(false);
    const [target, setTarget] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [toDelete, setToDelete] = useState<SourceRow | null>(null);
    const [busy, setBusy] = useState(false);

    const { data = [], isLoading } = useQuery({
        queryKey: SOURCES_KEY,
        queryFn: async (): Promise<SourceRow[]> =>
            getApiContent("worklinks/sources", user).then(response =>
                (response.data as Omit<SourceRow, "key">[]).map(r => ({ ...r, key: r.source ?? "\u0000" }))),
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: SOURCES_KEY });

    const openMerge = () => {
        // Suggest the most used of the selected sources as the result.
        const best = [...selected].filter(r => r.source).sort((a, b) => b.count - a.count)[0];
        setTarget(best?.source ?? "");
        setMergeVisible(true);
    };

    const merge = async () => {
        setBusy(true);
        try {
            const response = await postApiContent("worklinks/sources/merge",
                { sources: selected.map(r => r.source), target }, user);
            const { updated } = response.response as unknown as { updated: number };
            toastRef.current?.show({ severity: "success", summary: "Lähteet yhdistetty",
                detail: `${updated} linkkiä sai lähteen "${target.trim()}".` });
            setMergeVisible(false);
            setSelected([]);
            setExpandedRows([]);
            await refresh();
        } catch {
            toastRef.current?.show({ severity: "error", summary: "Virhe", detail: "Yhdistäminen epäonnistui." });
        } finally {
            setBusy(false);
        }
    };

    const remove = async (row: SourceRow) => {
        try {
            const response = await postApiContent("worklinks/sources/delete", { source: row.source }, user);
            const { deleted } = response.response as unknown as { deleted: number };
            toastRef.current?.show({ severity: "success", summary: "Lähde poistettu",
                detail: `${deleted} linkkiä poistettu.` });
            setSelected(prev => prev.filter(r => r.key !== row.key));
            await refresh();
        } catch {
            toastRef.current?.show({ severity: "error", summary: "Virhe", detail: "Poisto epäonnistui." });
        }
    };

    const selectedCount = selected.reduce((sum, r) => sum + r.count, 0);
    const mergeOptions = selected.filter(r => r.source).map(r => r.source as string);

    const header = (
        <div className="flex justify-content-between align-items-center flex-wrap gap-2">
            <Button
                label={selected.length === 1 ? "Nimeä uudelleen" : `Yhdistä valitut (${selected.length})`}
                icon="pi pi-link"
                disabled={selected.length === 0}
                onClick={openMerge}
            />
            <IconField iconPosition="left">
                <InputIcon className="pi pi-search" />
                <InputText value={filter} onChange={e => setFilter(e.target.value)} placeholder="Hae lähdettä..." />
            </IconField>
        </div>
    );

    return (
        <div>
            <Toast ref={toastRef} />
            <p className="mt-0 mb-3 text-color-secondary">
                Valitse yksi lähde nimetäksesi sen uudelleen tai useampi yhdistääksesi ne.
                Poisto poistaa kaikki lähteen linkit.
            </p>
            <DataTable
                value={data}
                dataKey="key"
                loading={isLoading}
                header={header}
                size="small"
                stripedRows
                selectionMode="checkbox"
                selection={selected}
                onSelectionChange={e => setSelected(e.value as SourceRow[])}
                expandedRows={expandedRows}
                onRowToggle={e => setExpandedRows(e.data)}
                rowExpansionTemplate={(row: SourceRow) => <SourceLinks source={row.source} />}
                globalFilter={filter}
                globalFilterFields={["source"]}
                sortField="count"
                sortOrder={-1}
                paginator
                rows={25}
                emptyMessage="Ei lähteitä."
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column expander style={{ width: "3rem" }} />
                <Column field="source" header="Lähde" sortable
                    body={(row: SourceRow) => row.source ?? <i className="text-color-secondary">{sourceLabel(null)}</i>} />
                <Column field="count" header="Linkkejä" sortable style={{ width: "8rem" }} />
                <Column field="works" header="Teoksia" sortable style={{ width: "8rem" }} />
                <Column style={{ width: "4rem" }}
                    body={(row: SourceRow) => (
                        <Button icon="pi pi-trash" rounded text severity="danger"
                            aria-label={`Poista lähde ${sourceLabel(row.source)}`}
                            tooltip="Poista lähde ja sen linkit" tooltipOptions={{ position: "left" }}
                            onClick={() => setToDelete(row)} />
                    )} />
            </DataTable>

            <Dialog
                header={selected.length === 1 ? "Nimeä lähde uudelleen" : "Yhdistä lähteet"}
                visible={mergeVisible}
                onHide={() => setMergeVisible(false)}
                style={{ width: "32rem" }}
                breakpoints={{ "640px": "100vw" }}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Peruuta" icon="pi pi-times" severity="secondary"
                            onClick={() => setMergeVisible(false)} />
                        <Button label={selected.length === 1 ? "Nimeä" : "Yhdistä"} icon="pi pi-check"
                            loading={busy} disabled={!target.trim()} onClick={merge} />
                    </div>
                }
            >
                <p className="mt-0">
                    {selected.map(r => sourceLabel(r.source)).join(", ")} ({selectedCount} linkkiä)
                </p>
                <label htmlFor="merge-target" className="font-bold block mb-2">Uusi lähde</label>
                {/* Pick one of the selected names or type a new one. (An editable
                    Dropdown would put inputId on a hidden input, leaving the
                    typed-in box without its label.) */}
                <AutoComplete
                    inputId="merge-target"
                    value={target}
                    suggestions={suggestions}
                    completeMethod={e => setSuggestions(e.query
                        ? mergeOptions.filter(o => o.toLowerCase().includes(e.query.toLowerCase()))
                        : mergeOptions)}
                    dropdown
                    onChange={e => setTarget(e.value ?? "")}
                    placeholder="Valitse tai kirjoita lähde"
                    className="w-full"
                    inputClassName="w-full"
                />
            </Dialog>

            <ConfirmDialog
                visible={toDelete !== null}
                onHide={() => setToDelete(null)}
                header="Vahvista poisto"
                message={toDelete &&
                    `Poistetaanko lähde "${sourceLabel(toDelete.source)}" ja sen ${toDelete.count} linkkiä ` +
                    `${toDelete.works} teoksesta?`}
                icon="pi pi-exclamation-triangle"
                acceptLabel="Poista"
                rejectLabel="Peruuta"
                acceptClassName="p-button-danger"
                accept={() => toDelete && remove(toDelete)}
                reject={() => setToDelete(null)}
            />
        </div>
    );
};
