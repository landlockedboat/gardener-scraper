import * as fs from "fs";
import path from "path";

const inputFolder = "./plants";

const files = fs
  .readdirSync(inputFolder)
  .filter((file) => file.endsWith(".json"));

console.log(`Checking ${files.length} files for duplicates...`);

files.forEach((file) => {
  const filePath = path.join(inputFolder, file);
  const rawData = fs.readFileSync(filePath, "utf8");
  const plant: {
    field: string;
    value: string | undefined;
  }[] = JSON.parse(rawData);

  const countMap: Record<string, number> = {};
  let emptyFields = 0;
  for (const item of plant) {
    const field = item.field;
    countMap[field] = (countMap[field] || 0) + 1;
    if (
      item.value !== "" &&
      (!item.value || item.value === "null" || item.value == "undefined")
    ) {
      console.log(`Null or invalid field ${field} in plant ${file}`);
    }
    if(!item.value)
    {
      ++emptyFields;
    }
  }

  if(emptyFields > 3) {
    console.log(`${emptyFields} empty fields found in plant ${file}`)
  }

  for (const key of Object.keys(countMap)) {
    if (countMap[key] > 1) {
      console.log(
        `Repeat in ${path.basename(file)} -> ${key}: ${countMap[key]} times.`
      );
    }
  }

  //   console.log(countMap)
});
