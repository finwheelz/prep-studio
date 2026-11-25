/** Sources for the v2 ML system design track. Every URL was opened and checked on the date given. */
const CHECKED = "2026-11-25";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });

export const SD = {
  rules: src("Zinkevich: Rules of Machine Learning: Best Practices for ML Engineering (Google)", "https://developers.google.com/machine-learning/guides/rules-of-ml"),
  debt: src("Sculley et al. (2015): Hidden Technical Debt in Machine Learning Systems, NeurIPS", "https://papers.nips.cc/paper/5656-hidden-technical-debt-in-machine-learning-systems"),
  wideDeep: src("Cheng et al. (2016): Wide & Deep Learning for Recommender Systems", "https://arxiv.org/abs/1606.07792"),
  kohavi: src("Kohavi, Tang, Xu: Trustworthy Online Controlled Experiments (Cambridge University Press)", "https://experimentguide.com/"),
  calib: src("scikit-learn user guide: probability calibration", "https://scikit-learn.org/stable/modules/calibration.html"),
  rag: src("Lewis et al. (2020): Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", "https://arxiv.org/abs/2005.11401"),
  react: src("Yao et al. (2022): ReAct: Synergizing Reasoning and Acting in Language Models", "https://arxiv.org/abs/2210.03629"),
  agents: src("Anthropic (2024): Building effective AI agents", "https://www.anthropic.com/research/building-effective-agents"),
  judge: src("Zheng et al. (2023): Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", "https://arxiv.org/abs/2306.05685"),
  paged: src("Kwon et al. (2023): Efficient Memory Management for Large Language Model Serving with PagedAttention", "https://arxiv.org/abs/2309.06180"),
  spider: src("Yu et al. (2018): Spider: a large-scale human-labeled dataset for complex, cross-domain text-to-SQL", "https://arxiv.org/abs/1809.08887"),
  layoutlm: src("Xu et al. (2019): LayoutLM: Pre-training of Text and Layout for Document Image Understanding", "https://arxiv.org/abs/1912.13318"),
  fbCtr: src("He et al. (2014): Practical Lessons from Predicting Clicks on Ads at Facebook, ADKDD", "https://research.facebook.com/publications/practical-lessons-from-predicting-clicks-on-ads-at-facebook/"),
  adTrenches: src("McMahan et al. (2013): Ad Click Prediction: a View from the Trenches, KDD", "https://research.google/pubs/ad-click-prediction-a-view-from-the-trenches/"),
  dlrm: src("Naumov et al. (2019): Deep Learning Recommendation Model for Personalization and Recommendation Systems", "https://arxiv.org/abs/1906.00091"),
  gsp: src("Edelman, Ostrovsky, Schwarz (2005): Internet Advertising and the Generalized Second Price Auction, NBER", "https://www.nber.org/papers/w11765"),
  lambdamart: src("Burges (2010): From RankNet to LambdaRank to LambdaMART: An Overview, Microsoft Research", "https://www.microsoft.com/en-us/research/publication/from-ranknet-to-lambdarank-to-lambdamart-an-overview/"),
  dpr: src("Karpukhin et al. (2020): Dense Passage Retrieval for Open-Domain Question Answering", "https://arxiv.org/abs/2004.04906"),
  radar: src("Stripe: A primer on machine learning for fraud detection (Radar technical guide)", "https://stripe.com/radar/guide"),
  michelangelo: src("Hermann and Del Balso (2017): Meet Michelangelo: Uber's Machine Learning Platform", "https://www.uber.com/blog/michelangelo-machine-learning-platform/"),
  mcp: src("Model Context Protocol specification (2025-06-18)", "https://modelcontextprotocol.io/specification/2025-06-18"),
  lostMiddle: src("Liu et al. (2023): Lost in the Middle: How Language Models Use Long Contexts", "https://arxiv.org/abs/2307.03172"),
  ragas: src("Es et al. (2023): Ragas: Automated Evaluation of Retrieval Augmented Generation", "https://arxiv.org/abs/2309.15217"),
};
