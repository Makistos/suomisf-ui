import React from "react";
import { LinkList, LinkItem } from "./LinkList";
import { IPerson } from "../Person";
import { getApiContent } from "../services/user-service";
import { getCurrenUser } from "../services/auth-service";
const baseURL = 'shorts/';

export interface IShort {
    id: number,
    title: string,
    orig_title: string,
    //language: string,
    pubyear: number,
    authors: IPerson[]
}

interface ShortProps {
    short: IShort,
    skipAuthors?: boolean
}

export const Short = ({ short }: ShortProps) => {
    const user = getCurrenUser();
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
                    <LinkList
                        path="people"
                        items={PickLinks(short.authors)}
                    />: {short.title}
                </div>
            ) : (
                <p>Haetaan tietoja..</p>
            )
            }
        </div>
    )
}