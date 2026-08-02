import { describe, expect, it } from "vitest";
import { inferColumnType } from "../services/dataset.service.js";

describe("spreadsheet column inference", () => {
  it("suggests ordinal for Likert-like integer scales", () => {
    const result = inferColumnType([1, 2, 3, 4, 5, 4, 3, 2]);
    expect(result.measurementType).toBe("ordinal");
    expect(result.requiresConfirmation).toBe(true);
  });

  it("suggests nominal for binary numeric codes", () => {
    expect(inferColumnType([0, 1, 0, 1]).measurementType).toBe("nominal");
  });

  it("suggests metric for continuous numeric values", () => {
    expect(inferColumnType([1.2, 2.7, 3.4, 4.9, 6.1, 7.8, 9.4, 10.2, 12.8, 15.6, 18.3]).measurementType).toBe("metric");
  });
});
