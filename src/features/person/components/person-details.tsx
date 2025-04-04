import { getCountryCode } from "@utils/country-utils"
import { Person, PersonBrief } from "../types"

interface PersonDetailsProps {
    person: Person
}
const combineNames = (aliases: PersonBrief[], other_names: string) => {
    //let retval = aliases.map(alias => alias.alt_name ? alias.alt_name : alias.name);
    let retval = aliases.map(alias => alias.alt_name);
    if (other_names) retval.push(other_names);
    return retval.join(', ');
}


export const PersonDetails = ({ person: data }: PersonDetailsProps) => {

    return (
        <div className="grid">
            <div className="grid col-12 pt-0 mt-3 mb-0 pb-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl uppercase m-0">
                    {data.alt_name || data.name}
                </h1>
            </div>
            {
                data.fullname && (
                    <div className="grid col-12 mt-0">
                        <div className="text-lg sm:text-xl text-600">({data.fullname})</div>
                    </div>
                )
            }

            <div className="grid col-12 pt-0 mt-3 mb-1 pb-0 gap-2">
                {data.nationality && (
                    <span className="flex align-items-center gap-1 mb-2 sm:mb-0">
                        {getCountryCode(data.nationality.name) !== "UNKNOWN" ? (
                            <img
                                src={`https://hatscripts.github.io/circle-flags/flags/${getCountryCode(data.nationality.name).toLowerCase()}.svg`}
                                width="24"
                                height="24"
                                alt={data.nationality.name}
                                className="border-circle"
                            />
                        ) : (
                            <i className="pi pi-globe text-600" style={{ fontSize: '1.25rem' }} />
                        )}
                        {data.nationality.name}
                    </span>
                )}
                {(data.dob || data.dod) && (
                    <span className="flex align-items-center gap-1 mb-2 sm:mb-0">
                        <i className="pi pi-calendar" />
                        {data.dob || ''}{data.dob && data.dod ? '–' : ''}{data.dod || ''}
                    </span>
                )}
            </div>

            {/* Aliases and real names */}
            {
                ((data.aliases && data.aliases.length > 0) || data.other_names) && (
                    <div className="grid col-12 mt-3 gap-2 text-600">
                        <span className="mr-2">Myös:</span>
                        <span>{combineNames(data.aliases || [], data.other_names || '')}</span>
                    </div>
                )
            }
            {
                data.bio && (
                    <div className="grid col-12 pl-2 pb-0 mb-0 p-0">
                        <div dangerouslySetInnerHTML={{ __html: data.bio }} />
                        {data.bio_src && (
                            <div className="book-attribution mt-0 col-12 text-right justify-content-end"
                                dangerouslySetInnerHTML={{ __html: data.bio_src }} />
                        )}
                    </div>
                )
            }
        </div >
    )
}