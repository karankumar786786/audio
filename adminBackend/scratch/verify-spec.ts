import { generateOpenApiDocument } from "../src/docs/openapi-registry";
import "../src/docs/openapi-routes";

const doc = generateOpenApiDocument();
console.log(JSON.stringify(doc, null, 2));
