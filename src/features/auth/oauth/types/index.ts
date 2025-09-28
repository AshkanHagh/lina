export type GithubUserResponse = {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
};

export type GithubUserEmailResponse = {
  email: string;
  primary: boolean;
  verified: boolean;
};
