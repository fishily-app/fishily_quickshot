import { expect, test, type Page } from "@playwright/test";

type Scenario = {
  name: string;
  aspectLabel: "Square (1:1)" | "Portrait (4:5)";
  typeLabel: "Phone bottom" | "Phone top";
  backgroundHex: string;
};

type ScenarioMetrics = {
  scenario: string;
  viewBox: string | null;
  titleY: number | null;
  subtitleY: number | null;
  phoneY: number | null;
  phoneHeight: number | null;
  preserveAspectRatio: string | null;
  backgroundFill: string | null;
};

type SvgLikeElement = {
  getAttribute(name: string): string | null;
  querySelector(selector: string): SvgLikeElement | null;
};

const SCENARIOS: Scenario[] = [
  {
    name: "square-bottom-light",
    aspectLabel: "Square (1:1)",
    typeLabel: "Phone bottom",
    backgroundHex: "#f9f9ff",
  },
  {
    name: "square-top-light",
    aspectLabel: "Square (1:1)",
    typeLabel: "Phone top",
    backgroundHex: "#f9f9ff",
  },
  {
    name: "portrait-bottom-light",
    aspectLabel: "Portrait (4:5)",
    typeLabel: "Phone bottom",
    backgroundHex: "#f9f9ff",
  },
  {
    name: "portrait-top-dark",
    aspectLabel: "Portrait (4:5)",
    typeLabel: "Phone top",
    backgroundHex: "#000000",
  },
];

async function applyScenario(page: Page, scenario: Scenario) {
  const titleInput = page.getByLabel("Title", { exact: true });
  const subtitleInput = page.getByLabel("Subtitle", { exact: true });
  const bgInput = page.getByLabel("Custom background hex");

  await titleInput.fill(`Agent ${scenario.name}`);
  await subtitleInput.fill("Visual compare baseline");
  await bgInput.fill(scenario.backgroundHex);

  await page.getByRole("radio", { name: scenario.aspectLabel }).check();
  await page.getByRole("radio", { name: scenario.typeLabel }).check();

  await expect(page.getByRole("radio", { name: scenario.aspectLabel })).toBeChecked();
  await expect(page.getByRole("radio", { name: scenario.typeLabel })).toBeChecked();
}

async function readScenarioMetrics(
  page: Page,
  scenarioName: string,
): Promise<ScenarioMetrics> {
  return page.locator(".svg-square").evaluate((svg: SvgLikeElement, scenario: string) => {
    const rootRect = svg.querySelector("rect");
    const titleText = svg.querySelector('text[fill="#000000"]');
    const subtitleText = svg.querySelector('text[fill="#707070"]');
    const phoneContent = svg.querySelector("image, rect[fill='#151518']");

    return {
      scenario,
      viewBox: svg.getAttribute("viewBox"),
      titleY: titleText ? Number(titleText.getAttribute("y")) : null,
      subtitleY: subtitleText ? Number(subtitleText.getAttribute("y")) : null,
      phoneY: phoneContent ? Number(phoneContent.getAttribute("y")) : null,
      phoneHeight: phoneContent ? Number(phoneContent.getAttribute("height")) : null,
      preserveAspectRatio: phoneContent
        ? phoneContent.getAttribute("preserveAspectRatio")
        : null,
      backgroundFill: rootRect ? rootRect.getAttribute("fill") : null,
    };
  }, scenarioName);
}

test("core UI controls and orientation behavior", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Fishily Quickshot" })).toBeVisible();

  const bottom = SCENARIOS[0];
  const top = SCENARIOS[1];

  await applyScenario(page, bottom);
  const bottomMetrics = await readScenarioMetrics(page, bottom.name);

  await page.locator(".svg-square").screenshot({
    path: testInfo.outputPath("core-bottom-template.png"),
  });

  await applyScenario(page, top);
  const topMetrics = await readScenarioMetrics(page, top.name);

  await page.locator(".svg-square").screenshot({
    path: testInfo.outputPath("core-top-template.png"),
  });

  expect(bottomMetrics.phoneY).not.toBeNull();
  expect(topMetrics.phoneY).not.toBeNull();
  expect(bottomMetrics.titleY).not.toBeNull();
  expect(topMetrics.titleY).not.toBeNull();
  expect(topMetrics.phoneY!).toBeLessThan(bottomMetrics.phoneY!);
  expect(topMetrics.titleY!).toBeGreaterThan(bottomMetrics.titleY!);
  expect(topMetrics.preserveAspectRatio).toBe("xMidYMax slice");
  expect(bottomMetrics.preserveAspectRatio).toBe("xMidYMin slice");

  await testInfo.attach("core-ui-metrics.json", {
    body: Buffer.from(JSON.stringify({ bottomMetrics, topMetrics }, null, 2)),
    contentType: "application/json",
  });
});

test("visual scenario matrix artifacts for comparison", async ({ page }, testInfo) => {
  await page.goto("/");

  const metrics: ScenarioMetrics[] = [];

  for (const scenario of SCENARIOS) {
    await applyScenario(page, scenario);

    await page.locator(".svg-square").screenshot({
      path: testInfo.outputPath(`${scenario.name}--template.png`),
    });

    await page.locator(".quickshot__preview").screenshot({
      path: testInfo.outputPath(`${scenario.name}--preview.png`),
    });

    metrics.push(await readScenarioMetrics(page, scenario.name));
  }

  const accessibilityTree = await page.locator("main").ariaSnapshot();
  const manifest = {
    generatedAt: new Date().toISOString(),
    scenarios: SCENARIOS,
    metrics,
    artifacts: SCENARIOS.map((scenario) => ({
      scenario: scenario.name,
      template: `${scenario.name}--template.png`,
      preview: `${scenario.name}--preview.png`,
    })),
  };

  await testInfo.attach("visual-matrix.json", {
    body: Buffer.from(JSON.stringify(manifest, null, 2)),
    contentType: "application/json",
  });

  await testInfo.attach("accessibility-tree.yaml", {
    body: Buffer.from(accessibilityTree),
    contentType: "text/yaml",
  });

  await testInfo.attach("dom.html", {
    body: Buffer.from(await page.content()),
    contentType: "text/html",
  });

  expect(metrics).toHaveLength(SCENARIOS.length);
  expect(metrics.every((item) => item.viewBox !== null)).toBe(true);
  expect(metrics.every((item) => item.phoneHeight !== null)).toBe(true);
});
