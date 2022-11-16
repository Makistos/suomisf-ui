import { EditionString } from "./edition-string";
import { EditionProps } from "../types";


export const EditionVersion = ({ edition }: EditionProps) => {
    return (
        <span>{EditionString(edition)}</span>
    );
};
