/**
 * Akash Template Registry
 *
 * Curated catalog of production-ready templates sourced from the
 * awesome-akash community repository. Each template contains a
 * pre-built SDL that can be deployed directly to Akash.
 */

export interface TemplateEnvVar {
  key: string;
  defaultValue: string;
  required: boolean;
}

export interface TemplatePort {
  port: number;
  description: string;
}

export interface TemplateResources {
  cpu: number;
  memory: string;
  storage: string;
  gpu?: { units: number; vendor: string };
}

export interface Template {
  slug: string;
  name: string;
  description: string;
  category: 'ai' | 'database' | 'dev-tools';
  resources: TemplateResources;
  envVars: TemplateEnvVar[];
  ports: TemplatePort[];
  sdl: string;
  estimatedMonthlyCostUsd: { low: number; high: number };
}

const TEMPLATES: Template[] = [
  {
    slug: 'ollama',
    name: 'Ollama',
    description: 'Run any open-source AI model on your own GPU-powered server. Supports Llama 3, Mistral, Phi-3, Gemma, and 100+ other models. Compatible with OpenAI API format.',
    category: 'ai',
    resources: { cpu: 8, memory: '28Gi', storage: '100Gi', gpu: { units: 1, vendor: 'nvidia' } },
    envVars: [
      { key: 'MODEL', defaultValue: 'llama3.1:8b', required: false },
    ],
    ports: [{ port: 11434, description: 'Ollama REST API (OpenAI-compatible)' }],
    estimatedMonthlyCostUsd: { low: 80, high: 200 },
    sdl: `---
version: "2.0"
services:
  ollama:
    image: ollama/ollama:0.13.4
    expose:
      - port: 11434
        as: 11434
        to:
          - global: true
    env:
      - MODEL=llama3.1:8b
    command:
      - /bin/sh
      - -c
      - |
        ollama serve &
        while ! ollama pull \${MODEL}; do
          echo "Waiting for model download..."
          sleep 2.5
        done
        ollama list
        pkill ollama
        ollama serve
profiles:
  compute:
    ollama:
      resources:
        cpu:
          units: 8
        memory:
          size: 28Gi
        storage:
          size: 100Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
  placement:
    dcloud:
      pricing:
        ollama:
          denom: uact
          amount: 1000000
deployment:
  ollama:
    dcloud:
      profile: ollama
      count: 1
`,
  },
  {
    slug: 'vllm',
    name: 'vLLM',
    description: 'Production-grade OpenAI-compatible inference server for large language models. Optimized for high throughput and low latency. Connect any OpenAI SDK client directly.',
    category: 'ai',
    resources: { cpu: 16, memory: '100Gi', storage: '80Gi', gpu: { units: 1, vendor: 'nvidia' } },
    envVars: [
      { key: 'HUGGING_FACE_HUB_TOKEN', defaultValue: '', required: true },
      { key: 'VLLM_API_KEY', defaultValue: '', required: true },
      { key: 'MODEL', defaultValue: 'MaziyarPanahi/WizardLM-2-7B-AWQ', required: false },
    ],
    ports: [{ port: 8000, description: 'OpenAI-compatible REST API' }],
    estimatedMonthlyCostUsd: { low: 150, high: 300 },
    sdl: `---
version: "2.0"
services:
  vllm:
    image: vllm/vllm-openai:v0.4.0.post1
    expose:
      - port: 8000
        as: 8000
        to:
          - global: true
    command:
      - bash
      - "-c"
    args:
      - >-
        huggingface-cli download \${MODEL} && /usr/bin/python3 -m vllm.entrypoints.openai.api_server --model \${MODEL}
    env:
      - HUGGING_FACE_HUB_TOKEN=
      - VLLM_API_KEY=
      - MODEL=MaziyarPanahi/WizardLM-2-7B-AWQ
profiles:
  compute:
    vllm:
      resources:
        cpu:
          units: 16
        memory:
          size: 100Gi
        storage:
          - size: 80Gi
          - name: shm
            size: 10Gi
            attributes:
              class: ram
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
  placement:
    dcloud:
      pricing:
        vllm:
          denom: uact
          amount: 1000000
deployment:
  vllm:
    dcloud:
      profile: vllm
      count: 1
`,
  },
  {
    slug: 'comfyui',
    name: 'ComfyUI',
    description: 'Visual workflow editor for AI image generation. Build and run Stable Diffusion pipelines using a node-based interface. Supports LoRAs, ControlNet, upscalers, and custom model workflows.',
    category: 'ai',
    resources: { cpu: 6, memory: '35Gi', storage: '50Gi', gpu: { units: 1, vendor: 'nvidia' } },
    envVars: [
      { key: 'ENABLE_MANAGER', defaultValue: 'true', required: false },
      { key: 'MODELURLS', defaultValue: '', required: false },
      { key: 'COMMANDLINE_ARGS', defaultValue: '--listen 0.0.0.0 --port 8080', required: false },
    ],
    ports: [{ port: 80, description: 'ComfyUI web interface' }],
    estimatedMonthlyCostUsd: { low: 80, high: 200 },
    sdl: `---
version: "2.0"
services:
  app:
    image: zjuuu/comfyui:0.23
    expose:
      - port: 8080
        as: 80
        to:
          - global: true
    env:
      - "ENABLE_MANAGER=true"
      - "VAEURLS="
      - "MODELURLS="
      - "UPSCALEURLS="
      - "COMMANDLINE_ARGS=--listen 0.0.0.0 --port 8080"
      - "DELETE_EVERY_12HRS=true"
profiles:
  compute:
    app:
      resources:
        cpu:
          units: 6.0
        memory:
          size: 35Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
        storage:
          size: 50Gi
  placement:
    akash:
      pricing:
        app:
          denom: uact
          amount: 10000
deployment:
  app:
    akash:
      profile: app
      count: 1
`,
  },
  {
    slug: 'postgres',
    name: 'PostgreSQL',
    description: 'PostgreSQL relational database with persistent storage. The most advanced open-source database — ideal for structured data, complex queries, and production applications.',
    category: 'database',
    resources: { cpu: 1, memory: '1Gi', storage: '2Gi' },
    envVars: [
      { key: 'POSTGRES_USER', defaultValue: 'admin', required: false },
      { key: 'POSTGRES_PASSWORD', defaultValue: '', required: true },
      { key: 'POSTGRES_DB', defaultValue: 'mydb', required: false },
    ],
    ports: [{ port: 5432, description: 'PostgreSQL wire protocol' }],
    estimatedMonthlyCostUsd: { low: 2, high: 8 },
    sdl: `---
version: "2.0"
services:
  postgres:
    image: postgres:16
    expose:
      - port: 5432
        to:
          - global: true
    env:
      - PGDATA=/var/lib/postgresql/data/pgdata
      - "POSTGRES_USER=admin"
      - "POSTGRES_PASSWORD=changeme"
      - "POSTGRES_DB=mydb"
    params:
      storage:
        data:
          mount: /var/lib/postgresql/data
          readOnly: false
profiles:
  compute:
    postgres:
      resources:
        cpu:
          units: 1.0
        memory:
          size: 1Gi
        storage:
          - size: 1Gi
          - name: data
            size: 1Gi
            attributes:
              persistent: true
              class: beta3
  placement:
    akash:
      attributes:
        host: akash
      signedBy:
        anyOf:
          - "akash1365yvmc4s7awdyj3n2sav7xfx76adc6dnmlx63"
      pricing:
        postgres:
          denom: uact
          amount: 10000
deployment:
  postgres:
    akash:
      profile: postgres
      count: 1
`,
  },
  {
    slug: 'redis',
    name: 'Redis',
    description: 'In-memory data store for caching, session storage, queues, and pub/sub messaging. Ultra-low latency — sub-millisecond reads and writes. Drop-in cache layer for any application.',
    category: 'database',
    resources: { cpu: 1, memory: '1Gi', storage: '1Gi' },
    envVars: [
      { key: 'REDIS_PASSWORD', defaultValue: '', required: true },
      { key: 'REDIS_AOF_ENABLED', defaultValue: 'no', required: false },
    ],
    ports: [{ port: 6379, description: 'Redis protocol' }],
    estimatedMonthlyCostUsd: { low: 2, high: 8 },
    sdl: `---
version: "2.0"
services:
  redis:
    image: redis:8.2.2
    expose:
      - port: 6379
        as: 6379
        to:
          - global: true
    env:
      - REDIS_AOF_ENABLED=no
      - ALLOW_EMPTY_PASSWORD=no
      - REDIS_PASSWORD=changeme
profiles:
  compute:
    redis:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 1Gi
  placement:
    dcloud:
      pricing:
        redis:
          denom: uact
          amount: 100000
deployment:
  redis:
    dcloud:
      profile: redis
      count: 1
`,
  },
  {
    slug: 'mongodb',
    name: 'MongoDB',
    description: 'Document database for flexible, schema-free data storage. Great for user profiles, product catalogs, content management, and real-time analytics. Native JSON storage with powerful queries.',
    category: 'database',
    resources: { cpu: 1, memory: '1Gi', storage: '1Gi' },
    envVars: [
      { key: 'MONGO_INITDB_ROOT_USERNAME', defaultValue: 'root', required: false },
      { key: 'MONGO_INITDB_ROOT_PASSWORD', defaultValue: '', required: true },
    ],
    ports: [{ port: 27017, description: 'MongoDB wire protocol' }],
    estimatedMonthlyCostUsd: { low: 2, high: 8 },
    sdl: `---
version: "2.0"
services:
  mongo:
    image: mongo:7
    expose:
      - port: 27017
        to:
          - global: true
    env:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=__REPLACE_WITH_STRONG_PASSWORD__
profiles:
  compute:
    mongo:
      resources:
        cpu:
          units: 1.0
        memory:
          size: 1Gi
        storage:
          size: 1Gi
  placement:
    akash:
      attributes:
        host: akash
      signedBy:
        anyOf:
          - "akash1365yvmc4s7awdyj3n2sav7xfx76adc6dnmlx63"
      pricing:
        mongo:
          denom: uact
          amount: 10000
deployment:
  mongo:
    akash:
      profile: mongo
      count: 1
`,
  },
  {
    slug: 'mysql',
    name: 'MySQL',
    description: 'MySQL relational database — the most widely deployed SQL database. Compatible with most web frameworks and ORMs out of the box. Ideal for WordPress, Laravel, Django, and legacy migrations.',
    category: 'database',
    resources: { cpu: 1, memory: '512Mi', storage: '512Mi' },
    envVars: [
      { key: 'MYSQL_ROOT_PASSWORD', defaultValue: '', required: true },
      { key: 'MYSQL_DATABASE', defaultValue: 'mydb', required: false },
    ],
    ports: [{ port: 3306, description: 'MySQL wire protocol' }],
    estimatedMonthlyCostUsd: { low: 2, high: 5 },
    sdl: `---
version: "2.0"
services:
  mysql:
    image: mysql:8.0
    expose:
      - port: 3306
        to:
          - global: true
    env:
      - "MYSQL_ROOT_PASSWORD=changeme"
      - "MYSQL_DATABASE=mydb"
profiles:
  compute:
    mysql:
      resources:
        cpu:
          units: 1.0
        memory:
          size: 512Mi
        storage:
          size: 512Mi
  placement:
    akash:
      attributes:
        host: akash
      signedBy:
        anyOf:
          - "akash1365yvmc4s7awdyj3n2sav7xfx76adc6dnmlx63"
      pricing:
        mysql:
          denom: uact
          amount: 10000
deployment:
  mysql:
    akash:
      profile: mysql
      count: 1
`,
  },
  {
    slug: 'weaviate',
    name: 'Weaviate',
    description: 'Vector database for AI-powered search and retrieval. Store embeddings alongside structured data, then query by semantic meaning. Essential for RAG pipelines and semantic search.',
    category: 'database',
    resources: { cpu: 4, memory: '4Gi', storage: '4Gi' },
    envVars: [
      { key: 'AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED', defaultValue: 'true', required: false },
      { key: 'DEFAULT_VECTORIZER_MODULE', defaultValue: 'text2vec-transformers', required: false },
      { key: 'QUERY_DEFAULTS_LIMIT', defaultValue: '20', required: false },
    ],
    ports: [{ port: 8080, description: 'Weaviate REST + GraphQL API' }],
    estimatedMonthlyCostUsd: { low: 15, high: 30 },
    sdl: `---
version: "2.0"
services:
  weaviate:
    image: semitechnologies/weaviate:1.19.6
    expose:
      - port: 8080
        to:
          - global: true
    env:
      - QUERY_DEFAULTS_LIMIT=20
      - AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true
      - PERSISTENCE_DATA_PATH=./var/lib/weaviate
      - DEFAULT_VECTORIZER_MODULE=text2vec-transformers
      - ENABLE_MODULES=text2vec-transformers
      - TRANSFORMERS_INFERENCE_API=http://t2v-transformers:8080
      - CLUSTER_HOSTNAME=node1
    params:
      storage:
        weaviate:
          mount: /var/lib/weaviate
          readOnly: false
  t2v-transformers:
    image: semitechnologies/transformers-inference:sentence-transformers-multi-qa-MiniLM-L6-cos-v1
    env:
      - ENABLE_CUDA=0
    expose:
      - port: 8080
        to:
          - service: weaviate
profiles:
  compute:
    weaviate:
      resources:
        cpu:
          units: 4
        memory:
          size: 4Gi
        storage:
          - size: 4Gi
          - name: weaviate
            size: 32Gi
            attributes:
              persistent: true
              class: beta3
    t2v-transformers:
      resources:
        cpu:
          units: 2
        memory:
          size: 4Gi
        storage:
          - size: 4Gi
  placement:
    akash:
      pricing:
        weaviate:
          denom: uact
          amount: 10000
        t2v-transformers:
          denom: uact
          amount: 10000
deployment:
  weaviate:
    akash:
      profile: weaviate
      count: 1
  t2v-transformers:
    akash:
      profile: t2v-transformers
      count: 1
`,
  },
  {
    slug: 'gitea',
    name: 'Gitea',
    description: 'Self-hosted Git server with a GitHub-like interface. Manage repositories, pull requests, issues, and CI/CD pipelines on your own infrastructure. Lightweight and fast.',
    category: 'dev-tools',
    resources: { cpu: 0.5, memory: '1Gi', storage: '1Gi' },
    envVars: [],
    ports: [
      { port: 3000, description: 'Gitea web interface' },
      { port: 2222, description: 'SSH Git access' },
    ],
    estimatedMonthlyCostUsd: { low: 2, high: 5 },
    sdl: `---
version: "2.0"
services:
  gitea:
    image: gitea/gitea:1.22.0-rootless
    expose:
      - port: 3000
        as: 3000
        to:
          - global: true
      - port: 2222
        as: 2222
        to:
          - global: true
profiles:
  compute:
    gitea:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 1Gi
        storage:
          - size: 1Gi
  placement:
    dcloud:
      pricing:
        gitea:
          denom: uact
          amount: 100000
deployment:
  gitea:
    dcloud:
      profile: gitea
      count: 1
`,
  },
  {
    slug: 'uptime-kuma',
    name: 'Uptime Kuma',
    description: 'Self-hosted uptime monitoring with a clean dashboard. Track HTTP endpoints, TCP ports, DNS, and databases. Get notified via Slack, email, Telegram, and 90+ integrations.',
    category: 'dev-tools',
    resources: { cpu: 0.5, memory: '512Mi', storage: '1Gi' },
    envVars: [],
    ports: [{ port: 80, description: 'Uptime Kuma web interface' }],
    estimatedMonthlyCostUsd: { low: 2, high: 5 },
    sdl: `---
version: "2.0"
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1.23.1
    expose:
      - port: 3001
        as: 80
        to:
          - global: true
    params:
      storage:
        data:
          mount: /app/data
          readOnly: false
profiles:
  compute:
    uptime-kuma:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          - size: 128Mi
          - name: data
            size: 1Gi
            attributes:
              persistent: true
              class: beta1
  placement:
    akash:
      pricing:
        uptime-kuma:
          denom: uact
          amount: 10000
      signedBy:
        anyOf:
          - akash1365yvmc4s7awdyj3n2sav7xfx76adc6dnmlx63
deployment:
  uptime-kuma:
    akash:
      profile: uptime-kuma
      count: 1
`,
  },
];

const templateMap = new Map(TEMPLATES.map(t => [t.slug, t]));

export function getTemplate(slug: string): Template | undefined {
  return templateMap.get(slug);
}

export function listTemplates(): Omit<Template, 'sdl'>[] {
  return TEMPLATES.map(({ sdl: _, ...rest }) => rest);
}

export function mergeEnvVars(sdl: string, envVars: Record<string, string>): string {
  let result = sdl;
  for (const [key, value] of Object.entries(envVars)) {
    const escaped = value.replace(/"/g, '\\"');
    const patterns = [
      new RegExp(`(- ${key}=).*`, 'g'),
      new RegExp(`(- "${key}=).*?"`, 'g'),
    ];
    let replaced = false;
    for (const pattern of patterns) {
      if (pattern.test(result)) {
        result = result.replace(pattern, `$1${escaped}`);
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      result = result.replace(
        /(env:\n)((?:\s+- .+\n)*)/,
        `$1$2      - "${key}=${escaped}"\n`,
      );
    }
  }
  return result;
}
