import axios from "axios";
import GithubUser from "../types/githubUser.js";

async function getUserDetails(username: string): Promise<GithubUser> {
  const response = await axios.get(`https://api.github.com/users/${username}`);
  return response.data;
}

export default getUserDetails;
