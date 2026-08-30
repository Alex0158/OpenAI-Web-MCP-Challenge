import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

export class JsonFileStateStore {
  constructor(filename) {
    if (typeof filename !== "string" || filename === "") {
      throw new TypeError("JsonFileStateStore requires a filename");
    }
    this.filename = filename;
  }

  load(createFallback) {
    if (!existsSync(this.filename)) return createFallback();
    return JSON.parse(readFileSync(this.filename, "utf8"));
  }

  save(value) {
    mkdirSync(dirname(this.filename), { recursive: true });
    const temporary = `${this.filename}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    renameSync(temporary, this.filename);
  }
}

export class MemoryStateStore {
  constructor(initialValue) {
    this.value = initialValue === undefined ? undefined : structuredClone(initialValue);
  }

  load(createFallback) {
    if (this.value === undefined) this.value = structuredClone(createFallback());
    return structuredClone(this.value);
  }

  save(value) {
    this.value = structuredClone(value);
  }
}
