# IT PMO Kanban

A demo board for a fictitious bank's IT PMO, tracking delivery tasks from backlog to done.

## Language

**Task**:
One unit of IT delivery work, identified by an `ITPM-####` number and owned by one assignee.
_Avoid_: Ticket, card, item, issue

**Column**:
One stage of the board that a Task sits in: Backlog, In Progress, Blocked or Done.
_Avoid_: Lane, stage, state

**Status**:
The Column a Task currently sits in.
_Avoid_: State, stage

**Project**:
The workstream a Task belongs to, such as Core Banking Upgrade.
_Avoid_: Workstream, programme, epic

**Category**:
The kind of work a Task is, such as Infrastructure or Compliance.
_Avoid_: Type, tag, label

**Priority**:
How urgent a Task is: Critical, High, Medium or Low.
_Avoid_: Severity, importance

**Overdue**:
A Task whose due date is before today and whose Status is not Done.
_Avoid_: Late, past due

**Assignee**:
The one person responsible for a Task.
_Avoid_: Owner, resource

**Summary**:
The counts across every Task, by Status plus Overdue, unaffected by filters.
_Avoid_: Stats, totals

**Demo data**:
The eight seeded Tasks the board starts with; a refresh restores them.
_Avoid_: Sample data, fixtures
