import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Tooltip } from "primereact/tooltip";

import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";

interface ReadBook {
    work_id: number;
    opinion: number | null;
    title: string;
    author_str: string;
    pubyear: number;
}

interface ReadBooksProps {
    userId: string;
}

// opinion value -> icon + tooltip for the "Arvio" column.
const opinionMeta: Record<number, { icon: string; label: string; color: string }> = {
    [-1]: { icon: "pi pi-thumbs-down", label: "En pitänyt", color: "var(--text-color-secondary)" },
    [0]: { icon: "pi pi-minus-circle", label: "Ihan ok", color: "var(--text-color-secondary)" },
    [1]: { icon: "pi pi-thumbs-up", label: "Pidin", color: "#eab308" },
};

export const ReadBooks = ({ userId }: ReadBooksProps) => {
    const user = getCurrenUser();
    const [globalFilterValue, setGlobalFilterValue] = useState("");
    const [filters, setFilters] = useState({
        global: { value: null as string | null, matchMode: FilterMatchMode.CONTAINS },
    });

    const { isLoading, data } = useQuery({
        queryKey: ["readBooks", userId],
        queryFn: async (): Promise<ReadBook[]> =>
            getApiContent(`works/read/${userId}`, user).then(response => response.data),
    });

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
        setGlobalFilterValue(value);
    };

    const authorTemplate = (row: ReadBook) => row.author_str;
    const titleTemplate = (row: ReadBook) => (
        <Link to={`/works/${row.work_id}`}>{row.title}</Link>
    );
    const yearTemplate = (row: ReadBook) => row.pubyear;
    const opinionTemplate = (row: ReadBook) => {
        if (row.opinion === null || row.opinion === undefined) return null;
        const meta = opinionMeta[row.opinion];
        if (!meta) return null;
        return (
            <i className={`${meta.icon} read-opinion-icon`}
                style={{ color: meta.color }}
                data-pr-tooltip={meta.label} />
        );
    };

    const header = (
        <div className="flex justify-content-between align-items-center flex-wrap gap-2">
            <span><b>Kirjoja: </b>{data?.length ?? 0}</span>
            <IconField iconPosition="left">
                <InputIcon className="pi pi-search" />
                <InputText value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    placeholder="Hakusana..." />
            </IconField>
        </div>
    );

    return (
        <div>
            <Tooltip target=".read-opinion-icon" position="top" />
            <DataTable value={data}
                size="small"
                loading={isLoading}
                filters={filters}
                globalFilterFields={["author_str", "title"]}
                header={header}
                emptyMessage="Ei luettuja teoksia"
                paginator
                rows={50}
                rowsPerPageOptions={[25, 50, 100]}
                sortField="author_str"
                sortOrder={1}>
                <Column field="author_str" header="Tekijä"
                    body={authorTemplate} sortable />
                <Column field="title" header="Nimi"
                    body={titleTemplate} sortable />
                <Column field="pubyear" header="Vuosi"
                    body={yearTemplate} sortable />
                <Column field="opinion" header="Arvio"
                    body={opinionTemplate} sortable
                    style={{ width: "5rem", textAlign: "center" }} />
            </DataTable>
        </div>
    );
};
