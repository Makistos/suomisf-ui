import { useState, useRef } from 'react';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { useQuery } from '@tanstack/react-query';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';

interface PageviewRow {
    id: number;
    created_at: string | null;
    ip: string;
    path: string;
    city: string | null;
    country: string | null;
    browser: string | null;
    os: string | null;
    device_type: string | null;
}

interface PageviewResponse {
    rows: PageviewRow[];
    total: number;
}

interface Filters {
    ip: string;
    path: string;
    city: string;
    country: string;
    browser: string;
    os: string;
    device_type: string;
}

const EMPTY_FILTERS: Filters = {
    ip: '', path: '', city: '', country: '', browser: '', os: '', device_type: '',
};

export const PageviewTable = () => {
    const user = getCurrenUser();
    const [first, setFirst] = useState(0);
    const [perPage, setPerPage] = useState(50);
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [pending, setPending] = useState<Filters>(EMPTY_FILTERS);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const page = Math.floor(first / perPage);

    const queryParams = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    Object.entries(filters).forEach(([k, v]) => { if (v) queryParams.set(k, v); });

    const { data, isLoading } = useQuery<PageviewResponse>({
        queryKey: ['stats', 'visitors', 'pageviews', page, perPage, filters],
        queryFn: async () =>
            (await getApiContent(`stats/visitors/pageviews?${queryParams}`, user)).data,
    });

    const updateFilter = (field: keyof Filters, value: string) => {
        const next = { ...pending, [field]: value };
        setPending(next);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
            setFilters(next);
            setFirst(0);
        }, 400);
    };

    const onPage = (e: DataTablePageEvent) => {
        setFirst(e.first);
        setPerPage(e.rows);
    };

    const filterInput = (field: keyof Filters) => (
        <InputText
            value={pending[field]}
            onChange={e => updateFilter(field, e.target.value)}
            placeholder="Suodata…"
            className="w-full"
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
        />
    );

    const dateBody = (row: PageviewRow) =>
        row.created_at
            ? new Date(row.created_at).toLocaleString('fi-FI', { dateStyle: 'short', timeStyle: 'short' })
            : '';

    return (
        <DataTable
            value={data?.rows ?? []}
            lazy
            paginator
            rows={perPage}
            rowsPerPageOptions={[25, 50, 100]}
            totalRecords={data?.total ?? 0}
            first={first}
            onPage={onPage}
            loading={isLoading}
            filterDisplay="row"
            scrollable
            scrollHeight="600px"
            size="small"
            emptyMessage="Ei tuloksia"
            stripedRows
        >
            <Column field="created_at" header="Aika" body={dateBody} style={{ minWidth: '9rem' }} />
            <Column
                field="ip" header="IP"
                filter filterElement={filterInput('ip')} showFilterMenu={false}
                style={{ minWidth: '9rem' }}
            />
            <Column
                field="path" header="Sivu"
                filter filterElement={filterInput('path')} showFilterMenu={false}
                style={{ minWidth: '12rem' }}
            />
            <Column
                field="city" header="Kaupunki"
                filter filterElement={filterInput('city')} showFilterMenu={false}
                style={{ minWidth: '8rem' }}
            />
            <Column
                field="country" header="Maa"
                filter filterElement={filterInput('country')} showFilterMenu={false}
                style={{ minWidth: '5rem' }}
            />
            <Column
                field="browser" header="Selain"
                filter filterElement={filterInput('browser')} showFilterMenu={false}
                style={{ minWidth: '9rem' }}
            />
            <Column
                field="os" header="OS"
                filter filterElement={filterInput('os')} showFilterMenu={false}
                style={{ minWidth: '8rem' }}
            />
            <Column
                field="device_type" header="Laite"
                filter filterElement={filterInput('device_type')} showFilterMenu={false}
                style={{ minWidth: '7rem' }}
            />
        </DataTable>
    );
};
