import { AgentConfig } from '../types';

export const availableAgents: AgentConfig[] = [
  {
    id: 'orchestrator',
    name: '♟️ Orchestrator',
    description: 'Task coordination and delegation master',
    capabilities: ['delegation', 'planning', 'coordination']
  },
  {
    id: 'the-buzzkill',
    name: '👔 The Buzzkill',
    description: 'GitLab, Jira, Confluence and project management',
    capabilities: ['gitlab', 'jira', 'confluence', 'code-review']
  },
  {
    id: 'junior',
    name: '👶 Junior',
    description: 'Coding, refactoring and feature implementation',
    capabilities: ['coding', 'refactoring', 'typescript', 'react']
  },
  {
    id: 'ask',
    name: '🤔 Ask',
    description: 'Research, documentation and technical questions',
    capabilities: ['research', 'documentation', 'explanations']
  },
  {
    id: 'browser-analyst',
    name: '🌐 Browser Analyst',
    description: 'UI/UX analysis, Figma, Miro and visual inspections',
    capabilities: ['ui-analysis', 'figma', 'miro', 'screenshots']
  },
  {
    id: 'test-generator',
    name: '🧪 Test Generator',
    description: 'Unit tests, acceptance tests and test coverage',
    capabilities: ['testing', 'playwright', 'rstest', 'coverage']
  },
  {
    id: 'infrastructure',
    name: '🏗️ Infrastructure',
    description: 'Databases, Docker, DevOps and infrastructure',
    capabilities: ['docker', 'postgresql', 'redis', 'devops']
  }
];

export const defaultAgent = 'the-buzzkill';

export const editableFields = ['title', 'description', 'assignedTo', 'priority'];