import OpenAI from 'openai';
import type { Responses } from 'openai/resources/responses/responses';

import type {
  AnalyzedFile,
  FileAnalysis,
  RelationshipDiscovery,
  SmartPreviewType,
} from '../../shared/types';
import type { PreparedFile } from './fileReader';

const MODEL = 'gpt-5.6';

export const ANALYSIS_PROMPT = `You are the file analysis engine for Aether Canvas, a spatial desktop where grouping files expresses user intent.

Analyze the attached file. Extract only information grounded in the file. Use ISO YYYY-MM-DD dates when a full date is known. Keep smart preview data concise enough for a 220px desktop card.

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
  required: ['relationships', 'suggestedCluster', 'shouldCluster'],
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
    model: MODEL,
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
    return { relationships: [], suggestedCluster: null, shouldCluster: false };
  }

  const files = analyzedFiles.map(({ id, title, category, entities, summary }) => ({
    id,
    title,
    category,
    entities,
    summary,
  }));

  const response = await client().responses.create({
    model: MODEL,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `You are the relationship discovery engine for Aether Canvas. Identify only meaningful semantic relationships grounded in the analyzed metadata. Prefer one strongest relationship type for each related file pair. Do not connect unrelated files.\n\nFiles: ${JSON.stringify(files)}`,
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
  };
}
