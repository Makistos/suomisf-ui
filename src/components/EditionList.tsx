import { useEffect, useState } from "react";
import { IEdition, Edition, groupEditions } from "./Edition";
import { IPerson } from "./Person";

interface EditionListProps {
    editions: IEdition[],
    person: IPerson
}

export const EditionList = ({ editions, person }: EditionListProps) => {
    const [groupedEditions, setGroupedEditions]: [Record<string, IEdition[]>,
        (editions: Record<string, IEdition[]>) => void] = useState({});

    useEffect(() => {
        setGroupedEditions(groupEditions(editions));
    }, [editions])

    const editionListCmp = (a: [string, IEdition[]], b: [string, IEdition[]]) => {
        const aFirst = a[1][0];
        const bFirst = a[1][0];
        //const aEditorName = aFirst.work[0].author_str.replace(" (toim.)", "");
        const aEditorName = a[0].replace(" (toim.)", "");
        const bEditorName = b[0].replace(" (toim.)", "");
        //const aEditorName = a[0];
        //const bEditorName = bFirst.work[0].author_str.replace(" (toim.)", "");
        //const bEditorName = b[0];
        if (aEditorName === person.name) return -1;
        if (bEditorName === person.name) return 1;
        if (aEditorName < bEditorName) return -1;
        if (aEditorName > bEditorName) return 1;
        if (aFirst.title > bFirst.title) return 1;
        if (aFirst.pubyear < bFirst.pubyear) return -1;
        return -1;
    }

    return (
        <div>
            {
                Object.entries(groupedEditions)
                    .sort(editionListCmp)
                    .map(([group, ed]) => {
                        return (
                            <div key={group}>
                                {person && group !== person.name + " (toim.)" ?
                                    <h3>{group}</h3>
                                    :
                                    <h3>Antologiat</h3>
                                }
                                {
                                    ed.map((edition: IEdition) => (
                                        <Edition edition={edition}
                                            key={edition.id}
                                        />
                                    ))
                                }
                            </div>
                        );
                    })
            }
        </div>
    )
}