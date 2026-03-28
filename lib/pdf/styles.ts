/**
 * Shared PDF stylesheet for ScopePro scope documents.
 *
 * Uses @react-pdf/renderer StyleSheet API.
 * Brand color: warm amber/copper (#D4A574 — approximate oklch(0.72 0.12 55)).
 * Font: Helvetica (built-in to react-pdf, closest to Inter).
 * Layout: A4 portrait, professional clean layout.
 */

import { StyleSheet, Font } from "@react-pdf/renderer";

// Register Helvetica as the default (already built-in, but make it explicit)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: 700 },
    { src: "Helvetica-Oblique", fontStyle: "italic" },
  ],
});

// ── Brand colours ────────────────────────────────────────────────────

export const colors = {
  primary: "#D4A574", // warm amber/copper
  primaryDark: "#B8864E", // darker shade for headings
  primaryLight: "#F5EDE4", // light tint for backgrounds
  text: "#1C1917", // near-black, warm
  textMuted: "#78716C", // stone-500
  border: "#E7E5E4", // stone-200
  borderLight: "#F5F5F4", // stone-100
  white: "#FFFFFF",
  background: "#FAFAF9", // stone-50
};

// ── Stylesheet ───────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  // Page
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: colors.white,
  },

  // ── Header ─────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerLeft: {
    flex: 1,
  },
  headerBusinessName: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primaryDark,
    marginBottom: 4,
  },
  headerContactLine: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 1,
  },
  headerLogo: {
    width: 64,
    height: 64,
    objectFit: "contain" as const,
  },

  // ── Job details ────────────────────────────────────────────────
  jobDetailsSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
  },
  jobDetailsTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.primaryDark,
    marginBottom: 8,
  },
  jobDetailsRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  jobDetailsLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.textMuted,
    width: 100,
  },
  jobDetailsValue: {
    fontSize: 9,
    color: colors.text,
    flex: 1,
  },

  // ── Category section ───────────────────────────────────────────
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.white,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  categoryItemCount: {
    fontSize: 8,
    color: colors.primaryLight,
    marginLeft: 8,
  },

  // ── Item rows ──────────────────────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    color: colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  itemRowAlt: {
    backgroundColor: colors.background,
  },
  itemDescription: {
    flex: 1,
    fontSize: 9,
    color: colors.text,
    paddingRight: 8,
  },
  itemQuantity: {
    width: 50,
    fontSize: 9,
    color: colors.text,
    textAlign: "center" as const,
  },
  itemUnit: {
    width: 60,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: "left" as const,
  },

  // ── Footer ─────────────────────────────────────────────────────
  footer: {
    position: "absolute" as const,
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: colors.textMuted,
  },
  footerBrand: {
    fontSize: 7,
    color: colors.primary,
    fontWeight: 700,
  },

  // ── Summary / totals ───────────────────────────────────────────
  summaryBox: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  summaryLabel: {
    fontSize: 9,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.text,
  },
});
