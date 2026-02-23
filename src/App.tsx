import React, { useRef, useState } from "react";
import { ScreenshotTemplate } from "./ScreenshotTemplate";
import { exportSvgToPng, readFileAsDataURL } from "./imageHelpers";

export default function App() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [title, setTitle] = useState("Here is the title");
  const [subtitle, setSubtitle] = useState("and the subtitle");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(
    undefined,
  );

  const onPickImage: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    void (async () => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please choose an image file.");
        e.target.value = "";
        return;
      }

      const dataUrl = await readFileAsDataURL(file);
      setImageDataUrl(dataUrl);

      e.target.value = "";
    })();
  };

  const onExport = () => {
    void (async () => {
      const svgEl = svgRef.current;
      if (!svgEl) {
        alert("SVG not ready yet. Try again.");
        return;
      }

      await exportSvgToPng(svgEl, "fishily-square.png");
    })();
  };

  return (
    <main>
      <h1>Fishily Quickshot</h1>
      <div>
        <ScreenshotTemplate
          ref={svgRef}
          title={title}
          subtitle={subtitle}
          imageDataUrl={imageDataUrl}
        />
      </div>
      <div>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label>
          Subtitle
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </label>

        <label>
          Screenshot image
          <input type="file" accept="image/*" onChange={onPickImage} />
          <span className="upload-button">Upload image</span>
        </label>

        <button onClick={onExport}>Export image</button>
      </div>
    </main>
  );
}
