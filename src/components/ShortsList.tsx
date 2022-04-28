import { useEffect, useState } from "react";
import { IPerson } from "./Person";
import { IShort, ShortSummary, groupShorts } from "./Short";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
interface ShortsListProps {
    shorts: IShort[],
    person: IPerson,
    listPublications?: boolean
}

export const ShortsList = ({ shorts, person, listPublications }: ShortsListProps) => {
    const [orderField, setOrderField] = useState("Year");
    const [groupedShorts, setGroupedShorts]: [Record<string, IShort[]>,
        (groupedShorts: Record<string, IShort[]>) => void] = useState({});

    const sortOptions = [
        { name: 'Nimi', code: 'Title' },
        { name: 'Julkaisuvuosi', code: 'Year' }
    ]

    const sortGroups = (a: [string, IShort[]], b: [string, IShort[]]) => {
        if (a[0].localeCompare(person.name) === 0) return -1;
        if (a[0].localeCompare(person.name) === 0) return 1;
        return (a[0].localeCompare(b[0]));
    }

    const shortsCmp = (a: IShort, b: IShort) => {
        if (orderField === "Title") {
            return a.title < b.title ? -1 : 1;
        }
        if (orderField === "Year") {
            return a.pubyear < b.pubyear ? -1 : 1;
        }
        return 0;
    }

    useEffect(() => {
        setGroupedShorts(groupShorts(shorts));
    }, [shorts])

    return (
        <div className="grid">
            <div className="grid col-12 justify-content-end">
                <div className="grid p-1">
                    <Dropdown value={orderField} options={sortOptions}
                        onChange={(e) => setOrderField(e.value)}
                        optionLabel="name" optionValue="code"
                        className="small"
                    />
                </div>
            </div>
            <div className="col">
                {Object.entries(groupedShorts)
                    .sort(sortGroups)
                    .map(([group, shortList]) => {
                        return (
                            <div key={group}>
                                {person && group !== person.name ? (
                                    <h3>{person.name}</h3>
                                ) : (<></>)
                                }
                                {
                                    shortList.sort(shortsCmp).map((short: IShort) => (
                                        <ShortSummary short={short} key={short.id}
                                            skipAuthors
                                            {...(listPublications ? { listPublications } : {})}
                                        />
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