import { Person } from "../features/person";
import { Contribution } from "./contribution";

export interface Contributable {
  contributions: Contribution[],
}