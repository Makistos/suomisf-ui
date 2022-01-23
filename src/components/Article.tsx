import React from 'react';
import { useParams, Link } from "react-router-dom";
import { LinkList, LinkItem } from './LinkList';
import { IPerson, IPersonBrief } from '../Person';
import { getApiContent } from '../services/user-service';
import { getCurrenUser } from '../services/auth-service';
import { IMagazine } from '../magazine';
import { setLocale } from 'yup';
import { ITag, PickTagLinks } from './Tag';
import { IIssue } from '../Issue';
const baseURL = 'articles/';

export interface IArticle {
    id: number,
    title: string,
    person: string,
    excerpt: string,
    author_rel: IPerson[],
    issue: IIssue,
    //links: ILink[],
    tags: ITag[]
}

interface ArticleProps {
    id: number | null
}
export const Article = () => {
    const params = useParams();
    let id: number | null = null;
    if (params.id !== undefined) {
        let id = params.articleId;
    } else {
        let id = null;
    }
    return (
        <ArticleView key={id} id={id} />
    )
}
export const ArticleView = ({ id }: ArticleProps) => {
    const user = getCurrenUser();
    let params = useParams();
    const [article, setArticle]: [IArticle | null, (article: IArticle) => void] = React.useState<IArticle | null>(null);
    const [loading, setLoading]: [boolean, (loading: boolean) => void] = React.useState<boolean>(true);
    const PickLinks = (items: IPerson[]) => {
        return items.map((item) => ({ id: item['id'], name: item['alt_name'] ? item['alt_name'] : item['name'] }))
    }

    React.useEffect(() => {
        async function getArticle() {
            let url = baseURL + params.articleId?.toString();
            try {
                const response = await getApiContent(url, user);
                setArticle(response.data);
                setLoading(false);
            }
            catch (e) {
                console.error(e);
            }
        }
        getArticle();
    }, [])

    if (!article) return null;

    return (
        <main className="p-mt-6 p-pt-6">
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

export default Article;