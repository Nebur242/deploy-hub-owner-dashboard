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
  access_token: string,
  repository: string,
  workflow_file: string,
): Promise<GithubValidationResponse> {
  try {
    // Create Axios instance with GitHub API base URL and auth token
    const githubApi = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `token ${access_token}`,
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
    const workflowPath = workflow_file.startsWith(".github/workflows/")
      ? workflow_file
      : `.github/workflows/${workflow_file}`;

    try {
      await githubApi.get(
        `/repos/${username}/${repository}/contents/${workflowPath}`,
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

// Cache for version tag verification to prevent redundant API calls
// Cache format: { "username/repository/version": { result object } }
const versionTagCache: Record<
  string,
  {
    isValid: boolean;
    message: string;
    timestamp: number;
  }
> = {};

// Cache expiry time - 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

// Clear expired cache entries
function cleanupCache() {
  const now = Date.now();

  // Clean version tag cache
  Object.keys(versionTagCache).forEach((key) => {
    if (now - versionTagCache[key].timestamp > CACHE_TTL) {
      delete versionTagCache[key];
    }
  });

  // Clean account verification cache
  Object.keys(accountVerificationCache).forEach((key) => {
    if (now - accountVerificationCache[key].timestamp > CACHE_TTL) {
      delete accountVerificationCache[key];
    }
  });
}

/**
 * Verifies if a version exists as a tag in a specific GitHub repository
 *
 * @param username GitHub username
 * @param accessToken GitHub access token
 * @param repository Repository name
 * @param version Version to check for
 * @returns Validation result
 */
export async function verifyVersionTag(
  username: string,
  access_token: string,
  repository: string,
  version: string,
): Promise<GithubValidationResponse> {
  logApiCall("verifyVersionTag", { username, repository, version });

  // Create a unique cache key
  const cacheKey = `${username}/${repository}/${version}`;

  // Check if we have a cached result that's not expired
  if (versionTagCache[cacheKey]) {
    const cacheEntry = versionTagCache[cacheKey];
    const now = Date.now();

    if (now - cacheEntry.timestamp < CACHE_TTL) {
      logApiCall("verifyVersionTag:cache-hit", {
        username,
        repository,
        version,
      });
      return {
        isValid: cacheEntry.isValid,
        message: cacheEntry.message,
      };
    }
  }

  // Clean up expired cache entries occasionally
  cleanupCache();

  try {
    // Create Axios instance
    const githubApi = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `token ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // Get repository tags
    try {
      const { data: tags } = await githubApi.get(
        `/repos/${username}/${repository}/tags`,
        {
          params: { per_page: 100 }, // Get up to 100 tags
        },
      );

      // Check if the version exists in tags (exact match or with 'v' prefix)
      const tagExists = tags.some(
        (tag: { name: string }) =>
          tag.name === version || tag.name === `v${version}`,
      );

      const result = tagExists
        ? {
            isValid: true,
            message: `Version ${version} found as a tag in repository ${username}/${repository}`,
          }
        : {
            isValid: false,
            message: `Version ${version} not found as a tag in repository ${username}/${repository}`,
          };

      // Cache the result
      versionTagCache[cacheKey] = {
        ...result,
        timestamp: Date.now(),
      };

      return result;
    } catch (err) {
      const error = err as { response?: { status: number }; message: string };

      const result =
        error.response?.status === 401 || error.response?.status === 403
          ? {
              isValid: false,
              message: `Invalid GitHub access token for user ${username}`,
            }
          : error.response?.status === 404
            ? {
                isValid: false,
                message: `Repository "${repository}" not found for user ${username}`,
              }
            : {
                isValid: false,
                message: `Error checking tags: ${error.message}`,
              };

      // Cache error results too, but with shorter TTL
      versionTagCache[cacheKey] = {
        ...result,
        timestamp: Date.now(),
      };

      return result;
    }
  } catch (err) {
    const error = err as { message: string };
    return {
      isValid: false,
      message: `Unexpected error during tag verification: ${error.message}`,
    };
  }
}

/**
 * Check if a version exists as a tag in any of the connected GitHub accounts
 *
 * @param accounts Array of GitHub accounts with credentials and repository info
 * @param version Version string to check
 * @returns Result object with validation status and details
 */
// Cache for account group verification
interface AccountVerificationCacheEntry {
  isValid: boolean;
  foundInAccounts: string[];
  message: string;
  timestamp: number;
}

const accountVerificationCache: Record<string, AccountVerificationCacheEntry> =
  {};

export async function verifyVersionInGithubAccounts(
  accounts: Array<{
    username: string;
    access_token: string;
    repository: string;
    workflowFile?: string;
  }>,
  version: string,
): Promise<{
  isValid: boolean;
  foundInAccounts: string[];
  message: string;
}> {
  logApiCall("verifyVersionInGithubAccounts", {
    accountCount: accounts?.length,
    version,
  });

  if (!accounts || accounts.length === 0) {
    return {
      isValid: false,
      foundInAccounts: [],
      message: "No GitHub accounts provided for verification",
    };
  }

  // Generate a cache key based on accounts and version
  // This avoids calculating the same result for identical requests
  const accountsKey = accounts
    .map((a) => `${a.username}/${a.repository}`)
    .sort()
    .join(",");
  const cacheKey = `${accountsKey}:${version}`;

  // Check if we have a cached result for this account group and version
  const cachedResult = accountVerificationCache[cacheKey];
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    logApiCall("verifyVersionInGithubAccounts:cache-hit", { version });
    return {
      isValid: cachedResult.isValid,
      foundInAccounts: cachedResult.foundInAccounts,
      message: cachedResult.message,
    };
  }

  const foundInAccounts: string[] = [];
  const errors: string[] = [];

  // Check each account for the tag
  await Promise.all(
    accounts.map(async (account) => {
      const result = await verifyVersionTag(
        account.username,
        account.access_token,
        account.repository,
        version,
      );

      if (result.isValid) {
        foundInAccounts.push(`${account.username}/${account.repository}`);
      } else if (!result.message.includes("not found as a tag")) {
        // Only collect non-tag-missing errors
        errors.push(
          `${account.username}/${account.repository}: ${result.message}`,
        );
      }
    }),
  );

  let result;

  if (foundInAccounts.length > 0) {
    result = {
      isValid: true,
      foundInAccounts,
      message: `Version ${version} found in ${foundInAccounts.join(", ")}`,
    };
  } else if (errors.length > 0) {
    result = {
      isValid: false,
      foundInAccounts: [],
      message: `Errors checking version: ${errors.join("; ")}`,
    };
  } else {
    result = {
      isValid: false,
      foundInAccounts: [],
      message: `Version ${version} not found in any connected GitHub repositories`,
    };
  }

  // Cache the result for future requests
  accountVerificationCache[cacheKey] = {
    ...result,
    timestamp: Date.now(),
  };

  return result;
}

// Cache for branch/ref verification
const branchRefCache: Record<
  string,
  {
    isValid: boolean;
    message: string;
    timestamp: number;
  }
> = {};

/**
 * Verifies if a branch or tag exists in a specific GitHub repository
 *
 * @param username GitHub username
 * @param accessToken GitHub access token
 * @param repository Repository name
 * @param ref Branch or tag name to check for
 * @returns Validation result
 */
export async function verifyBranchOrRef(
  username: string,
  access_token: string,
  repository: string,
  ref: string,
): Promise<GithubValidationResponse> {
  logApiCall("verifyBranchOrRef", { username, repository, ref });

  // Create a unique cache key
  const cacheKey = `branch:${username}/${repository}/${ref}`;

  // Check if we have a cached result that's not expired
  if (branchRefCache[cacheKey]) {
    const cacheEntry = branchRefCache[cacheKey];
    const now = Date.now();

    if (now - cacheEntry.timestamp < CACHE_TTL) {
      logApiCall("verifyBranchOrRef:cache-hit", { username, repository, ref });
      return {
        isValid: cacheEntry.isValid,
        message: cacheEntry.message,
      };
    }
  }

  try {
    // Create Axios instance
    const githubApi = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `token ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // First, try to get the ref as a branch
    try {
      await githubApi.get(`/repos/${username}/${repository}/branches/${ref}`);
      const result = {
        isValid: true,
        message: `Branch "${ref}" found in repository ${username}/${repository}`,
      };
      branchRefCache[cacheKey] = { ...result, timestamp: Date.now() };
      return result;
    } catch {
      // Not found as branch, try as tag
    }

    // Try to get as a tag
    try {
      const { data: tags } = await githubApi.get(
        `/repos/${username}/${repository}/tags`,
        { params: { per_page: 100 } },
      );

      const tagExists = tags.some((tag: { name: string }) => tag.name === ref);

      if (tagExists) {
        const result = {
          isValid: true,
          message: `Tag "${ref}" found in repository ${username}/${repository}`,
        };
        branchRefCache[cacheKey] = { ...result, timestamp: Date.now() };
        return result;
      }
    } catch {
      // Tag lookup failed
    }

    // Neither branch nor tag found
    const result = {
      isValid: false,
      message: `"${ref}" not found as a branch or tag in repository ${username}/${repository}`,
    };
    branchRefCache[cacheKey] = { ...result, timestamp: Date.now() };
    return result;
  } catch (err) {
    const error = err as { response?: { status: number }; message: string };

    const result =
      error.response?.status === 401 || error.response?.status === 403
        ? {
            isValid: false,
            message: `Invalid GitHub access token for user ${username}`,
          }
        : error.response?.status === 404
          ? {
              isValid: false,
              message: `Repository "${repository}" not found for user ${username}`,
            }
          : {
              isValid: false,
              message: `Error checking branch/tag: ${error.message}`,
            };

    branchRefCache[cacheKey] = { ...result, timestamp: Date.now() };
    return result;
  }
}

/**
 * Check if a branch or tag exists in any of the connected GitHub accounts
 *
 * @param accounts Array of GitHub accounts with credentials and repository info
 * @param ref Branch or tag name to check
 * @returns Result object with validation status and details
 */
export async function verifyBranchInGithubAccounts(
  accounts: Array<{
    username: string;
    access_token: string;
    repository: string;
    workflowFile?: string;
  }>,
  ref: string,
): Promise<{
  isValid: boolean;
  foundInAccounts: string[];
  message: string;
}> {
  logApiCall("verifyBranchInGithubAccounts", {
    accountCount: accounts?.length,
    ref,
  });

  if (!accounts || accounts.length === 0) {
    return {
      isValid: false,
      foundInAccounts: [],
      message: "No GitHub accounts provided for verification",
    };
  }

  const foundInAccounts: string[] = [];
  const errors: string[] = [];

  // Check each account for the branch/tag
  await Promise.all(
    accounts.map(async (account) => {
      const result = await verifyBranchOrRef(
        account.username,
        account.access_token,
        account.repository,
        ref,
      );

      if (result.isValid) {
        foundInAccounts.push(`${account.username}/${account.repository}`);
      } else if (!result.message.includes("not found as a branch or tag")) {
        // Only collect non-missing errors
        errors.push(
          `${account.username}/${account.repository}: ${result.message}`,
        );
      }
    }),
  );

  if (foundInAccounts.length > 0) {
    return {
      isValid: true,
      foundInAccounts,
      message: `"${ref}" found in ${foundInAccounts.join(", ")}`,
    };
  } else if (errors.length > 0) {
    return {
      isValid: false,
      foundInAccounts: [],
      message: `Errors checking branch/tag: ${errors.join("; ")}`,
    };
  } else {
    return {
      isValid: false,
      foundInAccounts: [],
      message: `"${ref}" not found in any connected GitHub repositories`,
    };
  }
}

/**
 * Get all workflow files from a GitHub repository
 *
 * @param username GitHub username
 * @param accessToken GitHub access token
 * @param repository Repository name
 * @returns Array of workflow file names
 */
export async function getWorkflowFiles(
  username: string,
  access_token: string,
  repository: string,
): Promise<{ files: string[]; error?: string }> {
  try {
    const githubApi = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `token ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // Get contents of .github/workflows directory
    const { data } = await githubApi.get(
      `/repos/${username}/${repository}/contents/.github/workflows`,
    );

    // Filter for YAML files and extract names
    const workflowFiles = data
      .filter(
        (file: { type: string; name: string }) =>
          file.type === "file" &&
          (file.name.endsWith(".yml") || file.name.endsWith(".yaml")),
      )
      .map((file: { name: string }) => file.name);

    return { files: workflowFiles };
  } catch (err) {
    const error = err as { response?: { status: number }; message: string };

    if (error.response?.status === 404) {
      return {
        files: [],
        error:
          "No .github/workflows directory found or no workflow files available",
      };
    } else if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      return {
        files: [],
        error: "Access denied. Check your GitHub token permissions",
      };
    } else {
      return {
        files: [],
        error: `Error loading workflow files: ${error.message}`,
      };
    }
  }
}

/**
 * Get the content of a specific workflow file
 *
 * @param username GitHub username
 * @param accessToken GitHub access token
 * @param repository Repository name
 * @param workflowFile Workflow file name (e.g., "deploy.yml")
 * @returns Workflow file content
 */
export async function getWorkflowFileContent(
  username: string,
  access_token: string,
  repository: string,
  workflow_file: string,
): Promise<{ content: string; error?: string }> {
  try {
    const githubApi = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `token ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // Ensure proper path format
    const workflowPath = workflow_file.startsWith(".github/workflows/")
      ? workflow_file
      : `.github/workflows/${workflow_file}`;

    const { data } = await githubApi.get(
      `/repos/${username}/${repository}/contents/${workflowPath}`,
    );

    // Decode base64 content
    const content = Buffer.from(data.content, "base64").toString("utf-8");

    return { content };
  } catch (err) {
    const error = err as { response?: { status: number }; message: string };

    if (error.response?.status === 404) {
      return {
        content: "",
        error: "Workflow file not found",
      };
    } else if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      return {
        content: "",
        error: "Access denied. Check your GitHub token permissions",
      };
    } else {
      return {
        content: "",
        error: `Error loading workflow file: ${error.message}`,
      };
    }
  }
}

/**
 * Get all branches from a GitHub repository
 *
 * @param username GitHub username
 * @param accessToken GitHub access token
 * @param repository Repository name
 * @returns Array of branch names with default branch info
 */
export async function getBranches(
  username: string,
  access_token: string,
  repository: string,
): Promise<{ branches: string[]; defaultBranch?: string; error?: string }> {
  try {
    const githubApi = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `token ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // First, get the repository info to get the default branch
    const repoResponse = await githubApi.get(
      `/repos/${username}/${repository}`,
    );
    const defaultBranch = repoResponse.data.default_branch;

    // Get all branches (paginated, get first 100)
    const { data } = await githubApi.get(
      `/repos/${username}/${repository}/branches`,
      { params: { per_page: 100 } },
    );

    // Extract branch names
    const branches = data.map((branch: { name: string }) => branch.name);

    return { branches, defaultBranch };
  } catch (err) {
    const error = err as { response?: { status: number }; message: string };

    if (error.response?.status === 404) {
      return {
        branches: [],
        error: "Repository not found or no branches available",
      };
    } else if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      return {
        branches: [],
        error: "Access denied. Check your GitHub token permissions",
      };
    } else {
      return {
        branches: [],
        error: `Error loading branches: ${error.message}`,
      };
    }
  }
}

/**
 * Create a new workflow file in the GitHub repository
 *
 * @param username GitHub username
 * @param accessToken GitHub access token
 * @param repository Repository name
 * @param workflowFile Workflow file name (e.g., "deploy.yml")
 * @param content Workflow file content (YAML)
 * @param commitMessage Commit message for the creation
 * @returns Creation result
 */
export async function createWorkflowFile(
  username: string,
  access_token: string,
  repository: string,
  workflow_file: string,
  content: string,
  commitMessage: string = "Add GitHub workflow file",
): Promise<{ success: boolean; error?: string }> {
  try {
    const githubApi = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `token ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // Ensure proper path format
    const workflowPath = workflow_file.startsWith(".github/workflows/")
      ? workflow_file
      : `.github/workflows/${workflow_file}`;

    // Check if file already exists
    try {
      await githubApi.get(
        `/repos/${username}/${repository}/contents/${workflowPath}`,
      );
      return {
        success: false,
        error: "Workflow file already exists",
      };
    } catch (err) {
      // File doesn't exist, which is what we want
      const error = err as { response?: { status: number } };
      if (error.response?.status !== 404) {
        throw err;
      }
    }

    // Create the workflow file
    await githubApi.put(
      `/repos/${username}/${repository}/contents/${workflowPath}`,
      {
        message: commitMessage,
        content: Buffer.from(content).toString("base64"),
      },
    );

    return { success: true };
  } catch (err) {
    const error = err as { response?: { status: number }; message: string };

    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        error: "Access denied. Check your GitHub token permissions",
      };
    } else if (error.response?.status === 404) {
      return {
        success: false,
        error: "Repository not found",
      };
    } else {
      return {
        success: false,
        error: `Error creating workflow file: ${error.message}`,
      };
    }
  }
}

/**
 * Generate a GitHub workflow file using OpenAI based on project description
 *
 * @param projectDescription User's description of their project
 * @param deploymentPreferences User's deployment preferences (optional)
 * @param framework Optional framework/technology stack
 * @returns Generated workflow content
 */
export async function generateWorkflowWithAI(
  projectDescription: string,
  deploymentPreferences?: string,
  framework?: string,
): Promise<{ content: string; error?: string }> {
  try {
    const response = await axios.post("/api/generate-workflow", {
      projectDescription,
      deploymentPreferences,
      framework,
    });

    return { content: response.data.workflowContent };
  } catch (err) {
    const error = err as {
      response?: { data?: { error?: string } };
      message: string;
    };

    return {
      content: "",
      error:
        error.response?.data?.error ||
        `Error generating workflow: ${error.message}`,
    };
  }
}

// Debug flag - set to true to log API call information
const DEBUG_API_CALLS = false;

// Function to log API calls in development
function logApiCall(method: string, args: unknown): void {
  if (
    DEBUG_API_CALLS &&
    typeof window !== "undefined" &&
    process.env.NODE_ENV !== "production"
  ) {
    console.log(`[GitHub API] ${method} called:`, args);
    // Uncomment to see full call stack for debugging
    // console.trace(`[GitHub API] ${method} call stack`);
  }
}
