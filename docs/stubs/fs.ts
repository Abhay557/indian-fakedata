// Browser stub for Node's `fs` module.
// Only used by loadDatabase(dataDir) at runtime, which the playground never
// invokes (it always uses the built-in default database).
export default {};
export const existsSync = () => false;
export const readFileSync = () => {
  throw new Error('fs is not available in the browser');
};
