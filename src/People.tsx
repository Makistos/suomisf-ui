import React from 'react';
import { Link } from 'react-router-dom';
import { getApiContent } from './services/user-service';
import { getCurrenUser } from './services/auth-service';
import { IPerson } from './Person';
import { ICountry } from './components/Country';
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { DataTable } from 'primereact/datatable';
import { Column, ColumnDataType, ColumnFilterElementType } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { DataTableSortOrderType, DataTablePFSEvent } from 'primereact/datatable';
import { InputText } from "primereact/inputtext";
import { InputNumber } from 'primereact/inputnumber';

const baseURL = 'people';

export const People = () => {
    const user = getCurrenUser();
    const [people, setPeople]: [IPerson[], (people: IPerson[]) => void] = React.useState<IPerson[]>([]);
    const [countries, setCountries]: [string[], (countries: string[]) => void] = React.useState<string[]>([]);
    const [roles, setRoles]: [string[], (roles: string[]) => void] = React.useState<string[]>([]);
    const [filters, setFilters] = React.useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        dob: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        dod: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        nationality: { value: null, matchMode: FilterMatchMode.EQUALS },
        work_count: { value: null, matchMode: FilterMatchMode.EQUALS },
        story_count: { value: null, matchMode: FilterMatchMode.EQUALS },
        roles: { value: null, matchMode: FilterMatchMode.EQUALS }
    });
    const [loading, setLoading] = React.useState(true);
    const [globalFilterValue, setGlobalFilterValue] = React.useState("");

    const [sortField, setSortField] = React.useState("name")
    const [sortOrder, setSortOrder] = React.useState(0);

    React.useEffect(() => {
        const getRoles = (people: IPerson[]) => {
            let _roles: string[] = [];
            for (let i = 0; i < people.length; i++) {
                for (let j = 0; j < people[i].roles.length; j++) {
                    _roles.push(people[i].roles[j]);
                }
            }
            let _unique = new Set(_roles);
            setRoles(Array.from(_unique));
        }
        async function getPeople() {
            let url = baseURL;
            try {
                const response = await getApiContent(url, user);
                setPeople(response.data);
                getRoles(response.data);
                getCountries(response.data);
                setLoading(false);
            }
            catch (e) {
                console.error(e);
            }
        }
        const getCountries = (people: IPerson[]) => {
            /*let url = "countries";
            try {
                const response = await getApiContent(url, user);
                let _countries: ICountry[] = []
                for (let i = 0; i < response.data.length; i++) {
                    _countries.push(response.data[i].name);
                }

                setCountries(_countries);
            }
            catch (e) {
                console.error(e);
            }*/
            let _countries: string[] = [];
            for (let i = 0; i < people.length; i++) {
                let country = people[i].nationality;
                if (country !== null && country !== undefined) {
                    _countries.push(country);
                }
            }
            setCountries(Array.from(new Set(_countries)).sort());
        }
        //getCountries();
        getPeople();
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    /*const onGlobalFilterChange = (e: React.ChangeEventHandler) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters["global"].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };*/

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
        return (
            <Dropdown value={options.value} options={countries}
                onChange={(e) => options.filterApplyCallback(e.value)}
                className="p-column-filter" showClear
            />
        );
    }

    const shortStoryFilterTemplate: ColumnFilterElementType = (options) => {
        if (options === null || options === undefined) {
            return <div></div>
        }
        return (
            <InputNumber value={options.value} mode='decimal'
                onChange={(e) => options.filterApplyCallback(e.value, options.index)}
                className="p-column-filter"
                placeholder="Lukumäärä"
            />
        );

    }
    const roleFilterTemplate: ColumnFilterElementType = (options) => {
        if (options === null || options === undefined) {
            return <div></div>
        }
        return (
            <Dropdown value={options.value} options={roles}
                onChange={(e) => options.filterApplyCallback(e.value)}
                className="p-column-filter" showClear
            />
        );
    }
    const nationalityBodyTemplate = (rowData: IPerson) => {

    }

    if (!people) return null;

    return (
        <div>
            <h1 className='title'>Henkilöluettelo</h1>
            {people !== null && people !== undefined ? (
                <DataTable value={people}
                    sortField="name"
                    sortOrder={1}
                    size="small"
                    globalFilterFields={["name", "dob", "dod", "nationality", "work_count", "story_count", "roles"]}
                    responsiveLayout="scroll"
                    dataKey="id"
                    filters={filters}
                    filterDisplay="menu"
                    rows={50}
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
                        sortable>
                    </Column>
                    <Column field="dod" header="Kuoli"
                        filter
                        filterPlaceholder="Vuosi"
                        sortable>
                    </Column>
                    <Column field="nationality" header="Kansallisuus"
                        filter
                        filterPlaceholder="Kansallisuus"
                        filterElement={nationalityFilterTemplate}
                        showFilterMatchModes={false}
                        sortable>
                    </Column>
                    <Column field="work_count" header="Teoksia"
                        filter
                        filterPlaceholder="Teoksia"
                        dataType="numeric"
                        filterElement={shortStoryFilterTemplate}
                        sortable>
                    </Column>
                    <Column field="story_count" header="Novelleja"
                        filter
                        filterPlaceholder="Novelleja"
                        dataType="numeric"
                        sortable
                        filterElement={shortStoryFilterTemplate}
                    >
                    </Column>
                    <Column field="roles" header="Roolit" body={roleTemplate}
                        filter
                        filterPlaceholder="Rooli"
                        filterElement={roleFilterTemplate}
                        showFilterMatchModes={false}
                        sortable>
                    </Column>
                </DataTable>
            ) : (
                <p>Haetaan tietoja...</p>
            )
            }
        </div>
    )
}