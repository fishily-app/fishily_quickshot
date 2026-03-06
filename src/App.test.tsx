import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App, { DEFAULT_BG } from "./App";

const { mockExportSvgToPng, mockReadFileAsDataURL } = vi.hoisted(() => ({
  mockExportSvgToPng: vi.fn<typeof import("./imageHelpers").exportSvgToPng>(),
  mockReadFileAsDataURL:
    vi.fn<typeof import("./imageHelpers").readFileAsDataURL>(),
}));

vi.mock("./imageHelpers", () => ({
  exportSvgToPng: mockExportSvgToPng,
  readFileAsDataURL: mockReadFileAsDataURL,
}));

function getSvg(container: HTMLElement): SVGSVGElement {
  const svg = container.querySelector(".svg-square");
  expect(svg).toBeInTheDocument();
  return svg as SVGSVGElement;
}

function getBackgroundRect(container: HTMLElement): SVGRectElement {
  const rect = container.querySelector(".svg-square > rect");
  expect(rect).toBeInTheDocument();
  return rect as SVGRectElement;
}

describe("App", () => {
  beforeEach(() => {
    mockExportSvgToPng.mockReset();
    mockReadFileAsDataURL.mockReset();
    mockExportSvgToPng.mockResolvedValue(undefined);
    mockReadFileAsDataURL.mockResolvedValue("data:image/png;base64,uploaded");
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders primary features and default controls", () => {
    const { container } = render(<App />);

    expect(
      screen.getByRole("heading", { name: /fishily quickshot/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Subtitle")).toBeInTheDocument();
    expect(screen.getByLabelText("Custom background hex")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Square (1:1)" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Phone bottom" })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Export image (PNG)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fishily" })).toHaveAttribute(
      "href",
      "https://fishilyapp.com",
    );

    expect(getSvg(container).getAttribute("viewBox")).toBe("0 0 1080 1080");
  });

  it("updates title and subtitle in the SVG preview", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Agent Title");
    await user.clear(screen.getByLabelText("Subtitle"));
    await user.type(screen.getByLabelText("Subtitle"), "Agent Subtitle");

    const titleText = container.querySelector(
      '.svg-square text[fill="#000000"]',
    );
    const subtitleText = container.querySelector(
      '.svg-square text[fill="#707070"]',
    );
    expect(titleText).toHaveTextContent("Agent Title");
    expect(subtitleText).toHaveTextContent("Agent Subtitle");
  });

  it("validates custom background hex and falls back to default when invalid", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const backgroundInput = screen.getByLabelText("Custom background hex");

    await user.clear(backgroundInput);
    await user.type(backgroundInput, "not-a-color");
    expect(backgroundInput).toHaveAttribute("aria-invalid", "true");
    expect(getBackgroundRect(container)).toHaveAttribute("fill", DEFAULT_BG);

    await user.clear(backgroundInput);
    await user.type(backgroundInput, "#ffffff");
    expect(backgroundInput).toHaveAttribute("aria-invalid", "false");
    expect(getBackgroundRect(container)).toHaveAttribute("fill", "#ffffff");
  });

  it("switches aspect and screenshot type and updates SVG config", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("radio", { name: "Portrait (4:5)" }));
    expect(getSvg(container).getAttribute("viewBox")).toBe("0 0 1080 1350");

    const previewImage = container.querySelector(".svg-square image");
    expect(previewImage).toBeInTheDocument();
    expect(previewImage).toHaveAttribute(
      "preserveAspectRatio",
      "xMidYMin slice",
    );

    await user.click(screen.getByRole("radio", { name: "Phone top" }));
    expect(container.querySelector(".svg-square image")).toHaveAttribute(
      "preserveAspectRatio",
      "xMidYMax slice",
    );
  });

  it("uploads image files and rejects non-image files", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const input = container.querySelector(
      '.field__file-input[type="file"]',
    ) as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const imageFile = new File(["image"], "photo.png", { type: "image/png" });
    await user.upload(input, imageFile);
    await waitFor(() => {
      expect(mockReadFileAsDataURL).toHaveBeenCalledWith(imageFile);
    });

    const nonImageFile = new File(["text"], "notes.txt", {
      type: "text/plain",
    });
    fireEvent.change(input, { target: { files: [nonImageFile] } });
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Please choose an image file.");
    });
  });

  it("exports the current SVG with the expected filename", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Export image (PNG)" }));
    await waitFor(() => {
      expect(mockExportSvgToPng).toHaveBeenCalledTimes(1);
    });

    const [svgArg, filenameArg] = mockExportSvgToPng.mock.calls[0] as [
      SVGSVGElement,
      string,
    ];
    expect(svgArg).toBeInstanceOf(SVGSVGElement);
    expect(svgArg).toHaveClass("svg-square");
    expect(svgArg.getAttribute("viewBox")).toBe("0 0 1080 1080");
    expect(filenameArg).toBe("fishily-square.png");
  });
});
