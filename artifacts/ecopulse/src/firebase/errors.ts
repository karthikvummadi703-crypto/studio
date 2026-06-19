export type SecurityRuleContext = {
  path: string;
  operation: "get" | "list" | "create" | "update" | "delete" | "write";
  requestResourceData?: unknown;
};

/** Thrown when a Firestore operation fails due to security-rule denial. */
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  constructor(context: SecurityRuleContext) {
    super(`Firestore Permission Denied at ${context.path} for ${context.operation}`);
    this.name = "FirestorePermissionError";
    this.context = context;
  }
}
