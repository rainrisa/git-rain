import axios from "axios";
import * as cheerio from "cheerio";
import GithubRepositories from "../types/githubRepository.js";

async function getAllRepositories(
  username: string,
  page: number
): Promise<GithubRepositories[]> {
  const response = await axios.get(
    `https://api.github.com/users/${username}/repos?page=${page}&per_page=5`
  );
  return response.data;
}

export default getAllRepositories;
