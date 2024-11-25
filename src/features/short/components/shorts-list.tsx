import React, { useEffect, useState } from "react";

import { Dropdown } from "primereact/dropdown";

import { Person } from "../../person";
import { ShortSummary } from './short-summary';
import { groupShorts } from "../utils";
import { Short } from "../types";

interface ShortsListProps {
    /**
     * List of shorts.
     */
    shorts: Short[],
    /**
     * This can be used to skip showing the name of a certain author. Used to
     * list shorts on a person's page where we don't want to repeat his name.
     */
    person?: Person,
    /**
     * Whether to group the shorts by author.
     */
    groupAuthors?: boolean,
    /**
     * Whether to group by author role. This and groupAuthors can't both be true.
     */
    groupRoles?: boolean,
    /**
     * Whether to show where shorts were published (books and magazines).
     */
    listPublications?: boolean,
    /**
     * Whether  this is a list of shorts for an anthology. If it is then we
     * show the authors in front of each row.
     */
    anthology?: boolean,
    enableQueries?: (state: boolean) => void
}

/**
 * A component for showing a list of shorts. Shorts include short stories,
 * articles etc.
 *
 * @param shorts - The list of shorts to display.
 * @param person - The person associated with the shorts.
 * @param groupAuthors - Whether to group the shorts by authors.
 * @param listPublications - Whether to list the publications.
 * @param anthology - Whether the shorts are part of an anthology.
 * @param enableQueries - Whether to enable queries.
 * @return {JSX.Element} The rendered component.
 */
export const ShortsList = ({ shorts, person, groupAuthors, groupRoles, listPublications,
    anthology, enableQueries }: ShortsListProps): JSX.Element => {

    const [orderField, setOrderField] = useState("Title");
    const [groupedShorts, setGroupedShorts]: [Record<string, Short[]>,
        (groupedShorts: Record<string, Short[]>) => void] = useState({});
    const grouping = groupAuthors ? "person" : groupRoles ? "role" : "";
    const sortOptions = [
        { name: 'Nimi', code: 'Title' },
        { name: 'Julkaisuvuosi', code: 'Year' }
    ]

    const sortGroups = (a: [string, Short[]], b: [string, Short[]]) => {
        if (person) {
            if (a[0].localeCompare(person.name) === 0) return -1;
            if (b[0].localeCompare(person.name) === 0) return 1;
        }
        return (a[0].localeCompare(b[0]));
    }

    const shortsCmp = (a: Short, b: Short) => {
        if (orderField === "Title") {
            return a.title < b.title ? -1 : 1;
        }
        // a first if both are are null. Otherwise if one is null,
        // that goes first.
        if (!a.pubyear && !b.pubyear) return -1;
        if (!a.pubyear) return -1;
        if (!b.pubyear) return 1;
        if (orderField === "Year") {
            return a.pubyear < b.pubyear ? -1 : 1;
        }
        return 0;
    }

    useEffect(() => {
        if (groupAuthors || groupRoles) {
            const grouped = groupShorts(shorts, grouping, person?.name);
            setGroupedShorts(grouped);
        } else {
            let grouped: Record<any, Short[]> = {};
            grouped["null"] = shorts;
            setGroupedShorts(grouped);
        }
        console.log(groupedShorts);
    }, [shorts, groupAuthors, groupRoles])

    const skipAuthors = !anthology ? true : false;

    const groupHeader = (group: string) => {
        if (group === "null") {
            return <></>;
        } else if (grouping === "person" && person && group !== person.name) {
            return <h3>{person.name}</h3>;
        } else if (grouping === "role") {
            return <h3>{group}</h3>;
        }
        return <></>;
    }
    return (
        <div className="grid">
            {/* <div className="grid col-12 justify-content-end">
                <div className="grid p-1">
                    <Dropdown value={orderField} options={sortOptions}
                        onChange={(e) => setOrderField(e.value)}
                        optionLabel="name" optionValue="code"
                        className="small"
                    />
                </div>
            </div> */}
            <div className="col">
                {/* {shorts.map((short: Short) => (
                    <ShortSummary short={short} key={short.id}
                        skipAuthors={skipAuthors}
                        {...(listPublications ? { listPublications } : {})}
                        enableQueries={enableQueries}
                    />
                ))
                } */}
                {Object.entries(groupedShorts)
                    .sort(sortGroups)
                    .map(([group, shortList]) => {
                        return (
                            <div key={group}>
                                {groupHeader(group)}
                                {
                                    shortList.sort(shortsCmp).map((short: Short) => (
                                        <ShortSummary short={short} key={short.id}
                                            skipAuthors={skipAuthors}
                                            {...(listPublications ? { listPublications } : {})}
                                            enableQueries={enableQueries}
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