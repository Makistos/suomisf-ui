import React, { useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useParams, Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'primereact/datatable'
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { User } from "../../user";
import { Award, Awarded } from "../types";
import { selectId } from "../../../utils";
import { Column } from 'primereact/column';
import { LinkList } from '@components/link-list';

interface AwardPageProps {
    id: string | null
}

let awardId = "";

export const AwardPage = ({ id }: AwardPageProps) => {
    const user = getCurrenUser();
    const params = useParams();
    const [queryEnabled, setQueryEnabled] = useState(true);

    try {
        awardId = selectId(params, id);
    } catch (e) {
        console.log(`${e} work`);
    }

    const fetchAward = async (id: string, user: User | null): Promise<Award> => {
        const url = "awards/" + id;
        const data = await getApiContent(url, user).then(response =>
            response.data)
            .catch((error) => console.log(error));
        return data;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["award", id],
        queryFn: () => fetchAward(awardId, user),
        enabled: queryEnabled
    })

    const winnerTemplate = (awarded: Awarded) => {
        return (
            <div>
                {awarded.person !== null && (
                    <>
                        <Link to={`/people/${awarded.person.id}`}>{awarded.person.alt_name}</Link>
                    </>
                )}
                {awarded.work !== null && (
                    <>
                        <b>
                            {awarded.work.author_str}
                        </b>
                        : <Link to={`/works/${awarded.work.id}`}>{awarded.work.title}</Link>
                        {awarded.work.orig_title !== awarded.work.title ?
                            <>&nbsp; ({awarded.work.orig_title})</> : ""}
                    </>
                )}
                {awarded.story !== null &&
                    <>
                        <b><LinkList path="people"
                            separator=", "
                            items={awarded.story.contributors
                                .filter((c) => c.role.id === 1)
                                .filter((c, index, self) =>
                                    index === self.findIndex(t => t.person.id === c.person.id))
                                .map((item) => ({
                                    id: item.person['id'],
                                    name: item.person['name'],
                                    alt_name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name'],
                                    description: (item.description && item.description !== null)
                                        ? item.description : ""
                                }))} /></b>:&nbsp;

                        <Link to={`/shorts/${awarded.story.id}`}>{awarded.story.title}</Link>
                        {awarded.story.orig_title !== awarded.story.title ?
                            <>&nbsp; ({awarded.story.orig_title})</> : ""}
                    </>
                }

            </div>
        )
    }

    const headerGroupTemplate = (data: Awarded) => {
        return (
            <span className="font-bold text-xl">{data.category.name}</span>
        );
    };

    if (!data) return null;

    return (
        <main className="award-page">
            {isLoading ? (
                <div className="flex justify-content-center">
                    <ProgressSpinner />
                </div>
            ) : (
                data && (
                    <div className="grid">
                        {/* Header Section */}
                        <div className="col-12">
                            <Card className="shadow-3">
                                <div className="grid pl-2 pr-2 pt-0">
                                    <div className="col-12">
                                        <h1 className="text-4xl font-bold m-0">{data.name}</h1>
                                        {data.description && (
                                            <div className="mt-3 line-height-3">{data.description}</div>
                                        )}
                                        <div className="mt-3">
                                            <i>Lista sisältää vain sellaiset kirjailijat, joiden teoksia
                                                on suomennettu tai teosten ja
                                                novellien tapauksessa vain sellaiset, jotka on suomennettu.
                                            </i>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="col-12">
                            <TabView className="shadow-2">
                                <TabPanel header="Voittajat" leftIcon="pi pi-star">
                                    <div className="card">
                                        <DataTable
                                            value={data.winners.sort((a, b) =>
                                                a.category.type !== b.category.type ?
                                                    a.category.type > b.category.type ? 1 : -1 :
                                                    a.category.id !== b.category.id ?
                                                        a.category.id > b.category.id ? 1 : -1 :
                                                        a.year < b.year ? -1 : 1
                                            )}
                                            rowGroupMode="subheader"
                                            groupRowsBy="category.name"
                                            rowGroupHeaderTemplate={headerGroupTemplate}
                                            sortMode="single"
                                            responsiveLayout="scroll"
                                        >
                                            <Column field="year" header="Vuosi"></Column>
                                            <Column field="winners" header="Voittaja"
                                                body={winnerTemplate}></Column>
                                        </DataTable>
                                    </div>
                                </TabPanel>
                            </TabView>
                        </div>
                    </div>
                )
            )}
        </main>
    )
}
