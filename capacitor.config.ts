import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.leadlens.app",
  appName: "LeadLens AI",
  webDir: "out",
  server: {
    url: "https://leadlens-ai.vercel.app",
    cleartext: true
  }
};

export default config;
