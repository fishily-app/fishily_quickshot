import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import App from "./App";

it("renders", () => {
  render(<App />);
  expect(screen.getByText(/Fishily Quickshot/i)).toBeInTheDocument();
});
