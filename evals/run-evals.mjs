#!/usr/bin/env node
/**
 * run-evals — evaluation harness for lexia-design. Zero dependencies, Node >= 18.
 *
 * Modes:
 *   node evals/run-evals.mjs               --smoke (default): fully offline, no API cost.
 *   node evals/run-evals.mjs --as-shipped  run --smoke against git archive HEAD (what CI sees).
 *     1. Validates every evals/cases/*.json against the case schema.
 *     2. Verifies every case has a grading rubric in evals/expected/<id>.md.
 *     3. Cross-checks forbidden_detector_rules against the real detector rule list.
 *     4. Runs the detector against evals/fixtures/* and asserts manifest expectations
 *        (this is a real self-test of scripts/lexia-design-audit.mjs).
 *   node evals/run-evals.mjs --live        Prints the headless command per case.
 *   node evals/run-evals.mjs --live --execute   Actually runs each case with the
 *        claude CLI in a temp workspace (REAL API COST; requires claude on PATH and
 *        LEXIA_EVALS_LIVE=1). Outputs land in evals/results/<id>/ for grading
 *        against evals/expected/<id>.md.
 *
 * Exit codes: 0 = all checks passed, 1 = failures, 2 = internal error.
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import process from "node:process";

const EVALS_DIR = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(EVALS_DIR, "..");
const AUDIT = join(PLUGIN_ROOT, "scripts", "lexia-design-audit.mjs");

const CASE_REQUIRED = ["id", "title", "prompt", "expected"];
const EXPECTED_REQUIRED = ["activate"];

let failures = 0;
const ok = (msg) => console.log(`  PASS  ${msg}`);
const bad = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };

function loadCases() {
  const dir = join(EVALS_DIR, "cases");
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => {
    try {
      return { file: f, data: JSON.parse(readFileSync(join(dir, f), "utf8")) };
    } catch (e) {
      return { file: f, error: e.message };
    }
  });
}

function detectorRuleIds() {
  const out = execFileSync(process.execPath, [AUDIT, "--list-rules"], { encoding: "utf8" });
  const ids = new Set();
  for (const line of out.split("\n")) {
    const id = line.split("|")[0]?.trim();
    if (id && /^[a-z0-9-]+\/[a-z0-9-]+$/.test(id)) ids.add(id);
  }
  ids.add("project/no-reduced-motion-anywhere");
  ids.add("system/off-token-colors");
  ids.add("system/dark-variant-desync");
  ids.add("system/near-duplicate-tokens");
  ids.add("system/accent-ink-indistinct");
  ids.add("system/native-control-in-app-layer");
  ids.add("system/hand-rolled-table");
  ids.add("system/orphan-primitive");
  ids.add("system/duplicate-primitive");
  ids.add("system/design-gate-not-wired");
  ids.add("i18n/key-leaf-object-collision");
  ids.add("i18n/locale-coverage-gap");
  return ids;
}


const SCORE = join(PLUGIN_ROOT, "scripts", "lexia-design-score.mjs");
const GATE_DIMS = [
  "TASK_CLARITY", "INFORMATION_ARCHITECTURE", "USABILITY", "ACCESSIBILITY",
  "CONTENT_INTEGRITY", "VISUAL_HIERARCHY", "TYPOGRAPHY", "COLOR_AND_CONTRAST",
  "SPACING_AND_RHYTHM", "RESPONSIVENESS", "SYSTEM_COHERENCE", "DISTINCTIVENESS",
  "MOTION_QUALITY", "PERFORMANCE", "PRODUCTION_READINESS",
];


function smokeCoverage() {
  console.log("\n== Rule coverage (every rule proven by a fixture) ==");
  const all = detectorRuleIds();
  const manifest = JSON.parse(readFileSync(join(EVALS_DIR, "fixtures", "manifest.json"), "utf8"));
  const covered = new Set(manifest.fixtures.flatMap((f) => f.expectRules || []));
  const uncovered = [...all].filter((id) => !covered.has(id));
  if (uncovered.length) bad(`rules with no fixture asserting they fire: ${uncovered.join(", ")}`);
  else ok(`${all.size} rules, all covered by fixture expectations`);
}

function smokeGateMath() {
  console.log("\n== Score gate arithmetic (black-box, subprocess) ==");
  let n = 0;
  const runGate = (mutate, extra) => {
    // fresh project dir per case: history must not leak between cases
    const tmp = mkdtempSync(join(tmpdir(), "lexia-gate-"));
    const scores = Object.fromEntries(GATE_DIMS.map((d) => [d, 9]));
    mutate(scores);
    const sf = join(tmp, "scores.json");
    writeFileSync(sf, JSON.stringify({ scores }));
    const res = spawnSync(process.execPath,
      [SCORE, "gate", "--scores", sf, "--project-dir", tmp, "--format", "json", ...extra],
      { encoding: "utf8" });
    try { const p = JSON.parse(res.stdout); return p.entry || p; } catch { return null; }
  };
  const check = (name, entry, score, grade) => {
    n++;
    if (!entry) { bad(`${name}: gate produced no parseable JSON`); return; }
    if (entry.lexiaScore === score && entry.grade === grade) ok(`${name}: ${entry.lexiaScore} ${entry.grade}`);
    else bad(`${name}: expected ${score} ${grade}, got ${entry.lexiaScore} ${entry.grade}`);
  };
  check("all 9s, no caps", runGate(() => {}, []), 90, "A");
  check("motion n/a renormalizes, not penalizes", runGate((sc) => { sc.MOTION_QUALITY = null; }, []), 90, "A");
  check("weighted mean (usability 6, rest 9)", runGate((sc) => { sc.USABILITY = 6; }, []), 87.1, "B");
  check("fabrication caps at 49", runGate(() => {}, ["--fabrications", "1"]), 49, "F");
  check("critical a11y caps at 59", runGate(() => {}, ["--critical-a11y", "1"]), 59, "F");
  check("regression caps at 79", runGate(() => {}, ["--regressions", "1"]), 79, "C");
  check("not-rendered caps at 89", runGate(() => {}, ["--not-rendered"]), 89, "B");
  console.log(`  ${n} arithmetic cases`);
}


function asShippedMode() {
  // Runs the smoke suite against what git would actually SHIP (git archive
  // HEAD), not the working tree. A fixture that exists locally but is
  // ignored or untracked passes here and fails in CI: that happened once,
  // an ignored .lexia-design/ inside a fixture, and cost a red build.
  const inRepo = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: PLUGIN_ROOT, encoding: "utf8" });
  if (inRepo.status !== 0) {
    console.log("--as-shipped needs a git checkout of the plugin. Nothing was verified.");
    process.exit(1);
  }
  const tmp = mkdtempSync(join(tmpdir(), "lexia-shipped-"));
  const exported = spawnSync("sh", ["-c", "git archive HEAD | tar -x -C " + JSON.stringify(tmp)], { cwd: PLUGIN_ROOT, encoding: "utf8" });
  if (exported.status !== 0) {
    console.log("--as-shipped: could not export HEAD (" + (exported.stderr || "").trim() + "). Nothing was verified.");
    process.exit(1);
  }
  console.log("== Smoke suite against HEAD as shipped (" + tmp + ") ==");
  const res = spawnSync(process.execPath, [join(tmp, "evals", "run-evals.mjs"), "--smoke"], { encoding: "utf8" });
  process.stdout.write(res.stdout || "");
  process.stderr.write(res.stderr || "");
  if (res.status !== 0) {
    console.log("\nThe working tree passes but HEAD does not: something needed is untracked or ignored.");
    console.log("Check with: git status --porcelain --ignored | grep evals/");
  }
  process.exit(res.status === null ? 1 : res.status);
}

function smokeCases() {
  console.log("\n== Case schema validation ==");
  const cases = loadCases();
  if (!cases.length) { bad("no case files found in evals/cases/"); return []; }
  const ruleIds = detectorRuleIds();
  const seenIds = new Set();
  for (const c of cases) {
    if (c.error) { bad(`${c.file}: invalid JSON (${c.error})`); continue; }
    const d = c.data;
    const missing = CASE_REQUIRED.filter((k) => !(k in d));
    if (missing.length) { bad(`${c.file}: missing fields ${missing.join(", ")}`); continue; }
    if (seenIds.has(d.id)) { bad(`${c.file}: duplicate id ${d.id}`); continue; }
    seenIds.add(d.id);
    const em = EXPECTED_REQUIRED.filter((k) => !(k in d.expected));
    if (em.length) { bad(`${c.file}: expected missing ${em.join(", ")}`); continue; }
    if (typeof d.expected.activate !== "boolean") { bad(`${c.file}: expected.activate must be boolean`); continue; }
    if (d.expected.activate && !d.expected.surface_type) { bad(`${c.file}: positive case needs expected.surface_type`); continue; }
    const badRules = (d.expected.forbidden_detector_rules || []).filter((r) => !ruleIds.has(r));
    if (badRules.length) { bad(`${c.file}: unknown detector rules ${badRules.join(", ")}`); continue; }
    const rubric = join(EVALS_DIR, "expected", `${d.id}.md`);
    if (!existsSync(rubric)) { bad(`${c.file}: missing rubric evals/expected/${d.id}.md`); continue; }
    ok(`${c.file} (${d.expected.activate ? "positive" : "negative"}${d.expected.surface_type ? ", " + d.expected.surface_type : ""})`);
  }
  const positives = cases.filter((c) => c.data?.expected?.activate === true).length;
  const negatives = cases.filter((c) => c.data?.expected?.activate === false).length;
  console.log(`  ${cases.length} cases: ${positives} positive, ${negatives} negative`);
  if (negatives < 2) bad("need at least 2 negative-activation cases");
  return cases;
}

function smokeFixtures() {
  console.log("\n== Detector self-test (fixtures) ==");
  const manifest = JSON.parse(readFileSync(join(EVALS_DIR, "fixtures", "manifest.json"), "utf8"));
  for (const fx of manifest.fixtures) {
    const name = fx.file || fx.dir;
    const target = join(EVALS_DIR, "fixtures", name);
    if (!existsSync(target)) { bad(`${name}: fixture missing`); continue; }
    const argsList = fx.dir ? [AUDIT, "--deep", target, "--format", "json"] : [AUDIT, target, "--format", "json"];
    const res = spawnSync(process.execPath, argsList, { encoding: "utf8" });
    if (res.error || !res.stdout) { bad(`${name}: detector did not run (${res.error?.message || "no output"})`); continue; }
    let report;
    try { report = JSON.parse(res.stdout); } catch { bad(`${name}: detector emitted invalid JSON`); continue; }
    const found = new Set(report.findings.map((f) => f.id));
    const missing = (fx.expectRules || []).filter((r) => !found.has(r));
    if (missing.length) bad(`${name}: expected rules did not fire: ${missing.join(", ")}`);
    else if (fx.expectRules?.length) ok(`${name}: all ${fx.expectRules.length} expected rules fired`);
    if (fx.forbidSeverities?.length) {
      const hits = report.findings.filter((f) => fx.forbidSeverities.includes(f.severity));
      if (hits.length) bad(`${name}: forbidden severities present: ${hits.map((h) => `${h.id}@${h.line}`).join(", ")}`);
      else ok(`${name}: no ${fx.forbidSeverities.join("/")} findings (clean fixture)`);
    }
  }
}

function smokeStructure() {
  console.log("\n== Plugin structure sanity ==");
  const mustExist = [
    ".claude-plugin/plugin.json",
    "skills/lexia-design/SKILL.md",
    "skills/design-system/SKILL.md",
    "skills/design-audit/SKILL.md",
    "skills/motion-design/SKILL.md",
    "skills/update/SKILL.md",
    "agents/design-director.md",
    "agents/ux-auditor.md",
    "agents/visual-critic.md",
    "agents/motion-engineer.md",
    "hooks/hooks.json",
    "sources.lock.json",
    "SOURCES.md",
  ];
  for (const rel of mustExist) {
    if (existsSync(join(PLUGIN_ROOT, rel))) ok(rel);
    else bad(`${rel} missing`);
  }
  for (const jsonFile of [".claude-plugin/plugin.json", ".claude-plugin/marketplace.json", "hooks/hooks.json", "sources.lock.json"]) {
    try { JSON.parse(readFileSync(join(PLUGIN_ROOT, jsonFile), "utf8")); ok(`${jsonFile} parses`); }
    catch (e) { bad(`${jsonFile}: ${e.message}`); }
  }
}

function liveMode(execute) {
  const cases = loadCases().filter((c) => c.data);
  const hasClaude = spawnSync("claude", ["--version"], { encoding: "utf8" }).status === 0;
  console.log("\n== Live evals ==");
  if (!hasClaude) {
    console.log("claude CLI not found on PATH. Install Claude Code to run live evals.");
    if (execute) process.exit(1);
  }
  if (execute && process.env.LEXIA_EVALS_LIVE !== "1") {
    console.log("Refusing to execute: live evals consume API credits. Set LEXIA_EVALS_LIVE=1 and pass --execute.");
    process.exit(1);
  }
  for (const c of cases) {
    const d = c.data;
    const outDir = join(EVALS_DIR, "results", d.id);
    const cmd = `claude -p ${JSON.stringify(d.prompt)} --plugin-dir ${PLUGIN_ROOT}`;
    if (!execute) {
      console.log(`\n[${d.id}] run in an empty workspace:\n  ${cmd}\n  then grade the transcript + files against evals/expected/${d.id}.md`);
      continue;
    }
    mkdirSync(outDir, { recursive: true });
    console.log(`\n[${d.id}] executing...`);
    const res = spawnSync("claude", ["-p", d.prompt, "--plugin-dir", PLUGIN_ROOT], {
      cwd: outDir, encoding: "utf8", timeout: 15 * 60 * 1000,
    });
    writeFileSync(join(outDir, "transcript.txt"), (res.stdout || "") + (res.stderr ? `\n--- stderr ---\n${res.stderr}` : ""));
    console.log(`  saved ${join("evals/results", d.id, "transcript.txt")} (exit ${res.status}). Grade against expected/${d.id}.md; run the detector on any produced UI files.`);
  }
  if (!execute) console.log("\nAdd --execute (and LEXIA_EVALS_LIVE=1) to run these for real. Grading stays human/agent-driven by design.");
}

function main() {
  const args = process.argv.slice(2);
  try {
    if (args.includes("--live")) { liveMode(args.includes("--execute")); return; }
    if (args.includes("--as-shipped")) { asShippedMode(); return; }
    console.log("lexia-design evals — smoke mode (offline, no API cost)");
    smokeStructure();
    smokeCases();
    smokeFixtures();
    smokeCoverage();
    smokeGateMath();
    console.log(`\n${failures === 0 ? "ALL SMOKE CHECKS PASSED" : `${failures} FAILURE(S)`}`);
    process.exit(failures === 0 ? 0 : 1);
  } catch (err) {
    console.error(`run-evals internal error: ${err?.message || err}`);
    process.exit(2);
  }
}

main();
