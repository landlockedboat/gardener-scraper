import * as puppeteer from "puppeteer";
import fs from "node:fs";
import path from "path";
import chalk from "chalk";
import { oraPromise } from "ora";

const BASE_URL = "https://www.aspca.org";

(async () => {
  const processPlantPage = async (
    browser: puppeteer.Browser,
    pageUrl: string
  ) => {
    const page = await browser.newPage();

    await page.goto(pageUrl);

    const plantData = await page.evaluate(async () => {
      const getPlantFieldObject = (plantHtmlElement: Element) => {
        //   1 <div class="panel-pane pane-entity-field pane-node-field-toxicity">
        //   2   <div class="field field-name-field-toxicity field-type-list-text field-label-hidden">
        //   3     <div class="field-items">
        //   4       <div class="field-item even">
        //   5.1       <span class="label-inline-format-label">Toxicity:</span>
        //   5.2       <span class="values"> Toxic to Dogs, Toxic to Cats, Toxic to Horses</span></div>
        //           </div>
        //       </div>
        //     </div>
        const fieldName = plantHtmlElement.classList
          .values()
          .find((a) => a.includes("pane-node-field"))
          ?.replace("pane-node-field-", "");

        const fieldValues = Array.from(
          plantHtmlElement.querySelectorAll(".values"),
          (e) => e.textContent
        ).join(" ");

        if (fieldValues) {
          return {
            field: fieldName,
            value: fieldValues.trim(),
          };
        }

        const imageHtmlElement = plantHtmlElement.querySelector("img");

        if (imageHtmlElement) {
          return {
            field: fieldName || "thumb",
            value: imageHtmlElement?.getAttribute("src"),
          };
        }

        // No valid sub-field found
        return null;
      };
      const plantFields = Array.from(
        document.querySelectorAll(".pane-entity-field"),
        (a) => getPlantFieldObject(a)
      ).filter((a) => a);

      const plantName = document.querySelector("h1")?.textContent;

      plantFields.push({ field: "name", value: plantName || "" });

      return plantFields;
    });

    try {
      const newFilePath = pageUrl.substring(
        pageUrl.lastIndexOf("/") + 1,
        pageUrl.length
      );

      fs.writeFileSync(
        `plants/${newFilePath}.json`,
        JSON.stringify(plantData, null, 2)
      );
    } catch (err) {
      console.error(err);
    }
    await page.close();
    return true;
  };

  const browser = await puppeteer.launch();

  const rawData = fs.readFileSync("plant-urls.json", "utf8");
  const plantUrls: string[] = JSON.parse(rawData);

  if (!plantUrls) {
    return;
  }

  console.log(`Processing ${plantUrls.length} urls...`);

  let colorIndex = 0;
  const colors = ["red", "green",  "yellow", "blue", "magenta", "cyan"];

  for (let i = 0; i < plantUrls.length; i++) {
    const url = plantUrls[i];
    const plantId = path.basename(url);

    const color = colors[colorIndex];
    // @ts-ignore — we're using dynamic property access, which is safe here
    const colorText = chalk[color](plantId);

    await oraPromise(
      processPlantPage(browser, BASE_URL + url),
      `Processing ${colorText}`
    );

    // Wait a bit to unlock the thread
    await new Promise((f) => setTimeout(f, 100));
    colorIndex = (colorIndex + 1) % colors.length;
  }

  await browser.close();
})();
