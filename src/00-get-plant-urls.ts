import * as puppeteer from "puppeteer";
import fs from "node:fs";

const BASE_URL = "https://www.aspca.org";
const outputFile = "plant-urls.json";

(async () => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/pet-care/animal-poison-control/cats-plant-list`);

  const plantUrls = await page.evaluate(async () => {
    const result = Array.from(
      document.querySelectorAll(".field-content a[href]"),
      (a) => a.getAttribute("href")
    ).filter((a) => a !== null);

    return result;
  });

  console.log(`Found ${plantUrls.length} urls.`);
  fs.writeFileSync(outputFile, JSON.stringify(plantUrls, null, 2), "utf8");
  console.log(`Written to ${outputFile}.`);
})();
