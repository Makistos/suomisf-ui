import React, { useEffect, useState } from "react";

import { Fieldset } from "primereact/fieldset";
import { TabView, TabPanel } from "primereact/tabview";
import _ from "lodash";

import { Person } from "../../person";
import { ShortsList } from "./shorts-list";
import { Short, ShortType } from "../types";
import { listIsSf } from "../../genre";

interface ShortsProps {
    /**
     * This can be used to skip showing the name of a certain author. Used to
     * list shorts on a person's page where we don't want to repeat his name.
     */
    person: Person,
    /**
     * Whether to show where shorts were published (books and magazines).
     */
    listPublications?: boolean,
    showAuthors?: boolean,
    sort?: string,
    /**
     * What to show. Possible values = "all", "sf", "nonsf". Defaults to
     * "all", which is also used if invalid value is given.
     */
    what?: string
}

export const ShortsControl = ({ person, listPublications, showAuthors, sort, what }: ShortsProps) => {
    const [shorts, setShorts]: [Short[], (shorts: Short[]) => void] = useState<Short[]>([]);
    const [shortTypes, setShortTypes]: [ShortType[], (shortTypes: ShortType[]) => void] = useState<ShortType[]>([]);
    useEffect(() => {
        /** Filter shorts by the what parameter. Either all or sf or non-sf stories. */
        const filterShorts = (short: Short) => {
            if (what === "all") return true;
            else if (what === "nonsf") return !listIsSf(short.genres);
            else return listIsSf(short.genres);
        }

        /** Joins two lists of short stories into one. */
        const joinShortsLists = (aList: Short[], bList: Short[]) => {
            const keys = Object.assign({}, ...aList.map(item => ({ [item.id]: item.title })));
            bList.map(item => {
                if (!(item.id in keys)) {
                    aList.push(item);
                }
                return true;
            });
            return aList;
        }
        const newShorts = joinShortsLists(
            person.stories.filter(filterShorts),
            person.magazine_stories.filter(filterShorts));
        setShorts(newShorts);
        setShortTypes(getShortTypes(newShorts));
    }, [person, listPublications, what])

    const headerText = (staticText: string, count: number) => {
        return staticText + " (" + count + ")";
    }

    /** Return a list of unique short types ordered by their id. */
    const getShortTypes = (shorts: Short[]) => {
        const typeList = shorts.map(short => short.type);
        const types = _.uniqBy(typeList, 'id').sort((a, b) => a.id < b.id ? -1 : 1);
        return types;
    }

    return (
        <Fieldset legend="Lyhyet" toggleable>
            <TabView className="w-full">
                {shortTypes.map((shortType) => {
                    return (
                        <TabPanel key={shortType.id} header={headerText(shortType.name,
                            shorts.filter((s) => s.type.id === shortType.id).length)}>
                            <ShortsList shorts={shorts.filter((s) => s.type.id === shortType.id).sort((a, b) => a.title.localeCompare(b.title))}
                                person={person} key={person.id}
                                groupRoles
                                anthology={showAuthors}  // This. Is. Hack.
                                sort={sort}
                                {...(listPublications ? { listPublications } : {})}
                            />
                        </TabPanel>
                    )
                })}
            </TabView>
        </Fieldset>
    )
}
