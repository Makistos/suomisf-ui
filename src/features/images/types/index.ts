import { Edition } from "../../edition/types";

export interface EditionImage {
  [index: string]: any;
  id: number;
  edition_id: number;
  image_src: string;
  image_attr: string;
  edition: Edition;
}