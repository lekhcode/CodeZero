/** Type hints stored as JSON array string, e.g. `["int[]","int"]` */
export type ArgHintRow = readonly string[];

export function parseJudgeArgHints(raw: string | null): ArgHintRow | null {
  if (raw === null || raw.trim() === "") return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) return null;
    return v;
  } catch {
    return null;
  }
}

function cppDeclareOne(idx: number, hintIn: string): string {
  const hint = hintIn.trim();
  const name = `_a${idx}`;
  const arg = `args[${idx}]`;
  if (hint === "int") return `int ${name} = ${arg}.get<int>();`;
  if (hint === "long") return `long long ${name} = ${arg}.get<long long>();`;
  if (hint === "double") return `double ${name} = ${arg}.get<double>();`;
  if (hint === "bool" || hint === "boolean") return `bool ${name} = ${arg}.get<bool>();`;
  if (hint === "String" || hint === "string") return `std::string ${name} = ${arg}.get<std::string>();`;
  if (hint === "char") return `char ${name} = ${arg}.get<std::string>().front();`;
  if (hint === "int[]") return `auto ${name} = ${arg}.get<std::vector<int>>();`;
  if (hint === "double[]") return `auto ${name} = ${arg}.get<std::vector<double>>();`;
  if (hint === "int[][]") return `auto ${name} = ${arg}.get<std::vector<std::vector<int>>>();`;
  if (hint === "String[]" || hint === "string[]")
    return `auto ${name} = ${arg}.get<std::vector<std::string>>();`;

  throw new Error(`Unsupported C++ judgeArgHint "${hint}"`);
}

/** Declarations — `json args` is testcase `input` object `{ "args": [...] }` */
export function cppDeclareArgsFromJsonArgs(hints: ArgHintRow): string {
  return hints.map((h, i) => `    ${cppDeclareOne(i, h)}`).join("\n");
}

function javaDeclareOne(idx: number, hintIn: string): string {
  const hint = hintIn.trim();
  const name = `_a${idx}`;
  if (hint === "int") return `int ${name} = argsJa.getInt(${idx});`;
  if (hint === "long") return `long ${name} = argsJa.getLong(${idx});`;
  if (hint === "double") return `double ${name} = argsJa.getDouble(${idx});`;
  if (hint === "boolean" || hint === "bool") return `boolean ${name} = argsJa.getBoolean(${idx});`;
  if (hint === "String" || hint === "string") return `String ${name} = argsJa.getString(${idx});`;
  if (hint === "int[]") {
    return `JSONArray _j${idx}=argsJa.getJSONArray(${idx}); int[] ${name}=new int[_j${idx}.length()]; for(int _k=0;_k<${name}.length;_k++)${name}[_k]=_j${idx}.getInt(_k);`;
  }
  if (hint === "double[]") {
    return `JSONArray _j${idx}=argsJa.getJSONArray(${idx}); double[] ${name}=new double[_j${idx}.length()]; for(int _k=0;_k<${name}.length;_k++)${name}[_k]=_j${idx}.getDouble(_k);`;
  }
  if (hint === "int[][]") {
    return `JSONArray _j${idx}=argsJa.getJSONArray(${idx}); int[][] ${name}=new int[_j${idx}.length()][]; for(int _r=0;_r<${name}.length;_r++){JSONArray _rw=_j${idx}.getJSONArray(_r);${name}[_r]=new int[_rw.length()]; for(int _c=0;_c<${name}[_r].length;_c++) ${name}[_r][_c]=_rw.getInt(_c);}`;
  }
  if (hint === "String[]") {
    return `JSONArray _j${idx}=argsJa.getJSONArray(${idx}); String[] ${name}=new String[_j${idx}.length()]; for(int _k=0;_k<${name}.length;_k++)${name}[_k]=_j${idx}.getString(_k);`;
  }
  throw new Error(`Unsupported Java judgeArgHint "${hint}"`);
}

export function javaDeclareArgsLines(hints: ArgHintRow): string {
  return hints.map((h, i) => `        ${javaDeclareOne(i, h)}`).join("\n");
}

export function cppCallArgNames(hints: ArgHintRow): string {
  return hints.map((_, i) => `_a${i}`).join(", ");
}

export function javaCallArgNames(hints: ArgHintRow): string {
  return hints.map((_, i) => `_a${i}`).join(", ");
}

