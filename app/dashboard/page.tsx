"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/hooks/use-auth";
import { ROLE_LABELS, getRoleBadgeVariant, Can } from "@/lib/permissions";
import { PageHeader, StatusBadge, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  mockEvents,
  mockFamilies,
  mockInvitations,
  mockMembers,
  mockRSVPs,
  mockCommunities,
} from "@/lib/mock/data";
import {
  Users,
  Home,
  CalendarDays,
  MailOpen,
  UserCheck,
  TrendingUp,
  Plus,
  Send,
  Download,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Building2,
  QrCode,
  HeartHandshake,
} from "lucide-react";

export default function DashboardPage() {
  const { currentRole, currentUser } = useAuthStore();
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const role = currentRole || "guest";
  const roleBadgeStyle = getRoleBadgeVariant(role);

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Page Header */}
      <PageHeader
        title={`Welcome back, ${currentUser?.name?.split(" ")[0] || "Member"}`}
        description={`Active as ${ROLE_LABELS[role]} · Heritage Hills Collective. Review real-time metrics, attendee statistics, and pending action items.`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Dashboard" },
        ]}
        badge={
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleBadgeStyle.bgColor} ${roleBadgeStyle.color} ${roleBadgeStyle.borderColor}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {ROLE_LABELS[role]}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Can action="event:create">
              <Button
                size="sm"
                onClick={() => setModalAction("Create New Celebration Event")}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                New Event
              </Button>
            </Can>
            <Can action="member:invite">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalAction("Send Community Invitation")}
                className="gap-1.5"
              >
                <MailOpen className="h-4 w-4" />
                Invite Members
              </Button>
            </Can>
          </div>
        }
      />

      {/* Action Notification Toast */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-medium hover:underline text-emerald-700 dark:text-emerald-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role-Specific View Rendering */}
      {role === "community_admin" && (
        <CommunityAdminView onAction={(msg) => setToastMessage(msg)} />
      )}
      {role === "event_organizer" && (
        <EventOrganizerView onAction={(msg) => setToastMessage(msg)} />
      )}
      {role === "family_head" && (
        <FamilyHeadView onAction={(msg) => setToastMessage(msg)} />
      )}
      {role === "member" && (
        <MemberView onAction={(msg) => setToastMessage(msg)} />
      )}
      {role === "super_admin" && (
        <SuperAdminView onAction={(msg) => setToastMessage(msg)} />
      )}
      {role === "guest" && (
        <GuestView onAction={(msg) => setToastMessage(msg)} />
      )}

      {/* Action Confirmation Modal */}
      <ConfirmDialog
        open={!!modalAction}
        onOpenChange={(open) => !open && setModalAction(null)}
        title={modalAction || "Quick Action"}
        description={`Would you like to simulate executing '${modalAction}' for the active community? Permissions have been verified for role ${ROLE_LABELS[role]}.`}
        confirmLabel="Execute Action"
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 600));
          setToastMessage(`Action '${modalAction}' executed successfully!`);
          setModalAction(null);
        }}
      />
    </div>
  );
}

/* ========================================================================= */
/* 1. COMMUNITY ADMIN DASHBOARD VIEW                                         */
/* ========================================================================= */
function CommunityAdminView({ onAction }: { onAction: (msg: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Members
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">142</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="h-3 w-3" /> +12% from last quarter
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Registered Families
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Home className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">38</div>
            <p className="text-xs text-zinc-500 mt-1">4 pending household approvals</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Active Events
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <CalendarDays className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">3</div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              1 happening this week
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Avg. RSVP Rate
            </CardTitle>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">88.4%</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Top tier community engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Panel */}
      <Card className="border-indigo-100 dark:border-indigo-950/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
            Admin Quick Actions
          </CardTitle>
          <CardDescription>
            High-priority administrative workflows protected by community permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Can action="member:invite">
              <Button
                variant="outline"
                onClick={() => onAction("Opened Member Invitation Dialog")}
                className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-center text-xs hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                <Users className="h-4 w-4 text-indigo-600" />
                <span>Invite Members</span>
              </Button>
            </Can>

            <Can action="family:create">
              <Button
                variant="outline"
                onClick={() => onAction("Opened Family Registration Wizard")}
                className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-center text-xs hover:border-emerald-300 dark:hover:border-emerald-700"
              >
                <Home className="h-4 w-4 text-emerald-600" />
                <span>Register Family</span>
              </Button>
            </Can>

            <Can action="event:create">
              <Button
                variant="outline"
                onClick={() => onAction("Initiated Celebration Event Builder")}
                className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-center text-xs hover:border-amber-300 dark:hover:border-amber-700"
              >
                <CalendarDays className="h-4 w-4 text-amber-600" />
                <span>Create Event</span>
              </Button>
            </Can>

            <Can action="community:settings">
              <Button
                variant="outline"
                asChild
                className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-center text-xs hover:border-zinc-400"
              >
                <Link href="/settings/community">
                  <SlidersHorizontal className="h-4 w-4 text-zinc-600" />
                  <span>Branding & Rules</span>
                </Link>
              </Button>
            </Can>
          </div>
        </CardContent>
      </Card>

      {/* Community Directory Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Member Admissions</CardTitle>
              <CardDescription>Verified community directory profiles</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/members" className="text-xs gap-1">
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockMembers.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center">
                    {member.fullName[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {member.fullName}
                    </p>
                    <p className="text-[11px] text-zinc-500">{member.email || "No email"}</p>
                  </div>
                </div>
                <StatusBadge status={member.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Active Events & RSVP Pipeline</CardTitle>
              <CardDescription>Attendee response tracking</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events" className="text-xs gap-1">
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[220px]">
                    {event.title}
                  </span>
                  <StatusBadge status={event.status} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{event.location.city}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {event.guestStats.attending} attending / {event.guestStats.totalInvited} invited
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 2. EVENT ORGANIZER DASHBOARD VIEW                                         */
/* ========================================================================= */
function EventOrganizerView({ onAction }: { onAction: (msg: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Assigned Events
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <CalendarDays className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">3</div>
            <p className="text-xs text-amber-600 mt-1 font-medium">2 gala & nuptial banquets</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Invitations Sent
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Send className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">385</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">94% delivery success</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Confirmed Guests
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">268</div>
            <p className="text-xs text-zinc-500 mt-1">42 meal selections chosen</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Media & Assets
            </CardTitle>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <ImageIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">24</div>
            <p className="text-xs text-zinc-500 mt-1">Blueprints & invitations</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Bar for Event Organizers */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Organizer Actions:
        </span>
        <Can action="event:create">
          <Button
            size="sm"
            onClick={() => onAction("Launch Event Creation Wizard")}
            className="gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Event
          </Button>
        </Can>
        <Can action="invitation:send">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction("Batch Send Invitations")}
            className="gap-1 text-xs"
          >
            <Send className="h-3.5 w-3.5 text-indigo-500" />
            Batch Send Invites
          </Button>
        </Can>
        <Can action="rsvp:export">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction("Export Guest List (CSV / PDF)")}
            className="gap-1 text-xs"
          >
            <Download className="h-3.5 w-3.5 text-emerald-500" />
            Export Guestlist
          </Button>
        </Can>
        <Can action="media:upload">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction("Open Media Uploader")}
            className="gap-1 text-xs"
          >
            <ImageIcon className="h-3.5 w-3.5 text-sky-500" />
            Upload Media
          </Button>
        </Can>
      </div>

      {/* Active Event Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Featured Upcoming Event</CardTitle>
          <CardDescription>Heritage Hills Centennial Summer Gala</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400">
                July 18, 2026 · 6:00 PM
              </span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Centennial Black-Tie Banquet & Charity Auction
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                The Grand Conservatory Hall, Belvedere
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" asChild>
                <Link href="/rsvps">Manage RSVPs</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================================= */
/* 3. FAMILY HEAD DASHBOARD VIEW                                             */
/* ========================================================================= */
function FamilyHeadView({ onAction }: { onAction: (msg: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Household Members
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Home className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">6 Members</div>
            <p className="text-xs text-zinc-500 mt-1">Thornton Dynasty Household</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Family Invitations
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <MailOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">2</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Both eligible for household</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Confirmed Attending
            </CardTitle>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">3 Attending</div>
            <p className="text-xs text-zinc-500 mt-1">David, Eleanor & Julian</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Dietary Requests
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <HeartHandshake className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">1 Note</div>
            <p className="text-xs text-amber-600 font-medium mt-1">Gluten-free registered</p>
          </CardContent>
        </Card>
      </div>

      {/* Household Overview & Quick RSVP Submission */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Thornton Household Members</CardTitle>
            <CardDescription>
              As Family Head, you can submit RSVPs and meal preferences on behalf of your family.
            </CardDescription>
          </div>
          <Can action="rsvp:manage_family">
            <Button
              size="sm"
              onClick={() => onAction("Updated Household RSVPs")}
              className="gap-1.5 text-xs"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Update Family RSVP
            </Button>
          </Can>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <div className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">David K. Thornton</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                  Head
                </span>
              </div>
              <span className="text-emerald-600 font-medium">Attending · Pan-seared Salmon</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Eleanor Thornton</span>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">Spouse</span>
              </div>
              <span className="text-emerald-600 font-medium">Attending · Gluten-Free</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Julian Thornton</span>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">Child</span>
              </div>
              <span className="text-emerald-600 font-medium">Attending · Chicken Tenders</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================================= */
/* 4. MEMBER DASHBOARD VIEW                                                  */
/* ========================================================================= */
function MemberView({ onAction }: { onAction: (msg: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Invitations Received
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <MailOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">2</div>
            <p className="text-xs text-indigo-600 font-medium mt-1">1 awaiting RSVP</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Events Attending
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CalendarDays className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">1</div>
            <p className="text-xs text-zinc-500 mt-1">Centennial Summer Gala</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Community Group
            </CardTitle>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">142</div>
            <p className="text-xs text-zinc-500 mt-1">Fellow members</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Gallery Photos
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <ImageIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">8 Shared</div>
            <p className="text-xs text-purple-600 font-medium mt-1">Spring Fest & Gala</p>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Awaiting Action */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Your Received Invitations</CardTitle>
          <CardDescription>Respond with your attendance and meal choice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockInvitations.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                    {inv.eventTitle}
                  </span>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="text-xs text-zinc-500 italic max-w-lg">&ldquo;{inv.customMessage}&rdquo;</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Can action="rsvp:submit">
                  <Button
                    size="sm"
                    onClick={() => onAction(`Accepted invitation for ${inv.eventTitle}`)}
                    className="text-xs"
                  >
                    Accept & RSVP
                  </Button>
                </Can>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================================= */
/* 5. SUPER ADMIN DASHBOARD VIEW                                             */
/* ========================================================================= */
function SuperAdminView({ onAction }: { onAction: (msg: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-zinc-500 uppercase">Communities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 Managed</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Multi-tenant active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-zinc-500 uppercase">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">230 Users</div>
            <p className="text-xs text-indigo-600 font-medium mt-1">Across all collectives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-zinc-500 uppercase">Security Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">100% Secure</div>
            <p className="text-xs text-zinc-500 mt-1">RBAC matrix enforced</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-zinc-500 uppercase">Platform Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Invita v1.0</div>
            <p className="text-xs text-zinc-500 mt-1">Next.js 16 + Turbopack</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/50 dark:border-purple-900/60 dark:bg-purple-950/30">
        <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider mb-2">
          Super Admin Global Controls
        </h4>
        <div className="flex gap-2">
          <Button size="sm" asChild>
            <Link href="/communities">Manage Communities</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/settings/system">Platform Governance</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 6. GUEST DASHBOARD VIEW                                                   */
/* ========================================================================= */
function GuestView({ onAction }: { onAction: (msg: string) => void }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Guest Portal</CardTitle>
          <CardDescription>You are browsing as an invited event guest.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            You can view details of events you have been invited to and submit RSVP responses.
          </p>
          <Button size="sm" asChild>
            <Link href="/events">Explore Events</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
