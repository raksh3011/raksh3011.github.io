"""Compact the Argo NetCDF sample (FloatChat repo) into JSON for the static demo.

usage: python build_floatchat_data.py <netcdf_dir> <land_geojson> <out_dir>
"""
import glob, json, math, sys
import netCDF4 as nc
import numpy as np

src, land_path, out = sys.argv[1:4]
LEVELS = list(range(0, 1001, 20))  # dbar, 51 levels
BBOX = (20, -45, 120, 30)  # lon0, lat0, lon1, lat1 for coastline crop


def clean(v):
    return None if v is None or (isinstance(v, float) and math.isnan(v)) else v


def interp(p, v):
    ok = ~(np.ma.getmaskarray(p) | np.ma.getmaskarray(v))
    p, v = np.asarray(p)[ok], np.asarray(v)[ok]
    if p.size < 3:
        return None
    o = np.argsort(p)
    p, v = p[o], v[o]
    res = []
    for L in LEVELS:
        if L < p[0] - 5 or L > p[-1] + 5:
            res.append(None)
        else:
            res.append(round(float(np.interp(L, p, v)), 2))
    return res if sum(x is not None for x in res) >= 5 else None


profiles = []
for f in sorted(glob.glob(f"{src}/*.nc")):
    d = nc.Dataset(f)
    n = d.dimensions["N_PROF"].size
    t = nc.num2date(d["JULD"][:], d["JULD"].units, only_use_cftime_datetimes=False, only_use_python_datetimes=True)
    for i in range(n):
        lat, lon = d["LATITUDE"][i], d["LONGITUDE"][i]
        if np.ma.is_masked(lat) or np.ma.is_masked(lon):
            continue
        qc_t = d["TEMP_QC"][i] if "TEMP_QC" in d.variables else None
        temp = d["TEMP"][i]
        psal = d["PSAL"][i]
        if qc_t is not None:  # keep only good (1) / probably good (2)
            bad = np.array([c not in (b"1", b"2") for c in qc_t])
            temp = np.ma.masked_where(bad, temp)
        if "PSAL_QC" in d.variables:
            bad = np.array([c not in (b"1", b"2") for c in d["PSAL_QC"][i]])
            psal = np.ma.masked_where(bad, psal)
        T = interp(d["PRES"][i], temp)
        S = interp(d["PRES"][i], psal)
        if T is None and S is None:
            continue
        wmo = b"".join(c for c in d["PLATFORM_NUMBER"][i] if c != b"--").decode().strip() if False else "".join(
            c.decode() for c in d["PLATFORM_NUMBER"][i] if c is not np.ma.masked).strip()
        profiles.append(
            {"id": len(profiles), "wmo": wmo, "t": t[i].strftime("%Y-%m-%dT%H:%MZ"),
             "lat": round(float(lat), 3), "lon": round(float(lon), 3), "T": T, "S": S}
        )

json.dump({"levels": LEVELS, "profiles": profiles}, open(f"{out}/profiles.json", "w"), separators=(",", ":"))

# Coastlines: keep rings intersecting bbox, quantise to 0.1 deg
land = json.load(open(land_path))
rings = []
for ft in land["features"]:
    g = ft["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    for poly in polys:
        ring = poly[0]
        xs = [p[0] for p in ring]
        ys = [p[1] for p in ring]
        if max(xs) < BBOX[0] or min(xs) > BBOX[2] or max(ys) < BBOX[1] or min(ys) > BBOX[3]:
            continue
        last, simp = None, []
        for x, y in ring:
            q = (round(x, 1), round(y, 1))
            if q != last:
                simp.append(q)
                last = q
        if len(simp) > 3:
            rings.append(simp)
json.dump(rings, open(f"{out}/land.json", "w"), separators=(",", ":"))
print(len(profiles), "profiles;", len(rings), "land rings")
