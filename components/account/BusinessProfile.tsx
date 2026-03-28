"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const AU_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];

/**
 * Format ABN as "XX XXX XXX XXX" for display.
 */
function formatAbn(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
}

export function BusinessProfile() {
  const profile = useQuery(api.account.getProfile);
  const updateProfile = useMutation(api.account.updateProfile);

  const [form, setForm] = useState({
    businessName: "",
    abn: "",
    licenseNumber: "",
    insuranceDetails: "",
    phone: "",
    address: "",
    state: "",
  });
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Populate form when profile loads
  useEffect(() => {
    if (profile && !initialized) {
      setForm({
        businessName: profile.businessName ?? "",
        abn: profile.abn ? formatAbn(profile.abn) : "",
        licenseNumber: profile.licenseNumber ?? "",
        insuranceDetails: profile.insuranceDetails ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        state: profile.state ?? "",
      });
      setInitialized(true);
    }
  }, [profile, initialized]);

  if (profile === undefined) {
    return <BusinessProfileSkeleton />;
  }

  function handleAbnChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatAbn(e.target.value);
    setForm((prev) => ({ ...prev, abn: formatted }));
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Strip ABN formatting before saving
      const abnRaw = form.abn.replace(/\s/g, "");

      await updateProfile({
        businessName: form.businessName,
        abn: abnRaw,
        licenseNumber: form.licenseNumber,
        insuranceDetails: form.insuranceDetails,
        phone: form.phone,
        address: form.address,
        state: form.state,
      });

      toast.success("Profile saved successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Logo placeholder */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Business Logo</p>
          <p className="text-xs text-muted-foreground">
            Logo upload coming soon
          </p>
        </div>
      </div>

      {/* Business Name */}
      <div className="space-y-1.5">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          placeholder="e.g. Smith Painting Services"
          value={form.businessName}
          onChange={(e) => updateField("businessName", e.target.value)}
        />
      </div>

      {/* ABN */}
      <div className="space-y-1.5">
        <Label htmlFor="abn">ABN</Label>
        <Input
          id="abn"
          placeholder="XX XXX XXX XXX"
          value={form.abn}
          onChange={handleAbnChange}
          maxLength={14}
        />
        <p className="text-xs text-muted-foreground">
          Australian Business Number (11 digits)
        </p>
      </div>

      {/* License Number */}
      <div className="space-y-1.5">
        <Label htmlFor="licenseNumber">License Number</Label>
        <Input
          id="licenseNumber"
          placeholder="e.g. 12345C"
          value={form.licenseNumber}
          onChange={(e) => updateField("licenseNumber", e.target.value)}
        />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="e.g. 0412 345 678"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
        />
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          placeholder="Street address"
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
          rows={2}
        />
      </div>

      {/* State */}
      <div className="space-y-1.5">
        <Label>State</Label>
        <Select
          value={form.state}
          onValueChange={(val) => updateField("state", val as string)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {AU_STATES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.value} — {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Insurance */}
      <div className="space-y-1.5">
        <Label htmlFor="insuranceDetails">Insurance Details</Label>
        <Textarea
          id="insuranceDetails"
          placeholder="e.g. Public Liability $20M, Policy #ABC123"
          value={form.insuranceDetails}
          onChange={(e) => updateField("insuranceDetails", e.target.value)}
          rows={2}
        />
      </div>

      {/* Save Button */}
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
        {saving ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}

function BusinessProfileSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
      <Skeleton className="h-8 w-24" />
    </div>
  );
}
