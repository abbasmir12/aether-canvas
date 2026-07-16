import OpenAI from 'openai';
import type { Responses } from 'openai/resources/responses/responses';

import type {
  AnalyzedFile,
  FileAnalysis,
  RelationshipDiscovery,
  DashboardAiInsight,
  DashboardInsightKind,
  SmartPreviewType,
} from '../../shared/types';
import type { PreparedFile } from './fileReader';

const DEFAULT_MODEL = 'gpt-5.6-luna';
const DEFAULT_REASONING_EFFORT = 'low';
const REASONING_EFFORTS = ['none', 'low', 'medium', 'high', 'xhigh', 'max'] as const;

type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

function configuredModel(): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
}

function configuredReasoningEffort(): ReasoningEffort {
  const configured = process.env.AI_REASONING_EFFORT?.trim().toLowerCase();

  if (!configured) {
    return DEFAULT_REASONING_EFFORT;
  }

  if (!REASONING_EFFORTS.includes(configured as ReasoningEffort)) {
    throw new Error(
      `Invalid AI_REASONING_EFFORT "${configured}". Use ${REASONING_EFFORTS.join(', ')}.`,
    );
  }

  return configured as ReasoningEffort;
}

export const ANALYSIS_PROMPT = `You are the file analysis engine for Aether Canvas, a spatial desktop where grouping files expresses user intent.

Analyze the attached file. Extract only information grounded in the file. Use ISO YYYY-MM-DD dates when a full date is known. Keep smart preview data concise enough for a 220px desktop card. For well-known cities, districts, landmarks, airports, and venues, include approximate latitude and longitude when you know them; otherwise omit coordinates rather than guessing.

Choose one smart preview type: flight, hotel, budget, checklist, guide, document, or image.
- flight displayData: origin, destination, originCity, destCity, departDate, departTime, arriveDate, arriveTime.
- budget displayData: rows (up to 5, each with category and estimate), total, currency.
- checklist displayData: items (up to 12, each with text and checked), checkedCount, totalCount.
- hotel displayData: hotelName, location, checkIn, checkOut, nightlyRate, currency.
- guide displayData: title, highlights (up to 5), pages when known.
- image displayData: description, detectedText.
- document displayData: title, keyPoints (up to 5), wordCount when known.

Never invent missing values. Return data matching the supplied JSON schema.`;

const FILE_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'category', 'entities', 'summary', 'smartPreview'],
  properties: {
    title: { type: 'string' },
    category: {
      type: 'string',
      enum: ['travel', 'finance', 'health', 'work', 'education', 'personal'],
    },
    entities: {
      type: 'object',
      additionalProperties: false,
      required: ['dates', 'costs', 'locations', 'people', 'tasks'],
      properties: {
        dates: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label', 'date', 'display'],
            properties: {
              label: { type: 'string' },
              date: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
        costs: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label', 'amount', 'currency'],
            properties: {
              label: { type: 'string' },
              amount: { type: 'number' },
              currency: { type: 'string' },
            },
          },
        },
        locations: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'type'],
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              lat: { type: 'number' },
              lng: { type: 'number' },
            },
          },
        },
        people: { type: 'array', items: { type: 'string' } },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['item', 'completed'],
            properties: {
              item: { type: 'string' },
              completed: { type: 'boolean' },
            },
          },
        },
      },
    },
    summary: { type: 'string' },
    smartPreview: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'displayData'],
      properties: {
        type: {
          type: 'string',
          enum: ['flight', 'hotel', 'budget', 'checklist', 'guide', 'document', 'image'],
        },
        displayData: { type: 'object', additionalProperties: true },
      },
    },
  },
} as const;

const RELATIONSHIP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['relationships', 'suggestedCluster', 'shouldCluster', 'dashboard'],
  properties: {
    relationships: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['sourceFileId', 'targetFileId', 'type', 'label', 'strength'],
        properties: {
          sourceFileId: { type: 'string' },
          targetFileId: { type: 'string' },
          type: { type: 'string', enum: ['dates', 'cost', 'place', 'tasks'] },
          label: { type: 'string' },
          strength: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    suggestedCluster: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'dateRange', 'icon', 'category'],
      properties: {
        name: { type: 'string' },
        dateRange: { type: 'string' },
        icon: { type: 'string' },
        category: { type: 'string' },
      },
    },
    shouldCluster: { type: 'boolean' },
    dashboard: {
      type: ['object', 'null'],
      additionalProperties: false,
      required: ['title', 'subtitle', 'category', 'modules'],
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        category: { type: 'string' },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'kind', 'title', 'summary', 'icon', 'accent', 'sourceFileIds'],
            properties: {
              id: { type: 'string' },
              kind: { type: 'string', enum: ['overview', 'timeline', 'budget', 'checklist', 'map', 'tasks', 'topics', 'resources', 'results'] },
              title: { type: 'string' },
              summary: { type: 'string' },
              icon: { type: 'string', enum: ['sparkles', 'plane', 'wallet', 'check-square', 'map', 'list-checks', 'book-open', 'file-text'] },
              accent: { type: 'string', enum: ['dates', 'cost', 'place', 'tasks', 'neutral'] },
              sourceFileIds: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
} as const;

const DASHBOARD_INSIGHT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['items'], properties: {
    items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'body', 'category', 'lat', 'lng'], properties: { title: { type: 'string' }, body: { type: 'string' }, category: { type: 'string' }, lat: { type: ['number', 'null'] }, lng: { type: ['number', 'null'] } } } },
  },
} as const;

let openAIClient: OpenAI | null = null;

function client(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Copy .env.example to .env.');
  }

  openAIClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openAIClient;
}

function parseJSON<T>(outputText: string, label: string): T {
  if (!outputText.trim()) {
    throw new Error(`GPT-5.6 returned an empty ${label} response.`);
  }

  try {
    return JSON.parse(outputText) as T;
  } catch {
    throw new Error(`GPT-5.6 returned invalid JSON for ${label}.`);
  }
}

function assertAnalysis(value: FileAnalysis): FileAnalysis {
  const allowedPreviewTypes: SmartPreviewType[] = [
    'flight',
    'hotel',
    'budget',
    'checklist',
    'guide',
    'document',
    'image',
  ];

  if (
    !value ||
    typeof value.title !== 'string' ||
    typeof value.summary !== 'string' ||
    !value.entities ||
    !value.smartPreview ||
    !allowedPreviewTypes.includes(value.smartPreview.type)
  ) {
    throw new Error('GPT-5.6 returned an incomplete file analysis.');
  }

  return value;
}

export async function analyzeFile(
  fileData: PreparedFile,
  id: string,
  filePath: string,
): Promise<AnalyzedFile> {
  const dataUrl = `data:${fileData.mimeType};base64,${fileData.base64Data}`;
  const attachment: Responses.ResponseInputImage | Responses.ResponseInputFile =
    fileData.isImage
      ? {
          type: 'input_image',
          image_url: dataUrl,
          detail: 'high',
        }
      : {
          type: 'input_file',
          filename: fileData.fileName,
          file_data: dataUrl,
          ...(fileData.mimeType === 'application/pdf' ? { detail: 'high' as const } : {}),
        };

  const response = await client().responses.create({
    model: configuredModel(),
    reasoning: { effort: configuredReasoningEffort() },
    input: [
      {
        role: 'user',
        content: [attachment, { type: 'input_text', text: ANALYSIS_PROMPT }],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'aether_file_analysis',
        description: 'Structured file analysis for an Aether Canvas smart preview.',
        schema: FILE_ANALYSIS_SCHEMA,
        strict: false,
      },
      verbosity: 'low',
    },
  });

  const analysis = assertAnalysis(parseJSON<FileAnalysis>(response.output_text, 'file analysis'));

  return {
    id,
    filePath,
    fileName: fileData.fileName,
    mimeType: fileData.mimeType,
    fileSize: fileData.fileSize,
    ...analysis,
  };
}

export async function findRelationships(
  analyzedFiles: AnalyzedFile[],
): Promise<RelationshipDiscovery> {
  if (analyzedFiles.length < 2) {
    return { relationships: [], suggestedCluster: null, shouldCluster: false, dashboard: null };
  }

  const files = analyzedFiles.map(({ id, title, category, entities, summary, smartPreview }) => ({
    id,
    title,
    category,
    entities,
    summary,
    smartPreview,
  }));

  const response = await client().responses.create({
    model: configuredModel(),
    reasoning: { effort: configuredReasoningEffort() },
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `You are the relationship and workspace compiler for Aether Canvas. Identify only meaningful semantic relationships grounded in the analyzed metadata. Prefer one strongest relationship type for each related file pair. Do not connect unrelated files.\n\nThen design the dashboard this exact cluster needs. The dashboard is not a travel template, but every module must follow Aether's premium summary-card grammar: a compact white rounded section, a colored circular Lucide icon, a clear title, a concise useful preview, and an expanded interactive detail area. The visual inspiration is: a Journey timeline with a plane, a Budget ring with a wallet, a Packing checklist with a check-square, and a Map with pins. Translate that same quality and clarity to the user’s actual domain.\n\nChoose 2-5 modules based only on the files. Allowed kinds: overview, timeline, budget, checklist, map, tasks, topics, resources, results. Choose an icon from: sparkles, plane, wallet, check-square, map, list-checks, book-open, file-text. Choose an accent: dates (blue), cost (green), place (coral), tasks (purple), neutral (soft violet).\n\nExamples: travel → timeline/budget/checklist/map; study → overview/topics/timeline/tasks/resources; work project → overview/timeline/tasks/budget/resources; medical → results/timeline/tasks/resources; recipes → overview/checklist/timeline/resources. Only use modules grounded in the files. Give each module a specific short title, concise grounded summary, visual icon/accent, and exact source file IDs that contributed. Return dashboard null only when the files cannot form a coherent workspace.\n\nFiles: ${JSON.stringify(files)}`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'aether_relationships',
        description: 'Relationships and a possible cluster among analyzed canvas files.',
        schema: RELATIONSHIP_SCHEMA,
        strict: false,
      },
      verbosity: 'low',
    },
  });

  const result = parseJSON<RelationshipDiscovery>(response.output_text, 'relationships');
  const validIds = new Set(analyzedFiles.map((file) => file.id));
  const relationships = Array.isArray(result.relationships)
    ? result.relationships.filter(
        (relationship) =>
          validIds.has(relationship.sourceFileId) &&
          validIds.has(relationship.targetFileId) &&
          relationship.sourceFileId !== relationship.targetFileId,
      )
    : [];

  return {
    relationships,
    suggestedCluster: result.shouldCluster ? result.suggestedCluster : null,
    shouldCluster: Boolean(result.shouldCluster),
    dashboard: result.dashboard && Array.isArray(result.dashboard.modules)
      ? {
        ...result.dashboard,
        modules: result.dashboard.modules.filter((module) => validIds.has(module.sourceFileIds[0]) || module.sourceFileIds.some((id) => validIds.has(id))),
      }
      : null,
  };
}

export async function generateDashboardInsights(kind: DashboardInsightKind, context: string): Promise<DashboardAiInsight[]> {
  const prompts: Record<DashboardInsightKind, string> = {
    journey: 'Provide 3 concise, specific travel timeline or arrival tips. Focus on time zones, transfer planning, timing, and practical logistics. Do not invent bookings.',
    budget: 'Provide 3 concise practical budget observations grounded in the listed amounts: realism, one risk, and one saving idea. Never claim current prices as facts.',
    packing: 'Suggest 5 destination- or context-specific packing items that are not already listed. Explain each briefly. Do not repeat existing items.',
    map: 'Suggest up to 5 useful nearby places only when location context supports it. Include coordinates only when confidently known; otherwise return null coordinates.',
  };
  const response = await client().responses.create({
    model: configuredModel(), reasoning: { effort: configuredReasoningEffort() },
    input: [{ role: 'user', content: [{ type: 'input_text', text: `You are Aether Canvas's contextual assistant. ${prompts[kind]} Return JSON matching the supplied schema.\n\nContext:\n${context}` }] }],
    text: { format: { type: 'json_schema', name: `aether_${kind}_insights`, description: 'Small, cacheable dashboard insights.', schema: DASHBOARD_INSIGHT_SCHEMA, strict: false }, verbosity: 'low' },
  });
  const parsed = parseJSON<{ items?: DashboardAiInsight[] }>(response.output_text, `${kind} insights`);
  return Array.isArray(parsed.items) ? parsed.items.filter((item) => typeof item.title === 'string' && typeof item.body === 'string') : [];
}
