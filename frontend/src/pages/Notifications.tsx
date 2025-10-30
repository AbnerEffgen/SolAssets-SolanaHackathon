import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Bell, CheckCircle2, Users, Vote, TrendingUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Notifications = () => {
  const notifications = [
    // {
    //   icon: Users,
    //   title: "New Investor",
    //   description: "Maria Santos purchased 5,000 AGR-001 tokens",
    //   time: "2 hours ago",
    //   read: false,
    // },
    // {
    //   icon: CheckCircle2,
    //   title: "KYC Approved",
    //   description: "Your documentation has been verified and approved",
    //   time: "5 hours ago",
    //   read: false,
    // },
    // {
    //   icon: Vote,
    //   title: "Voting Closed",
    //   description: "Proposal 'Dividend Distribution' was approved with 85% of votes",
    //   time: "1 day ago",
    //   read: true,
    // },
    // {
    //   icon: TrendingUp,
    //   title: "Market Surge",
    //   description: "Token CAF-002 increased by 15% in the last 24 hours",
    //   time: "1 day ago",
    //   read: true,
    // },
    // {
    //   icon: FileText,
    //   title: "Pending Document",
    //   description: "Asset FAZ-001 requires a certificate update",
    //   time: "2 days ago",
    //   read: true,
    // },
    // {
    //   icon: Users,
    //   title: "New Holder",
    //   description: "João Silva joined token FAZ-001",
    //   time: "3 days ago",
    //   read: true,
    // },
  ];

  const hasNotifications = notifications.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Notifications</h2>
            <p className="text-muted-foreground">Keep track of all your activities</p>
          </div>

          {hasNotifications && (
            <Button variant="outline">
              Mark all as read
            </Button>
          )}
        </div>

        {hasNotifications ? (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <Card
                key={index}
                className={`p-5 bg-card/50 backdrop-blur-sm border-border transition-all duration-300 hover:border-primary ${
                  !notification.read ? "border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      !notification.read ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    <notification.icon
                      className={`w-5 h-5 ${
                        !notification.read ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4
                          className={`font-semibold mb-1 ${
                            !notification.read ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {notification.description}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-10 text-center bg-card/50 backdrop-blur-sm border-border">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
