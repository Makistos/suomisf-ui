import { DataTable } from "primereact/datatable";
import { ProgressSpinner } from "primereact/progressspinner";
import { useState, useEffect } from "react";
import { IPubseries } from "./components/Pubseries";
import { getCurrenUser } from "./services/auth-service";
import { getApiContent } from "./services/user-service";
import { Column } from "primereact/column";
import { Link } from 'react-router-dom';

export const PubseriesListing = () => {
    const user = getCurrenUser();

    const [pubseriesList, setPubseriesList]: [IPubseries[] | null,
        (pubseriesList: IPubseries[]) => void] = useState<IPubseries[] | null>(null);
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

    const nameTemplate = (rowData: IPubseries) => {
        return (
            <Link to={`/pubseries/${rowData.id}`} key={rowData.id}>
                {rowData.name}
            </Link>
        )
    }

    const publisherTemplate = (rowData: IPubseries) => {
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
        <main>
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