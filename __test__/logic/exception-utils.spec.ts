import { catchException } from "src"

describe("Exception utils", () => {
  it("Test catchException", () => {
    const mockHandleException = jest.fn(() => null)
    const error = new Error("Mock error")
    class MockClass {
      @catchException(mockHandleException)
      alwayThrowErrorMethod() {
        throw error
      }
    }
    const mockInstance = new MockClass()
    mockInstance.alwayThrowErrorMethod()
    expect(mockHandleException).toBeCalledWith(error)
  })
})
