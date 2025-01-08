import { Button } from "@/components/ui/button";
import { Printer, Edit } from "lucide-react";
import { useState } from "react";
import EditProfileDialog from "./EditProfileDialog";
import { Member } from "@/types/member";

interface MembersListHeaderProps {
  userRole: string | null;
  onPrint: () => void;
  hasMembers: boolean;
  collectorInfo?: { name: string } | null;
  selectedMember: Member | null;
  onProfileUpdated: () => void;
}

const MembersListHeader = ({ 
  userRole, 
  onPrint, 
  hasMembers, 
  collectorInfo,
  selectedMember,
  onProfileUpdated
}: MembersListHeaderProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (userRole !== 'collector' || !hasMembers) return null;

  return (
    <>
      <div className="flex justify-end mb-4 gap-2">
        <Button
          onClick={() => setEditDialogOpen(true)}
          className="flex items-center gap-2 bg-dashboard-accent2 hover:bg-dashboard-accent2/80"
          disabled={!selectedMember}
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </Button>
        
        <Button
          onClick={onPrint}
          className="flex items-center gap-2 bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
        >
          <Printer className="w-4 h-4" />
          Print Members List
        </Button>
      </div>

      {selectedMember && (
        <EditProfileDialog
          member={selectedMember}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onProfileUpdated={onProfileUpdated}
        />
      )}
    </>
  );
};

export default MembersListHeader;