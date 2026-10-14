import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Tag } from "primereact/tag";

import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";

interface UserListItem {
    id: number;
    name: string;
    is_admin: boolean;
    owned: number;
    wishlist: number;
    read: number;
}

/**
 * All users with the size of their collection (owned and wished editions)
 * and reading list (read works). Each name links to the user's page.
 */
export const UsersPage = () => {
    const user = getCurrenUser();
    const [globalFilterValue, setGlobalFilterValue] = useState("");
    const [filters, setFilters] = useState({
        global: { value: null as string | null, matchMode: FilterMatchMode.CONTAINS },
    });

    const { isLoading, data } = useQuery({
        queryKey: ["users"],
        queryFn: async (): Promise<UserListItem[]> =>
            getApiContent("users", user).then(response => response.data),
    });

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
        setGlobalFilterValue(value);
    };

    const nameTemplate = (row: UserListItem) => (
        <Link to={`/users/${row.id}`}>{row.name}</Link>
    );
    const adminTemplate = (row: UserListItem) =>
        row.is_admin ? <Tag value="Ylläpitäjä" severity="info" /> : null;

    const header = (
        <div className="flex justify-content-between align-items-center flex-wrap gap-2">
            <span><b>Käyttäjiä: </b>{data?.length ?? 0}</span>
            <IconField iconPosition="left">
                <InputIcon className="pi pi-search" />
                <InputText value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    placeholder="Hae nimellä..."
                    aria-label="Hae käyttäjää nimellä" />
            </IconField>
        </div>
    );

    const numberStyle = { width: "7rem", textAlign: "right" as const };

    return (
        <main className="all-content">
            <h1 className="text-center">Käyttäjät</h1>
            <DataTable value={data}
                dataKey="id"
                size="small"
                loading={isLoading}
                filters={filters}
                globalFilterFields={["name"]}
                header={header}
                emptyMessage="Ei käyttäjiä"
                paginator
                rows={50}
                rowsPerPageOptions={[25, 50, 100]}
                alwaysShowPaginator={false}
                // Phones scroll the columns sideways instead of cutting them.
                scrollable
                removableSort>
                <Column field="name" header="Nimi" body={nameTemplate} sortable />
                <Column field="is_admin" header="Rooli" body={adminTemplate} sortable
                    style={{ width: "9rem" }} />
                <Column field="owned" header="Omistaa" sortable
                    headerTooltip="Omistetut painokset"
                    style={numberStyle} bodyStyle={numberStyle} />
                <Column field="wishlist" header="Toivelista" sortable
                    headerTooltip="Toivelistalla olevat painokset"
                    style={numberStyle} bodyStyle={numberStyle} />
                <Column field="read" header="Luettu" sortable
                    headerTooltip="Luetuiksi merkityt teokset"
                    style={numberStyle} bodyStyle={numberStyle} />
            </DataTable>
        </main>
    );
};
