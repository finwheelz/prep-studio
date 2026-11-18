# Shared test harness: the browser worker and scripts/verify-py.mts both run this file,
# so a problem that passes CI passes in the browser on the same runtime.
import io, sys, json, time, traceback, math, os, base64

os.environ.setdefault("MPLBACKEND", "AGG")


def _ps_eq(act, exp):
    """Equality that works for floats, numpy arrays and pandas objects (plain == fails on those)."""
    mods = sys.modules
    if "pandas" in mods:
        pd = mods["pandas"]
        if isinstance(exp, (pd.DataFrame, pd.Series)) or isinstance(act, (pd.DataFrame, pd.Series)):
            if type(act) is not type(exp):
                return False
            try:
                t = pd.testing.assert_frame_equal if isinstance(exp, pd.DataFrame) else pd.testing.assert_series_equal
                t(act, exp, check_dtype=False, check_exact=False, rtol=1e-6, atol=1e-9)
                return True
            except AssertionError:
                return False
    if "numpy" in mods:
        np = mods["numpy"]
        if isinstance(exp, np.ndarray) or isinstance(act, np.ndarray):
            a, e = np.asarray(act), np.asarray(exp)
            if a.shape != e.shape:
                return False
            if a.dtype.kind in "fc" or e.dtype.kind in "fc":
                return bool(np.allclose(a, e, rtol=1e-6, atol=1e-9, equal_nan=True))
            return bool((a == e).all())
        if isinstance(act, np.generic):
            act = act.item()
        if isinstance(exp, np.generic):
            exp = exp.item()
    if isinstance(act, float) or isinstance(exp, float):
        try:
            return math.isclose(float(act), float(exp), rel_tol=1e-6, abs_tol=1e-9)
        except (TypeError, ValueError):
            return False
    if isinstance(act, (list, tuple)) and isinstance(exp, (list, tuple)) and type(act) is type(exp):
        return len(act) == len(exp) and all(_ps_eq(a, e) for a, e in zip(act, exp))
    if isinstance(act, dict) and isinstance(exp, dict):
        return act.keys() == exp.keys() and all(_ps_eq(act[k], exp[k]) for k in act)
    return bool(act == exp)


def _ps_figures(limit=4):
    plt = sys.modules.get("matplotlib.pyplot")
    if plt is None:
        return []
    out = []
    for n in plt.get_fignums()[:limit]:
        buf = io.BytesIO()
        plt.figure(n).savefig(buf, format="png", dpi=90, bbox_inches="tight")
        out.append(base64.b64encode(buf.getvalue()).decode())
    plt.close("all")
    return out


def __run(user_code, setup_code, tests):
    out = {"stdout": "", "error": None, "tests": [], "figures": []}
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    ns = {"__name__": "__main__", "_ps_eq": _ps_eq}
    plt = sys.modules.get("matplotlib.pyplot")
    if plt is not None:
        plt.close("all")
    try:
        if setup_code:
            exec(setup_code, ns)
        exec(user_code, ns)
    except BaseException:
        out["error"] = traceback.format_exc(limit=4)
    if out["error"] is None:
        for t in tests:
            r = {"id": t["id"], "pass": False, "actual": None, "expected": None, "error": None, "ms": 0}
            t0 = time.perf_counter()
            try:
                exp = eval(t["expected"], dict(ns))
                act = eval(t["call"], ns)
                r["ms"] = (time.perf_counter() - t0) * 1000
                r["expected"] = repr(exp)[:4000]
                r["actual"] = repr(act)[:4000]
                r["pass"] = _ps_eq(act, exp)
            except BaseException:
                r["ms"] = (time.perf_counter() - t0) * 1000
                r["error"] = traceback.format_exc(limit=3)
            out["tests"].append(r)
    try:
        out["figures"] = _ps_figures()
    except BaseException:
        pass
    sys.stdout = old
    out["stdout"] = buf.getvalue()[-20000:]
    return json.dumps(out)
