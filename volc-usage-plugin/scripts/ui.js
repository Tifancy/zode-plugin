// ── 火山引擎 Coding Plan 用量状态栏插件 ──
//
// 使用 zode.data.define 的动态 header 函数实现火山引擎 HMAC-SHA256 签名。
// 每次请求前由 Rust 调用 header 函数，用 zode.crypto 原语计算签名。

// ── 可配置参数（环境变量优先，无则用默认值）──
// REGION / SERVICE 参与 HMAC-SHA256 签名，在 volcSign 中从 ctx.secrets 读取
// HOST / ACTION / VERSION 决定请求 URL，在 discovery 阶段就需要确定（此时无 env 访问）
// LABEL 仅在渲染器中使用（渲染器无 ctx.secrets 访问），保持 JS 常量
const DEFAULTS = {
  REGION: "cn-beijing",
  SERVICE: "ark",
  HOST: "open.volcengineapi.com",
  ACTION: "GetCodingPlanUsage",
  VERSION: "2024-01-01",
  LABEL: "火山CodingPlan",
};

// 构建 URL（discovery 阶段调用，必须用静态默认值）
const URL = "https://" + DEFAULTS.HOST + "/?Action=" + DEFAULTS.ACTION
  + "&Region=" + DEFAULTS.REGION + "&Version=" + DEFAULTS.VERSION;

// 从 ctx.secrets 读取环境变量，无则用默认值（仅在 header 函数中可用）
function envOrDefault(secrets, key, fallback) {
  const val = secrets[key];
  return (val != null && val !== "") ? val : fallback;
}

// ── 火山引擎 HMAC-SHA256 签名 ──
function volcSign(ctx) {
  const { sha256hex, hmacSha256Hex, hmacSha256HexKey } = zode.crypto;
  const ak = ctx.secrets.VOLC_AK;
  const sk = ctx.secrets.VOLC_SK;

  // 环境变量优先，无则用默认值
  const region  = envOrDefault(ctx.secrets, "VOLC_REGION",  DEFAULTS.REGION);
  const service = envOrDefault(ctx.secrets, "VOLC_SERVICE", DEFAULTS.SERVICE);

  const date = ctx.timestamp;
  const shortDate = date.slice(0, 8);

  const payloadHash = sha256hex(ctx.body || "");
  const contentType = "application/json; charset=utf-8";
  const canonicalHeaders =
    "host:" + ctx.host + "\n" +
    "x-date:" + date + "\n" +
    "x-content-sha256:" + payloadHash + "\n" +
    "content-type:" + contentType + "\n";
  const signedHeaders = "host;x-date;x-content-sha256;content-type";
  const canonicalRequest = [
    ctx.method, ctx.path, ctx.query,
    canonicalHeaders, signedHeaders, payloadHash
  ].join("\n");

  const credentialScope = shortDate + "/" + region + "/" + service + "/request";
  const stringToSign = [
    "HMAC-SHA256", date, credentialScope, sha256hex(canonicalRequest)
  ].join("\n");

  const kDate    = hmacSha256Hex(sk, shortDate);
  const kRegion  = hmacSha256HexKey(kDate, region);
  const kService = hmacSha256HexKey(kRegion, service);
  const kSigning = hmacSha256HexKey(kService, "request");
  const sig = hmacSha256HexKey(kSigning, stringToSign);

  return {
    "X-Date": date,
    "X-Content-Sha256": payloadHash,
    "Content-Type": contentType,
    "Authorization": "HMAC-SHA256 Credential=" + ak + "/" + credentialScope +
      ", SignedHeaders=" + signedHeaders + ", Signature=" + sig
  };
}

// ── 数据源定义 ──
zode.data.define("codingPlan", {
  refreshIntervalMs: 60000,
  request: {
    url: URL,
    method: "POST",
    timeoutMs: 5000,
    headers: volcSign
  }
});

// ── 状态栏渲染 ──
function usageInfo(ctx) {
  const d = ctx.data.codingPlan;
  if (!d) return { text: "loading…", tone: "muted" };
  if (!d.ok) {
    if (d.error) return { text: "err: " + String(d.error).slice(0, 50), tone: "danger" };
    if (d.status) return { text: "HTTP " + d.status, tone: "danger" };
    return { text: "err: unknown", tone: "danger" };
  }
  const result = d.data?.Result;
  if (!result || !result.QuotaUsage) return { text: "no data", tone: "muted" };

  // QuotaUsage 数组: [{Level:"session",Percent:64.8}, {Level:"weekly",...}, {Level:"monthly",...}]
  const q = {};
  for (const item of result.QuotaUsage) {
    q[item.Level] = item.Percent;
  }

  const hp = q.session != null ? Math.round(q.session) : null;
  const wp = q.weekly != null ? Math.round(q.weekly) : null;
  const mp = q.monthly != null ? Math.round(q.monthly) : null;

  if (hp == null) return { text: "no quota", tone: "muted" };
  return { hp, wp, mp };
}

zode.ui.statusLine((ctx) => {
  const u = usageInfo(ctx);

  if (u.text != null) {
    return {
      spans: [
        { text: DEFAULTS.LABEL + " ", tone: "muted" },
        { text: u.text, tone: u.tone || "default" }
      ]
    };
  }

  // 小时额度颜色：<60% 绿色，60-80% 黄色，>80% 红色
  const hourTone = u.hp >= 80 ? "danger" : u.hp >= 60 ? "warning" : "success";

  return {
    spans: [
      { text: DEFAULTS.LABEL, tone: "default" },
      { text: " ● ", tone: hourTone, bold: true },
      { text: "h" + (u.hp ?? "?") + "%", tone: hourTone, bold: true },
      { text: "  w" + (u.wp ?? "?") + "%", tone: "muted" },
      { text: "  m" + (u.mp ?? "?") + "%", tone: "muted" }
    ]
  };
});
