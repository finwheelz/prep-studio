import type { InterviewQ, Lesson, QuizItem, TrackKey } from "@/lib/types";
import { Card_, Item, T } from "./build";

/** Shared helpers and sources for v2 lesson files. */
export const CHECKED = "2026-11-25";
export const SRC = "Practice: original; answer recomputed in Python (Nov 2026)";

export const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });

const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
export const SOURCES = {
  islr: src("James, Witten, Hastie, Tibshirani: An Introduction to Statistical Learning", "https://www.statlearning.com/"),
  sklPre: src("scikit-learn user guide: preprocessing data", "https://scikit-learn.org/stable/modules/preprocessing.html"),
  sklLin: src("scikit-learn user guide: linear models", "https://scikit-learn.org/stable/modules/linear_model.html"),
  sklTree: src("scikit-learn user guide: decision trees", "https://scikit-learn.org/stable/modules/tree.html"),
  sklEns: src("scikit-learn user guide: ensembles (gradient boosting, random forests, bagging, stacking)", "https://scikit-learn.org/stable/modules/ensemble.html"),
  sklNN: src("scikit-learn user guide: nearest neighbours", "https://scikit-learn.org/stable/modules/neighbors.html"),
  sklNB: src("scikit-learn user guide: naive Bayes", "https://scikit-learn.org/stable/modules/naive_bayes.html"),
  sklSVM: src("scikit-learn user guide: support vector machines", "https://scikit-learn.org/stable/modules/svm.html"),
  sklClu: src("scikit-learn user guide: clustering", "https://scikit-learn.org/stable/modules/clustering.html"),
  sklDec: src("scikit-learn user guide: matrix factorisation (PCA and relatives)", "https://scikit-learn.org/stable/modules/decomposition.html"),
  sklEval: src("scikit-learn user guide: metrics and scoring", "https://scikit-learn.org/stable/modules/model_evaluation.html"),
  sklCV: src("scikit-learn user guide: cross-validation", "https://scikit-learn.org/stable/modules/cross_validation.html"),
  sklLC: src("scikit-learn user guide: validation curves and learning curves", "https://scikit-learn.org/stable/modules/learning_curve.html"),
  xgb: src("Chen and Guestrin (2016): XGBoost: A Scalable Tree Boosting System", "https://arxiv.org/abs/1603.02754"),
  sqBV: src("Video: Machine Learning Fundamentals: Bias and Variance (StatQuest)", "https://www.youtube.com/watch?v=EuBBz3bI-aA"),
  belkin: src("Belkin, Hsu, Ma, Mandal (2019): Reconciling modern machine learning practice and the bias-variance trade-off, PNAS", "https://arxiv.org/abs/1812.11118"),
};

/** Declare a lesson; following Q()/Card() calls attach to it. */
export function lessonWriter(track: TrackKey) {
  let current = "";
  return {
    L(id: string, module: string, title: string, summary: string, lesson: Lesson, interview?: InterviewQ[]) {
      T(id, track, module, title, summary, "", { lesson, ...(interview ? { interview } : {}) });
      current = id;
    },
    /** Quiz item with a Python check that assigns `answer`. */
    Q(o: Omit<QuizItem, "topic" | "fixedId" | "check" | "src"> & { secs: number; py: string; packages?: string[]; topic?: string }) {
      const { py, packages, ...rest } = o;
      Item({ ...rest, topic: o.topic ?? current, src: SRC, check: { py, ...(packages ? { packages } : {}) } });
    },
    C(id: string, front: string, back: string) {
      Card_(id, front, back, current);
    },
  };
}
