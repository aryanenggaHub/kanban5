// Seam 1: the createBoard() interface, loaded from the <script id="core"> block of index.html.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const { createBoard } = vm.runInThisContext("(() => {" + core + "\nreturn { createBoard };})()");

const TODAY = "2026-10-06";
const board = () => createBoard({ today: TODAY });
const column = (view, status) => view.columns.find(c => c.status === status);
const ids = col => col.tasks.map(t => t.id);

test("view groups the seed tasks into the four columns in order", () => {
  const v = board().view();
  assert.deepEqual(v.columns.map(c => c.status), ["Backlog", "In Progress", "Blocked", "Done"]);
  assert.deepEqual(ids(column(v, "Backlog")), ["ITPM-0003", "ITPM-0005", "ITPM-0008"]);
  assert.deepEqual(ids(column(v, "In Progress")), ["ITPM-0001", "ITPM-0002"]);
});

test("summary counts every task; Overdue ignores Done tasks", () => {
  const { summary } = board().view();
  assert.equal(summary.total, 8);
  assert.deepEqual(summary.byStatus, { "Backlog": 3, "In Progress": 2, "Blocked": 2, "Done": 1 });
  assert.equal(summary.overdue, 2); // ITPM-0002 (3 days late) and ITPM-0004 (10 days late); ITPM-0007 is Done
});

test("a task is flagged overdue only when its due date is before today and it is not Done", () => {
  const v = board().view();
  const flagged = v.columns.flatMap(c => c.tasks).filter(t => t.overdue).map(t => t.id);
  assert.deepEqual(flagged, ["ITPM-0002", "ITPM-0004"]);
});

test("move puts the task in the target column and updates the summary", () => {
  const b = board();
  assert.equal(b.move("ITPM-0003", "In Progress"), true);
  const v = b.view();
  assert.deepEqual(ids(column(v, "In Progress")), ["ITPM-0001", "ITPM-0002", "ITPM-0003"]);
  assert.equal(v.summary.byStatus["Backlog"], 2);
});

test("moving an overdue task to Done clears its Overdue flag", () => {
  const b = board();
  b.move("ITPM-0002", "Done");
  assert.equal(b.view().summary.overdue, 1);
});

test("move ignores unknown tasks, unknown columns and the current column", () => {
  const b = board();
  assert.equal(b.move("ITPM-9999", "Done"), false);
  assert.equal(b.move("ITPM-0003", "Archived"), false);
  assert.equal(b.move("ITPM-0003", "Backlog"), false);
  assert.equal(b.view().summary.total, 8);
});

test("remove deletes the task; removing it again does nothing", () => {
  const b = board();
  assert.equal(b.remove("ITPM-0005"), true);
  assert.deepEqual(ids(column(b.view(), "Backlog")), ["ITPM-0003", "ITPM-0008"]);
  assert.equal(b.remove("ITPM-0005"), false);
});

const valid = (over = {}) => ({
  title: "Rotate HSM keys", description: "", project: "Cybersecurity Uplift", category: "Cybersecurity",
  assignee: "Marcus Tan", priority: "High", dueDate: "2026-10-20", status: "Backlog", ...over
});

test("add creates the next sequential ITPM id in the chosen column", () => {
  const b = board();
  const r = b.add(valid({ status: "Blocked" }));
  assert.equal(r.ok, true);
  assert.equal(r.task.id, "ITPM-0009");
  assert.equal(ids(column(b.view(), "Blocked")).at(-1), "ITPM-0009");
  assert.equal(b.view().summary.total, 9);
});

test("add trims text and keeps ids unique after a removal", () => {
  const b = board();
  b.remove("ITPM-0008");
  const r = b.add(valid({ title: "  Rotate HSM keys  ", assignee: " Marcus Tan " }));
  assert.equal(r.task.title, "Rotate HSM keys");
  assert.equal(r.task.assignee, "Marcus Tan");
  assert.equal(r.task.id, "ITPM-0009");
});

test("add reports every missing required field and adds nothing", () => {
  const b = board();
  const r = b.add(valid({ title: "  ", assignee: "", dueDate: "" }));
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ["assignee", "dueDate", "title"]);
  assert.equal(b.view().summary.total, 8);
});

test("add rejects a past due date but accepts today", () => {
  const b = board();
  assert.deepEqual(Object.keys(b.add(valid({ dueDate: "2026-10-05" })).errors), ["dueDate"]);
  assert.equal(b.add(valid({ dueDate: "2026-10-06" })).ok, true);
});

test("add enforces the title and description length limits", () => {
  const b = board();
  assert.deepEqual(Object.keys(b.add(valid({ title: "x".repeat(81) })).errors), ["title"]);
  assert.deepEqual(Object.keys(b.add(valid({ description: "x".repeat(501) })).errors), ["description"]);
  assert.equal(b.add(valid({ title: "x".repeat(80), description: "x".repeat(500) })).ok, true);
});

test("add rejects a project, category, priority or status outside the allowed lists", () => {
  const b = board();
  const r = b.add(valid({ project: "Rogue", category: "Rogue", priority: "Urgent", status: "Archived" }));
  assert.deepEqual(Object.keys(r.errors).sort(), ["category", "priority", "project", "status"]);
});

test("filters narrow the columns but the summary stays global", () => {
  const b = board();
  b.setFilters({ project: "Core Banking Upgrade", assignee: "", priority: "" });
  const v = b.view();
  assert.deepEqual(v.columns.flatMap(ids), ["ITPM-0008", "ITPM-0007"]);
  assert.equal(v.summary.total, 8);
});

test("assignee filter matches part of a name, ignoring case and surrounding spaces", () => {
  const b = board();
  b.setFilters({ project: "", assignee: "  tAN ", priority: "" });
  assert.deepEqual(b.view().columns.flatMap(ids).sort(), ["ITPM-0002", "ITPM-0006"]);
});

test("filters combine, and clearing them restores every task", () => {
  const b = board();
  b.setFilters({ project: "Infrastructure & Cloud", assignee: "", priority: "High" });
  assert.deepEqual(b.view().columns.flatMap(ids).sort(), ["ITPM-0001", "ITPM-0006"]);
  b.setFilters({ project: "", assignee: "", priority: "" });
  assert.equal(b.view().columns.flatMap(ids).length, 8);
});

test("a task added while filtered is hidden if it does not match, and counted in the summary", () => {
  const b = board();
  b.setFilters({ project: "Digital Channels", assignee: "", priority: "" });
  b.add(valid());
  const v = b.view();
  assert.deepEqual(v.columns.flatMap(ids), ["ITPM-0003"]);
  assert.equal(v.summary.total, 9);
});
