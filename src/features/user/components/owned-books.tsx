import { DataTable, DataTableRowDataArray } from "primereact/datatable"
import { Column } from "primereact/column"
import { OwnedBook } from "@features/edition"
import { getApiContent } from "@services/user-service"
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import { FilterMatchMode } from "primereact/api"
import { useRef, useState } from "react"
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Rating } from "primereact/rating"
import { Button } from "primereact/button"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { MultiSelect, MultiSelectChangeEvent } from "primereact/multiselect"

interface OwnedBooksProps {
    userId: string,
    listType: string
}

interface Col {
    field: string
    header: string
    show: boolean
}

export const OwnedBooks = ({ userId, listType }: OwnedBooksProps) => {
    // @ts-ignore
    const dt = useRef<DataTable>(null);
    const [renderedItems, setRenderedItems] = useState<OwnedBook[]>([])
    const [cols, setCols] = useState<Col[]>([
        { field: 'author_str', header: 'Tekijä', show: true },
        { field: 'title', header: 'Nimi', show: true },
        { field: 'pubyear', header: 'Vuosi', show: true },
        { field: 'publisher_name', header: 'Kustantaja', show: false },
        { field: 'version', header: 'Laitos', show: true },
        { field: 'editionnum', header: 'Painos', show: true },
        { field: 'value', header: 'Kunto', show: true },
        { field: 'description', header: 'Kuvaus', show: true }
    ])
    const [selectedColumns, setSelectedColumns] = useState(cols.filter(col => col.show === true).map(col => col));

    console.log("Type:", listType)
    //console.log(selectedColumns)

    const exportColumns = cols.filter(col => col.show === true)
        .map(col => ({ title: col.header, dataKey: col.field }))

    const getOwnedBooks = async (userId: string): Promise<OwnedBook[]> => {
        if (listType === "owned") {
            return await getApiContent(`editions/owned/${userId}`, null).then(response => response.data);
        }
        return await getApiContent(`editions/wishlist/${userId}`, null).then(response => response.data);
    }
    const { isLoading, data } = useQuery({
        queryKey: ['ownedBooks', userId],
        queryFn: () => getOwnedBooks(userId),
    })

    const exportCSV = (selectionOnly: boolean) => {
        dt.current.exportCSV({ selectionOnly });
    }

    const exportPDF = () => {
        import('jspdf').then((jsPDF) => {
            import('jspdf-autotable').then((autoTableModule) => {
                const doc = new jsPDF.default('l', 'pt', 'a4');

                // Call the imported function, not doc.autoTable
                autoTableModule.default(doc, {
                    columns: exportColumns,
                    body: renderedItems.length > 0 ? renderedItems : data,
                });

                doc.save('editions.pdf');
            });
        });
    };

    // const exportPDF = () => {
    //     import('jspdf').then((jsPDF) => {

    //         import('jspdf-autotable').then((x) => {

    //             const doc = new jsPDF.default('l', 'pt', 'a4');
    //             // @ts-ignore
    //             doc.autoTable(exportColumns, renderedItems.length > 0 ? renderedItems : data);
    //             doc.save('editions.pdf');
    //         })
    //     });
    // }

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    const onColumnSelect = (e: MultiSelectChangeEvent) => {
        const selected = e.value;
        const _cols = cols.map(col => ({ ...col, show: selected.includes(col.field) ? !col.show : col.show }));
        setCols(_cols);
        //let _cols = cols.filter(col => selectedColumns.includes(col.field));
        setSelectedColumns(cols.filter(col => col.show === true).map(col => col));
    }

    const [globalFilterValue, setGlobalFilterValue] = useState('');

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };

        // @ts-ignore
        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const renderHeader = () => {
        return (
            <div>
                <div className="grid justify-content-end">
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Hakusana..." />
                    </IconField>
                </div>
                <div className="grid">
                    <div className="grid col-6 justify-content-start gap-2 mt-3">
                        <b>Kirjoja: </b> {renderedItems.length > 0 ? renderedItems.length : data?.length}
                        {/* <MultiSelect value={selectedColumns}
                            onChange={(e) => onColumnSelect(e)}
                            options={cols}
                            optionLabel="header"
                            optionValue="field"
                        /> */}
                    </div>
                    <div className="grid col-6 justify-content-end gap-2 mt-3">
                        <Button type="button" icon="pi pi-file" rounded tooltip="CSV" data-pr-tooltip="CSV"
                            onClick={() => exportCSV(false)} />
                        {/* <Button type="button" icon="pi pi-file-excel" rounded tooltip="XLS" data-pr-tooltip="XLS" /> */}
                        <Button type="button" icon="pi pi-file-pdf" rounded tooltip="PDF" data-pr-tooltip="PDF"
                            onClick={() => exportPDF()} />
                    </div>
                </div>
            </div>
        );
    }
    const authorTemplate = (rowData: OwnedBook) => {
        return (rowData.author_str)
    }

    const titleTemplate = (rowData: OwnedBook) => {
        return (
            <Link to={`/works/${rowData.work_id}`}>{(rowData.title)} </Link>
        )
    }

    const publisherTemplate = (rowData: OwnedBook) => {
        if (rowData.publisher_name) {
            return (
                <Link to={`/publishers/${rowData.publisher_id}`}>{(rowData.publisher_name)} </Link>
            )
        }
        return null
    }
    const yearTemplate = (rowData: OwnedBook) => {
        return (rowData.pubyear)
    }

    const conditionTemplate = (rowData: OwnedBook) => {
        return rowData.condition_name;
        // if (rowData.value) {
        //     return (
        //         <Rating value={rowData.value} readOnly cancel={false}
        //             className="p-rating-condensed"
        //         />
        //     )
        // }
        // return null
    }

    const versionTemplate = (rowData: OwnedBook) => {
        return (rowData.version)
    }

    const header = renderHeader();
    // console.log(cols)
    // console.log(selectedColumns)
    //console.log(data)
    //console.log(renderedItems);
    return (
        <div>
            <DataTable value={data}
                ref={dt}
                size="small"
                loading={isLoading}
                filters={filters}
                globalFilterFields={["author_str", "title", "publisher_name", "description"]}
                header={header}
                emptyMessage="Ei kirjoja"
                onValueChange={(value: DataTableRowDataArray<any[]>) => {
                    setRenderedItems(value);
                }}
            >
                <Column field="author_str" header="Tekijä"
                    body={authorTemplate}
                    sortable
                    filterField="author_str"
                    sortField="author_str" />

                <Column field="title" header="Nimi"
                    body={titleTemplate}
                    sortable
                    filterField="title"
                    sortField="title"
                />

                {/* <Column field="publisher_name" header="Kustantaja"
                    body={publisherTemplate}
                    sortable
                    filter
                    sortField="publisher_name" /> */}

                <Column field="year" header="Vuosi"
                    body={yearTemplate}
                    sortable
                    sortField="pubyear"
                />

                <Column field="version" header="L"
                    body={versionTemplate} />

                <Column field="editionnum" header="P" />

                <Column field="value" header="K"
                    body={conditionTemplate}
                    sortable />

                <Column field="description" header="Kuvaus"
                    sortable
                    sortField="description" />
            </DataTable>
        </div>
    )
}