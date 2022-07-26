export default interface GithubUser {
  login: string;
  name: string;
  type: "User" | "Organization";
  followers: number;
  following: number;
  public_repos: number;
}
