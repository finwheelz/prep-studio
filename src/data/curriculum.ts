import type { TrackKey } from "@/lib/types";

/**
 * Planned module list per v2 track (docs/REBUILD-PLAN-v2.md). Content files must use these exact
 * module names so roadmaps can link to them; a module with no lessons yet shows as "being built".
 */
export const CURRICULUM: Partial<Record<TrackKey, string[]>> = {
  python: ["Core Python", "Strings and collections", "Functions, OOP and errors", "Iterators, generators and files", "NumPy", "pandas", "Plotting", "scikit-learn", "PyTorch", "Keras"],
  dsa: ["Complexity", "Arrays and hashing", "Two pointers and sliding window", "Stacks and queues", "Binary search", "Linked lists", "Trees", "Heaps", "Graphs", "Greedy and intervals", "Backtracking", "Dynamic programming", "Tries and bits"],
  maths: ["Linear algebra", "Calculus and optimisation", "Probability", "Statistics", "Information theory", "A/B testing"],
  cml: ["Data and features", "Linear models", "Trees and ensembles", "Other classifiers", "Unsupervised learning", "Evaluation metrics", "Validation and pitfalls", "Generalisation", "Time series"],
  dl: ["Neural network basics", "Training deep nets", "Regularisation and debugging", "CNNs", "Sequence models", "Attention and transformers", "Computer vision", "Generative models"],
  llm: ["Text basics", "Tokenisation and language models", "Retrieval and NLP evaluation", "LLM architecture", "Pre-training", "Post-training", "Generation and decoding"],
  aieng: ["Inference and serving", "Prompting and structured output", "RAG", "Agents and tool use", "Applied evals", "MLOps", "LLMOps"],
  sysdesign: ["Design framework", "Recommendations and ranking", "Search and ads", "Fraud and risk", "LLM apps and RAG systems", "Agents", "Platforms and experimentation"],
};

export type Step = { track: TrackKey; module: string };
const st = (track: TrackKey, ...modules: string[]): Step[] => modules.map((module) => ({ track, module }));

export const ROADMAPS: { id: string; label: string; blurb: string; steps: Step[] }[] = [
  {
    id: "ds", label: "Data Scientist", blurb: "Statistics, experiments and classical ML, with enough Python to do it live.",
    steps: [
      ...st("python", "Core Python", "Strings and collections", "NumPy", "pandas", "Plotting", "scikit-learn"),
      ...st("maths", "Probability", "Statistics", "A/B testing", "Linear algebra"),
      ...st("cml", "Data and features", "Linear models", "Trees and ensembles", "Other classifiers", "Unsupervised learning", "Evaluation metrics", "Validation and pitfalls", "Generalisation", "Time series"),
      ...st("dl", "Neural network basics", "Training deep nets"),
      ...st("sysdesign", "Design framework", "Platforms and experimentation", "Recommendations and ranking"),
    ],
  },
  {
    id: "mle", label: "ML Engineer", blurb: "Modelling depth plus coding rounds, training at scale and production ML.",
    steps: [
      ...st("python", "Core Python", "Functions, OOP and errors", "NumPy", "pandas", "PyTorch"),
      ...st("dsa", "Complexity", "Arrays and hashing", "Two pointers and sliding window", "Binary search", "Trees", "Graphs", "Dynamic programming"),
      ...st("maths", "Linear algebra", "Calculus and optimisation", "Probability", "Statistics"),
      ...st("cml", "Linear models", "Trees and ensembles", "Evaluation metrics", "Validation and pitfalls", "Generalisation"),
      ...st("dl", "Neural network basics", "Training deep nets", "Regularisation and debugging", "CNNs", "Sequence models", "Attention and transformers"),
      ...st("llm", "LLM architecture", "Pre-training", "Post-training"),
      ...st("aieng", "Inference and serving", "MLOps"),
      ...st("sysdesign", "Design framework", "Recommendations and ranking", "Search and ads", "Fraud and risk"),
    ],
  },
  {
    id: "aie", label: "AI Engineer", blurb: "Building with LLMs: prompting, RAG, agents, evals and serving.",
    steps: [
      ...st("python", "Core Python", "Functions, OOP and errors", "Iterators, generators and files"),
      ...st("cml", "Evaluation metrics", "Generalisation"),
      ...st("dl", "Neural network basics", "Attention and transformers"),
      ...st("llm", "Tokenisation and language models", "LLM architecture", "Post-training", "Generation and decoding", "Retrieval and NLP evaluation"),
      ...st("aieng", "Prompting and structured output", "RAG", "Agents and tool use", "Applied evals", "Inference and serving", "LLMOps"),
      ...st("sysdesign", "Design framework", "LLM apps and RAG systems", "Agents"),
    ],
  },
  {
    id: "da", label: "Data Analyst", blurb: "Python for data work, statistics and experiments, and reading models.",
    steps: [
      ...st("python", "Core Python", "Strings and collections", "pandas", "Plotting"),
      ...st("maths", "Probability", "Statistics", "A/B testing"),
      ...st("cml", "Data and features", "Linear models", "Evaluation metrics", "Validation and pitfalls"),
    ],
  },
];
