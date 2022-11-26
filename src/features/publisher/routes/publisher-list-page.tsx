import React from "react";
import { Link } from 'react-router-dom';

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { Publisher } from "../types";
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { Edition } from "../../edition";
import { useQuery } from "@tanstack/react-query";

const baseURL = "publishers";

export const PublisherListPage = () => {
    /** Page that shows all the publishers in the system in a table.
     */
    const user = getCurrenUser();

    const fetchPublishers = async () => {
        let publisherList: Publisher[] = [];
        publisherList = await getApiContent(baseURL, user).then(resp => {
            console.log(resp.data);
            return resp.data;
        })
            .catch((error) => console.log(error));

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
                // let images: Edition[] = [];
                // if (publisher.editions) {
                //     images = publisher.editions.filter(edition => edition.images && edition.images.length > 0)
                // }
                // if (images !== null) {
                //     publisher.image_count = images.length;
                // } else {
                //     publisher.image_count = 0;
                // }
            } else {
                publisher.edition_count = 0;
                // publisher.image_count = 0;
            }
            return true;
        })
        return publisherList;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["publishers"],
        queryFn: () => fetchPublishers()
    });

    const nameTemplate = (rowData: Publisher) => {
        return (
            <Link to={`/publishers/${rowData.id}`} key={rowData.id}>
                {rowData.name}
            </Link>
        )
    }

    const oldestEditionTemplate = (rowData: Publisher) => {
        if (rowData.edition_oldest) {
            return rowData.edition_oldest;
        }
        return null;
    }

    const newestEditionTemplate = (rowData: Publisher) => {
        if (rowData.edition_newest) {
            return rowData.edition_newest;
        }
        return null;
    }

    // const imageCountPercentageTemplate = (rowData: Publisher) => {
    //     if (rowData.editions.length > 0 && rowData.image_count) {
    //         return Math.round(rowData.image_count / rowData.editions.length * 100);
    //     }
    //     return 0;
    // }

    return (
        <main className="all-content">
            {
                <div>
                    <h1 className="title">Kustantajat</h1>
                    <p>Kustantajia yhteensä: {data?.length}</p>
                    <DataTable value={data}
                        size="small"
                        dataKey="id"
                        emptyMessage="Kustantajia ei löytynyt"
                        loading={isLoading}
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
                        {/*<Column field="image_count"
                            header="Kansikuvia"
                            dataType="numeric"
                            filter sortable>
                        </Column>
                        <Column field="image_count_p"
                            body={imageCountPercentageTemplate}
                            header="Kansikuvia%"
                            dataType="numeric"
                        >
            </Column> */}

                    </DataTable>
                </div>
            }
        </main>
    )
}