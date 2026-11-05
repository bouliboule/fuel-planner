/**
 * Brings the first invalid field of `form` into view and focuses it, so an
 * error above the fold of a scrolled sheet or page is not missed on a phone.
 * Call after the render that sets `aria-invalid`.
 */
export function revealFirstInvalid(form: HTMLFormElement | null) {
  const field = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!field) return;
  field.scrollIntoView({ block: 'center' });
  field.focus({ preventScroll: true });
}
