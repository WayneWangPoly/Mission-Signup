import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, CalendarDays, CarFront, MapPinned, UserRound } from 'lucide-react';

type City = 'Adelaide' | 'Melbourne' | 'Brisbane';
type Availability = 'unavailable' | 'available' | 'preferred';
type MapPoint = { x: number; y: number };

type SignupPayload = {
  deliveryDate: string;
  city: City;
  driverId: string;
  availability: Availability;
  maxLoad: number;
  vehicleTypes: string[];
  area: {
    point: MapPoint;
    coreRadius: number;
    extendRadius: number;
  };
  mapImage: string;
  adminNotice: string;
  notes: string;
};

const logoSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAIAAABEtEjdAAAgD0lEQVR4AezUAQaEQAAAwP4eEYgAIoAIIHpBpI8EQEdbWXd738iaecQUKTsAyB1A7gDIHQC5AyB3AOSeAwC5A8gdALkDIHcA5A6A3AGQO4DcAZA7AHIHQO4AyB1A7gDIHQC5AyB3AOQOgNwB5A6A3AGQOwByB0DuAMgdQO4AyB0AuQMgdwDkDoDcAeQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsAcgdA7gDIHQC5AyB3AOQOgNwBkDsA8g8AAP//AgBq6Mjw5EIs3QAAAABJRU5ErkJggg==';

const cityList: City[] = ['Adelaide', 'Melbourne', 'Brisbane'];
const vehicleOptions = ['Sedan', 'Hatchback', 'SUV', 'Van', 'Ute', 'Other'];
const DEFAULT_CITY: City = 'Melbourne';
const DEFAULT_MAX_LOAD = 200;
const DEFAULT_CORE_RADIUS = 18;
const DEFAULT_EXTEND_RADIUS = 34;
const MIN_CORE_RADIUS = 8;
const GAP_RADIUS = 10;
const DEFAULT_NOTICE = 'Please check the reward colors carefully before choosing your area.';
const DEFAULT_MAP_IMAGE = '/melbourne-task-base-map.png';

function getDefaultTargetDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function getQueryParams() {
  if (typeof window === 'undefined') {
    return {
      deliveryDate: '',
      city: '',
      mapImage: '',
      notice: '',
    };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    deliveryDate: params.get('deliveryDate') ?? '',
    city: params.get('city') ?? '',
    mapImage: params.get('mapImage') ?? '',
    notice: params.get('notice') ?? '',
  };
}

function getTargetDateFromQuery(raw: string): Date {
  if (!raw) return getDefaultTargetDate();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? getDefaultTargetDate() : parsed;
}

function formatBannerDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).toUpperCase();
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sanitizeLoad(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MAX_LOAD;
  return Math.max(0, Math.round(value));
}

function sanitizeCoreRadius(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CORE_RADIUS;
  return Math.max(MIN_CORE_RADIUS, Math.round(value));
}

function sanitizeExtendRadius(value: number, coreRadius: number): number {
  if (!Number.isFinite(value)) return Math.max(DEFAULT_EXTEND_RADIUS, coreRadius + GAP_RADIUS);
  return Math.max(coreRadius + GAP_RADIUS, Math.round(value));
}

function sanitizePoint(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, value));
}

function normalizeCity(value: string): City {
  return cityList.includes(value as City) ? (value as City) : DEFAULT_CITY;
}

function normalizeImage(value: string): string {
  return value.trim() || DEFAULT_MAP_IMAGE;
}

function normalizeNotice(value: string): string {
  return value.trim() || DEFAULT_NOTICE;
}

const sanityChecks = [
  sanitizeLoad(200) === 200,
  sanitizeLoad(Number.NaN) === DEFAULT_MAX_LOAD,
  sanitizeCoreRadius(10) === MIN_CORE_RADIUS,
  sanitizeExtendRadius(40, 60) === 80,
  sanitizePoint(120) === 100,
  sanitizePoint(-5) === 0,
  normalizeCity('Melbourne') === 'Melbourne',
  normalizeCity('Sydney') === DEFAULT_CITY,
].every(Boolean);

function NoticeTicker({ text }: { text: string }) {
  const content = `${text}   •   ${text}   •   ${text}`;
  return (
    <div className="mx-4 mb-4 overflow-hidden rounded-2xl border border-amber-200 bg-amber-300/90 shadow-sm">
      <div className="whitespace-nowrap py-2 text-sm font-semibold text-slate-900 animate-[marquee_18s_linear_infinite] [@keyframes_marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}]">
        {content}
      </div>
    </div>
  );
}

function StaticMapSelector({
  imageUrl,
  point,
  setPoint,
  coreRadius,
  setCoreRadius,
  extendRadius,
  setExtendRadius,
}: {
  imageUrl: string;
  point: MapPoint;
  setPoint: (value: MapPoint) => void;
  coreRadius: number;
  setCoreRadius: (value: number) => void;
  extendRadius: number;
  setExtendRadius: (value: number) => void;
}) {
  const mapRef = useRef<HTMLButtonElement | null>(null);
  const [mapSize, setMapSize] = useState({ width: 320, height: 240 });

  useEffect(() => {
    const updateSize = () => {
      if (!mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setMapSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const timer = window.setTimeout(updateSize, 120);
    window.addEventListener('resize', updateSize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const cx = (mapSize.width * point.x) / 100;
  const cy = (mapSize.height * point.y) / 100;
  const base = Math.max(240, Math.min(mapSize.width, mapSize.height));
  const corePx = (base * coreRadius) / 100 / 2;
  const extendPx = (base * extendRadius) / 100 / 2;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border bg-white">
        <div className="px-3 py-2 text-xs text-slate-600">Tap the latest reward map to choose your area.</div>
        <button
          type="button"
          ref={mapRef}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = sanitizePoint(((e.clientX - rect.left) / rect.width) * 100);
            const y = sanitizePoint(((e.clientY - rect.top) / rect.height) * 100);
            setPoint({ x, y });
          }}
          className="relative block w-full bg-slate-100"
        >
          <img
            src={imageUrl}
            alt="Latest reward map"
            className="block h-auto w-full"
            onLoad={() => {
              if (!mapRef.current) return;
              const rect = mapRef.current.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setMapSize({ width: rect.width, height: rect.height });
              }
            }}
          />

          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${mapSize.width} ${mapSize.height}`} preserveAspectRatio="none">
            <circle
              cx={cx}
              cy={cy}
              r={extendPx}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="3"
              strokeDasharray="10 8"
            />
            <circle
              cx={cx}
              cy={cy}
              r={corePx}
              fill="none"
              stroke="#0f172a"
              strokeWidth="4"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-white p-3">
          <div className="mb-2 text-sm font-medium text-slate-800">Preferred area size</div>
          <input
            type="range"
            value={coreRadius}
            min={MIN_CORE_RADIUS}
            max={32}
            step={1}
            onChange={(e) => {
              const nextCore = sanitizeCoreRadius(Number(e.target.value));
              setCoreRadius(nextCore);
              setExtendRadius(sanitizeExtendRadius(extendRadius, nextCore));
            }}
            className="w-full accent-slate-900"
          />
          <div className="mt-2 text-xs text-slate-500">Solid circle</div>
        </div>
        <div className="rounded-2xl border bg-white p-3">
          <div className="mb-2 text-sm font-medium text-slate-800">Extended area size</div>
          <input
            type="range"
            value={extendRadius}
            min={coreRadius + GAP_RADIUS}
            max={52}
            step={1}
            onChange={(e) => setExtendRadius(sanitizeExtendRadius(Number(e.target.value), coreRadius))}
            className="w-full accent-slate-700"
          />
          <div className="mt-2 text-xs text-slate-500">Dashed circle</div>
        </div>
      </div>
    </div>
  );
}

export default function DriverPoolSignupPortal() {
  const query = useMemo(() => getQueryParams(), []);
  const targetDate = useMemo(() => getTargetDateFromQuery(query.deliveryDate), [query.deliveryDate]);
  const targetDateText = useMemo(() => formatBannerDate(targetDate), [targetDate]);
  const deliveryDateIso = useMemo(() => formatIsoDate(targetDate), [targetDate]);
  const defaultCity = useMemo(() => normalizeCity(query.city), [query.city]);
  const mapImage = useMemo(() => normalizeImage(query.mapImage), [query.mapImage]);
  const adminNotice = useMemo(() => normalizeNotice(decodeURIComponent(query.notice || '')), [query.notice]);

  const [city, setCity] = useState<City>(defaultCity);
  const [driverId, setDriverId] = useState('');
  const [availability, setAvailability] = useState<Availability>('available');
  const [maxLoad, setMaxLoad] = useState<number>(DEFAULT_MAX_LOAD);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(['Van']);
  const [point, setPoint] = useState<MapPoint>({ x: 50, y: 50 });
  const [coreRadius, setCoreRadius] = useState<number>(DEFAULT_CORE_RADIUS);
  const [extendRadius, setExtendRadius] = useState<number>(DEFAULT_EXTEND_RADIUS);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const payload: SignupPayload = {
    deliveryDate: deliveryDateIso,
    city,
    driverId,
    availability,
    maxLoad,
    vehicleTypes,
    area: {
      point,
      coreRadius,
      extendRadius,
    },
    mapImage,
    adminNotice,
    notes,
  };

  const toggleVehicle = (type: string) => {
    setVehicleTypes((prev) => {
      if (prev.includes(type)) {
        const next = prev.filter((v) => v !== type);
        return next.length > 0 ? next : prev;
      }
      return [...prev, type];
    });
  };

  const resetForm = () => {
    setCity(defaultCity);
    setDriverId('');
    setAvailability('available');
    setMaxLoad(DEFAULT_MAX_LOAD);
    setVehicleTypes(['Van']);
    setPoint({ x: 50, y: 50 });
    setCoreRadius(DEFAULT_CORE_RADIUS);
    setExtendRadius(DEFAULT_EXTEND_RADIUS);
    setNotes('');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-2xl font-bold text-slate-900">Signup Submitted</div>
          <div className="mt-3 text-slate-600">Your availability for the delivery mission has been recorded.</div>
          <div className="mt-6 text-sm text-slate-500">You may close this page. Dispatch will confirm assignments later.</div>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-8 w-full h-12 rounded-2xl bg-slate-900 text-white font-semibold"
          >
            Submit another response
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 py-4">
      <div className="mx-auto w-full max-w-md px-3">
        <Card className="overflow-hidden rounded-[28px] border-0 shadow-xl">
          <div className="bg-white px-5 pb-4 pt-5">
            <div className="flex flex-col items-center text-center">
              <img src={logoSrc} alt="MicroExpress" className="mb-3 h-16 w-auto" />
              <div className="text-xl font-semibold tracking-tight text-slate-900">Driver Signup</div>
            </div>
          </div>

          <div className="mx-4 mb-3 rounded-3xl border-2 border-red-200 bg-red-600 px-4 py-4 text-center text-white shadow-sm">
            <div className="text-xs font-bold tracking-[0.18em]">DELIVERY DATE</div>
            <div className="mt-1 text-2xl font-extrabold leading-tight">{targetDateText}</div>
            <div className="mt-2 rounded-2xl bg-white/15 px-3 py-2 text-sm font-semibold">This form is for the date above.</div>
          </div>

          <NoticeTicker text={adminNotice} />

          <CardContent className="space-y-5 p-4 sm:p-5">
            {!sanityChecks && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                Validation helpers failed to initialize.
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-800">City</Label>
              <div className="grid grid-cols-3 gap-2">
                {cityList.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCity(item)}
                    className={`h-12 rounded-2xl border px-2 text-sm font-medium transition ${city === item ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <UserRound className="h-4 w-4" /> Driver ID
              </Label>
              <Input
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="e.g. 1011"
                className="h-12 rounded-2xl text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <CalendarDays className="h-4 w-4" /> Availability
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAvailability('unavailable')}
                  className={`h-12 rounded-2xl border px-2 text-sm font-medium transition ${availability === 'unavailable' ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                >
                  Unavailable
                </button>
                <button
                  type="button"
                  onClick={() => setAvailability('available')}
                  className={`h-12 rounded-2xl border px-2 text-sm font-medium transition ${availability === 'available' ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => setAvailability('preferred')}
                  className={`h-12 rounded-2xl border px-2 text-sm font-medium transition ${availability === 'preferred' ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                >
                  Priority Me!
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-800">Max load</Label>
              <Input
                type="number"
                value={maxLoad}
                onChange={(e) => setMaxLoad(sanitizeLoad(Number(e.target.value)))}
                placeholder="200"
                className="h-12 rounded-2xl text-base"
              />
              <div className="text-xs text-slate-500">Experienced drivers can usually handle up to around 250 stops per day.</div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <CarFront className="h-4 w-4" /> Vehicle type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {vehicleOptions.map((type) => {
                  const active = vehicleTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleVehicle(type)}
                      className={`h-10 rounded-xl border px-2 text-xs font-medium transition ${active ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <MapPinned className="h-4 w-4" /> Delivery area
              </Label>
              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">Solid circle = preferred area. Dashed circle = extended area.</div>
            </div>

            <StaticMapSelector
              imageUrl={mapImage}
              point={point}
              setPoint={setPoint}
              coreRadius={coreRadius}
              setCoreRadius={setCoreRadius}
              extendRadius={extendRadius}
              setExtendRadius={setExtendRadius}
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-800">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any note here"
                className="min-h-24 rounded-2xl text-base"
              />
            </div>

            <div className="space-y-2 pt-1">
              <Button className="h-12 w-full rounded-2xl text-base font-medium" onClick={() => setSubmitted(true)}>
                Submit
              </Button>
              <Button variant="outline" className="h-12 w-full rounded-2xl text-base" onClick={resetForm}>
                Reset
              </Button>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">Final job allocation is based on overall operations.</div>

            {submitted && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-800">Submitted</div>
                    <div className="mt-1 text-sm text-emerald-700">Your signup has been recorded.</div>
                  </div>
                </div>
              </div>
            )}

            <details className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium">Preview payload</summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(payload, null, 2)}</pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
