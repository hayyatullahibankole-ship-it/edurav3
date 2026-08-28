import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationList, type Notification } from "@/components/notifications/NotificationList";
import { resolveNotificationRoute } from "@/lib/notificationRoutes";

const baseNotification = (over: Partial<Notification> = {}): Notification => ({
  id: "n1",
  title: "Your result is ready",
  message: "Tap to view your latest CBT result.",
  type: "result",
  is_read: false,
  created_at: new Date().toISOString(),
  metadata: null,
  ...over,
});

describe("smoke: notification navigation", () => {
  it("marks a notification read and opens its destination", async () => {
    const onMarkRead = vi.fn();
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(
      <NotificationList
        notifications={[baseNotification()]}
        loading={false}
        error={null}
        onMarkRead={onMarkRead}
        onMarkAllRead={vi.fn()}
        onDelete={vi.fn()}
        onOpen={onOpen}
      />
    );

    await user.click(screen.getByText(/your result is ready/i));

    await waitFor(() => expect(onOpen).toHaveBeenCalled());
    expect(onMarkRead).toHaveBeenCalledWith("n1");
    expect(resolveNotificationRoute(onOpen.mock.calls[0][0])).toBe("/results");
  });

  it("resolves destinations for each supported notification type", () => {
    expect(resolveNotificationRoute({ type: "exam" })).toBe("/cbt");
    expect(resolveNotificationRoute({ type: "subscription" })).toBe("/payment");
    expect(resolveNotificationRoute({ type: "payment" })).toBe("/wallet");
    expect(resolveNotificationRoute({ type: "referral" })).toBe("/referrals");
    expect(resolveNotificationRoute({ type: "forum" })).toBe("/forum");
    expect(resolveNotificationRoute({ type: "ebook" })).toBe("/ebooks");
    expect(resolveNotificationRoute({ type: "campus_project" })).toBe("/campus/projects");
  });

  it("prefers an explicit route on the notification metadata", () => {
    expect(
      resolveNotificationRoute({ type: "result", metadata: { route: "/results/abc" } })
    ).toBe("/results/abc");
    expect(resolveNotificationRoute({ type: "unknown-type" })).toBe("/notifications");
    expect(resolveNotificationRoute({ type: "unknown-type" }, { campus: true })).toBe(
      "/campus/notifications"
    );
  });

  it("shows an empty state when there is nothing to read", () => {
    render(
      <NotificationList
        notifications={[]}
        loading={false}
        error={null}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument();
  });
});
