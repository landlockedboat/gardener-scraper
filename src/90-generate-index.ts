import fs from "fs";
import path from "path";

export interface PlantInput {
  image: string;
  additionalCommonNames: string;
  scientificName: string;
  family: string;
  toxicity?: string;
  toxicPrinciples?: string;
  clinicalSigns?: string;
  name: string;
  nonToxicity?: string;
  thumb?: string;
}

interface PlantOutput extends PlantInput {
  id:string,
  extraData: {
    toxicityDescription: string;
    toxicToCats: boolean;
    toxicToDogs: boolean;
    toxicToHorses: boolean;
    searchableText: string;
  };
}

const inputFolder = "./plant-data";
const outputFileName = "index";

const files = fs
  .readdirSync(inputFolder)
  .filter((file) => file.endsWith(".json"));

const result: PlantOutput[] = [];

files.forEach((file) => {
  const filePath = path.join(inputFolder, file);
  const rawData = fs.readFileSync(filePath, "utf8");

  let plant: PlantInput;
  try {
    plant = JSON.parse(rawData);
  } catch (err) {
    console.warn(`Skipping invalid JSON file: ${file}`);
    return;
  }

  const searchableText =
    `${plant.name} ${plant.additionalCommonNames} ${plant.scientificName} ${plant.family}`
      .trim()
      .toLowerCase()
      .replace(/,/g, " ")
      // Delete extra whitespace
      .replace(/\s+/g, " ");

  // Toxicity logic
  let toxicityDescription = "Safe";

  const plantToxicity = plant.toxicity?.toLowerCase();
  const toxicToCats =
    (plantToxicity?.includes("toxic to cats") &&
      !plantToxicity?.includes("non-toxic to cats")) ||
    false;
  const toxicToDogs =
    (plantToxicity?.includes("toxic to dogs") &&
      !plantToxicity?.includes("non-toxic to dogs")) ||
    false;
  const toxicToHorses =
    (plantToxicity?.includes("toxic to horses") &&
      !plantToxicity?.includes("non-toxic to horses")) ||
    false;

  if (toxicToCats || toxicToDogs || toxicToHorses) {
    toxicityDescription = "Toxic";
  }

  const principles = plant.toxicPrinciples?.toLowerCase() || "";
  const clinicalSigns = plant.clinicalSigns?.toLowerCase() || "";

  if (principles.includes("highly toxic") || clinicalSigns.includes("death")) {
    toxicityDescription = "Highly toxic";
  }

  result.push({
    ...plant,
    id: path.parse(file).name,
    extraData: {
      searchableText,
      toxicityDescription,
      toxicToCats,
      toxicToDogs,
      toxicToHorses,
    },
  });
});

// Write to output JSON
fs.writeFileSync(outputFileName + ".json", JSON.stringify(result, null, 2), "utf8");
fs.writeFileSync(outputFileName + ".min.json", JSON.stringify(result), "utf8");

console.log(`✅ ${result.length} plants written to ${outputFileName + ".json"}, ${outputFileName + ".min.json"}`);
