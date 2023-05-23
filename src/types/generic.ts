import { FieldValues } from "react-hook-form";
import { Person } from "../features/person";
import { RoleBrief, Contribution } from "./contribution";

export interface Contributable {
  contributions: Contribution[],
}