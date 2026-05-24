/** Hidden reflect-based judge — ships with {@code Solution}; not exposed to clients. */
export const JAVA_REFLECT_JUDGE = `
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

public final class Judge {
  static String trunc(String s) { return s.length() > 2400 ? s.substring(0, 2400) : s; }

  static Method resolve(Class<?> cl, String nm) throws Exception {
    for (Method x : cl.getDeclaredMethods()) {
      if (!x.getName().equals(nm) || java.lang.reflect.Modifier.isStatic(x.getModifiers())) continue;
      x.setAccessible(true);
      return x;
    }
    throw new NoSuchMethodException(nm);
  }

  static Class<?> bx(Class<?> p) {
    if (!p.isPrimitive()) return p;
    if (p == int.class) return Integer.class;
    if (p == long.class) return Long.class;
    if (p == double.class) return Double.class;
    if (p == boolean.class) return Boolean.class;
    if (p == char.class) return Character.class;
    if (p == byte.class) return Byte.class;
    if (p == short.class) return Short.class;
    if (p == float.class) return Float.class;
    throw new UnsupportedOperationException();
  }

  static Object coerce(Class<?> t, Object jv) throws Exception {
    if (jv == null || JSONObject.NULL.equals(jv)) return null;
    if (bx(t) == String.class) return String.valueOf(jv);
    if (bx(t) == Boolean.class) return Boolean.parseBoolean(String.valueOf(jv));
    if (jv instanceof Number) {
      if (bx(t) == Integer.class || t == int.class) return ((Number) jv).intValue();
      if (bx(t) == Long.class || t == long.class) return ((Number) jv).longValue();
      if (bx(t) == Double.class || t == double.class) return ((Number) jv).doubleValue();
    }
    if (t.isArray() && jv instanceof JSONArray) {
      JSONArray arr = (JSONArray) jv;
      Class<?> c = t.getComponentType();
      if (c == int.class) {
        int[] x = new int[arr.length()];
        for (int i = 0; i < arr.length(); i++) x[i] = arr.getInt(i);
        return x;
      }
      if (c == int[][].class) {
        int[][] mx = new int[arr.length()][];
        for (int r = 0; r < arr.length(); r++) {
          JSONArray row = arr.getJSONArray(r);
          mx[r] = new int[row.length()];
          for (int c1 = 0; c1 < row.length(); c1++) mx[r][c1] = row.getInt(c1);
        }
        return mx;
      }
      if (c == long.class) {
        long[] x = new long[arr.length()];
        for (int i = 0; i < arr.length(); i++) x[i] = arr.getLong(i);
        return x;
      }
      if (c == double.class) {
        double[] x = new double[arr.length()];
        for (int i = 0; i < arr.length(); i++) x[i] = arr.getDouble(i);
        return x;
      }
      if (!c.isPrimitive()) {
        Object o = Array.newInstance(c, arr.length());
        for (int i = 0; i < arr.length(); i++) Array.set(o, i, coerce(c, arr.get(i)));
        return o;
      }
    }
    throw new UnsupportedOperationException("coerce " + t);
  }

  static Object[] buildArgs(Method m, JSONArray ja) throws Exception {
    Class<?>[] p = m.getParameterTypes();
    if (ja.length() != p.length) throw new IllegalArgumentException("bad argc");
    Object[] o = new Object[p.length];
    for (int i = 0; i < p.length; i++) o[i] = coerce(p[i], ja.get(i));
    return o;
  }

  /** Flatten List/Collection returns into JSON arrays (not [[elements]]). */
  static Object jsonLeaf(Object v) {
    if (v == null || JSONObject.NULL.equals(v)) return JSONObject.NULL;
    if (v instanceof Number || v instanceof Boolean || v instanceof String || v instanceof Character) {
      return v;
    }
    if (v instanceof JSONArray) return v;
    Class<?> c = v.getClass();
    if (c.isArray()) return new JSONArray(v);
    if (v instanceof java.util.Collection) {
      JSONArray a = new JSONArray();
      for (Object el : (java.util.Collection<?>) v) a.put(jsonLeaf(el));
      return a;
    }
    return v;
  }

  static JSONArray toJa(Object v) {
    if (v == null) {
      JSONArray z = new JSONArray();
      z.put(JSONObject.NULL);
      return z;
    }
    if (v instanceof JSONArray) return (JSONArray) v;
    Object jv = jsonLeaf(v);
    if (jv instanceof JSONArray) return (JSONArray) jv;
    JSONArray a = new JSONArray();
    a.put(jv);
    return a;
  }

  static boolean cmp(Object exp, Object got) {
    JSONArray a = toJa(exp);
    JSONArray b = toJa(got);
    return a.similar(b);
  }

  static int[] toIntPair(Object exp) {
    JSONArray a = toJa(exp);
    if (a.length() != 2) return null;
    return new int[] { a.getInt(0), a.getInt(1) };
  }

  static boolean samePairSorted(int[] a, int[] b) {
    if (a.length != 2 || b.length != 2) return false;
    int a0 = Math.min(a[0], a[1]);
    int a1 = Math.max(a[0], a[1]);
    int b0 = Math.min(b[0], b[1]);
    int b1 = Math.max(b[0], b[1]);
    return a0 == b0 && a1 == b1;
  }

  static int[] numsFromArgs(JSONArray args) {
    if (args == null || args.length() < 2) return null;
    JSONArray nums = args.optJSONArray(0);
    if (nums == null) return null;
    int[] out = new int[nums.length()];
    for (int i = 0; i < nums.length(); i++) out[i] = nums.getInt(i);
    return out;
  }

  static boolean isValidTwoSumPair(int[] nums, int target, int[] pair) {
    if (pair == null || pair.length != 2) return false;
    int i = pair[0];
    int j = pair[1];
    if (i == j) return false;
    if (i < 0 || j < 0 || i >= nums.length || j >= nums.length) return false;
    return nums[i] + nums[j] == target;
  }

  /** Accept alternate valid index pairs when strict JSON compare fails. */
  static boolean relaxedMatch(JSONArray argList, Object exp, Object got) {
    if (!(got instanceof int[])) return false;
    int[] act = (int[]) got;
    int[] expPair = toIntPair(exp);
    if (expPair == null) return false;
    if (samePairSorted(act, expPair)) return true;
    int[] nums = numsFromArgs(argList);
    if (nums == null) return false;
    int target = argList.getInt(1);
    return isValidTwoSumPair(nums, target, act) && isValidTwoSumPair(nums, target, expPair);
  }

  static String jsonDisplay(Object v) {
    if (v == null) return "null";
    if (v instanceof int[]) return jsonInt1d((int[]) v);
    if (v instanceof long[]) return jsonLong1d((long[]) v);
    if (v instanceof double[]) return jsonDouble1d((double[]) v);
    if (v instanceof boolean[]) return jsonBool1d((boolean[]) v);
    if (v instanceof int[][]) return jsonInt2d((int[][]) v);
    if (v instanceof long[][]) return jsonLong2d((long[][]) v);
    Class<?> c = v.getClass();
    if (v instanceof Number || v instanceof Boolean || v instanceof Character) {
      return String.valueOf(v);
    }
    if (v instanceof String) return JSONObject.quote((String) v);
    if (c.isArray()) return new JSONArray(v).toString();
    return toJa(v).toString();
  }

  static String jsonInt1d(int[] a) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < a.length; i++) {
      if (i > 0) sb.append(',');
      sb.append(a[i]);
    }
    return sb.append(']').toString();
  }

  static String jsonLong1d(long[] a) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < a.length; i++) {
      if (i > 0) sb.append(',');
      sb.append(a[i]);
    }
    return sb.append(']').toString();
  }

  static String jsonDouble1d(double[] a) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < a.length; i++) {
      if (i > 0) sb.append(',');
      sb.append(a[i]);
    }
    return sb.append(']').toString();
  }

  static String jsonBool1d(boolean[] a) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < a.length; i++) {
      if (i > 0) sb.append(',');
      sb.append(a[i]);
    }
    return sb.append(']').toString();
  }

  static String jsonInt2d(int[][] mx) {
    StringBuilder sb = new StringBuilder("[");
    for (int r = 0; r < mx.length; r++) {
      if (r > 0) sb.append(',');
      sb.append(jsonInt1d(mx[r]));
    }
    return sb.append(']').toString();
  }

  static String jsonLong2d(long[][] mx) {
    StringBuilder sb = new StringBuilder("[");
    for (int r = 0; r < mx.length; r++) {
      if (r > 0) sb.append(',');
      sb.append(jsonLong1d(mx[r]));
    }
    return sb.append(']').toString();
  }

  static String stack(Throwable t) {
    java.io.StringWriter sw = new java.io.StringWriter();
    t.printStackTrace(new java.io.PrintWriter(sw));
    return sw.toString();
  }

  public static void main(String[] ignored) throws Exception {
    JSONObject root =
        new JSONObject(Files.readString(Path.of("/workspace/cases.json")));
    String fn = root.getString("functionName");
    JSONArray cases = root.getJSONArray("cases");
    JSONArray rows = new JSONArray();
    int maxRunMs = 0;
    Solution sol = new Solution();
    Method m = resolve(Solution.class, fn);
    for (int i = 0; i < cases.length(); i++) {
      JSONObject tc = cases.getJSONObject(i);
      JSONObject cell = new JSONObject();
      cell.put("index", i);
      cell.put("hidden", tc.optBoolean("hidden", false));
      try {
        JSONObject inp = new JSONObject(tc.getString("input"));
        JSONArray args = inp.getJSONArray("args");
        long t0 = System.nanoTime();
        Object got = m.invoke(sol, buildArgs(m, args));
        int runMs = (int) ((System.nanoTime() - t0) / 1_000_000L);
        maxRunMs = Math.max(maxRunMs, runMs);
        cell.put("runTimeMs", runMs);
        Object exp = new JSONTokener(tc.getString("expected")).nextValue();
        boolean ok = cmp(exp, got) || relaxedMatch(args, exp, got);
        cell.put("passed", ok);
        cell.put("actual", jsonDisplay(got));
        cell.put("expected", tc.getString("expected"));
        cell.put(
            "inputPreview",
            tc.getString("input").substring(0, Math.min(200, tc.getString("input").length())));
      } catch (Throwable e) {
        cell.put("passed", false);
        cell.put("error", trunc(stack(e)));
      }
      rows.put(cell);
    }
    JSONObject out = new JSONObject();
    out.put("results", rows);
    out.put("executionTimeMs", maxRunMs);
    System.out.print(out.toString());
  }
}
`.trim();
