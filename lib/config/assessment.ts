/**
 * Application defaults for choosing what to practise next.
 *
 * These are OURS, and they are tunable. They are not a measurement of a
 * child against anything, and in particular they are not Ontario's
 * achievement chart: Level 3 is the provincial standard and means
 * something to a teacher, a parent and a report card. A number here means
 * only "the next thing this app will offer". Never render one of these as
 * a level, a grade or a percentage next to a child's name, and never map
 * one onto 1-4.
 *
 * The bands come from the Assessment Engine blueprint; the evidence
 * minimums come from the handoff's reference module.
 */
export interface AssessmentConfig {
  /** How far back closed sessions still count. */
  windowDays: number;
  /** Closed sessions needed before any decision but "collect more". */
  minSessions: number;
  /** Qualifying items needed within each of those sessions. */
  minItemsPerSession: number;
  /** Below this, look underneath the skill instead of repeating it. */
  prerequisiteBelow: number;
  /** At or above this, the skill is ready to be stretched. */
  transferAtOrAbove: number;
  /**
   * Require at least one fully correct item in EVERY qualifying session
   * before suggesting transfer.
   *
   * The reference module enforces this; the blueprint's threshold list
   * does not mention it. Kept at the reference's behaviour because it is
   * the safer reading for a child: a run of sessions averaging 80% with
   * one session at zero is not a skill that is ready to be stretched.
   * Set false to follow the percentage alone.
   */
  requireSuccessInEverySession: boolean;
}

export const ASSESSMENT_DEFAULTS: AssessmentConfig = {
  windowDays: 30,
  minSessions: 2,
  minItemsPerSession: 2,
  prerequisiteBelow: 0.5,
  transferAtOrAbove: 0.8,
  requireSuccessInEverySession: true,
};
