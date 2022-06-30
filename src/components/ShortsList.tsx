import { useEffect, useState } from "react";
import { IPerson } from "./Person";
import { IShort, ShortSummary, groupShorts } from "./Short";
import { Dropdown } from "primereact/dropdown";
interface ShortsListProps {
    /**
     * List of shorts.
     */
    shorts: IShort[],
    /**
     * This can be used to skip showing the name of a certain author. Used to
     * list shorts on a person's page where we don't want to repeat his name.
     */
    person?: IPerson,
    /**
     * Whether to group the shorts by author.
     */
    groupAuthors?: boolean,
    /**
     * Whether to show where shorts were published (books and magazines).
     */
    listPublications?: boolean,
    /**
     * Whether  this is a list of shorts for an anthology. If it is then we
     * show the authors in front of each row.
     */
    anthology?: boolean,
}

export const ShortsList = ({ shorts, person, groupAuthors, listPublications, anthology }: ShortsListProps) => {
    /**
     * A component for showing a list of shorts. Shorts include short stories,
     * articles etc.
     */
    const [orderField, setOrderField] = useState("Year");
    const [groupedShorts, setGroupedShorts]: [Record<string, IShort[]>,
        (groupedShorts: Record<string, IShort[]>) => void] = useState({});

    const sortOptions = [
        { name: 'Nimi', code: 'Title' },
        { name: 'Julkaisuvuosi', code: 'Year' }
    ]

    const sortGroups = (a: [string, IShort[]], b: [string, IShort[]]) => {
        if (person) {
            if (a[0].localeCompare(person.name) === 0) return -1;
            if (a[0].localeCompare(person.name) === 0) return 1;
        }
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
        if (groupAuthors) {
            setGroupedShorts(groupShorts(shorts));
        } else {
            let grouped: Record<any, IShort[]> = {};
            grouped["null"] = shorts;
            setGroupedShorts(grouped);
        }
    }, [shorts, groupAuthors])

    const skipAuthors = !anthology ? true : false;

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
                                {person && group !== person.name && group !== "null" ? (
                                    <h3>{person.name}</h3>
                                ) : (<></>)
                                }
                                {
                                    shortList.sort(shortsCmp).map((short: IShort) => (
                                        <ShortSummary short={short} key={short.id}
                                            skipAuthors={skipAuthors}
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