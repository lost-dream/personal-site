import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the four-section portfolio without the retired life module", () => {
    const { container } = render(<App />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(container.querySelectorAll("main > section")).toHaveLength(4);

    for (const id of ["home", "experience", "projects", "practice"]) {
      expect(container.querySelector(`#${id}`)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", { name: "把热爱付诸实践" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "生活，不止一种视角" }),
    ).not.toBeInTheDocument();
    expect(container.querySelector('#life, a[href="#life"]')).toBeNull();
  });
});
