import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetMyContactDetails,
  useSaveBuyerContact,
} from "../hooks/useQueries";

export default function EmailSetupModal() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: contact, isFetched, isLoading } = useGetMyContactDetails();
  const saveContact = useSaveBuyerContact();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && isFetched && !isLoading) {
      const hasEmail = contact?.email && contact.email.trim() !== "";
      if (!hasEmail) {
        setOpen(true);
      }
    }
  }, [isAuthenticated, isFetched, isLoading, contact]);

  // Close if user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      setEmail("");
      setError("");
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    try {
      await saveContact.mutateAsync(trimmed);
      toast.success("Email saved successfully!");
      setOpen(false);
    } catch {
      toast.error("Failed to save email. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        data-ocid="email-setup.dialog"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-5 h-5 text-primary" />
            <DialogTitle className="font-display">
              Set Up Your Account
            </DialogTitle>
          </div>
          <DialogDescription>
            Please enter your email address so we can deliver your purchased
            gaming accounts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="setup-email">Email Address</Label>
            <Input
              id="setup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              data-ocid="email-setup.input"
              autoComplete="email"
            />
            {error && (
              <p
                className="text-sm text-destructive"
                data-ocid="email-setup.error_state"
              >
                {error}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={saveContact.isPending}
            data-ocid="email-setup.submit_button"
          >
            {saveContact.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Email"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
