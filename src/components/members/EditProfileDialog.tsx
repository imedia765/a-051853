import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Member } from "@/types/member";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditProfileDialogProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated: () => void;
}

const EditProfileDialog = ({ member, open, onOpenChange, onProfileUpdated }: EditProfileDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: member.email || '',
    phone: member.phone || '',
    address: member.address || '',
    town: member.town || '',
    postcode: member.postcode || '',
    membership_type: member.membership_type || '',
    status: member.status || '',
    collector: member.collector || ''
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('members')
        .update(formData)
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      onProfileUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-dashboard-card border-dashboard-accent1/20">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right text-dashboard-text">
              Email
            </Label>
            <Input
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right text-dashboard-text">
              Phone
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right text-dashboard-text">
              Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="town" className="text-right text-dashboard-text">
              Town
            </Label>
            <Input
              id="town"
              value={formData.town}
              onChange={(e) => setFormData({...formData, town: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="postcode" className="text-right text-dashboard-text">
              Postcode
            </Label>
            <Input
              id="postcode"
              value={formData.postcode}
              onChange={(e) => setFormData({...formData, postcode: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="membership_type" className="text-right text-dashboard-text">
              Membership Type
            </Label>
            <Input
              id="membership_type"
              value={formData.membership_type}
              onChange={(e) => setFormData({...formData, membership_type: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right text-dashboard-text">
              Status
            </Label>
            <Input
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collector" className="text-right text-dashboard-text">
              Collector
            </Label>
            <Input
              id="collector"
              value={formData.collector}
              onChange={(e) => setFormData({...formData, collector: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-dashboard-dark text-dashboard-text hover:bg-dashboard-card hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-dashboard-accent1 text-white hover:bg-dashboard-accent1/80"
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;