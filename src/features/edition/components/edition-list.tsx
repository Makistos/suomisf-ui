import React, { useEffect, useMemo, useState } from "react";

import { Dropdown } from "primereact/dropdown";
import { SelectButton } from "primereact/selectbutton";
import { EditionSummary } from "./edition-summary";
import { groupEditionsByAuthor } from "../utils/group-editions-by-author";
import { CombinedEdition, Edition } from "../types";
import { Person } from "../../person/types";
import { CoverImageList } from "../../../components/cover-image-list";
import { User } from "@features/user";
import { getCurrenUser } from "@services/auth-service";
import { editionIsOwned } from "../utils/edition-is-owned";
import { editionIsWishlisted } from "../utils/edition-is-wishlisted";
import { Toolbar } from "primereact/toolbar";
import { combineEditions } from "../utils/combine-editions";
import { groupSimilarEditions } from "../utils/group-similar-editions";

interface EditionListProps {
    editions: Edition[],
    person?: Person,
    sort?: string
}

type detailOptionType = {
    icon: string,
    value: string
}

export const EditionList = ({ editions, person, sort = "year" }: EditionListProps) => {
    const [groupedEditions, setGroupedEditions]: [Record<string, Edition[]>,
        (editions: Record<string, Edition[]>) => void] = useState({});
    const [sorting, setSorting] = useState<string>(sort);
    const [editionView, setEditionView] = useState("Lista");
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [detailLevel, setDetailLevel] = useState("brief");

    const sortOptions = [
        { name: "Tekijä", code: "author" },
        { name: "Julk. vuosi", code: "year" },
        { name: "Nimi", code: "title" }
    ]

    const detailOptions = [
        { icon: 'pi pi-minus', value: 'brief' },
        // { icon: 'pi pi-bars', value: 'condensed' },
        { icon: 'pi pi-align-justify', value: 'all' }
    ];

    const editionViewOptions = [
        'Lista', 'Kannet'
    ];
    // useEffect(() => {
    //     if (sorting === "author") {
    //         setGroupedEditions(groupEditionsByAuthor(editions));
    //     }
    //     else {
    //         setGroupedEditions({ None: editions });
    //     }
    // }, [editions, sorting])
    useEffect(() => {
        const groups = groupSimilarEditions(editions, detailLevel);
        const combined = groups.map(group => combineEditions(group, user));
        if (sorting === "author") {
            // setGroupedEditions(groupEditionsByAuthor(groupSimilarEditions(editions, detailLevel));
            setGroupedEditions(groupEditionsByAuthor(combined.filter((ed): ed is CombinedEdition => ed !== undefined)));
        }
        else {
            setGroupedEditions(
                { None: combined.filter((ed): ed is CombinedEdition => ed !== undefined) });
        }
    }, [editions, sorting, detailLevel])

    const editionListCmp = (a: [string, Edition[]], b: [string, Edition[]]) => {
        const aFirst = a[1][0];
        const bFirst = b[1][0];
        if (sorting === "author") {
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
            return aFirst.pubyear >= bFirst.pubyear ? 1 : -1;
        }
        return -1;
    }

    const cmpEditions = (a: Edition, b: Edition) => {
        if (sorting === "year") {
            return a.pubyear >= b.pubyear ? 1 : -1;
        }
        return a.title.localeCompare(b.title, "fi") > 0 ? 1 : -1;
    }

    const detailTemplate = (option: detailOptionType) => {
        return <i className={option.icon}></i>
    }

    const startContent = () => {
        return (
            <SelectButton value={editionView}
                options={editionViewOptions}
                onChange={(e) => setEditionView(e.value)}>
            </SelectButton>
        )
    }

    const centerContent = () => {
        return (
            <SelectButton value={detailLevel} options={detailOptions}
                optionLabel="icon"
                id="details"
                onChange={(e) => setDetailLevel(e.value)}
                itemTemplate={detailTemplate}
            />
        )
    }

    const endContent = () => {
        return (
            <Dropdown value={sorting} options={sortOptions}
                onChange={(e) => setSorting(e.value)}
                optionLabel="name" optionValue="code"
                className="small"
            />
        )
    }

    return (
        <div className="grid w-full">
            <div className="grid col-12">
                <Toolbar start={startContent} center={centerContent} end={endContent}
                    className="w-full" />
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
                                                    isOwned={editionIsOwned(edition, user)}
                                                    isWishlisted={editionIsWishlisted(edition, user)}
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