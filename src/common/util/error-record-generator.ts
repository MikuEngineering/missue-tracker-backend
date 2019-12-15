import { ValidationError } from 'class-validator';

export type ErrorRecord = {
  type: String,
  field: String[],
  code: String,
  message: String,
};

/**
 * Create a generator for creating error records according to errors from class-validator.
 * @param type The error metadata
 */
export function createGenerator(type: string) {
  const results: ErrorRecord[] = [];

  // Generate error records according to the array of ValidationError
  function generate(errors: ValidationError[], field: string[] = []): ErrorRecord[] {
    // Record each error
    errors.forEach((error) => {
      // Get all errors' name
      const constraintNames = Object.keys(error.constraints);
  
      // Memorize error path
      const currentField = [...field, error.property];

      const records: ErrorRecord[] = constraintNames.map((name) => ({
        type,
        field: currentField,
        code: name,
        message: error.constraints[name],
      }));

      results.push(...records);
  
      // If there is any inner error, then go down and record them.
      if (error.children.length > 0) {
        generate(error.children, field);
      }
    });

    return results;
  }

  return generate;
}
