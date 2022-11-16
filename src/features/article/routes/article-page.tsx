import React from 'react';
import { useParams } from "react-router-dom";

import { LinkList } from '../../../components/LinkList';
import { Person } from "../../person/types";
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { PickTagLinks } from "../../tag";
import { Article } from "../types";

const baseURL = 'articles/';

interface ArticleProps {
    id: number | null
}
export const ArticlePage = () => {
    const params = useParams();
    let id: number | null = null;
    if (params.id !== undefined && params.articleId !== undefined) {
        id = parseInt(params.articleId);
    } else {
        id = null;
    }
    return (
        <ArticleView key={id} id={id} />
    )
}
export const ArticleView = ({ id }: ArticleProps) => {
    const user = getCurrenUser();
    let params = useParams();
    const [article, setArticle]: [Article | null, (article: Article) => void] = React.useState<Article | null>(null);
    //const [loading, setLoading]: [boolean, (loading: boolean) => void] = React.useState<boolean>(true);
    const PickLinks = (items: Person[]) => {
        return items.map((item) => ({ id: item['id'], name: item['name'] }))
    }

    React.useEffect(() => {
        async function getArticle() {
            let url = baseURL + params.articleId?.toString();
            try {
                const response = await getApiContent(url, user);
                setArticle(response.data);
                //setLoading(false);
            }
            catch (e) {
                console.error(e);
            }
        }
        getArticle();
    }, [params.articleId, user])

    if (!article) return null;

    return (
        <main className="all-content">
            <h3 className="name">
                <LinkList
                    path="people"
                    items={PickLinks(article.author_rel)}
                /></h3>
            <h1 className="p-text-center">{article.title}</h1>
            <div>Lehdessä {article.issue.magazine.name} {article.issue.cover_number}
            </div>
            {
                article.tags.length > 0 &&
                <LinkList
                    path="tags"
                    items={PickTagLinks(article.tags)}
                />
            }
            {article.person &&
                <p>Henkilö: {article.person}</p>
            }
        </main >
    )
}

export default ArticlePage;