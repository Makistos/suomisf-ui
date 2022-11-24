import React, { useState, useMemo, useEffect } from "react";
import { Link } from 'react-router-dom';
import { useQuery } from "react-query";

import { DataTable } from "primereact/datatable";
import { ProgressSpinner } from "primereact/progressspinner";
import { Column } from "primereact/column";

import { Pubseries } from "../types";
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";

export const PubseriesListPage = () => {
    /**
     * Page that lists all the publisher series in the system in a table.
     */
    const user = getCurrenUser();

    // const [pubseriesList, setPubseriesList]: [Pubseries[] | null,
    //     (pubseriesList: Pubseries[]) => void] = useState<Pubseries[] | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPubseriesList = async () => {
        const url = 'pubseries';
        const data = await getApiContent(url, user).then(response => {
            setLoading(false);
            return response.data;
        })
            .catch(error => console.log(error));
        return data;
    }
    const pubseriesList =
        useQuery("pubserieslist", () => fetchPubseriesList(),
            {
                staleTime: Infinity,
                cacheTime: Infinity,
                //onSuccess: () => { console.log("updated"); setLoading(false); },
                //onSettled: () => { console.log("settled"); setLoading(false); }
            }).data;

    // useEffect(() => {
    //     async function getPubseriesList() {
    //         const url = 'pubseries';
    //         try {
    //             const response = await getApiContent(url, user);
    //             setPubseriesList(response.data);
    //             setLoading(false);
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     }
    //     getPubseriesList();
    // }, [user])

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
            {
                false ? (
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>
                )
                    : (
                        pubseriesList &&
                        <div>
                            <h1 className="title">Kustantajien sarjat</h1>
                            <p>Sarjoja yhteensä: {pubseriesList?.length}</p>
                            <DataTable value={pubseriesList}
                                size="small"
                                dataKey="id"
                                emptyMessage="Sarjoja ei löytynyt"
                                loading={loading}
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
                        </div>
                    )
            }
        </main>
    )
}