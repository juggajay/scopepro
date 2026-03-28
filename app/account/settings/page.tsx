"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { BusinessProfile } from "@/components/account/BusinessProfile";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AccountSettingsPage() {
  const router = useRouter();
  const deleteAccount = useAction(api.account.deleteAccount);
  const { signOut } = useAuthActions();
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      await signOut();
      toast.success("Account deleted");
      router.push("/");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your business profile and account
        </p>
      </div>

      {/* Business Profile Form */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Business Profile</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          This information will appear on your generated scope documents and PDFs.
        </p>
        <BusinessProfile />
      </section>

      <Separator />

      {/* Password note */}
      <section>
        <h2 className="mb-2 text-base font-semibold">Password</h2>
        <p className="text-sm text-muted-foreground">
          Password reset is handled via the login page. If you need to change
          your password, sign out and use the reset flow.
        </p>
      </section>

      <Separator />

      {/* Danger Zone */}
      <section>
        <h2 className="mb-2 text-base font-semibold text-destructive">
          Danger Zone
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account and all your scopes.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                {deleting && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
