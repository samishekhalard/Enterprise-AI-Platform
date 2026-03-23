#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_CONTEXT_FILES = [
  'docs/arc42/04-solution-strategy.md',
  'docs/arc42/06-runtime-view.md',
  'docs/governance/GOVERNANCE-FRAMEWORK.md',
  'docs/backlog/FRONTEND-PRODUCTION-READINESS-NON-NEGOTIABLE.md',
];

const DEFAULT_OPENAI_MODEL = 'gpt-5';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-pro';

const OPENAI_SYSTEM_PROMPT = [
  'You are Codex, acting as maker in a maker-checker review for the EMSIST project.',
  'Return concise, production-focused engineering output with explicit risks, assumptions, and actionable next steps.',
  'Avoid fluff.',
].join(' ');

const GEMINI_SYSTEM_PROMPT = [
  'You are Gemini, acting as checker in a maker-checker review for the EMSIST project.',
  'Critique the maker output, identify hidden risks and regressions, and propose concrete corrections.',
  'Be direct and production-focused.',
].join(' ');

function printHelp() {
  console.log(`
Usage:
  node scripts/ai-discussion-channel.mjs [options]

Options:
  --topic "text"                Discussion topic (required unless --topic-file provided)
  --topic-file <path>           File containing the discussion topic
  --rounds <n>                  Number of maker-checker rounds (default: 3)
  --context-file <path>         Additional context file (can be repeated)
  --output <path>               Output markdown file path
  --project-root <path>         Project root path (default: current working directory)
  --dry-run                     Build prompts and write transcript skeleton without API calls
  --help                        Show this help

Environment variables:
  OPENAI_API_KEY                Required unless --dry-run
  GEMINI_API_KEY                Required unless --dry-run
  OPENAI_MODEL                  Optional (default: gpt-5)
  GEMINI_MODEL                  Optional (default: gemini-2.5-pro)

Example:
  OPENAI_API_KEY=... GEMINI_API_KEY=... \\
  node scripts/ai-discussion-channel.mjs \\
    --topic "Review EMSIST auth flow and define production-ready closure plan"
`);
}

function parseArgs(argv) {
  const options = {
    rounds: 3,
    contextFiles: [],
    dryRun: false,
    projectRoot: process.cwd(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--topic':
        options.topic = argv[++i];
        break;
      case '--topic-file':
        options.topicFile = argv[++i];
        break;
      case '--rounds':
        options.rounds = Number.parseInt(argv[++i], 10);
        break;
      case '--context-file':
        options.contextFiles.push(argv[++i]);
        break;
      case '--output':
        options.output = argv[++i];
        break;
      case '--project-root':
        options.projectRoot = argv[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function timestampForFile(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function safeGitStatus(projectRoot) {
  try {
    return execSync('git status --short', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'Unavailable';
  }
}

async function readTextFile(filePath) {
  return fs.readFile(filePath, 'utf8');
}

function truncate(text, maxChars) {
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, maxChars)}\n...[truncated]`;
}

async function collectContext(projectRoot, extraContextFiles) {
  const fileList = [...DEFAULT_CONTEXT_FILES, ...extraContextFiles];
  const seen = new Set();
  const blocks = [];

  for (const entry of fileList) {
    if (!entry) {
      continue;
    }

    const absolutePath = path.isAbsolute(entry) ? entry : path.resolve(projectRoot, entry);
    if (seen.has(absolutePath)) {
      continue;
    }
    seen.add(absolutePath);

    try {
      const content = await readTextFile(absolutePath);
      blocks.push({
        file: path.relative(projectRoot, absolutePath),
        content: truncate(content, 5000),
      });
    } catch {
      blocks.push({
        file: path.relative(projectRoot, absolutePath),
        content: '[missing file]',
      });
    }
  }

  return blocks;
}

function buildContextText(contextBlocks, gitStatusText) {
  const contextFromFiles = contextBlocks
    .map((block) => `### ${block.file}\n${block.content}`)
    .join('\n\n');

  return [
    '## Repository Snapshot',
    '### git status --short',
    truncate(gitStatusText || 'clean', 3000),
    '',
    '## Context Files',
    contextFromFiles,
  ].join('\n');
}

function buildOpenAIPrompt(topic, contextText, round, previousGeminiFeedback) {
  if (round === 1) {
    return [
      `Topic: ${topic}`,
      '',
      contextText,
      '',
      'Task:',
      '1. Propose a production-ready plan for this topic in EMSIST.',
      '2. List risks, assumptions, and required validations.',
      '3. Provide a short action checklist.',
    ].join('\n');
  }

  return [
    `Topic: ${topic}`,
    '',
    'Gemini Feedback to Address:',
    previousGeminiFeedback || '[none]',
    '',
    'Task:',
    'Revise the plan to address the feedback. Keep only concrete actions and production-impacting points.',
  ].join('\n');
}

function buildGeminiPrompt(topic, contextText, openAIAnswer, round) {
  return [
    `Topic: ${topic}`,
    `Round: ${round}`,
    '',
    contextText,
    '',
    'OpenAI Maker Output:',
    openAIAnswer,
    '',
    'Task:',
    '1. Identify weak assumptions, missing controls, and regressions.',
    '2. Provide corrections and a tighter Definition of Done.',
    '3. Return only actionable feedback.',
  ].join('\n');
}

function extractOpenAIText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const segments = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') {
        segments.push(content.text);
      }
    }
  }

  const text = segments.join('\n').trim();
  if (!text) {
    throw new Error('OpenAI response text not found.');
  }
  return text;
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Gemini response text not found.');
  }
  return text;
}

async function callOpenAI(apiKey, model, userPrompt) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 1400,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: OPENAI_SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  return extractOpenAIText(payload);
}

async function callGemini(apiKey, model, userPrompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: GEMINI_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1400,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  return extractGeminiText(payload);
}

function renderTranscript({
  topic,
  openaiModel,
  geminiModel,
  rounds,
  contextBlocks,
  gitStatusText,
  turns,
  dryRun,
}) {
  const header = [
    '# EMSIST AI Discussion Channel',
    '',
    `- Timestamp: ${new Date().toISOString()}`,
    `- Topic: ${topic}`,
    `- OpenAI model: ${openaiModel}`,
    `- Gemini model: ${geminiModel}`,
    `- Rounds: ${rounds}`,
    `- Dry run: ${dryRun ? 'yes' : 'no'}`,
    '',
    '## Context Files',
    ...contextBlocks.map((block) => `- ${block.file}`),
    '',
    '## Git Snapshot',
    '```text',
    gitStatusText || 'clean',
    '```',
    '',
  ];

  const body = [];
  for (const turn of turns) {
    body.push(`## Round ${turn.round}`);
    body.push('');
    body.push('### OpenAI (Maker)');
    body.push('');
    body.push(turn.openai);
    body.push('');
    body.push('### Gemini (Checker)');
    body.push('');
    body.push(turn.gemini);
    body.push('');
  }

  return [...header, ...body].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!Number.isInteger(options.rounds) || options.rounds < 1 || options.rounds > 10) {
    throw new Error('--rounds must be an integer between 1 and 10.');
  }

  const projectRoot = path.resolve(options.projectRoot);
  const topic = options.topic
    ?? (options.topicFile ? (await readTextFile(path.resolve(projectRoot, options.topicFile))).trim() : '');

  if (!topic) {
    throw new Error('Provide --topic or --topic-file.');
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiModel = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const geminiModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  if (!options.dryRun) {
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required.');
    }
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is required.');
    }
  }

  const contextBlocks = await collectContext(projectRoot, options.contextFiles);
  const gitStatusText = safeGitStatus(projectRoot);
  const contextText = buildContextText(contextBlocks, gitStatusText);

  const turns = [];
  let previousGeminiFeedback = '';

  for (let round = 1; round <= options.rounds; round += 1) {
    const openaiPrompt = buildOpenAIPrompt(topic, contextText, round, previousGeminiFeedback);
    const geminiPromptBase = (openaiText) => buildGeminiPrompt(topic, contextText, openaiText, round);

    const openaiText = options.dryRun
      ? `[DRY-RUN] OpenAI prompt:\n${truncate(openaiPrompt, 4000)}`
      : await callOpenAI(openaiApiKey, openaiModel, openaiPrompt);

    const geminiPrompt = geminiPromptBase(openaiText);
    const geminiText = options.dryRun
      ? `[DRY-RUN] Gemini prompt:\n${truncate(geminiPrompt, 4000)}`
      : await callGemini(geminiApiKey, geminiModel, geminiPrompt);

    turns.push({
      round,
      openai: openaiText,
      gemini: geminiText,
    });
    previousGeminiFeedback = geminiText;
  }

  const outputPath = options.output
    ? path.resolve(projectRoot, options.output)
    : path.resolve(projectRoot, 'docs/governance/ai-discussions', `discussion-${timestampForFile()}.md`);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const transcript = renderTranscript({
    topic,
    openaiModel,
    geminiModel,
    rounds: options.rounds,
    contextBlocks,
    gitStatusText,
    turns,
    dryRun: options.dryRun,
  });
  await fs.writeFile(outputPath, transcript, 'utf8');

  console.log(`Discussion transcript written: ${path.relative(projectRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
