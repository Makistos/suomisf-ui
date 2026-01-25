import { useEffect, useState, useMemo } from 'react';

import { Work } from '../types';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { WorkList } from '../components/work-list';

type WorksByTypeProps = {
    worktype: string,
}

const workTypeNames: Record<string, string> = {
    '1': 'Romaanit',
    '2': 'Kokoelmat',
    '3': 'Sarjakuvat',
    '4': 'Tietokirjat',
    '5': 'Vihkot',
    '6': 'Kokoomateokset',
};

export const WorksByType = ({ worktype }: WorksByTypeProps) => {
    const [works, setWorks] = useState<Work[]>([]);
    const user = useMemo(() => { return getCurrenUser() }, []);

    useEffect(() => {
        async function getWorks() {
            const url = `works/bytype/${worktype}`;
            try {
                const response = await getApiContent(url, user);
                setWorks(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        getWorks();
    }, [worktype, user])

    return (
        <main className="all-content">
            <h1 className="title">{workTypeNames[worktype] || worktype}</h1>
            <WorkList works={works} />
        </main>
    )
}
