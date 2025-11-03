export type GithubAppDetails = {
  id: number;
  slug: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  pem: string;
  permissions: Record<string, string>;
};
