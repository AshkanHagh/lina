import { Inject } from "@nestjs/common";
import { ConfigType, registerAs } from "@nestjs/config";

export const githubConfig = registerAs("github", () => {
  return {
    appId: parseInt(process.env.GITHUB_APP_ID || "0"),
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    clientId: process.env.GITHUB_APP_CLIENT_ID,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    webhookUrl: process.env.WEBHOOK_URL,
    appSlug: process.env.GITHUB_APP_SLUG,
  };
});

export const GithubConfig = () => Inject(githubConfig.KEY);
export type IGithubConfig = ConfigType<typeof githubConfig>;
