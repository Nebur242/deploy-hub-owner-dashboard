import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { projectDescription, deploymentPreferences, framework } =
      await request.json();

    if (!projectDescription) {
      return NextResponse.json(
        {
          error: "Project description is required",
        },
        { status: 400 },
      );
    }

    // Provide default deployment preferences if none specified
    const finalDeploymentPreferences =
      deploymentPreferences ||
      "Set up basic CI/CD workflow with automated testing and deployment";

    const prompt = `
You are an expert DevOps engineer specializing in GitHub Actions workflows. Generate a comprehensive GitHub Actions workflow file (.yml) based on the following project requirements:

Project Description: ${projectDescription}
Deployment Preferences: ${finalDeploymentPreferences}
${framework ? `Framework/Technology Stack: ${framework}` : ""}

Please create a complete, production-ready GitHub Actions workflow that includes:

1. **Workflow triggers** (push, pull request, etc.)
2. **Build steps** appropriate for the technology stack
3. **Testing steps** if applicable
4. **Deployment steps** based on the deployment preferences
5. **Environment variables** that might be needed
6. **Caching strategies** to optimize build times
7. **Error handling** and proper job dependencies

**CRITICAL REQUIREMENT - Variable Usage:**
- Use a single workflow_dispatch input named \`DATA\` as a JSON string for all non-secret user-provided deployment values beyond the fixed inputs below
- Use \`\${{ fromJson(github.event.inputs.DATA).variables.YOUR_VARIABLE_NAME }}\` for custom user-provided values
- \`DATA\` also includes \`branch\` and \`environment\` keys for convenience
- Use \`\${{ secrets.VARIABLE_NAME }}\` for sensitive data like API keys, tokens, passwords
- DO NOT hardcode values - users should be able to configure deployment settings through inputs
- Include an "inputs" section in the workflow_dispatch trigger
- Always include these Deploy Hub managed workflow_dispatch inputs exactly:
  - BRANCH
  - ENVIRONMENT
  - DATA
  - DEPLOY_HUB_DEPLOYMENT_ID
  - DEPLOY_HUB_CALLBACK_URL
  - DEPLOY_HUB_CALLBACK_TOKEN
- Add a final step named "Report deployment result to Deploy Hub" with \`if: always()\`.
- The final step must POST JSON to \`\${{ github.event.inputs.DEPLOY_HUB_CALLBACK_URL }}\` with deployment_id, callback_token, status, run_id, commit_sha, and deployment_url when available.
- Use \`\${{ job.status }}\` for status and \`\${{ github.run_id }}\` for run_id.
- Use \`\${{ github.event.inputs.BRANCH }}\` for checkout ref and \`\${{ github.event.inputs.ENVIRONMENT }}\` for the selected environment.
- Do not create extra top-level workflow_dispatch inputs for custom deployment variables; keep them inside \`DATA\`.
- Examples of variables that should be secrets: API keys, access tokens, deployment credentials, database passwords

Important requirements:
- Use latest stable versions of actions
- Include proper security practices
- Add comments explaining each step
- Make the workflow modular and maintainable
- Include a short preparation step when needed to parse \`DATA\` for shell usage
- Use secrets for all sensitive information
- Consider different environments (staging, production) as input options
- Do not require users to create Deploy Hub callback secrets or variables manually; callback values come from workflow_dispatch inputs.

Return ONLY the YAML content without any markdown formatting or code blocks. The response should be valid YAML that can be directly saved as a .github/workflows/deploy.yml file.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You are an expert DevOps engineer who creates optimized GitHub Actions workflows. Always respond with valid YAML content only, no markdown formatting. IMPORTANT: Use the fixed workflow_dispatch inputs BRANCH, ENVIRONMENT, DATA, DEPLOY_HUB_DEPLOYMENT_ID, DEPLOY_HUB_CALLBACK_URL, and DEPLOY_HUB_CALLBACK_TOKEN. Put custom user-entered values inside DATA as JSON and read them with fromJson(github.event.inputs.DATA).",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const workflowContent = completion.choices[0]?.message?.content;

    if (!workflowContent) {
      return NextResponse.json(
        { error: "Failed to generate workflow content" },
        { status: 500 },
      );
    }

    return NextResponse.json({ workflowContent });
  } catch (error) {
    console.error("Error generating workflow:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to generate workflow: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while generating the workflow" },
      { status: 500 },
    );
  }
}
