import { m } from '@/paraglide/messages.js';
import { Pricing } from '@/blocks/pricing';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// "Out of credits" dialog for the homepage generator. Its own module so the
// dialog code is only downloaded once it is first opened (blocks/studio).
export default function PaywallDialog({
  open,
  onOpenChange,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label={title || m['studio.paywall_title']()}
        className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-5xl"
      >
        <Pricing
          variant="dialog"
          title={title || m['studio.paywall_title']()}
          description={description}
        />
      </DialogContent>
    </Dialog>
  );
}
