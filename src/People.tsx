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

const baseURL = 'people';

export const People = () => {
    const user = getCurrenUser();
    const [people, setPeople]: [IPerson[], (people: IPerson[]) => void] = React.useState<IPerson[]>([]);
    const [countries, setCountries]: [ICountry[], (countries: ICountry[]) => void] = React.useState<ICountry[]>([]);
    const [filters, setFilters] = React.useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        dob: { value: null, matchMode: FilterMatchMode.EQUALS },
        dod: { value: null, matchMode: FilterMatchMode.EQUALS },
        nationality: { value: null, matchMode: FilterMatchMode.EQUALS },
        roles: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = React.useState("");

    const [sortField, setSortField] = React.useState("name")
    const [sortOrder, setSortOrder] = React.useState(0);

    React.useEffect(() => {
        async function getPeople() {
            let url = baseURL;
            try {
                const response = await getApiContent(url, user);
                setPeople(response.data);

            }
            catch (e) {
                console.error(e);
            }
        }
        async function getCountries() {
            let url = "countries";
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
            }
        }
        getCountries();
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

    const nationalityBodyTemplate = (rowData: IPerson) => {

    }

    if (!people) return null;

    return (
        <div>
            {people !== null && people !== undefined ? (
                <DataTable value={people}
                    sortField="name"
                    sortOrder={1}
                    size="small"
                    responsiveLayout="scroll"
                    dataKey="id"
                    filters={filters}
                    filterDisplay="row"
                    rows={50}
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
                        sortable>
                    </Column>
                    <Column field="roles" header="Roolit" body={roleTemplate}
                        filter
                        filterPlaceholder="Rooli"
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