import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeUrl, slugify } from "./sanitize";

describe("escapeHtml", () => {
  it("returns empty string for null or undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("converts number to string", () => {
    expect(escapeHtml(42)).toBe("42");
  });

  it("escapes &", () => {
    expect(escapeHtml("a&b")).toBe("a&amp;b");
  });

  it("escapes < and >", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes quotes and slash", () => {
    expect(escapeHtml(`"'/`)).toBe("&quot;&#039;&#x2F;");
  });

  it("handles mixed content", () => {
    expect(escapeHtml("<b onclick=\"alert('xss')\">")).toBe("&lt;b onclick=&quot;alert(&#039;xss&#039;)&quot;&gt;");
  });

  it("passes through safe strings unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

describe("sanitizeUrl", () => {
  it("returns fallback for null or undefined", () => {
    expect(sanitizeUrl(null)).toBe("/");
    expect(sanitizeUrl(undefined)).toBe("/");
  });

  it("uses custom fallback", () => {
    expect(sanitizeUrl(null, "https://example.com")).toBe("https://example.com");
  });

  it("blocks javascript: protocol", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("/");
  });

  it("blocks data: protocol", () => {
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("/");
  });

  it("blocks vbscript: protocol", () => {
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBe("/");
  });

  it("blocks file: protocol", () => {
    expect(sanitizeUrl("file:///etc/passwd")).toBe("/");
  });

  it("allows https URLs", () => {
    expect(sanitizeUrl("https://example.com/page")).toBe("https://example.com/page");
  });

  it("allows relative URLs", () => {
    expect(sanitizeUrl("/path/to/page")).toBe("/path/to/page");
  });

  it("trims whitespace", () => {
    expect(sanitizeUrl("  https://example.com  ")).toBe("https://example.com");
  });
});

describe("slugify", () => {
  it("lowercases input", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("hello!@#$%^&*()world")).toBe("helloworld");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("removes hyphens (not in \\w class)", () => {
    expect(slugify("hello-world")).toBe("helloworld");
  });
});
