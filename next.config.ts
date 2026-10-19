import type { NextConfig } from "next";
import { missingDeploymentAuthConfig } from "./src/lib/deployment-config";

const missingAuthConfig = missingDeploymentAuthConfig();
if (missingAuthConfig.length) {
  throw new Error(
    `Refusing to build a deployed Talix site without ${missingAuthConfig.join(", ")}.`,
  );
}

const config: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
