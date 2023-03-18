import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';

import { DataTable } from "primereact/datatable";
import { ProgressSpinner } from "primereact/progressspinner";
import { Column } from "primereact/column";

import { Bookseries } from "../types";
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { useQuery } from "@tanstack/react-query";
import { useDocumentTitle } from '../../../components/document-title';

export const BookseriesListPage = () => {
    /**
     * Page that lists all bookseries in in the system in a table.
     */
    const user = getCurrenUser();
    const [documentTitle, setDocumentTitle] = useDocumentTitle("Kirjasarjat");

    const fetchBookseries = async (): Promise<Bookseries[]> => {
        const url = 'bookseries';
        const data = await getApiContent(url, user).then(response => {
            return response.data;
        })
        return data;
    }

    const { isLoading, data } =
        useQuery({
            queryKey: ["bookserieslist"],
            queryFn: () => fetchBookseries()
        });

    useEffect(() => {
        if (data !== undefined)
            setDocumentTitle("Kirjasarjat");
    }, [data])

    const nameTemplate = (rowData: Bookseries) => {
        return (
            <Link to={`/bookseries/${rowData.id}`} key={rowData.id}>
                {rowData.name}
            </Link>
        )
    }
    const workCountTemplate = (rowData: Bookseries) => {
        if (rowData.works) {
            return rowData.works.length;
        }
        return 0;
    }

    const authorTemplate = (rowData: Bookseries) => {
        const authors = rowData.works.map(work => work.author_str);
        return authors
            .filter((author, index) => authors.indexOf(author) === index)
            .join(" / ")
    }

    return (
        <main className="all-content">
            {
                <div>
                    <h1 className="title">Kirjasarjat</h1>
                    <p>Kirjasarjoja yhteensä: {data?.length}</p>
                    <DataTable value={data}
                        size="small"
                        dataKey="id"
                        emptyMessage="Kirjasarjoja ei löytynyt"
                        loading={isLoading}
                        sortField="name"
                        sortOrder={1}
                    >
                        <Column field="name" header="Nimi"
                            body={nameTemplate}
                            filter sortable />
                        <Column field="orig_name" header="Alkup. nimi" filter sortable />
                        <Column field="authors" header="Kirjoittaja(t)"
                            body={authorTemplate}
                            sortable
                        />
                        <Column field="works.length" header="Teoksia"
                            body={workCountTemplate} dataType="numeric"
                            sortable filter
                        />
                    </DataTable>
                </div>
            }
        </main>
    )
}