import { listIsSf } from "./list-is-sf";

const allSfData = [
  { id: 0, abbr: "SF" },
  { id: 3, abbr: "kok" },
];
const nonSf = [{ id: 1, abbr: "eiSF" }];
const sfWithNonSf = [
  { id: 0, abbr: "SF" },
  { id: 1, abbr: "eiSF" },
];

test("Check when every item is SF and has collection", () => {
  expect(listIsSf(allSfData)).toBe(true);
});

test("Check when work is not SF", () => {
  expect(listIsSf(nonSf)).toBe(false);
});

test("Check when both SF and nonSF are present", () => {
  expect(listIsSf(sfWithNonSf)).toBe(true);
});
