import React, { useState, useEffect } from "react";
import { WorkSummary, IWork, groupWorks } from './Work';
import { SelectButton } from 'primereact/selectbutton';
import { Dropdown } from "primereact/dropdown";

import "primeflex/primeflex.css";

type WorksProp = {
    works: IWork[],
    personName?: string
}

export const WorkList = ({ works, personName = "" }: WorksProp) => {
    const [groupedWorks, setGroupedWorks]: [Record<string, IWork[]>,
        (works: Record<string, IWork[]>) => void] = useState({});
    const [detailLevel, setDetailLevel] = useState("condensed");
    const [orderField, setOrderField] = useState("Title");
    useEffect(() => {
        setGroupedWorks(groupWorks(works));
    }, [detailLevel, orderField, works])

    type detailOptionType = {
        icon: string,
        value: string
    }
    const detailOptions = [
        { icon: 'pi pi-minus', value: 'brief' },
        { icon: 'pi pi-bars', value: 'condensed' },
        { icon: 'pi pi-align-justify', value: 'all' }
    ]

    const sortOptions = [
        { name: 'Nimi', code: 'Title' },
        { name: 'Julkaisuvuosi', code: 'Year' },
        { name: "Suom. järjestys", code: 'Pubyear' }
    ]

    // const detailOptions = [
    //     { name: 'Teos', value: 1 },
    //     { name: 'Tiivis', value: 2 },
    //     { name: 'Kaikki', value: 3 }
    // ];

    const compareWorks = (a: IWork, b: IWork) => {
        if (orderField === 'Title') {
            if (a.title < b.title) return -1;
            if (a.title > b.title) return 1;
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

    return (
        <div className="grid">
            <div className="grid col-12 justify-content-end">
                <div className="p-1">
                    <SelectButton value={detailLevel} options={detailOptions}
                        optionLabel="icon"
                        id="details"
                        onChange={(e) => setDetailLevel(e.value)}
                        itemTemplate={detailTemplate}
                    />
                </div>
                <div className="p-1">
                    <Dropdown value={orderField} options={sortOptions}
                        onChange={(e) => setOrderField(e.value)}
                        optionLabel="name" optionValue="code"
                        className="small"
                    />
                </div>
            </div>
            <div className="col">
                {
                    Object.entries(groupedWorks)
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(([group, ws]) => {
                            return (
                                <div key={group}>
                                    {group !== personName &&
                                        <h3>{group}</h3>}
                                    {
                                        ws.sort(compareWorks).map((work: IWork) => (
                                            <WorkSummary work={work} key={work.id}
                                                detailLevel={detailLevel}
                                                orderField={orderField} />
                                        ))
                                    }
                                </div>
                            );
                        })
                }
            </div>
        </div>

    )
}