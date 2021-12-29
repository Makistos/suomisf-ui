import React from 'react';
import { LinkList, LinkItem } from './LinkList';
import { IPerson } from '../Person';
import { getApiContent } from '../services/user-service';
import { getCurrenUser } from '../services/auth-service';
import { setLocale } from 'yup';

const baseURL = 'articles/';

export interface IArticle {
    id: number,
    title: string,
    author_rel: IPerson[]
}

interface ArticleProps {
    id: number,
    skipAuthors?: boolean
}

export const Article = ({ id }: ArticleProps) => {
    const user = getCurrenUser();
    let [article, setArticle]: [IArticle | null, (article: IArticle) => void] = React.useState<IArticle | null>(null);
    const PickLinks = (items: IPerson[]) => {
        let retval: LinkItem[] = [];
        items.map((item) => (
            retval.push({ id: item['id'], name: item['alt_name'] })
        ))
        return retval;
    }

    React.useEffect(() => {
        async function getArticle() {
            let url = baseURL + id?.toString();
            try {
                const response = await getApiContent(url, user);
                setArticle(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        getArticle();
    }, [id])

    if (!article) return null;

    return (
        <div>
            {article !== null && article !== undefined ? (

                <div>
                    <LinkList
                        path="people"
                        items={PickLinks(article.author_rel)}
                    />: {article.title}
                </div>
            ) : (
                <p>Haetaan tietoja...</p>
            )

            }
        </div>
    )
}