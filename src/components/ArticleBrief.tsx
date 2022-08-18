import React from 'react';
import { LinkList } from './LinkList';
import { IPerson } from './Person';
import { Link } from 'react-router-dom';
import { IArticle } from './Article';

interface ArticleProps {
    article: IArticle,
    skipAuthors?: boolean
}

export const ArticleBrief = ({ article }: ArticleProps) => {
    //const user = getCurrenUser();
    //const op = useRef<OverlayPanel>(null);
    //let [article, setArticle]: [IArticle | null, (article: IArticle) => void] = React.useState<IArticle | null>(null);
    const PickLinks = (items: IPerson[]) => {
        return items.map((item) => ({ id: item['id'], name: item['alt_name'] ? item['alt_name'] : item['name'] }))
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