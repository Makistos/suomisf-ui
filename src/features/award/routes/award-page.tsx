import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from 'primereact/datatable'

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

    const headerTemplate = () => {
        return (
            <div className="grid col-12">
                <div className="grid col-2">
                    Vuosi
                </div>
                <div className="grid col-6">
                    Voittaja
                </div>
                <div className="grid col-4">
                    Kategoria
                </div>
            </div>
        )
    }

    const itemTemplate = (awarded: Awarded) => {
        return (
            <div className="grid col-12 p-1">
                <div className="grid col-2">
                    {awarded.year}
                </div>
                <div className="grid col-6">
                    {awarded.person !== null && awarded.person.alt_name}
                    {awarded.work !== null &&
                        awarded.work.author_str + ": " + awarded.work.title}
                    {awarded.story !== null &&
                        awarded.story.title}
                </div>
                <div className="grid col-4">
                    {awarded.category.name}
                </div>
            </div>
        )
    }

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
                                    name: item.person['alt_name']
                                        ? item.person['alt_name'] : item.person['name'],
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
    if (!data) return <></>

    console.log(data)

    return (
        <main className="all-content">
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <div className="grid mb-5 justify-content-center">
                        <h1 className='maintitle mb-3'>{data.name}</h1>
                    </div>
                    <div>
                        <p>{data.description}</p>
                        <p>
                            <i>Lista sisältää vain sellaiset kirjailijat, joiden teoksia
                                on suomennettu tai teosten ja
                                novellien tapauksessa vain sellaiset, jotka on suomennettu.
                            </i>
                        </p>
                    </div>
                    <div>
                        <DataTable value={
                            data.winners.sort((
                                a, b) => a.year < b.year ? -1 : 1)}
                        >
                            <Column field="year" header="Vuosi"></Column>
                            <Column field="winners" header="Voittaja"
                                body={winnerTemplate}></Column>
                            <Column field="category.name" header="Kategoria"></Column>
                        </DataTable>
                    </div>
                </>
            )}

        </main>
    )
}