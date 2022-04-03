import React from "react";
import { LinkList } from "./LinkList";
import { IPerson } from "./Person";
//const baseURL = 'shorts/';

export interface IShortType {
    id: number,
    name: string
}
export interface IShort {
    id: number,
    title: string,
    orig_title: string,
    language: string,
    pubyear: number,
    authors: IPerson[],
    type: IShortType
}

interface ShortProps {
    short: IShort,
    skipAuthors?: boolean
}

export const groupShorts = (shorts: IShort[]) => {
    let grouped: Record<string, IShort[]> =
        shorts.reduce((acc: { [index: string]: any }, currentValue) => {
            const groupKey = currentValue.authors.map((author) => author.name).join(", ");
            if (!acc[groupKey]) {
                acc[groupKey] = []
            }
            acc[groupKey].push(currentValue);
            return acc;
        }, {});
    return grouped;
}

export const ShortSummary = ({ short, skipAuthors }: ShortProps) => {
    //const user = getCurrenUser();
    //let [short, setShort]: [IShort | null, (story: IShort) => void] = React.useState<IShort | null>(null);

    const PickLinks = (items: IPerson[]) => {
        return items.map((item) => ({ id: item['id'], name: item['alt_name'] }));
    }

    // React.useEffect(() => {
    //     async function getShort() {
    //         let url = baseURL + id?.toString();
    //         try {
    //             const response = await getApiContent(url, user);
    //             setShort(response.data);
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     }
    //     getShort();
    // }, [id])

    //if (!short) return null;

    return (
        <div>
            {short !== null && short !== undefined ? (
                <div>
                    {!skipAuthors &&
                        <>
                            <LinkList
                                path="people"
                                items={PickLinks(short.authors)}
                            />:
                        </>
                    }
                    <b>{short.title}</b>
                    {short.orig_title !== short.title && (
                        <> ({short.orig_title})</>
                    )}
                    {short.pubyear && (
                        <>, {short.pubyear}</>
                    )
                    }
                    <>.</>
                </div>
            ) : (
                <p>Haetaan tietoja..</p>
            )
            }
        </div>
    )
}