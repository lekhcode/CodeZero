import {
  cppCallArgNames,
  cppDeclareArgsFromJsonArgs,
  type ArgHintRow,
} from "../../judge/argCodegen.js";
import { CPP_PRELUDE } from "./config.js";

/** Single translation unit: prelude + JSON + user's {@code Solution} + generated {@code main}. */
export function buildCppCodegenJudge(fn: string, hints: ArgHintRow, userSubmission: string): string {
  const decl = cppDeclareArgsFromJsonArgs(hints);
  const callArgs = cppCallArgNames(hints);

  return `
${CPP_PRELUDE}

#include "json.hpp"

using json = nlohmann::json;

#line 1 "submission.cpp"
${userSubmission}

#line 999 "runner_generated.cpp"

static std::string slurp(const char* path) {
  std::ifstream f(path, std::ios::in | std::ios::binary);
  std::string s((std::istreambuf_iterator<char>(f)), {});
  return s;
}

int main() {
  try {
    json root = json::parse(slurp("/workspace/cases.json"));
    const std::string fn = root["functionName"].get<std::string>();
    if (fn != "${fn}") {
      json err = json::object();
      err["error"] = "functionName mismatch";
      std::cout << err.dump();
      return 4;
    }
    json rows = json::array();
    int maxRunMs = 0;
    Solution sol;
    for (size_t ti = 0; ti < root["cases"].size(); ++ti) {
      json tc = root["cases"][(unsigned)ti];
      json cell = json::object();
      cell["index"] = ti;
      cell["hidden"] = tc.value("hidden", false);
      try {
        json params = json::parse(tc["input"].get<std::string>());
        json args = params.at("args");
${decl}

        json gotJson;
        auto t0 = std::chrono::steady_clock::now();
        auto got = sol.${fn}(${callArgs});
        auto t1 = std::chrono::steady_clock::now();
        int runMs = (int) std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
        maxRunMs = std::max(maxRunMs, runMs);
        cell["runTimeMs"] = runMs;
        gotJson = json(got);
        json expRaw = json::parse(tc.at("expected").get<std::string>());
        cell["passed"] = (gotJson == expRaw);
        cell["actual"] = gotJson.dump();
        cell["expected"] = tc.at("expected").get<std::string>();
      } catch (const std::exception& e) {
        cell["passed"] = false;
        cell["error"] = std::string(e.what()).substr(0, 2400);
      }
      rows.push_back(cell);
    }
    json out = json::object();
    out["results"] = rows;
    out["executionTimeMs"] = maxRunMs;
    std::cout << out.dump();
    return 0;
  } catch (const std::exception& e) {
    json err = json::object();
    err["error"] = std::string(e.what());
    std::cout << err.dump();
    return 3;
  }
}
`.trim();
}
