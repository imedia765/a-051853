import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserCheck, Users } from "lucide-react";

interface RoleBadgeProps {
  role: string | null;
}

const RoleBadge = ({ role }: RoleBadgeProps) => {
  switch (role) {
    case 'admin':
      return (
        <Badge variant="outline" className="bg-dashboard-accent1/20 text-dashboard-accent1 border-0 gap-1">
          <ShieldCheck className="w-3 h-3" />
          Admin
        </Badge>
      );
    case 'collector':
      return (
        <Badge variant="outline" className="bg-dashboard-accent2/20 text-dashboard-accent2 border-0 gap-1">
          <UserCheck className="w-3 h-3" />
          Collector
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-dashboard-accent3/20 text-dashboard-accent3 border-0 gap-1">
          <Users className="w-3 h-3" />
          Member
        </Badge>
      );
  }
};

export default RoleBadge;