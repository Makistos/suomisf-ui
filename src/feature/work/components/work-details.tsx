import { Link } from "react-router-dom";

import { GenreGroup } from "../../../components/Genre";
import { TagGroup } from "../../../components/Tag/SFTagGroup";
import { LinkList } from "../../../components/LinkList";
import { AwardPanel } from "../../Award/Awarded";
import { LinkPanel } from "../../../components/Links";
import { WorkProps } from "../routes/work-page";


export const WorkDetails = ({ work }: WorkProps) => {
    return (
        <div className="grid align-items-center justify-content-center">
            {work.authors && (
                <div className="grid col-12 justify-content-center">
                    <h3 className="mb-0">
                        <LinkList path="people"
                            separator=" &amp; "
                            items={work.authors.map((item) => ({
                                id: item['id'],
                                name: item['alt_name'] ? item['alt_name'] : item['name']
                            }))} />
                    </h3>
                </div>
            )}
            <div className="grid col-12 justify-content-center"><h1 className="mt-1 mb-0">{work.title}</h1></div>
            <div className="grid col-12 justify-content-center">
                <p className="mt-1">
                    {work.orig_title !== work.title && work.orig_title + ", "}
                    {work.pubyear}
                    {work.language_name && " (" + work.language_name.name + ")"}
                </p>
                <div className="col-12">
                    <GenreGroup genres={work.genres} />
                </div>
                <div className="col-12">
                    <TagGroup tags={work.tags} overflow={5} showOneCount />
                </div>
                <div className="grid col-12 justify-content-center">
                    <div className="grid col-6 p-3 justify-content-end">
                        <AwardPanel awards={work.awards}></AwardPanel>
                    </div>
                    <div className="grid col-6 p-3 justify-content-start">
                        <LinkPanel links={work.links} />
                    </div>
                </div>
                {work.bookseries && (
                    <div className="col-12">
                        <Link to={`/bookseries/${work.bookseries.id}`}>
                            <b>{work.bookseries.name}</b>
                        </Link>
                        {work.bookseriesnum && (
                            ", numero " + work.bookseriesnum
                        )}
                    </div>
                )}
                <div className="col-12">
                    {work.misc}
                </div>
                {work.description && (
                    <div className="col-12">
                        <div dangerouslySetInnerHTML={{ __html: work.description }} />
                    </div>
                )}
            </div>
        </div>
    );
};
