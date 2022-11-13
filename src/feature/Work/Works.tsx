import React, { useEffect, useState } from 'react';
import { IWork, groupWorks } from './Work';
import { getApiContent } from '../../services/user-service';
import { getCurrenUser } from '../../services/auth-service';
import { WorkList } from './WorkList';

type WorksProp = {
    letter: string,
}

const baseURL = 'works/';

export const Works = ({ letter }: WorksProp) => {
    const [works, setWorks] = useState<IWork[]>([]);
    const [firstLetter, setFirstLetter] = useState(letter);
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