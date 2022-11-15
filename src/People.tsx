import React from 'react';
import { Link } from 'react-router-dom';
import { getApiContent } from './services/user-service';
import { getCurrenUser } from './services/auth-service';
import type { IPerson } from './feature/Person/Person';
import type { ICountry } from './components/Country';
import { FilterMatchMode } from "primereact/api";
import { DataTable } from 'primereact/datatable';
import { Column, ColumnFilterElementType } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { DataTablePFSEvent } from 'primereact/datatable';

const baseURL = 'people';

export const People = () => {
    const user = getCurrenUser();
    const [people, setPeople]: [IPerson[], (people: IPerson[]) => void] = React.useState<IPerson[]>([]);
    const [countries, setCountries]: [ICountry[], (countries: ICountry[]) => void] = React.useState<ICountry[]>([]);
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
        // const getRoles = (people: IPerson[]) => {
        //     let _roles: string[] = [];
        //     for (let i = 0; i < people.length; i++) {
        //         for (let j = 0; j < people[i].roles.length; j++) {
        //             _roles.push(people[i].roles[j]);
        //         }
        //     }
        //     let _unique = new Set(_roles);
        //     setRoles(Array.from(_unique));
        // }
        async function getPeople() {
            const url = baseURL + "?" +
                queryParams(lazyParams).join('&');

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
            // for (let i = 0; i < people.length; i++) {
            //     let country = people[i].nationalityname;
            //     if (country !== null && country !== undefined) {
            //         _countries.push(country);
            //     }
            // }
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

    /*const onGlobalFilterChange = (e: React.ChangeEventHandler) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters["global"].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };*/
    /*
    const renderHeader1 = () => {
        return (
            <div className="flex justify-content-between">
                <Button type="button" icon="pi pi-filter-slash" label="Tyhjennä" className="p-button-outlined" onClick={clearFilter1} />
            </div>
        )
    }*/

    const roleTemplate = (rowData: IPerson) => {
        return rowData.roles.join(", ");
    };

    const nameTemplate = (rowData: IPerson) => {
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

    // const shortStoryFilterTemplate: ColumnFilterElementType = (options) => {
    //     if (options === null || options === undefined) {
    //         return <div></div>
    //     }
    //     return (
    //         <InputNumber value={options.value} mode='decimal'
    //             onChange={(e) => options.filterApplyCallback(e.value, options.index)}
    //             className="p-column-filter"
    //             placeholder="Lukumäärä"
    //         />
    //     );

    // }
    // const roleFilterTemplate: ColumnFilterElementType = (options) => {
    //     if (options === null || options === undefined) {
    //         return <div></div>
    //     }
    //     return (
    //         <Dropdown value={options.value} options={roles}
    //             onChange={(e) => options.filterApplyCallback(e.value)}
    //             className="p-column-filter" showClear
    //         />
    //     );
    // }
    // const nationalityBodyTemplate = (rowData: IPerson) => {

    // }

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