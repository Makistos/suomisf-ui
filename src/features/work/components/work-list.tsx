import React, { useState, useEffect, useMemo } from "react";

import { SelectButton } from 'primereact/selectbutton';
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import "primeflex/primeflex.css";

import {
    groupWorks, groupKeyDisplayName, renderContributorLink,
    compareWorksByField, workSortOptions, WorkSortField
} from "../utils/group-works";
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
    const [orderField, setOrderField] = useState<WorkSortField>("Title");
    const [workView, setWorkView] = useState("Lista");
    const [showNonSf, setShowNonSf] = useState<boolean>(false);
    const [groupByAuthor, setGroupByAuthor] = useState<boolean>(true);

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

    const compareAuthors = (a: [string, Work[]], b: [string, Work[]]) => {
        // Special compare needed because we want the works by the person (if given)
        // to come first.
        if (sort === false) return 1;
        const aName = groupKeyDisplayName(a[0]).replace(' (toim.)', '');
        const bName = groupKeyDisplayName(b[0]).replace(' (toim.)', '');
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
        return compareWorksByField(a, b, orderField);
    }

    // Grouping + author sort + per-group filter/sort, computed once per
    // relevant change instead of on every render (real cost at list size).
    const sortedGroupedWorks = useMemo(() => {
        return Object.entries(groupedWorks)
            .sort(compareAuthors)
            .map(([group, ws]) => ({
                group,
                works: ws,
                listWorks: ws.filter(work => work.editions.length > 0)
                    .sort(compareWorks),
            }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupedWorks, personName, collaborationsLast, sort, orderField]);

    // Ungrouped view: one flat, globally-sorted list instead of
    // sorting within each author's group.
    const sortedFlatWorks = useMemo(() => {
        if (works === null || works === undefined) return [];
        return works.filter(work => work.editions.length > 0).sort(compareWorks);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [works, sort, orderField]);

    const detailTemplate = (option: detailOptionType) => {
        return <i className={option.icon}></i>
    }

    const startContent = (
        <div className="flex flex-wrap align-items-center gap-3">
            <SelectButton value={workView}
                options={workViewOptions}
                onChange={(e) => setWorkView(e.value)}
            />
            <div className="flex align-items-center gap-2 pl-2 border-left-1 border-300">
                <Checkbox
                    inputId="groupByAuthor"
                    checked={groupByAuthor}
                    onChange={(e) => setGroupByAuthor(!!e.checked)}
                />
                <label htmlFor="groupByAuthor" className="white-space-nowrap">
                    Ryhmittele tekijän mukaan
                </label>
            </div>
            <Dropdown value={orderField}
                options={workSortOptions}
                optionLabel="name"
                optionValue="code"
                onChange={(e) => setOrderField(e.value)}
                placeholder="Järjestä"
            />
        </div>
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
                    <Toolbar start={startContent} center={centerContent} end={endContent}
                        className="flex-wrap row-gap-3"
                    />
                </div>
                <div className="grid col-12">
                    {groupByAuthor ? (
                        sortedGroupedWorks
                            .map(({ group, works: ws, listWorks }) => {
                                return (
                                    <div className="grid col-12" key={group}>
                                        <div className="grid col-12">
                                            {groupKeyDisplayName(group) !== personName && (
                                                <h3 className="mt-2" style={{ marginBottom: '0.15rem' }}>
                                                    {renderContributorLink(ws[0]?.contributions ?? [], group)}
                                                </h3>
                                            )}
                                        </div>
                                        <div>
                                            {workView === 'Lista' ? (
                                                listWorks.map((work) => (
                                                    <WorkSummary
                                                        work={work}
                                                        key={`work-${work.id}-summary`}
                                                        detailLevel={detailLevel}
                                                        orderField={orderField}
                                                    />
                                                ))
                                            ) : (
                                                <CoverImageList key={group} works={ws} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                    ) : (
                        <div className="col-12">
                            {workView === 'Lista' ? (
                                sortedFlatWorks.map((work) => (
                                    <WorkSummary
                                        work={work}
                                        key={`work-${work.id}-summary`}
                                        detailLevel={detailLevel}
                                        orderField={orderField}
                                        authorPrefix={renderContributorLink(
                                            work.contributions ?? [], work.author_str
                                        )}
                                    />
                                ))
                            ) : (
                                <CoverImageList works={sortedFlatWorks} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        ) : (<></>)
    )
}