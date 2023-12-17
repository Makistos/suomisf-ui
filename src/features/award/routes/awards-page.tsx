import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getApiContent } from '../../../services/user-service';
import { Award } from '../types';

interface AwardInfoProps {
    award: Award
}

export const AwardDescription = ({ award }: AwardInfoProps) => {
    return (
        <div key={award.id}>
            <h3><Link to={`/awards/${award.id}`}>{award.name}</Link></h3>
            {award.description}
        </div>
    )
}

export const Awards = () => {
    const [awards, setAwards] = useState<Award[]>([]);

    useEffect(() => {
        async function getAwards() {
            const url = 'awards';
            const data = await getApiContent(url, null).then(response => {
                return response.data
            })
            setAwards(data);
        }
        getAwards();
    }, [])

    return (
        <main className='all-content'>
            <div className='mb-5'>
                <div className="grid mb-5 justify-content-center">
                    <h1 className='maintitle mb-3'>Palkinnot</h1>
                </div>
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
        </main >
    )
}