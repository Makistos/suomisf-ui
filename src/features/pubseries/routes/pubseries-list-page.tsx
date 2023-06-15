import React, { useEffect } from "react";
import { Link } from 'react-router-dom';

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";

import { Pubseries } from "../types";
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { useDocumentTitle } from '../../../components/document-title';

export const PubseriesListPage = () => {
    /**
     * Page that lists all the publisher series in the system in a table.
     */
    const user = getCurrenUser();
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");

    useEffect(() => {
        setDocumentTitle("Kustantajien sarjat");
    }, [])

    const fetchPubseriesList = async (): Promise<Pubseries[]> => {
        const url = 'pubseries';
        const data = await getApiContent(url, user).then(response => {
            return response.data;
        })
            .catch(error => console.log(error));
        return data;
    }
    const { isLoading, data } =
        useQuery({
            queryKey: ["pubserieslist"],
            queryFn: () => fetchPubseriesList()
        });

    const nameTemplate = (rowData: Pubseries) => {
        return (
            <Link to={`/pubseries/${rowData.id}`} key={rowData.id}>
                {rowData.name}
            </Link>
        )
    }

    const publisherTemplate = (rowData: Pubseries) => {
        if (rowData.publisher) {
            return (
                <Link to={`/publishers/${rowData.publisher.id}`} key={rowData.publisher.id}>
                    {rowData.publisher.name}
                </Link>
            )
        }
        return "";
    }
    return (
        <main className="all-content">
            <div>
                <h1 className="title">Kustantajien sarjat</h1>
                {isLoading ?
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>
                    :
                    <>
                        <p>Sarjoja yhteensä: {data?.length}</p>
                        <DataTable value={data}
                            size="small"
                            dataKey="id"
                            emptyMessage="Sarjoja ei löytynyt"
                            loading={isLoading}
                        >
                            <Column field="name" header="Nimi"
                                body={nameTemplate}
                                filter sortable />
                            <Column field="publisher.name" header="Kustantaja"
                                body={publisherTemplate}
                                sortable filter
                            />
                            <Column field="editions.length" header="Kirjoja"
                                filter sortable
                                dataType="numeric" />
                        </DataTable>
                    </>
                }
            </div>
        </main>
    )
}