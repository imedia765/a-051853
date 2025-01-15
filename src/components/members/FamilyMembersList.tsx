import { Member } from "@/types/member";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import FamilyMemberCard from "./FamilyMemberCard";

interface FamilyMembersListProps {
  members: Member[];
}

const FamilyMembersList = ({ members }: FamilyMembersListProps) => {
  const membersWithFamily = members.filter(member => 
    member.family_member_name || 
    member.family_member_relationship || 
    member.family_member_dob || 
    member.family_member_gender
  );

  if (membersWithFamily.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No family members found</p>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)] w-full rounded-md">
      <div className="space-y-4 p-1">
        {membersWithFamily.map((member) => (
          <div key={member.id} className="space-y-4">
            <h3 className="font-medium text-lg">{member.full_name} - {member.member_number}</h3>
            <FamilyMemberCard
              name={member.family_member_name}
              relationship={member.family_member_relationship}
              dob={member.family_member_dob}
              gender={member.family_member_gender}
              memberNumber={member.member_number}
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default FamilyMembersList;