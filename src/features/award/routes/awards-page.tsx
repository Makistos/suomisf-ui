import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { isAdmin } from '../../user';
import { Award } from '../types';
import { AwardForm } from '../components/award-form';

interface AwardInfoProps {
    award: Award
}

const emptyAward: Award = {
    id: 0,
    name: '',
    description: '',
    domestic: false,
    links: [],
    categories: [],
    winners: []
};

export const AwardDescription = ({ award }: AwardInfoProps) => {
    return (
        <div key={award.id}>
            <h3><Link to={`/awards/${award.id}`}>{award.name}</Link></h3>
            {award.description && (
                <div className="html-content"
                    dangerouslySetInnerHTML={{ __html: award.description }} />
            )}
        </div>
    )
}

export const Awards = () => {
    const user = useMemo(() => getCurrenUser(), []);
    const [awards, setAwards] = useState<Award[]>([]);
    const [formVisible, setFormVisible] = useState(false);

    const getAwards = useCallback(async () => {
        const url = 'awards';
        const data = await getApiContent(url, null).then(response => {
            return response.data
        })
        setAwards(data);
    }, []);

    useEffect(() => {
        getAwards();
    }, [getAwards])

    const onFormClose = () => {
        setFormVisible(false);
        getAwards();
    };

    return (
        <main className='all-content'>
            <div className='mb-5'>
                <div className="grid mb-5 justify-content-center">
                    <h1 className='maintitle mb-3'>Palkinnot</h1>
                </div>
                {isAdmin(user) &&
                    <div className="flex justify-content-end mb-4">
                        <Button
                            type="button"
                            label="Lisää palkinto"
                            icon="pi pi-plus"
                            onClick={() => setFormVisible(true)}
                        />
                    </div>
                }
                <div className="mb-5">
                    Kunkin palkinnon kohdalla luetellaan vain teokset ja henkilöt,
                    jojotka löytyvät tietokannasta. SF-aiheisten palkintojen
                    kohdalla tämä tarkoittaa, että henkilöpalkintojen osalta
                    henkilöltä on julkaistu suomeksi ainakin yksi teos ja
                    teosten kohdalla, että juuri kyseinen teos on saatavilla suomeksi.
                </div>
                {awards && awards.filter(award => award.domestic === true).length > 0 &&
                    <>
                        <h2>Kotimaiset palkinnot</h2>
                        {awards.filter(award => award.domestic === true).map(award => (
                            <AwardDescription award={award} />
                        ))}
                    </>
                }
                {awards && awards.filter(award => award.domestic === false).length > 0 &&
                    <>
                        <h2>Ulkomaiset palkinnot</h2>
                        {awards.filter(award => award.domestic === false).map(award => (
                            <AwardDescription award={award} />
                        ))}
                    </>
                }
            </div>
            <Dialog
                maximizable
                blockScroll
                className="w-full xl:w-6"
                visible={formVisible}
                onHide={onFormClose}
                header="Lisää palkinto"
            >
                <AwardForm award={emptyAward} onClose={onFormClose} />
            </Dialog>
        </main >
    )
}
