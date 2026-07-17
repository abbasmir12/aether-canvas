import OpenAI from 'openai';
import type { Responses } from 'openai/resources/responses/responses';
import { promises as fs } from 'node:fs';

import type {
  AnalyzedFile,
  DashboardModule,
  DashboardPlan,
  FileAnalysis,
  RelationshipDiscovery,
  DashboardAiInsight,
  DashboardInsightKind,
  SmartPreviewType,
  VisualQueryResult,
  VisualQuerySource,
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
- budget displayData: rows (up to 6, each with category, estimate, and actual when the source provides it), estimatedTotal, actualTotal, total (the estimated total for compatibility), currency. Preserve explicit zero actual amounts; zero means nothing has been spent in that category, not missing data.
- checklist displayData: items (up to 12, each with text and checked), checkedCount, totalCount.
- hotel displayData: hotelName, location, checkIn, checkOut, nightlyRate, currency.
- guide displayData: title, highlights (up to 5), pages when known.
- image displayData: description, detectedText.
- document displayData: title, keyPoints (up to 5), wordCount when known.

Also create a compact source-intelligence layer for the file detail panel:
- headline: the single most useful grounded takeaway, not a repeat of the title.
- status: a brief state such as "Confirmed", "8 of 14 complete", "Within estimate", or an empty string when no state is supported.
- keyFacts: 2–4 high-signal label/value facts, each assigned dates, cost, place, tasks, or neutral. Prefer identifiers, times, totals, parties, deadlines, and progress that help the user act.
- highlights: up to 3 concise important details that do not fit the key facts.
- suggestedActions: up to 3 short, file-specific next actions phrased as commands. Only suggest sensible actions grounded in this file; do not claim they were completed.

Never invent missing values. Return data matching the supplied JSON schema.`;

const FILE_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'category', 'entities', 'summary', 'smartPreview', 'intelligence'],
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
    intelligence: {
      type: 'object',
      additionalProperties: false,
      required: ['headline', 'status', 'keyFacts', 'highlights', 'suggestedActions'],
      properties: {
        headline: { type: 'string' },
        status: { type: 'string' },
        keyFacts: {
          type: 'array',
          maxItems: 4,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label', 'value', 'accent'],
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
              accent: { type: 'string', enum: ['dates', 'cost', 'place', 'tasks', 'neutral'] },
            },
          },
        },
        highlights: { type: 'array', maxItems: 3, items: { type: 'string' } },
        suggestedActions: { type: 'array', maxItems: 3, items: { type: 'string' } },
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
      required: ['title', 'subtitle', 'category', 'headerIcon', 'headerAccent', 'modules'],
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        category: { type: 'string' },
        headerIcon: { type: 'string', enum: ['sparkles', 'plane', 'wallet', 'check-square', 'map', 'list-checks', 'book-open', 'file-text'] },
        headerAccent: { type: 'string', enum: ['dates', 'cost', 'place', 'tasks', 'neutral'] },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'kind', 'title', 'summary', 'icon', 'accent', 'visual', 'interactions', 'compact', 'composition', 'sourceFileIds'],
            properties: {
              id: { type: 'string' },
              kind: { type: 'string', enum: ['overview', 'timeline', 'budget', 'checklist', 'map', 'tasks', 'topics', 'resources', 'results'] },
              title: { type: 'string' },
              summary: { type: 'string' },
              icon: { type: 'string', enum: ['sparkles', 'plane', 'wallet', 'check-square', 'map', 'list-checks', 'book-open', 'file-text'] },
              accent: { type: 'string', enum: ['dates', 'cost', 'place', 'tasks', 'neutral'] },
              visual: { type: 'string', enum: ['source-list', 'route-rail', 'ring-metric', 'progress', 'pin-map', 'milestone-list', 'key-points', 'stat-grid', 'priority-stack', 'calendar-strip', 'activity-stream', 'comparison-bars'] },
              interactions: { type: 'array', items: { type: 'string', enum: ['expand', 'focus-source', 'copy', 'edit-values', 'add-item', 'toggle-item', 'export', 'open-map', 'ai-insights'] } },
              compact: { type: 'object', additionalProperties: false, required: ['primary', 'secondary', 'tertiary'], properties: { primary: { type: 'string' }, secondary: { type: 'string' }, tertiary: { type: 'string' } } },
              composition: {
                type: 'object',
                additionalProperties: false,
                required: ['layout', 'primitives'],
                properties: {
                  layout: { type: 'string', enum: ['stack', 'split', 'hero-stack', 'grid'] },
                  primitives: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 3,
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['id', 'type', 'label', 'primary', 'secondary', 'tertiary', 'values'],
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string', enum: ['metric', 'route', 'ring', 'progress', 'map', 'timeline', 'ranked-list', 'comparison', 'source-evidence', 'status', 'calendar'] },
                        label: { type: 'string' },
                        primary: { type: 'string' },
                        secondary: { type: 'string' },
                        tertiary: { type: 'string' },
                        values: { type: 'array', maxItems: 4, items: { type: 'string' } },
                      },
                    },
                  },
                },
              },
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

const VISUAL_QUERY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['answer', 'sources', 'confidence', 'followUpSuggestions'],
  properties: {
    answer: {
      type: 'object',
      additionalProperties: false,
      required: ['headline', 'detail', 'value', 'valueLabel', 'breakdown'],
      properties: {
        headline: { type: 'string' },
        detail: { type: 'string' },
        value: { type: ['string', 'null'] },
        valueLabel: { type: ['string', 'null'] },
        breakdown: {
          type: 'array',
          maxItems: 6,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label', 'value'],
            properties: { label: { type: 'string' }, value: { type: 'string' } },
          },
        },
      },
    },
    sources: {
      type: 'array',
      maxItems: 12,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'sectionId', 'sectionLabel', 'fileId', 'fileName', 'relevance', 'color'],
        properties: {
          type: { type: 'string', enum: ['section', 'file'] },
          sectionId: { type: ['string', 'null'] },
          sectionLabel: { type: ['string', 'null'] },
          fileId: { type: ['string', 'null'] },
          fileName: { type: ['string', 'null'] },
          relevance: { type: 'string' },
          color: { type: 'string', enum: ['#4A90D9', '#34A853', '#EA4335', '#9B72CF', '#8B7AA8'] },
        },
      },
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    followUpSuggestions: { type: 'array', minItems: 2, maxItems: 3, items: { type: 'string' } },
  },
} as const;

const DASHBOARD_COMPACT_RULES = `Aether renders generated workspaces through a safe visual grammar. Every module must include both:
1. compact: three short grounded fallback strings (primary, secondary, tertiary).
2. composition: a layout plus 1–3 reusable visual primitives. The composition is the preferred compact presentation; the legacy visual field controls detailed behavior when the module is opened.

Composition layouts:
- stack: full-width primitives in sequence; best for narrative or one dominant flow.
- split: two balanced columns; best for two complementary facts.
- hero-stack: one dominant first primitive followed by supporting primitives.
- grid: compact equal-weight facts.

Primitive vocabulary:
- metric: one headline value with short context.
- route: a meaningful start → destination/process transition.
- ring: part-to-whole, spent/remaining, score/target, or completion ratio.
- progress: completion fraction or percentage with a goal.
- map: 2–4 grounded location names in values.
- timeline: 2–4 ordered milestones in values.
- ranked-list: 2–4 priorities, findings, concepts, or next actions in values.
- comparison: 2–3 genuinely comparable options/categories in values.
- source-evidence: contributing filenames or evidence labels in values.
- status: a meaningful current state plus supporting context.
- calendar: 2–3 dates/deadlines in values.

Every primitive must provide id, type, label, primary, secondary, tertiary, and values. Use empty strings/arrays for fields that do not apply. Never invent decorative metrics, percentages, comparisons, dates, or locations. Prefer one excellent primitive over three weak ones.

Tokyo Trip reference compositions:
- Journey: layout stack; route { primary: "JFK", secondary: "HND", tertiary: "Check-in Jul 19", values: [] }; timeline values ["Depart Jul 18", "Arrive Jul 19", "Check-out Jul 25"].
- Budget: layout split; ring { primary: "$1,460", secondary: "$540 remaining", tertiary: "of $2,000", values: [] }; status { primary: "On track", secondary: "73% allocated" }.
- Packing: layout hero-stack; progress { primary: "8 / 14", secondary: "packed", tertiary: "6 remaining" }; ranked-list values ["Passport", "Adapter", "Rain jacket"].
- Map: layout stack; map values ["Shinjuku", "Shibuya", "Asakusa"].

Non-travel examples:
- Study: metric + progress + ranked-list for grade/readiness/key concepts.
- Work: status + timeline + source-evidence for delivery state/milestones/provenance.
- Health: status + calendar + timeline for results/appointments/history; never manufacture medical conclusions.
- Renovation: ring + comparison + timeline for cost/quotes/schedule.
- Recipes: ranked-list + timeline + progress for ingredients/cooking sequence/preparation.

Keep all visible strings concise enough for a 300px-wide desktop card. Preserve traceability by grounding every module and primitive in its sourceFileIds and extracted metadata.`;

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
          { type: 'input_text', text: DASHBOARD_COMPACT_RULES },
          {
            type: 'input_text',
            text: `You are the relationship and workspace compiler for Aether Canvas. Identify only meaningful semantic relationships grounded in the analyzed metadata. Prefer one strongest relationship type for each related file pair. Do not connect unrelated files.\n\nThen compile a declarative dashboard UI plan. You do not write HTML, CSS, React, or arbitrary code. Aether safely renders your plan through a fixed interactive component library. For every module you must choose a visual and only the interactions that are appropriate for its grounded data.\n\nUse this Tokyo Trip card as the exact compositional example:\n{\n  "title": "Tokyo Trip", "subtitle": "Jul 18–25", "headerIcon": "map", "headerAccent": "place",\n  "modules": [\n    {"id":"journey","kind":"timeline","title":"Journey","icon":"plane","accent":"dates","visual":"route-rail","interactions":["expand","focus-source","copy","ai-insights"]},\n    {"id":"budget","kind":"budget","title":"Budget","icon":"wallet","accent":"cost","visual":"ring-metric","interactions":["expand","edit-values","export","ai-insights"]},\n    {"id":"packing","kind":"checklist","title":"Packing","icon":"check-square","accent":"tasks","visual":"progress","interactions":["expand","toggle-item","add-item","ai-insights"]},\n    {"id":"map","kind":"map","title":"Map","icon":"map","accent":"place","visual":"pin-map","interactions":["expand","focus-source","open-map","ai-insights"]}\n  ]\n}\n\nVisual semantics: route-rail = horizontal milestones/route with supporting metadata; ring-metric = a bold central ring, amount, and two-value legend; progress = oversized completion fraction and colored progress bar; pin-map = bounded mini-map with pins; milestone-list = ordered dated events; key-points = concise highlighted facts; source-list = traceable source-file rows. Every visible module uses a white 12px-rounded inset panel, colored circular Lucide icon, concise label, and semantic left-side connection port. The overall card has a large colored header icon/title/subtitle/menu and a generated-from-files sparkle footer.\n\nAdapt Tokyo’s quality, hierarchy, and interactive grammar to the actual domain: study → concepts/progress/resources; work → milestones/tasks/budget; health → results/timeline/actions; recipes → ingredients/checklist/timing. Choose 2–5 grounded modules. Allowed kinds: overview, timeline, budget, checklist, map, tasks, topics, resources, results. Icons: sparkles, plane, wallet, check-square, map, list-checks, book-open, file-text. Accents: dates (blue), cost (green), place (coral), tasks (purple), neutral (soft violet). Visuals: source-list, route-rail, ring-metric, progress, pin-map, milestone-list, key-points. Interactions: expand, focus-source, copy, edit-values, add-item, toggle-item, export, open-map, ai-insights.\n\nReturn a specific short title, concise grounded summary, visual, allowed interactions, and exact contributing source file IDs for every module. Return dashboard null only when the files cannot form a coherent workspace.\n\nFiles: ${JSON.stringify(files)}`,
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
        strict: true,
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

const ACCENT_COLORS = {
  dates: '#4A90D9',
  cost: '#34A853',
  place: '#EA4335',
  tasks: '#9B72CF',
  neutral: '#8B7AA8',
} as const;

async function queryFileContext(file: AnalyzedFile): Promise<Record<string, unknown>> {
  let contentExcerpt = '';
  if (file.mimeType.startsWith('text/') || /(?:csv|json|xml|markdown)/i.test(file.mimeType)) {
    try { contentExcerpt = (await fs.readFile(file.filePath, 'utf8')).slice(0, 2_000); } catch { /* Cached analysis remains queryable. */ }
  }
  return {
    id: file.id,
    fileName: file.fileName,
    title: file.title,
    category: file.category,
    summary: file.summary,
    entities: file.entities,
    smartPreview: file.smartPreview,
    intelligence: file.intelligence,
    contentExcerpt,
  };
}

export async function answerWorkspaceQuestion(question: string, analyzedFiles: AnalyzedFile[], dashboard: DashboardPlan | null): Promise<VisualQueryResult> {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) throw new Error('Ask a question about this workspace.');
  if (!analyzedFiles.length) throw new Error('Add files before asking the canvas.');

  const files = await Promise.all(analyzedFiles.map(queryFileContext));
  const dashboardContext = dashboard ? {
    title: dashboard.title,
    category: dashboard.category,
    modules: dashboard.modules.map((module) => ({
      id: module.id,
      kind: module.kind,
      label: module.title,
      summary: module.summary,
      accent: module.accent,
      compact: module.compact,
      composition: module.composition,
      sourceFileIds: module.sourceFileIds,
    })),
  } : null;
  const response = await client().responses.create({
    model: configuredModel(),
    reasoning: { effort: configuredReasoningEffort() },
    input: [{
      role: 'user',
      content: [{
        type: 'input_text',
        text: `You are the grounded visual-query engine inside Aether Canvas, a spatial file workspace.

Answer using ONLY the supplied file analysis, content excerpts, and dashboard data. Be precise. Perform calculations when the inputs support them. Never use outside facts or invent missing values.

Every source that materially contributed must be included:
- section sources must use an exact dashboard module id.
- file sources must use an exact file id.
- use the module's semantic color: dates #4A90D9, cost #34A853, place #EA4335, tasks #9B72CF, neutral #8B7AA8.
- use an empty breakdown when a calculation/comparison is not useful.
- use null value/valueLabel when there is no single key fact.
- below 0.5 confidence, explain what is missing and avoid pretending the answer is known.
- write 2–3 follow-up questions answerable from this same workspace.

WORKSPACE:
${JSON.stringify({ dashboard: dashboardContext, files })}

USER QUESTION:
${JSON.stringify(cleanQuestion)}

Return the schema-constrained visual answer.`,
      }],
    }],
    text: {
      format: {
        type: 'json_schema',
        name: 'aether_visual_query',
        description: 'A grounded answer with traceable dashboard and file sources.',
        schema: VISUAL_QUERY_SCHEMA,
        strict: true,
      },
      verbosity: 'low',
    },
  });

  const parsed = parseJSON<VisualQueryResult>(response.output_text, 'visual query');
  const filesById = new Map(analyzedFiles.map((file) => [file.id, file]));
  const modulesById = new Map(dashboard?.modules.map((module) => [module.id, module]) ?? []);
  const seen = new Set<string>();
  const sources: VisualQuerySource[] = [];
  for (const source of Array.isArray(parsed.sources) ? parsed.sources : []) {
    if (source.type === 'section' && source.sectionId && modulesById.has(source.sectionId)) {
      const module = modulesById.get(source.sectionId)!;
      const key = `section:${module.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sources.push({ ...source, sectionId: module.id, sectionLabel: module.title, fileId: null, fileName: null, color: ACCENT_COLORS[module.accent] });
      continue;
    }
    if (source.type === 'file' && source.fileId && filesById.has(source.fileId)) {
      const file = filesById.get(source.fileId)!;
      const key = `file:${file.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const color = file.entities.costs.length ? ACCENT_COLORS.cost : file.entities.dates.length ? ACCENT_COLORS.dates : file.entities.locations.length ? ACCENT_COLORS.place : file.entities.tasks.length ? ACCENT_COLORS.tasks : ACCENT_COLORS.neutral;
      sources.push({ ...source, sectionId: null, sectionLabel: null, fileId: file.id, fileName: file.fileName, color });
    }
  }

  // Structured generation can occasionally cite the raw file while omitting the
  // dashboard module that visibly presents the same fact. Recover that section
  // deterministically so the explainability trace remains file → module → answer.
  const selectedFileIds = new Set(sources.flatMap((source) => source.fileId ? [source.fileId] : []));
  const answerIntent = `${cleanQuestion} ${parsed.answer.headline} ${parsed.answer.detail} ${parsed.answer.valueLabel ?? ''}`.toLowerCase();
  const moduleVocabulary: Record<DashboardModule['accent'], string[]> = {
    dates: ['journey', 'date', 'arrival', 'arrive', 'departure', 'depart', 'flight', 'timeline', 'schedule', 'duration', 'trip period'],
    cost: ['budget', 'cost', 'spend', 'spending', 'expense', 'money', 'price', 'fare', 'financial'],
    place: ['map', 'place', 'location', 'where', 'destination', 'direction', 'nearby'],
    tasks: ['packing', 'pack', 'task', 'checklist', 'item', 'todo', 'complete'],
    neutral: ['overview', 'summary', 'source', 'key point'],
  };
  for (const module of dashboard?.modules ?? []) {
    const key = `section:${module.id}`;
    if (seen.has(key)) continue;
    const sharesSelectedFile = module.sourceFileIds.some((fileId) => selectedFileIds.has(fileId));
    const vocabulary = [
      module.title.toLowerCase(),
      module.kind.toLowerCase(),
      ...moduleVocabulary[module.accent],
    ];
    if (!sharesSelectedFile || !vocabulary.some((term) => term.length > 2 && answerIntent.includes(term))) continue;
    seen.add(key);
    sources.push({
      type: 'section',
      sectionId: module.id,
      sectionLabel: module.title,
      fileId: null,
      fileName: null,
      relevance: `Presents the ${module.title.toLowerCase()} data used in this answer.`,
      color: ACCENT_COLORS[module.accent],
    });
  }

  return {
    answer: parsed.answer,
    sources,
    confidence: Math.max(0, Math.min(1, parsed.confidence)),
    followUpSuggestions: parsed.followUpSuggestions.slice(0, 3),
  };
}
