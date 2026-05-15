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

  static JSONArray toJa(Object v) {
    if (v == null) {
      JSONArray z = new JSONArray();
      z.put(JSONObject.NULL);
      return z;
    }
    if (v instanceof JSONArray) return (JSONArray) v;
    Class<?> c = v.getClass();
    if (c.isArray()) return new JSONArray(v);
    JSONArray a = new JSONArray();
    a.put(v);
    return a;
  }

  static boolean cmp(Object exp, Object got) {
    JSONArray a = toJa(exp);
    JSONArray b = toJa(got);
    return a.similar(b);
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
        Object got = m.invoke(sol, buildArgs(m, args));
        Object exp = new JSONTokener(tc.getString("expected")).nextValue();
        cell.put("passed", cmp(exp, got));
        cell.put("actual", String.valueOf(got));
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
    System.out.print(out.toString());
  }
}
`.trim();
