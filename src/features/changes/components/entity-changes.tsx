import { useMemo, useEffect, useState } from "react"
import { getCurrenUser } from "@services/auth-service";
import { LogItem } from "../types";
import { getWorkChanges } from "@api/work/get-work-changes";
import { Fieldset } from "primereact/fieldset";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { deleteLogItem } from "@api/changed/delete-log-item";
import { isAdmin } from "@features/user";
import { HttpStatusResponse } from "@services/user-service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "primereact/skeleton";
import { ProgressSpinner } from "primereact/progressspinner";
import { getPersonChanges } from "@api/people/get-person-changes";

interface WorkChangesProps {
    entityId: number,
    entity: "work" | "person"
}

type CombinedChanges = {
    date: string,
    target: string,
    action: string,
    author: string,
    rows: SubChanges[]
}

type SubChanges = {
    id: number,
    fieldname: string,
    oldvalue: string,
}

export const EntityChanges = ({ entityId, entity }: WorkChangesProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | LogItem[]>([]);

    const formatDate = (date: string) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }
        const dObj = new Date(date);
        return dObj.toLocaleDateString('fi-FI', options);
    }

    const { isLoading, data } = useQuery({
        queryKey: ["changes", entity, entityId],
        queryFn: () =>
            entity === "work" ?
                getWorkChanges(entityId, user).then(d => groupedChanges(d)) :
                getPersonChanges(entityId, user).then(d => groupedChanges(d))

    })

    const groupedChanges = (data: LogItem[]): CombinedChanges[] => {
        let retval: CombinedChanges[] = [];
        for (const item of data) {
            const formattedDate = formatDate(item.date);
            let item_idx = -1;
            for (let idx = 0; idx < retval.length; idx++) {
                if ((retval[idx].date === formattedDate && retval[idx].target == item.table_name &&
                    retval[idx].action === item.action &&
                    (retval[idx].author === item.user?.name || (retval[idx].author == '<tyhjä>' && item.user == null)))) {
                    item_idx = idx;
                    break;
                }
            }
            if (item_idx === -1) {
                const curr_item = { date: formattedDate, target: item.table_name, action: item.action, author: item.user ? item.user.name : '<tyhjä>', rows: [] };
                retval.push(curr_item);
                item_idx = retval.length - 1;
            }
            retval[item_idx].rows.push({
                id: item.id,
                fieldname: item.field_name ? item.field_name : '<tyhjä>',
                oldvalue: item.old_value ? item.old_value : '<tyhjä>'
            });
        }
        return retval;
    }

    const rowExpansionTemplate = (data: CombinedChanges) => {
        return (
            <div className="pl-8">
                <DataTable value={data.rows} emptyMessage="Ei muutoksia">
                    <Column field="fieldname" header="Kenttä" />
                    <Column field="oldvalue" header="Vanha arvo" />
                    <Column field="remove" header="Poista" body={removeButtonTemplate}
                        hidden={isAdmin(user) ? false : true} />
                </DataTable>
            </div>
        )
    }

    const queryClient = useQueryClient();

    const { mutate } = useMutation({
        mutationFn: (id: number) => deleteLogItem(id),
        onSuccess: (data: HttpStatusResponse) => {
            if (data.status === 200) {
                queryClient.invalidateQueries({ queryKey: ['changes', entity, entityId] });
            }
        },
        onError: (error: any) => {
            console.log(error.message);
        }

    })
    const deleteItem = (id: number) => {
        if (data === undefined) return;
        mutate(id);
        for (let idx = 0; idx < data.length; idx++) {
            for (let idx2 = 0; idx2 < data[idx].rows.length; idx2++) {
                if (data[idx].rows[idx2].id === id) {
                    data[idx].rows.splice(idx2, 1);
                }
            }
        }
    }
    const removeButtonTemplate = (data: SubChanges) => {
        return (
            <>
                <Button icon="pi pi-trash" onClick={() => deleteItem(data.id)} />
            </>
        )
    }

    const allowExpansion = (data: CombinedChanges) => {
        return data.action === "Päivitys";
    }

    console.log(data)
    return (
        <>
            {
                isLoading ?
                    <Skeleton />
                    :
                    <DataTable value={data} emptyMessage="Ei muutoksia"
                        size="small"
                        rowExpansionTemplate={rowExpansionTemplate}
                        expandedRows={expandedRows} onRowToggle={(e) => setExpandedRows(e.data)}>
                        <Column expander={allowExpansion} style={{ width: '5rem' }} />
                        <Column field="target" header="Kohde" />
                        <Column field="date" header="Pvm" />
                        <Column field="action" header="Muutos" />
                        <Column field="author" header="Muokkaaja" />
                    </DataTable>
            }
        </>
    )
}