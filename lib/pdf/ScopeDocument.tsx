/**
 * Full scope PDF document template.
 *
 * React-PDF Document component that renders a complete scope of works
 * with header, job details, categorised items, and footer.
 */

import {
  Document,
  Page,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import { styles, colors } from "./styles";
import type { GroupedScopeItems } from "@/lib/scope-transform";

// ── Types ────────────────────────────────────────────────────────────

export interface ScopeDocumentProfile {
  businessName?: string;
  abn?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

export interface ScopeDocumentData {
  description?: string;
  propertyType?: string;
  scopeType?: "interior" | "exterior" | "both";
  createdAt: number;
}

interface ScopeDocumentProps {
  scope: ScopeDocumentData;
  groupedItems: GroupedScopeItems;
  profile?: ScopeDocumentProfile;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function scopeTypeLabel(type?: string): string {
  switch (type) {
    case "interior":
      return "Interior";
    case "exterior":
      return "Exterior";
    case "both":
      return "Interior & Exterior";
    default:
      return "Not specified";
  }
}

function countItems(groupedItems: GroupedScopeItems): number {
  return Object.values(groupedItems).reduce(
    (total, items) => total + items.length,
    0,
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function Header({ profile }: { profile?: ScopeDocumentProfile }) {
  const businessName = profile?.businessName || "Your Business Name";

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerBusinessName}>{businessName}</Text>
        {profile?.abn && (
          <Text style={styles.headerContactLine}>ABN: {profile.abn}</Text>
        )}
        {profile?.phone && (
          <Text style={styles.headerContactLine}>{profile.phone}</Text>
        )}
        {profile?.address && (
          <Text style={styles.headerContactLine}>{profile.address}</Text>
        )}
        {!profile?.businessName && (
          <Text style={[styles.headerContactLine, { fontStyle: "italic" }]}>
            Set up your business profile in Account Settings
          </Text>
        )}
      </View>
      {profile?.logoUrl && (
        <Image src={profile.logoUrl} style={styles.headerLogo} />
      )}
    </View>
  );
}

function JobDetails({ scope }: { scope: ScopeDocumentData }) {
  return (
    <View style={styles.jobDetailsSection}>
      <Text style={styles.jobDetailsTitle}>Scope of Works</Text>

      {scope.description && (
        <View style={styles.jobDetailsRow}>
          <Text style={styles.jobDetailsLabel}>Description:</Text>
          <Text style={styles.jobDetailsValue}>{scope.description}</Text>
        </View>
      )}

      {scope.propertyType && (
        <View style={styles.jobDetailsRow}>
          <Text style={styles.jobDetailsLabel}>Property Type:</Text>
          <Text style={styles.jobDetailsValue}>{scope.propertyType}</Text>
        </View>
      )}

      <View style={styles.jobDetailsRow}>
        <Text style={styles.jobDetailsLabel}>Scope Type:</Text>
        <Text style={styles.jobDetailsValue}>
          {scopeTypeLabel(scope.scopeType)}
        </Text>
      </View>

      <View style={styles.jobDetailsRow}>
        <Text style={styles.jobDetailsLabel}>Date:</Text>
        <Text style={styles.jobDetailsValue}>
          {formatDate(scope.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function CategorySection({
  category,
  items,
}: {
  category: string;
  items: GroupedScopeItems[string];
}) {
  return (
    <View style={styles.categorySection} wrap={false}>
      {/* Category header */}
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <Text style={styles.categoryItemCount}>
          {items.length} item{items.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Description</Text>
        <Text style={[styles.tableHeaderText, { width: 50, textAlign: "center" }]}>
          Qty
        </Text>
        <Text style={[styles.tableHeaderText, { width: 60 }]}>Unit</Text>
      </View>

      {/* Item rows */}
      {items.map((item, index) => (
        <View
          key={item._id}
          style={[styles.itemRow, index % 2 === 1 ? styles.itemRowAlt : {}]}
        >
          <Text style={styles.itemDescription}>{item.description}</Text>
          <Text style={styles.itemQuantity}>{item.quantity || "-"}</Text>
          <Text style={styles.itemUnit}>{item.unit || ""}</Text>
        </View>
      ))}
    </View>
  );
}

function Footer({ scope }: { scope: ScopeDocumentData }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{formatDate(scope.createdAt)}</Text>
      <Text style={styles.footerBrand}>Generated by ScopePro</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

function SummaryBox({
  groupedItems,
}: {
  groupedItems: GroupedScopeItems;
}) {
  const categories = Object.keys(groupedItems);
  const totalItems = countItems(groupedItems);

  return (
    <View style={styles.summaryBox}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total categories</Text>
        <Text style={styles.summaryValue}>{categories.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total included items</Text>
        <Text style={styles.summaryValue}>{totalItems}</Text>
      </View>
    </View>
  );
}

// ── Main document ────────────────────────────────────────────────────

export function ScopeDocument({
  scope,
  groupedItems,
  profile,
}: ScopeDocumentProps) {
  const categories = Object.keys(groupedItems);

  return (
    <Document
      title={scope.description || "Scope of Works"}
      author={profile?.businessName || "ScopePro"}
      subject="Scope of Works"
      creator="ScopePro"
    >
      <Page size="A4" style={styles.page}>
        <Header profile={profile} />
        <JobDetails scope={scope} />

        {categories.length === 0 ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              No items in this scope.
            </Text>
          </View>
        ) : (
          categories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              items={groupedItems[category]}
            />
          ))
        )}

        <SummaryBox groupedItems={groupedItems} />
        <Footer scope={scope} />
      </Page>
    </Document>
  );
}
