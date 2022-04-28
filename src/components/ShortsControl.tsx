import { IPerson } from "./Person";
import { Fieldset } from "primereact/fieldset";
import { TabView, TabPanel } from "primereact/tabview";
import { ShortsList } from "./ShortsList";
import { IShort } from "./Short";
import { useEffect, useState } from "react";

interface ShortsProps {
    person: IPerson,
    listPublications?: boolean
}

export const ShortsControl = ({ person, listPublications }: ShortsProps) => {
    const [shorts, setShorts]: [IShort[], (shorts: IShort[]) => void] = useState<IShort[]>([]);
    useEffect(() => {
        const joinShortsLists = (aList: IShort[], bList: IShort[]) => {
            const keys = Object.assign({}, ...aList.map(item => ({ [item.id]: item.title })));
            bList.map(item => {
                if (!(item.id in keys)) {
                    aList.push(item);
                }
            });
            return aList;
        }
        setShorts(joinShortsLists(person.stories, person.magazine_stories));
    }, [person])

    const headerText = (staticText: string, count: number) => {
        return staticText + " (" + count + ")";
    }

    const shortTypes = (shorts: IShort[]) => {
        const typeList = shorts.map(short => short.type);
        let types = typeList.filter((v, i, types) => types.find(v => v.id === i));
        types = types.sort((a, b) => a.id < b.id ? -1 : 1);
        return types;
    }

    return (
        <Fieldset legend="Lyhyet" toggleable>
            <TabView>
                {shortTypes(shorts).map((shortType) => {
                    return (
                        <TabPanel key={shortType.id} header={headerText(shortType.name,
                            shorts.filter((s) => s.type.id === shortType.id).length)}>
                            <ShortsList shorts={shorts.filter((s) => s.type.id === shortType.id)}
                                person={person} key={person.id}
                                {...(listPublications ? { listPublications } : {})}
                            />
                        </TabPanel>
                    )
                })}
            </TabView>
        </Fieldset>
    )
}