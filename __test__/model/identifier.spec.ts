import { Identifier } from "src"

describe("Identifier Test", () => {
  it("test equality", () => {
    const mockId1 = new Identifier<string>("hauhau")
    const mockId2 = new Identifier<string>("hauhau")
    expect(mockId1.equals(mockId2)).toBe(true)
  })
})
