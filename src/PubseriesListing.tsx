import { DataTable } from "primereact/datatable";
import { ProgressSpinner } from "primereact/progressspinner";
import { useState, useEffect } from "react";
import { Pubseries } from "./features/pubseries/types";
import { getCurrenUser } from "./services/auth-service";
import { getApiContent } from "./services/user-service";
import { Column } from "primereact/column";
import { Link } from 'react-router-dom';

export const PubseriesListing = () => {
    /**
     * Page that lists all the publisher series in the system in a table.
     */
    const user = getCurrenUser();

    const [pubseriesList, setPubseriesList]: [Pubseries[] | null,
        (pubseriesList: Pubseries[]) => void] = useState<Pubseries[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getPubseriesList() {
            const url = 'pubseries';
            try {
                const response = await getApiContent(url, user);
                setPubseriesList(response.data);
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        }
        getPubseriesList();
    }, [user])

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
                loading ? (
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