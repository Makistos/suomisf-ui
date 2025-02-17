import React, { useState, useEffect } from "react";

import { SelectButton } from 'primereact/selectbutton';
import { Dropdown } from "primereact/dropdown";
import "primeflex/primeflex.css";

import { groupWorks } from "../utils/group-works";
import { WorkSummary } from "./work-summary";
import { CoverImageList } from "../../../components/cover-image-list";
import { WorkStatsPanel } from "../../stats";

import { Work } from "../types";
import { Toolbar } from "primereact/toolbar";

type WorksProp = {
    works: Work[],
    personName?: string,
    collaborationsLast?: boolean,
    sort?: boolean,
    details?: string
}

export const WorkList = ({ works, personName = "", collaborationsLast = false,
    sort = true, details = "brief" }: WorksProp) => {
    const [groupedWorks, setGroupedWorks]: [Record<string, Work[]>,
        (works: Record<string, Work[]>) => void] = useState({});
    const [detailLevel, setDetailLevel] = useState(details);
    const [orderField, setOrderField] = useState("Title");
    const [workView, setWorkView] = useState("Lista");
    const [showNonSf, setShowNonSf] = useState<boolean>(false);

    useEffect(() => {
        if (works !== null && works.length > 0) {
            setGroupedWorks(groupWorks(works));
        }
    }, [workView, detailLevel, orderField, works])

    type detailOptionType = {
        icon: string,
        value: string
    }

    const workViewOptions = [
        'Lista', 'Kannet'
    ];

    const detailOptions = [
        { icon: 'pi pi-minus', value: 'brief' },
        { icon: 'pi pi-bars', value: 'condensed' },
        { icon: 'pi pi-align-justify', value: 'all' }
    ];

    const sortOptions = [
        { name: 'Nimi', code: 'Title' },
        { name: 'Julkaisuvuosi', code: 'Year' },
        { name: "Suom. järjestys", code: 'Pubyear' }
    ];

    const compareAuthors = (a: [string, Work[]], b: [string, Work[]]) => {
        // Special compare needed because we want the works by the person (if given)
        // to come first.
        if (sort === false) return 1;
        const aName = a[0].replace(' (toim.)', '');
        const bName = b[0].replace(' (toim.)', '');
        // Always place books written with real name first
        if (aName === personName) return -1;
        if (bName === personName) return 1;
        if (personName) {
            if (aName.localeCompare(personName, "fi") === 0) return 1;
            if (bName.localeCompare(personName, "fi") === 0) return -1;
        }
        if (collaborationsLast) {
            if (aName.includes('&') && bName.includes('&'))
                return aName.localeCompare(bName, "fi");
            if (aName.includes('&')) return 1;
            if (bName.includes('&')) return -1;
        }
        return aName.localeCompare(bName, "fi");
    }

    const compareWorks = (a: Work, b: Work) => {
        if (sort === false) return 1;
        if (orderField === 'Title') {
            if (a.title.toUpperCase() < b.title.toUpperCase()) return -1;
            if (a.title.toUpperCase() > b.title.toUpperCase()) return 1;
        } else if (orderField === 'Year') {
            if (a.pubyear < b.pubyear) return -1;
            if (a.pubyear > b.pubyear) return 1;
        } else if (orderField === 'Pubyear') {
            const oldestA = a.editions.sort((a, b) => a.pubyear > b.pubyear ? 1 : -1)[0]
            const oldestB = b.editions.sort((a, b) => a.pubyear > b.pubyear ? 1 : -1)[0]
            if (oldestA.pubyear < oldestB.pubyear) return -1;
            if (oldestA.pubyear > oldestB.pubyear) return 1;
        }
        return 0;
    }

    const detailTemplate = (option: detailOptionType) => {
        return <i className={option.icon}></i>
    }

    const startContent = (
        <SelectButton value={workView}
            options={workViewOptions}
            onChange={(e) => setWorkView(e.value)}
        />
    );

    const centerContent = (
        <WorkStatsPanel works={works} />
    );

    const endContent = (
        <div className="lg:justify-content-end">
            <SelectButton value={detailLevel} options={detailOptions}
                optionLabel="icon"
                id="details"
                onChange={(e) => setDetailLevel(e.value)}
                itemTemplate={detailTemplate}
            />
        </div>
    );

    return (
        works && works.length > 0 ? (
            <div className="grid w-full">
                <div className="w-full">
                    <Toolbar start={startContent} center={centerContent} end={endContent} />
                </div>
                <div className="grid col-12">
                    {
                        Object.entries(groupedWorks)
                            .sort(compareAuthors)
                            .map(([group, ws]) => {
                                return (
                                    <div className="grid col-12" key={group}>
                                        <div className="grid col-12">
                                            {group !== personName &&
                                                <h3 className="">{group}</h3>}
                                        </div>
                                        <div>
                                            {workView === 'Lista' ? (
                                                ws.sort(compareWorks).map((work) => (
                                                    work.editions.length > 0 &&
                                                    <WorkSummary work={work} key={`work-${work.id}`}
                                                        detailLevel={detailLevel}
                                                        orderField={orderField} />
                                                )
                                                )
                                            ) : (
                                                <CoverImageList key={group} works={ws} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                    }
                </div>
            </div>
        ) : (<></>)
    )
}