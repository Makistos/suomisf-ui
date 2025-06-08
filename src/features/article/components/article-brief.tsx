import React from 'react';
import { Link } from 'react-router-dom';

import { LinkList } from '../../../components/link-list';
import { Person } from "../../person";
import { Article } from "../types";

interface ArticleProps {
    article: Article,
    skipAuthors?: boolean
}

export const ArticleBrief = ({ article }: ArticleProps) => {
    //const user = getCurrenUser();
    //const op = useRef<OverlayPanel>(null);
    //let [article, setArticle]: [IArticle | null, (article: IArticle) => void] = React.useState<IArticle | null>(null);
    const PickLinks = (items: Person[]) => {
        return items.map((item) => ({
            id: item['id'],
            name: item['name'],
            alt_name: item['alt_name'] ? item['alt_name'] : item['name']
        }))
    }

    return (
        <div>
            {article !== null && article !== undefined && (

                <div>
                    {article.author_rel.length > 0 && (
                        <span>
                            <LinkList
                                path="people"
                                items={PickLinks(article.author_rel)}
                            />
                            : </span>)
                    }
                    {
                        <Link to={`/articles/${article.id}`}
                            key={article.id}
                        >{article.title}
                        </Link>
                    }
                </div>
            )}
        </div >
    )
}