import './DesignSystem.css';
import { useState } from 'react';
import { Sparkles, Lightbulb, Zap, Flame, Check, Layers, Type, Palette, MousePointer2, LayoutGrid, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PasswordField } from '@/components/ui/password-field';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { TagInput } from '@/components/ui/tag-input';
import { StatusSelect } from '@/components/ui/status-select';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Logo } from '@/components/Logo';
import { useToast } from '@/context/toast-context';

const COLORS = [
  { token: '--ds-color-bg', label: 'bg' },
  { token: '--ds-color-bg-elevated', label: 'bg-elevated' },
  { token: '--ds-color-surface', label: 'surface' },
  { token: '--ds-color-surface-strong', label: 'surface-strong' },
  { token: '--ds-color-text', label: 'text' },
  { token: '--ds-color-text-muted', label: 'text-muted' },
  { token: '--ds-color-text-soft', label: 'text-soft' },
  { token: '--ds-color-border', label: 'border' },
  { token: '--ds-color-border-strong', label: 'border-strong' },
  { token: '--ds-color-accent', label: 'accent' },
  { token: '--ds-color-accent-fg', label: 'accent-fg' },
  { token: '--ds-color-accent-soft', label: 'accent-soft' },
];

const GLOW_COLORS = [
  { token: '--ds-color-glow', label: 'glow' },
  { token: '--ds-color-glow-soft', label: 'glow-soft' },
  { token: '--ds-color-glow-medium', label: 'glow-medium' },
  { token: '--ds-color-glow-ring', label: 'glow-ring' },
  { token: '--ds-color-glow-shadow', label: 'glow-shadow' },
  { token: '--ds-color-glow-fg', label: 'glow-fg' },
];

const SEMANTIC_COLORS = [
  { token: '--ds-color-danger', label: 'danger' },
  { token: '--ds-color-danger-soft', label: 'danger-soft' },
  { token: '--ds-color-success', label: 'success' },
  { token: '--ds-color-success-soft', label: 'success-soft' },
];

const SPACING = [1, 2, 3, 4, 6, 8, 10, 12];

const TYPE_SCALE = [
  { token: '--ds-text-xs', label: 'xs', desc: '12px' },
  { token: '--ds-text-sm', label: 'sm', desc: '14px' },
  { token: '--ds-text-md', label: 'md', desc: '16px' },
  { token: '--ds-text-lg', label: 'lg', desc: '18px' },
  { token: '--ds-text-xl', label: 'xl', desc: '22px' },
  { token: '--ds-text-2xl', label: '2xl', desc: '32-48px' },
];

function Section({ num, title, icon: Icon, children, wide }) {
  return (
    <section className={`ds-section ${wide ? 'ds-section--wide' : ''}`}>
      <div className="ds-section-label">
        {Icon && <Icon className="ds-section-icon" />}
        <span className="ds-section-num">{String(num).padStart(2, '0')}</span>
        <h2 className="ds-section-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ColorSwatch({ token, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`var(${token})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="ds-swatch" title={`Copy var(${token})`}>
      <div className="ds-swatch-color" style={{ background: `var(${token})` }} />
      <span className="ds-swatch-label">{label}</span>
      {copied && <Check className="ds-swatch-check" />}
    </button>
  );
}

export default function DesignSystem() {
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tags, setTags] = useState(['design', 'ember']);
  const [status, setStatus] = useState('active');

  return (
    <div className="ds-showcase">
      <div className="ds-showcase-orbs" aria-hidden="true">
        <div className="ds-orb ds-orb--amber-1" />
        <div className="ds-orb ds-orb--indigo" />
        <div className="ds-orb ds-orb--amber-2" />
      </div>

      {/* ─── Hero ─────────────────────────────────────────── */}
      <header className="ds-hero">
        <div className="ds-hero-glow" aria-hidden="true" />
        <Logo className="text-xl ds-hero-logo" />
        <h1 className="ds-hero-title">
          <span className="ds-hero-ember">Ember</span>
          <br />
          <span className="ds-hero-sub">Design System</span>
        </h1>
        <p className="ds-hero-tagline">
          Warm light in a dark room.<br />One accent. No noise.
        </p>
        <div className="ds-hero-pills">
          <span className="tag-chip">Dark-first</span>
          <span className="tag-chip">Amber accent</span>
          <span className="tag-chip">Geist type</span>
          <span className="tag-chip">Glass surfaces</span>
        </div>
      </header>

      {/* ─── Philosophy ───────────────────────────────────── */}
      <div className="ds-philosophy">
        <div className="ds-philosophy-inner">
          {[
            { icon: Flame, title: 'One Chromatic Accent', body: 'Amber is the entire color budget. It appears only where attention belongs — active states, the spark CTA, focus rings.' },
            { icon: Lightbulb, title: 'Depth Through Value', body: 'Three background levels create hierarchy without shadows. Borders separate. Glass elevates. Flat by design.' },
            { icon: Zap, title: 'Nothing Decorative', body: 'Every pixel earns its place. No grain textures, no ornamental dividers, no ghost text. Purposeful only.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="ds-philosophy-card">
              <Icon className="ds-philosophy-icon" />
              <h3 className="ds-philosophy-title">{title}</h3>
              <p className="ds-philosophy-body">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="ds-main">
        {/* ─── 01 Color ─────────────────────────────────── */}
        <Section num={1} title="Color" icon={Palette}>
          <div className="ds-color-group">
            <h3 className="ds-subsection-label">Core</h3>
            <div className="ds-swatch-grid">{COLORS.map((c) => <ColorSwatch key={c.token} {...c} />)}</div>
          </div>
          <div className="ds-color-group">
            <h3 className="ds-subsection-label ds-subsection-label--glow">Amber Glow</h3>
            <div className="ds-swatch-grid">{GLOW_COLORS.map((c) => <ColorSwatch key={c.token} {...c} />)}</div>
          </div>
          <div className="ds-color-group">
            <h3 className="ds-subsection-label">Semantic</h3>
            <div className="ds-swatch-grid">{SEMANTIC_COLORS.map((c) => <ColorSwatch key={c.token} {...c} />)}</div>
          </div>
        </Section>

        {/* ─── 02 Typography ────────────────────────────── */}
        <Section num={2} title="Typography" icon={Type}>
          <div className="ds-type-card surface-card">
            <div className="ds-type-scale">
              {TYPE_SCALE.map(({ token, label, desc }) => (
                <div key={token} className="ds-type-row">
                  <span className="ds-type-label">{label}</span>
                  <span className="ds-type-sample" style={{ fontSize: `var(${token})` }}>
                    The quick brown fox
                  </span>
                  <span className="ds-type-desc">{desc}</span>
                </div>
              ))}
            </div>
            <div className="ds-type-weights">
              <h4 className="ds-subsection-label">Weights</h4>
              <div className="ds-type-weight-row">
                <span className="ds-type-weight-num">400</span>
                <span className="font-normal text-sm text-[var(--ds-color-text)]">Regular — body text, descriptions, secondary content</span>
              </div>
              <div className="ds-type-weight-row">
                <span className="ds-type-weight-num">500</span>
                <span className="font-medium text-sm text-[var(--ds-color-text)]">Medium — labels, nav items, interactive text</span>
              </div>
              <div className="ds-type-weight-row">
                <span className="ds-type-weight-num">600</span>
                <span className="font-semibold text-sm text-[var(--ds-color-text)]">Semibold — page headings, card titles</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── 03 Surfaces ──────────────────────────────── */}
        <Section num={3} title="Surfaces" icon={Layers} wide>
          <div className="ds-surface-stage">
            <div className="ds-surface-stage-bg" aria-hidden="true">
              <div className="ds-surface-orb ds-surface-orb--1" />
              <div className="ds-surface-orb ds-surface-orb--2" />
              <div className="ds-surface-orb ds-surface-orb--3" />
            </div>
            <div className="ds-surface-grid">
              <div className="surface-card ds-surface-item">
                <span className="ds-surface-name">.surface-card</span>
                <span className="ds-surface-desc">Solid background, hairline border, 8px radius. The default container.</span>
              </div>
              <div className="surface-panel ds-surface-item">
                <span className="ds-surface-name">.surface-panel</span>
                <span className="ds-surface-desc">Same treatment, 12px radius. Used for auth pages and larger shells.</span>
              </div>
              <div className="surface-glass ds-surface-item">
                <span className="ds-surface-name">.surface-glass</span>
                <span className="ds-surface-desc">Frosted glass with backdrop blur. Sits over the ambient gradient.</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── 04 Components ────────────────────────────── */}
        <Section num={4} title="Components" icon={LayoutGrid} wide>
          <div className="ds-components-grid">
            {/* Buttons column */}
            <div className="ds-component-block">
              <h3 className="ds-subsection-label">Buttons</h3>
              <div className="surface-card p-5 space-y-5">
                <div className="ds-component-row">
                  <span className="ds-component-row-label">Variants</span>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="default">Default</Button>
                    <Button variant="spark">Spark</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="ghost-danger">Danger</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>
                <div className="ds-component-row">
                  <span className="ds-component-row-label">Sizes</span>
                  <div className="flex flex-wrap items-end gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon"><Sparkles className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="ds-component-row">
                  <span className="ds-component-row-label">States</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button disabled>Disabled</Button>
                    <Button><Loader /> Saving</Button>
                    <Button variant="spark"><Loader /> Creating</Button>
                  </div>
                </div>
                <div className="ds-component-row">
                  <span className="ds-component-row-label">Pairs</span>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button variant="ghost">Cancel</Button>
                      <Button>Save changes</Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost">Cancel</Button>
                      <Button variant="destructive">Delete account</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs column */}
            <div className="ds-component-block">
              <h3 className="ds-subsection-label">Inputs</h3>
              <div className="surface-card p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--ds-color-text-muted)]">Text</label>
                  <Input placeholder="Type something..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--ds-color-text-muted)]">Password</label>
                  <PasswordField placeholder="Enter password..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--ds-color-text-muted)]">Textarea</label>
                  <Textarea placeholder="Describe your idea..." className="min-h-[72px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--ds-color-text-muted)]">Tags</label>
                  <TagInput value={tags} onChange={setTags} placeholder="Add a tag..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--ds-color-text-muted)]">Status</label>
                  <StatusSelect value={status} onChange={setStatus} />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── 05 Cards ─────────────────────────────────── */}
        <Section num={5} title="Cards & Data" icon={Box}>
          <div className="ds-cards-grid">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Surface card with consistent padding and hierarchy.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--ds-color-text)]">Content aligns with the header. Footer actions sit at the bottom.</p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="ghost">Cancel</Button>
                <Button>Save</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Ember Design System</CardTitle>
                <CardDescription>Build a showcase for planMe's visual language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <span className="tag-chip">design</span>
                  <span className="tag-chip">ui</span>
                  <span className="tag-chip">ember</span>
                </div>
                <div className="flex gap-4">
                  <div className="status-badge" data-status="active">
                    <span className="status-badge-dot bg-[var(--ds-color-success)]" />
                    Active
                  </div>
                  <div className="status-badge" data-status="archived">
                    <span className="status-badge-dot" />
                    Archived
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ─── 06 Interactions ──────────────────────────── */}
        <Section num={6} title="Interactions" icon={MousePointer2} wide>
          <div className="ds-interactions-grid">
            {/* Feedback */}
            <div className="ds-component-block">
              <h3 className="ds-subsection-label">Feedback</h3>
              <div className="space-y-3">
                <div className="feedback-error p-3 text-sm">Something went wrong. Please try again.</div>
                <div className="feedback-success p-3 text-sm">Your changes have been saved.</div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast('Idea saved', 'success')}>Toast: Success</Button>
                  <Button variant="outline" size="sm" onClick={() => toast('Something went wrong', 'error')}>Toast: Error</Button>
                </div>
              </div>
            </div>

            {/* Dialog + Loader */}
            <div className="ds-component-block">
              <h3 className="ds-subsection-label">Dialog & Loader</h3>
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setDialogOpen(true)}>Open dialog</Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent>
                    <DialogTitle>Delete this idea?</DialogTitle>
                    <DialogDescription>This action cannot be undone. The idea will be permanently removed.</DialogDescription>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={() => setDialogOpen(false)}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="surface-card p-4">
                  <div className="flex flex-wrap items-center gap-5">
                    <div className="flex items-center gap-2 text-[var(--ds-color-text)]"><Loader /> <span className="text-xs">Default</span></div>
                    <div className="flex items-center gap-2 text-[var(--ds-color-glow)]"><Loader /> <span className="text-xs">Amber</span></div>
                    <div className="flex items-center gap-2 text-[var(--ds-color-text-muted)]"><Loader /> <span className="text-xs">Muted</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Motion */}
            <div className="ds-component-block">
              <h3 className="ds-subsection-label">Motion</h3>
              <div className="ds-motion-grid">
                <MotionDemo name="ds-fade-up" label="Page entrance" />
                <MotionDemo name="ds-fade-in" label="Overlay fade" />
                <MotionDemo name="ds-modal-enter" label="Modal enter" />
                <div className="ds-motion-cell">
                  <span className="ds-motion-label">Loader</span>
                  <div className="ds-motion-preview"><Loader /></div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── 07 Primitives ────────────────────────────── */}
        <Section num={7} title="Primitives">
          <div className="ds-primitives-row">
            {/* Radius */}
            <div className="ds-primitive-group">
              <h4 className="ds-subsection-label">Radius</h4>
              <div className="ds-radius-row">
                {[
                  { token: 'sm', label: '6px' },
                  { token: 'md', label: '8px' },
                  { token: 'lg', label: '12px' },
                  { token: 'pill', label: 'pill' },
                ].map(({ token, label }) => (
                  <div key={token} className="ds-radius-item">
                    <div className="ds-radius-box" style={{ borderRadius: `var(--ds-radius-${token})` }} />
                    <span className="ds-primitive-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shadows */}
            <div className="ds-primitive-group">
              <h4 className="ds-subsection-label">Shadows</h4>
              <div className="ds-shadow-row">
                {[
                  { token: '--ds-shadow-sm', label: 'sm' },
                  { token: '--ds-shadow-md', label: 'md' },
                  { token: '--ds-shadow-lg', label: 'lg' },
                  { token: '--ds-shadow-focus', label: 'focus' },
                ].map(({ token, label }) => (
                  <div key={token} className="ds-shadow-item">
                    <div className="ds-shadow-box" style={{ boxShadow: `var(${token})` }} />
                    <span className="ds-primitive-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div className="ds-primitive-group ds-primitive-group--spacing">
              <h4 className="ds-subsection-label">Spacing</h4>
              <div className="ds-spacing-list">
                {SPACING.map((n) => (
                  <div key={n} className="ds-spacing-row">
                    <span className="ds-spacing-label">{n}</span>
                    <div className="ds-spacing-bar" style={{ width: `var(--ds-space-${n})` }} />
                    <span className="ds-spacing-value">{n * 4}px</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Logo ────────────────────────────────────── */}
        <div className="ds-logo-strip">
          <Logo className="text-xs" />
          <Logo className="text-sm" />
          <Logo className="text-lg" />
          <Logo className="text-2xl" />
        </div>
      </main>

      <footer className="ds-footer">
        <Logo className="text-sm mb-2" />
        <p className="text-xs text-[var(--ds-color-text-soft)]">
          Ember Design System v1.0 — built for planMe
        </p>
      </footer>
    </div>
  );
}

function MotionDemo({ name, label }) {
  const [key, setKey] = useState(0);
  return (
    <div className="ds-motion-cell" onClick={() => setKey((k) => k + 1)}>
      <span className="ds-motion-label">{label}</span>
      <div className="ds-motion-preview">
        <div key={key} className="ds-motion-block" style={{ animation: `${name} 0.4s ease-out both` }} />
      </div>
      <span className="ds-motion-replay">click to replay</span>
    </div>
  );
}
