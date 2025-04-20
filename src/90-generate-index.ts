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

type PlantOutput = {
  name: string;
  toxicity: {
    status: string;
    cats: boolean;
    dogs: boolean;
    horses: boolean;
  };
  searchableText: string;
};

const inputFolder = "./plant-data";
const outputFile = "index.json";

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

  const searchableText = (
    plant.name +
    plant.additionalCommonNames +
    plant.scientificName +
    plant.family
  )
    .trim()
    .toLowerCase()
    .replace(/,/g, "")
    // Delete extra whitespace
    .replace(/\s+/g, " ");

  // Toxicity logic
  let toxicity = "Safe";

  const plantToxicity = plant.toxicity?.toLowerCase();
  const toxicToCats =
    plantToxicity?.includes("toxic to cats") &&
    !plantToxicity?.includes("non-toxic to cats");
  const toxicToDogs =
    plantToxicity?.includes("toxic to dogs") &&
    !plantToxicity?.includes("non-toxic to dogs");
  const toxicToHorses =
    plantToxicity?.includes("toxic to horses") &&
    !plantToxicity?.includes("non-toxic to horses");

  if (toxicToCats || toxicToDogs || toxicToHorses) {
    toxicity = "Toxic";
  }

  const principles = plant.toxicPrinciples?.toLowerCase() || "";
  const clinicalSigns = plant.clinicalSigns?.toLowerCase() || "";

  if (principles.includes("highly toxic") || clinicalSigns.includes("death")) {
    toxicity = "Highly toxic";
  }

  result.push({
    name: plant.name,
    toxicity: {
      status: toxicity,
      cats: toxicToCats || false,
      dogs: toxicToDogs || false,
      horses: toxicToHorses || false,
    },
    searchableText,
  });
});

// Write to output JSON
fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), "utf8");

console.log(`✅ ${result.length} plants written to ${outputFile}`);
