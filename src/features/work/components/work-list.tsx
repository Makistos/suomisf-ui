import React, { useState, useEffect } from "react";

import { SelectButton } from 'primereact/selectbutton';
import { Dropdown } from "primereact/dropdown";
import "primeflex/primeflex.css";

import { groupWorks } from "../utils/group-works";
import { WorkSummary } from "./work-summary";
import { CoverImageList } from "../../../components/cover-image-list";
import { WorkStatsPanel } from "../../stats";

import { Work } from "../types";

type WorksProp = {
    works: Work[],
    personName?: string,
    collaborationsLast?: boolean,
    sort?: boolean,
    details?: string
}

export const WorkList = ({ works, personName = "", collaborationsLast = false,
    sort = true, details = "condensed" }: WorksProp) => {
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
            if ((a.pubyear ? a.pubyear : 0) < (b.pubyear ? b.pubyear : 0)) return -1;
            if ((a.pubyear ? a.pubyear : 0) > (b.pubyear ? b.pubyear : 0)) return 1;
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

    return (
        works && works.length > 0 ? (
            <div className="grid w-full">
                <div className="grid col-4 justify-content-start">
                    <SelectButton value={workView}
                        options={workViewOptions}
                        onChange={(e) => setWorkView(e.value)}
                    />
                </div>
                {/* <div className="grid col-1 justify-content-start">
                    <InputSwitch checked={showNonSf} onChange={(e: InputSwitchChangeEvent) => setShowNonSf(e.value)} />
                </div> */}
                <div className="grid col-4 justify-content-center">
                    <WorkStatsPanel works={works} />
                </div>
                <div className="grid col-4 justify-content-end">
                    <div className="p-1">
                        <SelectButton value={detailLevel} options={detailOptions}
                            optionLabel="icon"
                            id="details"
                            onChange={(e) => setDetailLevel(e.value)}
                            itemTemplate={detailTemplate}
                        />
                    </div>
                    {/* <div className="p-1">
                        <Dropdown value={orderField} options={sortOptions}
                            onChange={(e) => setOrderField(e.value)}
                            optionLabel="name" optionValue="code"
                            className="small"
                        />
                    </div> */}
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
                                                <h3>{group}</h3>}
                                        </div>
                                        <div>
                                            {workView === 'Lista' ? (
                                                ws.sort(compareWorks).map((work) => (
                                                    work.editions.length > 0 &&
                                                    <WorkSummary work={work} key={work.editions[0].id}
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