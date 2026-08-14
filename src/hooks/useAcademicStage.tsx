import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { writeAppSide, clearAppSide } from "@/hooks/useAppSide";
import { isCampusStage, type AcademicStage } from "@/lib/academicStages";

const STAGE_CACHE_KEY = "edura_academic_stage";

export type CampusProfile = {
  academic_stage: AcademicStage | null;
  previous_stage: string | null;
  institution_id: string | null;
  institution_name: string | null;
  faculty: string | null;
  department: string | null;
  study_level: string | null;
  matric_number: string | null;
};

const EMPTY: CampusProfile = {
  academic_stage: null,
  previous_stage: null,
  institution_id: null,
  institution_name: null,
  faculty: null,
  department: null,
  study_level: null,
  matric_number: null,
};

export const readCachedStage = (): string | null => {
  try {
    return localStorage.getItem(STAGE_CACHE_KEY);
  } catch {
    return null;
  }
};

/**
 * The student's academic journey stage. One account, several journey dashboards:
 * secondary / exam candidates use the core dashboard, undergraduates and
 * graduates use Edura Campus.
 */
export const useAcademicStage = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CampusProfile>(() => ({
    ...EMPTY,
    academic_stage: (readCachedStage() as AcademicStage) ?? null,
  }));
  const [loading, setLoading] = useState(true);
  // True only once we have actually read the profile row for a signed-in user.
  const [resolved, setResolved] = useState(false);

  const load = useCallback(async () => {
    // Wait for auth to finish restoring: a null user during restore must not be
    // mistaken for "this student has no journey yet".
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setProfile(EMPTY);
      setResolved(false);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("users")
      .select(
        "academic_stage, previous_stage, institution_id, institution_name, faculty, department, study_level, matric_number"
      )
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as CampusProfile);
      setResolved(true);
      try {
        if (data.academic_stage) localStorage.setItem(STAGE_CACHE_KEY, data.academic_stage);
      } catch {
        /* ignore */
      }
    } else if (error) {
      // Network/RLS hiccup — keep whatever we know and don't force onboarding.
      setResolved(false);
    } else {
      setResolved(true);
    }
    setLoading(false);
  }, [user, authLoading]);


  useEffect(() => {
    load();
  }, [load]);

  const updateProfile = useCallback(
    async (patch: Partial<CampusProfile>) => {
      if (!userProfile?.id && !user?.id) {
        return { error: new Error("Your profile is still loading. Please try again in a moment.") };
      }
      const payload: Record<string, unknown> = { ...patch };
      if (patch.academic_stage && profile.academic_stage && patch.academic_stage !== profile.academic_stage) {
        payload.previous_stage = profile.academic_stage;
      }
      const query = supabase.from("users").update(payload);
      const { error } = userProfile?.id
        ? await query.eq("id", userProfile.id)
        : await query.eq("auth_user_id", user!.id);

      if (!error) {
        setProfile((prev) => ({ ...prev, ...(payload as Partial<CampusProfile>) }));
        if (patch.academic_stage) {
          try {
            localStorage.setItem(STAGE_CACHE_KEY, patch.academic_stage);
          } catch {
            /* ignore */
          }
          if (isCampusStage(patch.academic_stage)) {
            clearAppSide();
          } else {
            writeAppSide("cbt");
          }
        }
      }
      return { error };
    },
    [userProfile?.id, user?.id, profile.academic_stage]
  );

  return {
    ...profile,
    stage: profile.academic_stage,
    isCampus: isCampusStage(profile.academic_stage),
    loading: loading || authLoading,
    /** Only true once the profile row has really been read for this user. */
    resolved,
    reload: load,
    updateProfile,

  };
};
