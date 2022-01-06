import React from 'react';
import { LinkList, LinkItem } from './LinkList';
import { IPerson, IPersonBrief } from '../Person';
import { getApiContent } from '../services/user-service';
import { getCurrenUser } from '../services/auth-service';
const baseURL = 'articles/';

export interface IArticle {
    id: number,
    title: string,
    person: string,
    excerpt: string,
    author_rel: IPersonBrief[]
}

interface ArticleProps {
    article: IArticle,
    skipAuthors?: boolean
}

export const Article = ({ article }: ArticleProps) => {
    const user = getCurrenUser();
    //let [article, setArticle]: [IArticle | null, (article: IArticle) => void] = React.useState<IArticle | null>(null);
    const PickLinks = (items: IPersonBrief[]) => {
        return items.map((item) => ({ id: item['id'], name: item['alt_name'] ? item['alt_name'] : item['name'] }))
    }

    // React.useEffect(() => {
    //     async function getArticle() {
    //         let url = baseURL + id?.toString();
    //         try {
    //             const response = await getApiContent(url, user);
    //             setArticle(response.data);
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     }
    //     getArticle();
    // }, [id])

    //if (!article) return null;

    return (
        <div>
            {article !== null && article !== undefined ? (

                <div>
                    {article.author_rel.length > 0 &&
                        <LinkList
                            path="people"
                            items={PickLinks(article.author_rel)}
                        />}
                    : {article.title}

                </div>
            ) : (
                <p>Haetaan tietoja...</p>
            )

            }
        </div>
    )
}