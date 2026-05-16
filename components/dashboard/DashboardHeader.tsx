import { AppHeader } from "@/components/auth/HomeAccountNav";

export function DashboardHeader({ notificationCount = 0 }: { notificationCount?: number }) {
  return (
    <div className="border-b border-[#e6ddcf] bg-[#f8f5ef]/92 px-5 py-5 backdrop-blur sm:px-6 lg:px-8">
      <AppHeader notificationCount={notificationCount} />
    </div>
  );
}
