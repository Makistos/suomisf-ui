import React, { useEffect, useState } from "react";

import { Dropdown } from "primereact/dropdown";
import { SelectButton } from "primereact/selectbutton";
import { EditionSummary } from "./edition-summary";
import { groupEditionsByAuthor } from "../utils/group-editions-by-author";
import { Edition } from "../types";
import { Person } from "../../person/types";
import { CoverImageList } from "../../../components/cover-image-list";

interface EditionListProps {
    editions: Edition[],
    person?: Person,
    sort?: string
}

export const EditionList = ({ editions, person, sort = "year" }: EditionListProps) => {
    const [groupedEditions, setGroupedEditions]: [Record<string, Edition[]>,
        (editions: Record<string, Edition[]>) => void] = useState({});
    const [sorting, setSorting] = useState<string>(sort);
    const [editionView, setEditionView] = useState("Lista");

    const sortOptions = [
        { name: "Tekijä", code: "author" },
        { name: "Julk. vuosi", code: "year" },
        { name: "Nimi", code: "title" }
    ]

    const editionViewOptions = [
        'Lista', 'Kannet'
    ];

    useEffect(() => {
        if (sorting === "author") {
            setGroupedEditions(groupEditionsByAuthor(editions));
        }
        else {
            setGroupedEditions({ None: editions });
        }
    }, [editions, sorting])

    const editionListCmp = (a: [string, Edition[]], b: [string, Edition[]]) => {
        if (sorting === "author") {
            const aFirst = a[1][0];
            const bFirst = b[1][0];
            const aEditorName = a[0].replace(" (toim.)", "");
            const bEditorName = b[0].replace(" (toim.)", "");
            if (person) {
                if (aEditorName === person.name) return -1;
                if (bEditorName === person.name) return 1;
            }
            if (aEditorName < bEditorName) return -1;
            if (aEditorName > bEditorName) return 1;
            if (aFirst.title > bFirst.title) return 1;
            if (aFirst.pubyear < bFirst.pubyear) return -1;
            return -1;
        }
        else if (sorting === "year") {
            return -1;
        }
        return -1;
    }

    const cmpEditions = (a: Edition, b: Edition) => {
        if (sorting === "year") {
            return a.pubyear >= b.pubyear ? 1 : -1;
        } else if (sorting === "title") {
            return a.title.localeCompare(b.title, "fi") > 0 ? 1 : -1;
        }
        return 1;
    }

    return (
        <div className="grid w-full">
            <div className="grid col-6 justify-content-start align-items-center">
                <SelectButton value={editionView}
                    options={editionViewOptions}
                    onChange={(e) => setEditionView(e.value)}>
                </SelectButton>
            </div>
            <div className="grid col-6 justify-content-end align-items-center">
                <Dropdown value={sorting} options={sortOptions}
                    onChange={(e) => setSorting(e.value)}
                    optionLabel="name" optionValue="code"
                    className="small"
                />
            </div>
            <div className="grid col-12">
                {
                    Object.entries(groupedEditions)
                        .sort(editionListCmp)
                        .map(([group, ed]) => {
                            return (
                                <div className="grid col-12" key={group}>
                                    {((person && group !== person.name + " (toim.)") || sorting === "author") && group !== "None" &&
                                        (
                                            <div className="grid col-12">
                                                <h3>{group}</h3>
                                            </div>
                                        )
                                    }
                                    {editionView === "Lista" ? (
                                        ed.sort(cmpEditions).map((edition: Edition) => (
                                            <div className="grid col-12" key={edition.id}>
                                                <EditionSummary edition={edition} showVersion={true} work={edition.work[0]}
                                                    key={edition.id} showPerson={sorting !== "author"}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <CoverImageList key={group} editions={ed.sort(cmpEditions)} />
                                    )
                                    }
                                </div>
                            );
                        })
                }
            </div>
        </div>
    )
}