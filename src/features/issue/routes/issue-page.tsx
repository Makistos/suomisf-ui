import React from 'react';
import { useParams } from "react-router-dom";

import { Image } from 'primereact/image';

import { getCurrenUser } from '../../../services/auth-service';
import { getApiContent } from '../../../services/user-service';
import { Person } from "../../person/types";
import { LinkList } from '../../../components/LinkList';
import { ShortSummary } from '../../short/components/short-summary';
import { ArticleList } from '../../article/components/article-list';
import { Issue } from '../types';

const baseURL = 'issues/';

export type IssueProps = {
    id: number | null,
    index?: number
};

export const IssuePage = ({ id, index }: IssueProps) => {
    let params = useParams();
    const user = getCurrenUser();
    const [issue, setIssue]: [Issue | null, (issue: Issue) => void] = React.useState<Issue | null>(null);
    //const [loading, setLoading]: [boolean, (loading: boolean) => void] = React.useState<boolean>(true);
    //const [error, setError]: [string, (error: string) => void] = React.useState("");

    const PickLinks = (items: Person[]) => {
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
