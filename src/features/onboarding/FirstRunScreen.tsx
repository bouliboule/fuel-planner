import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { todayIn } from '../../app/dates.ts';
import { proteinOnGoalChange } from '../../engine/goalDefaults.ts';
import {
  completeFirstRun,
  db,
  getProfile,
  useLiveQuery,
} from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import type { Goal, Profile, WeekTemplate } from '../../model/index.ts';
import { Button } from '../../ui/form.tsx';
import { MedicalNotice } from '../../ui/Notice.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { GoalFields } from '../profile/GoalFields.tsx';
import { ProfileFields } from '../profile/ProfileFields.tsx';
import {
  draftFromGoal,
  draftFromSeed,
  goalFromDraft,
  profileFromDraft,
  seedProfileRest,
  type DraftErrors,
  type GoalErrors,
  type GoalDraft,
  type ProfileDraft,
} from '../profile/profileDraft.ts';
import { ImportBackup } from '../settings/ImportBackup.tsx';
import { WeekStep } from './WeekStep.tsx';

const TOTAL_STEPS = 4;

export function FirstRunScreen() {
  const existing = useLiveQuery(() => getProfile(db), []);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [restoring, setRestoring] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(draftFromSeed);
  const [profileErrors, setProfileErrors] = useState<
    DraftErrors<keyof ProfileDraft>
  >({});
  const [profile, setProfile] = useState<Profile | undefined>();
  const [goalDraft, setGoalDraft] = useState<GoalDraft>(() =>
    draftFromGoal(undefined),
  );
  const [goalErrors, setGoalErrors] = useState<GoalErrors>({});
  const [goal, setGoal] = useState<Goal | undefined>();
  const [template, setTemplate] = useState<WeekTemplate | undefined>();

  if (existing.loading) return null;
  if (existing.value && step === 1 && !restoring)
    return <Navigate to="/today" replace />;

  const date = todayIn(profile?.timeZone ?? profileDraft.timeZone);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-[env(safe-area-inset-top)] pb-12">
      <Screen title={t('firstRun.title')}>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {t('firstRun.intro')}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {t('firstRun.step', { step, total: TOTAL_STEPS })}
        </p>

        {step === 1 && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const result = profileFromDraft(profileDraft, seedProfileRest());
              if (result.ok) {
                setProfile(result.profile);
                setProfileErrors({});
                setStep(2);
              } else {
                setProfileErrors(result.errors);
              }
            }}
          >
            <h2 className="mt-6 text-lg font-semibold">{t('profile.title')}</h2>
            <ProfileFields
              draft={profileDraft}
              onChange={setProfileDraft}
              errors={profileErrors}
              editMass
            />
            {Object.keys(profileErrors).length > 0 && (
              <p
                role="alert"
                className="mt-4 text-sm text-red-600 dark:text-red-400"
              >
                {t('form.fixErrors')}
              </p>
            )}
            <div className="mt-6">
              <Button type="submit">{t('common.next')}</Button>
            </div>
            <div className="mt-8">
              <Button
                variant="secondary"
                onClick={() => {
                  setRestoring((r) => !r);
                }}
              >
                {t('firstRun.restore')}
              </Button>
              {restoring && (
                <ImportBackup
                  onImported={() => {
                    void navigate('/today', { replace: true });
                  }}
                />
              )}
            </div>
          </form>
        )}

        {step === 2 && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const result = goalFromDraft(goalDraft, date);
              if (result.ok) {
                setGoal(result.goal);
                setGoalErrors({});
                setStep(3);
              } else {
                setGoalErrors(result.errors);
              }
            }}
          >
            <h2 className="mt-6 text-lg font-semibold">{t('goal.title')}</h2>
            <GoalFields
              draft={goalDraft}
              onChange={setGoalDraft}
              errors={goalErrors}
              massKg={profile?.massKg}
            />
            <div className="mt-6 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep(1);
                }}
              >
                {t('common.back')}
              </Button>
              <Button type="submit">{t('common.next')}</Button>
            </div>
          </form>
        )}

        {step === 3 && profile && (
          <WeekStep
            profile={profile}
            onBack={() => {
              setStep(2);
            }}
            onDone={(next) => {
              setTemplate(next);
              setStep(4);
            }}
          />
        )}

        {step === 4 && profile && goal && (
          <>
            <MedicalNotice />
            <div className="mt-6 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep(3);
                }}
              >
                {t('common.back')}
              </Button>
              <Button
                onClick={() => {
                  // A lose goal starts from its protein default (D14).
                  const proteinGPerKg = proteinOnGoalChange(
                    profile.proteinGPerKg,
                    undefined,
                    goal.kind,
                  );
                  void completeFirstRun(db, {
                    profile: { ...profile, proteinGPerKg },
                    goal,
                    date,
                    ...(template ? { template } : {}),
                  }).then(() => navigate('/today', { replace: true }));
                }}
              >
                {t('firstRun.start')}
              </Button>
            </div>
          </>
        )}
      </Screen>
    </div>
  );
}
