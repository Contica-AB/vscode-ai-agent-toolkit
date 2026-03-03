import { execSync } from 'child_process';

/** Run az CLI and return parsed JSON output, or null on error */
export function azJson(args) {
  try {
    return JSON.parse(
      execSync(`az ${args.join(' ')} --output json`, { timeout: 15000, stdio: ['pipe', 'pipe', 'ignore'] }).toString()
    );
  } catch {
    return null;
  }
}

/** Extract the first balanced JSON object from a string */
export function extractFirstJson(str) {
  const start = str.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null;
}
