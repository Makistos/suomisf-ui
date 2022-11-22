import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { FilterMatchMode } from "primereact/api";
import { DataTable } from 'primereact/datatable';
import { Column, ColumnFilterElementType } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { DataTablePFSEvent } from 'primereact/datatable';

import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { Person } from "../types";
import type { Country } from '../../../types/country';

const baseURL = 'people';

export const PeoplePage = () => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [people, setPeople]: [Person[], (people: Person[]) => void] = React.useState<Person[]>([]);
    const [countries, setCountries]: [Country[], (countries: Country[]) => void] = React.useState<Country[]>([]);
    //const [roles, setRoles]: [string[], (roles: string[]) => void] = React.useState<string[]>([]);
    const [totalRecords, setTotalRecords] = React.useState(0);
    const [lazyParams, setLazyParams]: [DataTablePFSEvent, (lazyParams: DataTablePFSEvent) => void] = React.useState<DataTablePFSEvent>({
        first: 0,
        rows: 50,
        page: 0,
        sortField: "name",
        sortOrder: 1,
        multiSortMeta: null,
        filters: {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            name: { value: null, matchMode: FilterMatchMode.CONTAINS },
            dob: { value: null, matchMode: FilterMatchMode.EQUALS },
            dod: { value: null, matchMode: FilterMatchMode.EQUALS },
            nationality: { value: null, matchMode: FilterMatchMode.EQUALS },
            workcount: { value: null, matchMode: FilterMatchMode.EQUALS },
            storycount: { value: null, matchMode: FilterMatchMode.EQUALS },
            roles: { value: null, matchMode: FilterMatchMode.IN }
        }
    });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const queryParams = (params: any, prefix = "") => {
            let retval: string[] = [];
            if (params) {
                if (prefix !== "") {
                    prefix = prefix + '_';
                }
                Object.keys(params).map(k => {
                    if (typeof params[k] === "object" && params[k] !== null) {
                        let l = queryParams(params[k], prefix + k);
                        l.map(value => retval.push(value));
                        ///console.log(retval);
                    } else {
                        retval.push(prefix + encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
                    }
                    return true;
                })
            }
            return retval;
        }

        async function getPeople() {
            const url = baseURL + "?" +
                queryParams(lazyParams).join('&');
            console.log(url);
            try {
                //console.log(url);
                setLoading(true);
                const response = await getApiContent(url, user);
                setTotalRecords(response.data.totalRecords);
                setPeople(response.data.people);
                //getRoles(response.data.people);
                setLoading(false);
            }
            catch (e) {
                console.error(e);
            }
        }
        async function getCountries() {
            const url = 'countries'
            try {
                const response = await getApiContent(url, user);
                setCountries(response.data);
            }
            catch (e) {
                console.error(e);
            }
        }
        getCountries();
        getPeople();
    }, [lazyParams]) // eslint-disable-line react-hooks/exhaustive-deps

    const onPage = (event: DataTablePFSEvent) => {
        setLazyParams(event);
    }

    const onSort = (event: DataTablePFSEvent) => {
        setLazyParams(event);
    }
    const onFilter = (event: DataTablePFSEvent) => {
        event['first'] = 0;
        setLazyParams(event);
    }

    const roleTemplate = (rowData: Person) => {
        return rowData.roles.join(", ");
    };

    const nameTemplate = (rowData: Person) => {
        return (
            <Link to={`/people/${rowData.id}`} key={rowData.id}>
                {rowData.name}
            </Link>
        )
    }

    const nationalityFilterTemplate: ColumnFilterElementType = (options) => {
        if (options === null || options === undefined) {
            return <div></div>
        }
        const names = countries.map((country) => country.name)
        return (
            <Dropdown value={options.value} options={names}
                onChange={(e) => options.filterApplyCallback(e.value)}
                className="p-column-filter" showClear
            />
        );
    }

    if (!people) return null;

    return (
        <div>
            <h1 className='title'>Henkilöluettelo</h1>
            <p>Henkilöitä yhteensä {totalRecords}.</p>
            {people !== null && people !== undefined ? (
                <DataTable value={people}
                    first={lazyParams.first}
                    rows={lazyParams.rows}
                    totalRecords={totalRecords}
                    paginator
                    pageLinkSize={10}
                    lazy
                    onPage={onPage}
                    onSort={onSort}
                    sortOrder={1}
                    sortField={lazyParams.sortField}
                    onFilter={onFilter}
                    filters={lazyParams.filters}
                    size="small"
                    globalFilterFields={["name", "dob", "dod", "nationalityname", "workcount", "storycount", "roles"]}
                    responsiveLayout="scroll"
                    dataKey="id"
                    filterDisplay="row"
                    emptyMessage="Henkilöitä ei löytynyt"
                    loading={loading}
                >
                    <Column field="name" header="Nimi" body={nameTemplate}
                        filter
                        filterPlaceholder="Etsi nimellä"
                        sortable>
                    </Column>
                    <Column field="dob" header="Synt"
                        filter
                        filterPlaceholder="Vuosi"
                        dataType="numeric"
                        sortable>
                    </Column>
                    <Column field="dod" header="Kuoli"
                        filter
                        filterPlaceholder="Vuosi"
                        dataType="numeric"
                        sortable>
                    </Column>
                    <Column field="nationality" header="Kansallisuus"
                        filter
                        filterPlaceholder="Kansallisuus"
                        filterElement={nationalityFilterTemplate}
                        sortable>
                        showFilterMatchModes={false}
                    </Column>
                    <Column field="workcount" header="Teoksia"
                        dataType="numeric"
                        sortable
                    >
                    </Column>
                    <Column field="storycount" header="Novelleja"
                        dataType="numeric"
                    >
                    </Column>
                    <Column field="roles" header="Roolit" body={roleTemplate}
                    >
                    </Column>
                </DataTable>
            ) : (
                <p>Haetaan tietoja...</p>
            )
            }
        </div>
    )
}