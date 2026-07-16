import questionsData from '../data/questions.json';
import personalityData from '../data/personalityTypes.json';

// ─── 类型定义 ──────────────────────────────────────────────

/** 用户答案：questionId → 选择的 value */
export type UserAnswers = Record<string, number>;

/** 维度等级 */
export type Level = 'L' | 'M' | 'H';

/** 单个维度的评分结果 */
export interface DimensionScore {
  dimension: string;
  name: string;
  model: string;
  score: number;
  level: Level;
  explanation: string;
}

/** 单个人格的匹配结果 */
export interface TypeMatch {
  code: string;
  name: string;
  matchPercent: number;
}

/** 最终计分结果 */
export interface SBTIResult {
  /** 15个维度的评分详情 */
  dimensions: DimensionScore[];
  /** 用户15维向量（H/M/L） */
  userPattern: string;
  /** 最匹配的人格 */
  bestMatch: {
    code: string;
    name: string;
    intro: string;
    description: string;
    matchPercent: number;
  };
  /** 所有25个常规人格的匹配度排行 */
  allMatches: TypeMatch[];
  /** 是否为特殊人格（DRUNK / HHHH） */
  isSpecial: boolean;
  /** 特殊人格触发原因 */
  specialReason?: string;
}

// ─── 常量 ─────────────────────────────────────────────────

const DIMENSION_ORDER = personalityData.dimensionOrder as string[];
const LEVEL_MAP: Record<Level, number> = { L: 1, M: 2, H: 3 };
const MAX_DISTANCE = 15 * 2; // 15维 × 最大差值2 = 30
const FALLBACK_THRESHOLD = personalityData.matchingRules.fallbackThreshold;

// ─── 核心函数 ─────────────────────────────────────────────

/**
 * 将维度原始分（2-6）转为等级
 * ≤3 → L, =4 → M, ≥5 → H
 */
function scoreToLevel(score: number): Level {
  if (score <= 3) return 'L';
  if (score === 4) return 'M';
  return 'H';
}

/**
 * 解析人格的模式串为数值数组
 * "HHH-HMH-MHH-HHH-MHM" → [3,3,3, 2,3,2, 2,3,3, 3,3,3, 2,3,2]
 */
function parsePattern(pattern: string): number[] {
  return pattern
    .replace(/-/g, '')
    .split('')
    .map((ch) => LEVEL_MAP[ch as Level] || 0);
}

/**
 * 计算两个向量的 Manhattan 距离
 */
function manhattanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

/**
 * 距离 → 匹配百分比
 * 距离0 = 100%，距离30 = 0%
 */
function distanceToPercent(distance: number): number {
  return Math.round((1 - distance / MAX_DISTANCE) * 10000) / 100;
}

/**
 * 检查是否触发 DRUNK 隐藏人格
 * drink_gate_q1 选了"饮酒"(3) 且 drink_gate_q2 选了"保温杯灌白酒"(2)
 */
function checkDrunkTrigger(answers: UserAnswers): boolean {
  return answers['drink_gate_q1'] === 3 && answers['drink_gate_q2'] === 2;
}

// ─── 主函数 ───────────────────────────────────────────────

/**
 * SBTI 人格测试计分函数
 *
 * @param answers 用户答案对象，key 为题目 id，value 为选择的选项 value
 *                例：{ q1: 2, q2: 3, ..., q30: 1, drink_gate_q1: 3, drink_gate_q2: 2 }
 *                常规题 30 道（q1-q30）必选
 *                drink_gate_q1 必选，drink_gate_q2 仅在 drink_gate_q1=3 时需要
 * @returns SBTIResult 完整计分结果
 */
export function calculateSBTI(answers: UserAnswers): SBTIResult {
  // ── Step 1: 计算15个维度的分数和等级 ──

  const dimensionScores: DimensionScore[] = [];
  const userVector: number[] = [];

  for (const dim of DIMENSION_ORDER) {
    const dimMeta = (questionsData.dimensions as Record<string, { name: string; model: string }>)[dim];
    const dimQuestions = questionsData.questions.filter((q) => q.dimension === dim);

    // 求和该维度下2道题的得分
    const score = dimQuestions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
    const level = scoreToLevel(score);
    userVector.push(LEVEL_MAP[level]);

    // 获取该维度的等级解释
    const explanations = (personalityData.dimensionExplanations as Record<string, Record<Level, string>>)[dim];
    const explanation = (explanations && explanations[level]) || '';

    dimensionScores.push({
      dimension: dim,
      name: dimMeta.name,
      model: dimMeta.model,
      score,
      level,
      explanation,
    });
  }

  // 生成用户模式串，如 "HHM-HMH-MMH-HHH-MHM"
  const userPattern = [0, 3, 6, 9, 12]
    .map((start) =>
      userVector
        .slice(start, start + 3)
        .map((v) => {
          const entry = Object.entries(LEVEL_MAP).find(([, n]) => n === v);
          return entry ? entry[0] : '?';
        })
        .join(''),
    )
    .join('-');

  // ── Step 2: 与所有常规人格计算 Manhattan 距离 ──

  const normalTypes = personalityData.types.filter(
    (t) => t.pattern !== null && !t.isFallback && !t.isSpecial,
  );

  const allMatches: TypeMatch[] = normalTypes.map((type) => {
    const typeVector = parsePattern(type.pattern!);
    const distance = manhattanDistance(userVector, typeVector);
    return {
      code: type.code,
      name: type.name,
      matchPercent: distanceToPercent(distance),
    };
  });

  // 按匹配度降序排列
  allMatches.sort((a, b) => b.matchPercent - a.matchPercent);

  // ── Step 3: 判定最终人格 ──

  // 3a. 检查 DRUNK 隐藏人格
  if (checkDrunkTrigger(answers)) {
    const drunkType = personalityData.types.find((t) => t.code === 'DRUNK')!;
    return {
      dimensions: dimensionScores,
      userPattern,
      bestMatch: {
        code: drunkType.code,
        name: drunkType.name,
        intro: drunkType.intro,
        description: drunkType.description,
        matchPercent: 100,
      },
      allMatches,
      isSpecial: true,
      specialReason: '饮酒门控触发：选择了"饮酒"且"保温杯灌白酒"',
    };
  }

  // 3b. 检查最高匹配率是否低于兜底阈值
  const topMatch = allMatches[0];
  if (topMatch.matchPercent / 100 < FALLBACK_THRESHOLD) {
    const fallbackType = personalityData.types.find((t) => t.isFallback)!;
    return {
      dimensions: dimensionScores,
      userPattern,
      bestMatch: {
        code: fallbackType.code,
        name: fallbackType.name,
        intro: fallbackType.intro,
        description: fallbackType.description,
        matchPercent: topMatch.matchPercent,
      },
      allMatches,
      isSpecial: true,
      specialReason: `最高匹配率 ${topMatch.matchPercent}% 低于阈值 ${FALLBACK_THRESHOLD * 100}%，触发兜底人格`,
    };
  }

  // 3c. 正常返回最佳匹配
  const bestType = personalityData.types.find((t) => t.code === topMatch.code)!;
  return {
    dimensions: dimensionScores,
    userPattern,
    bestMatch: {
      code: bestType.code,
      name: bestType.name,
      intro: bestType.intro,
      description: bestType.description,
      matchPercent: topMatch.matchPercent,
    },
    allMatches,
    isSpecial: false,
  };
}
