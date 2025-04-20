import * as fs from "fs";
import path from "path";

const inputFolder = "./plants";
const outputFolder = "./plant-data";

const files = fs
  .readdirSync(inputFolder)
  .filter((file) => file.endsWith(".json"));

console.log(`Transforming ${files.length} files...`);

files.forEach((file) => {
  const filePath = path.join(inputFolder, file);
  const rawData = fs.readFileSync(filePath, "utf8");
  const plantFields: {
    field: string | undefined;
    value: string | undefined;
  }[] = JSON.parse(rawData);

  const camelize = (s: string) => s.replace(/-./g, (x) => x[1].toUpperCase());
  const plantObject: { [key: string]: string } = {};

  plantFields.forEach(
    (e) => (plantObject[camelize(e?.field || "null")] = e?.value || "null")
  );

  fs.writeFileSync(
    path.join(outputFolder, file),
    JSON.stringify(plantObject, null, 2),
    "utf8"
  );

});
