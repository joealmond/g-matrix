// Defines the shape of the context object for a security rule violation.
// This context is used to provide detailed information about the request
// that was denied by Firestore's security rules.
export type SecurityRuleContext = {
  // The path of the document or collection being accessed.
  path: string;
  // The type of operation being performed (e.g., 'get', 'list', 'create', 'update', 'delete').
  // 'write' can be used as a general term for create, update, or delete.
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  // The data being sent with the request, for write operations.
  requestResourceData?: any;
};

// A custom error class for Firestore permission errors.
// This class extends the base Error class and adds a 'context' property
// to hold the security rule context.
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    // Construct the error message.
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(context, null, 2)}`;
    
    // Call the base Error constructor.
    super(message);
    
    // Set the error name.
    this.name = 'FirestorePermissionError';
    
    // Attach the context to the error object.
    this.context = context;

    // This line is to fix the prototype chain in environments like TypeScript.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }

  // A method to return the error message and context as a string.
  toString() {
    return this.message;
  }
}
