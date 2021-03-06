import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useState } from "react";
import { IPublisher } from "./components/Publisher";
import { getCurrenUser } from "./services/auth-service";
import { getApiContent } from "./services/user-service";
import { Link } from 'react-router-dom';

const baseURL = "publishers";

export const PublisherList = () => {
    /** Page that shows all the publishers in the system in a table.
     */
    const user = getCurrenUser();
    const [publishers, setPublishers]: [IPublisher[] | null, (publishers: IPublisher[] | null) => void] = useState<IPublisher[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getPublishers() {
            let publisherList: IPublisher[];
            try {
                const response = await getApiContent(baseURL, user);
                publisherList = response.data;
                publisherList.map(publisher => {
                    if (publisher.editions.length > 0) {
                        publisher.edition_count = publisher.editions.length;
                        const oldest
                            = publisher.editions.reduce(function (prev, curr, index, array) {
                                return (curr.pubyear < prev.pubyear ? curr : prev);
                            });
                        publisher.edition_oldest = oldest.pubyear;
                        const newest
                            = publisher.editions.reduce(function (prev, curr, index, array) {
                                return (curr.pubyear > prev.pubyear ? curr : prev);
                            });
                        publisher.edition_newest = newest.pubyear;
                        let images = null;
                        if (publisher.editions) {
                            images = publisher.editions.filter(edition => edition.images && edition.images.length > 0)
                        }
                        if (images !== null) {
                            publisher.image_count = images.length;
                        } else {
                            publisher.image_count = 0;
                        }
                    } else {
                        publisher.edition_count = 0;
                        publisher.image_count = 0;
                    }
                    return true;
                })
                setPublishers(publisherList);
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        }
        getPublishers();
    }, [user])

    const nameTemplate = (rowData: IPublisher) => {
        return (
            <Link to={`/publishers/${rowData.id}`} key={rowData.id}>
                {rowData.name}
            </Link>
        )
    }

    const oldestEditionTemplate = (rowData: IPublisher) => {
        if (rowData.edition_oldest) {
            return rowData.edition_oldest;
        }
        return null;
    }

    const newestEditionTemplate = (rowData: IPublisher) => {
        if (rowData.edition_newest) {
            return rowData.edition_newest;
        }
        return null;
    }

    const imageCountPercentageTemplate = (rowData: IPublisher) => {
        if (rowData.editions.length > 0 && rowData.image_count) {
            return Math.round(rowData.image_count / rowData.editions.length * 100);
        }
        return 0;
    }

    return (
        <main>{
            loading ?
                <div className="progressbar">
                    <ProgressSpinner />
                </div>
                : (publishers && (
                    <div>
                        <h1 className="title">Kustantajat</h1>
                        <p>Kustantajia yhteens??: {publishers?.length}</p>
                        <DataTable value={publishers}
                            size="small"
                            dataKey="id"
                            emptyMessage="Kustantajia ei l??ytynyt"
                            loading={loading}
                        >
                            <Column field="name" header="Nimi"
                                body={nameTemplate}
                                filter sortable>
                            </Column>
                            <Column field="edition_count" header="Julkaisuja"
                                filter sortable
                                dataType="numeric">
                            </Column>
                            <Column field="edition_oldest"
                                body={oldestEditionTemplate}
                                header="Vanhin julkaisu"
                                dataType="numeric"
                                filter sortable>
                            </Column>
                            <Column field="edition_newest"
                                body={newestEditionTemplate}
                                header="Uusin julkaisu"
                                dataType="numeric"
                                filter sortable>
                            </Column>
                            <Column field="image_count"
                                header="Kansikuvia"
                                dataType="numeric"
                                filter sortable>
                            </Column>
                            <Column field="image_count_p"
                                body={imageCountPercentageTemplate}
                                header="Kansikuvia%"
                                dataType="numeric"
                            >
                            </Column>

                        </DataTable>
                    </div>
                ))}
        </main>
    )
}