import React, { useEffect, useState } from 'react';

import { Work } from '../types';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { WorkList } from '../components/work-list';

type WorksProp = {
    letter: string,
}

const baseURL = 'works/';

export const WorksPage = ({ letter }: WorksProp) => {
    const [works, setWorks] = useState<Work[]>([]);
    const user = getCurrenUser();

    useEffect(() => {
        async function getWorks() {
            let url = baseURL + letter;
            try {
                const response = await getApiContent(url, user);
                setWorks(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        getWorks();
    }, [letter])

    return (
        <div>
            <WorkList works={works} />
        </div>
    )
}