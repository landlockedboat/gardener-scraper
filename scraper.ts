import * as puppeteer from "puppeteer";
import fs from "node:fs";

const BASE_URL = "https://www.aspca.org";

(async () => {
  const processPlantPage = async (
    browser: puppeteer.Browser,
    pageUrl: string
  ) => {
    const plantPage = await browser.newPage();

    await plantPage.goto(pageUrl);

    const plantData = await plantPage.evaluate(async () => {
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

        const fieldValues = plantHtmlElement.querySelector(".values");

        if (fieldValues) {
          return {
            field: fieldName,
            value: fieldValues?.textContent,
          };
        }

        const imageHtmlElement = plantHtmlElement.querySelector("img");

        if (imageHtmlElement) {
          return {
            field: fieldName || "thumb",
            image: imageHtmlElement?.getAttribute("src"),
          };
        }

        // No valid sub-field found
        return null;
      };
      const plantFields = Array.from(
        document.querySelectorAll(".pane-entity-field"),

        (a) => getPlantFieldObject(a)
      );
      return [...plantFields.filter((a) => a)];
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
    await plantPage.close();
  };

  const browser = await puppeteer.launch();

  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/pet-care/animal-poison-control/cats-plant-list`);

  const plantUrls = await page.evaluate(async () => {
    const result = Array.from(
      document.querySelectorAll(".field-content a[href]"),
      (a) => a.getAttribute("href")
    ).filter((a) => a !== null);

    const samplePlants = result.slice(0, 5); // Random plants
    return samplePlants;
  });

  console.log(plantUrls);

  if (!plantUrls) {
    return;
  }

  for (let i = 0; i < plantUrls.length; i++) {
    const url = plantUrls[i];
    await processPlantPage(browser, BASE_URL + url);
  }

  await page.close();
  await browser.close();
})();
