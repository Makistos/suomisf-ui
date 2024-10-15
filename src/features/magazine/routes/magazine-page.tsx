import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { useParams } from "react-router-dom";
import { IssuePage } from '../../issue';
import { Magazine } from '../types';
import { useDocumentTitle } from '../../../components/document-title';
import { Toast } from 'primereact/toast';
import { IssueForm } from '@features/issue/components/issue-form';
import { Dialog } from 'primereact/dialog';
import { isAdmin } from '@features/user';
import { Tooltip } from 'primereact/tooltip';
import { SpeedDial } from 'primereact/speeddial';
import { set } from 'lodash';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMagazine } from '@api/magazine/get-magazine';
import { ProgressSpinner } from 'primereact/progressspinner';


const baseURL = "magazines/";

export const MagazinePage = () => {

    /*var issueSort = function (a: IIssue, b: IIssue): number {
        // Prioritize count, this is a running number
        // that doesn't care about years etc.
        if (a.count != null && b.count != null) {
            return a.count - b.count;
        }
        if (a.year != b.year) {
            return a.year - b.year;
        }
        // No count, same year, so down to last chance saloon
        if (a.number != b.number) {
            return a.number - b.number;
        } else {
            if (a.number_extra > b.number_extra) {
                return 1;
            }
            if (b.number_extra > a.number_extra) {
                return -1;
            }
        }
        return 0;
    }*/

    let params = useParams();
    const magazineId = params.magazineId;
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [queryEnabled, setQueryEnabled] = useState(true);

    const [isIssueFormVisible, setIssueFormVisible] = React.useState(false);
    const toastRef = useRef<Toast>(null);
    const queryClient = useQueryClient();

    const { isLoading, data } = useQuery({
        queryKey: ['magazine', magazineId],
        queryFn: () => getMagazine(magazineId !== undefined ? magazineId : null, user),
        enabled: queryEnabled
    })

    useEffect(() => {
        if (data !== undefined && data !== null)
            setDocumentTitle(data.name);
    }, [data])

    const dialItems = [
        {
            label: 'Uusi numero',
            icon: 'fa-solid fa-circle-plus',
            command: () => { setIssueFormVisible(true) }
        },
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => { }
        }
    ]

    const onIssueFormHide = () => {
        setIssueFormVisible(false);
        queryClient.invalidateQueries({ queryKey: ['magazine', magazineId] });
    }

    if (!data) return null;

    return (
        <main className="all-content">
            <div className="mt-5 speeddial style={{ position: 'relative', height: '500px'}}">
                {isAdmin(user) &&
                    <div>
                        <Tooltip position="left" target=".speeddial .speeddial-right .p-speeddial-action">

                        </Tooltip>
                        <SpeedDial className="speeddial-right"
                            model={dialItems}
                            direction='left'
                            type="semi-circle"
                            radius={80}
                        />
                    </div>
                }
                <Toast ref={toastRef} />
                <Dialog maximizable blockScroll
                    className="w-full xl:w-6"
                    header="Uusi numero"
                    visible={isIssueFormVisible}
                    onHide={() => setIssueFormVisible(false)}
                    onShow={() => setIssueFormVisible(true)}>
                    <IssueForm
                        issueid={null}
                        magazineid={data.id}
                        onSubmitCallback={onIssueFormHide}
                    />
                </Dialog>

                <h1 className="title">{data.name}</h1>
                <p>{data.issues.length} numeroa.</p>
                {isLoading ? (
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>
                )
                    : (
                        <div>
                            {data.issues.length > 0 &&
                                <div className="card">
                                    {
                                        data.issues
                                            .map((issue, index) => (
                                                <div className="card" key={issue}>
                                                    <IssuePage
                                                        id={issue}
                                                        magazine_id={data.id}
                                                        index={index}
                                                        onSubmitCallback={onIssueFormHide}
                                                        toast={toastRef}
                                                    />
                                                </div>
                                            ))
                                    }
                                </div>
                            }
                        </div>
                    )}
            </div>
        </main >
    )
}
