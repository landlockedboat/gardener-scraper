import * as fs from "fs";
import * as path from "path";
import { createSchema, mergeSchemas } from "genson-js";
import { compile } from "json-schema-to-typescript";

const inputFolder = "./plant-data";

(async () => {
  const jsonFiles = fs
    .readdirSync(inputFolder)
    .filter((file) => file.endsWith(".json"))
    .slice(0, 5);

  const masterSchema = mergeSchemas(
    jsonFiles
      .map((file) => fs.readFileSync(path.join(inputFolder, file), "utf-8"))
      .map((raw) => JSON.parse(raw))
      .map((json) => createSchema(json))
  );

  const ts = await compile(masterSchema, "PlantType");

  // Output
  fs.writeFileSync("schema.json", JSON.stringify(masterSchema, null, 2));
  fs.writeFileSync("types.d.ts", ts);

  console.log("✅ JSON Schema saved to schema.json");
  console.log("✅ TypeScript type saved to types.d.ts");
})();
