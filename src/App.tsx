import React, { useEffect, useRef, useState } from "react";
import {
  ScreenshotTemplate,
  type Aspect,
  type ScreenshotType,
} from "./ScreenshotTemplate";
import githubIcon from "./assets/logo-github.svg";
import moonIcon from "./assets/moon.svg";
import defaultPreviewImage from "./assets/screenshot-example.png?inline";
import sunIcon from "./assets/sun.svg";
import { exportSvgToPng, readFileAsDataURL } from "./imageHelpers";

export const DEFAULT_BG = "#f9f9ff";
const THEME_STORAGE_KEY = "qs-theme";

type ThemeMode = "light" | "dark";

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const normalized = withHash.toLowerCase();

  if (/^#[0-9a-f]{3}$/.test(normalized) || /^#[0-9a-f]{6}$/.test(normalized)) {
    return normalized;
  }

  return null;
}

function resolveInitialTheme(): ThemeMode {
  const documentTheme = document.documentElement.dataset.theme;
  return documentTheme === "dark" ? "dark" : "light";
}

export default function App() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [title, setTitle] = useState("Check out the feed");
  const [subtitle, setSubtitle] = useState("and stay in the loop");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(
    defaultPreviewImage,
  );
  const [type, setType] = useState<ScreenshotType>("bottom");
  const [aspect, setAspect] = useState<Aspect>("square");
  const [backgroundColorInput, setBackgroundColorInput] = useState(DEFAULT_BG);
  const [previewRenderKey, setPreviewRenderKey] = useState(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    resolveInitialTheme(),
  );

  const normalizedBackgroundColor = normalizeHexColor(backgroundColorInput);
  const resolvedBackgroundColor = normalizedBackgroundColor ?? DEFAULT_BG;
  const isBackgroundInvalid =
    backgroundColorInput.trim().length > 0 &&
    normalizedBackgroundColor === null;

  useEffect(() => {
    // Safari can paint the SVG preview in the wrong vertical position on the
    // first render. Remounting it once after mount forces a repaint that fixes it.
    const frameId = requestAnimationFrame(() => {
      setPreviewRenderKey(1);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);

    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [themeMode]);

  const onPickImage: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const inputEl = e.currentTarget;

    void (async () => {
      const file = inputEl.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please choose an image file.");
        inputEl.value = "";
        return;
      }

      const dataUrl = await readFileAsDataURL(file);
      setImageDataUrl(dataUrl);
      inputEl.value = "";
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
    <main className="quickshot">
      <header className="quickshot__header">
        <h1 className="quickshot__title">Fishily Quickshot</h1>
        <div className="quickshot__header-actions">
          <button
            type="button"
            className="quickshot__icon-button"
            aria-label={`Switch to ${themeMode === "light" ? "dark" : "light"} mode`}
            onClick={() =>
              setThemeMode((current) =>
                current === "light" ? "dark" : "light",
              )
            }
          >
            <img
              src={themeMode === "light" ? moonIcon : sunIcon}
              alt="Theme icon"
              aria-hidden="true"
            />
          </button>
          <a
            className="quickshot__icon-button quickshot__icon-link"
            href="https://github.com/fishily-app/fishily_quickshot"
            target="_blank"
            rel="noreferrer"
            aria-label="View source on GitHub"
          >
            <img src={githubIcon} alt="GitHub icon" aria-hidden="true" />
          </a>
        </div>
      </header>
      <div className="quickshot__layout">
        <div className="quickshot__form">
          <label className="field">
            Title
            <input
              className="field__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="field">
            Subtitle
            <input
              className="field__input"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </label>

          <label className="field">
            Screenshot image
            <input
              className="field__file-input"
              type="file"
              accept="image/*"
              onChange={onPickImage}
            />
            <span className="button button--upload">Upload image</span>
          </label>

          <label className="field">
            Background color (hex)
            <input
              className="field__input"
              aria-label="Custom background hex"
              placeholder="#f9f9ff"
              value={backgroundColorInput}
              aria-invalid={isBackgroundInvalid}
              onChange={(e) => setBackgroundColorInput(e.target.value)}
            />
          </label>

          <fieldset className="switch">
            <legend>Aspect ratio</legend>

            <label className="switch__option">
              <input
                type="radio"
                name="aspect-ratio"
                value="square"
                checked={aspect === "square"}
                onChange={() => setAspect("square")}
              />
              <span className="switch__label">Square (1:1)</span>
            </label>

            <label className="switch__option">
              <input
                type="radio"
                name="aspect-ratio"
                value="portrait"
                checked={aspect === "portrait"}
                onChange={() => setAspect("portrait")}
              />
              <span className="switch__label">Portrait (4:5)</span>
            </label>

            <label className="switch__option">
              <input
                type="radio"
                name="aspect-ratio"
                value="story"
                checked={aspect === "story"}
                onChange={() => setAspect("story")}
              />
              <span className="switch__label">Story (9:16)</span>
            </label>
          </fieldset>

          <fieldset className="switch">
            <legend>Screenshot type</legend>

            <label className="switch__option">
              <input
                type="radio"
                name="screenshot-type"
                value="bottom"
                checked={type === "bottom"}
                onChange={() => setType("bottom")}
              />
              <span className="switch__label">Phone bottom</span>
            </label>

            <label className="switch__option">
              <input
                type="radio"
                name="screenshot-type"
                value="top"
                checked={type === "top"}
                onChange={() => setType("top")}
              />
              <span className="switch__label">Phone top</span>
            </label>
          </fieldset>

          <button className="button button--export" onClick={onExport}>
            Export image (PNG)
          </button>
        </div>

        <div className="quickshot__preview">
          <ScreenshotTemplate
            key={`${previewRenderKey}-${aspect}-${type}`}
            svgRef={svgRef}
            title={title}
            subtitle={subtitle}
            imageDataUrl={imageDataUrl}
            type={type}
            aspect={aspect}
            backgroundColor={resolvedBackgroundColor}
          />
        </div>
      </div>

      <p className="quickshot__note">
        <span>Made by the team at</span>
        <a href="https://fishilyapp.com" target="_blank" rel="noreferrer">
          Fishily
        </a>
      </p>
    </main>
  );
}
