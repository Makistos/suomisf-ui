import React from 'react';
import { getCurrenUser } from './services/auth-service';
import { getApiContent } from './services/user-service';
import type { IPerson } from './feature/Person/Person';
import { IPublicationSize } from './PublicationSize';
import { LinkList } from './components/LinkList';
import { ShortSummary, IShort } from './components/Short';
import type { IArticle } from './components/Article';
import { Image } from 'primereact/image';
import type { IMagazine } from './Magazine';
import { useParams } from "react-router-dom";
import { ArticleList } from './components/ArticleList';

const baseURL = 'issues/';

export interface IIssue {
    id: number,
    type: number,
    number: number,
    number_extra: string,
    count: number,
    year: number,
    cover_number: string,
    publisher_id: number,
    image_src: string,
    pages: number,
    size: IPublicationSize,
    link: string,
    notes: string,
    title: string,
    editors: IPerson[],
    articles: IArticle[],
    stories: IShort[],
    magazine: IMagazine
}

export type IssueProps = {
    id: number | null,
    index?: number
};

export const Issue = ({ id, index }: IssueProps) => {
    let params = useParams();
    const user = getCurrenUser();
    const [issue, setIssue]: [IIssue | null, (issue: IIssue) => void] = React.useState<IIssue | null>(null);
    //const [loading, setLoading]: [boolean, (loading: boolean) => void] = React.useState<boolean>(true);
    //const [error, setError]: [string, (error: string) => void] = React.useState("");

    const PickLinks = (items: IPerson[]) => {
        return items.map((item) => ({ id: item['id'], name: item['alt_name'] ? item['alt_name'] : item['name'] }))
    }

    React.useEffect(() => {
        async function getIssue() {
            let issueId = id;
            if (id === null && params.issueId) {
                issueId = parseInt(params.issueId);
            }
            let url = baseURL + issueId?.toString();
            try {
                const response = await getApiContent(url, user);
                setIssue(response.data);
                //setLoading(false);
            } catch (e) {
                console.error(e);
            }
        }
        getIssue();
    }, [id, user, params.issueId])

    if (!issue) return null;

    return (
        <div className="p-m-3">
            {issue !== null && issue !== undefined ? (
                <div className="p-grid">
                    <div className="p-col-12 p-md-8">
                        <h2>{issue.magazine.name} {issue.cover_number}</h2>
                        <div>
                            {issue.editors && issue.editors.length && (
                                <LinkList
                                    path="people"
                                    separator=" &amp; "
                                    items={PickLinks(issue.editors)}
                                />)}
                            {issue.editors.length && " (päätoimittaja)"}

                        </div>
                        {issue.pages && issue.pages > 0 ? issue.pages + " sivua." : ""}

                        {issue.size ? " " + issue.size.name + "." : ""}
                        {issue.articles.length > 0 && (
                            <div className="p-pt-2"><b>Artikkelit</b>
                                <div className="p-ml-3">
                                    <ArticleList articles={issue.articles} />
                                </div>
                            </div>
                        )
                        }
                        {issue.stories.length > 0 && (
                            <div className="p-pt-2"><b>Novellit</b>
                                <div className="p-ml-3">
                                    {
                                        issue.stories
                                            .map((story) => (
                                                <ShortSummary key={story.id}
                                                    short={story}
                                                />
                                            ))
                                    }
                                </div>
                            </div>
                        )
                        }
                    </div>
                    <div className="p-col-12 p-md-4">
                        {issue.image_src ? (
                            <Image src={issue.image_src} width="250px" preview
                                alt="{issue.cover_number} kansikuva"
                            />
                        ) : ("")
                        }
                    </div>
                </div>

            ) : (
                <p>Haetaan tietoja...</p>
            )
            }
        </div>
    )
}
