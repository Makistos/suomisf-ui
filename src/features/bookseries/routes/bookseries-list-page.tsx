import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';

import { DataTable } from "primereact/datatable";
import { ProgressSpinner } from "primereact/progressspinner";
import { Column } from "primereact/column";

import { IBookseries } from "../types";
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";

export const BookseriesListPage = () => {
    /**
     * Page that lists all bookseries in in the system in a table.
     */
    const user = getCurrenUser();

    const [bookseriesList, setBookseriesList]: [IBookseries[] | null,
        (bookseriesList: IBookseries[]) => void] = useState<IBookseries[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getBookseriesList() {
            const url = 'bookseries';
            try {
                const response = await getApiContent(url, user);
                setBookseriesList(response.data);
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        }
        getBookseriesList();
    }, [user])

    const nameTemplate = (rowData: IBookseries) => {
        return (
            <Link to={`/bookseries/${rowData.id}`} key={rowData.id}>
                {rowData.name}
            </Link>
        )
    }
    const workCountTemplate = (rowData: IBookseries) => {
        if (rowData.works) {
            return rowData.works.length;
        }
        return 0;
    }

    return (
        <main className="all-content">
            {
                loading ? (
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>
                )
                    : (
                        bookseriesList &&
                        <div>
                            <h1 className="title">Kirjasarjat</h1>
                            <p>Kirjasarjoja yhteensä: {bookseriesList?.length}</p>
                            <DataTable value={bookseriesList}
                                size="small"
                                dataKey="id"
                                emptyMessage="Kirjasarjoja ei löytynyt"
                                loading={loading}
                            >
                                <Column field="name" header="Nimi"
                                    body={nameTemplate}
                                    filter sortable />
                                <Column field="orig_name" header="Alkup. nimi" filter sortable />
                                <Column field="works.length" header="Teoksia"
                                    body={workCountTemplate} dataType="numeric"
                                    sortable filter
                                />
                            </DataTable>
                        </div>
                    )
            }
        </main>
    )
}