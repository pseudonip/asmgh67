import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from ".";

// so they all register
import "../../routes/api/v1/zones/[name]/records/index";
import "../../routes/api/v1/zones/[name]/records/[id]";

const generator = new OpenApiGeneratorV3(registry.definitions);

export default generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Raincloud API",
    version: "1.0.0",
  },
  servers: [
    {
      url: "https://raincloudns.dev/api/v1",
      description: "Production",
    },
    {
      url: "http://localhost:3000/api/v1",
      description: "Localhost",
    }
  ]
});
