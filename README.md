
# FuelGuard
**Catches fleet fuel theft and leaks as they happen , not weeks later in a spreadsheet.**

**Live Demo:** Will Upload Soon
**Demo Video:** Will Upload Soon 
**Stack:** React 19 · TypeScript · Vite · Tailwind CSS · Recharts · Leaflet

---

## The Problem

Talk to anyone who manages a fleet of trucks and you'll hear the same story: fuel
just disappears. Theft, slow leaks, a driver running the engine for two hours in
a parking lot , managers usually only catch it at month-end when the accounting
doesn't add up. By then, the driver is on a different route, the footage is gone,
and you're just absorbing the loss.

We wanted to build something that flags the anomaly the moment it happens, so a
dispatcher can pick up the phone while the truck is still parked.

---

## What We Built

FuelGuard is a frontend proof-of-concept dashboard focused entirely on fuel
economy and tank levels , not generic GPS tracking. It monitors multiple vehicles
simultaneously and flags sudden fuel drops against engine state: if a tank drops
sharply while the truck is idling or parked, it raises an alert for potential
theft or a leak.

There's also a basic eco-score per driver, calculated from fuel burn rate vs.
distance traveled, so dispatchers can see patterns across their fleet over time.

**Important:** We didn't have access to physical truck hardware during the
hackathon, so the dashboard runs on simulated data streams we wrote to mimic real
IoT sensor payloads. The detection logic is real , the data feeding it isn't yet.

---

## Why We Picked These Tools

We went with **Recharts** over Chart.js because it's built as React components ,
so each chart re-renders properly when state changes without us manually
destroying and redrawing canvas elements. We'd been burned by that pattern before
and didn't want to fight it at 2am.

**Leaflet** was the obvious call for the map view. Mapbox would've been overkill
for what is essentially "show me where my trucks are" , and it would've required
an API key, which breaks our no-.env-needed setup goal.

We used React Context for state rather than pulling in Redux or Zustand. The data
flow is simple enough (simulated feed → dashboard → alert panel) that a full
state management library would've been more ceremony than it's worth.

---

## Where We Struggled

Getting Recharts to feel genuinely real-time took longer than expected. The
library re-renders the entire chart on every data tick by default, which caused
visible lag when we were pushing simulated updates every second across six
vehicles simultaneously. We ended up throttling the update frequency and memoizing
the dataset slices per vehicle so only the affected chart re-rendered. Small
change, but the dashboard went from feeling choppy to feeling live.

---

## What's Next

The frontend and detection logic are done. The next step is replacing the
simulation script with a real data source. We're looking at the Samsara API
first , they expose CAN bus data over REST which maps cleanly to what our
dashboard already expects. Geotab is an alternative but their SDK has more
overhead than we need for a read-only dashboard.

A small Node backend to handle auth and proxy the telematics feed is probably
a week of work at most.

---

## Run It Locally

No `.env` files, no API keys, no accounts needed , everything is client-side
with simulated data for now.

```bash
git clone https://github.com/Aneeeqa/FuelGuard.git
npm install
npm run dev
```

Built at Circuit Break Hackathon.
