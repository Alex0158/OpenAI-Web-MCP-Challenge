import { resetFoundationDatabase } from "../src/server/persistence/reset";

const generation = resetFoundationDatabase();
console.log(`foundation generation ${generation}`);
