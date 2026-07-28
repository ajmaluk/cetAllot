import React from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { MtechApplicationForm } from "./MtechApplicationForm";

const MtechApplicationModal = ({ open, onClose, onSubmit }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl max-h-[88vh] overflow-y-auto p-6 md:p-8 rounded-2xl">
        <MtechApplicationForm onSuccess={onSubmit} />
      </DialogContent>
    </Dialog>
  );
};

export default MtechApplicationModal;
