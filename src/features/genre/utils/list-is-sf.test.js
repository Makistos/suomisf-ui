import { listIsSf } from "./list-is-sf";
import * as data from "../../../test-data";

test("Check when every item is SF and has collection", () => {
  expect(listIsSf(data.allSfData)).toBe(true);
});

test("Check when work is not SF", () => {
  expect(listIsSf(data.nonSf)).toBe(false);
});

test("Check when both SF and nonSF are present", () => {
  expect(listIsSf(data.sfWithNonSf)).toBe(true);
});
