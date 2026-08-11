#!/usr/bin/env node
/**
 * lexia-design-score — scoring gate, history and project scaffolding.
 * Zero dependencies, Node >= 18.
 *
 * Subcommands:
 *   init  [--project-dir .]                       scaffold .lexia-design/ from plugin templates
 *   doctor [--project-dir .]                      check install + project memory health
 *   gate  --scores <file.json> [options]          evaluate thresholds, append history, emit verdict,
 *                                                 compute the LEXIA SCORE /100 and write DESIGN-REPORT.md
 *   report [--project-dir .]                      print the last DESIGN-REPORT.md
 *   weights                                       print the /100 weighting, caps and bands
 *   history [--project-dir .] [--format text|json] show recorded iterations
 *
 * gate options:
 *   --project-dir <dir>       default: cwd
 *   --iteration <n>           default: previous + 1
 *   --regressions <n>         visual regressions vs previous iteration (default 0)
 *   --critical-a11y <n>       unresolved critical accessibility issues (default read from scores file, else 0)
 *   --critical-usability <n>  unresolved critical usability issues (default read from scores file, else 0)
 *   --fabrications <n>        unverified fabricated content items (default from scores file, else 0)
 *   --build-broken            build/typecheck failing (caps the score)
 *   --not-rendered            no visual verification was possible (caps the score)
 *   --format text|json|report default text
 *
 * Scores file shape:
 *   { "scores": { "TASK_CLARITY": 8, ... 15 dimensions, null = not applicable / not verified },
 *     "criticalA11y": 0, "criticalUsability": 0, "notes": { "DIMENSION": "evidence..." } }
 *
 * Exit codes: 0 = converged (all gates pass), 1 = continue iterating,
 *             2 = stop without convergence (max iterations / no progress), 3 = input error.
 *
 * The gate exists to be failed honestly. It never adjusts scores.
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const DIMENSIONS = [
  "TASK_CLARITY", "INFORMATION_ARCHITECTURE", "USABILITY", "ACCESSIBILITY",
  "CONTENT_INTEGRITY", "VISUAL_HIERARCHY", "TYPOGRAPHY", "COLOR_AND_CONTRAST",
  "SPACING_AND_RHYTHM", "RESPONSIVENESS", "SYSTEM_COHERENCE", "DISTINCTIVENESS",
  "MOTION_QUALITY", "PERFORMANCE", "PRODUCTION_READINESS",
];

// LEXIA SCORE weights. Derived from the plugin's priority order: what protects
// the user's task, safety and truth weighs more than what expresses identity.
// The composite is normalized over APPLICABLE dimensions only, so an n/a
// dimension neither helps nor hurts.
const WEIGHTS = {
  TASK_CLARITY: 9,
  INFORMATION_ARCHITECTURE: 7,
  USABILITY: 10,
  ACCESSIBILITY: 10,
  CONTENT_INTEGRITY: 9,
  VISUAL_HIERARCHY: 7,
  TYPOGRAPHY: 6,
  COLOR_AND_CONTRAST: 6,
  SPACING_AND_RHYTHM: 5,
  RESPONSIVENESS: 7,
  SYSTEM_COHERENCE: 6,
  DISTINCTIVENESS: 6,
  MOTION_QUALITY: 4,
  PERFORMANCE: 6,
  PRODUCTION_READINESS: 7,
};

// Hard ceilings. An aggregate number must never let a blocker pass unnoticed:
// the cap is applied AFTER the weighted average, and the reason is printed.
const CAPS = [
  { when: (c) => c.contentFabrications > 0, cap: 49, why: "unverified fabricated content present" },
  { when: (c) => c.criticalA11y > 0, cap: 59, why: "critical accessibility issue open" },
  { when: (c) => c.criticalUsability > 0, cap: 59, why: "critical usability issue open" },
  { when: (c) => c.buildBroken, cap: 59, why: "build/typecheck failing" },
  { when: (c) => c.regressions > 0, cap: 79, why: "visual regression vs previous iteration" },
  { when: (c) => c.notVisuallyVerified, cap: 89, why: "not visually verified (no render)" },
];

const BANDS = [
  { min: 90, grade: "A", label: "Ship" },
  { min: 80, grade: "B", label: "Ship with named follow-ups" },
  { min: 70, grade: "C", label: "Usable, material gaps" },
  { min: 60, grade: "D", label: "Not ready" },
  { min: 0, grade: "F", label: "Blocked" },
];

const DEFAULT_THRESHOLDS = {
  MAX_ITERATIONS: 4,
  MIN_TOTAL_SCORE: 8.5,
  MIN_DISTINCTIVENESS_SCORE: 7.5,
  CRITICAL_ACCESSIBILITY_ISSUES: 0,
  CRITICAL_USABILITY_ISSUES: 0,
  VISUAL_REGRESSIONS: 0,
  MIN_PROGRESS_DELTA: 0.05,
};

const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(args, name, fallback = undefined) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] !== undefined ? args[i + 1] : fallback;
}

function loadThresholds(projectDir) {
  const p = join(projectDir, ".lexia-design", "project-preferences.json");
  if (!existsSync(p)) return { ...DEFAULT_THRESHOLDS };
  try {
    const prefs = JSON.parse(readFileSync(p, "utf8"));
    return { ...DEFAULT_THRESHOLDS, ...(prefs.thresholds || {}) };
  } catch {
    console.error(`warning: could not parse ${p}; using default thresholds`);
    return { ...DEFAULT_THRESHOLDS };
  }
}

/* ------------------------------ LEXIA SCORE ------------------------------- */

function computeLexiaScore(scores, ctx) {
  const applicable = DIMENSIONS.filter((d) => scores[d] !== null);
  const weightSum = applicable.reduce((s, d) => s + WEIGHTS[d], 0);
  const raw = weightSum
    ? applicable.reduce((s, d) => s + scores[d] * WEIGHTS[d], 0) / weightSum * 10
    : 0;
  let score = Math.round(raw * 10) / 10;
  const capsApplied = [];
  for (const c of CAPS) {
    if (c.when(ctx) && score > c.cap) { score = c.cap; capsApplied.push(c.why); }
    else if (c.when(ctx)) capsApplied.push(`${c.why} (already below cap ${c.cap})`);
  }
  const band = BANDS.find((b) => score >= b.min);
  return {
    score: Math.round(score * 10) / 10,
    raw: Math.round(raw * 10) / 10,
    capped: capsApplied.length > 0 && Math.round(raw * 10) / 10 > score,
    capsApplied,
    grade: band.grade,
    label: band.label,
    applicable: applicable.length,
    weightSum,
  };
}

function bar(value10) {
  if (value10 === null) return "n/a";
  const filled = Math.round(value10);
  return "#".repeat(filled) + "-".repeat(10 - filled);
}

function dimensionRows(scores, notes, prevScores) {
  return DIMENSIONS.map((d) => {
    const v = scores[d];
    const w = WEIGHTS[d];
    const contribution = v === null ? null : Math.round((v * w) / 10 * 10) / 10;
    const prev = prevScores && typeof prevScores[d] === "number" ? prevScores[d] : null;
    const delta = v !== null && prev !== null ? Math.round((v - prev) * 10) / 10 : null;
    return {
      dimension: d,
      score: v,
      weight: w,
      points: contribution,
      delta,
      evidence: (notes && notes[d]) || "",
    };
  });
}

function renderReport(payload) {
  const { lexia, rows, meta, gates, verdict, blockers, coverage, capsApplied } = payload;
  const L = [];
  L.push(`# Design report — ${meta.project || "project"}`);
  L.push("");
  if (blockers.length) {
    L.push(`> BLOCKING: ${blockers.length} issue(s) must be resolved before this ships.`);
    for (const b of blockers.slice(0, 5)) L.push(`> - ${b}`);
    L.push("");
  } else {
    L.push("> No blocking issues open.");
    L.push("");
  }
  L.push(`## LEXIA SCORE: ${lexia.score} / 100 — ${lexia.grade} (${lexia.label})`);
  L.push("");
  L.push(`| | |`);
  L.push(`|---|---|`);
  L.push(`| Iteration | ${meta.iteration} |`);
  L.push(`| Coverage | ${coverage || "UNSPECIFIED — scores are not comparable across audits"} |`);
  L.push(`| Dimensions scored | ${lexia.applicable} of ${DIMENSIONS.length} |`);
  L.push(`| Weighted raw | ${lexia.raw} / 100 |`);
  L.push(`| Delta vs previous | ${meta.delta === null || meta.delta === undefined ? "first audit" : (meta.delta >= 0 ? "+" : "") + meta.delta} |`);
  L.push(`| Verdict | ${verdict} |`);
  L.push("");
  if (capsApplied.length) {
    L.push(`Score capped: ${capsApplied.join("; ")}. The raw weighted value was ${lexia.raw}.`);
    L.push("");
  }
  L.push("## Dimensions");
  L.push("");
  L.push("| # | Dimension | Score | Weight | Points | Δ | Evidence |");
  L.push("|---|---|---|---|---|---|---|");
  rows.forEach((r, i) => {
    const s = r.score === null ? "n/a" : `${r.score}/10`;
    const p = r.points === null ? "—" : `${r.points}`;
    const d = r.delta === null ? "—" : (r.delta > 0 ? `+${r.delta}` : `${r.delta}`);
    L.push(`| ${i + 1} | ${r.dimension} | ${s} | ${r.weight} | ${p} | ${d} | ${r.evidence.replace(/\|/g, "\\|").slice(0, 120)} |`);
  });
  L.push(`| | **TOTAL (applicable)** | | ${lexia.weightSum} | **${lexia.raw}** | | |`);
  L.push("");
  L.push("## Gates");
  L.push("");
  L.push("| Gate | Value | Threshold | Result |");
  L.push("|---|---|---|---|");
  for (const [name, g] of Object.entries(gates)) {
    const bound = "min" in g ? `>= ${g.min}` : `<= ${g.max}`;
    L.push(`| ${name} | ${g.note ?? g.value} | ${bound} | ${g.pass ? "PASS" : "FAIL"} |`);
  }
  L.push("");
  L.push("Scores are judgment anchored to evidence, not measurement. Dimensions");
  L.push("marked n/a are excluded and the total renormalized. A deeper audit");
  L.push("scoring lower than a shallower one is not a regression: compare only");
  L.push("across equal coverage.");
  return L.join("\n");
}

function readHistory(projectDir) {
  const p = join(projectDir, ".lexia-design", "evaluation-history.jsonl");
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

/* ---------------------------------- init ---------------------------------- */

function init(args) {
  const projectDir = resolve(arg(args, "--project-dir", "."));
  const dir = join(projectDir, ".lexia-design");
  mkdirSync(dir, { recursive: true });
  const templates = join(PLUGIN_ROOT, "templates");
  const pairs = [
    ["DESIGN-BRIEF.md", "DESIGN-BRIEF.md"],
    ["DESIGN-SYSTEM.md", "DESIGN-SYSTEM.md"],
    ["DESIGN-AUDIT.md", "DESIGN-AUDIT.md"],
    ["DESIGN-REPORT.md", "DESIGN-REPORT.md"],
    ["project-preferences.json", "project-preferences.json"],
  ];
  const created = [];
  for (const [src, dst] of pairs) {
    const target = join(dir, dst);
    if (existsSync(target)) continue; // never overwrite
    copyFileSync(join(templates, src), target);
    created.push(dst);
  }
  for (const f of ["decisions.jsonl", "rejected-patterns.jsonl", "evaluation-history.jsonl"]) {
    const target = join(dir, f);
    if (!existsSync(target)) { writeFileSync(target, ""); created.push(f); }
  }
  const traj = join(dir, "TRAJECTORY.md");
  if (!existsSync(traj)) {
    writeFileSync(traj, "# Trajectory\n\nOne note per closed cycle: regressions, reapplied fixes, false\npositives, what to do first next time, and the cleaner prompt for the\nnext attempt. Newest entry last; read the last entry at session start.\n");
    created.push("TRAJECTORY.md");
  }
  console.log(created.length ? `Initialized .lexia-design/ (${created.join(", ")})` : ".lexia-design/ already complete; nothing overwritten.");
}

/* ---------------------------------- gate ---------------------------------- */

function gate(args) {
  const projectDir = resolve(arg(args, "--project-dir", "."));
  const scoresPath = arg(args, "--scores");
  const format = arg(args, "--format", "text");
  if (!scoresPath || !existsSync(scoresPath)) {
    console.error("gate: --scores <file.json> is required and must exist");
    process.exit(3);
  }
  let input;
  try { input = JSON.parse(readFileSync(scoresPath, "utf8")); } catch (e) {
    console.error(`gate: cannot parse scores file: ${e.message}`);
    process.exit(3);
  }
  const scores = input.scores || {};
  const missing = DIMENSIONS.filter((d) => !(d in scores));
  if (missing.length) {
    console.error(`gate: missing dimensions: ${missing.join(", ")} (use null for not-applicable)`);
    process.exit(3);
  }
  for (const d of DIMENSIONS) {
    const v = scores[d];
    if (v !== null && (typeof v !== "number" || v < 0 || v > 10)) {
      console.error(`gate: ${d} must be a number 0-10 or null, got ${JSON.stringify(v)}`);
      process.exit(3);
    }
  }

  const t = loadThresholds(projectDir);
  const coverage = typeof input.coverage === "string" ? input.coverage : undefined;
  const history = readHistory(projectDir);
  const prev = history.length ? history[history.length - 1] : null;
  const coverageChanged = prev ? (prev.coverage ?? null) !== (coverage ?? null) : false;
  const iteration = parseInt(arg(args, "--iteration", prev ? String(prev.iteration + 1) : "1"), 10);
  const regressions = parseInt(arg(args, "--regressions", "0"), 10);
  const criticalA11y = parseInt(arg(args, "--critical-a11y", String(input.criticalA11y ?? 0)), 10);
  const criticalUsability = parseInt(arg(args, "--critical-usability", String(input.criticalUsability ?? 0)), 10);

  const contentFabrications = parseInt(arg(args, "--fabrications", String(input.contentFabrications ?? 0)), 10);
  const buildBroken = args.includes("--build-broken") || input.buildBroken === true;
  const notVisuallyVerified = args.includes("--not-rendered") || input.notVisuallyVerified === true;

  const applicable = DIMENSIONS.filter((d) => scores[d] !== null);
  const total = applicable.length
    ? Math.round((applicable.reduce((s, d) => s + scores[d], 0) / applicable.length) * 100) / 100
    : 0;
  const lexia = computeLexiaScore(scores, {
    criticalA11y, criticalUsability, regressions, contentFabrications, buildBroken, notVisuallyVerified,
  });

  const gates = {
    total: { value: total, min: t.MIN_TOTAL_SCORE, pass: total >= t.MIN_TOTAL_SCORE },
    distinctiveness: {
      value: scores.DISTINCTIVENESS,
      min: t.MIN_DISTINCTIVENESS_SCORE,
      pass: scores.DISTINCTIVENESS === null ? true : scores.DISTINCTIVENESS >= t.MIN_DISTINCTIVENESS_SCORE,
      note: scores.DISTINCTIVENESS === null ? "n/a" : undefined,
    },
    criticalA11y: { value: criticalA11y, max: t.CRITICAL_ACCESSIBILITY_ISSUES, pass: criticalA11y <= t.CRITICAL_ACCESSIBILITY_ISSUES },
    criticalUsability: { value: criticalUsability, max: t.CRITICAL_USABILITY_ISSUES, pass: criticalUsability <= t.CRITICAL_USABILITY_ISSUES },
    regressions: { value: regressions, max: t.VISUAL_REGRESSIONS, pass: regressions <= t.VISUAL_REGRESSIONS },
  };
  const allPass = Object.values(gates).every((g) => g.pass);

  const delta = prev ? Math.round((total - prev.total) * 100) / 100 : null;
  const improved = new Set(), regressed = new Set();
  if (prev?.scores) {
    for (const d of applicable) {
      if (typeof prev.scores[d] !== "number") continue;
      if (scores[d] > prev.scores[d]) improved.add(d);
      if (scores[d] < prev.scores[d]) regressed.add(d);
    }
  }

  let verdict;
  if (allPass) verdict = "stop-converged";
  else if (iteration >= t.MAX_ITERATIONS) verdict = "stop-max-iterations";
  else if (prev && delta !== null && !coverageChanged && delta <= t.MIN_PROGRESS_DELTA && regressed.size === 0 && improved.size === 0) verdict = "stop-no-progress";
  else verdict = "continue";

  const entry = {
    ts: new Date().toISOString(),
    iteration, scores, total, lexiaScore: lexia.score, grade: lexia.grade, delta, coverage,
    criticalA11y, criticalUsability, regressions, contentFabrications,
    buildBroken: buildBroken || undefined, notVisuallyVerified: notVisuallyVerified || undefined,
    gates: Object.fromEntries(Object.entries(gates).map(([k, g]) => [k, g.pass])),
    verdict,
    improved: [...improved], regressed: [...regressed],
    notes: input.notes || undefined,
  };
  const dir = join(projectDir, ".lexia-design");
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, "evaluation-history.jsonl"), JSON.stringify(entry) + "\n");

  // Always emit the report table: the deliverable is the report, not the exit code.
  const blockers = [];
  if (contentFabrications) blockers.push(`${contentFabrications} unverified fabricated content item(s)`);
  if (criticalA11y) blockers.push(`${criticalA11y} critical accessibility issue(s)`);
  if (criticalUsability) blockers.push(`${criticalUsability} critical usability issue(s)`);
  if (buildBroken) blockers.push("build or typecheck failing");
  if (regressions) blockers.push(`${regressions} visual regression(s) vs the previous iteration`);
  const reportMd = renderReport({
    lexia,
    rows: dimensionRows(scores, input.notes, prev?.scores),
    meta: { project: input.project, iteration, delta },
    gates, verdict, blockers, coverage, capsApplied: lexia.capsApplied,
  });
  const reportPath = join(dir, "DESIGN-REPORT.md");
  writeFileSync(reportPath, reportMd + "\n");

  if (format === "json") {
    console.log(JSON.stringify({ entry, lexia, thresholds: t, reportPath }, null, 2));
  } else if (format === "report") {
    console.log(reportMd);
  } else {
    console.log(`LEXIA SCORE ${lexia.score}/100 (${lexia.grade} — ${lexia.label})${lexia.capped ? ` [capped from ${lexia.raw}]` : ""}`);
    console.log(`Iteration ${iteration} — TOTAL ${total} (${applicable.length}/15 dims applicable${delta !== null ? `, delta ${delta >= 0 ? "+" : ""}${delta}` : ""})`);
    for (const [name, g] of Object.entries(gates)) {
      const bound = "min" in g ? `>= ${g.min}` : `<= ${g.max}`;
      console.log(`  ${g.pass ? "PASS" : "FAIL"}  ${name} ${g.note ?? g.value} (${bound})`);
    }
    if (coverageChanged) console.log(`  NOTE: audit coverage changed ("${prev.coverage ?? "unspecified"}" -> "${coverage ?? "unspecified"}"). Totals are not directly comparable; a deeper audit scoring lower is not a regression.`);
    if (regressed.size) console.log(`  regressed dimensions: ${[...regressed].join(", ")} — revert what caused this or justify${coverageChanged ? " (coverage changed: check the finding is on previously-audited surface)" : ""}`);
    if (improved.size) console.log(`  improved dimensions: ${[...improved].join(", ")}`);
    console.log(`VERDICT: ${verdict}`);
    if (verdict === "stop-max-iterations") console.log("Report remaining gaps honestly; do not keep iterating.");
    if (verdict === "stop-no-progress") console.log("No measurable improvement over the previous iteration; stop and report.");
    console.log(`Report written to ${reportPath} (use --format report to print the table).`);
  }
  process.exit(verdict === "stop-converged" ? 0 : verdict === "continue" ? 1 : 2);
}

/* --------------------------------- history -------------------------------- */

function historyCmd(args) {
  const projectDir = resolve(arg(args, "--project-dir", "."));
  const format = arg(args, "--format", "text");
  const entries = readHistory(projectDir);
  if (format === "json") { console.log(JSON.stringify(entries, null, 2)); return; }
  if (!entries.length) { console.log("No evaluation history."); return; }
  console.log("iter | total | delta | verdict | a11y | usab | regr | ts");
  for (const e of entries) {
    console.log(`${String(e.iteration).padStart(4)} | ${String(e.total).padStart(5)} | ${e.delta === null || e.delta === undefined ? "    -" : String(e.delta).padStart(5)} | ${e.verdict.padEnd(19)} | ${e.criticalA11y} | ${e.criticalUsability} | ${e.regressions} | ${e.ts}`);
  }
}

/* ---------------------------------- main ---------------------------------- */

function reportCmd(args) {
  const projectDir = resolve(arg(args, "--project-dir", "."));
  const p = join(projectDir, ".lexia-design", "DESIGN-REPORT.md");
  if (!existsSync(p)) {
    console.error("report: no DESIGN-REPORT.md yet. Run `gate --scores <file>` first.");
    process.exit(3);
  }
  console.log(readFileSync(p, "utf8"));
}

function weightsCmd() {
  console.log("dimension | weight | share of 100");
  const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  for (const [d, w] of Object.entries(WEIGHTS)) {
    console.log(`${d} | ${w} | ${(w / sum * 100).toFixed(1)}%`);
  }
  console.log(`\ntotal weight ${sum}; the composite renormalizes over applicable dimensions only.`);
  console.log("\ncaps (applied after the weighted average):");
  for (const c of CAPS) console.log(`  <= ${c.cap} when ${c.why}`);
  console.log("\nbands:");
  for (const b of BANDS) console.log(`  >= ${b.min} ${b.grade} (${b.label})`);
}

function doctor(args) {
  const projectDir = resolve(arg(args, "--project-dir", "."));
  let hard = 0;
  const okLine = (m) => console.log(`  ok    ${m}`);
  const warn = (m) => console.log(`  warn  ${m}`);
  const fail = (m) => { hard++; console.log(`  FAIL  ${m}`); };

  console.log("install:");
  const major = parseInt(process.versions.node.split(".")[0], 10);
  major >= 18 ? okLine(`node ${process.versions.node}`) : fail(`node ${process.versions.node} (< 18)`);
  for (const t of ["DESIGN-BRIEF.md", "DESIGN-SYSTEM.md", "DESIGN-AUDIT.md", "DESIGN-REPORT.md", "project-preferences.json"]) {
    existsSync(join(PLUGIN_ROOT, "templates", t)) ? okLine(`template ${t}`) : fail(`template ${t} missing (broken install)`);
  }
  existsSync(join(PLUGIN_ROOT, "scripts", "lexia-design-audit.mjs")) ? okLine("detector script present") : fail("detector script missing");
  if (process.env.LEXIA_DESIGN_HOOKS === "0") warn("hooks disabled for this session (LEXIA_DESIGN_HOOKS=0)");

  console.log("project:");
  const dir = join(projectDir, ".lexia-design");
  if (!existsSync(dir)) {
    warn(".lexia-design/ not initialized here (run: lexia-design-score.mjs init)");
  } else {
    const prefs = join(dir, "project-preferences.json");
    if (existsSync(prefs)) {
      try { JSON.parse(readFileSync(prefs, "utf8")); okLine("project-preferences.json parses"); }
      catch (e) { fail(`project-preferences.json invalid JSON: ${e.message}`); }
    } else warn("project-preferences.json missing");
    const hist = join(dir, "evaluation-history.jsonl");
    if (existsSync(hist)) {
      const lines = readFileSync(hist, "utf8").split("\n").filter(Boolean);
      let badLines = 0;
      for (const l of lines) { try { JSON.parse(l); } catch { badLines++; } }
      badLines === 0 ? okLine(`evaluation-history.jsonl: ${lines.length} entr${lines.length === 1 ? "y" : "ies"}, all parse`)
        : fail(`evaluation-history.jsonl: ${badLines} unparseable line(s)`);
    } else warn("evaluation-history.jsonl missing");
    existsSync(join(dir, "TRAJECTORY.md")) ? okLine("TRAJECTORY.md present")
      : warn("TRAJECTORY.md missing (older init; re-run init to scaffold, nothing is overwritten)");
  }
  console.log(hard ? `\n${hard} hard problem(s).` : "\nhealthy.");
  process.exit(hard ? 1 : 0);
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === "init") init(rest);
  else if (cmd === "doctor") doctor(rest);
  else if (cmd === "gate") gate(rest);
  else if (cmd === "history") historyCmd(rest);
  else if (cmd === "report") reportCmd(rest);
  else if (cmd === "weights") weightsCmd();
  else {
    console.error("Usage: lexia-design-score.mjs <init|doctor|gate|history|report|weights> [options]  (see file header)");
    process.exit(3);
  }
} catch (err) {
  console.error(`lexia-design-score internal error: ${err?.message || err}`);
  process.exit(3);
}
