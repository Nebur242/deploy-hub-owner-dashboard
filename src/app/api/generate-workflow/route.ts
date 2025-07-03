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
        { status: 400 }
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
- Most variables should be defined as INPUTS that users will provide when running the workflow
- Use \`\${{ github.event.inputs.variable_name }}\` for user-provided inputs
- Use \`\${{ secrets.VARIABLE_NAME }}\` for sensitive data like API keys, tokens, passwords
- DO NOT hardcode values - users should be able to configure deployment settings through inputs
- Include an "inputs" section in the workflow_dispatch trigger for configuration variables
- Examples of variables that should be inputs: deployment environment, version numbers, build configurations, deployment targets, etc.
- Examples of variables that should be secrets: API keys, access tokens, deployment credentials, database passwords

Important requirements:
- Use latest stable versions of actions
- Include proper security practices
- Add comments explaining each step
- Make the workflow modular and maintainable
- Include comprehensive inputs section for user configuration
- Use secrets for all sensitive information
- Consider different environments (staging, production) as input options

Return ONLY the YAML content without any markdown formatting or code blocks. The response should be valid YAML that can be directly saved as a .github/workflows/deploy.yml file.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You are an expert DevOps engineer who creates optimized GitHub Actions workflows. Always respond with valid YAML content only, no markdown formatting. IMPORTANT: Use workflow inputs and secrets for all configurable values - do not hardcode deployment settings.",
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
        { status: 500 }
      );
    }

    return NextResponse.json({ workflowContent });
  } catch (error) {
    console.error("Error generating workflow:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to generate workflow: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while generating the workflow" },
      { status: 500 }
    );
  }
}
