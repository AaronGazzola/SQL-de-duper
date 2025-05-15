// constants/SQLPatterns.ts
export const sqlPatterns: Record<string, RegExp[]> = {
  function: [
    /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([\w]+)\s*\(/i,
    /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+([a-zA-Z0-9_\.]*)(\(.*\))\s+RETURNS/i,
    /^FUNCTION\s+public\.([a-zA-Z0-9_]+)/i,
  ],
  trigger: [
    /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+([a-zA-Z0-9_]+)\s/i,
    /CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)\s/i,
  ],
  policy: [
    /CREATE\s+POLICY\s+(?:")?([a-zA-Z0-9_\s]+)(?:")?\s+ON\s+/i,
    /CREATE\s+POLICY\s+([a-zA-Z0-9_\s"]+)\s+ON\s+/i,
  ],
  index: [
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+/i,
    /CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+/i,
  ],
  type: [
    /CREATE\s+TYPE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+AS\s+/i,
    /ALTER\s+TYPE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+ADD\s+VALUE/i,
    /CREATE\s+TYPE\s+public\.([a-zA-Z0-9_]+)/i,
    /DROP\s+TYPE\s+IF\s+EXISTS\s+public\.([a-zA-Z0-9_]+)/i,
  ],
  table: [
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\(/i,
    /CREATE\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)/i,
  ],
  view: [
    /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:public\.)?([a-zA-Z0-9_]+)\s+AS\s+/i,
    /CREATE\s+VIEW\s+(?:public\.)?([a-zA-Z0-9_]+)/i,
  ],
  constraint: [
    /ADD\s+CONSTRAINT\s+([a-zA-Z0-9_]+)\s+/i,
    /ADD\s+CONSTRAINT\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i,
  ],
  grant: [
    /GRANT\s+(\w+(?:\s*,\s*\w+)*)\s+ON\s+(?:TABLE\s+)?(?:FUNCTION\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i,
    /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)/i,
  ],
  revoke: [
    /REVOKE\s+(\w+(?:\s*,\s*\w+)*)\s+ON\s+(?:TABLE\s+)?(?:FUNCTION\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i,
    /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)/i,
  ],
  comment: [
    /COMMENT\s+ON\s+(?:TABLE|COLUMN|FUNCTION|TYPE|POLICY)\s+(?:public\.)?([a-zA-Z0-9_]+)/i,
    /COMMENT\s+ON\s+FUNCTION\s+(\w+\(.*?\))/i,
    /COMMENT\s+ON\s+POLICY\s+("[a-zA-Z0-9_\s]+")\s+ON\s+([a-zA-Z0-9_]+)/i,
  ],
  alter: [
    /ALTER\s+(?:TABLE|COLUMN|TYPE)\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i,
    /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+(?:DISABLE|ENABLE)/i,
    /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+ADD\s+/i,
    /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+/i,
  ],
  extension: [/CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i],
  plpgsql: [/DO\s+\$\$/i, /BEGIN;/i, /DECLARE/i],
  alterRLSPolicy: [
    /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+(?:ENABLE|DISABLE)\s+ROW\s+LEVEL\s+SECURITY/i,
  ],
  dropPolicy: [
    /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?(?:")?([a-zA-Z0-9_\s]+)(?:")?/i,
    /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_\s"]+)\s+ON\s+/i,
  ],
  dropTrigger: [
    /DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i,
    /DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+/i,
  ],
  dropTable: [
    /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i,
    /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?public\.([a-zA-Z0-9_]+)\s+CASCADE/i,
  ],
  dropFunction: [
    /DROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i,
    /DROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?public\.([a-zA-Z0-9_]+)\(/i,
  ],
  dropView: [
    /DROP\s+VIEW\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i,
    /DROP\s+VIEW\s+(?:IF\s+EXISTS\s+)?public\.([a-zA-Z0-9_]+)\s+CASCADE/i,
  ],
  dropColumn: [
    /ALTER\s+TABLE\s+(?:public\.)?(?:[a-zA-Z0-9_]+)\s+DROP\s+COLUMN\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i,
  ],
  addColumn: [
    /ALTER\s+TABLE\s+(?:public\.)?(?:[a-zA-Z0-9_]+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i,
  ],
  createSchema: [/CREATE\s+SCHEMA\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i],
  createExtension: [
    /CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i,
  ],
  procedureFunction: [
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+([a-zA-Z0-9_\.]+)\(.*\)\s+RETURNS\s+.+AS\s+\$\$/i,
  ],
  insertInto: [/INSERT\s+INTO\s+(?:public\.)?([a-zA-Z0-9_]+)/i],
  update: [/UPDATE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+SET/i],
  delete: [/DELETE\s+FROM\s+(?:public\.)?([a-zA-Z0-9_]+)/i],
  createUser: [/CREATE\s+USER\s+([a-zA-Z0-9_]+)/i],
  alterUser: [/ALTER\s+USER\s+([a-zA-Z0-9_]+)/i],
  createRole: [/CREATE\s+ROLE\s+([a-zA-Z0-9_]+)/i],
  alterRole: [/ALTER\s+ROLE\s+([a-zA-Z0-9_]+)/i],
  // Additional patterns for the unparsed SQL
  check: [/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)\(/i],
  authorize: [/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.authorize\(/i],
  custom_access_token_hook: [
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.custom_access_token_hook\(/i,
  ],
  milestone: [
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_milestone/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_milestone_([a-zA-Z0-9_]+)/i,
  ],
  contract: [
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_contract/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_contract_([a-zA-Z0-9_]+)/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.create_contract_([a-zA-Z0-9_]+)/i,
  ],
  task: [
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_task/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_task_([a-zA-Z0-9_]+)/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.list_([a-zA-Z0-9_]+)_tasks/i,
  ],
  invitation: [
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_invitation/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.accept_([a-zA-Z0-9_]+)_invitation/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.decline_([a-zA-Z0-9_]+)_invitation/i,
  ],
  proposal: [
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_proposal/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.submit_proposal\(/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_proposal_([a-zA-Z0-9_]+)/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.create_project_from_proposal\(/i,
  ],
  payment: [
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_payment/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.update_payment_([a-zA-Z0-9_]+)/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.create_contract_payment\(/i,
  ],
  project: [
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)_project/i,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.update_project_([a-zA-Z0-9_]+)/i,
  ],
  profile: [
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.update_profile_([a-zA-Z0-9_]+)/i,
  ],
  app_data: [/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_app_data\(\)/i],
};

export default sqlPatterns;
