import axios from "axios";

interface GithubValidationResponse {
  isValid: boolean;
  message: string;
}

/**
 * Validates a GitHub account, repository, and workflow file
 *
 * @param username GitHub username
 * @param accessToken GitHub personal access token
 * @param repository Repository name
 * @param workflowFile Workflow file path (.github/workflows/deploy.yml)
 * @returns Validation result with status and message
 */
export async function validateGithubConfig(
  username: string,
  accessToken: string,
  repository: string,
  workflowFile: string
): Promise<GithubValidationResponse> {
  try {
    // Create Axios instance with GitHub API base URL and auth token
    const githubApi = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // Step 1: Validate GitHub user exists and token is valid
    try {
      await githubApi.get(`/users/${username}`);
      // Validate token by checking user's repos (requires auth)
      await githubApi.get("/user/repos", { params: { per_page: 1 } });
    } catch (err) {
      const error = err as {
        response: { status: number };
        message: string;
      };

      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          isValid: false,
          message: `Invalid GitHub access token for user ${username}`,
        };
      } else if (error.response?.status === 404) {
        return {
          isValid: false,
          message: `GitHub user ${username} not found`,
        };
      } else {
        return {
          isValid: false,
          message: `Error validating GitHub user: ${error.message}`,
        };
      }
    }

    // Step 2: Validate repository exists and is accessible
    try {
      await githubApi.get(`/repos/${username}/${repository}`);
    } catch (err) {
      const error = err as { response: { status: number }; message: string };
      if (error.response?.status === 404) {
        return {
          isValid: false,
          message: `Repository "${repository}" not found for user ${username}`,
        };
      } else {
        return {
          isValid: false,
          message: `Error accessing repository: ${error.message}`,
        };
      }
    }

    // Step 3: Validate workflow file exists
    // GitHub workflows should be in the .github/workflows directory
    const workflowPath = workflowFile.startsWith(".github/workflows/")
      ? workflowFile
      : `.github/workflows/${workflowFile}`;

    try {
      await githubApi.get(
        `/repos/${username}/${repository}/contents/${workflowPath}`
      );
    } catch (err) {
      const error = err as {
        response: { status: number };
        message: string;
      };

      if (error.response?.status === 404) {
        return {
          isValid: false,
          message: `Workflow file "${workflowPath}" not found in repository ${username}/${repository}`,
        };
      } else {
        return {
          isValid: false,
          message: `Error accessing workflow file: ${error.message}`,
        };
      }
    }

    return {
      isValid: true,
      message: "GitHub configuration validated successfully",
    };
  } catch (err) {
    const error = err as {
      response: { status: number };
      message: string;
    };

    return {
      isValid: false,
      message: `Unexpected error during GitHub validation: ${error.message}`,
    };
  }
}
