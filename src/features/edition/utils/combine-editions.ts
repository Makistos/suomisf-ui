import { Edition } from "@features/edition";
import { Binding } from "../../../types/binding";
import { ImageType } from "../../../types/image";

type tmpObj = {
    isbn: string,
    binding: Binding,
}

export const combineEditions = (editions: Edition[]): Edition | undefined => {
    let retval = {} as Edition;
    if (editions.length === 0) {
        return undefined;
    }
    if (editions.length === 1) {
        retval.combined = false;
    } else {
        retval.combined = true;
    }

    retval.id = editions[0].id;

    // These should be same for all
    retval.version = editions[0].version;
    retval.title = editions[0].title;
    retval.subtitle = editions[0].subtitle;
    retval.contributions = editions[0].contributions;
    retval.publisher = editions[0].publisher;
    retval.work = editions[0].work;

    // These are only displayed if all editions have the same value
    retval.pages = editions.every(ed => ed.pages === editions[0].pages) ? editions[0].pages : undefined;
    retval.dustcover = editions.every(ed => ed.dustcover === editions[0].dustcover) ? editions[0].dustcover : 1;
    retval.verified = editions.every(ed => ed.verified === editions[0].verified) ? editions[0].verified : false;
    retval.coverimage = editions.every(ed => ed.coverimage === editions[0].coverimage) ? editions[0].coverimage : 1;
    retval.misc = editions.every(ed => ed.misc === editions[0].misc) ? editions[0].misc : '';
    retval.printedin = editions.every(ed => ed.printedin === editions[0].printedin) ? editions[0].printedin : '';
    retval.imported_string = editions.every(ed => ed.imported_string === editions[0].imported_string) ? editions[0].imported_string : '';
    retval.coll_info = editions.every(ed => ed.coll_info === editions[0].coll_info) ? editions[0].coll_info : '';
    retval.pubseries = editions.every(ed => ed.pubseries === editions[0].pubseries) ? editions[0].pubseries : null;
    retval.pubseriesnum = editions.every(ed => ed.pubseriesnum === editions[0].pubseriesnum) ? editions[0].pubseriesnum : undefined;
    retval.size = editions.every(ed => ed.size === editions[0].size) ? editions[0].size : undefined;
    // These values are combined into one string

    const pubyears = editions.map(edition => edition.pubyear).sort();
    if (pubyears[0] === pubyears[pubyears.length - 1]) {
        retval.pubyear = pubyears[0];
    } else {
        retval.pubyear = pubyears[0] + " - " + pubyears[pubyears.length - 1];
    }
    const ednums = editions.map(edition => edition.editionnum).sort((a, b) => Number(a) - Number(b));
    if (ednums[0] === ednums[editions.length - 1]) {
        retval.editionnum = ednums[0];
    } else {
        const start = ednums[0] ? ednums[0] : "?";
        const end = ednums[editions.length - 1] ? ednums[editions.length - 1] : "?";
        retval.editionnum = start + " - " + end;
    }
    let isbns: tmpObj[] = [];
    for (const edition of editions) {
        isbns.push({
            isbn: edition.isbn === null ? "" : typeof (edition.isbn) == "string" ? edition.isbn : edition.isbn[0].isbn,
            binding: edition.binding
        });
    }

    // Remove duplicates
    retval.isbn = isbns.filter((value, idx, self) =>
        idx === self.findIndex(t =>
            (t.isbn === value.isbn && t.binding.id === value.binding.id)));

    // Images are combined into a list
    let images = [] as ImageType[];
    for (const edition of editions) {
        for (const image of edition.images) {
            // Following sets id for all images to the first image. This is done
            // to make removing duplicates possible. This id only matters when
            // there is just one image in the list.
            image.id = editions[0].id;
            images.push(image);
        }
    }
    retval.images = [];
    let already_added = [] as string[];
    for (const image of images) {
        if (!(already_added.includes(image.image_src))) {
            retval.images.push(image);
            already_added.push(image.image_src);
        }
    }
    return retval;
}