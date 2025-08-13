import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function LogoutDialog({ open, onClose, onLogout }: LogoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Logout</DialogTitle>
          <DialogDescription>
            Are you sure you want to logout?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={onLogout}>
            Yes, Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
