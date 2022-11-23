import { selectId } from "./select-id";

const params = {
  itemId: "0",
};

describe("ParamValue", () => {
  it("tests with paramvalue", () => {
    expect(selectId(params, "1")).toBe("0");
  });
  it("tests with propvalue", () => {
    expect(selectId(undefined, "1")).toBe("1");
  });
  it("tests exception handling", () => {
    expect(() => selectId(undefined, null)).toThrowError("No id given for");
  });
});
