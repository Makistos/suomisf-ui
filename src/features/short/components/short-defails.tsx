import { LinkList } from "@components/link-list"
import { Short } from "../types"
import { removeDuplicateContributions } from "@utils/remove-duplicate-contributions"

interface ShortDetailsProps {
    short: Short
}
export const ShortDetails = ({ short: data }: ShortDetailsProps) => {
    return (
        <div className="grid">
            {data.contributors.filter(person => person.role.id === 1).length > 0 && (
                <div className="grid col-12 mb-0 pb-0">
                    <h2 className="mb-0 font-semibold">
                        <LinkList path="people"
                            separator=" &amp; "
                            items={removeDuplicateContributions(data.contributors).filter(person => person.role.id === 1).map((item) => ({
                                id: item.person['id'],
                                name: item.person['name'],
                                alt_name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                            }))} />
                    </h2>
                </div>
            )}
            {data.contributors &&
                data.contributors.filter(person => person.role.id === 1).length === 0 &&
                data.contributors.filter(person => person.role.id === 3).length > 0 && (
                    <div className="grid col-12" mt-0 pt-0>
                        <h2 className="mb-0 font-semibold">
                            <LinkList path="people"
                                separator=" &amp; "
                                items={removeDuplicateContributions(data.contributors).filter(person => person.role.id === 3).map((item) => ({
                                    id: item.person['id'],
                                    name: item.person['name'],
                                    alt_name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                                }))} />
                        </h2>
                    </div>
                )}
            <div className="grid col-12 pt-0 mt-0 mb-1 pb-0">
                <h1 className="mt-0 mb-0 text-2xl sm:text-3xl lg:text-4xl uppercase">{data.title}</h1>
            </div>
            <div className="grid col-12 mt-0 pt-0 p-2">
                <p className="font-medium text-sm mt-0">
                    {data.orig_title && data.orig_title !== data.title &&
                        data.orig_title
                    }
                    {data.orig_title && data.orig_title !== data.title && data.pubyear && ", "}
                    {data.pubyear && data.pubyear}
                    &nbsp;{data.lang && "(" + data.lang.name + ")"}
                </p>
                <div className="col-12 justify-content-start">
                    {data.type.name}.<br />
                    {data.contributors.filter(contrib => contrib.role.id === 2).length > 0 && (
                        <>
                            Suom.&nbsp;
                            <LinkList path="people"
                                separator=" &amp; "
                                items={removeDuplicateContributions(data.contributors).filter(contrib => contrib.role.id === 2).map((item) => ({
                                    id: item.person['id'],
                                    name: item.person['name'],
                                    alt_name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                                }))} />
                        </>
                    )}
                    {data.contributors.filter(contrib => contrib.role.id === 6).length > 0 && (
                        <>
                            Henkilöt&nbsp;
                            <LinkList path="people"
                                separator=" &amp; "
                                items={data.contributors.filter(contrib => contrib.role.id === 6).map((item) => ({
                                    id: item.person['id'],
                                    name: item.person['name'],
                                    alt_name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                                }))} />
                        </>
                    )}
                </div>
            </div>
        </div>

    )
}