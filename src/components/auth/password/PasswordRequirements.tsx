import { Shield } from "lucide-react";

export const PasswordRequirements = () => {
  return (
    <div className="p-4 rounded-lg bg-dashboard-cardHover/50 border border-dashboard-cardBorder mb-4">
      <div className="flex items-center gap-2 text-dashboard-muted">
        <Shield className="w-4 h-4" />
        <span>Password must be at least 8 characters long</span>
      </div>
    </div>
  );
};