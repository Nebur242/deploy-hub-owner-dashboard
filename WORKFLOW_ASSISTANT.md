# GitHub Workflow Assistant Feature

## Overview

The GitHub Workflow Assistant is an AI-powered feature that helps users create custom GitHub Actions workflow files when their repository doesn't have any existing workflows.

## How it Works

### 1. Automatic Detection

- When users fill in their GitHub credentials (username, access token, repository)
- The system automatically checks for existing workflow files in `.github/workflows/`
- If no workflow files are found, an AI assistant button appears

### 2. Interactive Chatbot

- Users click "Create Workflow with AI Assistant" button
- A modal opens with a conversational interface
- The assistant asks about:
  - Project description
  - Framework/technology stack
  - Deployment preferences
  - Target deployment platform

### 3. AI-Powered Generation

- Uses OpenAI GPT-4 to generate custom workflow files
- Takes into account:
  - Project type and technologies
  - Deployment preferences
  - Best practices for CI/CD
  - Security considerations
- **Smart Variable Management**:
  - Creates workflow inputs for user-configurable values
  - Uses secrets for sensitive data (API keys, tokens)
  - Avoids hardcoding deployment settings
  - Enables flexible configuration through GitHub UI

### 4. Preview and Edit

- Generated workflow is displayed in a Monaco Editor
- Users can review and modify the YAML content
- Syntax highlighting and validation
- Theme-aware editor (matches app theme)

### 5. Direct GitHub Integration

- Users can save the workflow directly to their GitHub repository
- Creates the file in `.github/workflows/` directory
- Commits with descriptive message
- Automatically refreshes the workflow list

## Technical Implementation

### Components Added

- `WorkflowAssistant` - Main chatbot modal component
- Enhanced `GithubAccountFields` - Integrated assistant trigger

### API Endpoints

- `/api/generate-workflow` - OpenAI integration for workflow generation

### GitHub Service Functions

- `generateWorkflowWithAI()` - Calls OpenAI API
- `createWorkflowFile()` - Creates workflow file in GitHub repository

### Environment Variables Required

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## User Experience Flow

1. **Setup GitHub Account**

   - Enter username, access token, repository
   - System checks for existing workflows

2. **No Workflows Found**

   - Assistant button appears with helpful message
   - "🤖 No workflows found? Let me help you create one!"

3. **AI Conversation**

   - Fill out project details form
   - Assistant generates custom workflow
   - Review and edit generated content

4. **Save to Repository**
   - One-click save to GitHub
   - Automatic workflow list refresh
   - Ready to use immediately

## Key Features

- **Input-Driven Configuration**: Generated workflows use GitHub workflow inputs and secrets instead of hardcoded values
- **User-Friendly Deployment**: Users can configure deployments through GitHub's workflow dispatch interface
- **Security-First**: Sensitive data is properly handled through GitHub secrets
- **Flexible Environments**: Support for multiple deployment environments through inputs

## Benefits

- **Beginner Friendly**: No need for GitHub Actions expertise
- **Customized**: Workflows tailored to specific project needs
- **Best Practices**: AI incorporates DevOps best practices
- **Time Saving**: Eliminates manual workflow creation
- **Educational**: Users can learn from generated examples

## Example Generated Workflow

The AI can generate workflows for various scenarios:

- React/Next.js apps deploying to Vercel
- Node.js APIs with Docker deployment
- Static sites to Netlify
- Python applications with testing
- And many more combinations

This feature significantly improves the onboarding experience for users who are new to GitHub Actions or need help setting up deployment workflows.

## Example Generated Workflow Structure

The AI generates workflows that follow this pattern:

```yaml
name: Deploy Application

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Deployment environment"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production
      version:
        description: "Version to deploy"
        required: true
        default: "latest"
      build_config:
        description: "Build configuration"
        required: false
        default: "production"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ${{ github.event.inputs.environment }}
        env:
          DEPLOYMENT_TOKEN: ${{ secrets.DEPLOYMENT_TOKEN }}
          TARGET_ENV: ${{ github.event.inputs.environment }}
        run: |
          # Deployment steps using the input variables
```

This approach ensures users can:

- Run workflows with different configurations
- Keep sensitive data secure in GitHub secrets
- Reuse workflows for multiple environments
- Customize deployments without editing code
