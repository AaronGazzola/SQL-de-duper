// constants/SQLPatterns.ts
import { SQLPattern } from "@/types/app.types";

const createPattern = (regex: RegExp): SQLPattern => ({
  regex,
  isDefault: true,
  createdAt: Date.now(),
});

export const sqlPatterns: Record<string, SQLPattern[]> = {
  function: [
    createPattern(
      /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([\w]+)\s*\(/i
    ),
    createPattern(
      /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+([a-zA-Z0-9_\.]*)(\(.*\))\s+RETURNS/i
    ),
    createPattern(/^FUNCTION\s+public\.([a-zA-Z0-9_]+)/i),
  ],
  trigger: [
    createPattern(/CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+([a-zA-Z0-9_]+)\s/i),
    createPattern(/CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)\s/i),
  ],
  policy: [
    createPattern(/CREATE\s+POLICY\s+(?:")?([a-zA-Z0-9_\s]+)(?:")?\s+ON\s+/i),
    createPattern(/CREATE\s+POLICY\s+([a-zA-Z0-9_\s"]+)\s+ON\s+/i),
  ],
  index: [
    createPattern(
      /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+/i
    ),
    createPattern(
      /CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+/i
    ),
  ],
  type: [
    createPattern(/CREATE\s+TYPE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+AS\s+/i),
    createPattern(/ALTER\s+TYPE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+ADD\s+VALUE/i),
    createPattern(/CREATE\s+TYPE\s+public\.([a-zA-Z0-9_]+)/i),
    createPattern(/DROP\s+TYPE\s+IF\s+EXISTS\s+public\.([a-zA-Z0-9_]+)/i),
  ],
  table: [
    createPattern(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\(/i
    ),
    createPattern(/CREATE\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)/i),
  ],
  view: [
    createPattern(
      /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:public\.)?([a-zA-Z0-9_]+)\s+AS\s+/i
    ),
    createPattern(/CREATE\s+VIEW\s+(?:public\.)?([a-zA-Z0-9_]+)/i),
  ],
  constraint: [
    createPattern(/ADD\s+CONSTRAINT\s+([a-zA-Z0-9_]+)\s+/i),
    createPattern(
      /ADD\s+CONSTRAINT\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i
    ),
  ],
  grant: [
    createPattern(
      /GRANT\s+(\w+(?:\s*,\s*\w+)*)\s+ON\s+(?:TABLE\s+)?(?:FUNCTION\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i
    ),
    createPattern(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)/i),
  ],
  revoke: [
    createPattern(
      /REVOKE\s+(\w+(?:\s*,\s*\w+)*)\s+ON\s+(?:TABLE\s+)?(?:FUNCTION\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i
    ),
    createPattern(
      /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)/i
    ),
  ],
  comment: [
    createPattern(
      /COMMENT\s+ON\s+(?:TABLE|COLUMN|FUNCTION|TYPE|POLICY)\s+(?:public\.)?([a-zA-Z0-9_]+)/i
    ),
    createPattern(/COMMENT\s+ON\s+FUNCTION\s+(\w+\(.*?\))/i),
    createPattern(
      /COMMENT\s+ON\s+POLICY\s+("[a-zA-Z0-9_\s]+")\s+ON\s+([a-zA-Z0-9_]+)/i
    ),
  ],
  alter: [
    createPattern(
      /ALTER\s+(?:TABLE|COLUMN|TYPE)\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i
    ),
    createPattern(
      /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+(?:DISABLE|ENABLE)/i
    ),
    createPattern(/ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+ADD\s+/i),
    createPattern(/ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+/i),
  ],
  extension: [
    createPattern(
      /CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i
    ),
  ],
  plpgsql: [
    createPattern(/DO\s+\$\$/i),
    createPattern(/BEGIN;/i),
    createPattern(/DECLARE/i),
  ],
  alterRLSPolicy: [
    createPattern(
      /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+(?:ENABLE|DISABLE)\s+ROW\s+LEVEL\s+SECURITY/i
    ),
  ],
  dropPolicy: [
    createPattern(
      /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?(?:")?([a-zA-Z0-9_\s]+)(?:")?/i
    ),
    createPattern(
      /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_\s"]+)\s+ON\s+/i
    ),
  ],
  dropTrigger: [
    createPattern(/DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i),
    createPattern(
      /DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+/i
    ),
  ],
  dropTable: [
    createPattern(
      /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i
    ),
    createPattern(
      /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?public\.([a-zA-Z0-9_]+)\s+CASCADE/i
    ),
  ],
  dropFunction: [
    createPattern(
      /DROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i
    ),
    createPattern(
      /DROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?public\.([a-zA-Z0-9_]+)\(/i
    ),
  ],
  dropView: [
    createPattern(
      /DROP\s+VIEW\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i
    ),
    createPattern(
      /DROP\s+VIEW\s+(?:IF\s+EXISTS\s+)?public\.([a-zA-Z0-9_]+)\s+CASCADE/i
    ),
  ],
  dropColumn: [
    createPattern(
      /ALTER\s+TABLE\s+(?:public\.)?(?:[a-zA-Z0-9_]+)\s+DROP\s+COLUMN\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i
    ),
  ],
  addColumn: [
    createPattern(
      /ALTER\s+TABLE\s+(?:public\.)?(?:[a-zA-Z0-9_]+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i
    ),
  ],
  createSchema: [
    createPattern(
      /CREATE\s+SCHEMA\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i
    ),
  ],
  createExtension: [
    createPattern(
      /CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i
    ),
  ],
  procedureFunction: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+([a-zA-Z0-9_\.]+)\(.*\)\s+RETURNS\s+.+AS\s+\$\$/i
    ),
  ],
  insertInto: [createPattern(/INSERT\s+INTO\s+(?:public\.)?([a-zA-Z0-9_]+)/i)],
  update: [createPattern(/UPDATE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+SET/i)],
  delete: [createPattern(/DELETE\s+FROM\s+(?:public\.)?([a-zA-Z0-9_]+)/i)],
  createUser: [createPattern(/CREATE\s+USER\s+([a-zA-Z0-9_]+)/i)],
  alterUser: [createPattern(/ALTER\s+USER\s+([a-zA-Z0-9_]+)/i)],
  createRole: [createPattern(/CREATE\s+ROLE\s+([a-zA-Z0-9_]+)/i)],
  alterRole: [createPattern(/ALTER\s+ROLE\s+([a-zA-Z0-9_]+)/i)],
  // Additional patterns for the unparsed SQL
  check: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)\(/i
    ),
  ],
  authorize: [
    createPattern(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.authorize\(/i),
  ],
  custom_access_token_hook: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.custom_access_token_hook\(/i
    ),
  ],
  milestone: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_milestone/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_milestone_([a-zA-Z0-9_]+)/i
    ),
  ],
  contract: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_contract/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_contract_([a-zA-Z0-9_]+)/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.create_contract_([a-zA-Z0-9_]+)/i
    ),
  ],
  task: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_task/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_task_([a-zA-Z0-9_]+)/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.list_([a-zA-Z0-9_]+)_tasks/i
    ),
  ],
  invitation: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_invitation/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.accept_([a-zA-Z0-9_]+)_invitation/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.decline_([a-zA-Z0-9_]+)_invitation/i
    ),
  ],
  proposal: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_proposal/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.submit_proposal\(/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_proposal_([a-zA-Z0-9_]+)/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.create_project_from_proposal\(/i
    ),
  ],
  payment: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_payment/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.update_payment_([a-zA-Z0-9_]+)/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.create_contract_payment\(/i
    ),
  ],
  project: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_project/i
    ),
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.update_project_([a-zA-Z0-9_]+)/i
    ),
  ],
  profile: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.update_profile_([a-zA-Z0-9_]+)/i
    ),
  ],
  app_data: [
    createPattern(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_app_data\(\)/i
    ),
  ],
};

export default sqlPatterns;
