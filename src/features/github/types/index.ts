export type GithubAppDetails = {
  id: number;
  slug: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  pem: string;
  permissions: Record<string, string>;
  installationId: number;
  repos: {
    full_name: string;
    id: number;
    name: string;
    node_id: string;
    private: boolean;
  }[];
};
